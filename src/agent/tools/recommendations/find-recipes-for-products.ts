// Agent Suite — find_recipes_for_products tool (Phase 18A Prompt 3)
//
// IMPORTANT: This tool returns RECIPES, not products. The agent
// can chain to find_complementary_products with a specific recipe's
// source products to get the missing-ingredient products the
// customer still needs to buy. Mirrors the chain-friendly pattern
// from Phase 9's draft_blog_post_outline and Phase 11's draft_response.

import { z } from 'zod';
import type { AgentTool } from '../types.js';

const argsSchema = z.object({
  productIds: z
    .array(z.number().int().positive())
    .min(1)
    .max(10)
    .describe('Product IDs to look up recipes for. Each product is matched against recipe ingredient strings (case-insensitive substring).'),
});

type Args = z.infer<typeof argsSchema>;

export const findRecipesForProductsTool: AgentTool<Args, unknown> = {
  name: 'find_recipes_for_products',
  description:
    "Given one or more products, return up to 5 recipes from the StoresGo recipe library that use them as ingredients. Returns RECIPE metadata only (title, cuisine, prep time, matched ingredients, missing ingredients) — NOT products. Useful for 'what can I cook with this?' queries. The agent can then chain to find_complementary_products to resolve missing-ingredient strings into purchasable products. Works for both guests and authenticated customers.",
  argsSchema,
  requiredAutonomy: 'L0',
  reversible: true,
  tags: ['recommendations', 'recipe', 'read'],
  timeoutMs: 8000,
  async execute(args) {
    const { findRecipesForProductsForAgent } = await import(
      '../../../services/recommendations.service.js'
    );
    return findRecipesForProductsForAgent(args.productIds);
  },
};
