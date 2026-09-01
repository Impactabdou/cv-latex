import React, { useState, useEffect, useCallback } from 'react';
import { FileNode, compileLatex } from '../api';
import { Target, FileText, Code, CheckCircle2, Loader2, AlertCircle, Download, ExternalLink } from 'lucide-react';

interface Props {
  fileTree: FileNode;
  selectedFiles: string[];
  onSelectFiles: (files: string[]) => void;
  onOpenEditor: () => void;
}

export function TargetingDashboard({ fileTree, selectedFiles, onSelectFiles, onOpenEditor }: Props) {
  // Cascading selections
  const [sector, setSector] = useState<FileNode | null>(null);
  const [subSector, setSubSector] = useState<FileNode | null>(null);
  const [company, setCompany] = useState<FileNode | null>(null);
  const [offerRef, setOfferRef] = useState<FileNode | null>(null);

  // PDF Preview & auto-compilation state
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [compiling, setCompiling] = useState<boolean>(false);
  const [compileError, setCompileError] = useState<string | null>(null);

  // Sync initial selection
  useEffect(() => {
    if (selectedFiles.length > 0 && !sector) {
      const firstFile = selectedFiles[0];
      const parts = firstFile.split('/');
      
      const s = fileTree.children?.find(c => c.name === parts[0] && c.type === 'dir');
      if (s) {
        setSector(s);
        if (parts.length > 1) {
          const ss = s.children?.find(c => c.name === parts[1] && c.type === 'dir');
          if (ss) {
            setSubSector(ss);
            if (parts.length > 2) {
              const c = ss.children?.find(ch => ch.name === parts[2] && ch.type === 'dir');
              if (c) setCompany(c);
            }
          }
        }
      }
    }
  }, [selectedFiles, fileTree, sector]);

  // Update selected files based on cascading dropdowns
  useEffect(() => {
    const newSelected: string[] = [];
    
    if (sector) {
      const sCommon = sector.children?.find(c => c.type === 'file' && c.name === 'common.tex');
      if (sCommon) newSelected.push(sCommon.path);
    }
    if (subSector) {
      const ssCommon = subSector.children?.find(c => c.type === 'file' && c.name === 'common.tex');
      if (ssCommon) newSelected.push(ssCommon.path);
    }
    if (company) {
      const cCommon = company.children?.find(c => c.type === 'file' && c.name === 'common.tex');
      if (cCommon) newSelected.push(cCommon.path);
    }
    if (offerRef) {
      newSelected.push(offerRef.path);
    } else {
      const deepest = company || subSector || sector;
      if (deepest) {
        const files = deepest.children?.filter(c => c.type === 'file' && c.name !== 'common.tex') || [];
        if (files.length > 0 && !company && !subSector && sector?.name === 'generic') {
          newSelected.push(files[0].path);
        }
      }
    }
    
    onSelectFiles(newSelected);
  }, [sector, subSector, company, offerRef]);

  // Automatic compilation whenever selectedFiles changes
  const triggerCompilation = useCallback(async (files: string[]) => {
    if (files.length === 0) return;
    setCompiling(true);
    setCompileError(null);

    try {
      const blob = await compileLatex({ selectedPaths: files });
      const url = URL.createObjectURL(blob);
      setPdfUrl(prev => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
    } catch (err: any) {
      setCompileError(err.message || 'Erreur de compilation LaTeX');
    } finally {
      setCompiling(false);
    }
  }, []);

  useEffect(() => {
    if (selectedFiles.length > 0) {
      triggerCompilation(selectedFiles);
    }
  }, [selectedFiles, triggerCompilation]);

  const sectors = fileTree.children?.filter(c => c.type === 'dir') || [];
  const subSectors = sector?.children?.filter(c => c.type === 'dir') || [];
  const companies = subSector?.children?.filter(c => c.type === 'dir') || [];
  
  const activeDir = company || subSector || sector;
  const references = activeDir?.children?.filter(c => c.type === 'file' && c.name !== 'common.tex') || [];

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Cascading Selectors */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Target className="w-6 h-6 text-blue-500" />
            <div>
              <h2 className="text-lg font-bold">1. Ciblage de l'Offre & Profil CV</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Sélectionnez le secteur, sous-secteur, entreprise et l'offre ciblée. Le CV se recompile automatiquement.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {compiling ? (
              <span className="flex items-center gap-1.5 text-xs text-blue-400 font-medium animate-pulse px-3 py-1 bg-blue-950/60 border border-blue-800/40 rounded-lg">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Compilation automatique...
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium px-3 py-1 bg-emerald-950/60 border border-emerald-800/40 rounded-lg">
                <CheckCircle2 className="w-3.5 h-3.5" />
                PDF à jour
              </span>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-400 uppercase">Secteur</label>
            <select
              className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 focus:border-blue-500 outline-none cursor-pointer"
              value={sector?.name || ""}
              onChange={(e) => {
                const s = sectors.find(c => c.name === e.target.value) || null;
                setSector(s);
                setSubSector(null);
                setCompany(null);
                setOfferRef(null);
              }}
            >
              <option value="">-- Sélectionner --</option>
              {sectors.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-400 uppercase">Sous-secteur</label>
            <select
              className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 focus:border-blue-500 outline-none disabled:opacity-50 cursor-pointer"
              value={subSector?.name || ""}
              disabled={!sector || subSectors.length === 0}
              onChange={(e) => {
                const s = subSectors.find(c => c.name === e.target.value) || null;
                setSubSector(s);
                setCompany(null);
                setOfferRef(null);
              }}
            >
              <option value="">-- Sélectionner --</option>
              {subSectors.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-400 uppercase">Entreprise</label>
            <select
              className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 focus:border-blue-500 outline-none disabled:opacity-50 cursor-pointer"
              value={company?.name || ""}
              disabled={!subSector || companies.length === 0}
              onChange={(e) => {
                const s = companies.find(c => c.name === e.target.value) || null;
                setCompany(s);
                setOfferRef(null);
              }}
            >
              <option value="">-- Sélectionner --</option>
              {companies.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-400 uppercase">Référence Offre</label>
            <select
              className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 focus:border-blue-500 outline-none disabled:opacity-50 cursor-pointer"
              value={offerRef?.name || ""}
              disabled={!activeDir || references.length === 0}
              onChange={(e) => {
                const s = references.find(c => c.name === e.target.value) || null;
                setOfferRef(s);
              }}
            >
              <option value="">-- Sélectionner --</option>
              {references.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Grid: Selected Files + Live Auto-compiled PDF */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Targeted Files List */}
        <div className="lg:col-span-5 flex flex-col bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-slate-400" />
              <h3 className="font-semibold text-sm">Fichiers .tex injectés</h3>
            </div>
            <button
              onClick={onOpenEditor}
              disabled={selectedFiles.length === 0}
              className="flex items-center gap-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer"
            >
              <Code className="w-3.5 h-3.5" />
              <span>Ouvrir dans l'Éditeur</span>
            </button>
          </div>

          {selectedFiles.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-xs">
              Veuillez sélectionner un secteur pour commencer l'assemblage.
            </div>
          ) : (
            <div className="space-y-2">
              <div className="p-2.5 bg-slate-950/80 border border-slate-800/80 rounded-lg text-xs text-slate-400 flex items-center justify-between">
                <span className="font-mono">Abderrahmene_KABAR_cv.tex</span>
                <span className="text-[10px] uppercase bg-blue-900/40 text-blue-300 px-1.5 py-0.5 rounded">Maître</span>
              </div>
              <div className="p-2.5 bg-slate-950/80 border border-slate-800/80 rounded-lg text-xs text-slate-400 flex items-center justify-between">
                <span className="font-mono">common.tex</span>
                <span className="text-[10px] uppercase bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">Global</span>
              </div>
              {selectedFiles.map((path, idx) => (
                <div key={path} className="flex items-center gap-2 p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 font-mono">
                  <span className="text-slate-600">[{idx + 1}]</span>
                  <span className="truncate">{path}</span>
                  {path.includes('common.tex') && (
                    <span className="ml-auto text-[10px] uppercase bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 shrink-0">Socle</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {pdfUrl && (
            <div className="mt-auto pt-4 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-mono">Prêt pour export</span>
              <a
                href={pdfUrl}
                download="Abderrahmene_KABAR_cv.pdf"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-lg transition-colors text-xs font-semibold"
              >
                <Download className="w-3.5 h-3.5" />
                Télécharger PDF
              </a>
            </div>
          )}
        </div>

        {/* Right Column: Live Auto-rendered PDF Preview */}
        <div className="lg:col-span-7 flex flex-col bg-slate-900 border border-slate-800 rounded-xl shadow-lg overflow-hidden h-[540px]">
          <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs px-4">
            <span className="font-semibold text-slate-300 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-400" />
              Rendu Direct du CV
            </span>
            {compiling && (
              <span className="text-blue-400 flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                Compilation...
              </span>
            )}
          </div>

          <div className="flex-1 relative">
            {compileError ? (
              <div className="absolute inset-0 p-6 flex flex-col items-center justify-center text-center bg-slate-950/90 overflow-auto">
                <AlertCircle className="w-10 h-10 text-red-500 mb-2" />
                <h4 className="text-sm font-bold text-red-400 mb-1">Erreur de Compilation</h4>
                <pre className="bg-slate-900 border border-red-900/50 p-3 rounded text-xs text-red-300 whitespace-pre-wrap max-w-full text-left font-mono max-h-60 overflow-auto">
                  {compileError}
                </pre>
              </div>
            ) : pdfUrl ? (
              <iframe
                src={pdfUrl}
                className="w-full h-full border-none bg-white"
                title="Aperçu CV"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 p-6 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-2" />
                <p className="text-xs font-medium text-slate-300">Compilation initiale automatique...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

