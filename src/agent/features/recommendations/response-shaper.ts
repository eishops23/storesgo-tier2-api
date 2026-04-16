// Agent Suite — Recommendations response shaper (Phase 18A Prompt 3)

import type { RunResult } from '../../runner/types.js';
import { getPrisma } from '../../storage/prisma-client.js';

const SUGGESTIONS_BY_TOOL: Record<string, string[]> = {
  get_product_details: [
    'Find similar products',
    'What goes with this?',
    'Show me recipes for this',
  ],
  find_similar_products: [
    'Add one to my cart',
    'Find recipes using these',
    'Show cheaper alternatives',
  ],
  find_complementary_products: [
    'Show me the full recipe',
    'Find more like these',
    'Recommend more for my cart',
  ],
  find_recipes_for_products: [
    'Get the missing ingredients',
    'Find similar recipes',
    'Show recipes for another cuisine',
  ],
  recommend_from_cart: [
    "Show me recipes I'm making",
    'Refine by cuisine',
    'Show cheaper options',
  ],
  recommend_from_history: [
    'Similar to my favorites',
    'Browse categories',
    'Complete my cart',
  ],
};

const DEFAULT_SUGGESTIONS = [
  'Find similar products',
  'What can I cook with these?',
  'Recommend from my cart',
];

export interface ShapedResponse {
  ok: boolean;
  response: string;
  data?: unknown;
  suggestions: string[];
  conversationId: string;
  correlationId: string;
}

export async function shapeResponse(result: RunResult): Promise<ShapedResponse> {
  const response: ShapedResponse = {
    ok: true,
    response: result.text,
    suggestions: DEFAULT_SUGGESTIONS,
    conversationId: result.conversationId,
    correlationId: result.correlationId,
  };

  if (result.toolCallIds && result.toolCallIds.length > 0) {
    const prisma = getPrisma();
    // Bug 3 fix: query ai_tool_calls by messageId, not by SDK tool call IDs
    const toolCalls = await prisma.aiToolCall.findMany({
      where: {
        messageId: result.assistantMessageId,
        status: 'success',
      },
      orderBy: { createdAt: 'desc' },
      select: { toolName: true, resultJson: true },
    });

    if (toolCalls.length > 0) {
      const mostRecent = toolCalls[0];
      response.data = mostRecent.resultJson;
      response.suggestions = SUGGESTIONS_BY_TOOL[mostRecent.toolName] ?? DEFAULT_SUGGESTIONS;
    }
  }

  return response;
}

export function shapeErrorResponse(
  conversationId: string,
  correlationId: string,
): ShapedResponse {
  return {
    ok: false,
    response:
      "I'm having a brief issue with the recommendations assistant. Please try again in a moment or browse the catalog directly.",
    suggestions: ['Try again', 'Browse all products'],
    conversationId,
    correlationId,
  };
}
