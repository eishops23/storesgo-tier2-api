// Agent Suite — find_reviews_needing_response tool tests (Phase 11 Prompt 3)

import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../../services/reviews.service.js', () => ({
  findReviewsNeedingResponse: vi.fn(),
}));

import { findReviewsNeedingResponseTool } from '../find-reviews-needing-response.js';
import { findReviewsNeedingResponse } from '../../../../services/reviews.service.js';
import type { ToolContext } from '../../types.js';

const mockFind = vi.mocked(findReviewsNeedingResponse);

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

describe('find_reviews_needing_response tool', () => {
  it('returns null when ctx.sellerId is undefined', async () => {
    const result = await findReviewsNeedingResponseTool.execute({}, makeCtx({ sellerId: undefined }));
    expect(result).toBeNull();
    expect(mockFind).not.toHaveBeenCalled();
  });

  it('calls service with empty opts by default (service applies defaults)', async () => {
    mockFind.mockResolvedValue([]);
    await findReviewsNeedingResponseTool.execute({}, makeCtx());
    expect(mockFind).toHaveBeenCalledWith(42, {});
  });

  it('forwards custom args', async () => {
    mockFind.mockResolvedValue([]);
    await findReviewsNeedingResponseTool.execute(
      { ratingThreshold: 2, sinceDays: 7, limit: 5 },
      makeCtx(),
    );
    expect(mockFind).toHaveBeenCalledWith(42, {
      ratingThreshold: 2,
      sinceDays: 7,
      limit: 5,
    });
  });

  it('returns service result', async () => {
    const sample = [{ id: 1, sellerId: 42, rating: 1 }];
    mockFind.mockResolvedValue(sample as any);
    const result = await findReviewsNeedingResponseTool.execute({}, makeCtx());
    expect(result).toEqual(sample);
  });

  it('rejects ratingThreshold out of range via Zod', () => {
    expect(findReviewsNeedingResponseTool.argsSchema.safeParse({ ratingThreshold: 0 }).success).toBe(
      false,
    );
    expect(findReviewsNeedingResponseTool.argsSchema.safeParse({ ratingThreshold: 6 }).success).toBe(
      false,
    );
  });
});
