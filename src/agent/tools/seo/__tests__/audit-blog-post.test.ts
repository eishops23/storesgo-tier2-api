// Agent Suite — audit_blog_post tool tests (Phase 9 Prompt 3)

import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../../services/blog.service.js', () => ({
  auditBlogPostForOperator: vi.fn(),
}));

import { auditBlogPostTool } from '../audit-blog-post.js';
import { auditBlogPostForOperator } from '../../../../services/blog.service.js';
import type { ToolContext } from '../../types.js';

const mockAudit = vi.mocked(auditBlogPostForOperator);

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

describe('audit_blog_post tool', () => {
  it('has correct metadata', () => {
    expect(auditBlogPostTool.name).toBe('audit_blog_post');
    expect(auditBlogPostTool.requiredAutonomy).toBe('L0');
    expect(auditBlogPostTool.reversible).toBe(true);
    expect(auditBlogPostTool.tags).toContain('seo');
  });

  it('returns null when ctx.adminId is undefined', async () => {
    const result = await auditBlogPostTool.execute({ postId: 1 }, makeCtx({ adminId: undefined }));
    expect(result).toBeNull();
    expect(mockAudit).not.toHaveBeenCalled();
  });

  it('calls service with adminId and postId', async () => {
    mockAudit.mockResolvedValue(null);
    await auditBlogPostTool.execute({ postId: 42 }, makeCtx());
    expect(mockAudit).toHaveBeenCalledWith(7, 42);
  });

  it('returns service result on hit', async () => {
    const audit = { postId: 42, slug: 'x', title: 'X', published: true, publishedAt: new Date(), metrics: {}, issues: [], score: 100 };
    mockAudit.mockResolvedValue(audit as any);
    const result = await auditBlogPostTool.execute({ postId: 42 }, makeCtx());
    expect(result).toEqual(audit);
  });

  it('propagates service errors', async () => {
    mockAudit.mockRejectedValue(new Error('DB down'));
    await expect(auditBlogPostTool.execute({ postId: 1 }, makeCtx())).rejects.toThrow('DB down');
  });
});
