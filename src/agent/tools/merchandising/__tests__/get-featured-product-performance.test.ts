// Agent Suite — get_featured_product_performance tool tests (Phase 12 Prompt 2)

import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../../services/homepage.service.js', () => ({
  getMerchandisingSnapshot: vi.fn(),
}));

import { getFeaturedProductPerformanceTool } from '../get-featured-product-performance.js';
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

const productA = {
  id: 1,
  name: 'Hot Sauce',
  priceCents: 999,
  addedToFeatured: new Date('2026-04-01'),
  orders7d: 5,
  orders30d: 12,
  views7d: null,
  favoriteAdds7d: 3,
  stockStatus: 'ok' as const,
};

describe('get_featured_product_performance tool', () => {
  it('returns null when ctx.adminId is undefined', async () => {
    const result = await getFeaturedProductPerformanceTool.execute(
      { productId: 1 },
      makeCtx({ adminId: undefined }),
    );
    expect(result).toBeNull();
    expect(mockSnapshot).not.toHaveBeenCalled();
  });

  it('returns the matching featured product from the snapshot', async () => {
    mockSnapshot.mockResolvedValue({ featuredProducts: [productA] } as any);
    const result = await getFeaturedProductPerformanceTool.execute({ productId: 1 }, makeCtx());
    expect(result).toEqual(productA);
  });

  it('returns null when product is not in featuredProducts (not currently featured)', async () => {
    mockSnapshot.mockResolvedValue({ featuredProducts: [productA] } as any);
    const result = await getFeaturedProductPerformanceTool.execute({ productId: 99 }, makeCtx());
    expect(result).toBeNull();
  });

  it('returns null when featuredProducts is empty', async () => {
    mockSnapshot.mockResolvedValue({ featuredProducts: [] } as any);
    const result = await getFeaturedProductPerformanceTool.execute({ productId: 1 }, makeCtx());
    expect(result).toBeNull();
  });

  it('rejects non-positive / non-integer productId via Zod', () => {
    expect(getFeaturedProductPerformanceTool.argsSchema.safeParse({ productId: 0 }).success).toBe(false);
    expect(getFeaturedProductPerformanceTool.argsSchema.safeParse({ productId: -1 }).success).toBe(false);
    expect(getFeaturedProductPerformanceTool.argsSchema.safeParse({ productId: 1.5 }).success).toBe(false);
    expect(getFeaturedProductPerformanceTool.argsSchema.safeParse({ productId: 1 }).success).toBe(true);
  });
});
