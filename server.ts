import express from "express";
import path from "path";
import fs from "fs/promises";
import fsSync from "fs";
import { execSync } from "child_process";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));

const LATEX_DIR = path.join(process.cwd(), "public", "latex");
const DATA_DIR = path.join(LATEX_DIR, "domains");
const PHOTOS_DIR = path.join(process.cwd(), "public", "photos");

// Helper to ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    
    // Seed some initial structure if empty
    const dirs = await fs.readdir(DATA_DIR);
    if (dirs.length === 0) {
      const initialStructure = [
        "banks/retail/BNP",
        "consulting/big4/Deloitte",
        "consulting/big4/EY",
        "consulting/big4/KPMG",
        "consulting/specialized/Wavestone",
        "generic"
      ];
      
      for (const dir of initialStructure) {
        await fs.mkdir(path.join(DATA_DIR, dir), { recursive: true });
      }
    }
  } catch (err) {
    console.error("Error setting up data dir:", err);
  }
}

// Recursively get structure
async function getDirectoryStructure(dirPath: string, basePath = "") {
  const result: any = { type: "dir", name: path.basename(dirPath), path: basePath, children: [] };
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    const relativePath = path.join(basePath, entry.name);
    
    if (entry.isDirectory()) {
      result.children.push(await getDirectoryStructure(fullPath, relativePath));
    } else if (entry.isFile() && entry.name.endsWith('.tex')) {
      result.children.push({ type: "file", name: entry.name, path: relativePath });
    }
  }
  return result;
}

// Calculate hash of all files in public/latex to detect changes
async function getLatexFilesVersion(dir = LATEX_DIR): Promise<string> {
  const hash = crypto.createHash("md5");
  async function walk(currentDir: string) {
    try {
      const entries = await fs.readdir(currentDir, { withFileTypes: true });
      for (const entry of entries) {
        const full = path.join(currentDir, entry.name);
        if (entry.isDirectory()) {
          await walk(full);
        } else if (entry.isFile()) {
          const stat = await fs.stat(full);
          hash.update(`${full}:${stat.mtimeMs}:${stat.size}`);
        }
      }
    } catch (e) {
      // ignore
    }
  }
  await walk(dir);
  return hash.digest("hex");
}

