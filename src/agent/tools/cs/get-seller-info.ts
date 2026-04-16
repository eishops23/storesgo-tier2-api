// Agent Suite — get_seller_info tool (Phase 1 Prompt 2)

import { z } from 'zod';
import type { AgentTool } from '../types.js';
import { getPrisma } from '../../storage/prisma-client.js';

const argsSchema = z.object({
  identifier: z.union([
    z.string().min(1).describe('Seller slug'),
    z.number().int().positive().describe('Seller numeric ID'),
  ]).describe('Seller slug (string) or numeric ID'),
});

type Args = z.infer<typeof argsSchema>;

interface SellerResult {
  id: number;
  slug: string;
  storeName: string;
  location: { city: string | null; state: string | null };
  about: string | null;
  productCount: number;
}

type Result = SellerResult | null;

export const getSellerInfoTool: AgentTool<Args, Result> = {
  name: 'get_seller_info',
  description:
    'Retrieves public information about a seller store by slug or numeric ID. Returns store name, location, description, and product count. Public data — no authentication required.',
  argsSchema,
  requiredAutonomy: 'L0',
  reversible: true,
  tags: ['cs', 'sellers', 'read', 'public'],
  timeoutMs: 5000,
  async execute(args, ctx) {
    const prisma = ctx.prisma ?? getPrisma();
    const where = typeof args.identifier === 'number'
      ? { id: args.identifier }
      : { slug: args.identifier };

    const seller = await prisma.seller.findUnique({
      where,
      select: {
        id: true,
        slug: true,
        storeName: true,
        city: true,
        state: true,
        about: true,
        _count: { select: { products: true } },
      },
    });

    if (!seller) return null;

    return {
      id: seller.id,
      slug: seller.slug,
      storeName: seller.storeName,
      location: { city: seller.city, state: seller.state },
      about: seller.about,
      productCount: seller._count.products,
    };
  },
};
