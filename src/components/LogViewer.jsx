import React from 'react';
import { Terminal, AlertCircle, Copy } from 'lucide-react';

export default function LogViewer({ log, error, errors = [], compileDuration }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopyLog = () => {
    if (!log) return;
    navigator.clipboard.writeText(log);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-50 dark:bg-zinc-950 overflow-hidden font-mono transition-colors">
      {/* Log Header */}
      <div className="p-2.5 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
          <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
            Build Output
          </span>
          {compileDuration !== undefined && (
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
              ({compileDuration}ms)
            </span>
          )}
        </div>

        <button
          onClick={handleCopyLog}
          className="flex items-center gap-1 px-2 py-0.5 rounded bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700 text-xs transition"
        >
          <Copy className="w-3 h-3" />
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>

      {/* Errors */}
      {errors && errors.length > 0 && (
        <div className="p-2.5 bg-red-50 dark:bg-red-950/60 border-b border-red-200 dark:border-red-900/60 shrink-0 space-y-1">
          <div className="flex items-center gap-1 text-red-800 dark:text-red-300 text-xs font-semibold">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Errors ({errors.length}):</span>
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {errors.map((err, i) => (
              <div key={i} className="text-[11px] text-red-700 dark:text-red-300 bg-white dark:bg-zinc-900 p-1 rounded border border-red-200 dark:border-red-900/60">
                <span className="font-semibold">{err.message}</span>
                {err.line && <span className="text-red-500 dark:text-red-400 ml-1.5">(Line {err.line})</span>}
                {err.context && <div className="text-[10px] text-red-600 dark:text-red-400 mt-0.5">{err.context}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Log text */}
      <div className="flex-1 p-3 overflow-auto bg-zinc-900 dark:bg-black text-zinc-200 dark:text-zinc-300 text-[11px] leading-relaxed whitespace-pre-wrap select-text">
        {log || 'No compilation output yet.'}
      </div>
    </div>
  );
}
