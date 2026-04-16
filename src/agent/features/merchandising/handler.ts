// Agent Suite — Merchandising feature handler (Phase 12 Prompt 2)

import { AgentRunner } from '../../runner/agent-runner.js';
import { ToolRegistry } from '../../tools/registry.js';
import { registerMerchandisingTools } from '../../tools/merchandising/index.js';
import { AutonomyRepo } from '../../storage/index.js';
import { createChildLogger } from '../../observability/index.js';
import { resolveMerchandisingIdentity } from './identity-resolver.js';
import {
  MERCHANDISING_FEATURE_KEY,
  renderMerchandisingSystemPrompt,
  MERCHANDISING_TEMPLATE_HASH,
} from './system-prompt.js';
import { shapeResponse, shapeErrorResponse, type ShapedResponse } from './response-shaper.js';
import { randomUUID } from 'node:crypto';

const log = createChildLogger({ subsystem: 'merchandising-handler' });

log.info({ templateHash: MERCHANDISING_TEMPLATE_HASH }, 'Merchandising handler module loaded');

function buildScopedRegistry(): ToolRegistry {
  const registry = new ToolRegistry();
  registerMerchandisingTools(registry);
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
  await AutonomyRepo.initializeFeature(MERCHANDISING_FEATURE_KEY);
  featureInitialized = true;
}

export interface MerchandisingChatInput {
  userText: string;
  adminId?: number | null;
  operatorEmail?: string | null;
  userId?: string | null;
  guestSessionId?: string | null;
  conversationId?: string | null;
}

export type MerchandisingChatResult = ShapedResponse;

// For testing — reset module-level singletons
export function _resetHandler(): void {
  scopedRegistry = null;
  runner = null;
  featureInitialized = false;
}

export async function runMerchandising(
  input: MerchandisingChatInput,
): Promise<MerchandisingChatResult> {
  const correlationId = randomUUID();
  const handlerLog = log.child({ correlationId });

  try {
    await ensureFeatureInitialized();

    const identity = await resolveMerchandisingIdentity({
      adminId: input.adminId,
      userId: input.userId,
      guestSessionId: input.guestSessionId,
    });

    handlerLog.info(
      { isAuthenticated: identity.isAuthenticated, identityId: identity.identityId },
      'Merchandising identity resolved',
    );

    const systemPrompt = renderMerchandisingSystemPrompt({
      operatorContext: {
        isAuthenticated: identity.isAuthenticated,
        operatorEmail: input.operatorEmail ?? null,
      },
    });

    const result = await getRunner().run({
      featureKey: MERCHANDISING_FEATURE_KEY,
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
      'Merchandising run complete',
    );

    return shaped;
  } catch (error) {
    handlerLog.error(
      { error: error instanceof Error ? error.message : String(error) },
      'Merchandising handler error',
    );
    return shapeErrorResponse(input.conversationId ?? '', correlationId);
  }
}

export { MERCHANDISING_FEATURE_KEY, ensureFeatureInitialized };
