// Agent Suite — list_my_reviews tool tests (Phase 11 Prompt 3)

import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../../services/reviews.service.js', () => ({
  listReviewsForSeller: vi.fn(),
}));

import { listMyReviewsTool } from '../list-my-reviews.js';
import { listReviewsForSeller } from '../../../../services/reviews.service.js';
import type { ToolContext } from '../../types.js';

const mockList = vi.mocked(listReviewsForSeller);

function makeCtx(overrides: Partial<ToolContext> = {}): ToolContext {
  return {
    sessionId: 'sess-1',
    featureKey: 'reviews',
    conversationId: 'conv-1',
    messageId: 'msg-1',
    userId: 'user-123',
    sellerId: 42,
    ...overrides,
  };
}

describe('list_my_reviews tool', () => {
  it('has correct metadata', () => {
    expect(listMyReviewsTool.name).toBe('list_my_reviews');
    expect(listMyReviewsTool.requiredAutonomy).toBe('L0');
    expect(listMyReviewsTool.reversible).toBe(true);
    expect(listMyReviewsTool.tags).toContain('reviews');
  });

  it('returns null when ctx.sellerId is undefined (ownership check)', async () => {
    const result = await listMyReviewsTool.execute({}, makeCtx({ sellerId: undefined }));
    expect(result).toBeNull();
    expect(mockList).not.toHaveBeenCalled();
  });

  it('calls service with sellerId when authenticated', async () => {
    mockList.mockResolvedValue([]);

    await listMyReviewsTool.execute({}, makeCtx());
    expect(mockList).toHaveBeenCalledWith(42, {});
  });

  it('passes filter args through to service', async () => {
    mockList.mockResolvedValue([]);

    await listMyReviewsTool.execute(
      { minRating: 1, maxRating: 3, sinceDays: 14, limit: 10 },
      makeCtx(),
    );
    expect(mockList).toHaveBeenCalledWith(42, {
      minRating: 1,
      maxRating: 3,
      sinceDays: 14,
      limit: 10,
    });
  });

  it('returns service result', async () => {
    const sample = [
      {
        id: 1,
        userId: 'u1',
        sellerId: 42,
        productId: 100,
        rating: 4,
        comment: 'good',
        createdAt: new Date(),
        product: { id: 100, name: 'Hot Sauce', imageUrl: null },
      },
    ];
    mockList.mockResolvedValue(sample as any);

    const result = await listMyReviewsTool.execute({}, makeCtx());
    expect(result).toEqual(sample);
  });

  it('propagates service errors', async () => {
    mockList.mockRejectedValue(new Error('DB down'));

    await expect(listMyReviewsTool.execute({}, makeCtx())).rejects.toThrow('DB down');
  });

  it('validates args with Zod schema (rating bounds)', () => {
    expect(listMyReviewsTool.argsSchema.safeParse({ minRating: 0 }).success).toBe(false);
    expect(listMyReviewsTool.argsSchema.safeParse({ maxRating: 6 }).success).toBe(false);
    expect(listMyReviewsTool.argsSchema.safeParse({ minRating: 1, maxRating: 5 }).success).toBe(
      true,
    );
  });
});
