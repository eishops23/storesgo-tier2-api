// Agent Suite — get_referral_program_info tool tests (Phase 5 Prompt 3)

import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../../services/referrals.service.js', () => ({
  getReferralProgramInfo: vi.fn(() => ({
    referrerRewardCents: 2500,
    referredRewardCents: 1000,
    expiryDays: 30,
    linkTemplate: 'https://storesgo.com/register?ref={code}',
    codeFormat: 'STGO + 8 uppercase hex characters',
  })),
}));

import { getReferralProgramInfoTool } from '../get-referral-program-info.js';

describe('get_referral_program_info tool', () => {
  it('has correct metadata', () => {
    expect(getReferralProgramInfoTool.name).toBe('get_referral_program_info');
    expect(getReferralProgramInfoTool.requiredAutonomy).toBe('L0');
    expect(getReferralProgramInfoTool.timeoutMs).toBe(1000);
  });

  it('returns expected shape with constants', async () => {
    const ctx = { sessionId: 's', featureKey: 'referrals', conversationId: 'c', messageId: 'm' };
    const result = await getReferralProgramInfoTool.execute({}, ctx);

    expect(result).toEqual({
      referrerRewardCents: 2500,
      referredRewardCents: 1000,
      expiryDays: 30,
      linkTemplate: 'https://storesgo.com/register?ref={code}',
      codeFormat: 'STGO + 8 uppercase hex characters',
    });
  });

  it('validates args with Zod schema', () => {
    expect(getReferralProgramInfoTool.argsSchema.safeParse({}).success).toBe(true);
  });
});
