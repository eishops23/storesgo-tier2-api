// Agent Suite — get_featured_product_performance tool (Phase 12 Prompt 2)

import { z } from 'zod';
import type { AgentTool } from '../types.js';

const argsSchema = z.object({
  productId: z
    .number()
    .int()
    .positive()
    .describe('The numeric product ID to look up in the featured slot list'),
});

type Args = z.infer<typeof argsSchema>;

// Return type is intentionally `unknown` — mirroring Phase 9 SEO tools.
// Importing the concrete MerchandisingSnapshotProduct type would pull
// homepage.service.ts (and transitively cms.service.ts) into agent-scope
// tsc, exposing pre-existing non-agent errors per CLAUDE.md.
export const getFeaturedProductPerformanceTool: AgentTool<Args, unknown> = {
  name: 'get_featured_product_performance',
  description:
    "Return the merchandising snapshot entry for one featured product by ID — includes orders7d, orders30d, favoriteAdds7d, stockStatus, priceCents, and addedToFeatured. Returns null if the product is not currently in HomepageConfig.featuredProductIds. Operator-facing — requires admin. Read-only.",
  argsSchema,
  requiredAutonomy: 'L0',
  reversible: true,
  tags: ['merchandising', 'product', 'read'],
  timeoutMs: 10000,
  async execute(args, ctx) {
    if (ctx.adminId === undefined) return null;

    const { getMerchandisingSnapshot } = await import(
      '../../../services/homepage.service.js'
    );
    const snap = await getMerchandisingSnapshot();
    return snap.featuredProducts.find((p) => p.id === args.productId) ?? null;
  },
};
