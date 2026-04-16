// Agent Suite — audit_seo_page tool (Phase 9 Prompt 3)

import { z } from 'zod';
import type { AgentTool } from '../types.js';

const argsSchema = z.object({
  pageId: z.number().int().positive().describe('The numeric SEO page ID to audit'),
});

type Args = z.infer<typeof argsSchema>;

export const auditSeoPageTool: AgentTool<Args, unknown> = {
  name: 'audit_seo_page',
  description:
    "Audit the structural SEO quality of an SEO page (landing/guide/blog row in seo_pages) by ID. Same checks as audit_blog_post plus metaTitle. Note: prod has 0/633 SeoPage embeddings populated, so the missing-embedding issue is flagged at warning severity rather than critical.",
  argsSchema,
  requiredAutonomy: 'L0',
  reversible: true,
  tags: ['seo', 'page', 'audit', 'read'],
  timeoutMs: 5000,
  async execute(args, ctx) {
    if (ctx.adminId === undefined) return null;

    const { auditSeoPageForOperator } = await import('../../../services/seo.service.js');
    return auditSeoPageForOperator(ctx.adminId, args.pageId);
  },
};
