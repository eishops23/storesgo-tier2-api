// Agent Suite — Reviews response shaper (Phase 11 Prompt 3)

import type { RunResult } from '../../runner/types.js';
import { getPrisma } from '../../storage/prisma-client.js';

const SUGGESTIONS_BY_TOOL: Record<string, string[]> = {
  list_my_reviews: [
    'Show review stats',
    'Find reviews needing a response',
    'Draft a response to one of these',
  ],
  get_review_by_id: [
    'Draft a response to this review',
    'Show similar reviews',
    'Show review stats',
  ],
  get_review_stats: [
    'Show my worst reviews',
    'Find reviews needing a response',
    'List my recent reviews',
  ],
  find_reviews_needing_response: [
    'Draft a response to the first one',
    'Show review stats',
    'List all my recent reviews',
  ],
  draft_response: [
    'Draft another response',
    'Show review stats',
    'Find more reviews needing a response',
  ],
  suggest_review_response_tone: [
    'Draft a response with this tone',
    'Show more reviews like this',
    'Show review stats',
  ],
};

const DEFAULT_SUGGESTIONS = [
  'Show review stats',
  'Find reviews needing a response',
  'List my recent reviews',
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
      "I'm having a brief issue with the reviews assistant. Please try again or email support@storesgo.com.",
    suggestions: ['Try again', 'Email support'],
    conversationId,
    correlationId,
  };
}
