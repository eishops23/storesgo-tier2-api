// Agent Suite — Catalog tools barrel export (Phase 0 Part C)

import type { ToolRegistry } from '../registry.js';
import { searchProductsTool } from './product-search.js';
import { getProductByIdTool } from './product-get.js';
import { listCategoriesTool } from './category-list.js';
import { getStoreStatsTool } from './store-stats.js';

export { searchProductsTool, getProductByIdTool, listCategoriesTool, getStoreStatsTool };

export function registerCatalogTools(registry: ToolRegistry): void {
  registry.register(searchProductsTool);
  registry.register(getProductByIdTool);
  registry.register(listCategoriesTool);
  registry.register(getStoreStatsTool);
}
