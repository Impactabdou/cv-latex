import React, { useState } from 'react';
import {
  X,
  Folder,
  FileText,
  Trash2,
  Edit2,
  FolderTree,
  FolderPlus,
  FilePlus,
  Plus,
  Copy,
  AlertCircle,
  ChevronRight,
  ChevronDown,
  Check
} from 'lucide-react';

export default function ManageTreeModal({
  isOpen,
  onClose,
  tree,
  allReferences = [],
  selectedPath,
  onSelectPath,
  onRenameItem,
  onDeleteItem,
  onCreateFolder,
  onCreateReference
}) {
  if (!isOpen) return null;

  const [expandedFolders, setExpandedFolders] = useState({});
  const [editingItem, setEditingItem] = useState(null);
  const [newName, setNewName] = useState('');
  
  // Inline Creation State
  const [creatingFolderUnder, setCreatingFolderUnder] = useState(null); // parent relativePath or '' for root
  const [newFolderName, setNewFolderName] = useState('');

  const [creatingRefUnder, setCreatingRefUnder] = useState(null); // target directory relativePath
  const [newRefCode, setNewRefCode] = useState('');
  const [cloneFromExisting, setCloneFromExisting] = useState(true);
  const [sourceRef, setSourceRef] = useState(selectedPath || (allReferences[0] ? allReferences[0].relativePath : ''));

  const [error, setError] = useState(null);
  const [isBusy, setIsBusy] = useState(false);

  const toggleFolder = (path) => {
    setExpandedFolders(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  const handleStartRename = (item) => {
    setEditingItem(item.relativePath);
    setNewName(item.name.replace(/\.tex$/, ''));
    setCreatingFolderUnder(null);
    setCreatingRefUnder(null);
  };

  const handleSaveRename = async (item) => {
    if (!newName.trim()) return;
    try {
      setIsBusy(true);
      setError(null);
      await onRenameItem({
        relativePath: item.relativePath,
        newName: newName.trim()
      });
      setEditingItem(null);
    } catch (err) {
      setError(err.message || 'Failed to rename item');
    } finally {
      setIsBusy(false);
    }
  };

  const handleDelete = async (item) => {
    const isDir = item.type === 'directory';
    const confirmMsg = isDir
      ? `Delete folder "${item.name}" and all its contents?`
      : `Delete reference "${item.name}"?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      setIsBusy(true);
      setError(null);
      await onDeleteItem({ relativePath: item.relativePath });
    } catch (err) {
      setError(err.message || 'Failed to delete item');
    } finally {
      setIsBusy(false);
    }
  };

  // Trigger inline create folder under a specific directory
  const handleStartCreateFolder = (parentPath) => {
    setCreatingFolderUnder(parentPath);
    setNewFolderName('');
    setCreatingRefUnder(null);
    setEditingItem(null);
    setError(null);
    if (parentPath) {
      setExpandedFolders(prev => ({ ...prev, [parentPath]: true }));
    }
  };

  const handleSaveCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      setIsBusy(true);
      setError(null);
      await onCreateFolder({
        parentPath: creatingFolderUnder || '',
        folderName: newFolderName.trim()
      });
      setCreatingFolderUnder(null);
      setNewFolderName('');
    } catch (err) {
      setError(err.message || 'Failed to create folder');
    } finally {
      setIsBusy(false);
    }
  };

  // Trigger inline create reference under a specific directory
  const handleStartCreateRef = (targetDir) => {
    setCreatingRefUnder(targetDir);
    setNewRefCode('');
    setCreatingFolderUnder(null);
    setEditingItem(null);
    setError(null);
    if (targetDir) {
      setExpandedFolders(prev => ({ ...prev, [targetDir]: true }));
    }
  };

  const handleSaveCreateRef = async () => {
    if (!newRefCode.trim()) {
      setError('Please provide a reference code');
      return;
    }
    try {
      setIsBusy(true);
      setError(null);
      await onCreateReference({
        targetDir: creatingRefUnder,
        refCode: newRefCode.trim(),
        sourceRef: cloneFromExisting ? sourceRef : null
      });
      setCreatingRefUnder(null);
      setNewRefCode('');
    } catch (err) {
      setError(err.message || 'Failed to create reference');
    } finally {
      setIsBusy(false);
    }
  };

  const renderTreeNodes = (nodes, depth = 0) => {
    return (nodes || []).map((node) => {
      const isDir = node.type === 'directory';
      const isExpanded = expandedFolders[node.relativePath] !== false;
      const isEditing = editingItem === node.relativePath;
      const isSelected = selectedPath === node.relativePath;
      const isCreatingFolderHere = creatingFolderUnder === node.relativePath;
      const isCreatingRefHere = creatingRefUnder === node.relativePath;

      return (
        <div key={node.relativePath} className="flex flex-col">
          <div
            className={`flex items-center justify-between py-1 px-2 rounded group transition text-xs select-none ${
              isSelected
                ? 'bg-zinc-200 dark:bg-zinc-800 font-medium'
                : 'hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
            }`}
            style={{ paddingLeft: `${depth * 18 + 8}px` }}
          >
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              {isDir ? (
                <button
                  type="button"
                  onClick={() => toggleFolder(node.relativePath)}
                  className="p-0.5 text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5" />
                  )}
                </button>
              ) : (
                <span className="w-3.5" />
              )}

              {isDir ? (
                <Folder className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400 shrink-0" />
              ) : (
                <FileText className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400 shrink-0" />
              )}

              {isEditing ? (
                <div className="flex items-center gap-1 flex-1 py-0.5">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="bg-white dark:bg-zinc-950 border border-zinc-400 dark:border-zinc-700 rounded px-1.5 py-0.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
                    autoFocus
                  />
                  <button
                    onClick={() => handleSaveRename(node)}
                    disabled={isBusy}
                    className="px-1.5 py-0.5 rounded bg-zinc-900 dark:bg-zinc-100 text-[10px] text-white dark:text-zinc-900 font-medium"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingItem(null)}
                    className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 text-[10px] text-zinc-700 dark:text-zinc-200"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <span
                  onClick={() => {
                    if (!isDir) {
                      onSelectPath(node.relativePath);
                      onClose();
                    } else {
                      toggleFolder(node.relativePath);
                    }
                  }}
                  className={`truncate font-mono ${
                    !isDir
                      ? 'text-zinc-800 dark:text-zinc-200 hover:text-black dark:hover:text-white cursor-pointer'
                      : 'text-zinc-700 dark:text-zinc-300 font-medium cursor-pointer'
                  }`}
                >
                  {node.name}
                </span>
              )}
            </div>

            {/* Actions for this node */}
            {!isEditing && (
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition shrink-0 ml-2">
                {isDir && (
                  <>
                    {/* Add Folder Inside */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartCreateFolder(node.relativePath);
                      }}
                      className="p-1 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded transition"
                      title="Add subfolder here"
                    >
                      <FolderPlus className="w-3.5 h-3.5" />
                    </button>

                    {/* Add CV Reference Inside */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartCreateRef(node.relativePath);
                      }}
                      className="p-1 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded transition"
                      title="Add new CV reference in this folder"
                    >
                      <FilePlus className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartRename(node);
                  }}
                  className="p-1 text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 rounded transition"
                  title="Rename"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(node);
                  }}
                  className="p-1 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 rounded transition"
                  title="Delete"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Inline Folder Creation Form directly under this directory */}
          {isDir && isCreatingFolderHere && (
            <div
              className="py-1.5 px-2 my-1 rounded bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 flex items-center gap-1.5"
              style={{ marginLeft: `${(depth + 1) * 18 + 8}px` }}
            >
              <FolderPlus className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveCreateFolder();
                  if (e.key === 'Escape') setCreatingFolderUnder(null);
                }}
                placeholder="New subfolder name..."
                className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded px-1.5 py-0.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
                autoFocus
              />
              <button
                type="button"
                onClick={handleSaveCreateFolder}
                disabled={isBusy}
                className="px-2 py-0.5 rounded bg-zinc-900 dark:bg-zinc-100 text-[10px] text-white dark:text-zinc-900 font-medium disabled:opacity-50"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => setCreatingFolderUnder(null)}
                className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-[10px] text-zinc-700 dark:text-zinc-300"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Inline CV Reference Creation Form directly under this directory */}
          {isDir && isCreatingRefHere && (
            <div
              className="p-2.5 my-1.5 rounded bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 space-y-2"
              style={{ marginLeft: `${(depth + 1) * 18 + 8}px` }}
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                <FilePlus className="w-3.5 h-3.5 text-zinc-500" />
                <span>New CV Reference in <code className="font-mono text-[11px] font-normal text-zinc-500">{node.name}</code></span>
              </div>

              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={newRefCode}
                  onChange={(e) => setNewRefCode(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveCreateRef();
                    if (e.key === 'Escape') setCreatingRefUnder(null);
                  }}
                  placeholder="e.g. R-1099, Loick..."
                  className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded px-2 py-1 text-xs text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none"
                  autoFocus
                />
                <span className="text-xs font-mono text-zinc-400">.tex</span>
              </div>

              <div className="space-y-1.5 pt-1 border-t border-zinc-200 dark:border-zinc-800">
                <label className="flex items-center gap-1.5 cursor-pointer text-xs text-zinc-700 dark:text-zinc-300">
                  <input
                    type="checkbox"
                    checked={cloneFromExisting}
                    onChange={(e) => setCloneFromExisting(e.target.checked)}
                    className="rounded border-zinc-300 dark:border-zinc-700 text-zinc-900 focus:ring-zinc-500"
                  />
                  <span>Clone variables from existing CV</span>
                </label>

                {cloneFromExisting && (
                  <select
                    value={sourceRef}
                    onChange={(e) => setSourceRef(e.target.value)}
                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded px-1.5 py-1 text-xs text-zinc-800 dark:text-zinc-200 font-mono focus:outline-none"
                  >
                    {allReferences.map(r => (
                      <option key={r.relativePath} value={r.relativePath}>
                        {r.relativePath}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex items-center justify-end gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => setCreatingRefUnder(null)}
                  className="px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-[10px] text-zinc-700 dark:text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveCreateRef}
                  disabled={isBusy}
                  className="px-2.5 py-0.5 rounded bg-zinc-900 dark:bg-zinc-100 text-[10px] text-white dark:text-zinc-900 font-medium disabled:opacity-50"
                >
                  Create & Open
                </button>
              </div>
            </div>
          )}

          {isDir && isExpanded && node.children && (
            <div className="flex flex-col">
              {renderTreeNodes(node.children, depth + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg w-full max-w-xl shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header with Title & Root Folder Creation */}
        <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <FolderTree className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Files & Categories Explorer
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {/* Root Add Domain / Folder Button */}
            <button
              type="button"
              onClick={() => handleStartCreateFolder('')}
              className="flex items-center gap-1 px-2 py-1 rounded bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700 text-xs font-medium transition"
              title="Create a new root domain"
            >
              <FolderPlus className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
              <span>+ Root Domain</span>
            </button>

            <button
              onClick={onClose}
              className="p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Error notification */}
        {error && (
          <div className="p-2.5 mx-4 mt-3 rounded bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900/60 text-red-800 dark:text-red-300 text-xs flex items-center gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Root-level folder creator if active */}
        {creatingFolderUnder === '' && (
          <div className="p-3 mx-4 mt-3 rounded bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 flex items-center gap-2 shrink-0">
            <FolderPlus className="w-4 h-4 text-zinc-500 shrink-0" />
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveCreateFolder();
                if (e.key === 'Escape') setCreatingFolderUnder(null);
              }}
              placeholder="New root domain name (e.g. consulting, banks, tech)..."
              className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded px-2 py-1 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
              autoFocus
            />
            <button
              type="button"
              onClick={handleSaveCreateFolder}
              disabled={isBusy}
              className="px-2.5 py-1 rounded bg-zinc-900 dark:bg-zinc-100 text-xs text-white dark:text-zinc-900 font-medium disabled:opacity-50"
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => setCreatingFolderUnder(null)}
              className="px-2 py-1 rounded bg-zinc-200 dark:bg-zinc-800 text-xs text-zinc-700 dark:text-zinc-300"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Visual Directory Tree */}
        <div className="flex-1 p-3 overflow-y-auto space-y-0.5">
          {renderTreeNodes(tree)}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0 text-xs text-zinc-500 dark:text-zinc-400">
          <div className="flex items-center gap-3">
            <span>Hover on folders to add subfolders <FolderPlus className="w-3 h-3 inline" /> or CVs <FilePlus className="w-3 h-3 inline" /></span>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700 text-xs font-medium transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
