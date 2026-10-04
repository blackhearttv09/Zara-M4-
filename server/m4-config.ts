/**
 * M4 Five OS — Configuration System (STEP 04)
 */

import { logger } from './m4-logger.ts';

export interface M4Config {
  system: {
    name: string;
    codename: string;
    version: string;
    arch: string;
    locale: string;
    logLevel: string;
  };
  kernel: {
    distro: string;
    release: string;
    apparmor: boolean;
    seccomp: boolean;
  };
  ai: {
    provider: 'gemini' | 'local' | 'mock';
    model: string;
    temperature: number;
    maxTokens: number;
    autoExecuteSafePlans: boolean;
  };
  security: {
    enforceSandbox: boolean;
    requireUserConfirmationHighRisk: boolean;
    auditTrailEnabled: boolean;
    rateLimitPerMinute: number;
  };
  desktop: {
    theme: 'dark' | 'light' | 'cyber';
    accentColor: string;
    dockPosition: 'bottom' | 'top';
    animations: boolean;
  };
}

const DEFAULT_CONFIG: M4Config = {
  system: {
    name: 'M4 Five OS',
    codename: 'Apex Quantum',
    version: '5.0.0-release',
    arch: 'x86_64',
    locale: 'en_US.UTF-8',
    logLevel: 'INFO',
  },
  kernel: {
    distro: 'Debian/Kali GNU/Linux (Custom M4 Userland)',
    release: '6.8.0-m4-hardened',
    apparmor: true,
    seccomp: true,
  },
  ai: {
    provider: 'gemini',
    model: 'gemini-3.8-flash',
    temperature: 0.4,
    maxTokens: 4096,
    autoExecuteSafePlans: true,
  },
  security: {
    enforceSandbox: true,
    requireUserConfirmationHighRisk: true,
    auditTrailEnabled: true,
    rateLimitPerMinute: 120,
  },
  desktop: {
    theme: 'dark',
    accentColor: '#06b6d4',
    dockPosition: 'bottom',
    animations: true,
  },
};

class ConfigManager {
  private config: M4Config = { ...DEFAULT_CONFIG };

  constructor() {
    logger.info('m4-config', 'Configuration subsystem loaded default parameters.');
  }

  public get(): M4Config {
    return JSON.parse(JSON.stringify(this.config));
  }

  public update(patch: Partial<M4Config>): M4Config {
    this.config = {
      ...this.config,
      ...patch,
      system: { ...this.config.system, ...(patch.system || {}) },
      kernel: { ...this.config.kernel, ...(patch.kernel || {}) },
      ai: { ...this.config.ai, ...(patch.ai || {}) },
      security: { ...this.config.security, ...(patch.security || {}) },
      desktop: { ...this.config.desktop, ...(patch.desktop || {}) },
    };
    logger.info('m4-config', 'Configuration parameters updated successfully.');
    return this.get();
  }
}

export const configManager = new ConfigManager();
