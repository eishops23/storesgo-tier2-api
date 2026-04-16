// Agent Suite — get_review_by_id tool (Phase 11 Prompt 3)

import { z } from 'zod';
import type { AgentTool } from '../types.js';

const argsSchema = z.object({
  reviewId: z.number().int().positive().describe('The numeric review ID to look up'),
});

type Args = z.infer<typeof argsSchema>;

export const getReviewByIdTool: AgentTool<Args, unknown> = {
  name: 'get_review_by_id',
  description:
    "Get the full details of a single review by its numeric ID. Only returns the review if it belongs to one of the authenticated seller's products. Returns null otherwise.",
  argsSchema,
  requiredAutonomy: 'L0',
  reversible: true,
  tags: ['reviews', 'detail', 'read'],
  timeoutMs: 5000,
  async execute(args, ctx) {
    if (ctx.sellerId === undefined) return null;

    const { getReviewByIdForSeller } = await import('../../../services/reviews.service.js');
    return getReviewByIdForSeller(ctx.sellerId, args.reviewId);
  },
};
