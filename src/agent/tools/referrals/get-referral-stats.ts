// Agent Suite — get_referral_stats tool (Phase 5 Prompt 3)

import { z } from 'zod';
import type { AgentTool } from '../types.js';

const argsSchema = z.object({});

type Args = z.infer<typeof argsSchema>;

export const getReferralStatsTool: AgentTool<Args, unknown> = {
  name: 'get_referral_stats',
  description:
    "Get the authenticated user's referral code, link, and stats (total, active, pending referrals; earnings).",
  argsSchema,
  requiredAutonomy: 'L0',
  reversible: true,
  tags: ['referrals', 'stats', 'read'],
  timeoutMs: 5000,
  async execute(_args, ctx) {
    if (!ctx.userId) return null;

    const { getReferralStats } = await import('../../../services/referrals.service.js');
    return getReferralStats(ctx.userId);
  },
};
