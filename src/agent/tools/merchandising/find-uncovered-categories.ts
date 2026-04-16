// Agent Suite — find_uncovered_categories tool (Phase 12 Prompt 2)

import { z } from 'zod';
import type { AgentTool } from '../types.js';

const argsSchema = z.object({});

type Args = z.infer<typeof argsSchema>;

export const findUncoveredCategoriesTool: AgentTool<Args, string[] | null> = {
  name: 'find_uncovered_categories',
  description:
    "Return the names of categories that have at least one active product but are NOT in HomepageConfig.featuredCategoryIds. Use this to surface categories the operator should consider featuring. Operator-facing — requires admin. Read-only.",
  argsSchema,
  requiredAutonomy: 'L0',
  reversible: true,
  tags: ['merchandising', 'coverage', 'read'],
  timeoutMs: 10000,
  async execute(_args, ctx) {
    if (ctx.adminId === undefined) return null;

    const { getMerchandisingSnapshot } = await import(
      '../../../services/homepage.service.js'
    );
    const snap = await getMerchandisingSnapshot();
    return snap.coverageGaps.categoriesWithoutFeatured;
  },
};
