// Agent Suite — CS Chat response shaper (Phase 1 Prompt 3)

import type { RunResult } from '../../runner/types.js';
import { getPrisma } from '../../storage/prisma-client.js';

const SUGGESTIONS_BY_TOOL: Record<string, string[]> = {
  search_products_meili: ['Show more', 'Filter by price', 'Similar products'],
  get_product_by_id: ['Add to cart', 'Similar products', 'Reviews'],
  get_order_by_id: ['Track shipping', 'Contact seller', 'Report issue'],
  get_user_orders: ['View details', 'Reorder', 'Contact support'],
  get_seller_info: ['See products', 'Contact seller', 'Other sellers'],
  list_categories: ['Browse top category', 'Popular products', 'On sale'],
  get_store_stats: ['Browse products', 'View categories', 'Find sellers'],
};

const DEFAULT_SUGGESTIONS = ['Track my order', 'Find products', 'Become a seller'];

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
    response: "I'm having a brief issue. Please try again or email support@storesgo.com.",
    suggestions: ['Try again', 'Email support'],
    conversationId,
    correlationId,
  };
}
