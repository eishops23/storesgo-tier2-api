// Agent Suite — validate_referral_code tool (Phase 5 Prompt 3)

import { z } from 'zod';
import type { AgentTool } from '../types.js';

const argsSchema = z.object({
  code: z.string().min(1).describe('The referral code to validate'),
});

type Args = z.infer<typeof argsSchema>;

export const validateReferralCodeTool: AgentTool<Args, unknown> = {
  name: 'validate_referral_code',
  description:
    'Check if a referral code is valid and active. Returns reward amounts if valid.',
  argsSchema,
  requiredAutonomy: 'L0',
  reversible: true,
  tags: ['referrals', 'validate', 'read'],
  timeoutMs: 3000,
  async execute(args) {
    const { validateReferralCode } = await import('../../../services/referrals.service.js');
    return validateReferralCode(args.code);
  },
};
