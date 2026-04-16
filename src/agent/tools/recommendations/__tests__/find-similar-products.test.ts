// Agent Suite — find_similar_products tool tests (Phase 18A Prompt 3)

import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../../services/recommendations.service.js', () => ({
  findSimilarProductsForAgent: vi.fn(),
}));

import { findSimilarProductsTool } from '../find-similar-products.js';
import { findSimilarProductsForAgent } from '../../../../services/recommendations.service.js';
import type { ToolContext } from '../../types.js';

const mockFind = vi.mocked(findSimilarProductsForAgent);

function makeCtx(overrides: Partial<ToolContext> = {}): ToolContext {
  return {
    sessionId: 'sess-1',
    featureKey: 'recommendations',
    conversationId: 'conv-1',
    messageId: 'msg-1',
    ...overrides,
  };
}

describe('find_similar_products tool', () => {
  it('works for guests (no ownership check)', async () => {
    mockFind.mockResolvedValue([]);
    await findSimilarProductsTool.execute({ productId: 1 }, makeCtx({ userId: undefined }));
    expect(mockFind).toHaveBeenCalled();
  });

  it('forwards productId, limit, and excludeProductIds', async () => {
    mockFind.mockResolvedValue([]);
    await findSimilarProductsTool.execute(
      { productId: 42, limit: 5, excludeProductIds: [10, 20] },
      makeCtx(),
    );
    expect(mockFind).toHaveBeenCalledWith(42, { limit: 5, excludeProductIds: [10, 20] });
  });

  it('returns service result', async () => {
    const results = [{ id: 2, name: 'X', score: 0.8 }];
    mockFind.mockResolvedValue(results as any);
    const result = await findSimilarProductsTool.execute({ productId: 1 }, makeCtx());
    expect(result).toEqual(results);
  });

  it('rejects limit > 20 via Zod', () => {
    expect(findSimilarProductsTool.argsSchema.safeParse({ productId: 1, limit: 25 }).success).toBe(false);
  });

  it('propagates service errors', async () => {
    mockFind.mockRejectedValue(new Error('boom'));
    await expect(
      findSimilarProductsTool.execute({ productId: 1 }, makeCtx()),
    ).rejects.toThrow('boom');
  });
});
