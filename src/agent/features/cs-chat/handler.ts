// Agent Suite — CS Chat feature handler (Phase 1 Prompt 3)

import { AgentRunner } from '../../runner/agent-runner.js';
import { ToolRegistry } from '../../tools/registry.js';
import { registerCsTools } from '../../tools/cs/index.js';
import { getProductByIdTool, listCategoriesTool, getStoreStatsTool } from '../../tools/catalog/index.js';
import { AutonomyRepo } from '../../storage/index.js';
import { createChildLogger } from '../../observability/index.js';
import { getStoreContext } from './context-cache.js';
import { resolveCsIdentity } from './identity-resolver.js';
import { renderCsSystemPrompt, CS_TEMPLATE_HASH } from './system-prompt.js';
import { shapeResponse, shapeErrorResponse, type ShapedResponse } from './response-shaper.js';
import { randomUUID } from 'node:crypto';

const log = createChildLogger({ subsystem: 'cs-chat-handler' });

log.info({ templateHash: CS_TEMPLATE_HASH }, 'CS chat handler module loaded');

const CS_FEATURE_KEY = 'cs_chat';

function buildScopedRegistry(): ToolRegistry {
  const registry = new ToolRegistry();

  // 4 CS-specific tools
  registerCsTools(registry);

  // 3 catalog tools (NOT search_products — we use the Meilisearch version)
  registry.register(getProductByIdTool);
  registry.register(listCategoriesTool);
  registry.register(getStoreStatsTool);

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
  await AutonomyRepo.initializeFeature(CS_FEATURE_KEY);
  featureInitialized = true;
}

export interface CsChatInput {
  userText: string;
  userId?: string | null;
  guestSessionId?: string | null;
  conversationId?: string | null;
}

export interface CsChatResult extends ShapedResponse {
  guestSessionId?: string;
}

// For testing — reset module-level singletons
export function _resetHandler(): void {
  scopedRegistry = null;
  runner = null;
  featureInitialized = false;
}

export async function runCsChat(input: CsChatInput): Promise<CsChatResult> {
  const correlationId = randomUUID();
  const handlerLog = log.child({ correlationId });

  try {
    await ensureFeatureInitialized();

    // Resolve identity
    const identity = await resolveCsIdentity({
      userId: input.userId,
      guestSessionId: input.guestSessionId,
    });

    handlerLog.info(
      { isGuest: identity.isGuest, identityId: identity.identityId },
      'Identity resolved',
    );

    // Build context-injected system prompt
    const storeContext = await getStoreContext();
    const systemPrompt = renderCsSystemPrompt({
      storeContext: {
        productCount: storeContext.productCount,
        activeSellerCount: storeContext.activeSellerCount,
        categoryCount: storeContext.categoryCount,
        orderCount: storeContext.orderCount,
        sellerNames: storeContext.sellerNames,
        categoryNames: storeContext.categoryNames,
      },
      userContext: {
        isAuthenticated: !identity.isGuest,
        userName: identity.userName,
        email: identity.email,
        recentOrders: identity.recentOrders,
      },
    });

    // Run the agent
    const result = await getRunner().run({
      featureKey: CS_FEATURE_KEY,
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

    const response: CsChatResult = { ...shaped };
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
      'CS chat run complete',
    );

    return response;
  } catch (error) {
    handlerLog.error(
      { error: error instanceof Error ? error.message : String(error) },
      'CS chat handler error',
    );
    return {
      ...shapeErrorResponse(input.conversationId ?? '', correlationId),
    };
  }
}
