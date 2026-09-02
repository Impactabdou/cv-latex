import express from 'express';
import fs from 'fs';
import path from 'path';
import {
  getDirectoryTree,
  getAllReferences,
  getReferenceData,
  saveReferenceData,
  createFolder,
  createReference,
  deleteItem,
  renameItem,
  sanitizeRelativePath
} from '../services/fileService.js';
import {
  compileLatexReference,
  getCompiledPdfPath
} from '../services/compilerService.js';
import { VARIABLE_SCHEMA, getDefaultVariables } from '../services/texParser.js';
import { variablesToStructuredYaml, yamlToVariables } from '../services/yamlService.js';

const router = express.Router();

/**
 * GET /api/tree
 * Returns full domain/subdomain/company/ref tree and flat references list
 */
router.get('/tree', (req, res) => {
  try {
    const tree = getDirectoryTree();
    const allReferences = getAllReferences();
    res.json({
      success: true,
      tree,
      allReferences
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/schema
 * Returns master variable schema
 */
router.get('/schema', (req, res) => {
  res.json({
    success: true,
    schema: VARIABLE_SCHEMA
  });
});

/**
 * GET /api/ref/data?path=...
 * Reads and parses variables from a reference .tex file
 */
router.get('/ref/data', (req, res) => {
  try {
    const { path: relPath } = req.query;
    if (!relPath) {
      return res.status(400).json({ success: false, error: 'Path query param is required' });
    }

    const data = getReferenceData(relPath);
    res.json({
      success: true,
      ...data
    });
  } catch (err) {
    res.status(404).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/ref/save
 * Saves variables/rawTex and optionally compiles PDF
 */
router.post('/ref/save', async (req, res) => {
  try {
    const { relativePath, variables, rawTex, extraVariables, compile = true } = req.body;
    if (!relativePath) {
      return res.status(400).json({ success: false, error: 'relativePath is required' });
    }

    const saved = saveReferenceData(relativePath, { variables, rawTex, extraVariables });

    let compilationResult = null;
    if (compile) {
      compilationResult = await compileLatexReference(relativePath, true);
    }

    res.json({
      success: true,
      ...saved,
      compilation: compilationResult
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/ref/compile
 * Triggers compilation of a given reference
 */
router.post('/ref/compile', async (req, res) => {
  try {
    const { relativePath, force = false } = req.body;
    if (!relativePath) {
      return res.status(400).json({ success: false, error: 'relativePath is required' });
    }

    const result = await compileLatexReference(relativePath, force);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/ref/pdf?path=...
 * Streams the compiled PDF inline for the viewer
 */
router.get('/ref/pdf', async (req, res) => {
  try {
    const { path: relPath, force = 'false' } = req.query;
    if (!relPath) {
      return res.status(400).send('Path parameter required');
    }

    const shouldForce = force === 'true' || force === '1';
    let pdfPath = getCompiledPdfPath(relPath);

    if (!pdfPath || shouldForce) {
      const comp = await compileLatexReference(relPath, shouldForce);
      if (!comp.success) {
        return res.status(500).json({
          success: false,
          error: comp.error,
          errors: comp.errors,
          log: comp.log
        });
      }
      pdfPath = comp.pdfPath;
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="cv.pdf"');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

    const stream = fs.createReadStream(pdfPath);
    stream.pipe(res);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

/**
 * GET /api/ref/download?path=...
 * Triggers PDF download with a meaningful filename
 */
router.get('/ref/download', async (req, res) => {
  try {
    const { path: relPath } = req.query;
    if (!relPath) {
      return res.status(400).send('Path parameter required');
    }

    let pdfPath = getCompiledPdfPath(relPath);
    if (!pdfPath) {
      const comp = await compileLatexReference(relPath, false);
      if (!comp.success) {
        return res.status(500).send(`Compilation failed: ${comp.error}`);
      }
      pdfPath = comp.pdfPath;
    }

    const baseName = path.basename(relPath, '.tex');
    const parts = sanitizeRelativePath(relPath).split(/[\/\\]/);
    const company = parts.length >= 2 ? parts[parts.length - 2] : 'CV';
    const downloadName = `CV_${company}_${baseName}.pdf`.replace(/[^a-zA-Z0-9_.-]/g, '_');

    res.download(pdfPath, downloadName);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

/**
 * GET /api/ref/yaml?path=...
 * Returns structured YAML for viewing/copying
 */
router.get('/ref/yaml', (req, res) => {
  try {
    const { path: relPath } = req.query;
    if (!relPath) {
      return res.status(400).json({ success: false, error: 'Path parameter required' });
    }

    const data = getReferenceData(relPath);
    const yamlContent = variablesToStructuredYaml(data.variables, data.extraVariables, relPath);
    const baseName = path.basename(relPath, '.tex');
    const parts = sanitizeRelativePath(relPath).split(/[\/\\]/);
    const company = parts.length >= 2 ? parts[parts.length - 2] : 'CV';
    const filename = `CV_${company}_${baseName}.yaml`.replace(/[^a-zA-Z0-9_.-]/g, '_');

    res.json({
      success: true,
      yaml: yamlContent,
      filename
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/ref/export-yaml?path=...
 * Directly streams the YAML file as an attachment download
 */
router.get('/ref/export-yaml', (req, res) => {
  try {
    const { path: relPath } = req.query;
    if (!relPath) {
      return res.status(400).send('Path parameter required');
    }

    const data = getReferenceData(relPath);
    const yamlContent = variablesToStructuredYaml(data.variables, data.extraVariables, relPath);
    const baseName = path.basename(relPath, '.tex');
    const parts = sanitizeRelativePath(relPath).split(/[\/\\]/);
    const company = parts.length >= 2 ? parts[parts.length - 2] : 'CV';
    const filename = `CV_${company}_${baseName}.yaml`.replace(/[^a-zA-Z0-9_.-]/g, '_');

    res.setHeader('Content-Type', 'text/yaml; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(yamlContent);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

/**
 * POST /api/ref/import-yaml
 * Imports YAML content into a reference file and recompiles
 */
router.post('/ref/import-yaml', async (req, res) => {
  try {
    const { relativePath, yamlString, compile = true } = req.body;
    if (!relativePath || !yamlString) {
      return res.status(400).json({ success: false, error: 'relativePath and yamlString are required' });
    }

    const { variables, extraVariables } = yamlToVariables(yamlString);
    const saved = saveReferenceData(relativePath, { variables, extraVariables });

    let compilationResult = null;
    if (compile) {
      compilationResult = await compileLatexReference(relativePath, true);
    }

    res.json({
      success: true,
      ...saved,
      compilation: compilationResult
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/tree/folder
 * Creates a new category / directory
 */
router.post('/tree/folder', (req, res) => {
  try {
    const { parentPath = '', folderName } = req.body;
    const result = createFolder(parentPath, folderName);
    const tree = getDirectoryTree();
    res.json({
      success: true,
      result,
      tree
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/tree/reference
 * Creates a new reference .tex file (optionally cloned)
 */
router.post('/tree/reference', async (req, res) => {
  try {
    const { targetDir = '', refCode, sourceRef = null } = req.body;
    const result = createReference(targetDir, refCode, sourceRef);
    
    // Immediately compile the newly created reference
    await compileLatexReference(result.relativePath, true);

    const tree = getDirectoryTree();
    const allReferences = getAllReferences();

    res.json({
      success: true,
      result,
      tree,
      allReferences
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/tree/rename
 * Renames file or directory
 */
router.post('/tree/rename', (req, res) => {
  try {
    const { relativePath, newName } = req.body;
    const result = renameItem(relativePath, newName);
    const tree = getDirectoryTree();
    const allReferences = getAllReferences();
    res.json({
      success: true,
      result,
      tree,
      allReferences
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * DELETE /api/tree/delete
 * Deletes file or directory
 */
router.delete('/tree/delete', (req, res) => {
  try {
    const { relativePath } = req.body;
    const result = deleteItem(relativePath);
    const tree = getDirectoryTree();
    const allReferences = getAllReferences();
    res.json({
      success: true,
      result,
      tree,
      allReferences
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

export default router;
