import React, { useState, useEffect, useRef, useCallback } from 'react';
import { fetchFileContent, updateEntity, compileLatex, fetchLatexVersion } from '../api';
import { FileText, Save, AlertCircle, Loader2, CheckCircle2, Download, RefreshCw } from 'lucide-react';

interface Props {
  selectedFiles: string[];
  onRefreshTree: () => void;
}

export function LiveEditorWithPdfPreview({ selectedFiles, onRefreshTree }: Props) {
  const [fileContents, setFileContents] = useState<Record<string, string>>({});
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [compiling, setCompiling] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [compileError, setCompileError] = useState<string | null>(null);
  const [lastCompiledAt, setLastCompiledAt] = useState<Date | null>(null);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastVersionRef = useRef<string>('');

  // Auto-compilation core logic
  const triggerAutoCompilation = useCallback(async (currentContents: Record<string, string>, paths: string[]) => {
    if (paths.length === 0) return;
    setCompiling(true);
    setCompileError(null);

    try {
      const blob = await compileLatex({
        selectedPaths: paths,
        overrides: currentContents
      });
      const url = URL.createObjectURL(blob);
      setPdfUrl(prevUrl => {
        if (prevUrl) URL.revokeObjectURL(prevUrl);
        return url;
      });
      setLastCompiledAt(new Date());
    } catch (err: any) {
      setCompileError(err.message || 'Erreur de compilation LaTeX');
    } finally {
      setCompiling(false);
    }
  }, []);

  // Initial load of files & immediate compilation at first
  useEffect(() => {
    let isMounted = true;
    const loadAndCompileFirst = async () => {
      setLoading(true);
      const contents: Record<string, string> = {};
      for (const path of selectedFiles) {
        try {
          const content = await fetchFileContent(path);
          contents[path] = content;
        } catch (e) {
          console.error("Failed to load", path);
        }
      }
      if (!isMounted) return;
      setFileContents(contents);
      if (selectedFiles.length > 0) setActiveFile(selectedFiles[0]);
      setLoading(false);

      // Automatic compilation at first
      triggerAutoCompilation(contents, selectedFiles);
    };

    if (selectedFiles.length > 0) {
      loadAndCompileFirst();
    }

    return () => {
      isMounted = false;
    };
  }, [selectedFiles, triggerAutoCompilation]);

  // Handle content edits with debounced automatic recompilation
  const handleContentChange = (content: string) => {
    if (!activeFile) return;
    const updated = { ...fileContents, [activeFile]: content };
    setFileContents(updated);

    // Debounce re-compilation on modification
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      triggerAutoCompilation(updated, selectedFiles);
    }, 700);
  };

  const handleSave = async () => {
    if (!activeFile) return;
    setSaving(true);
    try {
      await updateEntity(activeFile, 'file', fileContents[activeFile]);
      // Re-trigger compilation on explicit save
      triggerAutoCompilation(fileContents, selectedFiles);
    } catch (e) {
      alert("Erreur lors de la sauvegarde.");
    } finally {
      setSaving(false);
    }
  };

  // Poll for external file modifications in public/latex to recompile automatically
  useEffect(() => {
    const checkVersion = async () => {
      const v = await fetchLatexVersion();
      if (v && lastVersionRef.current && v !== lastVersionRef.current) {
        // Files changed on disk, recompile
        triggerAutoCompilation(fileContents, selectedFiles);
      }
      if (v) lastVersionRef.current = v;
    };

    const interval = setInterval(checkVersion, 3500);
    return () => clearInterval(interval);
  }, [fileContents, selectedFiles, triggerAutoCompilation]);

  if (selectedFiles.length === 0) {
    return (
      <div className="flex justify-center items-center h-64 text-slate-400 bg-slate-900 rounded-xl border border-slate-800">
        Veuillez sélectionner des fichiers dans le Module 1.
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-120px)] min-h-[600px]">
      {/* Editor Section */}
      <div className="flex-1 flex flex-col bg-slate-900 border border-slate-800 rounded-xl shadow-lg overflow-hidden">
        {/* File tabs */}
        <div className="flex items-center justify-between p-2 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-2 overflow-x-auto">
            {selectedFiles.map(path => (
              <button
                key={path}
                onClick={() => setActiveFile(path)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono whitespace-nowrap transition-colors ${
                  activeFile === path ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                {path.split('/').pop()}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs pr-2">
            {compiling ? (
              <span className="flex items-center gap-1.5 text-blue-400 font-medium animate-pulse">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Recompilation...
              </span>
            ) : compileError ? (
              <span className="flex items-center gap-1 text-red-400 font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                Erreur syntaxe
              </span>
            ) : (
              <span className="flex items-center gap-1 text-emerald-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                À jour
              </span>
            )}
          </div>
        </div>
        
        {/* Editor Area */}
        <div className="flex-1 p-4 relative">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : (
            <textarea
              value={activeFile ? fileContents[activeFile] || '' : ''}
              onChange={(e) => handleContentChange(e.target.value)}
              className="w-full h-full bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-sm text-slate-300 resize-none focus:outline-none focus:border-blue-500"
              spellCheck={false}
              placeholder="Variables et code LaTeX..."
            />
          )}
        </div>

        {/* Action bar (No manual compile button - compilation is automatic) */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex justify-between items-center text-xs">
          <button
            onClick={handleSave}
            disabled={saving || !activeFile}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </button>

          <div className="flex items-center gap-3 text-slate-400 font-mono">
            {lastCompiledAt && (
              <span>Dernière compilation : {lastCompiledAt.toLocaleTimeString()}</span>
            )}
            {pdfUrl && (
              <a
                href={pdfUrl}
                download="Abderrahmene_KABAR_cv.pdf"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded-lg transition-colors font-sans"
              >
                <Download className="w-3.5 h-3.5" />
                Télécharger PDF
              </a>
            )}
          </div>
        </div>
      </div>

      {/* PDF Viewer Section with Live Auto-Rendering */}
      <div className="flex-1 flex flex-col bg-slate-900 border border-slate-800 rounded-xl shadow-lg overflow-hidden relative">
        <div className="p-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs px-4">
          <span className="font-semibold text-slate-300 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-400" />
            Aperçu PDF Direct (Compilé à la volée)
          </span>
          {compiling && (
            <span className="text-blue-400 flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              Génération du PDF...
            </span>
          )}
        </div>

        <div className="flex-1 relative">
          {compileError ? (
            <div className="absolute inset-0 p-6 flex flex-col items-center justify-center text-center bg-slate-950/90 overflow-auto">
              <AlertCircle className="w-12 h-12 text-red-500 mb-3" />
              <h3 className="text-base font-bold text-red-400 mb-2">Erreur de Compilation LaTeX</h3>
              <pre className="bg-slate-900 border border-red-900/50 p-4 rounded-lg text-xs text-red-300 whitespace-pre-wrap max-w-full text-left font-mono max-h-80 overflow-auto">
                {compileError}
              </pre>
            </div>
          ) : pdfUrl ? (
            <iframe 
              src={pdfUrl} 
              className="w-full h-full border-none bg-white"
              title="Aperçu PDF CV"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 p-6 text-center">
              <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-3" />
              <p className="text-sm font-medium text-slate-300">Compilation initiale automatique en cours...</p>
              <p className="text-xs text-slate-500 mt-1">Le PDF apparaîtra automatiquement dès la première compilation.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

