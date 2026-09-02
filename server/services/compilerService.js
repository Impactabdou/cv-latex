import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { sanitizeRelativePath, getDomainAbsolutePath } from './fileService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..', '..');

const LATEX_DIR = path.join(rootDir, 'public', 'data', 'latex');
const MAIN_TEX = path.join(LATEX_DIR, 'main.tex');
const BUILD_CACHE_DIR = path.join(rootDir, 'build', 'latex_cache');

// Ensure cache directory exists
if (!fs.existsSync(BUILD_CACHE_DIR)) {
  fs.mkdirSync(BUILD_CACHE_DIR, { recursive: true });
}

// Memory cache for compiled PDFs and build hashes
const compilationCache = new Map();
// Active compilation promises to deduplicate concurrent requests
const activeCompilations = new Map();

/**
 * Parses LaTeX compilation log to extract human-readable error messages
 */
function parseLatexLogErrors(logContent) {
  const errors = [];
  const lines = logContent.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('! ')) {
      const errorMsg = line.slice(2).trim();
      let context = '';
      let lineNum = null;
      
      // Look ahead for line number e.g. "l.159 ..."
      for (let j = i + 1; j < Math.min(i + 8, lines.length); j++) {
        const nextLine = lines[j];
        const match = nextLine.match(/^l\.(\d+)\s*(.*)$/);
        if (match) {
          lineNum = parseInt(match[1], 10);
          context = match[2];
          break;
        }
      }
      
      errors.push({
        message: errorMsg,
        line: lineNum,
        context: context
      });
    }
  }

  return errors;
}

/**
 * Generates MD5 hash for a file's content
 */
function getFileHash(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath);
  return crypto.createHash('md5').update(content).digest('hex');
}

/**
 * Compiles a specific CV reference into a PDF using pdflatex
 * @param {string} relativeRefPath - Relative path within domains/ e.g. "consulting/big4/Deloitte/R-1099.tex"
 * @param {boolean} force - Force recompile bypassing hash cache
 */
export async function compileLatexReference(relativeRefPath, force = false) {
  const cleanRef = sanitizeRelativePath(relativeRefPath);
  const refFullPath = getDomainAbsolutePath(cleanRef);

  if (!fs.existsSync(refFullPath)) {
    throw new Error(`Reference file does not exist: ${cleanRef}`);
  }

  // Generate safe build key
  const safeKey = cleanRef.replace(/[\/\\]/g, '__').replace(/\.tex$/, '');
  const refHash = getFileHash(refFullPath);
  const mainHash = getFileHash(MAIN_TEX);
  const combinedHash = `${mainHash}_${refHash}`;

  const outputPdfName = `${safeKey}.pdf`;
  const outputPdfPath = path.join(BUILD_CACHE_DIR, outputPdfName);

  // Check cache
  if (!force && fs.existsSync(outputPdfPath) && compilationCache.get(safeKey) === combinedHash) {
    return {
      success: true,
      cached: true,
      pdfPath: outputPdfPath,
      pdfFileName: outputPdfName,
      durationMs: 0,
      log: 'Served from cache'
    };
  }

  // Deduplicate in-flight builds
  if (activeCompilations.has(safeKey)) {
    return activeCompilations.get(safeKey);
  }

  const compilationPromise = (async () => {
    const startTime = Date.now();

    // Create a specific sub-build directory for this job to isolate aux files
    const jobDir = path.join(BUILD_CACHE_DIR, safeKey);
    if (!fs.existsSync(jobDir)) {
      fs.mkdirSync(jobDir, { recursive: true });
    }

    // Relative path from LATEX_DIR to the target reference file
    const relFromLatexDir = path.join('domains', cleanRef);

    return new Promise((resolve) => {
      // pdflatex command
      const latexInputArg = `\\def\\CVREFPATH{${relFromLatexDir}}\\input{main.tex}`;
      const args = [
        '-interaction=nonstopmode',
        `-output-directory=${jobDir}`,
        `-jobname=${safeKey}`,
        latexInputArg
      ];

      const child = spawn('pdflatex', args, {
        cwd: LATEX_DIR,
        env: process.env
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (exitCode) => {
        const durationMs = Date.now() - startTime;
        const jobPdfPath = path.join(jobDir, `${safeKey}.pdf`);
        const jobLogPath = path.join(jobDir, `${safeKey}.log`);
        const logContent = fs.existsSync(jobLogPath) ? fs.readFileSync(jobLogPath, 'utf-8') : stdout;

        if (exitCode === 0 && fs.existsSync(jobPdfPath)) {
          // Copy to main cache pdf path
          fs.copyFileSync(jobPdfPath, outputPdfPath);
          compilationCache.set(safeKey, combinedHash);

          resolve({
            success: true,
            cached: false,
            pdfPath: outputPdfPath,
            pdfFileName: outputPdfName,
            durationMs,
            log: logContent
          });
        } else {
          const errors = parseLatexLogErrors(logContent);
          const primaryError = errors.length > 0 ? errors[0].message : 'LaTeX compilation failed';
          
          resolve({
            success: false,
            cached: false,
            error: primaryError,
            errors,
            exitCode,
            durationMs,
            log: logContent
          });
        }
      });

      child.on('error', (err) => {
        resolve({
          success: false,
          error: `Failed to execute pdflatex: ${err.message}`,
          durationMs: Date.now() - startTime,
          log: err.stack
        });
      });
    });
  })();

  activeCompilations.set(safeKey, compilationPromise);
  try {
    const result = await compilationPromise;
    return result;
  } finally {
    activeCompilations.delete(safeKey);
  }
}

/**
 * Gets path to compiled PDF for a reference
 */
export function getCompiledPdfPath(relativeRefPath) {
  const cleanRef = sanitizeRelativePath(relativeRefPath);
  const safeKey = cleanRef.replace(/[\/\\]/g, '__').replace(/\.tex$/, '');
  const outputPdfPath = path.join(BUILD_CACHE_DIR, `${safeKey}.pdf`);
  if (fs.existsSync(outputPdfPath)) {
    return outputPdfPath;
  }
  return null;
}
