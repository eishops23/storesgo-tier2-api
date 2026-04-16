// Agent Suite — Merchandising response shaper (Phase 12 Prompt 2)

import type { RunResult } from '../../runner/types.js';
import { getPrisma } from '../../storage/prisma-client.js';

const SUGGESTIONS_BY_TOOL: Record<string, string[]> = {
  get_merchandising_snapshot: [
    'Find featured products with zero orders',
    'Find uncovered categories',
    'List active CMS blocks',
  ],
  find_featured_products_zero_orders: [
    'Get details for the first dead slot',
    'Find uncovered categories to fill the slots',
    'Show the full merchandising snapshot',
  ],
  find_uncovered_categories: [
    'Show the full merchandising snapshot',
    'Find featured products with zero orders',
    'List active CMS blocks',
  ],
  get_featured_product_performance: [
    'Find other featured products with zero orders',
    'Show the full merchandising snapshot',
    'List active CMS blocks',
  ],
  list_cms_blocks_schedule: [
    'Show the full merchandising snapshot',
    'Find featured products with zero orders',
    'Find uncovered categories',
  ],
};

const DEFAULT_SUGGESTIONS = [
  'Show the merchandising snapshot',
  'Find featured products with zero orders',
  'Find uncovered categories',
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
    // Bug 3 fix: query by messageId, not by SDK tool call IDs
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
      "I'm having a brief issue with the merchandising assistant. Please try again or check the logs.",
    suggestions: ['Try again', 'Check logs'],
    conversationId,
    correlationId,
  };
}
