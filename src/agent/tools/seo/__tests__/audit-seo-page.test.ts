// Agent Suite — audit_seo_page tool tests (Phase 9 Prompt 3)

import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../../services/seo.service.js', () => ({
  auditSeoPageForOperator: vi.fn(),
}));

import { auditSeoPageTool } from '../audit-seo-page.js';
import { auditSeoPageForOperator } from '../../../../services/seo.service.js';
import type { ToolContext } from '../../types.js';

const mockAudit = vi.mocked(auditSeoPageForOperator);

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

describe('audit_seo_page tool', () => {
  it('returns null when ctx.adminId is undefined', async () => {
    const result = await auditSeoPageTool.execute({ pageId: 1 }, makeCtx({ adminId: undefined }));
    expect(result).toBeNull();
    expect(mockAudit).not.toHaveBeenCalled();
  });

  it('calls service with adminId and pageId', async () => {
    mockAudit.mockResolvedValue(null);
    await auditSeoPageTool.execute({ pageId: 42 }, makeCtx());
    expect(mockAudit).toHaveBeenCalledWith(7, 42);
  });

  it('returns service result on hit', async () => {
    const audit = { pageId: 42, slug: 'x', title: 'X', type: 'guide', published: true, publishedAt: new Date(), metrics: {}, issues: [], score: 100 };
    mockAudit.mockResolvedValue(audit as any);
    const result = await auditSeoPageTool.execute({ pageId: 42 }, makeCtx());
    expect(result).toEqual(audit);
  });

  it('propagates service errors', async () => {
    mockAudit.mockRejectedValue(new Error('DB down'));
    await expect(auditSeoPageTool.execute({ pageId: 1 }, makeCtx())).rejects.toThrow('DB down');
  });

  it('rejects negative pageId via Zod', () => {
    expect(auditSeoPageTool.argsSchema.safeParse({ pageId: 0 }).success).toBe(false);
    expect(auditSeoPageTool.argsSchema.safeParse({ pageId: 1 }).success).toBe(true);
  });
});
