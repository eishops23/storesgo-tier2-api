// Agent Suite — find_reviews_needing_response tool (Phase 11 Prompt 3)

import { z } from 'zod';
import type { AgentTool } from '../types.js';

const argsSchema = z.object({
  ratingThreshold: z
    .number()
    .int()
    .min(1)
    .max(5)
    .optional()
    .describe('Maximum rating to include (default 3 — i.e. 3-star and below)'),
  sinceDays: z
    .number()
    .int()
    .min(1)
    .max(365)
    .optional()
    .describe('Time window in days (default 30)'),
  limit: z.number().int().min(1).max(50).optional().describe('Max results (default 20)'),
});

type Args = z.infer<typeof argsSchema>;

export const findReviewsNeedingResponseTool: AgentTool<Args, unknown> = {
  name: 'find_reviews_needing_response',
  description:
    "Find recent low-rated reviews on the authenticated seller's products that warrant a response. Defaults to ratings of 3 stars and below from the last 30 days. Use this when the seller asks what reviews they should reply to.",
  argsSchema,
  requiredAutonomy: 'L0',
  reversible: true,
  tags: ['reviews', 'triage', 'read'],
  timeoutMs: 5000,
  async execute(args, ctx) {
    if (ctx.sellerId === undefined) return null;

    const { findReviewsNeedingResponse } = await import('../../../services/reviews.service.js');
    return findReviewsNeedingResponse(ctx.sellerId, args);
  },
};
