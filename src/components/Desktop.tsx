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
  Cpu,
  Sparkles,
} from 'lucide-react';
import { AppId, AppDefinition, WindowState } from '../types.ts';
import { WindowManager } from './WindowManager.tsx';
import { Taskbar } from './Taskbar.tsx';
import { M4BrainHUD } from './M4BrainHUD.tsx';
import { ApprovalNotification } from './ApprovalNotification.tsx';
import { api, SystemTelemetry, PendingRequest } from '../services/api.ts';

// Applications
import { TerminalApp } from './apps/TerminalApp.tsx';
import { AgentOrchestratorApp } from './apps/AgentOrchestratorApp.tsx';
import { FileManagerApp } from './apps/FileManagerApp.tsx';
import { SystemMonitorApp } from './apps/SystemMonitorApp.tsx';
import { SecurityApp } from './apps/SecurityApp.tsx';
import { MemoryApp } from './apps/MemoryApp.tsx';
import { SkillsApp } from './apps/SkillsApp.tsx';
import { SettingsApp } from './apps/SettingsApp.tsx';

const APPS: AppDefinition[] = [
  {
    id: 'terminal',
    name: 'M4 Terminal',
    iconName: 'terminal',
    category: 'tools',
    description: 'Sandboxed shell with real PTY command execution',
    defaultWidth: 720,
    defaultHeight: 480,
  },
  {
    id: 'orchestrator',
    name: 'Agent Orchestrator',
    iconName: 'bot',
    category: 'core',
    description: 'Autonomous multi-agent execution pipeline',
    defaultWidth: 840,
    defaultHeight: 520,
  },
  {
    id: 'files',
    name: 'File Manager',
    iconName: 'files',
    category: 'tools',
    description: 'Virtual and disk filesystem navigator & editor',
    defaultWidth: 760,
    defaultHeight: 490,
  },
  {
    id: 'monitor',
    name: 'System Monitor',
    iconName: 'monitor',
    category: 'system',
    description: 'Real-time CPU/RAM telemetries & PID inspector',
    defaultWidth: 760,
    defaultHeight: 480,
  },
  {
    id: 'security',
    name: 'Security Sandbox',
    iconName: 'security',
    category: 'core',
    description: 'Zero-Trust capabilities & audit trail',
    defaultWidth: 800,
    defaultHeight: 500,
  },
  {
    id: 'memory',
    name: 'Cognitive Memory',
    iconName: 'memory',
    category: 'core',
    description: 'Local SQLite memory graph & knowledge store',
    defaultWidth: 780,
    defaultHeight: 500,
  },
  {
    id: 'skills',
    name: 'Skill Registry',
    iconName: 'skills',
    category: 'core',
    description: 'Modular plugin skills & manifest validation',
    defaultWidth: 740,
    defaultHeight: 480,
  },
  {
    id: 'settings',
    name: 'OS Settings',
    iconName: 'settings',
    category: 'system',
    description: 'System parameters, theme, & kernel options',
    defaultWidth: 680,
    defaultHeight: 460,
  },
];

