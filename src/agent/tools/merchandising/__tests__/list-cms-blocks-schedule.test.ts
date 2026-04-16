// Agent Suite — list_cms_blocks_schedule tool tests (Phase 12 Prompt 2)

import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../../services/homepage.service.js', () => ({
  getMerchandisingSnapshot: vi.fn(),
}));

import { listCmsBlocksScheduleTool } from '../list-cms-blocks-schedule.js';
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

const activeBlock = {
  id: 1, key: 'hero-spring', type: 'hero', order: 0,
  isActive: true, startDate: null, endDate: null,
};
const inactiveBlock = {
  id: 2, key: 'winter-banner', type: 'banner', order: 1,
  isActive: false, startDate: null, endDate: null,
};

describe('list_cms_blocks_schedule tool', () => {
  it('returns null when ctx.adminId is undefined', async () => {
    const result = await listCmsBlocksScheduleTool.execute({}, makeCtx({ adminId: undefined }));
    expect(result).toBeNull();
    expect(mockSnapshot).not.toHaveBeenCalled();
  });

  it('returns only active blocks by default', async () => {
    mockSnapshot.mockResolvedValue({ cmsBlocks: [activeBlock, inactiveBlock] } as any);
    const result = await listCmsBlocksScheduleTool.execute({}, makeCtx());
    expect(result).toEqual([activeBlock]);
  });

  it('returns all blocks when includeInactive is true', async () => {
    mockSnapshot.mockResolvedValue({ cmsBlocks: [activeBlock, inactiveBlock] } as any);
    const result = await listCmsBlocksScheduleTool.execute({ includeInactive: true }, makeCtx());
    expect(result).toEqual([activeBlock, inactiveBlock]);
  });

  it('returns empty array when there are no blocks', async () => {
    mockSnapshot.mockResolvedValue({ cmsBlocks: [] } as any);
    const result = await listCmsBlocksScheduleTool.execute({ includeInactive: true }, makeCtx());
    expect(result).toEqual([]);
  });

  it('accepts includeInactive as optional boolean via Zod', () => {
    expect(listCmsBlocksScheduleTool.argsSchema.safeParse({}).success).toBe(true);
    expect(listCmsBlocksScheduleTool.argsSchema.safeParse({ includeInactive: true }).success).toBe(true);
    expect(listCmsBlocksScheduleTool.argsSchema.safeParse({ includeInactive: false }).success).toBe(true);
    expect(listCmsBlocksScheduleTool.argsSchema.safeParse({ includeInactive: 'yes' }).success).toBe(false);
  });
});
