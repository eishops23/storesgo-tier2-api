// Agent Suite — get_product_details tool tests (Phase 18A Prompt 3)

import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../../services/recommendations.service.js', () => ({
  getProductDetailsForAgent: vi.fn(),
}));

import { getProductDetailsTool } from '../get-product-details.js';
import { getProductDetailsForAgent } from '../../../../services/recommendations.service.js';
import type { ToolContext } from '../../types.js';

const mockGet = vi.mocked(getProductDetailsForAgent);

function makeCtx(overrides: Partial<ToolContext> = {}): ToolContext {
  return {
    sessionId: 'sess-1',
    featureKey: 'recommendations',
    conversationId: 'conv-1',
    messageId: 'msg-1',
    ...overrides,
  };
}

describe('get_product_details tool', () => {
  it('has correct metadata', () => {
    expect(getProductDetailsTool.name).toBe('get_product_details');
    expect(getProductDetailsTool.requiredAutonomy).toBe('L0');
    expect(getProductDetailsTool.reversible).toBe(true);
  });

  it('works for guests (no ownership check)', async () => {
    mockGet.mockResolvedValue({ id: 42 } as any);
    const result = await getProductDetailsTool.execute(
      { productId: 42 },
      makeCtx({ userId: undefined }),
    );
    expect(result).toEqual({ id: 42 });
  });

  it('calls service with productId', async () => {
    mockGet.mockResolvedValue(null);
    await getProductDetailsTool.execute({ productId: 99 }, makeCtx());
    expect(mockGet).toHaveBeenCalledWith(99);
  });

  it('returns service result', async () => {
    const product = { id: 1, name: 'Plantains', score: 1.0 };
    mockGet.mockResolvedValue(product as any);
    const result = await getProductDetailsTool.execute({ productId: 1 }, makeCtx());
    expect(result).toEqual(product);
  });

  it('propagates service errors', async () => {
    mockGet.mockRejectedValue(new Error('DB down'));
    await expect(
      getProductDetailsTool.execute({ productId: 1 }, makeCtx()),
    ).rejects.toThrow('DB down');
  });
});
