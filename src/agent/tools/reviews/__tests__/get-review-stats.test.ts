// Agent Suite — get_review_stats tool tests (Phase 11 Prompt 3)

import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../../services/reviews.service.js', () => ({
  getReviewStatsForSeller: vi.fn(),
}));

import { getReviewStatsTool } from '../get-review-stats.js';
import { getReviewStatsForSeller } from '../../../../services/reviews.service.js';
import type { ToolContext } from '../../types.js';

const mockStats = vi.mocked(getReviewStatsForSeller);

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

describe('get_review_stats tool', () => {
  it('returns null when ctx.sellerId is undefined', async () => {
    const result = await getReviewStatsTool.execute({}, makeCtx({ sellerId: undefined }));
    expect(result).toBeNull();
    expect(mockStats).not.toHaveBeenCalled();
  });

  it('calls service with sellerId and undefined sinceDays by default', async () => {
    mockStats.mockResolvedValue({} as any);
    await getReviewStatsTool.execute({}, makeCtx());
    expect(mockStats).toHaveBeenCalledWith(42, undefined);
  });

  it('passes sinceDays through', async () => {
    mockStats.mockResolvedValue({} as any);
    await getReviewStatsTool.execute({ sinceDays: 30 }, makeCtx());
    expect(mockStats).toHaveBeenCalledWith(42, 30);
  });

  it('returns service result', async () => {
    const sample = {
      totalReviews: 10,
      avgRating: 4.2,
      ratingDistribution: { 1: 1, 2: 0, 3: 1, 4: 2, 5: 6 },
      needingResponseCount: 2,
    };
    mockStats.mockResolvedValue(sample as any);
    const result = await getReviewStatsTool.execute({}, makeCtx());
    expect(result).toEqual(sample);
  });

  it('rejects sinceDays > 365 via Zod', () => {
    expect(getReviewStatsTool.argsSchema.safeParse({ sinceDays: 366 }).success).toBe(false);
    expect(getReviewStatsTool.argsSchema.safeParse({ sinceDays: 365 }).success).toBe(true);
  });
});
