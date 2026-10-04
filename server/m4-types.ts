/**
 * M4 Five OS — Subsystem Shared Types & Data Contracts
 */

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface CapabilityRule {
  capability: string;
  riskLevel: RiskLevel;
  requiredPermission: string;
  requiresConfirmation: boolean;
  description: string;
}

export interface SecurityAuditRecord {
  id: string;
  timestamp: string;
  caller: string;
  capability: string;
  riskLevel: RiskLevel;
  status: 'APPROVED' | 'REJECTED' | 'PENDING_USER_APPROVAL';
  rationale: string;
  details: Record<string, unknown>;
}

export interface PendingSecurityRequest {
  id: string;
  timestamp: string;
  caller: string;
  capability: string;
  riskLevel: RiskLevel;
  description: string;
  payload: Record<string, unknown>;
  autoTimeoutSeconds: number;
}

export interface MemoryRecord {
  id: string;
  category: 'system' | 'session' | 'preference' | 'task' | 'knowledge';
  title: string;
  content: string;
  tags: string[];
  importance: number; // 0.0 to 1.0
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

export interface ToolDefinition {
  name: string;
  description: string;
  riskLevel: RiskLevel;
  requiredPermission: string;
  parameters: {
    type: 'object';
    properties: Record<string, { type: string; description: string; required?: boolean }>;
    required?: string[];
  };
}

export type AgentType =
  | 'orchestrator'
  | 'terminal_agent'
  | 'file_agent'
  | 'browser_agent'
  | 'code_agent'
  | 'system_agent'
  | 'research_agent';

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
  agentType: AgentType;
  prompt: string;
  status: 'queued' | 'planning' | 'executing' | 'completed' | 'failed' | 'waiting_approval';
  plan: AgentTaskStep[];
  createdAt: string;
  completedAt?: string;
  summary?: string;
}

export interface IpcFrame {
  id: string;
  channel: string;
  sender: string;
  timestamp: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  payload: Record<string, unknown>;
}

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
