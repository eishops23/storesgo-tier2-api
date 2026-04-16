// Agent Suite — get_user_orders tool tests (Phase 1 Prompt 2)

import { describe, it, expect, vi } from 'vitest';
import { getUserOrdersTool } from '../get-user-orders.js';
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

function makeMockPrisma(orders: any[] = []): any {
  return {
    order: {
      findMany: vi.fn().mockResolvedValue(orders),
    },
  };
}

const sampleOrders = [
  {
    id: 10,
    status: 'delivered',
    totalAmountCents: 3500,
    createdAt: new Date('2026-03-20T10:00:00Z'),
    trackingNumber: 'TRK-A',
    seller: { storeName: 'Island Market' },
  },
  {
    id: 9,
    status: 'shipped',
    totalAmountCents: 1200,
    createdAt: new Date('2026-03-18T10:00:00Z'),
    trackingNumber: null,
    seller: { storeName: 'Fresh Farms' },
  },
];

describe('get_user_orders tool', () => {
  it('has correct metadata', () => {
    expect(getUserOrdersTool.name).toBe('get_user_orders');
    expect(getUserOrdersTool.requiredAutonomy).toBe('L0');
    expect(getUserOrdersTool.tags).toContain('cs');
    expect(getUserOrdersTool.tags).toContain('orders');
  });

  it('returns empty array for guests (no userId)', async () => {
    const prisma = makeMockPrisma(sampleOrders);
    const ctx = makeCtx({ userId: undefined, prisma });

    const result = await getUserOrdersTool.execute({}, ctx);

    expect(result.orders).toEqual([]);
    expect(result.total).toBe(0);
    expect(prisma.order.findMany).not.toHaveBeenCalled();
  });

  it('returns orders for authenticated user', async () => {
    const prisma = makeMockPrisma(sampleOrders);
    const ctx = makeCtx({ prisma });

    const result = await getUserOrdersTool.execute({}, ctx);

    expect(result.orders).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.orders[0].id).toBe(10);
    expect(result.orders[0].sellerName).toBe('Island Market');
  });

  it('queries with buyerId matching ctx.userId', async () => {
    const prisma = makeMockPrisma([]);
    const ctx = makeCtx({ prisma });

    await getUserOrdersTool.execute({}, ctx);

    expect(prisma.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ buyerId: 'user-abc' }),
        orderBy: { createdAt: 'desc' },
      }),
    );
  });

  it('respects limit parameter', async () => {
    const prisma = makeMockPrisma([]);
    const ctx = makeCtx({ prisma });

    await getUserOrdersTool.execute({ limit: 3 }, ctx);

    expect(prisma.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 3 }),
    );
  });

  it('uses default limit of 10', async () => {
    const prisma = makeMockPrisma([]);
    const ctx = makeCtx({ prisma });

    await getUserOrdersTool.execute({}, ctx);

    expect(prisma.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 10 }),
    );
  });

  it('filters by status when provided', async () => {
    const prisma = makeMockPrisma([]);
    const ctx = makeCtx({ prisma });

    await getUserOrdersTool.execute({ status: 'shipped' }, ctx);

    expect(prisma.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'shipped' }),
      }),
    );
  });

  it('validates args with Zod schema', () => {
    expect(getUserOrdersTool.argsSchema.safeParse({}).success).toBe(true);
    expect(getUserOrdersTool.argsSchema.safeParse({ limit: 5 }).success).toBe(true);
    expect(getUserOrdersTool.argsSchema.safeParse({ limit: 0 }).success).toBe(false);
    expect(getUserOrdersTool.argsSchema.safeParse({ limit: 51 }).success).toBe(false);
  });
});
