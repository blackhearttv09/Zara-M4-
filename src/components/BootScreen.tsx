import React, { useState, useEffect } from 'react';
import { Terminal, Shield, Cpu, Play } from 'lucide-react';

interface BootScreenProps {
  onBootComplete: () => void;
}

const BOOT_LOGS = [
  '[  0.000000] M4-BIOS v5.2 (UEFI x86_64, ACPI 6.4, SecureBoot: ENFORCED)',
  '[  0.002140] Initializing M4 Quantum Core CPU Scheduler (8 Virtual Cores)...',
  '[  0.045100] Loading Linux Kernel 6.8.0-m4-hardened #1 SMP PREEMPT_DYNAMIC...',
  '[  0.112000] Initializing seccomp-bpf system call filters...',
  '[  0.189000] Zero-Trust Permission Subsystem mounted at /sys/kernel/security/m4',
  '[  0.254000] Initializing SQLite-backed Cognitive Memory Engine (/var/lib/m4five/memory.db)',
  '[  0.341000] Loading M4 Zero-Copy Event & Fast IPC Message Bus...',
  '[  0.412000] Registering 6 Autonomous Agents (Terminal, File, Browser, Code, System, Research)...',
  '[  0.510000] Validating native skills: [m4.sysops, m4.filesystem, m4.devops, m4.cyber_analyst]',
  '[  0.640000] Starting M4 Master Core Daemon Supervisor (PID 14)...',
  '[  0.780000] Initializing M4 Wayland Compositor & Cyber-Glass Desktop Shell...',
  '[  0.920000] System state transition: READY. Welcome to M4 Five OS.',
];

export const BootScreen: React.FC<BootScreenProps> = ({ onBootComplete }) => {
  const [logs, setLogs] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let currentLog = 0;
    const interval = setInterval(() => {
      if (currentLog < BOOT_LOGS.length) {
        setLogs((prev) => [...prev, BOOT_LOGS[currentLog]]);
        setProgress(Math.round(((currentLog + 1) / BOOT_LOGS.length) * 100));
        currentLog++;
      } else {
        clearInterval(interval);
        setTimeout(onBootComplete, 600);
      }
    }, 180);

    return () => clearInterval(interval);
  }, [onBootComplete]);

  return (
    <div className="fixed inset-0 z-50 bg-[#07090e] text-slate-200 font-mono flex flex-col justify-between p-8 select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-cyan-500/20 pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
            <Cpu className="w-5 h-5 text-black" />
          </div>
          <div>
            <div className="text-lg font-bold tracking-wider text-cyan-400 font-['Space_Grotesk']">
              M4 FIVE OS <span className="text-xs px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300">v5.0.0</span>
            </div>
            <div className="text-xs text-slate-400">Autonomous AI-Native Operating System</div>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5 text-xs text-emerald-400">
            <Shield className="w-4 h-4" />
            <span>Zero-Trust Sandbox Armed</span>
          </div>
          <button
            onClick={onBootComplete}
            className="flex items-center space-x-1 px-3 py-1 rounded bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs transition cursor-pointer"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Skip Boot</span>
          </button>
        </div>
      </div>

      {/* Boot Logs Terminal */}
      <div className="my-6 flex-1 bg-black/60 rounded-lg p-5 border border-slate-800/80 overflow-y-auto space-y-2 text-xs font-mono shadow-inner">
        {logs.map((log, idx) => (
          <div key={idx} className="flex items-start space-x-2">
            <span className="text-cyan-500/80">›</span>
            <span className={idx === logs.length - 1 ? 'text-cyan-300 font-semibold animate-pulse' : 'text-slate-300'}>
              {log}
            </span>
          </div>
        ))}
      </div>

      {/* Bottom Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-slate-400">
          <span className="flex items-center space-x-2">
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span>Loading autonomous kernel components...</span>
          </span>
          <span className="text-cyan-400 font-semibold">{progress}%</span>
        </div>
        <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 transition-all duration-150 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};
