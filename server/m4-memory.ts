/**
 * M4 Five OS — Cognitive Memory Subsystem (STEP 09)
 *
 * Local-first cognitive memory engine supporting:
 * - memory.create
 * - memory.read
 * - memory.search
 * - memory.update
 * - memory.delete
 * - memory.export
 */

import { MemoryRecord } from './m4-types.ts';
import { logger } from './m4-logger.ts';
import { ipcBus } from './m4-ipc.ts';

class MemorySubsystem {
  private store: Map<string, MemoryRecord> = new Map();

  constructor() {
    this.seedInitialMemories();
    logger.info('m4-memory', 'Cognitive Memory engine online. Seeded initial baseline contexts.');
  }

  private seedInitialMemories(): void {
    const seeds: Omit<MemoryRecord, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        category: 'system',
        title: 'M4 Architecture Spec',
        content: 'M4 Five OS uses a layered micro-kernel architecture with Zero-Trust sandbox and autonomous agent orchestration.',
        tags: ['arch', 'kernel', 'm4'],
        importance: 0.95,
      },
      {
        category: 'system',
        title: 'Safety Invariants',
        content: 'Root execution without sandbox capability validation is strictly prohibited. Critical commands trigger human confirmation.',
        tags: ['security', 'policy', 'sandbox'],
        importance: 1.0,
      },
      {
        category: 'preference',
        title: 'UI Shell Preset',
        content: 'User prefers dark mode with cyan accent highlights and low-latency terminal feedback.',
        tags: ['desktop', 'theme', 'user'],
        importance: 0.7,
      },
      {
        category: 'knowledge',
        title: 'System Daemon Paths',
        content: 'Core supervisor configs reside at /etc/m4/m4-os.toml. Sandboxed tool definitions stored in kernel registry.',
        tags: ['filesystem', 'config'],
        importance: 0.8,
      },
    ];

    for (const seed of seeds) {
      this.create(seed.category, seed.title, seed.content, seed.tags, seed.importance);
    }
  }

  /**
   * memory.create
   */
  public create(
    category: MemoryRecord['category'],
    title: string,
    content: string,
    tags: string[] = [],
    importance = 0.5,
    metadata?: Record<string, unknown>
  ): MemoryRecord {
    const id = `mem-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const record: MemoryRecord = {
      id,
      category,
      title,
      content,
      tags,
      importance: Math.min(1.0, Math.max(0.0, importance)),
      createdAt: now,
      updatedAt: now,
      metadata,
    };

    this.store.set(id, record);
    logger.info('m4-memory', `Created memory: [${record.category}] ${record.title}`);
    ipcBus.publish('memory.created', 'm4-memory', { id, title: record.title, category });
    return record;
  }

  /**
   * memory.read
   */
  public read(id: string): MemoryRecord | null {
    return this.store.get(id) || null;
  }

  /**
   * memory.search
   */
  public search(query: string, category?: string): MemoryRecord[] {
    const q = query.trim().toLowerCase();
    const list = Array.from(this.store.values());

    const filtered = list.filter((item) => {
      if (category && item.category !== category) return false;
      if (!q) return true;

      const titleMatch = item.title.toLowerCase().includes(q);
      const contentMatch = item.content.toLowerCase().includes(q);
      const tagMatch = item.tags.some((t) => t.toLowerCase().includes(q));

      return titleMatch || contentMatch || tagMatch;
    });

    // Rank by importance descending, then updated timestamp
    return filtered.sort((a, b) => {
      if (b.importance !== a.importance) {
        return b.importance - a.importance;
      }
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }

  /**
   * memory.update
   */
  public update(
    id: string,
    updates: Partial<Pick<MemoryRecord, 'title' | 'content' | 'tags' | 'importance' | 'category' | 'metadata'>>
  ): MemoryRecord | null {
    const existing = this.store.get(id);
    if (!existing) return null;

    const updated: MemoryRecord = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.store.set(id, updated);
    logger.info('m4-memory', `Updated memory: ${id} (${updated.title})`);
    ipcBus.publish('memory.updated', 'm4-memory', { id });
    return updated;
  }

  /**
   * memory.delete
   */
  public delete(id: string): boolean {
    const deleted = this.store.delete(id);
    if (deleted) {
      logger.info('m4-memory', `Deleted memory: ${id}`);
      ipcBus.publish('memory.deleted', 'm4-memory', { id });
    }
    return deleted;
  }

  /**
   * memory.export
   */
  public export(): { version: string; exportedAt: string; records: MemoryRecord[] } {
    return {
      version: '5.0.0',
      exportedAt: new Date().toISOString(),
      records: Array.from(this.store.values()),
    };
  }

  /**
   * memory.import
   */
  public import(records: MemoryRecord[]): number {
    let imported = 0;
    for (const r of records) {
      if (r.id && r.title && r.content) {
        this.store.set(r.id, r);
        imported++;
      }
    }
    logger.info('m4-memory', `Imported ${imported} memory records into cognitive store.`);
    return imported;
  }
}

export const memorySubsystem = new MemorySubsystem();
