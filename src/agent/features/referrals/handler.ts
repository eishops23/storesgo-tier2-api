// Agent Suite — Referrals feature handler (Phase 5 Prompt 3)

import { AgentRunner } from '../../runner/agent-runner.js';
import { ToolRegistry } from '../../tools/registry.js';
import { registerReferralsTools } from '../../tools/referrals/index.js';
import { AutonomyRepo } from '../../storage/index.js';
import { createChildLogger } from '../../observability/index.js';
import { resolveReferralsIdentity } from './identity-resolver.js';
import { REFERRALS_FEATURE_KEY, renderReferralsSystemPrompt, REFERRALS_TEMPLATE_HASH } from './system-prompt.js';
import { shapeResponse, shapeErrorResponse, type ShapedResponse } from './response-shaper.js';
import { randomUUID } from 'node:crypto';

const log = createChildLogger({ subsystem: 'referrals-handler' });

log.info({ templateHash: REFERRALS_TEMPLATE_HASH }, 'Referrals handler module loaded');

function buildScopedRegistry(): ToolRegistry {
  const registry = new ToolRegistry();
  registerReferralsTools(registry);
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
  await AutonomyRepo.initializeFeature(REFERRALS_FEATURE_KEY);
  featureInitialized = true;
}

export interface ReferralsChatInput {
  userText: string;
  userId?: string | null;
  guestSessionId?: string | null;
  conversationId?: string | null;
}

export interface ReferralsChatResult extends ShapedResponse {
  guestSessionId?: string;
}

// For testing — reset module-level singletons
export function _resetHandler(): void {
  scopedRegistry = null;
  runner = null;
  featureInitialized = false;
}

export async function runReferrals(input: ReferralsChatInput): Promise<ReferralsChatResult> {
  const correlationId = randomUUID();
  const handlerLog = log.child({ correlationId });

  try {
    await ensureFeatureInitialized();

    // Resolve identity
    const identity = await resolveReferralsIdentity({
      userId: input.userId,
      guestSessionId: input.guestSessionId,
    });

    handlerLog.info(
      { isGuest: identity.isGuest, identityId: identity.identityId },
      'Identity resolved',
    );

    // Build system prompt
    const systemPrompt = renderReferralsSystemPrompt({
      userContext: {
        isAuthenticated: !identity.isGuest,
        userId: input.userId,
      },
    });

    // Run the agent
    const result = await getRunner().run({
      featureKey: REFERRALS_FEATURE_KEY,
      channel: 'chat',
      userText: input.userText,
      systemPrompt,
      conversationId: input.conversationId ?? undefined,
      identityId: identity.identityId,
      userId: input.userId ?? undefined,
      correlationId,
    });

    // Shape the response
    const shaped = await shapeResponse(result);

    const response: ReferralsChatResult = { ...shaped };
    if (identity.isGuest && !input.guestSessionId) {
      response.guestSessionId = identity.aliasValue;
    }

    handlerLog.info(
      {
        conversationId: result.conversationId,
        toolCalls: result.toolCallsExecuted,
        costUsd: result.costUsd,
        durationMs: result.durationMs,
      },
      'Referrals run complete',
    );

    return response;
  } catch (error) {
    handlerLog.error(
      { error: error instanceof Error ? error.message : String(error) },
      'Referrals handler error',
    );
    return {
      ...shapeErrorResponse(input.conversationId ?? '', correlationId),
    };
  }
}

export { REFERRALS_FEATURE_KEY, ensureFeatureInitialized };
