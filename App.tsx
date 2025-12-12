import React, { useState, useRef, useCallback } from 'react';
import { UploadCloud, FolderUp, FileUp, Trash2, Activity, LayoutGrid, List as ListIcon, Folder, Upload, CheckCircle2 } from 'lucide-react';
import { FileNode, ViewMode } from './types';
import { FileTree } from './components/FileTree';

const App: React.FC = () => {
  const [fileStructure, setFileStructure] = useState<FileNode[]>([]);
  const [flatFiles, setFlatFiles] = useState<File[]>([]); 
  const [isDragging, setIsDragging] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.LIST);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadComplete, setUploadComplete] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // Helper to process FileList into a tree structure
  const processFiles = useCallback((files: FileList) => {
    const newStructure: FileNode[] = [];
    const newFlatFiles: File[] = [];
    setUploadComplete(false); // Reset upload status on new selection

    Array.from(files).forEach((file) => {
      newFlatFiles.push(file);
      const pathParts = file.webkitRelativePath ? file.webkitRelativePath.split('/') : [file.name];
      
      // If it's a simple file upload without directory structure, pathParts has length 1
      let currentLevel = newStructure;

      pathParts.forEach((part, index) => {
        const isFile = index === pathParts.length - 1;
        const existingNode = currentLevel.find(node => node.name === part);

        if (existingNode) {
          if (existingNode.type === 'folder' && existingNode.children) {
            currentLevel = existingNode.children;
          }
        } else {
          const newNode: FileNode = {
            id: Math.random().toString(36).substr(2, 9),
            name: part,
            type: isFile ? 'file' : 'folder',
            path: file.webkitRelativePath || file.name,
            size: isFile ? file.size : undefined,
            file: isFile ? file : undefined,
            children: isFile ? undefined : [],
            isOpen: true // Auto-expand new folders
          };
          currentLevel.push(newNode);
          if (!isFile && newNode.children) {
            currentLevel = newNode.children;
          }
        }
      });
    });

    setFileStructure(prev => [...prev, ...newStructure]);
    setFlatFiles(prev => [...prev, ...newFlatFiles]);
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
    // Reset input
    if (e.target) e.target.value = '';
  };

  const toggleFolder = (id: string) => {
    const toggleNode = (nodes: FileNode[]): FileNode[] => {
      return nodes.map(node => {
        if (node.id === id) {
          return { ...node, isOpen: !node.isOpen };
        }
        if (node.children) {
          return { ...node, children: toggleNode(node.children) };
        }
        return node;
      });
    };
    setFileStructure(prev => toggleNode(prev));
  };

  const clearFiles = () => {
    setFileStructure([]);
    setFlatFiles([]);
    setUploadComplete(false);
    setUploadProgress(0);
  };

  const handleUpload = async () => {
    if (flatFiles.length === 0) return;
    
    setIsUploading(true);
    setUploadProgress(0);

    // Simulate upload process
    const totalSteps = 20;
    for (let i = 0; i <= totalSteps; i++) {
      await new Promise(resolve => setTimeout(resolve, 100)); // Simulate network latency
      setUploadProgress(Math.round((i / totalSteps) * 100));
    }

    setIsUploading(false);
    setUploadComplete(true);
    
    // In a real app, you would send FormData here
    /*
    const formData = new FormData();
    flatFiles.forEach(file => {
      formData.append('files', file);
    });
    await fetch('/api/upload', { method: 'POST', body: formData });
    */
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col md:flex-row">
      {/* Sidebar / Info */}
      <aside className="w-full md:w-80 bg-slate-950 border-r border-slate-800 p-6 flex flex-col">
        <div className="mb-8 flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <FolderUp className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">StreamDrop</h1>
            <p className="text-xs text-slate-500">Fast File Manager</p>
          </div>
        </div>

        <div className="space-y-6 flex-1">
          <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800">
            <h3 className="text-sm font-semibold text-slate-300 mb-2 flex items-center">
              <Activity className="w-4 h-4 mr-2 text-green-400" />
              System Status
            </h3>
            <div className="space-y-2 text-xs text-slate-400">
              <div className="flex justify-between">
                <span>Files Loaded</span>
                <span className="text-slate-200">{flatFiles.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Size</span>
                <span className="text-slate-200">
                  {(flatFiles.reduce((acc, f) => acc + f.size, 0) / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-auto pt-6 text-[10px] text-slate-600 text-center">
          Powered by React
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        {/* Dropzone */}
        <div 
          className={`relative group rounded-2xl border-2 border-dashed transition-all duration-300 ease-in-out p-8 mb-8 flex flex-col items-center justify-center text-center cursor-default ${
            isDragging 
              ? 'border-blue-500 bg-blue-500/10 scale-[1.01]' 
              : 'border-slate-700 bg-slate-800/30 hover:border-slate-600 hover:bg-slate-800/50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 shadow-xl shadow-black/20 group-hover:scale-110 transition-transform duration-300">
            <UploadCloud className={`w-8 h-8 ${isDragging ? 'text-blue-400' : 'text-slate-400'}`} />
          </div>
          <h2 className="text-xl font-bold text-slate-200 mb-2">Drag & Drop Files or Folders</h2>
          <p className="text-sm text-slate-500 mb-6 max-w-sm">
            Support for single files, multiple selection, and complete directory uploads.
          </p>
          
          <div className="flex gap-4">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium transition-colors flex items-center"
            >
              <FileUp className="w-4 h-4 mr-2" />
              Select Files
            </button>
            <button 
              onClick={() => folderInputRef.current?.click()}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium transition-colors flex items-center"
            >
              <FolderUp className="w-4 h-4 mr-2" />
              Select Folder
            </button>
          </div>

          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            multiple 
            onChange={handleFileSelect} 
          />
          <input 
            type="file" 
            ref={folderInputRef} 
            className="hidden" 
            {...{ webkitdirectory: "", directory: "" } as any}
            onChange={handleFileSelect} 
          />
        </div>

        {/* Action Bar */}
        {flatFiles.length > 0 && (
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 gap-4">
            <div className="flex items-center space-x-2 bg-slate-800/50 p-1 rounded-lg">
              <button 
                onClick={() => setViewMode(ViewMode.LIST)}
                className={`p-1.5 rounded-md transition-colors ${viewMode === ViewMode.LIST ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
                title="List View"
              >
                <ListIcon className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setViewMode(ViewMode.GRID)}
                className={`p-1.5 rounded-md transition-colors ${viewMode === ViewMode.GRID ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex items-center space-x-3 w-full md:w-auto">
              <button 
                onClick={handleUpload}
                disabled={isUploading || uploadComplete}
                className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center shadow-lg ${
                  uploadComplete 
                    ? 'bg-green-600/20 text-green-400 cursor-default border border-green-600/50'
                    : isUploading
                      ? 'bg-blue-600/50 text-white cursor-wait'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-500/20'
                }`}
              >
                {uploadComplete ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Upload Complete
                  </>
                ) : isUploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    Uploading... {uploadProgress}%
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload {flatFiles.length} Files
                  </>
                )}
              </button>

              <button 
                onClick={clearFiles}
                disabled={isUploading}
                className="px-3 py-2 text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex items-center"
                title="Clear All Files"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Content Area - Full width file list */}
        <div className="w-full relative">
          {/* Progress Bar Overlay */}
          {isUploading && (
            <div className="absolute top-0 left-0 w-full h-1 bg-slate-800 rounded-t-xl overflow-hidden z-10">
              <div 
                className="h-full bg-blue-500 transition-all duration-300 ease-out"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}

          <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden min-h-[300px]">
             <div className="bg-slate-950/50 px-4 py-3 border-b border-slate-800 flex justify-between items-center">
              <span className="font-semibold text-sm text-slate-300">File Structure</span>
              <span className="text-xs text-slate-500 font-mono">
                {flatFiles.length} items
              </span>
            </div>
            <div className="p-2 overflow-y-auto max-h-[600px]">
              {fileStructure.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-slate-600">
                  <Folder className="w-8 h-8 mb-2 opacity-20" />
                  <p className="text-sm">No files uploaded yet</p>
                </div>
              ) : (
                fileStructure.map(node => (
                  <FileTree key={node.id} node={node} onToggle={toggleFolder} />
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;