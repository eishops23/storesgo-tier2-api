// Agent Suite — validate_referral_code tool tests (Phase 5 Prompt 3)

import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../../services/referrals.service.js', () => ({
  validateReferralCode: vi.fn(),
}));

import { validateReferralCodeTool } from '../validate-referral-code.js';
import { validateReferralCode } from '../../../../services/referrals.service.js';

const mockValidate = vi.mocked(validateReferralCode);

describe('validate_referral_code tool', () => {
  it('has correct metadata', () => {
    expect(validateReferralCodeTool.name).toBe('validate_referral_code');
    expect(validateReferralCodeTool.requiredAutonomy).toBe('L0');
    expect(validateReferralCodeTool.timeoutMs).toBe(3000);
  });

  it('rejects empty string at schema level', () => {
    expect(validateReferralCodeTool.argsSchema.safeParse({ code: '' }).success).toBe(false);
    expect(validateReferralCodeTool.argsSchema.safeParse({}).success).toBe(false);
  });

  it('calls service with code and returns valid result', async () => {
    mockValidate.mockResolvedValue({ valid: true, referredRewardCents: 1000 });

    const ctx = { sessionId: 's', featureKey: 'referrals', conversationId: 'c', messageId: 'm' };
    const result = await validateReferralCodeTool.execute({ code: 'STGOABCD1234' }, ctx);

    expect(mockValidate).toHaveBeenCalledWith('STGOABCD1234');
    expect(result).toEqual({ valid: true, referredRewardCents: 1000 });
  });

  it('returns invalid result from service', async () => {
    mockValidate.mockResolvedValue({ valid: false, error: 'Invalid referral code' });

    const ctx = { sessionId: 's', featureKey: 'referrals', conversationId: 'c', messageId: 'm' };
    const result = await validateReferralCodeTool.execute({ code: 'BOGUS' }, ctx);

    expect(result).toEqual({ valid: false, error: 'Invalid referral code' });
  });
});
