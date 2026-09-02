import React, { useState } from 'react';
import { X, FolderPlus, Folder, AlertCircle } from 'lucide-react';

export default function NewFolderModal({
  isOpen,
  onClose,
  tree,
  onCreateFolder
}) {
  if (!isOpen) return null;

  const [parentPath, setParentPath] = useState('');
  const [folderName, setFolderName] = useState('');
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
    if (!folderName.trim()) {
      setError('Please provide a folder name');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onCreateFolder({
        parentPath,
        folderName: folderName.trim()
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create folder');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg w-full max-w-md shadow-xl overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderPlus className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Create New Folder</h3>
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

          {/* Location */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
              <Folder className="w-3.5 h-3.5 text-zinc-500" />
              <span>Parent Location</span>
            </label>
            <select
              value={parentPath}
              onChange={(e) => setParentPath(e.target.value)}
              className="bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 rounded p-1.5 text-xs focus:outline-none focus:border-zinc-500"
            >
              <option value="">(Root: domains/)</option>
              {availableDirs.map(d => (
                <option key={d} value={d}>
                  domains/{d}
                </option>
              ))}
            </select>
          </div>

          {/* Name */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Folder Name
            </label>
            <input
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="e.g. boutique, generic, Wavestone"
              className="bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 rounded p-1.5 text-xs focus:outline-none focus:border-zinc-500"
              autoFocus
            />
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
              {isSubmitting ? 'Creating...' : 'Create Folder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
