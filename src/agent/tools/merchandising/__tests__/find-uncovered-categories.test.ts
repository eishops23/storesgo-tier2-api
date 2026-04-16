// Agent Suite — find_uncovered_categories tool tests (Phase 12 Prompt 2)

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../../services/homepage.service.js', () => ({
  getMerchandisingSnapshot: vi.fn(),
}));

import { findUncoveredCategoriesTool } from '../find-uncovered-categories.js';
import { getMerchandisingSnapshot } from '../../../../services/homepage.service.js';
import type { ToolContext } from '../../types.js';

const mockSnapshot = vi.mocked(getMerchandisingSnapshot);

function makeCtx(overrides: Partial<ToolContext> = {}): ToolContext {
  return {
    sessionId: 'sess-1',
    featureKey: 'merchandising',
    conversationId: 'conv-1',
    messageId: 'msg-1',
    userId: 'user-123',
    adminId: 7,
    ...overrides,
  };
}

describe('find_uncovered_categories tool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null when ctx.adminId is undefined', async () => {
    const result = await findUncoveredCategoriesTool.execute({}, makeCtx({ adminId: undefined }));
    expect(result).toBeNull();
    expect(mockSnapshot).not.toHaveBeenCalled();
  });

  it('returns the categoriesWithoutFeatured array from the snapshot', async () => {
    mockSnapshot.mockResolvedValue({
      coverageGaps: { categoriesWithoutFeatured: ['Rice', 'Spices', 'Beverages'], featuredProductsWithZeroOrders: [] },
    } as any);
    const result = await findUncoveredCategoriesTool.execute({}, makeCtx());
    expect(result).toEqual(['Rice', 'Spices', 'Beverages']);
  });

  it('returns empty array when all categories are covered', async () => {
    mockSnapshot.mockResolvedValue({
      coverageGaps: { categoriesWithoutFeatured: [], featuredProductsWithZeroOrders: [] },
    } as any);
    const result = await findUncoveredCategoriesTool.execute({}, makeCtx());
    expect(result).toEqual([]);
  });

  it('calls the snapshot service exactly once', async () => {
    mockSnapshot.mockResolvedValue({
      coverageGaps: { categoriesWithoutFeatured: [], featuredProductsWithZeroOrders: [] },
    } as any);
    await findUncoveredCategoriesTool.execute({}, makeCtx());
    expect(mockSnapshot).toHaveBeenCalledTimes(1);
    expect(mockSnapshot).toHaveBeenCalledWith();
  });

  it('accepts empty args object via Zod', () => {
    expect(findUncoveredCategoriesTool.argsSchema.safeParse({}).success).toBe(true);
  });
});
