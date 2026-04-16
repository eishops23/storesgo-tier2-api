// Agent Suite — draft_blog_post_outline tool tests (Phase 9 Prompt 3)

import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../../services/blog.service.js', () => ({
  loadBlogPostContextForDrafting: vi.fn(),
}));

import { draftBlogPostOutlineTool } from '../draft-blog-post-outline.js';
import { loadBlogPostContextForDrafting } from '../../../../services/blog.service.js';
import type { ToolContext } from '../../types.js';

const mockLoad = vi.mocked(loadBlogPostContextForDrafting);

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

describe('draft_blog_post_outline tool', () => {
  it('has 10000ms timeout (longer for multi-query composition)', () => {
    expect(draftBlogPostOutlineTool.timeoutMs).toBe(10000);
  });

  it('returns null when ctx.adminId is undefined', async () => {
    const result = await draftBlogPostOutlineTool.execute(
      { topic: 'X' },
      makeCtx({ adminId: undefined }),
    );
    expect(result).toBeNull();
    expect(mockLoad).not.toHaveBeenCalled();
  });

  it('calls service with adminId and full opts', async () => {
    mockLoad.mockResolvedValue({} as any);
    await draftBlogPostOutlineTool.execute(
      { topic: 'Caribbean breakfast', vertical: 'caribbean', referencePostIds: [1, 2] },
      makeCtx(),
    );
    expect(mockLoad).toHaveBeenCalledWith(7, {
      topic: 'Caribbean breakfast',
      vertical: 'caribbean',
      referencePostIds: [1, 2],
    });
  });

  it('returns expected drafting context shape', async () => {
    const ctx = {
      topic: 'X',
      vertical: null,
      similarExistingPosts: [],
      relevantTags: ['food'],
      recommendedWordCount: 800,
      recommendedHeadingStructure: ['H1: Title', 'H2: Intro'],
      forbiddenOverlap: [],
    };
    mockLoad.mockResolvedValue(ctx as any);
    const result = await draftBlogPostOutlineTool.execute({ topic: 'X' }, makeCtx());
    expect(result).toEqual(ctx);
  });

  it('rejects topic shorter than 3 chars via Zod', () => {
    expect(draftBlogPostOutlineTool.argsSchema.safeParse({ topic: 'ab' }).success).toBe(false);
    expect(draftBlogPostOutlineTool.argsSchema.safeParse({ topic: 'abc' }).success).toBe(true);
  });
});
