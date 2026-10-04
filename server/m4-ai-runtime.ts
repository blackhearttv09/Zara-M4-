/**
 * M4 Five OS — AI Runtime Interface (STEP 08)
 *
 * Primary cognitive brain interface that binds:
 * - Soul & Persona
 * - Planner
 * - Memory Subsystem Context Injection
 * - Available Tool & Skill Catalog
 * - Orchestrator Dispatch
 */

import { aiProvider } from './m4-ai-provider.ts';
import { memorySubsystem } from './m4-memory.ts';
import { skillsSubsystem } from './m4-skills.ts';
import { toolSubsystem } from './m4-tools.ts';
import { logger } from './m4-logger.ts';
import { ipcBus } from './m4-ipc.ts';

export interface M4BrainInteractionRequest {
  prompt: string;
  contextCategory?: string;
  stream?: boolean;
}

export interface M4BrainInteractionResponse {
  answer: string;
  planSuggested?: Array<{ step: number; tool: string; reason: string }>;
  memoriesUsed: Array<{ id: string; title: string }>;
  provider: string;
  model: string;
}

export class M4AiRuntime {
  private baseSystemPrompt = `You are M4, the primary autonomous AI brain and cognitive operating system of M4 Five OS.
Your core principles:
1. Zero-Trust Security: You never request unrestricted root. All actions must use controlled tools.
2. High-risk actions (writing files, executing shell commands) require human confirmation.
3. You operate modularly with 6 specialized agents: Terminal Agent, File Agent, Browser Agent, Code Agent, System Agent, and Research Agent.
4. You reference past memories and skills to execute precise system workflows.
Respond clearly, authoritatively, and technically with concrete operational insight.`;

  public async chat(req: M4BrainInteractionRequest): Promise<M4BrainInteractionResponse> {
    logger.info('m4-ai-runtime', `Processing user intent: "${req.prompt}"`);

    // 1. Context retrieval from Cognitive Memory
    const relevantMemories = memorySubsystem.search(req.prompt, req.contextCategory).slice(0, 3);
    const memoryContext = relevantMemories
      .map((m) => `[Memory: ${m.title} (${m.category})]: ${m.content}`)
      .join('\n');

    // 2. Active tools & skills enumeration
    const availableSkills = skillsSubsystem.list().filter((s) => s.enabled);
    const skillList = availableSkills.map((s) => `${s.name} (tools: ${s.tools.join(', ')})`).join('; ');
    const toolList = toolSubsystem.listTools().map((t) => `${t.name} [Risk: ${t.riskLevel}]`).join(', ');

    const augmentedSystemPrompt = `${this.baseSystemPrompt}

ACTIVE MEMORY CONTEXT:
${memoryContext || 'No specific prior memories found for this query.'}

ACTIVE SKILLS:
${skillList}

AVAILABLE CONTROLLED TOOLS:
${toolList}

Always maintain OS security boundaries and indicate which tool or agent should be dispatched if execution is needed.`;

    const result = await aiProvider.complete({
      systemPrompt: augmentedSystemPrompt,
      userPrompt: req.prompt,
      temperature: 0.3,
    });

    ipcBus.publish('ai.interaction_completed', 'm4-ai-runtime', {
      promptPreview: req.prompt.substring(0, 60),
      model: result.model,
      memoriesUsedCount: relevantMemories.length,
    });

    return {
      answer: result.content,
      memoriesUsed: relevantMemories.map((m) => ({ id: m.id, title: m.title })),
      provider: result.provider,
      model: result.model,
    };
  }
}

export const m4AiRuntime = new M4AiRuntime();
