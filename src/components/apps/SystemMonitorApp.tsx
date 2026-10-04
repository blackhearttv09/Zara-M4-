import React, { useState, useEffect } from 'react';
import { Activity, Cpu, HardDrive, Server, RefreshCw, XCircle, Search, Eye } from 'lucide-react';
import { api, SystemTelemetry } from '../../services/api.ts';

interface ProcessItem {
  pid: number;
  name: string;
  user: string;
  cpu: number;
  mem: number;
  status: string;
  threads: number;
}

export const SystemMonitorApp: React.FC = () => {
  const [telemetry, setTelemetry] = useState<SystemTelemetry | null>(null);
  const [processes, setProcesses] = useState<ProcessItem[]>([]);
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedProcess, setSelectedProcess] = useState<ProcessItem | null>(null);
  const [inspectData, setInspectData] = useState<any>(null);

  const fetchData = async () => {
    try {
      const telem = await api.getTelemetry();
      setTelemetry(telem);

      const procRes = await api.executeTool('sysmon', 'process.list', {});
      if (procRes.success && procRes.output?.processes) {
        setProcesses(procRes.output.processes);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
    const timer = setInterval(fetchData, 2500);
    return () => clearInterval(timer);
  }, []);

  const handleInspect = async (proc: ProcessItem) => {
    setSelectedProcess(proc);
    try {
      const res = await api.executeTool('sysmon', 'process.inspect', { pid: proc.pid });
      if (res.success) {
        setInspectData(res.output);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredProcesses = processes.filter((p) =>
    searchFilter ? p.name.toLowerCase().includes(searchFilter.toLowerCase()) : true
  );

  return (
    <div className="h-full flex flex-col bg-[#07090e] text-slate-200 text-xs">
      {/* Top Telemetry Metric Cards */}
      <div className="p-3 border-b border-slate-800/80 grid grid-cols-4 gap-3 bg-slate-950/40">
        <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center space-x-3">
          <div className="p-2 rounded-md bg-cyan-500/20 text-cyan-400">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-medium">CPU Utilization</div>
            <div className="text-base font-bold text-cyan-300 font-mono">
              {telemetry ? `${telemetry.cpuUsagePercent}%` : '--'}
            </div>
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center space-x-3">
          <div className="p-2 rounded-md bg-blue-500/20 text-blue-400">
            <Server className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-medium">Memory Allocation</div>
            <div className="text-base font-bold text-blue-300 font-mono">
              {telemetry ? `${telemetry.memoryUsedMB} MB` : '--'}
            </div>
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center space-x-3">
          <div className="p-2 rounded-md bg-indigo-500/20 text-indigo-400">
            <HardDrive className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-medium">Disk Volume (NVMe)</div>
            <div className="text-base font-bold text-indigo-300 font-mono">
              {telemetry ? `${telemetry.diskUsedGB} / ${telemetry.diskTotalGB} GB` : '--'}
            </div>
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center space-x-3">
          <div className="p-2 rounded-md bg-emerald-500/20 text-emerald-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-medium">Kernel State</div>
            <div className="text-base font-bold text-emerald-400 font-mono">ENFORCING</div>
          </div>
        </div>
      </div>

      {/* Main Process Table */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col border-r border-slate-800/80">
          {/* Table Header / Filter */}
          <div className="p-2 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/20">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-slate-300 font-['Space_Grotesk']">
                Active Processes ({filteredProcesses.length})
              </span>
              <button onClick={fetchData} className="text-slate-400 hover:text-cyan-400">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex items-center bg-slate-900 px-2 py-1 rounded border border-slate-800">
              <Search className="w-3 h-3 text-slate-500 mr-1.5" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Filter process name..."
                className="bg-transparent border-none outline-none text-[11px] text-slate-200"
              />
            </div>
          </div>

          {/* Process Grid */}
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] text-slate-500 bg-slate-950/60">
                  <th className="p-2 font-mono">PID</th>
                  <th className="p-2">COMMAND</th>
                  <th className="p-2">USER</th>
                  <th className="p-2">CPU%</th>
                  <th className="p-2">MEM(MB)</th>
                  <th className="p-2">STATUS</th>
                  <th className="p-2 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 font-mono text-[11px]">
                {filteredProcesses.map((proc) => (
                  <tr
                    key={proc.pid}
                    className={`hover:bg-cyan-500/10 transition ${selectedProcess?.pid === proc.pid ? 'bg-cyan-500/15 text-cyan-300' : 'text-slate-300'}`}
                  >
                    <td className="p-2 text-cyan-400 font-semibold">{proc.pid}</td>
                    <td className="p-2 font-sans font-medium text-slate-100">{proc.name}</td>
                    <td className="p-2 text-slate-400">{proc.user}</td>
                    <td className="p-2">{proc.cpu}%</td>
                    <td className="p-2">{proc.mem}</td>
                    <td className="p-2">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                        {proc.status}
                      </span>
                    </td>
                    <td className="p-2 text-right">
                      <button
                        onClick={() => handleInspect(proc)}
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 transition text-[10px] cursor-pointer"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Process Detail Inspector */}
        {selectedProcess && inspectData && (
          <div className="w-80 p-4 bg-slate-950/60 overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-semibold text-cyan-300 flex items-center space-x-1.5">
                <Eye className="w-4 h-4 text-cyan-400" />
                <span>PID {selectedProcess.pid}: {selectedProcess.name}</span>
              </span>
              <button onClick={() => setSelectedProcess(null)} className="text-slate-400 hover:text-white">
                <XCircle className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-[11px]">
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Security Sandbox</span>
                <span className="text-emerald-400 font-semibold">Active & Contained</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Allocated Threads</span>
                <span className="font-mono text-cyan-300">{selectedProcess.threads}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Resident Memory</span>
                <span className="font-mono text-cyan-300">{selectedProcess.mem} MB</span>
              </div>
            </div>

            <div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1.5">
                Open File Descriptors
              </div>
              <div className="p-2 rounded bg-black/60 border border-slate-800 text-[10px] font-mono text-slate-300 space-y-1">
                {inspectData.descriptors?.map((d: string, i: number) => (
                  <div key={i} className="truncate">› {d}</div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
