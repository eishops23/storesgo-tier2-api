// Agent Suite — get_merchandising_snapshot tool tests (Phase 12 Prompt 2)

import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../../services/homepage.service.js', () => ({
  getMerchandisingSnapshot: vi.fn(),
}));

import { getMerchandisingSnapshotTool } from '../get-merchandising-snapshot.js';
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

describe('get_merchandising_snapshot tool', () => {
  it('returns null when ctx.adminId is undefined', async () => {
    const result = await getMerchandisingSnapshotTool.execute({}, makeCtx({ adminId: undefined }));
    expect(result).toBeNull();
    expect(mockSnapshot).not.toHaveBeenCalled();
  });

  it('calls service with undefined windowDays by default', async () => {
    mockSnapshot.mockResolvedValue({} as any);
    await getMerchandisingSnapshotTool.execute({}, makeCtx());
    expect(mockSnapshot).toHaveBeenCalledWith({ windowDays: undefined });
  });

  it('passes windowDays through', async () => {
    mockSnapshot.mockResolvedValue({} as any);
    await getMerchandisingSnapshotTool.execute({ windowDays: 60 }, makeCtx());
    expect(mockSnapshot).toHaveBeenCalledWith({ windowDays: 60 });
  });

  it('returns service result', async () => {
    const sample = {
      windowDays: 30,
      generatedAt: new Date(),
      featuredProducts: [],
      featuredCategories: [],
      cmsBlocks: [],
      homepage: {
        heroTitle: 'Welcome',
        heroSubtitle: 'Sub',
        showNewArrivals: true,
        showDeals: true,
        showPopular: true,
        updatedAt: new Date(),
      },
      coverageGaps: { categoriesWithoutFeatured: [], featuredProductsWithZeroOrders: [] },
    };
    mockSnapshot.mockResolvedValue(sample as any);
    const result = await getMerchandisingSnapshotTool.execute({}, makeCtx());
    expect(result).toEqual(sample);
  });

  it('rejects windowDays > 365 via Zod', () => {
    expect(getMerchandisingSnapshotTool.argsSchema.safeParse({ windowDays: 366 }).success).toBe(false);
    expect(getMerchandisingSnapshotTool.argsSchema.safeParse({ windowDays: 365 }).success).toBe(true);
    expect(getMerchandisingSnapshotTool.argsSchema.safeParse({ windowDays: 0 }).success).toBe(false);
    expect(getMerchandisingSnapshotTool.argsSchema.safeParse({ windowDays: 1 }).success).toBe(true);
  });
});
