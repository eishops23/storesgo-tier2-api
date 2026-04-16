// Agent Suite — suggest_review_response_tone tool tests (Phase 11 close-out)

import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../../services/reviews.service.js', () => ({
  loadReviewForDrafting: vi.fn(),
}));

import { suggestReviewResponseToneTool } from '../suggest-review-response-tone.js';
import { loadReviewForDrafting } from '../../../../services/reviews.service.js';
import type { ToolContext } from '../../types.js';

const mockLoad = vi.mocked(loadReviewForDrafting);

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

describe('suggest_review_response_tone tool', () => {
  it('returns null when ctx.sellerId is undefined', async () => {
    const result = await suggestReviewResponseToneTool.execute(
      { reviewId: 1 },
      makeCtx({ sellerId: undefined }),
    );
    expect(result).toBeNull();
    expect(mockLoad).not.toHaveBeenCalled();
  });

  it('returns null when service returns null (cross-seller or missing review)', async () => {
    mockLoad.mockResolvedValue(null);
    const result = await suggestReviewResponseToneTool.execute(
      { reviewId: 9999 },
      makeCtx(),
    );
    expect(result).toBeNull();
    expect(mockLoad).toHaveBeenCalledWith(42, 9999);
  });

  it('maps a 1-star review to very_negative sentiment and empathetic tone', async () => {
    mockLoad.mockResolvedValue({
      reviewId: 1,
      productName: 'Caribbean Hot Sauce',
      customerFirstName: 'Ana',
      rating: 1,
      originalComment: 'Shipping was slow and the bottle leaked',
      suggestedToneNotes: 'empathetic and solution-oriented',
    });

    const result = await suggestReviewResponseToneTool.execute({ reviewId: 1 }, makeCtx());

    expect(result).toEqual({
      reviewId: 1,
      rating: 1,
      sentiment: 'very_negative',
      suggestedTone: 'empathetic and solution-oriented',
      keyConcerns: 'Shipping was slow and the bottle leaked',
    });
  });

  it('maps a 5-star review to positive sentiment and warm tone', async () => {
    mockLoad.mockResolvedValue({
      reviewId: 2,
      productName: 'Yams',
      customerFirstName: 'Jon',
      rating: 5,
      originalComment: 'Perfect',
      suggestedToneNotes: 'warm and grateful',
    });

    const result = await suggestReviewResponseToneTool.execute({ reviewId: 2 }, makeCtx());

    expect(result).toEqual({
      reviewId: 2,
      rating: 5,
      sentiment: 'positive',
      suggestedTone: 'warm and grateful',
      keyConcerns: 'Perfect',
    });
  });

  it('does not leak draft text — returned shape has no draft/response fields', async () => {
    mockLoad.mockResolvedValue({
      reviewId: 3,
      productName: 'Plantains',
      customerFirstName: 'Ari',
      rating: 3,
      originalComment: 'Mixed feelings about packaging',
      suggestedToneNotes: 'constructive and curious',
    });

    const result = await suggestReviewResponseToneTool.execute({ reviewId: 3 }, makeCtx());

    expect(result).not.toBeNull();
    const keys = Object.keys(result!);
    expect(keys).toEqual(['reviewId', 'rating', 'sentiment', 'suggestedTone', 'keyConcerns']);
    expect(keys).not.toContain('draft');
    expect(keys).not.toContain('response');
    expect(keys).not.toContain('draftText');
    // Sentiment for a 3-star is mixed
    expect(result!.sentiment).toBe('mixed');
  });

  it('rejects non-integer / non-positive reviewId via Zod', () => {
    expect(suggestReviewResponseToneTool.argsSchema.safeParse({ reviewId: 0 }).success).toBe(false);
    expect(suggestReviewResponseToneTool.argsSchema.safeParse({ reviewId: -1 }).success).toBe(false);
    expect(suggestReviewResponseToneTool.argsSchema.safeParse({ reviewId: 1.5 }).success).toBe(false);
    expect(suggestReviewResponseToneTool.argsSchema.safeParse({ reviewId: 1 }).success).toBe(true);
  });
});
