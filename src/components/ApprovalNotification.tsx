import React from 'react';
import { AlertTriangle, Check, X } from 'lucide-react';
import { PendingRequest } from '../services/api.ts';

interface ApprovalNotificationProps {
  request: PendingRequest | null;
  onResolve: (requestId: string, approved: boolean) => void;
}

export const ApprovalNotification: React.FC<ApprovalNotificationProps> = ({ request, onResolve }) => {
  if (!request) return null;

  return (
    <div className="fixed top-5 right-5 z-50 w-96 rounded-2xl bg-[#0e121d] border border-amber-500/60 p-4 shadow-2xl shadow-amber-950/60 backdrop-blur-xl animate-in slide-in-from-right duration-200">
      <div className="flex items-center space-x-2.5 mb-2">
        <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
          <AlertTriangle className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <div className="text-xs font-bold text-amber-300 font-['Space_Grotesk'] tracking-wide">
            Zero-Trust Permission Prompt
          </div>
          <div className="text-[10px] text-slate-400">High-Risk Operation Escalated</div>
        </div>
        <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-rose-950 text-rose-300 border border-rose-800">
          {request.riskLevel}
        </span>
      </div>

      <div className="space-y-1.5 text-xs text-slate-200 mb-3">
        <div className="font-semibold text-cyan-300 font-mono text-[11px]">{request.capability}</div>
        <div className="text-[11px] text-slate-300 leading-tight">{request.description}</div>
        <div className="p-2 rounded bg-black/60 border border-slate-800 text-[10px] font-mono text-slate-400 overflow-x-auto">
          {JSON.stringify(request.payload)}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={() => onResolve(request.id, true)}
          className="flex-1 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer"
        >
          <Check className="w-3.5 h-3.5" />
          <span>Approve Action</span>
        </button>
        <button
          onClick={() => onResolve(request.id, false)}
          className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 hover:text-rose-300 text-slate-300 font-medium text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
          <span>Reject</span>
        </button>
      </div>
    </div>
  );
};
