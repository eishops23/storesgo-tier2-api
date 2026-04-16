// Agent Suite — get_merchandising_snapshot tool (Phase 12 Prompt 2)

import { z } from 'zod';
import type { AgentTool } from '../types.js';

const argsSchema = z.object({
  windowDays: z
    .number()
    .int()
    .min(1)
    .max(365)
    .optional()
    .describe(
      'Lookback window (in days) for the featuredProductsWithZeroOrders coverage-gap detector. Default 30. Does NOT resize orders7d/orders30d — those are fixed 7/30 day windows.',
    ),
});

type Args = z.infer<typeof argsSchema>;

export const getMerchandisingSnapshotTool: AgentTool<Args, unknown> = {
  name: 'get_merchandising_snapshot',
  description:
    "Aggregate the current state of the homepage merchandising surface. Returns featuredProducts (with orders7d, orders30d, favoriteAdds7d, stockStatus, and addedToFeatured proxy), featuredCategories (with productCount and orders7d), all cmsBlocks with scheduling, homepage config flags, and coverageGaps (categoriesWithoutFeatured, featuredProductsWithZeroOrders). Operator-facing — requires admin. Read-only. Call this first for any broad merchandising question.",
  argsSchema,
  requiredAutonomy: 'L0',
  reversible: true,
  tags: ['merchandising', 'snapshot', 'read'],
  timeoutMs: 10000,
  async execute(args, ctx) {
    if (ctx.adminId === undefined) return null;

    const { getMerchandisingSnapshot } = await import(
      '../../../services/homepage.service.js'
    );
    return getMerchandisingSnapshot({ windowDays: args.windowDays });
  },
};
