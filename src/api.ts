export interface FileNode {
  type: 'file' | 'dir';
  name: string;
  path: string;
  children?: FileNode[];
}

export const fetchStructure = async (): Promise<FileNode> => {
  const res = await fetch('/api/structure');
  if (!res.ok) throw new Error('Failed to fetch structure');
  return res.json();
};

export const fetchFileContent = async (path: string): Promise<string> => {
  const res = await fetch(`/api/file?path=${encodeURIComponent(path)}`);
  if (!res.ok) throw new Error('Failed to fetch file');
  const data = await res.json();
  return data.content;
};

export const updateEntity = async (path: string, type: 'file' | 'dir', content?: string): Promise<void> => {
  const res = await fetch('/api/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, type, content })
  });
  if (!res.ok) throw new Error('Failed to update entity');
};

export interface CompileOptions {
  latexContent?: string;
  selectedPaths?: string[];
  overrides?: Record<string, string>;
}

export const compileLatex = async (options: string | CompileOptions): Promise<Blob> => {
  const body = typeof options === 'string' ? { latexContent: options } : options;
  const res = await fetch('/api/compile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Unknown compilation error' }));
    throw new Error(errorData.error || 'Failed to compile LaTeX');
  }
  return res.blob();
};

export const fetchLatexVersion = async (): Promise<string> => {
  try {
    const res = await fetch('/api/latex-version');
    if (!res.ok) return '';
    const data = await res.json();
    return data.version || '';
  } catch (e) {
    return '';
  }
};
