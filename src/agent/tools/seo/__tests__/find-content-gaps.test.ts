// Agent Suite — find_content_gaps tool tests (Phase 9 Prompt 3)

import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../../services/blog.service.js', () => ({
  findContentGapsForVertical: vi.fn(),
}));

import { findContentGapsTool } from '../find-content-gaps.js';
import { findContentGapsForVertical } from '../../../../services/blog.service.js';
import type { ToolContext } from '../../types.js';

const mockFind = vi.mocked(findContentGapsForVertical);

function makeCtx(overrides: Partial<ToolContext> = {}): ToolContext {
  return {
    sessionId: 'sess-1',
    featureKey: 'seo',
    conversationId: 'conv-1',
    messageId: 'msg-1',
    adminId: 7,
    ...overrides,
  };
}

describe('find_content_gaps tool', () => {
  it('returns null when ctx.adminId is undefined', async () => {
    const result = await findContentGapsTool.execute({}, makeCtx({ adminId: undefined }));
    expect(result).toBeNull();
    expect(mockFind).not.toHaveBeenCalled();
  });

  it('calls service with empty opts by default', async () => {
    mockFind.mockResolvedValue([]);
    await findContentGapsTool.execute({}, makeCtx());
    expect(mockFind).toHaveBeenCalledWith(7, {});
  });

  it('forwards vertical and limit', async () => {
    mockFind.mockResolvedValue([]);
    await findContentGapsTool.execute({ vertical: 'haitian', limit: 5 }, makeCtx());
    expect(mockFind).toHaveBeenCalledWith(7, { vertical: 'haitian', limit: 5 });
  });

  it('returns service result', async () => {
    const gaps = [{ vertical: 'korean', suggestedTopic: 'X', reason: 'Y', similarExistingPosts: [1] }];
    mockFind.mockResolvedValue(gaps as any);
    const result = await findContentGapsTool.execute({}, makeCtx());
    expect(result).toEqual(gaps);
  });

  it('propagates service errors', async () => {
    mockFind.mockRejectedValue(new Error('boom'));
    await expect(findContentGapsTool.execute({}, makeCtx())).rejects.toThrow('boom');
  });
});
