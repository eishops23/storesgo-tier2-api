// Agent Suite — get_blog_stats tool (Phase 9 Prompt 3)

import { z } from 'zod';
import type { AgentTool } from '../types.js';

const argsSchema = z.object({
  sinceDays: z
    .number()
    .int()
    .min(1)
    .max(365)
    .optional()
    .describe('Window for the aggregation in days (default 90, max 365)'),
});

type Args = z.infer<typeof argsSchema>;

export const getBlogStatsTool: AgentTool<Args, unknown> = {
  name: 'get_blog_stats',
  description:
    "Get aggregate blog post statistics for the operator: total published, posts in the last 7/30 days, average word count over the most recent 100 posts, top tags, orphan count, and posts without embeddings. All metrics scoped to the blog content the operator owns globally — there is no per-seller scoping for SEO.",
  argsSchema,
  requiredAutonomy: 'L0',
  reversible: true,
  tags: ['seo', 'stats', 'read'],
  timeoutMs: 10000,
  async execute(args, ctx) {
    if (ctx.adminId === undefined) return null;

    const { getBlogStatsForOperator } = await import('../../../services/blog.service.js');
    return getBlogStatsForOperator(ctx.adminId, args);
  },
};
