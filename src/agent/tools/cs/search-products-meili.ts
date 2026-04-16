// Agent Suite — search_products_meili tool (Phase 1 Prompt 2)

import { z } from 'zod';
import type { AgentTool } from '../types.js';

const argsSchema = z.object({
  query: z.string().min(1).describe('Natural language search query'),
  limit: z.number().int().min(1).max(20).optional().describe('Max results (default 8)'),
});

type Args = z.infer<typeof argsSchema>;

interface Result {
  products: any[];
  total: number;
  query: string;
}

export const searchProductsMeiliTool: AgentTool<Args, Result> = {
  name: 'search_products_meili',
  description:
    'Semantic product search using Meilisearch. Much better results than basic string matching. Use this instead of search_products for customer-facing queries. Returns products with full details including pricing, images, and seller info.',
  argsSchema,
  requiredAutonomy: 'L0',
  reversible: true,
  tags: ['cs', 'products', 'search', 'meilisearch'],
  timeoutMs: 10000,
  async execute(args) {
    const { aiSmartSearch } = await import('../../../services/aiSearch.service.js');
    const result = await aiSmartSearch({ query: args.query, pageSize: args.limit ?? 8 });
    return {
      products: result.products,
      total: result.total,
      query: args.query,
    };
  },
};
