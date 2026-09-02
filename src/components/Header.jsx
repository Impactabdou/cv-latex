import React from 'react';
import {
  Plus,
  FolderPlus,
  RefreshCw,
  Download,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  FolderTree,
  Sun,
  Moon,
  Laptop
} from 'lucide-react';

export default function Header({
  tree,
  allReferences,
  selectedPath,
  onSelectPath,
  onOpenNewRefModal,
  onOpenNewFolderModal,
  onOpenTreeModal,
  onRecompile,
  onDownload,
  onExportYaml,
  status, // 'idle' | 'saving' | 'compiling' | 'success' | 'error'
  compileDuration,
  errorMessage,
  theme,
  onToggleTheme
}) {
  const pathParts = (selectedPath || '').split('/').filter(Boolean);
  const domains = (tree || []).filter(item => item.type === 'directory');
  
  const currentDomain = pathParts[0] || '';
  const domainNode = domains.find(d => d.name === currentDomain);
  
  const subdomains = domainNode && domainNode.children 
    ? domainNode.children.filter(item => item.type === 'directory') 
    : [];
  const currentSubdomain = pathParts.length > 2 ? pathParts[1] : (subdomains.length > 0 && pathParts[1] ? pathParts[1] : '');
  const subdomainNode = subdomains.find(s => s.name === currentSubdomain);

  const companies = subdomainNode && subdomainNode.children
    ? subdomainNode.children.filter(item => item.type === 'directory')
    : [];
  const currentCompany = pathParts.length >= 4 ? pathParts[2] : (companies.length > 0 && pathParts[2] ? pathParts[2] : '');
  const companyNode = companies.find(c => c.name === currentCompany);

  let availableRefs = [];
  if (companyNode && companyNode.children) {
    availableRefs = companyNode.children.filter(item => item.type === 'file');
  } else if (subdomainNode && subdomainNode.children) {
    availableRefs = subdomainNode.children.filter(item => item.type === 'file');
  } else if (domainNode && domainNode.children) {
    availableRefs = domainNode.children.filter(item => item.type === 'file');
  }

  const handleDomainChange = (e) => {
    const dName = e.target.value;
    const d = domains.find(item => item.name === dName);
    if (!d) return;

    const findFirstRef = (node) => {
      if (node.type === 'file') return node.relativePath;
      if (node.children && node.children.length > 0) {
        for (const child of node.children) {
          const found = findFirstRef(child);
          if (found) return found;
        }
      }
      return null;
    };

    const firstRef = findFirstRef(d);
    if (firstRef) onSelectPath(firstRef);
  };

  const handleSubdomainChange = (e) => {
    const sName = e.target.value;
    const s = subdomains.find(item => item.name === sName);
    if (!s) return;

    const findFirstRef = (node) => {
      if (node.type === 'file') return node.relativePath;
      if (node.children && node.children.length > 0) {
        for (const child of node.children) {
          const found = findFirstRef(child);
          if (found) return found;
        }
      }
      return null;
    };

    const firstRef = findFirstRef(s);
    if (firstRef) onSelectPath(firstRef);
  };

  const handleCompanyChange = (e) => {
    const cName = e.target.value;
    const c = companies.find(item => item.name === cName);
    if (!c) return;

    const firstRef = (c.children || []).find(item => item.type === 'file');
    if (firstRef) onSelectPath(firstRef.relativePath);
  };

  const handleRefChange = (e) => {
    const refRelPath = e.target.value;
    if (refRelPath) onSelectPath(refRelPath);
  };

  return (
    <header className="h-14 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-4 sticky top-0 z-30 select-none transition-colors">
      {/* Title */}
      <div className="flex items-center gap-2">
        <span className="font-semibold text-sm tracking-tight text-zinc-900 dark:text-zinc-100">
          LaTeX CV Editor
        </span>
        <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-mono">
          / Overleaf View
        </span>
      </div>

      {/* Cascading Navigation Selectors */}
      <div className="flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-950 px-2 py-1 rounded-md border border-zinc-200 dark:border-zinc-800">
        {/* Domain Select */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] uppercase font-semibold text-zinc-500 dark:text-zinc-400">Domain</span>
          <select
            value={currentDomain}
            onChange={handleDomainChange}
            className="bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs text-zinc-800 dark:text-zinc-200 rounded px-2 py-1 focus:outline-none focus:border-zinc-500 dark:focus:border-zinc-500 cursor-pointer"
          >
            {!currentDomain && <option value="">Select...</option>}
            {domains.map(d => (
              <option key={d.name} value={d.name}>{d.name}</option>
            ))}
          </select>
        </div>

        {subdomains.length > 0 && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-600" />
            <div className="flex items-center gap-1">
              <span className="text-[10px] uppercase font-semibold text-zinc-500 dark:text-zinc-400">Subdomain</span>
              <select
                value={currentSubdomain}
                onChange={handleSubdomainChange}
                className="bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs text-zinc-800 dark:text-zinc-200 rounded px-2 py-1 focus:outline-none focus:border-zinc-500 dark:focus:border-zinc-500 cursor-pointer"
              >
                {!currentSubdomain && <option value="">Select...</option>}
                {subdomains.map(s => (
                  <option key={s.name} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>
          </>
        )}

        {companies.length > 0 && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-600" />
            <div className="flex items-center gap-1">
              <span className="text-[10px] uppercase font-semibold text-zinc-500 dark:text-zinc-400">Company</span>
              <select
                value={currentCompany}
                onChange={handleCompanyChange}
                className="bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs text-zinc-800 dark:text-zinc-200 rounded px-2 py-1 focus:outline-none focus:border-zinc-500 dark:focus:border-zinc-500 cursor-pointer"
              >
                {!currentCompany && <option value="">Select...</option>}
                {companies.map(c => (
                  <option key={c.name} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
          </>
        )}

        <ChevronRight className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-600" />

        {/* Reference File Select */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] uppercase font-semibold text-zinc-900 dark:text-zinc-200">Ref</span>
          <select
            value={selectedPath || ''}
            onChange={handleRefChange}
            className="bg-white dark:bg-zinc-900 border border-zinc-400 dark:border-zinc-600 font-mono text-xs text-zinc-900 dark:text-zinc-100 font-medium rounded px-2 py-1 focus:outline-none focus:border-zinc-600 dark:focus:border-zinc-400 cursor-pointer"
          >
            {!selectedPath && <option value="">Select Reference...</option>}
            {availableRefs.length > 0 ? (
              availableRefs.map(r => (
                <option key={r.relativePath} value={r.relativePath}>
                  {r.name}
                </option>
              ))
            ) : (
              (allReferences || []).map(r => (
                <option key={r.relativePath} value={r.relativePath}>
                  {r.relativePath}
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {/* Status Badge & Actions */}
      <div className="flex items-center gap-2">
        {/* Simple Status Indicator */}
        <div className="flex items-center text-xs">
          {status === 'compiling' && (
            <span className="text-zinc-600 dark:text-zinc-300 text-xs flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 px-2 py-0.5 rounded">
              <RefreshCw className="w-3 h-3 animate-spin text-zinc-600 dark:text-zinc-400" />
              Compiling
            </span>
          )}
          {status === 'saving' && (
            <span className="text-zinc-600 dark:text-zinc-300 text-xs flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 px-2 py-0.5 rounded">
              Saving
            </span>
          )}
          {status === 'success' && (
            <span className="text-zinc-700 dark:text-zinc-300 text-xs flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-2 py-0.5 rounded">
              <CheckCircle2 className="w-3 h-3 text-zinc-600 dark:text-zinc-400" />
              Ready {compileDuration > 0 && <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">({compileDuration}ms)</span>}
            </span>
          )}
          {status === 'error' && (
            <span className="text-red-700 dark:text-red-300 text-xs flex items-center gap-1 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900/60 px-2 py-0.5 rounded" title={errorMessage}>
              <AlertCircle className="w-3 h-3 text-red-600 dark:text-red-400" />
              Error
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <button
          onClick={onRecompile}
          disabled={status === 'compiling'}
          className="flex items-center gap-1 px-2.5 py-1 rounded bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-750 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700 text-xs font-medium transition disabled:opacity-50"
          title="Recompile"
        >
          <RefreshCw className={`w-3 h-3 ${status === 'compiling' ? 'animate-spin' : ''}`} />
          <span>Recompile</span>
        </button>

        <button
          onClick={onDownload}
          className="flex items-center gap-1 px-2.5 py-1 rounded bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-750 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700 text-xs font-medium transition"
          title="Download PDF"
        >
          <Download className="w-3 h-3 text-zinc-600 dark:text-zinc-400" />
          <span>PDF</span>
        </button>

        <button
          onClick={onExportYaml}
          className="flex items-center gap-1 px-2.5 py-1 rounded bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-750 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700 text-xs font-medium transition"
          title="Export YAML"
        >
          <Download className="w-3 h-3 text-zinc-600 dark:text-zinc-400" />
          <span>YAML</span>
        </button>

        {/* Theme Mode Switcher */}
        <button
          onClick={onToggleTheme}
          className="p-1 rounded bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700 transition"
          title={`Theme: ${theme === 'system' ? 'System Preference' : theme === 'dark' ? 'Dark' : 'Light'}`}
        >
          {theme === 'dark' ? (
            <Moon className="w-3.5 h-3.5 text-zinc-300" />
          ) : theme === 'light' ? (
            <Sun className="w-3.5 h-3.5 text-amber-500" />
          ) : (
            <Laptop className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
          )}
        </button>

        <div className="h-4 w-px bg-zinc-300 dark:bg-zinc-700" />

        {/* Tree Explorer / New CV Unified Action */}
        <button
          onClick={onOpenTreeModal}
          className="flex items-center gap-1.5 px-3 py-1 rounded bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-white text-white dark:text-zinc-900 text-xs font-medium transition shadow-sm"
          title="Manage Categories & CV References"
        >
          <FolderTree className="w-3.5 h-3.5" />
          <span>Files & Folders</span>
        </button>
      </div>
    </header>
  );
}
