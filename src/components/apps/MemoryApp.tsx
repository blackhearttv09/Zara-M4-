import React, { useState, useEffect } from 'react';
import { Database, Search, Plus, Trash2, Download, Tag, Star, RefreshCw } from 'lucide-react';
import { api, MemoryRecord } from '../../services/api.ts';

export const MemoryApp: React.FC = () => {
  const [memories, setMemories] = useState<MemoryRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<'system' | 'session' | 'preference' | 'task' | 'knowledge'>('knowledge');
  const [newTags, setNewTags] = useState('');
  const [newImportance, setNewImportance] = useState(0.8);

  const fetchMemories = async () => {
    try {
      const data = await api.getMemories(searchQuery, selectedCategory);
      setMemories(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchMemories();
  }, [searchQuery, selectedCategory]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    try {
      await api.createMemory({
        title: newTitle.trim(),
        content: newContent.trim(),
        category: newCategory,
        tags: newTags.split(',').map((t) => t.trim()).filter(Boolean),
        importance: newImportance,
      });
      setShowAddModal(false);
      setNewTitle('');
      setNewContent('');
      setNewTags('');
      fetchMemories();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteMemory(id);
      fetchMemories();
    } catch (e) {
      console.error(e);
    }
  };

  const handleExport = async () => {
    try {
      const data = await api.exportMemories();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `m4-memory-snapshot-${Date.now()}.json`;
      a.click();
    } catch (e) {
      console.error(e);
    }
  };

  const categories = ['system', 'session', 'preference', 'task', 'knowledge'];

  return (
    <div className="h-full flex flex-col bg-[#07090e] text-slate-200 text-xs">
      {/* Top Action Bar */}
      <div className="p-3 border-b border-slate-800/80 bg-slate-950/40 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Database className="w-4 h-4 text-cyan-400" />
          <span className="font-semibold text-cyan-300 font-['Space_Grotesk'] tracking-wide">
            Cognitive Memory Subsystem
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">
            {memories.length} records
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-1 px-3 py-1.5 rounded bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Memory</span>
          </button>
          <button
            onClick={handleExport}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition cursor-pointer"
            title="Export JSON"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-2.5 border-b border-slate-800/60 bg-slate-950/20 flex items-center space-x-3">
        <div className="flex-1 flex items-center bg-slate-900 rounded-md px-2.5 py-1.5 border border-slate-800">
          <Search className="w-3.5 h-3.5 text-slate-500 mr-2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search cognitive memory keywords..."
            className="w-full bg-transparent border-none outline-none text-xs text-slate-100 placeholder:text-slate-600"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setSelectedCategory('')}
            className={`px-2 py-1 rounded text-[10px] font-medium transition cursor-pointer ${
              selectedCategory === ''
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2 py-1 rounded text-[10px] font-medium transition cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Memory Card Grid */}
      <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 gap-3">
        {memories.map((mem) => (
          <div
            key={mem.id}
            className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-cyan-500/40 transition flex flex-col justify-between space-y-2"
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-semibold text-cyan-300 text-xs font-['Space_Grotesk']">{mem.title}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/50">
                  {mem.category}
                </span>
              </div>
              <div className="text-slate-300 text-[11px] leading-relaxed">{mem.content}</div>
            </div>

            <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px]">
              <div className="flex items-center space-x-2">
                <span className="flex items-center space-x-1 text-amber-400">
                  <Star className="w-3 h-3 fill-current" />
                  <span>{Math.round(mem.importance * 100)}%</span>
                </span>
                <div className="flex items-center space-x-1">
                  {mem.tags.map((t) => (
                    <span key={t} className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={() => handleDelete(mem.id)}
                className="text-slate-500 hover:text-rose-400 transition cursor-pointer p-1"
                title="Delete Memory"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Memory Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="w-[450px] rounded-xl bg-slate-900 border border-cyan-500/40 p-4 space-y-3 shadow-2xl">
            <div className="font-semibold text-cyan-300 text-sm">Create Cognitive Memory</div>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="text-[10px] text-slate-400 uppercase font-semibold">Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Workspace Environment Variable Spec"
                  className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-xs text-slate-200 outline-none focus:border-cyan-400 mt-1"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 uppercase font-semibold">Content</label>
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Detailed cognitive knowledge to remember..."
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-xs text-slate-200 outline-none focus:border-cyan-400 mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-semibold">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-xs text-slate-200 outline-none focus:border-cyan-400 mt-1"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-semibold">Importance ({Math.round(newImportance * 100)}%)</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={newImportance}
                    onChange={(e) => setNewImportance(parseFloat(e.target.value))}
                    className="w-full mt-2 accent-cyan-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 uppercase font-semibold">Tags (comma separated)</label>
                <input
                  type="text"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  placeholder="env, config, security"
                  className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-xs text-slate-200 outline-none focus:border-cyan-400 mt-1"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded bg-slate-800 text-slate-400 hover:text-white text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded bg-cyan-500 text-black font-semibold text-xs cursor-pointer"
                >
                  Save to Memory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
