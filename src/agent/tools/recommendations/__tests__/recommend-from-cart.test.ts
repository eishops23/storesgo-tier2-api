// Agent Suite — recommend_from_cart tool tests (Phase 18A Prompt 3)

import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../../services/recommendations.service.js', () => ({
  recommendFromCartForAgent: vi.fn(),
}));

import { recommendFromCartTool } from '../recommend-from-cart.js';
import { recommendFromCartForAgent } from '../../../../services/recommendations.service.js';
import type { ToolContext } from '../../types.js';

const mockCart = vi.mocked(recommendFromCartForAgent);

function makeCtx(overrides: Partial<ToolContext> = {}): ToolContext {
  return {
    sessionId: 'sess-1',
    featureKey: 'recommendations',
    conversationId: 'conv-1',
    messageId: 'msg-1',
    ...overrides,
  };
}

describe('recommend_from_cart tool', () => {
  it('works for guests', async () => {
    mockCart.mockResolvedValue({ products: [], strategy: 'taxonomy' });
    await recommendFromCartTool.execute(
      { productIds: [1] },
      makeCtx({ userId: undefined }),
    );
    expect(mockCart).toHaveBeenCalled();
  });

  it('forwards productIds and limit', async () => {
    mockCart.mockResolvedValue({ products: [], strategy: 'recipe' });
    await recommendFromCartTool.execute(
      { productIds: [1, 2, 3], limit: 8 },
      makeCtx(),
    );
    expect(mockCart).toHaveBeenCalledWith([1, 2, 3], { limit: 8 });
  });

  it('returns both products and strategy', async () => {
    const result = {
      products: [{ id: 10, name: 'Epis', score: 0.85 }],
      strategy: 'recipe' as const,
    };
    mockCart.mockResolvedValue(result as any);
    const actual = await recommendFromCartTool.execute(
      { productIds: [1] },
      makeCtx(),
    );
    expect(actual).toEqual(result);
  });

  it('rejects productIds > 20 via Zod', () => {
    const many = Array.from({ length: 21 }, (_, i) => i + 1);
    expect(recommendFromCartTool.argsSchema.safeParse({ productIds: many }).success).toBe(false);
  });
});
