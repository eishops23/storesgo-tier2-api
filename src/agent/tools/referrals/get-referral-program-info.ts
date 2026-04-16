// Agent Suite — get_referral_program_info tool (Phase 5 Prompt 3)

import { z } from 'zod';
import type { AgentTool } from '../types.js';

const argsSchema = z.object({});

type Args = z.infer<typeof argsSchema>;

export const getReferralProgramInfoTool: AgentTool<Args, unknown> = {
  name: 'get_referral_program_info',
  description:
    'Get current referral program details: reward amounts, expiry period, how it works.',
  argsSchema,
  requiredAutonomy: 'L0',
  reversible: true,
  tags: ['referrals', 'program', 'read'],
  timeoutMs: 1000,
  async execute() {
    const { getReferralProgramInfo } = await import('../../../services/referrals.service.js');
    return getReferralProgramInfo();
  },
};
