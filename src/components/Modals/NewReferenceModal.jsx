import React, { useState } from 'react';
import { X, Copy, Plus, Folder, AlertCircle } from 'lucide-react';

export default function NewReferenceModal({
  isOpen,
  onClose,
  tree,
  allReferences,
  currentPath,
  onCreateReference
}) {
  if (!isOpen) return null;

  const defaultDir = currentPath ? currentPath.substring(0, currentPath.lastIndexOf('/')) : 'consulting/big4/Deloitte';

  const [targetDir, setTargetDir] = useState(defaultDir);
  const [refCode, setRefCode] = useState('');
  const [cloneFromExisting, setCloneFromExisting] = useState(true);
  const [sourceRef, setSourceRef] = useState(currentPath || (allReferences[0] ? allReferences[0].relativePath : ''));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const getAllDirectories = (nodes, currentPath = '') => {
    let dirs = [];
    for (const node of nodes) {
      if (node.type === 'directory') {
        const fullRel = currentPath ? `${currentPath}/${node.name}` : node.name;
        dirs.push(fullRel);
        if (node.children) {
          dirs = dirs.concat(getAllDirectories(node.children, fullRel));
        }
      }
    }
    return dirs;
  };

  const availableDirs = getAllDirectories(tree || []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!refCode.trim()) {
      setError('Please provide a reference code');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onCreateReference({
        targetDir,
        refCode: refCode.trim(),
        sourceRef: cloneFromExisting ? sourceRef : null
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create reference file');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg w-full max-w-lg shadow-xl overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Create New CV Reference</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3.5">
          {error && (
            <div className="p-2.5 rounded bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900/60 text-red-800 dark:text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Folder */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
              <Folder className="w-3.5 h-3.5 text-zinc-500" />
              <span>Category / Folder</span>
            </label>
            <select
              value={targetDir}
              onChange={(e) => setTargetDir(e.target.value)}
              className="bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 rounded p-1.5 text-xs focus:outline-none focus:border-zinc-500"
            >
              {availableDirs.map(d => (
                <option key={d} value={d}>
                  domains/{d}
                </option>
              ))}
            </select>
          </div>

          {/* Code */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Reference Code
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={refCode}
                onChange={(e) => setRefCode(e.target.value)}
                placeholder="e.g. R-9999"
                className="flex-1 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 rounded p-1.5 text-xs font-mono focus:outline-none focus:border-zinc-500"
                autoFocus
              />
              <span className="text-xs font-mono text-zinc-400">.tex</span>
            </div>
          </div>

          {/* Clone */}
          <div className="p-3 rounded bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-2.5">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={cloneFromExisting}
                onChange={(e) => setCloneFromExisting(e.target.checked)}
                className="rounded border-zinc-300 dark:border-zinc-700 text-zinc-900 focus:ring-zinc-500"
              />
              <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200 flex items-center gap-1">
                <Copy className="w-3.5 h-3.5 text-zinc-500" />
                <span>Copy variables from an existing reference</span>
              </span>
            </label>

            {cloneFromExisting && (
              <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <label className="text-[11px] text-zinc-500 dark:text-zinc-400 block mb-1">
                  Source Template:
                </label>
                <select
                  value={sourceRef}
                  onChange={(e) => setSourceRef(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 rounded p-1.5 text-xs font-mono focus:outline-none focus:border-zinc-500"
                >
                  {(allReferences || []).map(r => (
                    <option key={r.relativePath} value={r.relativePath}>
                      {r.relativePath}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-750 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700 text-xs font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-3.5 py-1.5 rounded bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-white text-white dark:text-zinc-900 text-xs font-medium transition disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Reference'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
