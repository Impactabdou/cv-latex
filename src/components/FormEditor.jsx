import React, { useState } from 'react';
import {
  User,
  FileText,
  GraduationCap,
  Briefcase,
  Code,
  Cpu,
  Heart,
  Award,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Search,
  SlidersHorizontal
} from 'lucide-react';

const iconMap = {
  User,
  FileText,
  GraduationCap,
  Briefcase,
  Code,
  Cpu,
  Heart,
  Award
};

export default function FormEditor({
  schema,
  variables,
  extraVariables,
  onVariableChange,
  onAddExtraVariable,
  onRemoveExtraVariable,
  selectedPath,
  isSaving
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSections, setExpandedSections] = useState(() => ({
    header: true,
    profile: true,
    education: true,
    experience: true,
    projects: false,
    skills: true,
    interests: false,
    references: false,
    extra: false
  }));

  const toggleSection = (id) => {
    setExpandedSections(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const expandAll = () => {
    const all = {};
    (schema || []).forEach(s => { all[s.id] = true; });
    all.extra = true;
    setExpandedSections(all);
  };

  const collapseAll = () => {
    const all = {};
    (schema || []).forEach(s => { all[s.id] = false; });
    all.extra = false;
    setExpandedSections(all);
  };

  const insertLatexTag = (key, tagType) => {
    const currentVal = variables[key] || '';
    let newVal = currentVal;
    if (tagType === 'bold') {
      newVal = `${currentVal} \\textbf{text}`;
    } else if (tagType === 'italic') {
      newVal = `${currentVal} \\emph{text}`;
    } else if (tagType === 'newline') {
      newVal = `${currentVal} \\\\[0.15em] `;
    }
    onVariableChange(key, newVal);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-50 dark:bg-zinc-950 overflow-hidden transition-colors">
      {/* Editor Header & Search Bar */}
      <div className="p-3 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex flex-col gap-2 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider">
              Form Editor
            </span>
            <p className="text-xs text-zinc-800 dark:text-zinc-200 font-medium truncate max-w-sm">
              {selectedPath || 'Select a reference'}
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">
            <button
              onClick={expandAll}
              className="px-1.5 py-0.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-800 dark:hover:text-zinc-200 transition"
            >
              Expand All
            </button>
            <span>|</span>
            <button
              onClick={collapseAll}
              className="px-1.5 py-0.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-800 dark:hover:text-zinc-200 transition"
            >
              Collapse All
            </button>
          </div>
        </div>

        {/* Filter / Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter fields..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded pl-8 pr-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-zinc-500 dark:focus:border-zinc-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Accordion Sections Container */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {(schema || []).map((section) => {
          const Icon = iconMap[section.icon] || FileText;
          const isExpanded = expandedSections[section.id] || searchTerm.length > 0;

          const matchingFields = section.fields.filter(f => {
            if (!searchTerm) return true;
            const term = searchTerm.toLowerCase();
            const val = (variables[f.key] || '').toLowerCase();
            return (
              f.label.toLowerCase().includes(term) ||
              f.key.toLowerCase().includes(term) ||
              val.includes(term)
            );
          });

          if (matchingFields.length === 0 && searchTerm) {
            return null;
          }

          return (
            <div
              key={section.id}
              className="rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden"
            >
              {/* Section Header */}
              <button
                type="button"
                onClick={() => toggleSection(section.id)}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/80 flex items-center justify-between transition select-none text-left"
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
                  <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                    {section.title}
                  </span>
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">
                    ({matchingFields.length})
                  </span>
                </div>

                <div className="text-zinc-400 dark:text-zinc-500">
                  {isExpanded ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </div>
              </button>

              {/* Section Body */}
              {isExpanded && (
                <div className="p-3 space-y-3 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {matchingFields.map((field) => {
                      const isFullWidth =
                        field.type === 'textarea' ||
                        field.key === 'CVProfileText' ||
                        field.key === 'CVJobTitle' ||
                        field.key.includes('Task') ||
                        field.key.includes('Modules') ||
                        field.key.includes('Skills') ||
                        field.key.includes('Hobby');

                      return (
                        <div
                          key={field.key}
                          className={`flex flex-col gap-1 ${
                            isFullWidth ? 'md:col-span-2' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                              {field.label}
                            </label>
                            <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">
                              \{field.key}
                            </span>
                          </div>

                          {field.type === 'textarea' ? (
                            <textarea
                              rows={field.rows || 3}
                              value={variables[field.key] !== undefined ? variables[field.key] : ''}
                              placeholder={field.placeholder}
                              onChange={(e) => onVariableChange(field.key, e.target.value)}
                              className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 focus:border-zinc-500 dark:focus:border-zinc-400 rounded p-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none font-normal resize-y leading-relaxed"
                            />
                          ) : (
                            <input
                              type={field.type || 'text'}
                              value={variables[field.key] !== undefined ? variables[field.key] : ''}
                              placeholder={field.placeholder}
                              onChange={(e) => onVariableChange(field.key, e.target.value)}
                              className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 focus:border-zinc-500 dark:focus:border-zinc-400 rounded px-2.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none"
                            />
                          )}

                          {field.type === 'textarea' && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <button
                                type="button"
                                onClick={() => insertLatexTag(field.key, 'bold')}
                                className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-1.5 py-0.5 rounded"
                              >
                                \textbf&#123;...&#125;
                              </button>
                              <button
                                type="button"
                                onClick={() => insertLatexTag(field.key, 'italic')}
                                className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-1.5 py-0.5 rounded"
                              >
                                \emph&#123;...&#125;
                              </button>
                              <button
                                type="button"
                                onClick={() => insertLatexTag(field.key, 'newline')}
                                className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-1.5 py-0.5 rounded"
                              >
                                \\[0.15em]
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Custom / Extra Variables Section */}
        <div className="rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('extra')}
            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/80 flex items-center justify-between transition select-none text-left"
          >
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
              <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                Custom / Extra Variables
              </span>
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">
                ({(extraVariables || []).length})
              </span>
            </div>

            <div className="text-zinc-400 dark:text-zinc-500">
              {expandedSections.extra ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </div>
          </button>

          {expandedSections.extra && (
            <div className="p-3 space-y-2.5 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Define additional custom LaTeX commands (e.g. <code className="text-zinc-800 dark:text-zinc-200">\ManagementSkills</code>).
              </p>

              {(extraVariables || []).map((extra, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-950 p-2 rounded border border-zinc-200 dark:border-zinc-800">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={extra.key}
                      onChange={(e) => {
                        const updated = [...extraVariables];
                        updated[idx].key = e.target.value;
                        onAddExtraVariable(updated);
                      }}
                      placeholder="Variable name"
                      className="bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded px-2 py-1 text-xs text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none focus:border-zinc-500 dark:focus:border-zinc-400"
                    />

                    <input
                      type="text"
                      value={extra.value}
                      onChange={(e) => {
                        const updated = [...extraVariables];
                        updated[idx].value = e.target.value;
                        onAddExtraVariable(updated);
                      }}
                      placeholder="Value"
                      className="md:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded px-2 py-1 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-500 dark:focus:border-zinc-400"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => onRemoveExtraVariable(idx)}
                    className="p-1 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 rounded"
                    title="Remove"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={() => {
                  const updated = [...(extraVariables || []), { key: 'NewCustomVar', value: '' }];
                  onAddExtraVariable(updated);
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 text-xs font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Variable</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
