import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  parseTexVariables,
  serializeTexVariables,
  getDefaultVariables,
  VARIABLE_SCHEMA
} from './texParser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..', '..');

const DATA_LATEX_DIR = path.join(rootDir, 'public', 'data', 'latex');
const DOMAINS_DIR = path.join(DATA_LATEX_DIR, 'domains');

// Ensure root domains directory exists
if (!fs.existsSync(DOMAINS_DIR)) {
  fs.mkdirSync(DOMAINS_DIR, { recursive: true });
}

/**
 * Normalizes relative path to prevent directory traversal attacks
 */
export function sanitizeRelativePath(relPath) {
  if (!relPath) return '';
  const cleaned = path.normalize(relPath).replace(/^(\.\.[\/\\])+/, '').replace(/^[\/\\]+/, '');
  return cleaned;
}

/**
 * Returns complete absolute path within domains directory
 */
export function getDomainAbsolutePath(relPath) {
  const clean = sanitizeRelativePath(relPath);
  return path.join(DOMAINS_DIR, clean);
}

/**
 * Recursively scans directory and builds hierarchical tree
 */
export function getDirectoryTree(dir = DOMAINS_DIR, base = '') {
  if (!fs.existsSync(dir)) return [];
  
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  // Sort: directories first, then files alphabetically
  entries.sort((a, b) => {
    if (a.isDirectory() && !b.isDirectory()) return -1;
    if (!a.isDirectory() && b.isDirectory()) return 1;
    return a.name.localeCompare(b.name);
  });

  const tree = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.join(base, entry.name);

    if (entry.isDirectory()) {
      tree.push({
        id: relPath,
        name: entry.name,
        type: 'directory',
        relativePath: relPath,
        children: getDirectoryTree(fullPath, relPath)
      });
    } else if (entry.isFile() && entry.name.endsWith('.tex')) {
      tree.push({
        id: relPath,
        name: entry.name,
        referenceCode: path.basename(entry.name, '.tex'),
        type: 'file',
        relativePath: relPath
      });
    }
  }

  return tree;
}

/**
 * Flattens all references for fast lookup / cloning selection
 */
export function getAllReferences(dir = DOMAINS_DIR, base = '') {
  let list = [];
  if (!fs.existsSync(dir)) return list;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.join(base, entry.name);
    if (entry.isDirectory()) {
      list = list.concat(getAllReferences(fullPath, relPath));
    } else if (entry.isFile() && entry.name.endsWith('.tex')) {
      list.push({
        name: entry.name,
        referenceCode: path.basename(entry.name, '.tex'),
        relativePath: relPath
      });
    }
  }
  return list;
}

/**
 * Reads and parses a specific reference .tex file
 */
export function getReferenceData(relativePath) {
  const fullPath = getDomainAbsolutePath(relativePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`File not found: ${relativePath}`);
  }

  const rawTex = fs.readFileSync(fullPath, 'utf-8');
  const { variables, extraVariables } = parseTexVariables(rawTex);
  
  // Ensure default fallback values are present if any variable was missing
  const refCode = path.basename(relativePath, '.tex');
  const defaults = getDefaultVariables(refCode, variables.CVJobTitle || 'Consultant');
  const mergedVars = { ...defaults, ...variables };

  return {
    relativePath: sanitizeRelativePath(relativePath),
    referenceCode: refCode,
    variables: mergedVars,
    extraVariables,
    rawTex,
    schema: VARIABLE_SCHEMA
  };
}

/**
 * Saves variables or raw TeX to a reference file
 */
