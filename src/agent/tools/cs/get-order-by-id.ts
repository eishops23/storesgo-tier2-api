// Agent Suite — get_order_by_id tool (Phase 1 Prompt 2)

import { z } from 'zod';
import type { AgentTool } from '../types.js';
import { getPrisma } from '../../storage/prisma-client.js';

const argsSchema = z.object({
  orderId: z.number().int().positive().describe('The numeric order ID to look up'),
});

type Args = z.infer<typeof argsSchema>;

interface OrderResult {
  id: number;
  status: string;
  totalAmountCents: number;
  createdAt: string;
  trackingNumber: string | null;
  shippingAddress: {
    name: string | null;
    street: string | null;
    city: string | null;
    state: string | null;
    zip: string | null;
  };
  seller: {
    name: string | null;
    city: string | null;
    state: string | null;
    slug: string;
  } | null;
  items: Array<{
    name: string | null;
    imageUrl: string | null;
    quantity: number;
    priceCents: number;
  }>;
}

type Result = OrderResult | null;

export const getOrderByIdTool: AgentTool<Args, Result> = {
  name: 'get_order_by_id',
  description:
    'Retrieves full details of a specific order by its numeric ID. Only returns the order if the requesting user is the buyer. Returns null for guests or for orders owned by other users.',
  argsSchema,
  requiredAutonomy: 'L0',
  reversible: true,
  tags: ['cs', 'orders', 'read'],
  timeoutMs: 5000,
  async execute(args, ctx) {
    if (!ctx.userId) return null;

    const prisma = ctx.prisma ?? getPrisma();
    const order = await prisma.order.findUnique({
      where: { id: args.orderId },
      include: {
        orderItems: {
          include: { product: { select: { name: true, imageUrl: true } } },
        },
        seller: {
          select: { storeName: true, city: true, state: true, slug: true },
        },
      },
    });

    if (!order) return null;
    if (order.buyerId !== ctx.userId) return null;

    return {
      id: order.id,
      status: order.status,
      totalAmountCents: order.totalAmountCents,
      createdAt: order.createdAt.toISOString(),
      trackingNumber: order.trackingNumber,
      shippingAddress: {
        name: order.shippingName,
        street: order.shippingStreet,
        city: order.shippingCity,
        state: order.shippingState,
        zip: order.shippingZip,
      },
      seller: order.seller
        ? {
            name: order.seller.storeName,
            city: order.seller.city,
            state: order.seller.state,
            slug: order.seller.slug,
          }
        : null,
      items: order.orderItems.map((i: any) => ({
        name: i.product?.name ?? null,
        imageUrl: i.product?.imageUrl ?? null,
        quantity: i.quantity,
        priceCents: i.priceCents,
      })),
    };
  },
};
