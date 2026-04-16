// Agent Suite — Merchandising tools barrel export (Phase 12 Prompt 2)

import type { ToolRegistry } from '../registry.js';
import { getMerchandisingSnapshotTool } from './get-merchandising-snapshot.js';
import { findFeaturedProductsZeroOrdersTool } from './find-featured-products-zero-orders.js';
import { findUncoveredCategoriesTool } from './find-uncovered-categories.js';
import { getFeaturedProductPerformanceTool } from './get-featured-product-performance.js';
import { listCmsBlocksScheduleTool } from './list-cms-blocks-schedule.js';

export {
  getMerchandisingSnapshotTool,
  findFeaturedProductsZeroOrdersTool,
  findUncoveredCategoriesTool,
  getFeaturedProductPerformanceTool,
  listCmsBlocksScheduleTool,
};

export function registerMerchandisingTools(registry: ToolRegistry): void {
  registry.register(getMerchandisingSnapshotTool);
  registry.register(findFeaturedProductsZeroOrdersTool);
  registry.register(findUncoveredCategoriesTool);
  registry.register(getFeaturedProductPerformanceTool);
  registry.register(listCmsBlocksScheduleTool);
}
