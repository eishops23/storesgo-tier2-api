// Agent Suite — Recommendations feature handler (Phase 18A Prompt 3)

import { AgentRunner } from '../../runner/agent-runner.js';
import { ToolRegistry } from '../../tools/registry.js';
import { registerRecommendationsTools } from '../../tools/recommendations/index.js';
import { AutonomyRepo } from '../../storage/index.js';
import { createChildLogger } from '../../observability/index.js';
import { resolveRecommendationsIdentity } from './identity-resolver.js';
import {
  RECOMMENDATIONS_FEATURE_KEY,
  renderRecommendationsSystemPrompt,
  RECOMMENDATIONS_TEMPLATE_HASH,
} from './system-prompt.js';
import { shapeResponse, shapeErrorResponse, type ShapedResponse } from './response-shaper.js';
import { randomUUID } from 'node:crypto';

const log = createChildLogger({ subsystem: 'recommendations-handler' });

log.info(
  { templateHash: RECOMMENDATIONS_TEMPLATE_HASH },
  'Recommendations handler module loaded',
);

function buildScopedRegistry(): ToolRegistry {
  const registry = new ToolRegistry();
  registerRecommendationsTools(registry);
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
  await AutonomyRepo.initializeFeature(RECOMMENDATIONS_FEATURE_KEY);
  featureInitialized = true;
}

export interface RecommendationsChatInput {
  userText: string;
  userId?: string | null;
  userName?: string | null;
  guestSessionId?: string | null;
  conversationId?: string | null;
}

export type RecommendationsChatResult = ShapedResponse & {
  guestSessionId?: string;
};

// For testing — reset module-level singletons
export function _resetHandler(): void {
  scopedRegistry = null;
  runner = null;
  featureInitialized = false;
}

export async function runRecommendations(
  input: RecommendationsChatInput,
): Promise<RecommendationsChatResult> {
  const correlationId = randomUUID();
  const handlerLog = log.child({ correlationId });

  try {
    await ensureFeatureInitialized();

    const identity = await resolveRecommendationsIdentity({
      userId: input.userId,
      guestSessionId: input.guestSessionId,
    });

    handlerLog.info(
      { isAuthenticated: identity.isAuthenticated, identityId: identity.identityId },
      'Recommendations identity resolved',
    );

    const systemPrompt = renderRecommendationsSystemPrompt({
      userContext: {
        isAuthenticated: identity.isAuthenticated,
        userName: input.userName ?? null,
      },
    });

    const result = await getRunner().run({
      featureKey: RECOMMENDATIONS_FEATURE_KEY,
      channel: 'chat',
      userText: input.userText,
      systemPrompt,
      conversationId: input.conversationId ?? undefined,
      identityId: identity.identityId,
      userId: input.userId ?? undefined,
      correlationId,
    });

    const shaped = await shapeResponse(result);

    const response: RecommendationsChatResult = { ...shaped };
    // Mint a fresh guest session ID for brand-new guest callers so the
    // frontend can persist it across turns. Matches the Phase 5 referrals
    // pattern.
    if (!identity.isAuthenticated && !input.guestSessionId) {
      response.guestSessionId = identity.aliasValue;
    }

    handlerLog.info(
      {
        conversationId: result.conversationId,
        toolCalls: result.toolCallsExecuted,
        costUsd: result.costUsd,
        durationMs: result.durationMs,
      },
      'Recommendations run complete',
    );

    return response;
  } catch (error) {
    handlerLog.error(
      { error: error instanceof Error ? error.message : String(error) },
      'Recommendations handler error',
    );
    return shapeErrorResponse(input.conversationId ?? '', correlationId);
  }
}

export { RECOMMENDATIONS_FEATURE_KEY, ensureFeatureInitialized };
