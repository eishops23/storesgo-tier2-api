// Agent Suite — Recommendations tools barrel export (Phase 18A Prompt 3)

import type { ToolRegistry } from '../registry.js';
import { getProductDetailsTool } from './get-product-details.js';
import { findSimilarProductsTool } from './find-similar-products.js';
import { findComplementaryProductsTool } from './find-complementary-products.js';
import { findRecipesForProductsTool } from './find-recipes-for-products.js';
import { recommendFromCartTool } from './recommend-from-cart.js';
import { recommendFromHistoryTool } from './recommend-from-history.js';

export {
  getProductDetailsTool,
  findSimilarProductsTool,
  findComplementaryProductsTool,
  findRecipesForProductsTool,
  recommendFromCartTool,
  recommendFromHistoryTool,
};

export function registerRecommendationsTools(registry: ToolRegistry): void {
  registry.register(getProductDetailsTool);
  registry.register(findSimilarProductsTool);
  registry.register(findComplementaryProductsTool);
  registry.register(findRecipesForProductsTool);
  registry.register(recommendFromCartTool);
  registry.register(recommendFromHistoryTool);
}
