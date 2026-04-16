// Agent Suite — Referrals response shaper (Phase 5 Prompt 3)

import type { RunResult } from '../../runner/types.js';
import { getPrisma } from '../../storage/prisma-client.js';

const SUGGESTIONS_BY_TOOL: Record<string, string[]> = {
  get_referral_stats: ['Show my referral history', 'How does the program work?', 'Share my link'],
  get_referral_history: ['See my stats', 'Top referrers', 'Program details'],
  validate_referral_code: ['How does the program work?', 'Sign up to apply'],
  get_referral_leaderboard: ['See my stats', 'How do I climb the leaderboard?'],
  get_referral_program_info: ['See my referral code', 'Top referrers'],
};

const DEFAULT_SUGGESTIONS = ['My referral code', 'How does the program work?', 'Top referrers'];

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
    response: "I'm having a brief issue with the referrals assistant. Please try again or email support@storesgo.com.",
    suggestions: ['Try again', 'Email support'],
    conversationId,
    correlationId,
  };
}
