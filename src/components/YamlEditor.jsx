import React, { useState, useEffect } from 'react';
import { FileText, Download, Copy, Check, RefreshCw, Upload, AlertCircle } from 'lucide-react';

export default function YamlEditor({
  selectedPath,
  variables,
  extraVariables,
  onImportYaml,
  isSaving
}) {
  const [yamlContent, setYamlContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [importError, setImportError] = useState(null);
  const [importSuccess, setImportSuccess] = useState(false);

  useEffect(() => {
    if (!selectedPath) return;

    let isMounted = true;
    const fetchYaml = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/ref/yaml?path=${encodeURIComponent(selectedPath)}`);
        const data = await res.json();
        if (data.success && isMounted) {
          setYamlContent(data.yaml);
        }
      } catch (err) {
        console.error('Failed to load YAML:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchYaml();

    return () => {
      isMounted = false;
    };
  }, [selectedPath, variables, extraVariables]);

  const handleCopy = () => {
    if (!yamlContent) return;
    navigator.clipboard.writeText(yamlContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!selectedPath) return;
    window.location.href = `/api/ref/export-yaml?path=${encodeURIComponent(selectedPath)}`;
  };

  const handleApplyChanges = async () => {
    try {
      setImportError(null);
      setImportSuccess(false);
      await onImportYaml(yamlContent);
      setImportSuccess(true);
      setTimeout(() => setImportSuccess(false), 3000);
    } catch (err) {
      setImportError(err.message || 'Failed to apply YAML changes');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-50 dark:bg-zinc-950 overflow-hidden font-mono transition-colors">
      {/* YAML Toolbar */}
      <div className="p-2.5 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
          <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
            YAML Data
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700 text-xs font-medium"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                <span className="text-emerald-700 dark:text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700 text-xs font-medium"
            title="Download as .yaml"
          >
            <Download className="w-3 h-3 text-zinc-600 dark:text-zinc-400" />
            <span>Download</span>
          </button>

          <button
            type="button"
            onClick={handleApplyChanges}
            disabled={isSaving}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-white text-white dark:text-zinc-900 text-xs font-medium disabled:opacity-50"
            title="Apply YAML to CV"
          >
            {isSaving ? (
              <RefreshCw className="w-3 h-3 animate-spin" />
            ) : (
              <Upload className="w-3 h-3" />
            )}
            <span>Apply</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      {importError && (
        <div className="p-2 bg-red-50 dark:bg-red-950/70 border-b border-red-200 dark:border-red-900/60 text-red-800 dark:text-red-200 text-xs flex items-center gap-1.5 shrink-0">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-600 dark:text-red-400" />
          <span>{importError}</span>
        </div>
      )}

      {importSuccess && (
        <div className="p-2 bg-emerald-50 dark:bg-emerald-950/70 border-b border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-1.5 shrink-0">
          <Check className="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>Applied successfully!</span>
        </div>
      )}

      {/* Textarea */}
      <div className="flex-1 p-2.5 overflow-hidden flex flex-col bg-zinc-50 dark:bg-zinc-950">
        <textarea
          value={yamlContent}
          onChange={(e) => setYamlContent(e.target.value)}
          spellCheck={false}
          className="w-full h-full bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 font-mono text-xs p-3 rounded border border-zinc-300 dark:border-zinc-750 focus:border-zinc-500 dark:focus:border-zinc-400 focus:outline-none resize-none leading-relaxed"
          placeholder="Loading YAML..."
        />
      </div>
    </div>
  );
}
