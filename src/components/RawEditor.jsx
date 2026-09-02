import React from 'react';
import { FileCode, Save, RefreshCw } from 'lucide-react';

export default function RawEditor({
  rawTex,
  onRawTexChange,
  onSaveRaw,
  isSaving,
  selectedPath
}) {
  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-50 dark:bg-zinc-950 overflow-hidden transition-colors">
      {/* Raw Editor Toolbar */}
      <div className="p-2.5 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <FileCode className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
          <span className="text-xs font-mono font-semibold text-zinc-800 dark:text-zinc-200">
            {selectedPath ? selectedPath.split('/').pop() : 'LaTeX Source'}
          </span>
          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">
            (.tex)
          </span>
        </div>

        <button
          type="button"
          onClick={onSaveRaw}
          disabled={isSaving}
          className="flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-white text-white dark:text-zinc-900 text-xs font-medium transition disabled:opacity-50"
        >
          {isSaving ? (
            <RefreshCw className="w-3 h-3 animate-spin" />
          ) : (
            <Save className="w-3 h-3" />
          )}
          <span>Save & Compile</span>
        </button>
      </div>

      {/* Code Textarea */}
      <div className="flex-1 p-2.5 overflow-hidden flex bg-zinc-50 dark:bg-zinc-950">
        <textarea
          value={rawTex || ''}
          onChange={(e) => onRawTexChange(e.target.value)}
          spellCheck={false}
          className="w-full h-full bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-mono text-xs p-3 rounded border border-zinc-300 dark:border-zinc-700 focus:border-zinc-500 dark:focus:border-zinc-400 focus:outline-none resize-none leading-relaxed"
          placeholder="% Raw LaTeX \newcommand definitions..."
        />
      </div>
    </div>
  );
}
