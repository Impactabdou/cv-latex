import React, { useState, useEffect, useRef, useCallback } from 'react';
import Header from './components/Header.jsx';
import PdfViewer from './components/PdfViewer.jsx';
import FormEditor from './components/FormEditor.jsx';
import YamlEditor from './components/YamlEditor.jsx';
import RawEditor from './components/RawEditor.jsx';
import LogViewer from './components/LogViewer.jsx';
import NewReferenceModal from './components/Modals/NewReferenceModal.jsx';
import NewFolderModal from './components/Modals/NewFolderModal.jsx';
import ManageTreeModal from './components/Modals/ManageTreeModal.jsx';
import {
  FileText,
  FileCode,
  FileSpreadsheet,
  Terminal,
  GripVertical
} from 'lucide-react';

export default function App() {
  // Tree & Navigation State
  const [tree, setTree] = useState([]);
  const [allReferences, setAllReferences] = useState([]);
  const [schema, setSchema] = useState([]);
  const [selectedPath, setSelectedPath] = useState(null);

  // Editor Data State
  const [variables, setVariables] = useState({});
  const [extraVariables, setExtraVariables] = useState([]);
  const [rawTex, setRawTex] = useState('');
  const [activeTab, setActiveTab] = useState('form'); // 'form' | 'raw' | 'logs'

  // Compilation & Status State
  const [isCompiling, setIsCompiling] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState('idle'); // 'idle' | 'saving' | 'compiling' | 'success' | 'error'
  const [compilationError, setCompilationError] = useState(null);
  const [compileDuration, setCompileDuration] = useState(0);
  const [logContent, setLogContent] = useState('');
  const [pdfTimestamp, setPdfTimestamp] = useState(Date.now());

  // Theme Management ('system' | 'light' | 'dark')
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('cv_editor_theme') || 'system';
  });

  useEffect(() => {
    const applyTheme = () => {
      const isDark =
        theme === 'dark' ||
        (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    applyTheme();

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') applyTheme();
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme(prev => {
      let next = 'system';
      if (prev === 'system') next = 'dark';
      else if (prev === 'dark') next = 'light';
      else if (prev === 'light') next = 'system';
      localStorage.setItem('cv_editor_theme', next);
      return next;
    });
  };

  // UI Modals & Split Layout State
  const [isNewRefModalOpen, setIsNewRefModalOpen] = useState(false);
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
  const [isTreeModalOpen, setIsTreeModalOpen] = useState(false);
  const [splitRatio, setSplitRatio] = useState(50); // percentage for left pane width
  const isDraggingSplitter = useRef(false);

  // Debounce timer reference
  const debounceTimerRef = useRef(null);

  // 1. Initial Load: Fetch Tree and Schema
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [treeRes, schemaRes] = await Promise.all([
          fetch('/api/tree').then(r => r.json()),
          fetch('/api/schema').then(r => r.json())
        ]);

        if (treeRes.success) {
          setTree(treeRes.tree);
          setAllReferences(treeRes.allReferences);

          // Select first reference if available
          if (treeRes.allReferences && treeRes.allReferences.length > 0) {
            // Prefer Deloitte R-1099 if available, else first
            const deloitteRef = treeRes.allReferences.find(r => r.relativePath.includes('R-1099'));
            const initialRef = deloitteRef ? deloitteRef.relativePath : treeRes.allReferences[0].relativePath;
            setSelectedPath(initialRef);
          }
        }

        if (schemaRes.success) {
          setSchema(schemaRes.schema);
        }
      } catch (err) {
        console.error('Failed to load initial data:', err);
      }
    };

    fetchInitialData();
  }, []);

  // 2. Load Reference Data when selectedPath changes
  useEffect(() => {
    if (!selectedPath) return;

    let isMounted = true;
    const loadRefData = async () => {
      try {
        setIsCompiling(true);
        setStatus('compiling');
        setCompilationError(null);

        const res = await fetch(`/api/ref/data?path=${encodeURIComponent(selectedPath)}`);
        const data = await res.json();

        if (data.success && isMounted) {
          setVariables(data.variables || {});
          setExtraVariables(data.extraVariables || []);
          setRawTex(data.rawTex || '');

          // Compile immediately upon selection
          const compRes = await fetch('/api/ref/compile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ relativePath: selectedPath, force: false })
          });
          const compData = await compRes.json();

          if (isMounted) {
            setIsCompiling(false);
            setCompileDuration(compData.durationMs || 0);
            setLogContent(compData.log || '');

            if (compData.success) {
              setStatus('success');
              setCompilationError(null);
              setPdfTimestamp(Date.now());
            } else {
              setStatus('error');
              setCompilationError(compData);
            }
          }
        }
      } catch (err) {
        if (isMounted) {
          setIsCompiling(false);
          setStatus('error');
          setCompilationError({ error: err.message });
        }
      }
    };

    loadRefData();

    return () => {
      isMounted = false;
    };
  }, [selectedPath]);

  // 3. Save & Compile Logic (Debounced for Form inputs)
  const triggerSaveAndCompile = useCallback((updatedVars, updatedExtras, currentRelPath) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    setStatus('saving');
    setIsSaving(true);

    debounceTimerRef.current = setTimeout(async () => {
      try {
        setStatus('compiling');
        setIsCompiling(true);

        const res = await fetch('/api/ref/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            relativePath: currentRelPath,
            variables: updatedVars,
            extraVariables: updatedExtras,
            compile: true
          })
        });

        const data = await res.json();
        setIsSaving(false);
        setIsCompiling(false);

        if (data.success) {
          setRawTex(data.rawTex || '');
          const comp = data.compilation;
          setCompileDuration(comp?.durationMs || 0);
          setLogContent(comp?.log || '');

          if (comp?.success) {
            setStatus('success');
            setCompilationError(null);
            setPdfTimestamp(Date.now());
          } else {
            setStatus('error');
            setCompilationError(comp);
          }
        } else {
          setStatus('error');
          setCompilationError({ error: data.error || 'Failed to save reference' });
        }
      } catch (err) {
        setIsSaving(false);
        setIsCompiling(false);
        setStatus('error');
        setCompilationError({ error: err.message });
      }
    }, 380); // 380ms debounce
  }, []);

  // Form Field Change Handler
  const handleVariableChange = (key, val) => {
    const updated = { ...variables, [key]: val };
    setVariables(updated);
    triggerSaveAndCompile(updated, extraVariables, selectedPath);
  };

  // Custom Variable Handlers
  const handleAddExtraVariable = (updatedExtras) => {
    setExtraVariables(updatedExtras);
    triggerSaveAndCompile(variables, updatedExtras, selectedPath);
  };

  const handleRemoveExtraVariable = (index) => {
    const updatedExtras = extraVariables.filter((_, i) => i !== index);
    setExtraVariables(updatedExtras);
    triggerSaveAndCompile(variables, updatedExtras, selectedPath);
  };

  // Raw LaTeX Save Handler
  const handleSaveRawTex = async () => {
    if (!selectedPath) return;
    try {
      setIsSaving(true);
      setStatus('saving');
      setIsCompiling(true);

      const res = await fetch('/api/ref/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          relativePath: selectedPath,
          rawTex,
          compile: true
        })
      });

      const data = await res.json();
      setIsSaving(false);
      setIsCompiling(false);

      if (data.success) {
        setVariables(data.variables || {});
        setExtraVariables(data.extraVariables || []);
        const comp = data.compilation;
        setCompileDuration(comp?.durationMs || 0);
        setLogContent(comp?.log || '');

        if (comp?.success) {
          setStatus('success');
          setCompilationError(null);
          setPdfTimestamp(Date.now());
        } else {
          setStatus('error');
          setCompilationError(comp);
        }
      }
    } catch (err) {
      setIsSaving(false);
      setIsCompiling(false);
      setStatus('error');
      setCompilationError({ error: err.message });
    }
  };

  // Manual Recompile
  const handleManualRecompile = async () => {
    if (!selectedPath) return;
    try {
      setIsCompiling(true);
      setStatus('compiling');
      setCompilationError(null);

      const res = await fetch('/api/ref/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ relativePath: selectedPath, force: true })
      });

      const data = await res.json();
      setIsCompiling(false);
      setCompileDuration(data.durationMs || 0);
      setLogContent(data.log || '');

      if (data.success) {
        setStatus('success');
        setCompilationError(null);
        setPdfTimestamp(Date.now());
      } else {
        setStatus('error');
        setCompilationError(data);
      }
    } catch (err) {
      setIsCompiling(false);
      setStatus('error');
      setCompilationError({ error: err.message });
    }
  };

  // Download PDF
  const handleDownload = () => {
    if (!selectedPath) return;
    window.location.href = `/api/ref/download?path=${encodeURIComponent(selectedPath)}`;
  };

  // Export YAML
  const handleExportYaml = () => {
    if (!selectedPath) return;
    window.location.href = `/api/ref/export-yaml?path=${encodeURIComponent(selectedPath)}`;
  };

  // Import / Apply YAML
  const handleImportYaml = async (yamlString) => {
    if (!selectedPath || !yamlString) return;
    setIsSaving(true);
    setStatus('saving');
    setIsCompiling(true);

    const res = await fetch('/api/ref/import-yaml', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        relativePath: selectedPath,
        yamlString,
        compile: true
      })
    });

    const data = await res.json();
    setIsSaving(false);
    setIsCompiling(false);

    if (data.success) {
      setVariables(data.variables || {});
      setExtraVariables(data.extraVariables || []);
      setRawTex(data.rawTex || '');
      const comp = data.compilation;
      setCompileDuration(comp?.durationMs || 0);
      setLogContent(comp?.log || '');

      if (comp?.success) {
        setStatus('success');
        setCompilationError(null);
        setPdfTimestamp(Date.now());
      } else {
        setStatus('error');
        setCompilationError(comp);
      }
    } else {
      setStatus('error');
      throw new Error(data.error || 'Failed to import YAML');
    }
  };

  // Create New Reference / Clone Callback
  const handleCreateReference = async ({ targetDir, refCode, sourceRef }) => {
    const res = await fetch('/api/tree/reference', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetDir, refCode, sourceRef })
    });

    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error);
    }

    setTree(data.tree);
    setAllReferences(data.allReferences);
    setSelectedPath(data.result.relativePath);
  };

  // Create Folder Callback
  const handleCreateFolder = async ({ parentPath, folderName }) => {
    const res = await fetch('/api/tree/folder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ parentPath, folderName })
    });

    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error);
    }

    setTree(data.tree);
  };

  // Rename Callback
  const handleRenameItem = async ({ relativePath, newName }) => {
    const res = await fetch('/api/tree/rename', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ relativePath, newName })
    });

    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error);
    }

    setTree(data.tree);
    setAllReferences(data.allReferences);
    if (selectedPath === relativePath) {
      setSelectedPath(data.result.newRelativePath);
    }
  };

  // Delete Callback
  const handleDeleteItem = async ({ relativePath }) => {
    const res = await fetch('/api/tree/delete', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ relativePath })
    });

    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error);
    }

    setTree(data.tree);
    setAllReferences(data.allReferences);
    if (selectedPath === relativePath) {
      setSelectedPath(data.allReferences[0]?.relativePath || null);
    }
  };

  // Resizable Split Pane Drag Handlers
  const handleMouseDown = (e) => {
    isDraggingSplitter.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = useCallback((e) => {
    if (!isDraggingSplitter.current) return;
    const containerWidth = window.innerWidth;
    const newRatio = (e.clientX / containerWidth) * 100;
    if (newRatio >= 25 && newRatio <= 75) {
      setSplitRatio(newRatio);
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    isDraggingSplitter.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove]);

  return (
    <div className="flex flex-col h-screen w-screen bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans overflow-hidden transition-colors">
      {/* Top Application Bar */}
      <Header
        tree={tree}
        allReferences={allReferences}
        selectedPath={selectedPath}
        onSelectPath={setSelectedPath}
        onOpenNewRefModal={() => setIsNewRefModalOpen(true)}
        onOpenNewFolderModal={() => setIsNewFolderModalOpen(true)}
        onOpenTreeModal={() => setIsTreeModalOpen(true)}
        onRecompile={handleManualRecompile}
        onDownload={handleDownload}
        onExportYaml={handleExportYaml}
        status={status}
        compileDuration={compileDuration}
        errorMessage={compilationError?.error}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Main Split-Pane Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Pane: PDF Viewer */}
        <div
          className="h-full flex flex-col overflow-hidden"
          style={{ width: `${splitRatio}%` }}
        >
          <PdfViewer
            selectedPath={selectedPath}
            pdfTimestamp={pdfTimestamp}
            isCompiling={isCompiling}
            compilationError={compilationError}
            onRecompile={handleManualRecompile}
            onDownload={handleDownload}
            onViewLogs={() => setActiveTab('logs')}
          />
        </div>

        {/* Resizer Handle */}
        <div
          onMouseDown={handleMouseDown}
          className="w-1.5 hover:w-2 bg-zinc-300 dark:bg-zinc-800 hover:bg-zinc-400 dark:hover:bg-zinc-600 border-x border-zinc-300 dark:border-zinc-800 cursor-col-resize flex items-center justify-center transition-colors z-20 select-none"
          title="Drag to resize"
        />

        {/* Right Pane: Real-Time Dynamic Form & LaTeX Editor */}
        <div
          className="h-full flex flex-col overflow-hidden bg-zinc-50 dark:bg-zinc-950"
          style={{ width: `${100 - splitRatio}%` }}
        >
          {/* Tab Navigation Header */}
          <div className="h-10 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-3 flex items-center justify-between shrink-0 select-none">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setActiveTab('form')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium border transition ${
                  activeTab === 'form'
                    ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-300 dark:border-zinc-700'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 border-transparent'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Form</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('yaml')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium border transition ${
                  activeTab === 'yaml'
                    ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-300 dark:border-zinc-700'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 border-transparent'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>YAML</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('raw')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium border transition ${
                  activeTab === 'raw'
                    ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-300 dark:border-zinc-700'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 border-transparent'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>LaTeX</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('logs')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium border transition relative ${
                  activeTab === 'logs'
                    ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-300 dark:border-zinc-700'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 border-transparent'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>Logs</span>
                {compilationError && (
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 absolute top-1 right-1" />
                )}
              </button>
            </div>

            {/* Auto-save indicator */}
            <div className="text-[11px] text-zinc-400 dark:text-zinc-500 font-mono">
              {isSaving ? 'Saving...' : isCompiling ? 'Compiling...' : 'Auto-saved'}
            </div>
          </div>

          {/* Active Tab View */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {activeTab === 'form' && (
              <FormEditor
                schema={schema}
                variables={variables}
                extraVariables={extraVariables}
                onVariableChange={handleVariableChange}
                onAddExtraVariable={handleAddExtraVariable}
                onRemoveExtraVariable={handleRemoveExtraVariable}
                selectedPath={selectedPath}
                isSaving={isSaving}
              />
            )}

            {activeTab === 'yaml' && (
              <YamlEditor
                selectedPath={selectedPath}
                variables={variables}
                extraVariables={extraVariables}
                onImportYaml={handleImportYaml}
                isSaving={isSaving}
              />
            )}

            {activeTab === 'raw' && (
              <RawEditor
                rawTex={rawTex}
                onRawTexChange={setRawTex}
                onSaveRaw={handleSaveRawTex}
                isSaving={isSaving}
                selectedPath={selectedPath}
              />
            )}

            {activeTab === 'logs' && (
              <LogViewer
                log={logContent}
                error={compilationError?.error}
                errors={compilationError?.errors}
                compileDuration={compileDuration}
              />
            )}
          </div>
        </div>
      </div>

      {/* Fused Tree & Folder / Reference Manager Modal */}
      <ManageTreeModal
        isOpen={isTreeModalOpen}
        onClose={() => setIsTreeModalOpen(false)}
        tree={tree}
        allReferences={allReferences}
        selectedPath={selectedPath}
        onSelectPath={setSelectedPath}
        onRenameItem={handleRenameItem}
        onDeleteItem={handleDeleteItem}
        onCreateFolder={handleCreateFolder}
        onCreateReference={handleCreateReference}
      />
    </div>
  );
}
