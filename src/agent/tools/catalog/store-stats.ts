// Agent Suite — get_store_stats tool (Phase 0 Part C)

import { z } from 'zod';
import type { AgentTool } from '../types.js';
import { getPrisma } from '../../storage/prisma-client.js';

const argsSchema = z.object({});

type Args = z.infer<typeof argsSchema>;

interface Result {
  totalActiveProducts: number;
  totalApprovedSellers: number;
  totalCategories: number;
  totalOrders: number;
}

export const getStoreStatsTool: AgentTool<Args, Result> = {
  name: 'get_store_stats',
  description:
    'Get aggregate store statistics: total active products, approved sellers, categories, and orders.',
  argsSchema,
  requiredAutonomy: 'L0',
  reversible: true,
  tags: ['read', 'stats'],
  async execute(_args, ctx) {
    const prisma = ctx.prisma ?? getPrisma();

    const [products, sellers, categories, orders] = await Promise.all([
      prisma.product.count({ where: { isActive: true } }),
      prisma.seller.count({ where: { isApproved: true } }),
      prisma.category.count(),
      prisma.order.count(),
    ]);

    return {
      totalActiveProducts: products,
      totalApprovedSellers: sellers,
      totalCategories: categories,
      totalOrders: orders,
    };
  },
};
