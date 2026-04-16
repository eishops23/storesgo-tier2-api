// Agent Suite — find_similar_blog_posts tool (Phase 9 Prompt 3)

import { z } from 'zod';
import type { AgentTool } from '../types.js';

const argsSchema = z.object({
  postId: z.number().int().positive().describe('The numeric blog post ID to find similar posts for'),
  limit: z.number().int().min(1).max(20).optional().describe('Max results (default 5)'),
  threshold: z
    .number()
    .min(0)
    .max(1)
    .optional()
    .describe('Cosine similarity threshold 0-1 (default 0.7)'),
});

type Args = z.infer<typeof argsSchema>;

export const findSimilarBlogPostsTool: AgentTool<Args, unknown> = {
  name: 'find_similar_blog_posts',
  description:
    "Find blog posts semantically similar to a given post via in-process cosine similarity over the BlogPost.embedding column. Returns null if the source post does not exist; returns an empty array if the source post has no embedding (the agent should then suggest using audit_blog_post or get_blog_stats instead). Language-scoped to the source post's language.",
  argsSchema,
  requiredAutonomy: 'L0',
  reversible: true,
  tags: ['seo', 'similarity', 'analysis', 'read'],
  timeoutMs: 8000,
  async execute(args, ctx) {
    if (ctx.adminId === undefined) return null;

    const { findSimilarBlogPosts } = await import('../../../services/blog.service.js');
    return findSimilarBlogPosts(ctx.adminId, args.postId, {
      limit: args.limit,
      threshold: args.threshold,
    });
  },
};
