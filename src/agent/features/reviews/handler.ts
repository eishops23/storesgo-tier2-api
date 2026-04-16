// Agent Suite — Reviews feature handler (Phase 11 Prompt 3)

import { AgentRunner } from '../../runner/agent-runner.js';
import { ToolRegistry } from '../../tools/registry.js';
import { registerReviewsTools } from '../../tools/reviews/index.js';
import { AutonomyRepo } from '../../storage/index.js';
import { createChildLogger } from '../../observability/index.js';
import { resolveReviewsIdentity } from './identity-resolver.js';
import {
  REVIEWS_FEATURE_KEY,
  renderReviewsSystemPrompt,
  REVIEWS_TEMPLATE_HASH,
} from './system-prompt.js';
import { shapeResponse, shapeErrorResponse, type ShapedResponse } from './response-shaper.js';
import { randomUUID } from 'node:crypto';

const log = createChildLogger({ subsystem: 'reviews-handler' });

log.info({ templateHash: REVIEWS_TEMPLATE_HASH }, 'Reviews handler module loaded');

function buildScopedRegistry(): ToolRegistry {
  const registry = new ToolRegistry();
  registerReviewsTools(registry);
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
  await AutonomyRepo.initializeFeature(REVIEWS_FEATURE_KEY);
  featureInitialized = true;
}

export interface ReviewsChatInput {
  userText: string;
  userId?: string | null;
  sellerId?: number | null;
  storeName?: string | null;
  guestSessionId?: string | null;
  conversationId?: string | null;
}

export type ReviewsChatResult = ShapedResponse;

// For testing — reset module-level singletons
export function _resetHandler(): void {
  scopedRegistry = null;
  runner = null;
  featureInitialized = false;
}

export async function runReviews(input: ReviewsChatInput): Promise<ReviewsChatResult> {
  const correlationId = randomUUID();
  const handlerLog = log.child({ correlationId });

  try {
    await ensureFeatureInitialized();

    const identity = await resolveReviewsIdentity({
      userId: input.userId,
      sellerId: input.sellerId,
      guestSessionId: input.guestSessionId,
    });

    handlerLog.info(
      { isAuthenticated: identity.isAuthenticated, identityId: identity.identityId },
      'Reviews identity resolved',
    );

    const systemPrompt = renderReviewsSystemPrompt({
      sellerContext: {
        isAuthenticated: identity.isAuthenticated,
        storeName: input.storeName ?? null,
      },
    });

    const result = await getRunner().run({
      featureKey: REVIEWS_FEATURE_KEY,
      channel: 'chat',
      userText: input.userText,
      systemPrompt,
      conversationId: input.conversationId ?? undefined,
      identityId: identity.identityId,
      userId: input.userId ?? undefined,
      sellerId: input.sellerId ?? undefined,
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
      'Reviews run complete',
    );

    return shaped;
  } catch (error) {
    handlerLog.error(
      { error: error instanceof Error ? error.message : String(error) },
      'Reviews handler error',
    );
    return shapeErrorResponse(input.conversationId ?? '', correlationId);
  }
}

export { REVIEWS_FEATURE_KEY, ensureFeatureInitialized };
