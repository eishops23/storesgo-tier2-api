// Agent Suite — CS tools barrel export (Phase 1 Prompt 2)

import type { ToolRegistry } from '../registry.js';
import { getOrderByIdTool } from './get-order-by-id.js';
import { getUserOrdersTool } from './get-user-orders.js';
import { getSellerInfoTool } from './get-seller-info.js';
import { searchProductsMeiliTool } from './search-products-meili.js';

export { getOrderByIdTool, getUserOrdersTool, getSellerInfoTool, searchProductsMeiliTool };

export function registerCsTools(registry: ToolRegistry): void {
  registry.register(getOrderByIdTool);
  registry.register(getUserOrdersTool);
  registry.register(getSellerInfoTool);
  registry.register(searchProductsMeiliTool);
}
