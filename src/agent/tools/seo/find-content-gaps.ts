// Agent Suite — find_content_gaps tool (Phase 9 Prompt 3)

import { z } from 'zod';
import type { AgentTool } from '../types.js';

const argsSchema = z.object({
  vertical: z.string().min(1).max(100).optional().describe(
    'Optional category/vertical to scope the analysis. If omitted, scans all categories.',
  ),
  limit: z.number().int().min(1).max(50).optional().describe('Max gaps to return (default 10)'),
});

type Args = z.infer<typeof argsSchema>;

export const findContentGapsTool: AgentTool<Args, unknown> = {
  name: 'find_content_gaps',
  description:
    "Find blog post categories with thin coverage (fewer than 5 published posts). Returns suggested topics the operator could write about to fill the gap. Taxonomy-based analysis on BlogPost.category — does not use embeddings or external keyword tools.",
  argsSchema,
  requiredAutonomy: 'L0',
  reversible: true,
  tags: ['seo', 'gaps', 'analysis', 'read'],
  timeoutMs: 8000,
  async execute(args, ctx) {
    if (ctx.adminId === undefined) return null;

    const { findContentGapsForVertical } = await import('../../../services/blog.service.js');
    return findContentGapsForVertical(ctx.adminId, args);
  },
};
