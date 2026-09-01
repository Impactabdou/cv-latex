import React, { useState, useEffect } from 'react';
import { TargetingDashboard } from './components/TargetingDashboard';
import { TaxonomyManager } from './components/TaxonomyManager';
import { LiveEditorWithPdfPreview } from './components/LiveEditorWithPdfPreview';
import { fetchStructure, FileNode } from './api';
import {
  Target,
  FolderTree,
  SlidersHorizontal,
  FileText,
  FileCode,
  X,
  AlertCircle
} from 'lucide-react';

type AppModule = 'targeting' | 'taxonomy' | 'editor';

export function App() {
  const [activeModule, setActiveModule] = useState<AppModule>('targeting');
  const [fileTree, setFileTree] = useState<FileNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Selection state
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

  const loadStructure = async () => {
    try {
      setLoading(true);
      const tree = await fetchStructure();
      setFileTree(tree);
      setError(null);
      
      // Select default files if nothing selected
      if (selectedFiles.length === 0) {
        // Try generic by default
        const genericDir = tree.children?.find(c => c.name === 'generic');
        if (genericDir) {
          const files = genericDir.children?.filter(c => c.type === 'file').map(f => f.path) || [];
          setSelectedFiles(files);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load structure');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStructure();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 selection:bg-blue-600 selection:text-white">
      {/* Top Application Header with 3 Core Modules Navigation */}
      <header className="no-print bg-slate-900/95 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40 px-3 sm:px-6 py-2.5 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-600/30 font-bold">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-sm font-extrabold tracking-tight text-white leading-none">
                  LaTeX CV Manager
                </h1>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  Compilation LaTeX 100% Native
                </p>
              </div>
            </div>
          </div>

          {/* Module Navigation Tabs (Strict 3 Modules) */}
          <nav className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs w-full md:w-auto overflow-x-auto">
            <button
              onClick={() => setActiveModule('targeting')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap cursor-pointer ${
                activeModule === 'targeting' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              <span>1. Présentation & Ciblage</span>
            </button>
            <button
              onClick={() => setActiveModule('taxonomy')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap cursor-pointer ${
                activeModule === 'taxonomy' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <FolderTree className="w-3.5 h-3.5" />
              <span>2. Structure & Taxonomie</span>
            </button>
            <button
              onClick={() => setActiveModule('editor')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap cursor-pointer ${
                activeModule === 'editor' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>3. Éditeur & Rendu Direct</span>
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 md:p-6 flex flex-col min-h-0">
        {loading && (
          <div className="flex justify-center items-center h-64 text-slate-400">
            Chargement de l'arborescence...
          </div>
        )}
        
        {error && (
          <div className="p-4 bg-red-900/50 border border-red-500/50 rounded-lg text-red-200 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <span>Erreur: {error}</span>
          </div>
        )}

        {!loading && !error && fileTree && (
          <>
            {activeModule === 'targeting' && (
              <TargetingDashboard
                fileTree={fileTree}
                selectedFiles={selectedFiles}
                onSelectFiles={setSelectedFiles}
                onOpenEditor={() => setActiveModule('editor')}
              />
            )}

            {activeModule === 'taxonomy' && (
              <TaxonomyManager
                fileTree={fileTree}
                onRefresh={loadStructure}
              />
            )}

            {activeModule === 'editor' && (
              <LiveEditorWithPdfPreview
                selectedFiles={selectedFiles}
                onRefreshTree={loadStructure}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
export default App;
