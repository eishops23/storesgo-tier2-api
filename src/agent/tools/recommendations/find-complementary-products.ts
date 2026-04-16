// Agent Suite — find_complementary_products tool (Phase 18A Prompt 3)

import { z } from 'zod';
import type { AgentTool } from '../types.js';

const argsSchema = z.object({
  productIds: z
    .array(z.number().int().positive())
    .min(1)
    .max(10)
    .describe('Product IDs the customer already has (e.g. cart contents). 1-10 items.'),
  limit: z.number().int().min(1).max(15).optional().describe('Max complementary products (default 8)'),
});

type Args = z.infer<typeof argsSchema>;

export const findComplementaryProductsTool: AgentTool<Args, unknown> = {
  name: 'find_complementary_products',
  description:
    "Given one or more products (typically the customer's current cart), find products that complement them. Primary path is RECIPE-DRIVEN: if any cart item is a known recipe ingredient, returns the other ingredients for that recipe as products via Meilisearch. Fallback is taxonomy-based (same category). Returns both a product list and matchedRecipes metadata the agent can use to explain the suggestions (e.g. 'needed for Haitian Griot'). Works for both guests and authenticated customers. The cart is passed explicitly in args because StoresGo has no server-side cart table.",
  argsSchema,
  requiredAutonomy: 'L0',
  reversible: true,
  tags: ['recommendations', 'cart', 'recipe', 'read'],
  timeoutMs: 10000,
  async execute(args) {
    const { findComplementaryProductsForAgent } = await import(
      '../../../services/recommendations.service.js'
    );
    return findComplementaryProductsForAgent(args.productIds, {
      limit: args.limit,
    });
  },
};
