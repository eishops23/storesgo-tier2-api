// Agent Suite — draft_blog_post_outline tool (Phase 9 Prompt 3)
//
// IMPORTANT: This tool returns CONTEXT only. It does NOT return a
// finished outline and does NOT publish anything. The agent uses
// the returned context (similar existing posts, relevant tags,
// recommended word count, recommended heading structure, and
// forbiddenOverlap warnings) to compose the actual outline in its
// user-facing assistant message. Mirrors the Phase 11
// loadReviewForDrafting -> draft_response pattern.
//
// forbiddenOverlap surfaces near-duplicate content (cosine > 0.85)
// so the agent can warn the operator that a similar post already
// exists rather than helping draft a near-clone.

import { z } from 'zod';
import type { AgentTool } from '../types.js';

const argsSchema = z.object({
  topic: z
    .string()
    .min(3)
    .max(200)
    .describe('The topic the operator wants to draft a new blog post about'),
  vertical: z
    .string()
    .min(1)
    .max(100)
    .optional()
    .describe('Optional category to scope the analysis to a specific vertical'),
  referencePostIds: z
    .array(z.number().int().positive())
    .max(10)
    .optional()
    .describe('Optional array of existing post IDs to anchor similarity against'),
});

type Args = z.infer<typeof argsSchema>;

export const draftBlogPostOutlineTool: AgentTool<Args, unknown> = {
  name: 'draft_blog_post_outline',
  description:
    "Load context for drafting a new blog post outline. Returns related existing posts, relevant tags, recommended word count, heading structure, and forbiddenOverlap (near-duplicates). Does NOT return the finished outline — the agent composes it in its reply using this context. Nothing is persisted. There is no publish path.",
  argsSchema,
  requiredAutonomy: 'L0',
  reversible: true,
  tags: ['seo', 'drafting', 'read'],
  timeoutMs: 10000,
  async execute(args, ctx) {
    if (ctx.adminId === undefined) return null;

    const { loadBlogPostContextForDrafting } = await import(
      '../../../services/blog.service.js'
    );
    return loadBlogPostContextForDrafting(ctx.adminId, args);
  },
};
