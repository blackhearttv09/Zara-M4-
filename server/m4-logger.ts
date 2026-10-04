/**
 * M4 Five OS — Logging and Diagnostics Subsystem (STEP 05)
 */

export type LogLevel = 'TRACE' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'AUDIT';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  subsystem: string;
  message: string;
  data?: Record<string, unknown>;
}

class M4Logger {
  private buffer: LogEntry[] = [];
  private maxEntries = 2000;

  constructor() {
    this.info('m4-logger', 'M4 Unified Logging Subsystem initialized.');
  }

  public log(level: LogLevel, subsystem: string, message: string, data?: Record<string, unknown>): LogEntry {
    const entry: LogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      level,
      subsystem,
      message,
      data,
    };

    this.buffer.push(entry);
    if (this.buffer.length > this.maxEntries) {
      this.buffer.shift();
    }

    // Console output with structured prefix
    const prefix = `[M4-${entry.level}][${entry.subsystem}]`;
    if (level === 'ERROR') {
      console.error(prefix, message, data || '');
    } else if (level === 'WARN') {
      console.warn(prefix, message, data || '');
    } else {
      console.log(prefix, message, data || '');
    }

    return entry;
  }

  public info(subsystem: string, message: string, data?: Record<string, unknown>): LogEntry {
    return this.log('INFO', subsystem, message, data);
  }

  public warn(subsystem: string, message: string, data?: Record<string, unknown>): LogEntry {
    return this.log('WARN', subsystem, message, data);
  }

  public error(subsystem: string, message: string, data?: Record<string, unknown>): LogEntry {
    return this.log('ERROR', subsystem, message, data);
  }

  public audit(subsystem: string, message: string, data?: Record<string, unknown>): LogEntry {
    return this.log('AUDIT', subsystem, message, data);
  }

  public getRecent(count = 100, filterSubsystem?: string, filterLevel?: LogLevel): LogEntry[] {
    let result = [...this.buffer].reverse();
    if (filterSubsystem) {
      result = result.filter((e) => e.subsystem === filterSubsystem);
    }
    if (filterLevel) {
      result = result.filter((e) => e.level === filterLevel);
    }
    return result.slice(0, count);
  }

  public clear(): void {
    this.buffer = [];
  }
}

export const logger = new M4Logger();
