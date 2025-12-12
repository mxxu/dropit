export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  path: string;
  size?: number;
  file?: File; // Only for files
  children?: FileNode[]; // Only for folders
  isOpen?: boolean; // For folder UI state
}

export enum ViewMode {
  LIST = 'LIST',
  GRID = 'GRID'
}