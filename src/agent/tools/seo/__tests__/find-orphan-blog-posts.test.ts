// Agent Suite — find_orphan_blog_posts tool tests (Phase 9 Prompt 3)

import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../../services/blog.service.js', () => ({
  findOrphanBlogPosts: vi.fn(),
}));

import { findOrphanBlogPostsTool } from '../find-orphan-blog-posts.js';
import { findOrphanBlogPosts } from '../../../../services/blog.service.js';
import type { ToolContext } from '../../types.js';

const mockFind = vi.mocked(findOrphanBlogPosts);

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

describe('find_orphan_blog_posts tool', () => {
  it('returns null when ctx.adminId is undefined', async () => {
    const result = await findOrphanBlogPostsTool.execute({}, makeCtx({ adminId: undefined }));
    expect(result).toBeNull();
    expect(mockFind).not.toHaveBeenCalled();
  });

  it('calls service with adminId and opts', async () => {
    mockFind.mockResolvedValue([]);
    await findOrphanBlogPostsTool.execute({ limit: 10 }, makeCtx());
    expect(mockFind).toHaveBeenCalledWith(7, { limit: 10 });
  });

  it('returns service result', async () => {
    const orphans = [{ postId: 1, slug: 'a', title: 'A', publishedAt: new Date() }];
    mockFind.mockResolvedValue(orphans as any);
    const result = await findOrphanBlogPostsTool.execute({}, makeCtx());
    expect(result).toEqual(orphans);
  });

  it('propagates service errors', async () => {
    mockFind.mockRejectedValue(new Error('boom'));
    await expect(findOrphanBlogPostsTool.execute({}, makeCtx())).rejects.toThrow('boom');
  });
});
