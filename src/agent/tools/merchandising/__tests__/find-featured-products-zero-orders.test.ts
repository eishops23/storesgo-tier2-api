// Agent Suite — find_featured_products_zero_orders tool tests (Phase 12 Prompt 2)

import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../../services/homepage.service.js', () => ({
  getMerchandisingSnapshot: vi.fn(),
}));

import { findFeaturedProductsZeroOrdersTool } from '../find-featured-products-zero-orders.js';
import { getMerchandisingSnapshot } from '../../../../services/homepage.service.js';
import type { ToolContext } from '../../types.js';

const mockSnapshot = vi.mocked(getMerchandisingSnapshot);

function makeCtx(overrides: Partial<ToolContext> = {}): ToolContext {
  return {
    sessionId: 'sess-1',
    featureKey: 'merchandising',
    conversationId: 'conv-1',
    messageId: 'msg-1',
    userId: 'user-123',
    adminId: 7,
    ...overrides,
  };
}

function makeSnap(overrides: any = {}) {
  return {
    windowDays: 30,
    generatedAt: new Date(),
    featuredProducts: [
      { id: 1, name: 'Hot Sauce', priceCents: 999, addedToFeatured: new Date(), orders7d: 5, orders30d: 12, views7d: null, favoriteAdds7d: 3, stockStatus: 'ok' },
      { id: 2, name: 'Yams', priceCents: 499, addedToFeatured: new Date(), orders7d: 0, orders30d: 0, views7d: null, favoriteAdds7d: 0, stockStatus: 'out_of_stock' },
      { id: 3, name: 'Plantains', priceCents: 299, addedToFeatured: new Date(), orders7d: 0, orders30d: 0, views7d: null, favoriteAdds7d: 1, stockStatus: 'low_stock' },
    ],
    featuredCategories: [],
    cmsBlocks: [],
    homepage: {} as any,
    coverageGaps: { categoriesWithoutFeatured: [], featuredProductsWithZeroOrders: [2, 3] },
    ...overrides,
  };
}

describe('find_featured_products_zero_orders tool', () => {
  it('returns null when ctx.adminId is undefined', async () => {
    const result = await findFeaturedProductsZeroOrdersTool.execute({}, makeCtx({ adminId: undefined }));
    expect(result).toBeNull();
    expect(mockSnapshot).not.toHaveBeenCalled();
  });

  it('joins zero-order IDs with name/priceCents/stockStatus from featuredProducts', async () => {
    mockSnapshot.mockResolvedValue(makeSnap() as any);
    const result = await findFeaturedProductsZeroOrdersTool.execute({}, makeCtx());
    expect(result).toEqual([
      { id: 2, name: 'Yams', priceCents: 499, orders30d: 0, stockStatus: 'out_of_stock' },
      { id: 3, name: 'Plantains', priceCents: 299, orders30d: 0, stockStatus: 'low_stock' },
    ]);
  });

  it('returns empty array when no featured products have zero orders', async () => {
    mockSnapshot.mockResolvedValue(
      makeSnap({ coverageGaps: { categoriesWithoutFeatured: [], featuredProductsWithZeroOrders: [] } }) as any,
    );
    const result = await findFeaturedProductsZeroOrdersTool.execute({}, makeCtx());
    expect(result).toEqual([]);
  });

  it('passes windowDays through to the service', async () => {
    mockSnapshot.mockResolvedValue(makeSnap() as any);
    await findFeaturedProductsZeroOrdersTool.execute({ windowDays: 60 }, makeCtx());
    expect(mockSnapshot).toHaveBeenCalledWith({ windowDays: 60 });
  });

  it('rejects windowDays > 365 via Zod', () => {
    expect(findFeaturedProductsZeroOrdersTool.argsSchema.safeParse({ windowDays: 400 }).success).toBe(false);
    expect(findFeaturedProductsZeroOrdersTool.argsSchema.safeParse({ windowDays: 30 }).success).toBe(true);
  });
});
