import React, { useState, useEffect } from 'react';
import { Blocks, CheckCircle, Plus, Shield, ToggleLeft, ToggleRight, RefreshCw, AlertCircle } from 'lucide-react';
import { api, SkillManifest } from '../../services/api.ts';

export const SkillsApp: React.FC = () => {
  const [skills, setSkills] = useState<SkillManifest[]>([]);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [manifestJson, setManifestJson] = useState(
    JSON.stringify(
      {
        name: 'custom.net_probe',
        version: '1.0.0',
        author: 'Security Research',
        description: 'Network socket diagnostics and DNS latency checker',
        capabilities: ['net.probe', 'dns.query'],
        tools: ['terminal.execute'],
        permissions: ['exec:cmd'],
      },
      null,
      2
    )
  );
  const [registerError, setRegisterError] = useState<string>('');

  const fetchSkills = async () => {
    try {
      const data = await api.getSkills();
      setSkills(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchSkills();
  }, []);

  const handleToggle = async (name: string, currentEnabled: boolean) => {
    try {
      await api.toggleSkill(name, !currentEnabled);
      fetchSkills();
    } catch (e) {
      console.error(e);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError('');
    try {
      const parsed = JSON.parse(manifestJson);
      const res = await api.registerSkill(parsed);
      if (!res.success) {
        setRegisterError(res.error || 'Failed to validate skill');
      } else {
        setShowRegisterModal(false);
        fetchSkills();
      }
    } catch (err: unknown) {
      setRegisterError(`Invalid JSON: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#07090e] text-slate-200 text-xs">
      {/* Top Banner */}
      <div className="p-3 border-b border-slate-800/80 bg-slate-950/40 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Blocks className="w-4 h-4 text-cyan-400" />
          <span className="font-semibold text-cyan-300 font-['Space_Grotesk'] tracking-wide">
            Plugin Skill Subsystem
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">
            {skills.length} plugins registered
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowRegisterModal(true)}
            className="flex items-center space-x-1 px-3 py-1.5 rounded bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Register Manifest</span>
          </button>
          <button
            onClick={fetchSkills}
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Skills Card Grid */}
      <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 gap-3">
        {skills.map((skill) => (
          <div
            key={skill.name}
            className={`p-4 rounded-xl border transition flex flex-col justify-between space-y-3 ${
              skill.enabled
                ? 'bg-slate-900/70 border-slate-800 hover:border-cyan-500/40'
                : 'bg-slate-950/40 border-slate-900 opacity-60'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-sm text-cyan-300 font-['Space_Grotesk']">{skill.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                    v{skill.version}
                  </span>
                </div>
                <button
                  onClick={() => handleToggle(skill.name, skill.enabled)}
                  className="flex items-center space-x-1 text-xs cursor-pointer"
                >
                  {skill.enabled ? (
                    <span className="text-emerald-400 flex items-center space-x-1">
                      <span>ENABLED</span>
                      <ToggleRight className="w-5 h-5" />
                    </span>
                  ) : (
                    <span className="text-slate-500 flex items-center space-x-1">
                      <span>DISABLED</span>
                      <ToggleLeft className="w-5 h-5" />
                    </span>
                  )}
                </button>
              </div>

              <div className="text-slate-400 text-[11px] leading-relaxed mb-3">{skill.description}</div>

              {/* Declared Tools & Capabilities */}
              <div className="space-y-1.5 text-[10px]">
                <div className="flex items-center space-x-1.5 text-slate-400">
                  <span className="font-semibold text-slate-300">Tools:</span>
                  <div className="flex flex-wrap gap-1">
                    {skill.tools.map((t) => (
                      <span key={t} className="px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/40 font-mono">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center space-x-1.5 text-slate-400">
                  <span className="font-semibold text-slate-300">Permissions:</span>
                  <div className="flex flex-wrap gap-1">
                    {skill.permissions.map((p) => (
                      <span key={p} className="px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 font-mono">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500">
              <span>Author: {skill.author}</span>
              <span className="flex items-center space-x-1 text-emerald-400">
                <CheckCircle className="w-3 h-3" />
                <span>Validated Manifest</span>
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Register Skill Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="w-[500px] rounded-xl bg-slate-900 border border-cyan-500/40 p-4 space-y-3 shadow-2xl">
            <div className="font-semibold text-cyan-300 text-sm">Register Custom Skill Manifest</div>
            <div className="text-[11px] text-slate-400">
              Provide a valid JSON manifest declaring name, version, capabilities, tools, and permissions.
            </div>

            {registerError && (
              <div className="p-2 rounded bg-rose-950/40 border border-rose-800 text-rose-300 text-[11px] flex items-center space-x-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{registerError}</span>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-3">
              <textarea
                value={manifestJson}
                onChange={(e) => setManifestJson(e.target.value)}
                rows={10}
                className="w-full bg-slate-950 border border-slate-700 rounded p-2.5 font-mono text-xs text-slate-200 outline-none focus:border-cyan-400"
              />
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-3 py-1.5 rounded bg-slate-800 text-slate-400 hover:text-white text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded bg-cyan-500 text-black font-semibold text-xs cursor-pointer"
                >
                  Validate & Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
