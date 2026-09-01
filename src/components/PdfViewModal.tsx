import React from 'react';
import { X, ExternalLink, Download, FileText } from 'lucide-react';

interface PdfViewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PdfViewModal: React.FC<PdfViewModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-5xl h-[90vh] bg-slate-900 border border-slate-700 rounded-2xl flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" />
            <h3 className="text-sm font-bold text-white">
              Aperçu du PDF Compilé Original (Abderrahmene_KABAR_cv.pdf)
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/Abderrahmene_KABAR_cv.pdf"
              download="Abderrahmene_KABAR_cv.pdf"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Télécharger</span>
            </a>
            <a
              href="/Abderrahmene_KABAR_cv.pdf"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Nouvel onglet</span>
            </a>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PDF Frame */}
        <div className="flex-1 bg-slate-950 p-2">
          <iframe
            src="/Abderrahmene_KABAR_cv.pdf#toolbar=1"
            className="w-full h-full rounded-lg border border-slate-800"
            title="PDF Preview"
          />
        </div>
      </div>
    </div>
  );
};
