import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Sliders, Shield, Cpu, RefreshCw, CheckCircle2, RotateCcw } from 'lucide-react';
import { api } from '../../services/api.ts';

export const SettingsApp: React.FC = () => {
  const [config, setConfig] = useState<any>(null);
  const [accentColor, setAccentColor] = useState('#06b6d4');
  const [saveStatus, setSaveStatus] = useState('');

  const fetchConfig = async () => {
    try {
      const data = await api.getConfig();
      setConfig(data);
      if (data.desktop?.accentColor) {
        setAccentColor(data.desktop.accentColor);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSave = async () => {
    try {
      setSaveStatus('Applying configuration changes...');
      await api.updateConfig({
        desktop: { ...config?.desktop, accentColor },
      });
      setSaveStatus('Configuration saved successfully.');
      setTimeout(() => setSaveStatus(''), 2500);
    } catch (e) {
      setSaveStatus(`Failed to update config: ${e}`);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#07090e] text-slate-200 text-xs overflow-y-auto p-4 space-y-4">
      {/* Settings Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div className="flex items-center space-x-2">
          <SettingsIcon className="w-4 h-4 text-cyan-400" />
          <span className="font-semibold text-cyan-300 font-['Space_Grotesk'] text-sm tracking-wide">
            System Settings & Parameters
          </span>
        </div>
        <button
          onClick={handleSave}
          className="px-3 py-1.5 rounded bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs transition cursor-pointer"
        >
          Save Changes
        </button>
      </div>

      {saveStatus && (
        <div className="p-2.5 rounded bg-emerald-950/40 border border-emerald-800 text-emerald-300 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{saveStatus}</span>
        </div>
      )}

      {/* Grid Settings Sections */}
      <div className="grid grid-cols-2 gap-4">
        {/* OS & Kernel Section */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-3">
          <div className="flex items-center space-x-2 text-cyan-300 font-semibold font-['Space_Grotesk']">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span>Kernel & Core Foundation</span>
          </div>
          <div className="space-y-2 text-[11px]">
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Distribution Base</span>
              <span className="text-slate-200">{config?.kernel?.distro || 'Debian/Kali GNU/Linux (Custom)'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Kernel Release</span>
              <span className="text-slate-200 font-mono">{config?.kernel?.release || '6.8.0-m4-hardened'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">AppArmor Profile</span>
              <span className="text-emerald-400 font-semibold">Enforced (Active)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Seccomp System Call Filter</span>
              <span className="text-emerald-400 font-semibold">Enabled</span>
            </div>
          </div>
        </div>

        {/* AI Runtime Configuration */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-3">
          <div className="flex items-center space-x-2 text-cyan-300 font-semibold font-['Space_Grotesk']">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span>AI Brain Runtime</span>
          </div>
          <div className="space-y-2 text-[11px]">
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Provider</span>
              <span className="text-cyan-400 font-semibold">Google Gemini (@google/genai)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Model Architecture</span>
              <span className="text-slate-200 font-mono">gemini-3.8-flash</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Fallback Reasoner</span>
              <span className="text-slate-200">M4 Local Heuristic Engine</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Safety Execution Mode</span>
              <span className="text-emerald-400 font-semibold">Human-in-the-Loop Enforced</span>
            </div>
          </div>
        </div>

        {/* Desktop Personalization */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-3">
          <div className="flex items-center space-x-2 text-cyan-300 font-semibold font-['Space_Grotesk']">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span>Desktop Personalization</span>
          </div>
          <div className="space-y-3 text-[11px]">
            <div>
              <label className="text-slate-400 block mb-1">Accent Highlight Color</label>
              <div className="flex items-center space-x-3">
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-8 h-8 rounded border border-slate-700 bg-transparent cursor-pointer"
                />
                <span className="font-mono text-cyan-300">{accentColor}</span>
              </div>
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Compositor Shading</label>
              <div className="text-slate-300">Cyber-Glass Frost (M4 Wayland Shell)</div>
            </div>
          </div>
        </div>

        {/* Security Policies */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-3">
          <div className="flex items-center space-x-2 text-cyan-300 font-semibold font-['Space_Grotesk']">
            <Shield className="w-4 h-4 text-cyan-400" />
            <span>Sandbox Policy Settings</span>
          </div>
          <div className="space-y-2 text-[11px]">
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Enforce Sandbox</span>
              <span className="text-emerald-400 font-semibold">TRUE</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Audit Trail Retention</span>
              <span className="text-slate-200">90 Days (Local Storage)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Destructive Blacklist</span>
              <span className="text-rose-400 font-semibold">Active (8 Prohibited Patterns)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
