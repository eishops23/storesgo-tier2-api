// Agent Suite — audit_blog_post tool (Phase 9 Prompt 3)

import { z } from 'zod';
import type { AgentTool } from '../types.js';

const argsSchema = z.object({
  postId: z.number().int().positive().describe('The numeric blog post ID to audit'),
});

type Args = z.infer<typeof argsSchema>;

export const auditBlogPostTool: AgentTool<Args, unknown> = {
  name: 'audit_blog_post',
  description:
    "Audit the structural SEO quality of a blog post by ID. Reports title length, meta description length, content word count, heading hierarchy, internal links, image references, and embedding presence. Returns issues with severity (critical/warning/info) and a 0-100 score. Read-only — never modifies the post.",
  argsSchema,
  requiredAutonomy: 'L0',
  reversible: true,
  tags: ['seo', 'blog', 'audit', 'read'],
  timeoutMs: 5000,
  async execute(args, ctx) {
    if (ctx.adminId === undefined) return null;

    const { auditBlogPostForOperator } = await import('../../../services/blog.service.js');
    return auditBlogPostForOperator(ctx.adminId, args.postId);
  },
};
