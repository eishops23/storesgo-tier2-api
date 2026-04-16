// Agent Suite — find_featured_products_zero_orders tool (Phase 12 Prompt 2)

import { z } from 'zod';
import type { AgentTool } from '../types.js';

const argsSchema = z.object({
  windowDays: z
    .number()
    .int()
    .min(1)
    .max(365)
    .optional()
    .describe('Lookback window for zero-orders detection. Default 30.'),
});

type Args = z.infer<typeof argsSchema>;

interface ZeroOrderFeaturedSlot {
  id: number;
  name: string;
  priceCents: number;
  orders30d: number;
  stockStatus: 'ok' | 'low_stock' | 'out_of_stock' | 'untracked';
}

export const findFeaturedProductsZeroOrdersTool: AgentTool<
  Args,
  ZeroOrderFeaturedSlot[] | null
> = {
  name: 'find_featured_products_zero_orders',
  description:
    "Return the featured-slot products that have zero non-cancelled orders in the lookback window (default 30 days). Each entry is joined with name, priceCents, orders30d, and stockStatus from the snapshot. Use this to surface 'dead' featured slots the operator should consider swapping. Operator-facing — requires admin. Read-only.",
  argsSchema,
  requiredAutonomy: 'L0',
  reversible: true,
  tags: ['merchandising', 'coverage', 'read'],
  timeoutMs: 10000,
  async execute(args, ctx) {
    if (ctx.adminId === undefined) return null;

    const { getMerchandisingSnapshot } = await import(
      '../../../services/homepage.service.js'
    );
    const snap = await getMerchandisingSnapshot({ windowDays: args.windowDays });
    const zeroOrderIds = new Set(snap.coverageGaps.featuredProductsWithZeroOrders);
    return snap.featuredProducts
      .filter((p) => zeroOrderIds.has(p.id))
      .map((p) => ({
        id: p.id,
        name: p.name,
        priceCents: p.priceCents,
        orders30d: p.orders30d,
        stockStatus: p.stockStatus,
      }));
  },
};
