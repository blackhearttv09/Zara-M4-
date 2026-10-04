/**
 * M4 Five OS — Fast Service Communication & IPC Event Bus (STEP 03 & STEP 14)
 */

import { EventEmitter } from 'events';
import { IpcFrame } from './m4-types.ts';
import { logger } from './m4-logger.ts';

class M4IpcBus {
  private emitter = new EventEmitter();
  private history: IpcFrame[] = [];
  private maxHistory = 1000;

  constructor() {
    this.emitter.setMaxListeners(100);
    logger.info('m4-ipc', 'M4 Zero-Copy Event & IPC Bus online.');
  }

  public publish(
    channel: string,
    sender: string,
    payload: Record<string, unknown>,
    priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal'
  ): IpcFrame {
    const frame: IpcFrame = {
      id: `ipc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      channel,
      sender,
      timestamp: new Date().toISOString(),
      priority,
      payload,
    };

    this.history.push(frame);
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }

    this.emitter.emit(channel, frame);
    this.emitter.emit('*', frame);

    return frame;
  }

  public subscribe(channel: string, listener: (frame: IpcFrame) => void): () => void {
    this.emitter.on(channel, listener);
    return () => {
      this.emitter.off(channel, listener);
    };
  }

  public getHistory(limit = 50, channel?: string): IpcFrame[] {
    let list = [...this.history].reverse();
    if (channel) {
      list = list.filter((f) => f.channel === channel);
    }
    return list.slice(0, limit);
  }
}

export const ipcBus = new M4IpcBus();
