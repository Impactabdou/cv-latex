import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseTexVariables, serializeTexVariables, getDefaultVariables } from '../server/services/texParser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const sourceVarsDir = path.join(rootDir, 'vars', 'domains');
const targetDataDir = path.join(rootDir, 'public', 'data', 'latex', 'domains');

function findTexFiles(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(findTexFiles(fullPath));
    } else if (file.endsWith('.tex')) {
      results.push(fullPath);
    }
  }
  return results;
}

console.log('Migrating and verifying LaTeX reference files...');
const files = findTexFiles(sourceVarsDir);

for (const filePath of files) {
  const relPath = path.relative(sourceVarsDir, filePath);
  const targetPath = path.join(targetDataDir, relPath);
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const { variables, extraVariables } = parseTexVariables(content);
  
  const refCode = path.basename(filePath, '.tex');
  const defaults = getDefaultVariables(refCode, variables.CVJobTitle || 'Consultant');
  
  // Merge defaults with parsed variables so EVERY variable is declared
  const completeVars = { ...defaults, ...variables };
  completeVars.CVApplicationRef = completeVars.CVApplicationRef || refCode;

  const serialized = serializeTexVariables(completeVars, extraVariables);
  
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, serialized, 'utf-8');
  console.log(`Migrated: ${relPath} (${Object.keys(completeVars).length} variables)`);
}

// Add generic domain example requested in prompt: generic/loick.tex
const genericLoick = path.join(targetDataDir, 'generic', 'loick.tex');
if (!fs.existsSync(genericLoick)) {
  fs.mkdirSync(path.dirname(genericLoick), { recursive: true });
  const loickVars = getDefaultVariables('LOICK-2027', 'Consultant Transformation Digitale');
  loickVars.CVFirstName = 'Loïck';
  loickVars.CVLastName = 'DUPONT';
  loickVars.CVEmail = 'loick.dupont@consulting.fr';
  fs.writeFileSync(genericLoick, serializeTexVariables(loickVars), 'utf-8');
  console.log('Created sample generic/loick.tex');
}

// Add banks domain example requested in prompt
const bankBnp = path.join(targetDataDir, 'banks', 'corporate', 'BNP Paribas', 'BNP-9821.tex');
if (!fs.existsSync(bankBnp)) {
  fs.mkdirSync(path.dirname(bankBnp), { recursive: true });
  const bnpVars = getDefaultVariables('BNP-9821', 'Analyste Quantitatif & Modélisation Financière');
  bnpVars.CVProfileText = 'Étudiant en double diplôme Ingénieur-Manager, \\textbf{je recherche un stage de 6 mois (janv. 2027)} au sein du pôle Corporate & Institutional Banking (CIB) chez BNP Paribas.';
  fs.writeFileSync(bankBnp, serializeTexVariables(bnpVars), 'utf-8');
  console.log('Created sample banks/corporate/BNP Paribas/BNP-9821.tex');
}

console.log('Migration completed successfully.');
