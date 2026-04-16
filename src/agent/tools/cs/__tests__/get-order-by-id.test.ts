// Agent Suite — get_order_by_id tool tests (Phase 1 Prompt 2)

import { describe, it, expect, vi } from 'vitest';
import { getOrderByIdTool } from '../get-order-by-id.js';
import type { ToolContext } from '../../types.js';

function makeCtx(overrides: Partial<ToolContext> = {}): ToolContext {
  return {
    sessionId: 'sess-1',
    featureKey: 'cs_chat',
    conversationId: 'conv-1',
    messageId: 'msg-1',
    userId: 'user-abc',
    prisma: undefined as any,
    ...overrides,
  };
}

function makeMockPrisma(order: any = null): any {
  return {
    order: {
      findUnique: vi.fn().mockResolvedValue(order),
    },
  };
}

const sampleOrder = {
  id: 42,
  buyerId: 'user-abc',
  status: 'shipped',
  totalAmountCents: 5999,
  createdAt: new Date('2026-03-15T10:00:00Z'),
  trackingNumber: 'TRK123',
  shippingName: 'Jon Smith',
  shippingStreet: '123 Main St',
  shippingCity: 'Miami',
  shippingState: 'FL',
  shippingZip: '33101',
  seller: { storeName: 'Caribbean Spice', city: 'Miami', state: 'FL', slug: 'caribbean-spice' },
  orderItems: [
    { quantity: 2, priceCents: 1499, product: { name: 'Jerk Sauce', imageUrl: '/img/jerk.jpg' } },
    { quantity: 1, priceCents: 3001, product: { name: 'Plantain Chips', imageUrl: null } },
  ],
};

describe('get_order_by_id tool', () => {
  it('has correct metadata', () => {
    expect(getOrderByIdTool.name).toBe('get_order_by_id');
    expect(getOrderByIdTool.requiredAutonomy).toBe('L0');
    expect(getOrderByIdTool.reversible).toBe(true);
    expect(getOrderByIdTool.tags).toContain('cs');
    expect(getOrderByIdTool.tags).toContain('orders');
  });

  it('returns null when ctx.userId is undefined (guest)', async () => {
    const prisma = makeMockPrisma(sampleOrder);
    const ctx = makeCtx({ userId: undefined, prisma });

    const result = await getOrderByIdTool.execute({ orderId: 42 }, ctx);

    expect(result).toBeNull();
    expect(prisma.order.findUnique).not.toHaveBeenCalled();
  });

  it('returns null when order does not exist', async () => {
    const prisma = makeMockPrisma(null);
    const ctx = makeCtx({ prisma });

    const result = await getOrderByIdTool.execute({ orderId: 999 }, ctx);

    expect(result).toBeNull();
  });

  it('returns null when order belongs to a different user', async () => {
    const prisma = makeMockPrisma({ ...sampleOrder, buyerId: 'other-user' });
    const ctx = makeCtx({ prisma });

    const result = await getOrderByIdTool.execute({ orderId: 42 }, ctx);

    expect(result).toBeNull();
  });

  it('returns order data when buyerId matches ctx.userId', async () => {
    const prisma = makeMockPrisma(sampleOrder);
    const ctx = makeCtx({ prisma });

    const result = await getOrderByIdTool.execute({ orderId: 42 }, ctx);

    expect(result).not.toBeNull();
    expect(result!.id).toBe(42);
    expect(result!.status).toBe('shipped');
    expect(result!.totalAmountCents).toBe(5999);
    expect(result!.trackingNumber).toBe('TRK123');
  });

  it('includes shipping address, items, and seller', async () => {
    const prisma = makeMockPrisma(sampleOrder);
    const ctx = makeCtx({ prisma });

    const result = await getOrderByIdTool.execute({ orderId: 42 }, ctx);

    expect(result!.shippingAddress).toEqual({
      name: 'Jon Smith',
      street: '123 Main St',
      city: 'Miami',
      state: 'FL',
      zip: '33101',
    });
    expect(result!.seller).toEqual({
      name: 'Caribbean Spice',
      city: 'Miami',
      state: 'FL',
      slug: 'caribbean-spice',
    });
    expect(result!.items).toHaveLength(2);
    expect(result!.items[0]).toEqual({
      name: 'Jerk Sauce',
      imageUrl: '/img/jerk.jpg',
      quantity: 2,
      priceCents: 1499,
    });
  });

  it('validates args with Zod schema', () => {
    expect(getOrderByIdTool.argsSchema.safeParse({ orderId: 1 }).success).toBe(true);
    expect(getOrderByIdTool.argsSchema.safeParse({ orderId: 0 }).success).toBe(false);
    expect(getOrderByIdTool.argsSchema.safeParse({ orderId: -1 }).success).toBe(false);
    expect(getOrderByIdTool.argsSchema.safeParse({}).success).toBe(false);
  });
});
