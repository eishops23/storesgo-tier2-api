// Agent Suite — recommend_from_cart tool (Phase 18A Prompt 3)

import { z } from 'zod';
import type { AgentTool } from '../types.js';

const argsSchema = z.object({
  productIds: z
    .array(z.number().int().positive())
    .min(1)
    .max(20)
    .describe('Product IDs currently in the customer cart. 1-20 items.'),
  limit: z.number().int().min(1).max(15).optional().describe('Max recommendations (default 10)'),
});

type Args = z.infer<typeof argsSchema>;

export const recommendFromCartTool: AgentTool<Args, unknown> = {
  name: 'recommend_from_cart',
  description:
    "Cart-completion recommendations. Given the customer's current cart contents, returns up to 10 products to complete the cart. Tries recipe-driven complementary products first, augments with similar-product suggestions for each cart item if needed, and reports which strategy contributed ('recipe', 'taxonomy', or 'mixed') so the agent can explain its reasoning. Works for both guests and authenticated customers.",
  argsSchema,
  requiredAutonomy: 'L0',
  reversible: true,
  tags: ['recommendations', 'cart', 'read'],
  timeoutMs: 10000,
  async execute(args) {
    const { recommendFromCartForAgent } = await import(
      '../../../services/recommendations.service.js'
    );
    return recommendFromCartForAgent(args.productIds, {
      limit: args.limit,
    });
  },
};
