// Agent Suite — get_review_by_id tool tests (Phase 11 Prompt 3)

import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../../services/reviews.service.js', () => ({
  getReviewByIdForSeller: vi.fn(),
}));

import { getReviewByIdTool } from '../get-review-by-id.js';
import { getReviewByIdForSeller } from '../../../../services/reviews.service.js';
import type { ToolContext } from '../../types.js';

const mockGet = vi.mocked(getReviewByIdForSeller);

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

describe('get_review_by_id tool', () => {
  it('returns null when ctx.sellerId is undefined', async () => {
    const result = await getReviewByIdTool.execute({ reviewId: 7 }, makeCtx({ sellerId: undefined }));
    expect(result).toBeNull();
    expect(mockGet).not.toHaveBeenCalled();
  });

  it('calls service with sellerId and reviewId', async () => {
    mockGet.mockResolvedValue(null);
    await getReviewByIdTool.execute({ reviewId: 7 }, makeCtx());
    expect(mockGet).toHaveBeenCalledWith(42, 7);
  });

  it('returns null when service returns null (ownership mismatch)', async () => {
    mockGet.mockResolvedValue(null);
    const result = await getReviewByIdTool.execute({ reviewId: 7 }, makeCtx());
    expect(result).toBeNull();
  });

  it('returns service result on hit', async () => {
    const review = { id: 7, sellerId: 42, rating: 5, comment: 'great' };
    mockGet.mockResolvedValue(review as any);
    const result = await getReviewByIdTool.execute({ reviewId: 7 }, makeCtx());
    expect(result).toEqual(review);
  });

  it('rejects negative or zero reviewId via Zod', () => {
    expect(getReviewByIdTool.argsSchema.safeParse({ reviewId: 0 }).success).toBe(false);
    expect(getReviewByIdTool.argsSchema.safeParse({ reviewId: -1 }).success).toBe(false);
    expect(getReviewByIdTool.argsSchema.safeParse({ reviewId: 1 }).success).toBe(true);
  });
});
