/**
 * M4 Five OS — Zero-Trust Security & Permission Sandbox (STEP 06)
 */

import { CapabilityRule, RiskLevel, SecurityAuditRecord, PendingSecurityRequest } from './m4-types.ts';
import { logger } from './m4-logger.ts';
import { ipcBus } from './m4-ipc.ts';

const DEFAULT_CAPABILITIES: Record<string, CapabilityRule> = {
  'system.info': {
    capability: 'system.info',
    riskLevel: 'LOW',
    requiredPermission: 'sys:read',
    requiresConfirmation: false,
    description: 'Read system specifications, kernel release, uptime, and telemetry',
  },
  'process.list': {
    capability: 'process.list',
    riskLevel: 'LOW',
    requiredPermission: 'proc:read',
    requiresConfirmation: false,
    description: 'Enumerate running processes and thread allocation',
  },
  'process.inspect': {
    capability: 'process.inspect',
    riskLevel: 'MEDIUM',
    requiredPermission: 'proc:inspect',
    requiresConfirmation: false,
    description: 'Inspect detailed process metrics, memory mapping, and open descriptors',
  },
  'files.read': {
    capability: 'files.read',
    riskLevel: 'LOW',
    requiredPermission: 'fs:read',
    requiresConfirmation: false,
    description: 'Read filesystem files inside authorized root spaces',
  },
  'files.write': {
    capability: 'files.write',
    riskLevel: 'HIGH',
    requiredPermission: 'fs:write',
    requiresConfirmation: true,
    description: 'Create or modify filesystem files and directories',
  },
  'files.search': {
    capability: 'files.search',
    riskLevel: 'LOW',
    requiredPermission: 'fs:search',
    requiresConfirmation: false,
    description: 'Search files and directories with glob and regex matchers',
  },
  'terminal.execute': {
    capability: 'terminal.execute',
    riskLevel: 'CRITICAL',
    requiredPermission: 'exec:cmd',
    requiresConfirmation: true,
    description: 'Execute shell commands or scripts through sandboxed PTY',
  },
  'app.launch': {
    capability: 'app.launch',
    riskLevel: 'MEDIUM',
    requiredPermission: 'app:launch',
    requiresConfirmation: false,
    description: 'Launch internal applications and windowed processes',
  },
  'memory.export': {
    capability: 'memory.export',
    riskLevel: 'MEDIUM',
    requiredPermission: 'mem:export',
    requiresConfirmation: false,
    description: 'Export cognitive memory database snapshot',
  },
};

const BLOCKED_COMMAND_PATTERNS = [
  'rm -rf /',
  'rm -rf /*',
  'mkfs',
  ':(){ :|:& };:',
  'dd if=/dev/zero of=/dev/sd',
  'chmod -R 777 /',
  'cat /etc/shadow',
  '> /dev/sda',
];

class SecuritySubsystem {
  private capabilities: Map<string, CapabilityRule> = new Map();
  private auditLog: SecurityAuditRecord[] = [];
  private pendingRequests: Map<string, PendingSecurityRequest> = new Map();
  private approvalResolvers: Map<string, (approved: boolean) => void> = new Map();

  constructor() {
    for (const [key, rule] of Object.entries(DEFAULT_CAPABILITIES)) {
      this.capabilities.set(key, rule);
    }
    logger.info('m4-security', 'Zero-Trust Security Sandbox initialized with mandatory isolation.');
  }

  public getCapabilities(): CapabilityRule[] {
    return Array.from(this.capabilities.values());
  }

  public getAuditTrail(limit = 100): SecurityAuditRecord[] {
    return [...this.auditLog].reverse().slice(0, limit);
  }

  public getPendingRequests(): PendingSecurityRequest[] {
    return Array.from(this.pendingRequests.values());
  }

  public async evaluateRequest(
    caller: string,
    capability: string,
    payload: Record<string, unknown>
  ): Promise<{ allowed: boolean; reason?: string; pendingRequestId?: string }> {
    const payloadStr = JSON.stringify(payload);

    // 1. Check blocked patterns (Strict Anti-Destruction Filter)
    for (const pattern of BLOCKED_COMMAND_PATTERNS) {
      if (payloadStr.includes(pattern)) {
        this.recordAudit(caller, capability, 'CRITICAL', 'REJECTED', `Prohibited destructive pattern: ${pattern}`, payload);
        logger.error('m4-security', `BLOCKED malicious command containing pattern: ${pattern}`);
        ipcBus.publish('security.alert', 'm4-security', {
          type: 'EXPLOIT_PREVENTION',
          pattern,
          caller,
        }, 'urgent');
        return { allowed: false, reason: `Action rejected: contains prohibited system command '${pattern}'` };
      }
    }

    // 2. Capability verification
    const rule = this.capabilities.get(capability);
    if (!rule) {
      this.recordAudit(caller, capability, 'CRITICAL', 'REJECTED', 'Undeclared capability requested', payload);
      return { allowed: false, reason: `Action rejected: undeclared capability '${capability}'` };
    }

    // 3. User Confirmation Requirement for High/Critical Risk Tiers
    if (rule.requiresConfirmation) {
      const requestId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const pending: PendingSecurityRequest = {
        id: requestId,
        timestamp: new Date().toISOString(),
        caller,
        capability,
        riskLevel: rule.riskLevel,
        description: rule.description,
        payload,
        autoTimeoutSeconds: 60,
      };

      this.pendingRequests.set(requestId, pending);
      this.recordAudit(caller, capability, rule.riskLevel, 'PENDING_USER_APPROVAL', 'Escalated to human supervisor', payload);

      ipcBus.publish('security.approval_needed', 'm4-security', {
        request: pending,
      }, 'high');

      return {
        allowed: false,
        reason: `High-risk action requires human confirmation. Request ID: ${requestId}`,
        pendingRequestId: requestId,
      };
    }

    // Auto-approved low/medium safe capability
    this.recordAudit(caller, capability, rule.riskLevel, 'APPROVED', 'Policy validated within sandbox bounds', payload);
    return { allowed: true };
  }

  public resolvePending(requestId: string, approved: boolean): boolean {
    const req = this.pendingRequests.get(requestId);
    if (!req) return false;

    this.pendingRequests.delete(requestId);
    this.recordAudit(
      req.caller,
      req.capability,
      req.riskLevel,
      approved ? 'APPROVED' : 'REJECTED',
      approved ? 'Manually approved by human operator' : 'Rejected by human operator',
      req.payload
    );

    ipcBus.publish('security.approval_resolved', 'm4-security', {
      requestId,
      approved,
      capability: req.capability,
    }, 'normal');

    const resolver = this.approvalResolvers.get(requestId);
    if (resolver) {
      resolver(approved);
      this.approvalResolvers.delete(requestId);
    }

    return true;
  }

  private recordAudit(
    caller: string,
    capability: string,
    riskLevel: RiskLevel,
    status: 'APPROVED' | 'REJECTED' | 'PENDING_USER_APPROVAL',
    rationale: string,
    details: Record<string, unknown>
  ): void {
    const record: SecurityAuditRecord = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      caller,
      capability,
      riskLevel,
      status,
      rationale,
      details,
    };
    this.auditLog.push(record);
    logger.audit('m4-security', `${status}: [${capability}] by ${caller} (${riskLevel}) - ${rationale}`);
  }
}

export const securityManager = new SecuritySubsystem();
