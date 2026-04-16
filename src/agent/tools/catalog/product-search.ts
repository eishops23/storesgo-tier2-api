// Agent Suite — search_products tool (Phase 0 Part C)

import { z } from 'zod';
import type { AgentTool } from '../types.js';
import { getPrisma } from '../../storage/prisma-client.js';

const argsSchema = z.object({
  query: z.string().min(1).max(200),
  limit: z.number().int().min(1).max(50).default(10),
  categoryId: z.number().int().optional(),
});

type Args = z.infer<typeof argsSchema>;

interface ProductResult {
  id: number;
  name: string;
  slug: string | null;
  priceCents: number;
  currency: string;
  imageUrl: string | null;
  sellerId: number;
  categoryId: number | null;
  isActive: boolean;
}

interface Result {
  products: ProductResult[];
  totalFound: number;
  query: string;
}

export const searchProductsTool: AgentTool<Args, Result> = {
  name: 'search_products',
  description:
    'Search StoresGo products by name. Returns up to 50 products with id, name, price, and seller info.',
  argsSchema,
  requiredAutonomy: 'L0',
  reversible: true,
  tags: ['read', 'product'],
  async execute(args, ctx) {
    const prisma = ctx.prisma ?? getPrisma();
    const where = {
      isActive: true,
      name: { contains: args.query, mode: 'insensitive' as const },
      ...(args.categoryId ? { categoryId: args.categoryId } : {}),
    };

    const [products, count] = await Promise.all([
      prisma.product.findMany({
        where,
        take: args.limit,
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          slug: true,
          priceCents: true,
          currency: true,
          imageUrl: true,
          sellerId: true,
          categoryId: true,
          isActive: true,
        },
      }),
      prisma.product.count({ where }),
    ]);

    return {
      products: products as ProductResult[],
      totalFound: count,
      query: args.query,
    };
  },
};