export function saveReferenceData(relativePath, { variables, rawTex, extraVariables = [] }) {
  const fullPath = getDomainAbsolutePath(relativePath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  let finalTex = '';
  if (rawTex !== undefined && rawTex !== null) {
    // Direct raw text save
    finalTex = rawTex;
  } else if (variables) {
    // Structured variables save
    finalTex = serializeTexVariables(variables, extraVariables);
  } else {
    throw new Error('No variables or rawTex provided to save');
  }

  fs.writeFileSync(fullPath, finalTex, 'utf-8');

  // Re-parse to return updated state
  const { variables: updatedVars, extraVariables: updatedExtras } = parseTexVariables(finalTex);
  return {
    relativePath: sanitizeRelativePath(relativePath),
    variables: updatedVars,
    extraVariables: updatedExtras,
    rawTex: finalTex
  };
}

/**
 * Creates a new category / folder
 */
export function createFolder(parentRelPath, folderName) {
  if (!folderName || !folderName.trim()) {
    throw new Error('Folder name is required');
  }
  const cleanParent = sanitizeRelativePath(parentRelPath || '');
  const cleanName = folderName.trim().replace(/[<>:"/\\|?*]/g, '_');
  const targetDir = path.join(DOMAINS_DIR, cleanParent, cleanName);

  if (fs.existsSync(targetDir)) {
    throw new Error(`Folder already exists: ${path.join(cleanParent, cleanName)}`);
  }

  fs.mkdirSync(targetDir, { recursive: true });
  return {
    relativePath: path.join(cleanParent, cleanName),
    name: cleanName
  };
}

/**
 * Creates a new CV Reference file (optionally cloning an existing one)
 */
export function createReference(targetDirRelPath, refCode, sourceRefRelPath = null) {
  if (!refCode || !refCode.trim()) {
    throw new Error('Reference code is required');
  }

  let cleanCode = refCode.trim().replace(/[<>:"/\\|?*]/g, '_');
  if (cleanCode.endsWith('.tex')) {
    cleanCode = cleanCode.slice(0, -4);
  }
  const fileName = `${cleanCode}.tex`;
  const cleanDir = sanitizeRelativePath(targetDirRelPath || '');
  const fullTargetDir = path.join(DOMAINS_DIR, cleanDir);
  const fullFilePath = path.join(fullTargetDir, fileName);

  if (!fs.existsSync(fullTargetDir)) {
    fs.mkdirSync(fullTargetDir, { recursive: true });
  }

  if (fs.existsSync(fullFilePath)) {
    throw new Error(`Reference file already exists: ${path.join(cleanDir, fileName)}`);
  }

  let varsToSave;
  let extrasToSave = [];

  if (sourceRefRelPath) {
    const sourceFullPath = getDomainAbsolutePath(sourceRefRelPath);
    if (!fs.existsSync(sourceFullPath)) {
      throw new Error(`Source reference not found: ${sourceRefRelPath}`);
    }
    const sourceTex = fs.readFileSync(sourceFullPath, 'utf-8');
    const parsed = parseTexVariables(sourceTex);
    varsToSave = { ...getDefaultVariables(cleanCode), ...parsed.variables };
    varsToSave.CVApplicationRef = cleanCode;
    extrasToSave = parsed.extraVariables;
  } else {
    varsToSave = getDefaultVariables(cleanCode);
  }

  const serialized = serializeTexVariables(varsToSave, extrasToSave);
  fs.writeFileSync(fullFilePath, serialized, 'utf-8');

  return {
    relativePath: path.join(cleanDir, fileName),
    referenceCode: cleanCode,
    name: fileName
  };
}

/**
 * Deletes a file or directory
 */
export function deleteItem(relativePath) {
  const clean = sanitizeRelativePath(relativePath);
  if (!clean || clean === '.' || clean === '/' || clean === '') {
    throw new Error('Cannot delete root domains directory');
  }

  const fullPath = getDomainAbsolutePath(clean);
  if (fullPath === DOMAINS_DIR || !fullPath.startsWith(DOMAINS_DIR)) {
    throw new Error('Access denied: Cannot delete root domains directory');
  }

  if (!fs.existsSync(fullPath)) {
    throw new Error(`Item not found: ${relativePath}`);
  }

  const stat = fs.statSync(fullPath);
  if (stat.isDirectory()) {
    fs.rmSync(fullPath, { recursive: true, force: true });
  } else {
    fs.unlinkSync(fullPath);
  }

  return { success: true, relativePath: clean };
}

/**
 * Renames a file or folder
 */
export function renameItem(relativePath, newName) {
  if (!newName || !newName.trim()) {
    throw new Error('New name is required');
  }

  const fullPath = getDomainAbsolutePath(relativePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Item not found: ${relativePath}`);
  }

  const stat = fs.statSync(fullPath);
  let cleanName = newName.trim().replace(/[<>:"/\\|?*]/g, '_');
  if (!stat.isDirectory() && !cleanName.endsWith('.tex')) {
    cleanName += '.tex';
  }

  const parentDir = path.dirname(fullPath);
  const targetFullPath = path.join(parentDir, cleanName);

  if (fs.existsSync(targetFullPath)) {
    throw new Error(`An item with name "${cleanName}" already exists`);
  }

  fs.renameSync(fullPath, targetFullPath);

  const parentRel = path.dirname(sanitizeRelativePath(relativePath));
  const newRelPath = parentRel === '.' ? cleanName : path.join(parentRel, cleanName);

  return {
    success: true,
    oldRelativePath: relativePath,
    newRelativePath: newRelPath,
    newName: cleanName
  };
}
