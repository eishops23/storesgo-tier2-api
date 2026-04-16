// Agent Suite — suggest_review_response_tone tool (Phase 11 close-out)
//
// Returns a tone analysis ONLY — sentiment bucket, recommended tone phrase,
// and the raw comment text the agent should treat as the source of concerns.
// Does NOT return any draft text and does NOT publish. Reuses the existing
// loadReviewForDrafting service function so seller scoping and audit B12
// null-sellerId defense are inherited unchanged.

import { z } from 'zod';
import type { AgentTool } from '../types.js';

const argsSchema = z.object({
  reviewId: z
    .number()
    .int()
    .positive()
    .describe('The numeric ID of the review the seller wants a tone analysis for'),
});

type Args = z.infer<typeof argsSchema>;

export type ReviewSentiment =
  | 'very_negative'
  | 'negative'
  | 'mixed'
  | 'mostly_positive'
  | 'positive';

export interface ToneAnalysis {
  reviewId: number;
  rating: number;
  sentiment: ReviewSentiment;
  suggestedTone: string;
  keyConcerns: string | null;
}

function sentimentFromRating(rating: number): ReviewSentiment {
  if (rating >= 5) return 'positive';
  if (rating === 4) return 'mostly_positive';
  if (rating === 3) return 'mixed';
  if (rating === 2) return 'negative';
  return 'very_negative';
}

export const suggestReviewResponseToneTool: AgentTool<Args, ToneAnalysis | null> = {
  name: 'suggest_review_response_tone',
  description:
    'Analyze a specific review and return tone guidance ONLY — a sentiment bucket, a short recommended tone phrase, and the original review text to treat as the source of concerns. Does NOT return draft text and does NOT publish. Use this before draft_response when the seller wants to understand how to approach a review without committing to a draft yet. Only works for reviews on the authenticated seller\'s products.',
  argsSchema,
  requiredAutonomy: 'L0',
  reversible: true,
  tags: ['reviews', 'tone', 'read'],
  timeoutMs: 5000,
  async execute(args, ctx) {
    if (ctx.sellerId === undefined) return null;

    const { loadReviewForDrafting } = await import('../../../services/reviews.service.js');
    const ctxResult = await loadReviewForDrafting(ctx.sellerId, args.reviewId);
    if (!ctxResult) return null;

    return {
      reviewId: ctxResult.reviewId,
      rating: ctxResult.rating,
      sentiment: sentimentFromRating(ctxResult.rating),
      suggestedTone: ctxResult.suggestedToneNotes,
      keyConcerns: ctxResult.originalComment,
    };
  },
};
