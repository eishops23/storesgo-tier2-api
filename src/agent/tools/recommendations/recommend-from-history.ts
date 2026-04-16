// Agent Suite — recommend_from_history tool (Phase 18A Prompt 3)
//
// THE ONLY userId-SCOPED tool in the Phase 18A registry. Returns null
// for guests (ctx.userId === undefined) and hands ctx.userId to the
// service layer as the only buyer filter. The service function scopes
// every order query to `buyerId: userId`, so cross-user leakage is
// impossible by construction — audit B12 risk #4 mitigation.

import { z } from 'zod';
import type { AgentTool } from '../types.js';

const argsSchema = z.object({
  limit: z.number().int().min(1).max(20).optional().describe('Max recommendations (default 10)'),
});

type Args = z.infer<typeof argsSchema>;

export const recommendFromHistoryTool: AgentTool<Args, unknown> = {
  name: 'recommend_from_history',
  description:
    "Personalized product recommendations based on the authenticated customer's own past orders. Requires the caller to be signed in — returns null for guests. Scopes every query by userId and excludes products the customer has already purchased. Note: StoresGo has a relatively small order volume in current prod, so the personalization signal is weaker for new customers — the service falls back to category-frequency matching when collaborative filtering is thin. The agent should tell guests 'sign in to unlock personalized recommendations' only if the user asks about personalization.",
  argsSchema,
  requiredAutonomy: 'L0',
  reversible: true,
  tags: ['recommendations', 'history', 'personalized', 'read'],
  timeoutMs: 8000,
  async execute(args, ctx) {
    if (!ctx.userId) return null;

    const { recommendFromHistoryForAgent } = await import(
      '../../../services/recommendations.service.js'
    );
    return recommendFromHistoryForAgent(ctx.userId, {
      limit: args.limit,
    });
  },
};
