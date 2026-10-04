/**
 * M4 Five OS — Client API Service Bridge
 */

export interface SystemTelemetry {
  osName: string;
  codename: string;
  version: string;
  kernel: string;
  uptimeSeconds: number;
  cpuUsagePercent: number;
  memoryTotalMB: number;
  memoryUsedMB: number;
  diskTotalGB: number;
  diskUsedGB: number;
  activeProcesses: number;
  activeAgents: number;
  pendingApprovals: number;
  securityMode: string;
}

export interface SecurityAuditRecord {
  id: string;
  timestamp: string;
  caller: string;
  capability: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'APPROVED' | 'REJECTED' | 'PENDING_USER_APPROVAL';
  rationale: string;
  details: Record<string, unknown>;
}

export interface PendingRequest {
  id: string;
  timestamp: string;
  caller: string;
  capability: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  payload: Record<string, unknown>;
}

export interface MemoryRecord {
  id: string;
  category: 'system' | 'session' | 'preference' | 'task' | 'knowledge';
  title: string;
  content: string;
  tags: string[];
  importance: number;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
}

export interface SkillManifest {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  capabilities: string[];
  tools: string[];
  permissions: string[];
  enabled: boolean;
  configuration: Record<string, string>;
}

export interface AgentTaskStep {
  step: number;
  description: string;
  tool: string;
  arguments: Record<string, unknown>;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'needs_approval';
  output?: string;
  executionTimeMs?: number;
}

export interface AgentTask {
  id: string;
  agentType: string;
  prompt: string;
  status: 'queued' | 'planning' | 'executing' | 'completed' | 'failed' | 'waiting_approval';
  plan: AgentTaskStep[];
  createdAt: string;
  completedAt?: string;
  summary?: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  riskLevel: string;
  requiredPermission: string;
  parameters: Record<string, unknown>;
}

export const api = {
  async getTelemetry(): Promise<SystemTelemetry> {
    const res = await fetch('/api/v1/system/telemetry');
    return res.json();
  },

  async getConfig(): Promise<any> {
    const res = await fetch('/api/v1/system/config');
    return res.json();
  },

  async updateConfig(patch: any): Promise<any> {
    const res = await fetch('/api/v1/system/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    return res.json();
  },

  async getCapabilities(): Promise<any[]> {
    const res = await fetch('/api/v1/security/capabilities');
    return res.json();
  },

  async getAuditLog(limit = 50): Promise<SecurityAuditRecord[]> {
    const res = await fetch(`/api/v1/security/audit?limit=${limit}`);
    return res.json();
  },

  async getPendingRequests(): Promise<PendingRequest[]> {
    const res = await fetch('/api/v1/security/pending');
    return res.json();
  },

  async resolveApproval(requestId: string, approved: boolean): Promise<any> {
    const res = await fetch('/api/v1/security/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId, approved }),
    });
    return res.json();
  },

  async getMemories(query = '', category = ''): Promise<MemoryRecord[]> {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (category) params.set('cat', category);
    const res = await fetch(`/api/v1/memory?${params.toString()}`);
    return res.json();
  },

  async createMemory(mem: Partial<MemoryRecord>): Promise<MemoryRecord> {
    const res = await fetch('/api/v1/memory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mem),
    });
    return res.json();
  },

  async deleteMemory(id: string): Promise<boolean> {
    const res = await fetch(`/api/v1/memory/${id}`, { method: 'DELETE' });
    const data = await res.json();
    return data.success;
  },

  async exportMemories(): Promise<any> {
    const res = await fetch('/api/v1/memory/export');
    return res.json();
  },

  async getSkills(): Promise<SkillManifest[]> {
    const res = await fetch('/api/v1/skills');
    return res.json();
  },

  async registerSkill(manifest: Partial<SkillManifest>): Promise<any> {
    const res = await fetch('/api/v1/skills/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(manifest),
    });
    return res.json();
  },

  async toggleSkill(name: string, enabled: boolean): Promise<any> {
    const res = await fetch('/api/v1/skills/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, enabled }),
    });
    return res.json();
  },

  async getTools(): Promise<ToolDefinition[]> {
    const res = await fetch('/api/v1/tools');
    return res.json();
  },

  async getFiles(): Promise<{ path: string; size: number; modified: string; permissions: string }[]> {
    const res = await fetch('/api/v1/tools/files');
    return res.json();
  },

  async executeTool(caller: string, tool: string, args: Record<string, unknown> = {}, bypassConfirmation = false): Promise<any> {
    const res = await fetch('/api/v1/tools/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caller, tool, args, bypassConfirmation }),
    });
    return res.json();
  },

  async getAgentTasks(): Promise<AgentTask[]> {
    const res = await fetch('/api/v1/agents/tasks');
    return res.json();
  },

  async runAgentTask(agentType: string, prompt: string): Promise<AgentTask> {
    const res = await fetch('/api/v1/agents/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentType, prompt }),
    });
    return res.json();
  },

  async chatWithM4(prompt: string, contextCategory?: string): Promise<{ answer: string; memoriesUsed: any[]; model: string; provider: string }> {
    const res = await fetch('/api/v1/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, contextCategory }),
    });
    return res.json();
  },

  async getLogs(limit = 100): Promise<any[]> {
    const res = await fetch(`/api/v1/logs?limit=${limit}`);
    return res.json();
  },
};
