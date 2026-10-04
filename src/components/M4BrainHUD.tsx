import React, { useState } from 'react';
import { Bot, Send, Sparkles, X, BrainCircuit, Shield, Terminal, ArrowRight, Mic, MicOff } from 'lucide-react';
import { api } from '../services/api.ts';

interface M4BrainHUDProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchApp: (appId: any) => void;
}

export const M4BrainHUD: React.FC<M4BrainHUDProps> = ({ isOpen, onClose, onLaunchApp }) => {
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<
    Array<{ role: 'user' | 'assistant'; text: string; memories?: any[]; model?: string }>
  >([
    {
      role: 'assistant',
      text: 'M4 Brain online. Zero-Trust security rules armed. I can orchestrate your agents, inspect memory, analyze system logs, and dispatch controlled tools. How may I assist your mission?',
      model: 'gemini-3.8-flash',
    },
  ]);
  const [isThinking, setIsThinking] = useState(false);
  const [isListening, setIsListening] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = prompt.trim();
    if (!query || isThinking) return;

    setMessages((prev) => [...prev, { role: 'user', text: query }]);
    setPrompt('');
    setIsThinking(true);

    try {
      const res = await api.chatWithM4(query);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: res.answer,
          memories: res.memoriesUsed,
          model: res.model,
        },
      ]);
    } catch (err: unknown) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `Cognitive synthesis failure: ${err instanceof Error ? err.message : String(err)}`,
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleVoiceToggle = () => {
    setIsListening(!isListening);
    if (!isListening) {
      // Simulate voice capture prompt
      setTimeout(() => {
        setPrompt('Audit active system processes and check memory status');
        setIsListening(false);
      }, 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-[680px] max-h-[85vh] flex flex-col rounded-2xl bg-[#090d16] border border-cyan-500/50 shadow-2xl shadow-cyan-950/80 overflow-hidden">
        {/* Top Header */}
        <div className="h-12 px-4 border-b border-cyan-500/20 bg-gradient-to-r from-slate-950 via-[#0d1628] to-slate-950 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/40 animate-pulse">
              <BrainCircuit className="w-4 h-4 text-black" />
            </div>
            <div>
              <div className="text-xs font-bold text-cyan-300 font-['Space_Grotesk'] tracking-wider flex items-center space-x-1.5">
                <span>M4 COGNITIVE BRAIN</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                  SERVER-SIDE GEMINI
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="flex items-center space-x-1 text-[10px] text-emerald-400 font-mono">
              <Shield className="w-3 h-3" />
              <span>Zero-Trust Sandbox</span>
            </span>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex flex-col space-y-1 ${m.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] p-3 rounded-xl leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-br-none shadow-md font-medium'
                    : 'bg-slate-900/90 border border-slate-800 text-slate-200 rounded-bl-none shadow-sm'
                }`}
              >
                {m.text}
              </div>

              {/* Memory injection tags if assistant used them */}
              {m.memories && m.memories.length > 0 && (
                <div className="flex items-center space-x-1.5 text-[10px] text-cyan-400 pl-1">
                  <Sparkles className="w-3 h-3" />
                  <span>Referenced Memories:</span>
                  {m.memories.map((mem) => (
                    <span key={mem.id} className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 font-mono">
                      {mem.title}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}

          {isThinking && (
            <div className="flex items-center space-x-2 text-cyan-400 text-xs italic pl-2">
              <span className="animate-spin">⠋</span>
              <span>M4 Cognitive Engine reasoning through active memory & skills...</span>
            </div>
          )}
        </div>

        {/* Quick Agent Actions Shortcuts */}
        <div className="px-4 py-2 bg-slate-950/80 border-t border-slate-800/80 flex items-center space-x-2 overflow-x-auto text-[10px]">
          <span className="text-slate-500 font-medium">Quick Dispatch:</span>
          <button
            onClick={() => {
              onClose();
              onLaunchApp('orchestrator');
            }}
            className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-800 flex items-center space-x-1 transition cursor-pointer"
          >
            <Bot className="w-3 h-3" />
            <span>Agent Orchestrator</span>
          </button>
          <button
            onClick={() => {
              onClose();
              onLaunchApp('terminal');
            }}
            className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-emerald-300 border border-slate-800 flex items-center space-x-1 transition cursor-pointer"
          >
            <Terminal className="w-3 h-3" />
            <span>Terminal Sandbox</span>
          </button>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="p-3 bg-slate-950 border-t border-cyan-500/20 flex items-center space-x-2">
          <button
            type="button"
            onClick={handleVoiceToggle}
            className={`p-2 rounded-lg border transition cursor-pointer ${
              isListening
                ? 'bg-rose-500 text-white border-rose-400 animate-pulse'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-cyan-300 border-slate-800'
            }`}
            title="Simulate Voice Input"
          >
            {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </button>

          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={isListening ? 'Listening for speech input...' : 'Ask M4 Brain or command agents (e.g. "audit process memory" or "search /etc")...'}
            className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/80"
          />
          <button
            type="submit"
            disabled={isThinking || !prompt.trim()}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-semibold text-xs flex items-center space-x-1.5 disabled:opacity-40 transition cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Engage</span>
          </button>
        </form>
      </div>
    </div>
  );
};
