// Agent Suite — find_similar_products tool (Phase 18A Prompt 3)

import { z } from 'zod';
import type { AgentTool } from '../types.js';

const argsSchema = z.object({
  productId: z.number().int().positive().describe('Source product ID to find similar products for'),
  limit: z.number().int().min(1).max(20).optional().describe('Max results (default 10)'),
  excludeProductIds: z
    .array(z.number().int().positive())
    .max(50)
    .optional()
    .describe('Product IDs to exclude from results (e.g. items already in cart)'),
});

type Args = z.infer<typeof argsSchema>;

export const findSimilarProductsTool: AgentTool<Args, unknown> = {
  name: 'find_similar_products',
  description:
    "Find products similar to a source product via layered content-based scoring: aiTag overlap, same category, price proximity, and rating. Returns up to 10 ranked candidates with score breakdowns the agent can rerank. Works for both guests and authenticated customers. The agent should pick at most 5 to surface to the customer.",
  argsSchema,
  requiredAutonomy: 'L0',
  reversible: true,
  tags: ['recommendations', 'similar', 'read'],
  timeoutMs: 8000,
  async execute(args) {
    const { findSimilarProductsForAgent } = await import(
      '../../../services/recommendations.service.js'
    );
    return findSimilarProductsForAgent(args.productId, {
      limit: args.limit,
      excludeProductIds: args.excludeProductIds,
    });
  },
};
