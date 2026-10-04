/**
 * M4 Five OS — Core System Supervisor Runtime (STEP 02)
 */

import { SystemTelemetry } from './m4-types.ts';
import { logger } from './m4-logger.ts';
import { ipcBus } from './m4-ipc.ts';
import { securityManager } from './m4-security.ts';
import { agentSubsystem } from './m4-agents.ts';

class M4CoreRuntime {
  private startTime = Date.now();
  private state: 'BOOTING' | 'READY' | 'DEGRADED' | 'MAINTENANCE' = 'BOOTING';
  private heartbeatTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.boot();
  }

  private boot(): void {
    logger.info('m4-core', 'M4 Five OS Core Supervisor booting...');
    const t = setTimeout(() => {
      this.state = 'READY';
      logger.info('m4-core', 'M4 Core state transition: READY. All kernel subsystems operating normally.');
      ipcBus.publish('system.lifecycle', 'm4-core', {
        state: 'READY',
        version: '5.0.0-release',
        kernel: '6.8.0-m4-hardened',
      });
      this.startHeartbeat();
    }, 1000);
    if (t.unref) t.unref();
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      const telemetry = this.getTelemetry();
      ipcBus.publish('system.telemetry', 'm4-core', telemetry as unknown as Record<string, unknown>, 'low');
    }, 3000);
    if (this.heartbeatTimer.unref) this.heartbeatTimer.unref();
  }

  public getTelemetry(): SystemTelemetry {
    const uptime = Math.floor((Date.now() - this.startTime) / 1000);
    // Dynamic load simulation with realistic baseline
    const cpu = Math.min(95, Math.max(8, 12 + Math.sin(uptime / 10) * 8 + Math.random() * 4));
    const memUsed = Math.min(16384, Math.floor(3420 + Math.sin(uptime / 20) * 120 + Math.random() * 50));

    return {
      osName: 'M4 Five OS',
      codename: 'Apex Quantum',
      version: '5.0.0-release',
      kernel: 'Linux 6.8.0-m4-hardened x86_64',
      uptimeSeconds: uptime,
      cpuUsagePercent: Math.round(cpu * 10) / 10,
      memoryTotalMB: 16384,
      memoryUsedMB: memUsed,
      diskTotalGB: 512,
      diskUsedGB: 68,
      activeProcesses: 34,
      activeAgents: agentSubsystem.listTasks().filter((t) => t.status === 'executing').length,
      pendingApprovals: securityManager.getPendingRequests().length,
      securityMode: 'Zero-Trust Enforced',
    };
  }

  public getState() {
    return this.state;
  }
}

export const m4Core = new M4CoreRuntime();
