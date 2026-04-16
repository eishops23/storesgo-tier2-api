// Agent Suite — get_user_orders tool (Phase 1 Prompt 2)

import { z } from 'zod';
import type { AgentTool } from '../types.js';
import { getPrisma } from '../../storage/prisma-client.js';

const argsSchema = z.object({
  limit: z.number().int().min(1).max(50).optional().describe('Max orders to return (default 10)'),
  status: z.string().optional().describe('Filter by order status (e.g. pending, paid, shipped, delivered, cancelled)'),
});

type Args = z.infer<typeof argsSchema>;

interface OrderSummary {
  id: number;
  status: string;
  totalAmountCents: number;
  createdAt: string;
  trackingNumber: string | null;
  sellerName: string | null;
}

interface Result {
  orders: OrderSummary[];
  total: number;
}

export const getUserOrdersTool: AgentTool<Args, Result> = {
  name: 'get_user_orders',
  description:
    "Lists the authenticated user's recent orders. Returns an empty array for guests. Supports optional status filter and limit.",
  argsSchema,
  requiredAutonomy: 'L0',
  reversible: true,
  tags: ['cs', 'orders', 'read'],
  timeoutMs: 5000,
  async execute(args, ctx) {
    if (!ctx.userId) return { orders: [], total: 0 };

    const prisma = ctx.prisma ?? getPrisma();
    const limit = args.limit ?? 10;
    const where: any = { buyerId: ctx.userId };
    if (args.status) where.status = args.status;

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        status: true,
        totalAmountCents: true,
        createdAt: true,
        trackingNumber: true,
        seller: { select: { storeName: true } },
      },
    });

    return {
      orders: orders.map((o: any) => ({
        id: o.id,
        status: o.status,
        totalAmountCents: o.totalAmountCents,
        createdAt: o.createdAt.toISOString(),
        trackingNumber: o.trackingNumber,
        sellerName: o.seller?.storeName ?? null,
      })),
      total: orders.length,
    };
  },
};
