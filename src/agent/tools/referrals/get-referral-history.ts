// Agent Suite — get_referral_history tool (Phase 5 Prompt 3)

import { z } from 'zod';
import type { AgentTool } from '../types.js';

const argsSchema = z.object({
  limit: z.number().int().min(1).max(50).optional().describe('Max results (default 20)'),
});

type Args = z.infer<typeof argsSchema>;

export const getReferralHistoryTool: AgentTool<Args, unknown> = {
  name: 'get_referral_history',
  description:
    "Get the authenticated user's referral history — list of people they referred with status and reward info.",
  argsSchema,
  requiredAutonomy: 'L0',
  reversible: true,
  tags: ['referrals', 'history', 'read'],
  timeoutMs: 5000,
  async execute(args, ctx) {
    if (!ctx.userId) return null;

    const { getReferralHistory } = await import('../../../services/referrals.service.js');
    return getReferralHistory(ctx.userId, args.limit);
  },
};
