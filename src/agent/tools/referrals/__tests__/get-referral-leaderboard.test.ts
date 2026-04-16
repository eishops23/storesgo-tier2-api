// Agent Suite — get_referral_leaderboard tool tests (Phase 5 Prompt 3)

import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../../services/referrals.service.js', () => ({
  getReferralLeaderboard: vi.fn(),
}));

import { getReferralLeaderboardTool } from '../get-referral-leaderboard.js';
import { getReferralLeaderboard } from '../../../../services/referrals.service.js';

const mockLeaderboard = vi.mocked(getReferralLeaderboard);

describe('get_referral_leaderboard tool', () => {
  it('has correct metadata', () => {
    expect(getReferralLeaderboardTool.name).toBe('get_referral_leaderboard');
    expect(getReferralLeaderboardTool.requiredAutonomy).toBe('L0');
  });

  it('default limit (no args)', async () => {
    mockLeaderboard.mockResolvedValue([]);
    const ctx = { sessionId: 's', featureKey: 'referrals', conversationId: 'c', messageId: 'm' };

    await getReferralLeaderboardTool.execute({}, ctx);
    expect(mockLeaderboard).toHaveBeenCalledWith(undefined);
  });

  it('custom limit within bounds', async () => {
    mockLeaderboard.mockResolvedValue([{ rank: 1, name: 'Alice', referralCount: 10 }]);
    const ctx = { sessionId: 's', featureKey: 'referrals', conversationId: 'c', messageId: 'm' };

    const result = await getReferralLeaderboardTool.execute({ limit: 5 }, ctx);
    expect(mockLeaderboard).toHaveBeenCalledWith(5);
    expect(result).toEqual([{ rank: 1, name: 'Alice', referralCount: 10 }]);
  });

  it('schema rejects limit > 20', () => {
    expect(getReferralLeaderboardTool.argsSchema.safeParse({ limit: 21 }).success).toBe(false);
    expect(getReferralLeaderboardTool.argsSchema.safeParse({ limit: 20 }).success).toBe(true);
  });
});
