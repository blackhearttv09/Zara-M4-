/**
 * M4 Five OS — Master Gateway & Full-Stack Service Host
 *
 * Exposes REST & SSE endpoints for all M4 subsystems:
 * Core, Security, Memory, Skills, Tools, Agents, AI Runtime, and Desktop Shell.
 */

import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import M4 Subsystems
import { m4Core } from './server/m4-core.ts';
import { ipcBus } from './server/m4-ipc.ts';
import { configManager } from './server/m4-config.ts';
import { logger } from './server/m4-logger.ts';
import { securityManager } from './server/m4-security.ts';
import { memorySubsystem } from './server/m4-memory.ts';
import { skillsSubsystem } from './server/m4-skills.ts';
import { toolSubsystem } from './server/m4-tools.ts';
import { agentSubsystem } from './server/m4-agents.ts';
import { m4AiRuntime } from './server/m4-ai-runtime.ts';
import { AgentType } from './server/m4-types.ts';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// -----------------------------------------------------------------------------
// REST API ROUTES (/api/v1)
// -----------------------------------------------------------------------------

// System Telemetry & Status
app.get('/api/v1/system/telemetry', (_req: Request, res: Response) => {
  res.json(m4Core.getTelemetry());
});

// System Config
app.get('/api/v1/system/config', (_req: Request, res: Response) => {
  res.json(configManager.get());
});

app.post('/api/v1/system/config', (req: Request, res: Response) => {
  const updated = configManager.update(req.body);
  res.json({ success: true, config: updated });
});

// Security & Audit
app.get('/api/v1/security/capabilities', (_req: Request, res: Response) => {
  res.json(securityManager.getCapabilities());
});

app.get('/api/v1/security/audit', (req: Request, res: Response) => {
  const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 50;
  res.json(securityManager.getAuditTrail(limit));
});

app.get('/api/v1/security/pending', (_req: Request, res: Response) => {
  res.json(securityManager.getPendingRequests());
});

app.post('/api/v1/security/approve', (req: Request, res: Response) => {
  const { requestId, approved } = req.body;
  if (!requestId || typeof approved !== 'boolean') {
    return res.status(400).json({ error: 'Missing requestId or approved boolean' });
  }
  const result = securityManager.resolvePending(requestId, approved);
  if (!result) {
    return res.status(404).json({ error: 'Pending request not found' });
  }
  res.json({ success: true, requestId, approved });
});

// Cognitive Memory Subsystem
app.get('/api/v1/memory', (req: Request, res: Response) => {
  const query = typeof req.query.q === 'string' ? req.query.q : '';
  const category = typeof req.query.cat === 'string' ? req.query.cat : undefined;
  const results = memorySubsystem.search(query, category);
  res.json(results);
});

app.post('/api/v1/memory', (req: Request, res: Response) => {
  const { category, title, content, tags, importance, metadata } = req.body;
  if (!category || !title || !content) {
    return res.status(400).json({ error: 'Missing category, title, or content' });
  }
  const record = memorySubsystem.create(category, title, content, tags, importance, metadata);
  res.status(201).json(record);
});

app.get('/api/v1/memory/export', (_req: Request, res: Response) => {
  res.json(memorySubsystem.export());
});

app.get('/api/v1/memory/:id', (req: Request, res: Response) => {
  const item = memorySubsystem.read(req.params.id);
  if (!item) return res.status(404).json({ error: 'Memory not found' });
  res.json(item);
});

app.put('/api/v1/memory/:id', (req: Request, res: Response) => {
  const updated = memorySubsystem.update(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Memory not found' });
  res.json(updated);
});

app.delete('/api/v1/memory/:id', (req: Request, res: Response) => {
  const ok = memorySubsystem.delete(req.params.id);
  res.json({ success: ok });
});

// Skills Subsystem
app.get('/api/v1/skills', (_req: Request, res: Response) => {
  res.json(skillsSubsystem.list());
});

app.post('/api/v1/skills/register', (req: Request, res: Response) => {
  const result = skillsSubsystem.register(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }
  res.status(201).json(result);
});

app.post('/api/v1/skills/toggle', (req: Request, res: Response) => {
  const { name, enabled } = req.body;
  if (!name || typeof enabled !== 'boolean') {
    return res.status(400).json({ error: 'Missing name or enabled boolean' });
  }
  const ok = skillsSubsystem.toggleSkill(name, enabled);
  res.json({ success: ok, name, enabled });
});

// Tools Subsystem
app.get('/api/v1/tools', (_req: Request, res: Response) => {
  res.json(toolSubsystem.listTools());
});

app.get('/api/v1/tools/files', (_req: Request, res: Response) => {
  res.json(toolSubsystem.getVirtualFiles());
});

app.post('/api/v1/tools/execute', async (req: Request, res: Response) => {
  const { caller = 'api-client', tool, args = {}, bypassConfirmation = false } = req.body;
  if (!tool) {
    return res.status(400).json({ error: 'Missing tool name' });
  }
  const result = await toolSubsystem.execute(caller, tool, args, bypassConfirmation);
  res.json(result);
});

// Agent Subsystem
app.get('/api/v1/agents/tasks', (_req: Request, res: Response) => {
  res.json(agentSubsystem.listTasks());
});

app.post('/api/v1/agents/run', async (req: Request, res: Response) => {
  const { agentType = 'orchestrator', prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }
  const task = await agentSubsystem.runTask(agentType as AgentType, prompt);
  res.json(task);
});

// M4 AI Brain Interface
app.post('/api/v1/ai/chat', async (req: Request, res: Response) => {
  const { prompt, contextCategory } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }
  const response = await m4AiRuntime.chat({ prompt, contextCategory });
  res.json(response);
});

// IPC Event Stream (Server-Sent Events)
app.get('/api/v1/ipc/stream', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Send initial frame
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', timestamp: new Date().toISOString() })}\n\n`);

  const unsubscribe = ipcBus.subscribe('*', (frame) => {
    res.write(`data: ${JSON.stringify(frame)}\n\n`);
  });

  req.on('close', () => {
    unsubscribe();
  });
});

app.get('/api/v1/ipc/history', (req: Request, res: Response) => {
  const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 50;
  res.json(ipcBus.getHistory(limit));
});

// Diagnostic Logs
app.get('/api/v1/logs', (req: Request, res: Response) => {
  const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 100;
  res.json(logger.getRecent(limit));
});

// -----------------------------------------------------------------------------
// VITE DEV SERVER / STATIC ASSETS MOUNT
// -----------------------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    logger.info('m4-gateway', `M4 Five OS Master Gateway listening on port ${PORT}`);
  });
}

startServer().catch((err) => {
  logger.error('m4-gateway', `Server startup failure: ${err}`);
  process.exit(1);
});
