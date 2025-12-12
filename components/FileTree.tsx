import React from 'react';
import { FileNode } from '../types';
import { ChevronRight, ChevronDown, Folder, File as FileIcon, Image as ImageIcon, Code as CodeIcon } from 'lucide-react';

interface FileTreeProps {
  node: FileNode;
  onToggle: (id: string) => void;
  depth?: number;
}

const getIcon = (name: string, type: 'file' | 'folder') => {
  if (type === 'folder') return <Folder className="w-4 h-4 text-blue-400" />;
  if (name.match(/\.(jpg|jpeg|png|gif|webp)$/i)) return <ImageIcon className="w-4 h-4 text-purple-400" />;
  if (name.match(/\.(ts|tsx|js|jsx|py|html|css|json)$/i)) return <CodeIcon className="w-4 h-4 text-yellow-400" />;
  return <FileIcon className="w-4 h-4 text-slate-400" />;
};

export const FileTree: React.FC<FileTreeProps> = ({ node, onToggle, depth = 0 }) => {
  const isFolder = node.type === 'folder';
  const paddingLeft = `${depth * 1.5}rem`;

  return (
    <div>
      <div
        className={`flex items-center py-2 px-2 hover:bg-slate-800/50 cursor-pointer transition-colors border-l-2 ${node.isOpen ? 'border-blue-500' : 'border-transparent'}`}
        style={{ paddingLeft }}
        onClick={() => isFolder && onToggle(node.id)}
      >
        <div className="mr-2">
          {isFolder ? (
            node.isOpen ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />
          ) : (
            <span className="w-4 h-4 block" /> 
          )}
        </div>
        <div className="mr-2">
            {getIcon(node.name, node.type)}
        </div>
        <span className="text-sm text-slate-200 truncate select-none">{node.name}</span>
        {node.size && !isFolder && (
          <span className="ml-auto text-xs text-slate-500 font-mono">
            {(node.size / 1024).toFixed(1)} KB
          </span>
        )}
      </div>
      
      {isFolder && node.isOpen && node.children && (
        <div>
          {node.children.map((child) => (
            <FileTree key={child.id} node={child} onToggle={onToggle} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};