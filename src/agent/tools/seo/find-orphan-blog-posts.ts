// Agent Suite — find_orphan_blog_posts tool (Phase 9 Prompt 3)

import { z } from 'zod';
import type { AgentTool } from '../types.js';

const argsSchema = z.object({
  limit: z.number().int().min(1).max(100).optional().describe('Max orphans to return (default 20)'),
});

type Args = z.infer<typeof argsSchema>;

export const findOrphanBlogPostsTool: AgentTool<Args, unknown> = {
  name: 'find_orphan_blog_posts',
  description:
    "Find published blog posts that no other blog post links to internally via /blog/{slug}. Best-effort: detection is based on string match against contentHtml — links rendered by JS components or inside JSON-LD will be missed. Useful for spotting content the operator has invested in but isn't promoting via internal links.",
  argsSchema,
  requiredAutonomy: 'L0',
  reversible: true,
  tags: ['seo', 'orphans', 'analysis', 'read'],
  timeoutMs: 10000,
  async execute(args, ctx) {
    if (ctx.adminId === undefined) return null;

    const { findOrphanBlogPosts } = await import('../../../services/blog.service.js');
    return findOrphanBlogPosts(ctx.adminId, args);
  },
};
