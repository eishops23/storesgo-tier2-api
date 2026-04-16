// Agent Suite — get_review_stats tool (Phase 11 Prompt 3)

import { z } from 'zod';
import type { AgentTool } from '../types.js';

const argsSchema = z.object({
  sinceDays: z
    .number()
    .int()
    .min(1)
    .max(365)
    .optional()
    .describe('Window for the aggregation in days (default 90, max 365)'),
});

type Args = z.infer<typeof argsSchema>;

export const getReviewStatsTool: AgentTool<Args, unknown> = {
  name: 'get_review_stats',
  description:
    "Get aggregate review statistics for the authenticated seller: total reviews, average rating, distribution across 1-5 stars, and how many recent reviews need a response. Requires the caller to be signed in as a seller.",
  argsSchema,
  requiredAutonomy: 'L0',
  reversible: true,
  tags: ['reviews', 'stats', 'read'],
  timeoutMs: 5000,
  async execute(args, ctx) {
    if (ctx.sellerId === undefined) return null;

    const { getReviewStatsForSeller } = await import('../../../services/reviews.service.js');
    return getReviewStatsForSeller(ctx.sellerId, args.sinceDays);
  },
};