export const Desktop: React.FC = () => {
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [activeWindowId, setActiveWindowId] = useState<string | null>(null);
  const [telemetry, setTelemetry] = useState<SystemTelemetry | null>(null);
  const [isBrainHUDOpen, setIsBrainHUDOpen] = useState(false);
  const [pendingApproval, setPendingApproval] = useState<PendingRequest | null>(null);
  const [topZIndex, setTopZIndex] = useState(10);

  // Poll system telemetry and pending security approvals
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const telem = await api.getTelemetry();
        setTelemetry(telem);
        const pendings = await api.getPendingRequests();
        setPendingApproval(pendings.length > 0 ? pendings[0] : null);
      } catch (err) {
        console.error(err);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  // Keyboard shortcut for M4 Brain HUD: Cmd/Ctrl + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsBrainHUDOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Open default apps on first render: Terminal & Orchestrator
  useEffect(() => {
    openApp('orchestrator', 80, 50);
    openApp('terminal', 320, 160);
  }, []);

  const openApp = (appId: AppId, customX?: number, customY?: number) => {
    const def = APPS.find((a) => a.id === appId);
    if (!def) return;

    // If window already open, bring to front
    const existing = windows.find((w) => w.appId === appId);
    if (existing) {
      if (existing.minimized) {
        setWindows((prev) =>
          prev.map((w) => (w.id === existing.id ? { ...w, minimized: false } : w))
        );
      }
      bringToFront(existing.id);
      return;
    }

    const newZ = topZIndex + 1;
    setTopZIndex(newZ);

    const x = customX !== undefined ? customX : 100 + (windows.length % 6) * 35;
    const y = customY !== undefined ? customY : 60 + (windows.length % 6) * 35;

    const newWin: WindowState = {
      id: `win-${appId}-${Date.now()}`,
      appId,
      title: def.name,
      icon: def.iconName,
      x,
      y,
      width: def.defaultWidth,
      height: def.defaultHeight,
      minimized: false,
      maximized: false,
      zIndex: newZ,
    };

    setWindows((prev) => [...prev, newWin]);
    setActiveWindowId(newWin.id);
  };

  const closeWindow = (winId: string) => {
    setWindows((prev) => prev.filter((w) => w.id !== winId));
    if (activeWindowId === winId) {
      const remaining = windows.filter((w) => w.id !== winId);
      setActiveWindowId(remaining.length > 0 ? remaining[remaining.length - 1].id : null);
    }
  };

  const minimizeWindow = (winId: string) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === winId ? { ...w, minimized: true } : w))
    );
    if (activeWindowId === winId) {
      setActiveWindowId(null);
    }
  };

  const toggleMaximizeWindow = (winId: string) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === winId ? { ...w, maximized: !w.maximized } : w))
    );
  };

  const bringToFront = (winId: string) => {
    const newZ = topZIndex + 1;
    setTopZIndex(newZ);
    setWindows((prev) =>
      prev.map((w) => (w.id === winId ? { ...w, zIndex: newZ } : w))
    );
    setActiveWindowId(winId);
  };

  const toggleWindowFromTaskbar = (winId: string) => {
    const win = windows.find((w) => w.id === winId);
    if (!win) return;

    if (win.minimized) {
      setWindows((prev) =>
        prev.map((w) => (w.id === winId ? { ...w, minimized: false } : w))
      );
      bringToFront(winId);
    } else if (activeWindowId === winId) {
      minimizeWindow(winId);
    } else {
      bringToFront(winId);
    }
  };

  const renderAppContent = (appId: AppId) => {
    switch (appId) {
      case 'terminal':
        return <TerminalApp />;
      case 'orchestrator':
        return <AgentOrchestratorApp />;
      case 'files':
        return <FileManagerApp />;
      case 'monitor':
        return <SystemMonitorApp />;
      case 'security':
        return <SecurityApp />;
      case 'memory':
        return <MemoryApp />;
      case 'skills':
        return <SkillsApp />;
      case 'settings':
        return <SettingsApp />;
    }
  };

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
    <div className="relative w-screen h-screen overflow-hidden bg-[#04060a] select-none font-sans">
      {/* Dynamic Cyber-OS Ambient Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(6,182,212,0.15),rgba(255,255,255,0))]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.1),transparent_50%)]" />
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(#06b6d4 1px, transparent 1px), linear-gradient(90deg, #06b6d4 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Desktop Top Status Widget */}
      <div className="absolute top-4 left-6 z-10 flex items-center space-x-3 pointer-events-auto">
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-950/70 border border-cyan-500/30 backdrop-blur-md shadow-lg shadow-cyan-950/30">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="font-bold text-xs text-cyan-300 font-['Space_Grotesk'] tracking-wider">
            M4 FIVE OS
          </span>
          <span className="text-[10px] text-slate-400 font-mono">v5.0.0 (Linux 6.8.0-m4)</span>
        </div>

        <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-950/50 border border-slate-800/80 backdrop-blur-md text-[11px] text-slate-300">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span>Zero-Trust Sandbox Enforced</span>
        </div>
      </div>

      {/* Desktop Icons Grid */}
      <div className="absolute top-16 left-6 z-10 grid grid-flow-col grid-rows-6 gap-3 pointer-events-auto">
        {APPS.map((app) => {
          const Icon = getAppIcon(app.id);
          const isOpen = windows.some((w) => w.appId === app.id);
          return (
            <button
              key={app.id}
              onClick={() => openApp(app.id)}
              className="w-20 h-20 rounded-xl hover:bg-cyan-500/10 hover:border-cyan-500/40 border border-transparent p-2 flex flex-col items-center justify-center space-y-1 text-slate-300 hover:text-cyan-300 transition cursor-pointer group"
            >
              <div
                className={`p-2.5 rounded-xl transition ${
                  isOpen
                    ? 'bg-cyan-500/20 text-cyan-300 shadow-md shadow-cyan-500/20'
                    : 'bg-slate-900/80 text-slate-400 group-hover:text-cyan-400 group-hover:bg-slate-800'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-medium tracking-tight text-center leading-tight truncate w-full">
                {app.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Floating M4 AI Brain Super-Banner */}
      <div className="absolute top-4 right-6 z-10 hidden lg:flex items-center space-x-2">
        <button
          onClick={() => setIsBrainHUDOpen(true)}
          className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-950/80 via-slate-900/80 to-blue-950/80 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 text-xs shadow-lg shadow-cyan-950/50 backdrop-blur-md transition cursor-pointer"
        >
          <BrainCircuit className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span className="font-semibold">M4 AI Super-Bar</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/50 text-slate-400 font-mono">⌘K</span>
        </button>
      </div>

      {/* Open Windows Container */}
      {windows.map((win) => (
        <WindowManager
          key={win.id}
          window={win}
          isActive={activeWindowId === win.id}
          onFocus={() => bringToFront(win.id)}
          onClose={() => closeWindow(win.id)}
          onMinimize={() => minimizeWindow(win.id)}
          onToggleMaximize={() => toggleMaximizeWindow(win.id)}
          onUpdatePosition={(x, y) =>
            setWindows((prev) => prev.map((w) => (w.id === win.id ? { ...w, x, y } : w)))
          }
          onUpdateSize={(width, height) =>
            setWindows((prev) => prev.map((w) => (w.id === win.id ? { ...w, width, height } : w)))
          }
        >
          {renderAppContent(win.appId)}
        </WindowManager>
      ))}

      {/* High-Risk Zero-Trust Approval Notification Toast */}
      <ApprovalNotification
        request={pendingApproval}
        onResolve={async (requestId, approved) => {
          await api.resolveApproval(requestId, approved);
          setPendingApproval(null);
        }}
      />

      {/* M4 Brain AI Assistant HUD Overlay */}
      <M4BrainHUD
        isOpen={isBrainHUDOpen}
        onClose={() => setIsBrainHUDOpen(false)}
        onLaunchApp={(appId) => openApp(appId)}
      />

      {/* Bottom Dock / Taskbar */}
      <Taskbar
        apps={APPS}
        windows={windows}
        activeWindowId={activeWindowId}
        telemetry={telemetry}
        onOpenApp={(appId) => openApp(appId)}
        onToggleWindow={toggleWindowFromTaskbar}
        onOpenBrainHUD={() => setIsBrainHUDOpen(true)}
      />
    </div>
  );
};
