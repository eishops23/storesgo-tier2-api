// Agent Suite — CS Chat context cache tests (Phase 1 Prompt 3)

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../storage/prisma-client.js', () => ({
  getPrisma: vi.fn(() => mockPrisma),
}));

vi.mock('../../../observability/index.js', () => ({
  createChildLogger: vi.fn(() => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() })),
}));

const mockPrisma = {
  product: { count: vi.fn() },
  seller: { count: vi.fn(), findMany: vi.fn() },
  category: { count: vi.fn(), findMany: vi.fn() },
  order: { count: vi.fn() },
} as any;

import { getStoreContext, _clearStoreContextCache } from '../context-cache.js';

describe('context-cache', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    _clearStoreContextCache();

    mockPrisma.product.count.mockResolvedValue(1000);
    mockPrisma.seller.count.mockResolvedValue(10);
    mockPrisma.category.count.mockResolvedValue(50);
    mockPrisma.order.count.mockResolvedValue(500);
    mockPrisma.seller.findMany.mockResolvedValue([{ storeName: 'Store A' }, { storeName: 'Store B' }]);
    mockPrisma.category.findMany.mockResolvedValue([{ name: 'Produce' }, { name: 'Dairy' }]);
  });

  it('fetches store context from DB on first call', async () => {
    const ctx = await getStoreContext();

    expect(ctx.productCount).toBe(1000);
    expect(ctx.activeSellerCount).toBe(10);
    expect(ctx.categoryCount).toBe(50);
    expect(ctx.orderCount).toBe(500);
    expect(ctx.sellerNames).toEqual(['Store A', 'Store B']);
    expect(ctx.categoryNames).toEqual(['Produce', 'Dairy']);
  });

  it('returns cached value on second call within TTL', async () => {
    await getStoreContext();
    await getStoreContext();

    // DB should only be called once (6 queries in the Promise.all)
    expect(mockPrisma.product.count).toHaveBeenCalledTimes(1);
  });

  it('_clearStoreContextCache forces refresh', async () => {
    await getStoreContext();
    _clearStoreContextCache();

    mockPrisma.product.count.mockResolvedValue(2000);
    const ctx = await getStoreContext();

    expect(ctx.productCount).toBe(2000);
    expect(mockPrisma.product.count).toHaveBeenCalledTimes(2);
  });

  it('queries sellers with isApproved filter', async () => {
    await getStoreContext();

    expect(mockPrisma.seller.count).toHaveBeenCalledWith({ where: { isApproved: true } });
  });
});
