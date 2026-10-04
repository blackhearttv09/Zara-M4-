/**
 * M4 Five OS — Plugin-Style Skills Subsystem (STEP 10)
 *
 * Each skill defines:
 * - name
 * - version
 * - capabilities
 * - tools
 * - permissions
 * - configuration
 */

import { SkillManifest } from './m4-types.ts';
import { logger } from './m4-logger.ts';
import { ipcBus } from './m4-ipc.ts';

const BUILTIN_SKILLS: SkillManifest[] = [
  {
    id: 'skill-sysops',
    name: 'm4.sysops',
    version: '1.2.0',
    author: 'M4 Core Systems Team',
    description: 'Kernel telemetry inspection, thread management, and hardware sensors monitoring',
    capabilities: ['system.diagnostics', 'process.telemetry', 'hardware.sensors'],
    tools: ['system.info', 'process.list', 'process.inspect'],
    permissions: ['sys:read', 'proc:read'],
    enabled: true,
    configuration: {
      refreshIntervalMs: '1000',
      sampleBuffer: '60',
    },
  },
  {
    id: 'skill-fs',
    name: 'm4.filesystem',
    version: '1.1.0',
    author: 'M4 Core Systems Team',
    description: 'Safe structured directory traversal, atomic file modification, and regex searching',
    capabilities: ['fs.read', 'fs.write', 'fs.search'],
    tools: ['files.read', 'files.write', 'files.search'],
    permissions: ['fs:read', 'fs:write', 'fs:search'],
    enabled: true,
    configuration: {
      maxFileSizeMB: '50',
      sandboxRoot: '/var/lib/m4five/userland',
    },
  },
  {
    id: 'skill-devops',
    name: 'm4.devops',
    version: '2.0.0',
    author: 'M4 Developer Experience',
    description: 'Isolated terminal command pipeline execution, build verification, and git automation',
    capabilities: ['terminal.shell', 'build.verify'],
    tools: ['terminal.execute', 'app.launch'],
    permissions: ['exec:cmd', 'app:launch'],
    enabled: true,
    configuration: {
      defaultShell: '/bin/bash',
      timeoutSeconds: '30',
    },
  },
  {
    id: 'skill-cyber',
    name: 'm4.cyber_analyst',
    version: '1.0.4',
    author: 'M4 Cyber Security Labs',
    description: 'Real-time exploit heuristics, permission anomaly detection, and memory leak analysis',
    capabilities: ['audit.inspect', 'threat.evaluate'],
    tools: ['system.info', 'process.inspect'],
    permissions: ['sys:read', 'proc:inspect'],
    enabled: true,
    configuration: {
      heuristicStrictness: 'high',
      autoBlockZeroDay: 'true',
    },
  },
];

class SkillsSubsystem {
  private skills: Map<string, SkillManifest> = new Map();

  constructor() {
    for (const skill of BUILTIN_SKILLS) {
      this.skills.set(skill.name, skill);
    }
    logger.info('m4-skills', `Plugin Skill Engine initialized with ${this.skills.size} native skills.`);
  }

  public list(): SkillManifest[] {
    return Array.from(this.skills.values());
  }

  public get(name: string): SkillManifest | null {
    return this.skills.get(name) || null;
  }

  public register(manifest: Partial<SkillManifest>): { success: boolean; error?: string; skill?: SkillManifest } {
    // Strict schema validation
    if (!manifest.name || typeof manifest.name !== 'string' || manifest.name.trim().length === 0) {
      return { success: false, error: 'Skill manifest validation failed: "name" is required and cannot be empty' };
    }
    if (!manifest.version || typeof manifest.version !== 'string') {
      return { success: false, error: 'Skill manifest validation failed: "version" is required' };
    }
    if (!Array.isArray(manifest.capabilities) || manifest.capabilities.length === 0) {
      return { success: false, error: 'Skill manifest validation failed: at least one capability must be declared' };
    }
    if (!Array.isArray(manifest.tools) || manifest.tools.length === 0) {
      return { success: false, error: 'Skill manifest validation failed: at least one tool must be declared' };
    }
    if (!Array.isArray(manifest.permissions)) {
      return { success: false, error: 'Skill manifest validation failed: "permissions" array is required' };
    }

    const fullSkill: SkillManifest = {
      id: manifest.id || `skill-${Date.now().toString(36)}`,
      name: manifest.name.trim(),
      version: manifest.version.trim(),
      author: manifest.author || 'Third-Party Contributor',
      description: manifest.description || 'Custom M4 Five OS extension plugin',
      capabilities: manifest.capabilities,
      tools: manifest.tools,
      permissions: manifest.permissions,
      enabled: manifest.enabled !== undefined ? manifest.enabled : true,
      configuration: manifest.configuration || {},
    };

    this.skills.set(fullSkill.name, fullSkill);
    logger.info('m4-skills', `Registered & validated skill: ${fullSkill.name} v${fullSkill.version}`);
    ipcBus.publish('skills.registered', 'm4-skills', { name: fullSkill.name, version: fullSkill.version });

    return { success: true, skill: fullSkill };
  }

  public toggleSkill(name: string, enabled: boolean): boolean {
    const skill = this.skills.get(name);
    if (!skill) return false;

    skill.enabled = enabled;
    logger.info('m4-skills', `Toggled skill ${name} to ${enabled ? 'ENABLED' : 'DISABLED'}`);
    ipcBus.publish('skills.toggled', 'm4-skills', { name, enabled });
    return true;
  }
}

export const skillsSubsystem = new SkillsSubsystem();
