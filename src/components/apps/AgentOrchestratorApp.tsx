import React, { useState, useEffect } from 'react';
import { Bot, Play, CheckCircle2, AlertCircle, Clock, ShieldCheck, Terminal, FolderTree, Globe, Code, Cpu, Search, RefreshCw } from 'lucide-react';
import { api, AgentTask } from '../../services/api.ts';

const AGENTS = [
  { id: 'orchestrator', name: 'M4 Master Orchestrator', icon: Bot, desc: 'Central planner delegating complex multi-agent system goals' },
  { id: 'terminal_agent', name: 'Terminal Agent', icon: Terminal, desc: 'Executes validated shell pipelines within sandbox bounds' },
  { id: 'file_agent', name: 'File Agent', icon: FolderTree, desc: 'Performs safe traversal, diff generation, and inode management' },
  { id: 'browser_agent', name: 'Browser Agent', icon: Globe, desc: 'Autonomous web session management and endpoint probing' },
  { id: 'code_agent', name: 'Code Agent', icon: Code, desc: 'AST code synthesis, static type checking, and test execution' },
  { id: 'system_agent', name: 'System Agent', icon: Cpu, desc: 'Kernel diagnostics, process inspection, and resource balancing' },
  { id: 'research_agent', name: 'Research Agent', icon: Search, desc: 'Cognitive memory semantic lookup and synthesis' },
];

export const AgentOrchestratorApp: React.FC = () => {
  const [selectedAgent, setSelectedAgent] = useState('orchestrator');
  const [prompt, setPrompt] = useState('');
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [activeTask, setActiveTask] = useState<AgentTask | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTasks = async () => {
    try {
      const data = await api.getAgentTasks();
      setTasks(data);
      if (data.length > 0 && !activeTask) {
        setActiveTask(data[0]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchTasks();
    const timer = setInterval(fetchTasks, 3000);
    return () => clearInterval(timer);
  }, []);

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const newTask = await api.runAgentTask(selectedAgent, prompt);
      setTasks((prev) => [newTask, ...prev]);
      setActiveTask(newTask);
      setPrompt('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full flex bg-[#06080d] text-slate-200 text-xs">
      {/* Sidebar: Agents & Recent Tasks */}
      <div className="w-64 border-r border-slate-800/80 flex flex-col bg-slate-950/40">
        <div className="p-3 border-b border-slate-800/80 flex items-center justify-between">
          <span className="font-semibold text-cyan-400 font-['Space_Grotesk'] tracking-wide">
            Autonomous Agents
          </span>
          <button onClick={fetchTasks} className="text-slate-400 hover:text-cyan-400 transition">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Agent Selector List */}
        <div className="p-2 space-y-1">
          {AGENTS.map((agent) => {
            const Icon = agent.icon;
            const isSelected = selectedAgent === agent.id;
            return (
              <button
                key={agent.id}
                onClick={() => setSelectedAgent(agent.id)}
                className={`w-full text-left p-2 rounded-lg flex items-center space-x-2.5 transition cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-500/15 border border-cyan-500/40 text-cyan-300'
                    : 'hover:bg-slate-900/60 text-slate-400'
                }`}
              >
                <div className={`p-1.5 rounded-md ${isSelected ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-900 text-slate-500'}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 truncate">
                  <div className="font-medium truncate">{agent.name}</div>
                  <div className="text-[10px] text-slate-500 truncate">{agent.desc}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Recent Tasks List */}
        <div className="p-3 border-t border-slate-800/80 font-semibold text-slate-400 text-[11px]">
          Task Execution History ({tasks.length})
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {tasks.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTask(t)}
              className={`w-full text-left p-2 rounded-lg border transition cursor-pointer ${
                activeTask?.id === t.id
                  ? 'bg-slate-900/90 border-cyan-500/40 text-slate-200'
                  : 'bg-slate-950/40 border-slate-800/40 hover:bg-slate-900/40 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-[10px] text-cyan-400">{t.agentType}</span>
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                    t.status === 'completed'
                      ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                      : t.status === 'waiting_approval'
                      ? 'bg-amber-950/60 text-amber-400 border border-amber-800/40'
                      : 'bg-cyan-950/60 text-cyan-400 border border-cyan-800/40'
                  }`}
                >
                  {t.status}
                </span>
              </div>
              <div className="text-[11px] truncate font-medium">{t.prompt}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Task Dispatch Input Form */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-950/30">
          <form onSubmit={handleDispatch} className="flex space-x-2">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={`Instruct ${AGENTS.find((a) => a.id === selectedAgent)?.name} (e.g. "audit process memory" or "search /etc configs")...`}
              className="flex-1 bg-slate-900/80 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/80"
            />
            <button
              type="submit"
              disabled={isSubmitting || !prompt.trim()}
              className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs flex items-center space-x-1.5 disabled:opacity-40 transition cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Dispatch Agent</span>
            </button>
          </form>
        </div>

        {/* Active Task Details & Step Pipeline */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeTask ? (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-base font-bold text-cyan-300 font-['Space_Grotesk']">{activeTask.prompt}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 font-mono">
                      {activeTask.id}
                    </span>
                  </div>
                  <div className="text-slate-400 text-[11px] mt-0.5">
                    Agent: <span className="text-cyan-400 font-medium">{activeTask.agentType}</span> • Dispatched:{' '}
                    {new Date(activeTask.createdAt).toLocaleTimeString()}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-[11px] text-emerald-400">Zero-Trust Sandbox Protected</span>
                </div>
              </div>

              {/* Step By Step Plan */}
              <div className="space-y-2">
                <div className="font-semibold text-slate-300 text-xs flex items-center space-x-2">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Execution Pipeline Steps</span>
                </div>

                <div className="space-y-2.5">
                  {activeTask.plan.map((step) => (
                    <div
                      key={step.step}
                      className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80 space-y-2 transition"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-300 flex items-center justify-center font-bold text-[10px]">
                            {step.step}
                          </span>
                          <span className="font-medium text-slate-200">{step.description}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-900 text-cyan-400 border border-slate-700/60">
                            Tool: {step.tool}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                              step.status === 'completed'
                                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/50'
                                : step.status === 'running'
                                ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/50 animate-pulse'
                                : step.status === 'needs_approval'
                                ? 'bg-amber-950/80 text-amber-300 border border-amber-800/50'
                                : 'bg-slate-900 text-slate-400'
                            }`}
                          >
                            {step.status}
                          </span>
                        </div>
                      </div>

                      {/* Tool Output or Parameters */}
                      {step.output && (
                        <div className="p-2.5 rounded bg-black/60 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto whitespace-pre-wrap">
                          {step.output}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Task Result Summary */}
              {activeTask.summary && (
                <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-900/40 flex items-start space-x-2 text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                  <div>
                    <div className="font-semibold">Task Finished Successfully</div>
                    <div className="text-[11px] text-emerald-200/80">{activeTask.summary}</div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2">
              <Bot className="w-8 h-8 text-slate-600" />
              <span>No task selected. Dispatch an agent command above.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
