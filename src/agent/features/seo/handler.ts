// Agent Suite — SEO feature handler (Phase 9 Prompt 3)

import { AgentRunner } from '../../runner/agent-runner.js';
import { ToolRegistry } from '../../tools/registry.js';
import { registerSeoTools } from '../../tools/seo/index.js';
import { AutonomyRepo } from '../../storage/index.js';
import { createChildLogger } from '../../observability/index.js';
import { resolveSeoIdentity } from './identity-resolver.js';
import {
  SEO_FEATURE_KEY,
  renderSeoSystemPrompt,
  SEO_TEMPLATE_HASH,
} from './system-prompt.js';
import { shapeResponse, shapeErrorResponse, type ShapedResponse } from './response-shaper.js';
import { randomUUID } from 'node:crypto';

const log = createChildLogger({ subsystem: 'seo-handler' });

log.info({ templateHash: SEO_TEMPLATE_HASH }, 'SEO handler module loaded');

function buildScopedRegistry(): ToolRegistry {
  const registry = new ToolRegistry();
  registerSeoTools(registry);
  return registry;
}

let scopedRegistry: ToolRegistry | null = null;
let runner: AgentRunner | null = null;

function getScopedRegistry(): ToolRegistry {
  if (!scopedRegistry) scopedRegistry = buildScopedRegistry();
  return scopedRegistry;
}

function getRunner(): AgentRunner {
  if (!runner) runner = new AgentRunner({ registry: getScopedRegistry() });
  return runner;
}

let featureInitialized = false;
async function ensureFeatureInitialized(): Promise<void> {
  if (featureInitialized) return;
  await AutonomyRepo.initializeFeature(SEO_FEATURE_KEY);
  featureInitialized = true;
}

export interface SeoChatInput {
  userText: string;
  adminId?: number | null;
  operatorEmail?: string | null;
  userId?: string | null;
  guestSessionId?: string | null;
  conversationId?: string | null;
}

export type SeoChatResult = ShapedResponse;

// For testing — reset module-level singletons
export function _resetHandler(): void {
  scopedRegistry = null;
  runner = null;
  featureInitialized = false;
}

export async function runSeo(input: SeoChatInput): Promise<SeoChatResult> {
  const correlationId = randomUUID();
  const handlerLog = log.child({ correlationId });

  try {
    await ensureFeatureInitialized();

    const identity = await resolveSeoIdentity({
      adminId: input.adminId,
      userId: input.userId,
      guestSessionId: input.guestSessionId,
    });

    handlerLog.info(
      { isAuthenticated: identity.isAuthenticated, identityId: identity.identityId },
      'SEO identity resolved',
    );

    const systemPrompt = renderSeoSystemPrompt({
      operatorContext: {
        isAuthenticated: identity.isAuthenticated,
        operatorEmail: input.operatorEmail ?? null,
      },
    });

    const result = await getRunner().run({
      featureKey: SEO_FEATURE_KEY,
      channel: 'chat',
      userText: input.userText,
      systemPrompt,
      conversationId: input.conversationId ?? undefined,
      identityId: identity.identityId,
      userId: input.userId ?? undefined,
      adminId: input.adminId ?? undefined,
      correlationId,
    });

    const shaped = await shapeResponse(result);

    handlerLog.info(
      {
        conversationId: result.conversationId,
        toolCalls: result.toolCallsExecuted,
        costUsd: result.costUsd,
        durationMs: result.durationMs,
      },
      'SEO run complete',
    );

    return shaped;
  } catch (error) {
    handlerLog.error(
      { error: error instanceof Error ? error.message : String(error) },
      'SEO handler error',
    );
    return shapeErrorResponse(input.conversationId ?? '', correlationId);
  }
}

export { SEO_FEATURE_KEY, ensureFeatureInitialized };
