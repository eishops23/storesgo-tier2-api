// Agent Suite — get_referral_leaderboard tool (Phase 5 Prompt 3)

import { z } from 'zod';
import type { AgentTool } from '../types.js';

const argsSchema = z.object({
  limit: z.number().int().min(1).max(20).optional().describe('Max entries (default 10)'),
});

type Args = z.infer<typeof argsSchema>;

export const getReferralLeaderboardTool: AgentTool<Args, unknown> = {
  name: 'get_referral_leaderboard',
  description:
    'Get the top referrers (public leaderboard showing first names and referral counts).',
  argsSchema,
  requiredAutonomy: 'L0',
  reversible: true,
  tags: ['referrals', 'leaderboard', 'read'],
  timeoutMs: 5000,
  async execute(args) {
    const { getReferralLeaderboard } = await import('../../../services/referrals.service.js');
    return getReferralLeaderboard(args.limit);
  },
};
