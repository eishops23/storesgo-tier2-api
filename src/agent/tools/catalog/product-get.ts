// Agent Suite — get_product_by_id tool (Phase 0 Part C)

import { z } from 'zod';
import type { AgentTool } from '../types.js';
import { getPrisma } from '../../storage/prisma-client.js';

const argsSchema = z.object({
  productId: z.number().int().positive(),
});

type Args = z.infer<typeof argsSchema>;

interface ProductDetail {
  id: number;
  name: string;
  slug: string | null;
  description: string | null;
  priceCents: number;
  currency: string;
  imageUrl: string | null;
  sellerId: number;
  categoryId: number | null;
  isActive: boolean;
  status: string;
  seller: { id: number; storeName: string; slug: string } | null;
  category: { id: number; name: string; slug: string } | null;
}

interface Result {
  product: ProductDetail | null;
  found: boolean;
}

export const getProductByIdTool: AgentTool<Args, Result> = {
  name: 'get_product_by_id',
  description:
    'Get a single StoresGo product by its ID. Returns full product details including seller and category.',
  argsSchema,
  requiredAutonomy: 'L0',
  reversible: true,
  tags: ['read', 'product'],
  async execute(args, ctx) {
    const prisma = ctx.prisma ?? getPrisma();
    const product = await prisma.product.findUnique({
      where: { id: args.productId },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        priceCents: true,
        currency: true,
        imageUrl: true,
        sellerId: true,
        categoryId: true,
        isActive: true,
        status: true,
        seller: { select: { id: true, storeName: true, slug: true } },
        category: { select: { id: true, name: true, slug: true } },
      },
    });

    return {
      product: product as ProductDetail | null,
      found: product !== null,
    };
  },
};
