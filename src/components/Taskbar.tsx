import React, { useState, useEffect } from 'react';
import {
  Terminal,
  Bot,
  FolderTree,
  Activity,
  Shield,
  Database,
  Blocks,
  Settings,
  BrainCircuit,
  Grid,
  Wifi,
  Volume2,
  Battery,
  AlertTriangle,
} from 'lucide-react';
import { AppId, AppDefinition, WindowState } from '../types.ts';
import { SystemTelemetry } from '../services/api.ts';

interface TaskbarProps {
  apps: AppDefinition[];
  windows: WindowState[];
  activeWindowId: string | null;
  telemetry: SystemTelemetry | null;
  onOpenApp: (appId: AppId) => void;
  onToggleWindow: (winId: string) => void;
  onOpenBrainHUD: () => void;
}

export const Taskbar: React.FC<TaskbarProps> = ({
  apps,
  windows,
  activeWindowId,
  telemetry,
  onOpenApp,
  onToggleWindow,
  onOpenBrainHUD,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [showLauncher, setShowLauncher] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setCurrentTime(
        d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const getAppIcon = (id: AppId) => {
    switch (id) {
      case 'terminal':
        return Terminal;
      case 'orchestrator':
        return Bot;
      case 'files':
        return FolderTree;
      case 'monitor':
        return Activity;
      case 'security':
        return Shield;
      case 'memory':
        return Database;
      case 'skills':
        return Blocks;
      case 'settings':
        return Settings;
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 h-12 z-40 bg-[#06080e]/90 border-t border-cyan-500/20 backdrop-blur-xl flex items-center justify-between px-3 select-none">
      {/* Left: Start Launcher & M4 Brain Orb */}
      <div className="flex items-center space-x-2">
        {/* Launcher Button */}
        <button
          onClick={() => setShowLauncher(!showLauncher)}
          className={`h-9 px-2.5 rounded-lg flex items-center space-x-1.5 transition cursor-pointer ${
            showLauncher
              ? 'bg-cyan-500 text-black font-semibold'
              : 'hover:bg-slate-800/80 text-slate-300'
          }`}
          title="Applications Menu"
        >
          <Grid className="w-4 h-4" />
          <span className="text-xs font-bold font-['Space_Grotesk'] tracking-wider">M4</span>
        </button>

        {/* M4 Brain Floating Orb Trigger */}
        <button
          onClick={onOpenBrainHUD}
          className="h-9 px-3 rounded-lg bg-gradient-to-r from-cyan-950 via-slate-900 to-cyan-950 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 flex items-center space-x-2 shadow-sm shadow-cyan-500/20 transition cursor-pointer"
          title="Open M4 Brain HUD (Cmd/Ctrl+K)"
        >
          <BrainCircuit className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span className="text-xs font-semibold">Brain HUD</span>
        </button>
      </div>

      {/* Middle: Open Window Tasks */}
      <div className="flex-1 flex items-center justify-center space-x-1.5 px-4 overflow-x-auto">
        {windows.map((win) => {
          const Icon = getAppIcon(win.appId);
          const isActive = activeWindowId === win.id && !win.minimized;
          return (
            <button
              key={win.id}
              onClick={() => onToggleWindow(win.id)}
              className={`h-9 px-3 rounded-lg flex items-center space-x-2 transition cursor-pointer max-w-[180px] truncate ${
                isActive
                  ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-200 shadow-sm shadow-cyan-500/30'
                  : win.minimized
                  ? 'bg-slate-900/40 text-slate-500 hover:bg-slate-800/60'
                  : 'bg-slate-900/80 border border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0 text-cyan-400" />
              <span className="text-xs truncate font-medium">{win.title}</span>
              <div
                className={`w-1.5 h-1.5 rounded-full ${
                  isActive ? 'bg-cyan-400 animate-pulse' : 'bg-slate-600'
                }`}
              />
            </button>
          );
        })}
      </div>

      {/* Right: System Tray */}
      <div className="flex items-center space-x-3 text-xs text-slate-400">
        {/* Telemetry pill */}
        {telemetry && (
          <div className="hidden md:flex items-center space-x-2 px-2.5 py-1 rounded bg-slate-900/80 border border-slate-800 font-mono text-[11px]">
            <span className="text-cyan-400 font-semibold">{telemetry.cpuUsagePercent}% CPU</span>
            <span className="text-slate-600">|</span>
            <span className="text-blue-400 font-semibold">{telemetry.memoryUsedMB}MB</span>
          </div>
        )}

        {/* Security Pending Approvals Alert */}
        {telemetry && telemetry.pendingApprovals > 0 && (
          <button
            onClick={() => onOpenApp('security')}
            className="flex items-center space-x-1 px-2 py-0.5 rounded bg-amber-950/80 border border-amber-500/60 text-amber-300 text-[11px] font-semibold animate-bounce cursor-pointer"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>{telemetry.pendingApprovals} Pending</span>
          </button>
        )}

        {/* Quick Toggles */}
        <div className="flex items-center space-x-2">
          <Wifi className="w-3.5 h-3.5 text-emerald-400" />
          <Volume2 className="w-3.5 h-3.5 text-slate-400" />
          <Battery className="w-3.5 h-3.5 text-emerald-400" />
        </div>

        {/* Clock */}
        <div className="font-mono text-xs font-semibold text-slate-200 pl-1">{currentTime}</div>
      </div>

      {/* Launcher Popup Drawer */}
      {showLauncher && (
        <div className="absolute bottom-14 left-3 w-80 rounded-2xl bg-[#090c14]/95 border border-cyan-500/40 p-4 shadow-2xl backdrop-blur-xl z-50 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <div className="font-bold text-cyan-300 font-['Space_Grotesk'] text-sm tracking-wide">
              M4 Five Workstation Apps
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 font-mono">
              v5.0.0
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {apps.map((app) => {
              const Icon = getAppIcon(app.id);
              return (
                <button
                  key={app.id}
                  onClick={() => {
                    onOpenApp(app.id);
                    setShowLauncher(false);
                  }}
                  className="p-2.5 rounded-xl bg-slate-900/60 hover:bg-cyan-500/15 border border-slate-800 hover:border-cyan-500/40 text-left transition flex items-center space-x-2.5 cursor-pointer group"
                >
                  <div className="p-2 rounded-lg bg-slate-950 group-hover:bg-cyan-500/20 text-cyan-400 transition">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-medium text-slate-200 group-hover:text-cyan-300 truncate">
                      {app.name}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate">{app.category}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
