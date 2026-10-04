import React, { useState, useEffect } from 'react';
import { Folder, FileText, Search, Save, Plus, Shield, RefreshCw } from 'lucide-react';
import { api } from '../../services/api.ts';

interface FileItem {
  path: string;
  size: number;
  modified: string;
  permissions: string;
}

export const FileManagerApp: React.FC = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [newFilePath, setNewFilePath] = useState('');
  const [showNewFileModal, setShowNewFileModal] = useState(false);

  const fetchFiles = async () => {
    try {
      const data = await api.getFiles();
      setFiles(data);
      if (data.length > 0 && !selectedFile) {
        loadFile(data[0]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const loadFile = async (file: FileItem) => {
    setSelectedFile(file);
    setStatusMessage('');
    try {
      const res = await api.executeTool('file-manager-ui', 'files.read', { path: file.path });
      if (res.success && res.output?.content !== undefined) {
        setFileContent(res.output.content);
      } else {
        setFileContent('// [Permission Denied or Empty File]');
      }
    } catch (err) {
      setFileContent(`Error loading file: ${err}`);
    }
  };

  const handleSave = async () => {
    if (!selectedFile || isSaving) return;
    setIsSaving(true);
    setStatusMessage('');

    try {
      const res = await api.executeTool('file-manager-ui', 'files.write', {
        path: selectedFile.path,
        content: fileContent,
      });

      if (res.pendingRequestId) {
        setStatusMessage(`Approval Required: Write escalated to human operator (ID: ${res.pendingRequestId})`);
      } else if (res.success) {
        setStatusMessage('File committed successfully to virtual storage.');
        fetchFiles();
      } else {
        setStatusMessage(`Save failed: ${res.error}`);
      }
    } catch (err: unknown) {
      setStatusMessage(`Save error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFilePath.trim()) return;

    try {
      await api.executeTool('file-manager-ui', 'files.write', {
        path: newFilePath.trim(),
        content: '// New M4 Five OS File\n',
      }, true);
      setShowNewFileModal(false);
      setNewFilePath('');
      fetchFiles();
    } catch (e) {
      console.error(e);
    }
  };

  const filteredFiles = files.filter((f) =>
    searchQuery ? f.path.toLowerCase().includes(searchQuery.toLowerCase()) : true
  );

  return (
    <div className="h-full flex bg-[#07090e] text-slate-200 text-xs">
      {/* File Explorer Tree / Left Pane */}
      <div className="w-72 border-r border-slate-800/80 flex flex-col bg-slate-950/40">
        <div className="p-3 border-b border-slate-800/80 flex items-center justify-between">
          <span className="font-semibold text-cyan-400 font-['Space_Grotesk'] tracking-wide flex items-center space-x-1.5">
            <Folder className="w-4 h-4 text-cyan-400" />
            <span>Filesystem</span>
          </span>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setShowNewFileModal(true)}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-400 transition"
              title="Create File"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={fetchFiles}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-400 transition"
              title="Refresh"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="p-2 border-b border-slate-800/60">
          <div className="flex items-center bg-slate-900 rounded-md px-2 py-1 border border-slate-800">
            <Search className="w-3 h-3 text-slate-500 mr-1.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search files..."
              className="w-full bg-transparent border-none outline-none text-[11px] text-slate-200 placeholder:text-slate-600"
            />
          </div>
        </div>

        {/* File List */}
        <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
          {filteredFiles.map((file) => {
            const isSelected = selectedFile?.path === file.path;
            return (
              <button
                key={file.path}
                onClick={() => loadFile(file)}
                className={`w-full text-left p-2 rounded-lg flex items-center space-x-2 transition cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-500/15 border border-cyan-500/40 text-cyan-300'
                    : 'hover:bg-slate-900/60 text-slate-400'
                }`}
              >
                <FileText className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-cyan-300' : 'text-slate-500'}`} />
                <div className="flex-1 truncate">
                  <div className="truncate font-mono text-[11px]">{file.path}</div>
                  <div className="text-[10px] text-slate-500 flex justify-between">
                    <span>{file.permissions}</span>
                    <span>{file.size} B</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Editor / Viewer Right Pane */}
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-950/20">
        {selectedFile ? (
          <>
            {/* File Header Bar */}
            <div className="h-10 px-4 border-b border-slate-800/80 bg-slate-950/50 flex items-center justify-between">
              <div className="flex items-center space-x-2 truncate">
                <span className="font-mono text-cyan-300 font-semibold">{selectedFile.path}</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                  {selectedFile.permissions}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-3 py-1.5 rounded bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs flex items-center space-x-1.5 transition cursor-pointer disabled:opacity-40"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Committing...' : 'Save File'}</span>
                </button>
              </div>
            </div>

            {/* Status Alert if any */}
            {statusMessage && (
              <div className="px-4 py-2 bg-cyan-950/40 border-b border-cyan-800/30 text-[11px] text-cyan-300 flex items-center space-x-2">
                <Shield className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>{statusMessage}</span>
              </div>
            )}

            {/* Editor Area */}
            <div className="flex-1 p-4 overflow-hidden">
              <textarea
                value={fileContent}
                onChange={(e) => setFileContent(e.target.value)}
                spellCheck={false}
                className="w-full h-full bg-[#040609] border border-slate-800/80 rounded-lg p-3 font-mono text-xs text-slate-200 outline-none resize-none focus:border-cyan-500/50 leading-relaxed"
              />
            </div>
          </>
        ) : (
          <div className="h-full flex items-center justify-center text-slate-500">
            Select a file to inspect or edit.
          </div>
        )}
      </div>

      {/* New File Modal */}
      {showNewFileModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="w-96 rounded-xl bg-slate-900 border border-cyan-500/40 p-4 space-y-3 shadow-2xl">
            <div className="font-semibold text-cyan-300">Create New File</div>
            <form onSubmit={handleCreateFile} className="space-y-3">
              <input
                type="text"
                value={newFilePath}
                onChange={(e) => setNewFilePath(e.target.value)}
                placeholder="/home/user/workspace/script.sh"
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-xs text-slate-200 outline-none focus:border-cyan-400"
              />
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowNewFileModal(false)}
                  className="px-3 py-1.5 rounded bg-slate-800 text-slate-400 hover:text-white text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded bg-cyan-500 text-black font-semibold text-xs cursor-pointer"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
