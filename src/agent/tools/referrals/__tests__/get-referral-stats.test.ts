// Agent Suite — get_referral_stats tool tests (Phase 5 Prompt 3)

import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../../services/referrals.service.js', () => ({
  getReferralStats: vi.fn(),
}));

import { getReferralStatsTool } from '../get-referral-stats.js';
import { getReferralStats } from '../../../../services/referrals.service.js';
import type { ToolContext } from '../../types.js';

const mockGetReferralStats = vi.mocked(getReferralStats);

function makeCtx(overrides: Partial<ToolContext> = {}): ToolContext {
  return {
    sessionId: 'sess-1',
    featureKey: 'referrals',
    conversationId: 'conv-1',
    messageId: 'msg-1',
    userId: 'user-123',
    ...overrides,
  };
}

const sampleStats = {
  referralCode: 'STGOABCD1234',
  referralLink: 'https://storesgo.com/register?ref=STGOABCD1234',
  totalReferrals: 5,
  activeReferrals: 3,
  pendingReferrals: 2,
  pendingRewardsCents: 5000,
  totalEarningsCents: 7500,
  referrerRewardCents: 2500,
  referredRewardCents: 1000,
};

describe('get_referral_stats tool', () => {
  it('has correct metadata', () => {
    expect(getReferralStatsTool.name).toBe('get_referral_stats');
    expect(getReferralStatsTool.requiredAutonomy).toBe('L0');
    expect(getReferralStatsTool.reversible).toBe(true);
    expect(getReferralStatsTool.tags).toContain('referrals');
  });

  it('returns null when ctx.userId is missing (ownership check)', async () => {
    const result = await getReferralStatsTool.execute({}, makeCtx({ userId: undefined }));
    expect(result).toBeNull();
    expect(mockGetReferralStats).not.toHaveBeenCalled();
  });

  it('calls service with correct userId when authenticated', async () => {
    mockGetReferralStats.mockResolvedValue(sampleStats);

    await getReferralStatsTool.execute({}, makeCtx());
    expect(mockGetReferralStats).toHaveBeenCalledWith('user-123');
  });

  it('returns service result on success', async () => {
    mockGetReferralStats.mockResolvedValue(sampleStats);

    const result = await getReferralStatsTool.execute({}, makeCtx());
    expect(result).toEqual(sampleStats);
  });

  it('propagates service errors', async () => {
    mockGetReferralStats.mockRejectedValue(new Error('DB down'));

    await expect(getReferralStatsTool.execute({}, makeCtx())).rejects.toThrow('DB down');
  });

  it('validates args with Zod schema', () => {
    expect(getReferralStatsTool.argsSchema.safeParse({}).success).toBe(true);
  });
});
