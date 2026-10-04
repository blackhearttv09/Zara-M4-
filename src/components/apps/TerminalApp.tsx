import React, { useState, useRef, useEffect } from 'react';
import { Send, Terminal as TerminalIcon, Sparkles } from 'lucide-react';
import { api } from '../../services/api.ts';

interface TerminalLine {
  id: string;
  type: 'input' | 'output' | 'error' | 'system';
  text: string;
  timestamp: string;
}

export const TerminalApp: React.FC = () => {
  const [lines, setLines] = useState<TerminalLine[]>([
    {
      id: 'init-1',
      type: 'system',
      text: 'M4 Five OS — Autonomous Terminal Shell v5.0.0 (x86_64)',
      timestamp: new Date().toLocaleTimeString(),
    },
    {
      id: 'init-2',
      type: 'system',
      text: 'Type "help" for commands, "m4 status" for core telemetry, or "m4 agent run <type> <prompt>" to dispatch agents.',
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState<number>(-1);
  const [isExecuting, setIsExecuting] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  const handleCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = input.trim();
    if (!cmd) return;

    const inputLine: TerminalLine = {
      id: `in-${Date.now()}`,
      type: 'input',
      text: cmd,
      timestamp: new Date().toLocaleTimeString(),
    };

    setLines((prev) => [...prev, inputLine]);
    setHistory((prev) => [...prev, cmd]);
    setHistoryIdx(-1);
    setInput('');
    setIsExecuting(true);

    if (cmd === 'clear') {
      setLines([]);
      setIsExecuting(false);
      return;
    }

    if (cmd === 'help') {
      setLines((prev) => [
        ...prev,
        {
          id: `out-${Date.now()}`,
          type: 'output',
          text: `M4 Five OS Builtin Shell Commands:
  help                     Show this help manual
  clear                    Clear screen buffer
  uname -a                 Display kernel and system architecture
  whoami                   Display current sandboxed session user
  ps                       Display active process table
  ls                       List files in virtual filesystem
  cat <file>               Read file content (e.g. cat /etc/m4/motd)
  m4 status                Inspect M4 Core Supervisor status
  m4 agent list            List active agents
  m4 agent run <agent> <t> Dispatch autonomous agent (e.g. m4 agent run system_agent inspect CPU)
  m4 memory search <q>     Search cognitive memory store`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
      setIsExecuting(false);
      return;
    }

    // Execute via M4 Tool Subsystem
    try {
      const res = await api.executeTool('terminal-user', 'terminal.execute', { command: cmd });
      if (res.pendingRequestId) {
        setLines((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            type: 'error',
            text: `[SECURITY NOTICE] Command paused for human confirmation (Risk: CRITICAL).
Request ID: ${res.pendingRequestId}
Please review and click Approve in the Security Center or bottom notification toast.`,
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);
      } else if (res.success && res.output) {
        const stdout = res.output.stdout || JSON.stringify(res.output, null, 2);
        const stderr = res.output.stderr;
        if (stdout) {
          setLines((prev) => [
            ...prev,
            { id: `out-${Date.now()}`, type: 'output', text: stdout, timestamp: new Date().toLocaleTimeString() },
          ]);
        }
        if (stderr) {
          setLines((prev) => [
            ...prev,
            { id: `err-${Date.now()}`, type: 'error', text: stderr, timestamp: new Date().toLocaleTimeString() },
          ]);
        }
      } else {
        setLines((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            type: 'error',
            text: res.error || 'Execution returned non-zero code',
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);
      }
    } catch (err: unknown) {
      setLines((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          type: 'error',
          text: `Command execution exception: ${err instanceof Error ? err.message : String(err)}`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0) {
        const nextIdx = historyIdx === -1 ? history.length - 1 : Math.max(0, historyIdx - 1);
        setHistoryIdx(nextIdx);
        setInput(history[nextIdx] || '');
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIdx !== -1) {
        const nextIdx = historyIdx + 1;
        if (nextIdx < history.length) {
          setHistoryIdx(nextIdx);
          setInput(history[nextIdx]);
        } else {
          setHistoryIdx(-1);
          setInput('');
        }
      }
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#05070a] text-slate-200 font-mono text-xs select-text">
      {/* Top Banner */}
      <div className="h-7 px-3 bg-slate-950/80 border-b border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center space-x-1.5 text-cyan-400">
          <TerminalIcon className="w-3.5 h-3.5" />
          <span>m4user@m4five: ~</span>
        </span>
        <span className="flex items-center space-x-2 text-[10px] text-slate-500">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>PTY SANDBOX ENFORCED</span>
        </span>
      </div>

      {/* Terminal Output */}
      <div className="flex-1 p-3 overflow-y-auto space-y-1.5 leading-relaxed font-mono">
        {lines.map((line) => (
          <div key={line.id} className="whitespace-pre-wrap break-all">
            {line.type === 'input' && (
              <div className="flex items-start space-x-2 text-cyan-300 font-medium">
                <span className="text-emerald-400">m4user@m4five:~$</span>
                <span>{line.text}</span>
              </div>
            )}
            {line.type === 'output' && <div className="text-slate-300">{line.text}</div>}
            {line.type === 'system' && <div className="text-cyan-500/90 font-semibold">{line.text}</div>}
            {line.type === 'error' && <div className="text-rose-400 bg-rose-950/20 p-1.5 rounded border border-rose-900/40">{line.text}</div>}
          </div>
        ))}
        {isExecuting && (
          <div className="flex items-center space-x-2 text-cyan-400 text-xs italic">
            <span className="animate-spin">⠋</span>
            <span>Executing inside isolated zero-trust sandbox...</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Terminal Input Prompt */}
      <form onSubmit={handleCommand} className="h-10 px-3 bg-slate-950 border-t border-slate-800/80 flex items-center space-x-2">
        <span className="text-emerald-400 font-bold select-none">m4user@m4five:~$</span>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          placeholder="Type command or m4 status..."
          className="flex-1 bg-transparent border-none outline-none text-cyan-200 font-mono text-xs placeholder:text-slate-600"
        />
        <button
          type="submit"
          disabled={isExecuting || !input.trim()}
          className="p-1.5 rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 disabled:opacity-40 transition cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
