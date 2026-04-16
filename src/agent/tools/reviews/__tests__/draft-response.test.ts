// Agent Suite — draft_response tool tests (Phase 11 Prompt 3)

import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../../services/reviews.service.js', () => ({
  loadReviewForDrafting: vi.fn(),
}));

import { draftResponseTool } from '../draft-response.js';
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

describe('draft_response tool', () => {
  it('has correct metadata and longer timeout', () => {
    expect(draftResponseTool.name).toBe('draft_response');
    expect(draftResponseTool.requiredAutonomy).toBe('L0');
    expect(draftResponseTool.timeoutMs).toBe(8000);
  });

  it('returns null when ctx.sellerId is undefined', async () => {
    const result = await draftResponseTool.execute({ reviewId: 7 }, makeCtx({ sellerId: undefined }));
    expect(result).toBeNull();
    expect(mockLoad).not.toHaveBeenCalled();
  });

  it('returns null when service returns null (ownership mismatch)', async () => {
    mockLoad.mockResolvedValue(null);
    const result = await draftResponseTool.execute({ reviewId: 7 }, makeCtx());
    expect(result).toBeNull();
  });

  it('returns expected drafting context shape on hit', async () => {
    const ctx = {
      reviewId: 7,
      productName: 'Caribbean Hot Sauce',
      customerFirstName: 'Alice',
      rating: 4,
      originalComment: 'Mostly great but slow shipping',
      suggestedToneNotes: 'appreciative',
    };
    mockLoad.mockResolvedValue(ctx);

    const result = await draftResponseTool.execute({ reviewId: 7 }, makeCtx());
    expect(result).toEqual(ctx);
  });

  it('calls service with sellerId and reviewId', async () => {
    mockLoad.mockResolvedValue(null);
    await draftResponseTool.execute({ reviewId: 99 }, makeCtx());
    expect(mockLoad).toHaveBeenCalledWith(42, 99);
  });
});
