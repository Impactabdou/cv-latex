import React, { useState, useRef } from 'react';
import {
  ZoomIn,
  ZoomOut,
  ExternalLink,
  Download,
  RefreshCw,
  AlertTriangle,
  FileText
} from 'lucide-react';

export default function PdfViewer({
  selectedPath,
  pdfTimestamp,
  isCompiling,
  compilationError,
  onRecompile,
  onDownload,
  onViewLogs
}) {
  const [zoom, setZoom] = useState(100);
  const [fitMode, setFitMode] = useState('fit-page');
  const containerRef = useRef(null);

  const handleZoomIn = () => {
    setFitMode('custom');
    setZoom(prev => Math.min(prev + 15, 250));
  };

  const handleZoomOut = () => {
    setFitMode('custom');
    setZoom(prev => Math.max(prev - 15, 40));
  };

  const handleResetZoom = () => {
    setFitMode('fit-page');
    setZoom(100);
  };

  const handleFitWidth = () => {
    setFitMode('fit-width');
    setZoom(120);
  };

  const pdfUrl = selectedPath
    ? `/api/ref/pdf?path=${encodeURIComponent(selectedPath)}&t=${pdfTimestamp}`
    : null;

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-200 dark:bg-zinc-950 border-r border-zinc-300 dark:border-zinc-800 relative overflow-hidden select-none transition-colors">
      {/* Top PDF Controls Toolbar */}
      <div className="h-10 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-3 flex items-center justify-between z-10">
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded p-0.5">
            <button
              onClick={handleZoomOut}
              className="p-1 rounded text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono text-zinc-700 dark:text-zinc-300 w-11 text-center font-medium">
              {zoom}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-1 rounded text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={handleResetZoom}
            className={`px-2 py-0.5 rounded text-[11px] font-medium border transition ${
              fitMode === 'fit-page'
                ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-300 dark:border-zinc-700'
                : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 border-zinc-200 dark:border-zinc-800'
            }`}
          >
            Fit Page
          </button>

          <button
            onClick={handleFitWidth}
            className={`px-2 py-0.5 rounded text-[11px] font-medium border transition ${
              fitMode === 'fit-width'
                ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-300 dark:border-zinc-700'
                : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 border-zinc-200 dark:border-zinc-800'
            }`}
          >
            Fit Width
          </button>
        </div>

        {/* Right PDF actions */}
        <div className="flex items-center gap-1">
          {pdfUrl && (
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 rounded text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
              title="Open in new tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
          <button
            onClick={onDownload}
            className="p-1 rounded text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            title="Download PDF"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRecompile}
            disabled={isCompiling}
            className="p-1 rounded text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition disabled:opacity-50"
            title="Reload"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isCompiling ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error Overlay */}
      {compilationError && (
        <div className="bg-red-50 dark:bg-red-950/70 border-b border-red-200 dark:border-red-900/60 px-3 py-2 flex items-start justify-between z-20">
          <div className="flex items-start gap-2 max-w-[85%]">
            <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-red-900 dark:text-red-200">
                Compilation Error
              </p>
              <p className="text-[11px] text-red-700 dark:text-red-300 font-mono mt-0.5 break-all">
                {compilationError.error || 'LaTeX build failed'}
              </p>
            </div>
          </div>
          <button
            onClick={onViewLogs}
            className="px-2 py-0.5 rounded bg-white dark:bg-red-900/40 hover:bg-red-100 dark:hover:bg-red-900/70 border border-red-300 dark:border-red-800 text-[11px] font-medium text-red-800 dark:text-red-200 transition shrink-0"
          >
            View Logs
          </button>
        </div>
      )}

      {/* PDF Container */}
      <div
        ref={containerRef}
        className="flex-1 w-full h-full relative overflow-auto flex items-center justify-center p-3 bg-zinc-200/90 dark:bg-zinc-950"
      >
        {isCompiling && (
          <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 px-2.5 py-1 rounded text-xs shadow-sm">
            <RefreshCw className="w-3 h-3 animate-spin text-zinc-600 dark:text-zinc-400" />
            <span>Compiling...</span>
          </div>
        )}

        {pdfUrl ? (
          <div
            className="origin-top h-full w-full flex items-center justify-center"
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'center top'
            }}
          >
            <iframe
              key={pdfUrl}
              src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=1&view=Fit`}
              title="Compiled PDF"
              className="w-full h-full rounded border border-zinc-400/80 dark:border-zinc-800 bg-white shadow-md"
            />
          </div>
        ) : (
          <div className="text-center p-8">
            <FileText className="w-10 h-10 text-zinc-400 dark:text-zinc-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">No reference selected</p>
          </div>
        )}
      </div>
    </div>
  );
}
