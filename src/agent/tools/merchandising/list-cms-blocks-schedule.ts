// Agent Suite — list_cms_blocks_schedule tool (Phase 12 Prompt 2)

import { z } from 'zod';
import type { AgentTool } from '../types.js';

const argsSchema = z.object({
  includeInactive: z
    .boolean()
    .optional()
    .describe('If true, return inactive CMS blocks alongside active ones. Default false.'),
});

type Args = z.infer<typeof argsSchema>;

// Return type is intentionally `unknown` — mirroring Phase 9 SEO tools.
// Importing the concrete MerchandisingSnapshotCmsBlock type would pull
// homepage.service.ts (and transitively cms.service.ts) into agent-scope
// tsc, exposing pre-existing non-agent errors per CLAUDE.md.
export const listCmsBlocksScheduleTool: AgentTool<Args, unknown> = {
  name: 'list_cms_blocks_schedule',
  description:
    "Return the homepage CMS blocks with their scheduling metadata (id, key, type, order, isActive, startDate, endDate), sorted by display order. By default only active blocks are returned. Pass includeInactive: true to see inactive blocks too. Operator-facing — requires admin. Read-only.",
  argsSchema,
  requiredAutonomy: 'L0',
  reversible: true,
  tags: ['merchandising', 'cms', 'schedule', 'read'],
  timeoutMs: 10000,
  async execute(args, ctx) {
    if (ctx.adminId === undefined) return null;

    const { getMerchandisingSnapshot } = await import(
      '../../../services/homepage.service.js'
    );
    const snap = await getMerchandisingSnapshot();
    const includeInactive = args.includeInactive ?? false;
    return snap.cmsBlocks.filter((b) => includeInactive || b.isActive);
  },
};
