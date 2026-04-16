// Agent Suite — SEO response shaper (Phase 9 Prompt 3)

import type { RunResult } from '../../runner/types.js';
import { getPrisma } from '../../storage/prisma-client.js';

const SUGGESTIONS_BY_TOOL: Record<string, string[]> = {
  audit_blog_post: [
    'Find similar posts to this one',
    'Show overall blog stats',
    'Find content gaps in this category',
  ],
  audit_seo_page: [
    'Audit another SEO page',
    'Show overall blog stats',
    'Find content gaps',
  ],
  find_content_gaps: [
    'Draft an outline for the first gap',
    'Show overall blog stats',
    'Find orphan posts',
  ],
  find_orphan_blog_posts: [
    'Audit the first orphan post',
    'Show overall blog stats',
    'Find similar posts to one of these',
  ],
  find_similar_blog_posts: [
    'Audit one of these similar posts',
    'Find content gaps in this category',
    'Show overall blog stats',
  ],
  get_blog_stats: [
    'Find content gaps',
    'Find orphan posts',
    'Audit a specific post',
  ],
  draft_blog_post_outline: [
    'Audit a similar existing post',
    'Find more content gaps',
    'Show overall blog stats',
  ],
};

const DEFAULT_SUGGESTIONS = [
  'Show blog stats',
  'Find content gaps',
  'Find orphan posts',
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
      "I'm having a brief issue with the SEO assistant. Please try again or check the logs.",
    suggestions: ['Try again', 'Check logs'],
    conversationId,
    correlationId,
  };
}
