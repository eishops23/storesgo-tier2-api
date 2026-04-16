// Agent Suite — find_similar_blog_posts tool tests (Phase 9 Prompt 3)

import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../../services/blog.service.js', () => ({
  findSimilarBlogPosts: vi.fn(),
}));

import { findSimilarBlogPostsTool } from '../find-similar-blog-posts.js';
import { findSimilarBlogPosts } from '../../../../services/blog.service.js';
import type { ToolContext } from '../../types.js';

const mockFind = vi.mocked(findSimilarBlogPosts);

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

describe('find_similar_blog_posts tool', () => {
  it('returns null when ctx.adminId is undefined', async () => {
    const result = await findSimilarBlogPostsTool.execute({ postId: 1 }, makeCtx({ adminId: undefined }));
    expect(result).toBeNull();
    expect(mockFind).not.toHaveBeenCalled();
  });

  it('calls service with adminId, postId, and opts', async () => {
    mockFind.mockResolvedValue([]);
    await findSimilarBlogPostsTool.execute(
      { postId: 42, limit: 3, threshold: 0.8 },
      makeCtx(),
    );
    expect(mockFind).toHaveBeenCalledWith(7, 42, { limit: 3, threshold: 0.8 });
  });

  it('returns null when service returns null (post not found)', async () => {
    mockFind.mockResolvedValue(null);
    const result = await findSimilarBlogPostsTool.execute({ postId: 999 }, makeCtx());
    expect(result).toBeNull();
  });

  it('returns service result on hit', async () => {
    const sims = [{ postId: 2, slug: 'b', title: 'B', similarity: 0.95 }];
    mockFind.mockResolvedValue(sims as any);
    const result = await findSimilarBlogPostsTool.execute({ postId: 1 }, makeCtx());
    expect(result).toEqual(sims);
  });

  it('rejects threshold > 1 via Zod', () => {
    expect(findSimilarBlogPostsTool.argsSchema.safeParse({ postId: 1, threshold: 1.5 }).success).toBe(false);
  });
});
