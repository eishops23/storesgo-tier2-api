// Agent Suite — find_recipes_for_products tool tests (Phase 18A Prompt 3)

import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../../services/recommendations.service.js', () => ({
  findRecipesForProductsForAgent: vi.fn(),
}));

import { findRecipesForProductsTool } from '../find-recipes-for-products.js';
import { findRecipesForProductsForAgent } from '../../../../services/recommendations.service.js';
import type { ToolContext } from '../../types.js';

const mockFind = vi.mocked(findRecipesForProductsForAgent);

function makeCtx(overrides: Partial<ToolContext> = {}): ToolContext {
  return {
    sessionId: 'sess-1',
    featureKey: 'recommendations',
    conversationId: 'conv-1',
    messageId: 'msg-1',
    ...overrides,
  };
}

describe('find_recipes_for_products tool', () => {
  it('works for guests', async () => {
    mockFind.mockResolvedValue([]);
    await findRecipesForProductsTool.execute(
      { productIds: [1] },
      makeCtx({ userId: undefined }),
    );
    expect(mockFind).toHaveBeenCalled();
  });

  it('forwards productIds to the service', async () => {
    mockFind.mockResolvedValue([]);
    await findRecipesForProductsTool.execute({ productIds: [1, 2, 3] }, makeCtx());
    expect(mockFind).toHaveBeenCalledWith([1, 2, 3]);
  });

  it('returns recipe metadata (not products)', async () => {
    const recipes = [
      { recipeId: 'griot', title: 'Haitian Griot', cuisine: 'haitian', matchedIngredients: ['pork shoulder'], missingIngredients: ['epis'], totalIngredients: 2 },
    ];
    mockFind.mockResolvedValue(recipes as any);
    const result = await findRecipesForProductsTool.execute(
      { productIds: [1] },
      makeCtx(),
    );
    expect(result).toEqual(recipes);
  });

  it('rejects empty productIds via Zod', () => {
    expect(findRecipesForProductsTool.argsSchema.safeParse({ productIds: [] }).success).toBe(false);
  });

  it('propagates service errors', async () => {
    mockFind.mockRejectedValue(new Error('boom'));
    await expect(
      findRecipesForProductsTool.execute({ productIds: [1] }, makeCtx()),
    ).rejects.toThrow('boom');
  });
});
