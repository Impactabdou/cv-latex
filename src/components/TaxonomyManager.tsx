import React, { useState } from 'react';
import { FileNode, updateEntity } from '../api';
import { FolderTree, FolderPlus, FilePlus, ChevronRight, ChevronDown, Folder, FileText } from 'lucide-react';

interface Props {
  fileTree: FileNode;
  onRefresh: () => void;
}

const TreeNode = ({ node, onAdd }: { node: FileNode, onAdd: (path: string, type: 'dir' | 'file') => void }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (node.type === 'file') {
    return (
      <div className="flex items-center gap-2 py-1.5 px-2 hover:bg-slate-800/50 rounded group ml-6">
        <FileText className="w-4 h-4 text-blue-400" />
        <span className="text-sm text-slate-300 font-mono">{node.name}</span>
      </div>
    );
  }

  return (
    <div className="ml-4 first:ml-0">
      <div className="flex items-center gap-2 py-1.5 px-2 hover:bg-slate-800/50 rounded group cursor-pointer">
        <div onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2 flex-1">
          {isOpen ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
          <Folder className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-semibold text-slate-200">{node.name || 'domains'}</span>
        </div>
        <div className="hidden group-hover:flex items-center gap-1">
          <button onClick={() => onAdd(node.path, 'dir')} className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white" title="Ajouter un dossier">
            <FolderPlus className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onAdd(node.path, 'file')} className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white" title="Ajouter un fichier .tex">
            <FilePlus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      {isOpen && node.children && (
        <div className="border-l border-slate-800 ml-3 pl-1 mt-1">
          {node.children.map(child => (
            <TreeNode key={child.path} node={child} onAdd={onAdd} />
          ))}
        </div>
      )}
    </div>
  );
};

export function TaxonomyManager({ fileTree, onRefresh }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [addContext, setAddContext] = useState<{ path: string, type: 'dir' | 'file' } | null>(null);
  const [newName, setNewName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenAdd = (path: string, type: 'dir' | 'file') => {
    setAddContext({ path, type });
    setNewName('');
    setIsModalOpen(true);
  };

  const handleConfirmAdd = async () => {
    if (!addContext || !newName.trim()) return;
    
    let finalName = newName.trim();
    if (addContext.type === 'file' && !finalName.endsWith('.tex')) {
      finalName += '.tex';
    }

    const newPath = addContext.path ? `${addContext.path}/${finalName}` : finalName;
    
    try {
      setIsSubmitting(true);
      const initialContent = addContext.type === 'file' ? `% New file: ${finalName}\n` : undefined;
      await updateEntity(newPath, addContext.type, initialContent);
      setIsModalOpen(false);
      onRefresh();
    } catch (err) {
      alert('Error creating entity');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <FolderTree className="w-6 h-6 text-blue-500" />
            <h2 className="text-lg font-bold">2. Structure du Système de Fichiers</h2>
          </div>
          <button 
            onClick={() => handleOpenAdd('', 'dir')}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg text-sm border border-slate-700 transition-colors"
          >
            <FolderPlus className="w-4 h-4" />
            Nouveau Secteur
          </button>
        </div>

        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 overflow-x-auto">
          <TreeNode node={fileTree} onAdd={handleOpenAdd} />
        </div>
      </div>

      {isModalOpen && addContext && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold mb-4">
              Créer un {addContext.type === 'dir' ? 'dossier' : 'fichier'} dans /{addContext.path || 'domains'}
            </h3>
            
            <input
              autoFocus
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={addContext.type === 'dir' ? 'Nom du dossier' : 'Nom du fichier (ex: R-123.tex)'}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white mb-6 focus:border-blue-500 outline-none"
            />
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmAdd}
                disabled={!newName.trim() || isSubmitting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
              >
                {isSubmitting ? 'Création...' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
