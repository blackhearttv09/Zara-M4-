import React, { useState, useEffect } from 'react';
import { Shield, ShieldAlert, CheckCircle, XCircle, AlertTriangle, RefreshCw, Clock } from 'lucide-react';
import { api, PendingRequest, SecurityAuditRecord } from '../../services/api.ts';

export const SecurityApp: React.FC = () => {
  const [capabilities, setCapabilities] = useState<any[]>([]);
  const [auditLog, setAuditLog] = useState<SecurityAuditRecord[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [selectedRiskFilter, setSelectedRiskFilter] = useState<string>('ALL');

  const fetchData = async () => {
    try {
      const [caps, audits, pending] = await Promise.all([
        api.getCapabilities(),
        api.getAuditLog(60),
        api.getPendingRequests(),
      ]);
      setCapabilities(caps);
      setAuditLog(audits);
      setPendingRequests(pending);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
    const timer = setInterval(fetchData, 2500);
    return () => clearInterval(timer);
  }, []);

  const handleResolve = async (requestId: string, approved: boolean) => {
    try {
      await api.resolveApproval(requestId, approved);
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const filteredAudits = auditLog.filter((a) => {
    if (selectedRiskFilter === 'ALL') return true;
    return a.riskLevel === selectedRiskFilter;
  });

  return (
    <div className="h-full flex flex-col bg-[#07090e] text-slate-200 text-xs">
      {/* Top Banner / Sandbox Status */}
      <div className="p-3 border-b border-slate-800/80 bg-slate-950/50 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <div className="font-semibold text-emerald-400 font-['Space_Grotesk'] tracking-wide">
              Zero-Trust Security & Permission Sandbox
            </div>
            <div className="text-[10px] text-slate-400">
              Enforced Policy: Human Confirmation for High/Critical Risk Tiers
            </div>
          </div>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Main Split: Pending Approvals & Audit Trail */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Capabilities & Pending Approvals */}
        <div className="w-80 border-r border-slate-800/80 flex flex-col bg-slate-950/20 overflow-y-auto">
          {/* Pending Requests Section */}
          <div className="p-3 border-b border-slate-800/80 bg-amber-950/20">
            <div className="font-semibold text-amber-300 text-[11px] flex items-center space-x-1.5 mb-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Pending Approvals ({pendingRequests.length})</span>
            </div>

            {pendingRequests.length === 0 ? (
              <div className="text-[11px] text-slate-500 italic">No operations pending human approval.</div>
            ) : (
              <div className="space-y-2">
                {pendingRequests.map((req) => (
                  <div key={req.id} className="p-2.5 rounded-lg bg-slate-900 border border-amber-500/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-cyan-400">{req.capability}</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-950 text-rose-300 border border-rose-800">
                        {req.riskLevel}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-300">{req.description}</div>
                    <div className="p-1.5 bg-black/60 rounded text-[10px] font-mono text-slate-400 overflow-x-auto">
                      {JSON.stringify(req.payload)}
                    </div>
                    <div className="flex space-x-2 pt-1">
                      <button
                        onClick={() => handleResolve(req.id, true)}
                        className="flex-1 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[10px] transition cursor-pointer"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleResolve(req.id, false)}
                        className="flex-1 py-1 rounded bg-slate-800 hover:bg-rose-950 hover:text-rose-300 text-slate-400 text-[10px] transition cursor-pointer"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Capability Matrix */}
          <div className="p-3 border-b border-slate-800/80 font-semibold text-slate-300 text-[11px]">
            Registered Capability Matrix
          </div>
          <div className="p-2 space-y-1.5">
            {capabilities.map((cap) => (
              <div key={cap.capability} className="p-2 rounded bg-slate-900/60 border border-slate-800/60 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-cyan-300 text-[11px] font-semibold">{cap.capability}</span>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                      cap.riskLevel === 'CRITICAL'
                        ? 'bg-rose-950 text-rose-300 border border-rose-800'
                        : cap.riskLevel === 'HIGH'
                        ? 'bg-amber-950 text-amber-300 border border-amber-800'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {cap.riskLevel}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 leading-tight">{cap.description}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Audit Trail Log */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-2 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/30">
            <span className="font-semibold text-slate-300 font-['Space_Grotesk'] flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Tamper-Evident Audit Trail</span>
            </span>

            {/* Filter buttons */}
            <div className="flex items-center space-x-1">
              {['ALL', 'CRITICAL', 'HIGH', 'LOW'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setSelectedRiskFilter(filter)}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium transition cursor-pointer ${
                    selectedRiskFilter === filter
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {filteredAudits.map((record) => (
              <div
                key={record.id}
                className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 space-y-1.5 text-[11px]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {record.status === 'APPROVED' ? (
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-rose-400" />
                    )}
                    <span className="font-mono text-cyan-300 font-semibold">{record.capability}</span>
                    <span className="text-slate-500 font-mono text-[10px]">by {record.caller}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                        record.riskLevel === 'CRITICAL'
                          ? 'bg-rose-950 text-rose-300'
                          : record.riskLevel === 'HIGH'
                          ? 'bg-amber-950 text-amber-300'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {record.riskLevel}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(record.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
                <div className="text-slate-300">{record.rationale}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