// API Routes
app.get("/api/structure", async (req, res) => {
  try {
    const structure = await getDirectoryStructure(DATA_DIR);
    res.json(structure);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint for live change detection
app.get("/api/latex-version", async (req, res) => {
  try {
    const version = await getLatexFilesVersion();
    res.json({ version });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create/Update directory or file
app.post("/api/update", async (req, res) => {
  const { path: relativePath, type, content } = req.body;
  if (!relativePath) return res.status(400).json({ error: "Path is required" });
  
  const targetPath = path.join(DATA_DIR, relativePath);
  
  try {
    if (type === "dir") {
      await fs.mkdir(targetPath, { recursive: true });
    } else if (type === "file") {
      await fs.writeFile(targetPath, content || "");
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/file", async (req, res) => {
  const { path: relativePath } = req.query;
  if (!relativePath || typeof relativePath !== 'string') return res.status(400).json({ error: "Path required" });
  
  try {
    const content = await fs.readFile(path.join(DATA_DIR, relativePath), 'utf-8');
    res.json({ content });
  } catch (err: any) {
    res.status(404).json({ error: "File not found" });
  }
});

// Compile endpoint using multipart tarball POST to avoid 414 Request-URI Too Large
app.post("/api/compile", async (req, res) => {
  let { latexContent, selectedPaths, overrides } = req.body;
  
  const tmpId = Date.now() + "_" + Math.random().toString(36).slice(2, 8);
  const tmpDir = path.join("/tmp", `tex_build_${tmpId}`);
  const tarPath = path.join("/tmp", `tex_bundle_${tmpId}.tar.gz`);

  try {
    await fs.mkdir(tmpDir, { recursive: true });
    
    // Copy photo if available
    const tmpPhotosDir = path.join(tmpDir, "photos");
    await fs.mkdir(tmpPhotosDir, { recursive: true });
    const photoPath = path.join(PHOTOS_DIR, "photo.jpg");
    if (fsSync.existsSync(photoPath)) {
      await fs.copyFile(photoPath, path.join(tmpPhotosDir, "photo.jpg"));
    }

    let fullDocument = latexContent || "";

    // If only variables or selected paths are sent, assemble with master template
    if (!fullDocument.includes("\\documentclass")) {
      let masterTemplate = "";
      let globalCommon = "";
      
      try {
        masterTemplate = await fs.readFile(path.join(LATEX_DIR, "Abderrahmene_KABAR_cv.tex"), "utf-8");
      } catch (e) {
        masterTemplate = "\\documentclass{article}\\begin{document}Master template missing\\end{document}";
      }

      try {
        globalCommon = await fs.readFile(path.join(LATEX_DIR, "common.tex"), "utf-8");
      } catch (e) {
        globalCommon = "";
      }

      // Collect hierarchical domain variables
      const loadedPaths = new Set<string>();
      const orderedVariableContents: string[] = [];

      if (Array.isArray(selectedPaths) && selectedPaths.length > 0) {
        for (const sp of selectedPaths) {
          const segments = sp.split("/");
          // Build ancestor common.tex paths
          let currentSub = "";
          for (let i = 0; i < segments.length - 1; i++) {
            currentSub = currentSub ? `${currentSub}/${segments[i]}` : segments[i];
            const ancestorCommon = `${currentSub}/common.tex`;
            if (!loadedPaths.has(ancestorCommon)) {
              loadedPaths.add(ancestorCommon);
              if (overrides && overrides[ancestorCommon] !== undefined) {
                orderedVariableContents.push(overrides[ancestorCommon]);
              } else {
                try {
                  const commonContent = await fs.readFile(path.join(DATA_DIR, ancestorCommon), "utf-8");
                  orderedVariableContents.push(commonContent);
                } catch (e) {
                  // Optional file
                }
              }
            }
          }

          // Add the target file itself
          if (!loadedPaths.has(sp)) {
            loadedPaths.add(sp);
            if (overrides && overrides[sp] !== undefined) {
              orderedVariableContents.push(overrides[sp]);
            } else {
              try {
                const fileContent = await fs.readFile(path.join(DATA_DIR, sp), "utf-8");
                orderedVariableContents.push(fileContent);
              } catch (e) {
                console.warn("Could not read selected path:", sp);
              }
            }
          }
        }
      }

      let domainVariables = orderedVariableContents.join("\n\n") || (latexContent || "");

      // Helper to safely allow variable overrides without "Command already defined" error
      const sanitizeOverrides = (tex: string) => {
        return tex
          .replace(/\\IfFileExists\{[^}]+\}\{[^}]*\}\{[^}]*\}/g, "")
          .replace(/\\input\{[^}]+\}/g, "")
          .replace(/\\newcommand\{(\\?[a-zA-Z0-9]+)\}/g, "\\def$1");
      };

      const cleanMaster = masterTemplate
        .replace(/\\IfFileExists\{[^}]+\}\{[^}]*\}\{[^}]*\}/g, "")
        .replace(/\\input\{[^}]+\}/g, "");
      const cleanGlobal = sanitizeOverrides(globalCommon);
      const cleanCustom = sanitizeOverrides(domainVariables);

      const insertMarker = "\\begin{document}";
      if (cleanMaster.includes(insertMarker)) {
        const splitParts = cleanMaster.split(insertMarker);
        fullDocument = `${splitParts[0]}\n\n% --- GLOBAL VARIABLES ---\n${cleanGlobal}\n\n% --- TARGETED VARIABLES ---\n${cleanCustom}\n\n\\begin{document}${splitParts[1]}`;
      } else {
        fullDocument = `${cleanGlobal}\n\n${cleanCustom}\n\n${cleanMaster}`;
      }
    } else {
      fullDocument = fullDocument.replace(/\\input\{[^}]+\}/g, "% [input resolved]");
    }

    // Write main.tex
    await fs.writeFile(path.join(tmpDir, "main.tex"), fullDocument);

    // Create tarball
    execSync(`tar -czf "${tarPath}" -C "${tmpDir}" .`);

    const tarBuffer = await fs.readFile(tarPath);
    const formData = new FormData();
    formData.append("file", new Blob([tarBuffer], { type: "application/x-tar" }), "bundle.tar.gz");

    const compileRes = await fetch("https://latexonline.cc/data?target=main.tex", {
      method: "POST",
      body: formData
    });

    const arrayBuffer = await compileRes.arrayBuffer();

    if (!compileRes.ok || (compileRes.headers.get("content-type") || "").includes("text")) {
      const errorText = Buffer.from(arrayBuffer).toString("utf-8");
      // Clean error text from HTML or raw TeX logs
      const cleanError = errorText.replace(/<[^>]*>/g, "").slice(0, 1000);
      return res.status(400).json({ error: cleanError || "Erreur de compilation LaTeX." });
    }

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": "inline; filename=resume.pdf"
    });
    res.send(Buffer.from(arrayBuffer));
  } catch (err: any) {
    console.error("Compilation error:", err.message);
    res.status(500).json({ error: err.message });
  } finally {
    // Cleanup temporary files
    try {
      if (fsSync.existsSync(tmpDir)) await fs.rm(tmpDir, { recursive: true, force: true });
      if (fsSync.existsSync(tarPath)) await fs.rm(tarPath, { force: true });
    } catch (e) {
      // ignore
    }
  }
});

// Vite middleware for development
async function startServer() {
  await ensureDataDir();

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
