// Agent Suite — get_blog_stats tool tests (Phase 9 Prompt 3)

import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../../services/blog.service.js', () => ({
  getBlogStatsForOperator: vi.fn(),
}));

import { getBlogStatsTool } from '../get-blog-stats.js';
import { getBlogStatsForOperator } from '../../../../services/blog.service.js';
import type { ToolContext } from '../../types.js';

const mockStats = vi.mocked(getBlogStatsForOperator);

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

describe('get_blog_stats tool', () => {
  it('returns null when ctx.adminId is undefined', async () => {
    const result = await getBlogStatsTool.execute({}, makeCtx({ adminId: undefined }));
    expect(result).toBeNull();
    expect(mockStats).not.toHaveBeenCalled();
  });

  it('calls service with adminId and opts', async () => {
    mockStats.mockResolvedValue({} as any);
    await getBlogStatsTool.execute({ sinceDays: 30 }, makeCtx());
    expect(mockStats).toHaveBeenCalledWith(7, { sinceDays: 30 });
  });

  it('returns service result', async () => {
    const stats = { total: 632, publishedLast7Days: 7, publishedLast30Days: 30, avgWordCount: 800, avgQualityScore: 85, topTags: [], orphanCount: 12, postsWithoutEmbedding: 0 };
    mockStats.mockResolvedValue(stats as any);
    const result = await getBlogStatsTool.execute({}, makeCtx());
    expect(result).toEqual(stats);
  });

  it('propagates service errors', async () => {
    mockStats.mockRejectedValue(new Error('DB down'));
    await expect(getBlogStatsTool.execute({}, makeCtx())).rejects.toThrow('DB down');
  });

  it('rejects sinceDays > 365 via Zod', () => {
    expect(getBlogStatsTool.argsSchema.safeParse({ sinceDays: 999 }).success).toBe(false);
  });
});
