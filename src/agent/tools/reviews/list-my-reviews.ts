// Agent Suite — list_my_reviews tool (Phase 11 Prompt 3)

import { z } from 'zod';
import type { AgentTool } from '../types.js';

const argsSchema = z.object({
  minRating: z.number().int().min(1).max(5).optional().describe('Lowest rating to include (1-5)'),
  maxRating: z.number().int().min(1).max(5).optional().describe('Highest rating to include (1-5)'),
  sinceDays: z.number().int().min(1).max(365).optional().describe('Only reviews from the last N days'),
  limit: z.number().int().min(1).max(50).optional().describe('Max results (default 20)'),
});

type Args = z.infer<typeof argsSchema>;

export const listMyReviewsTool: AgentTool<Args, unknown> = {
  name: 'list_my_reviews',
  description:
    "List recent customer reviews left on the authenticated seller's products. Supports filtering by minimum/maximum rating and time window. Requires the caller to be signed in as a seller.",
  argsSchema,
  requiredAutonomy: 'L0',
  reversible: true,
  tags: ['reviews', 'list', 'read'],
  timeoutMs: 5000,
  async execute(args, ctx) {
    if (ctx.sellerId === undefined) return null;

    const { listReviewsForSeller } = await import('../../../services/reviews.service.js');
    return listReviewsForSeller(ctx.sellerId, args);
  },
};
