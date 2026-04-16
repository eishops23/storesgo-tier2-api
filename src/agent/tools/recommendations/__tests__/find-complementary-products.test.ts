// Agent Suite — find_complementary_products tool tests (Phase 18A Prompt 3)

import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../../services/recommendations.service.js', () => ({
  findComplementaryProductsForAgent: vi.fn(),
}));

import { findComplementaryProductsTool } from '../find-complementary-products.js';
import { findComplementaryProductsForAgent } from '../../../../services/recommendations.service.js';
import type { ToolContext } from '../../types.js';

const mockFind = vi.mocked(findComplementaryProductsForAgent);

function makeCtx(overrides: Partial<ToolContext> = {}): ToolContext {
  return {
    sessionId: 'sess-1',
    featureKey: 'recommendations',
    conversationId: 'conv-1',
    messageId: 'msg-1',
    ...overrides,
  };
}

describe('find_complementary_products tool', () => {
  it('works for guests (no ownership check)', async () => {
    mockFind.mockResolvedValue({ products: [], matchedRecipes: [] });
    await findComplementaryProductsTool.execute(
      { productIds: [1] },
      makeCtx({ userId: undefined }),
    );
    expect(mockFind).toHaveBeenCalled();
  });

  it('forwards productIds and limit', async () => {
    mockFind.mockResolvedValue({ products: [], matchedRecipes: [] });
    await findComplementaryProductsTool.execute(
      { productIds: [1, 2, 3], limit: 5 },
      makeCtx(),
    );
    expect(mockFind).toHaveBeenCalledWith([1, 2, 3], { limit: 5 });
  });

  it('returns both products and matchedRecipes', async () => {
    const result = {
      products: [{ id: 10, name: 'Scotch Bonnet', score: 0.85 }],
      matchedRecipes: [{ recipeId: 'griot', title: 'Haitian Griot', cuisine: 'haitian' }],
    };
    mockFind.mockResolvedValue(result as any);
    const actual = await findComplementaryProductsTool.execute(
      { productIds: [1] },
      makeCtx(),
    );
    expect(actual).toEqual(result);
  });

  it('rejects empty productIds array via Zod', () => {
    expect(findComplementaryProductsTool.argsSchema.safeParse({ productIds: [] }).success).toBe(false);
  });

  it('rejects productIds > 10 via Zod', () => {
    const many = Array.from({ length: 11 }, (_, i) => i + 1);
    expect(findComplementaryProductsTool.argsSchema.safeParse({ productIds: many }).success).toBe(false);
  });
});
