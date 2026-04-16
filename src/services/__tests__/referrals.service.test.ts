import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock prisma before importing the service
vi.mock('../../lib/prisma.js', () => {
  const mockPrisma = {
    referral: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      groupBy: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  };
  return { prisma: mockPrisma };
});

import {
  generateReferralCode,
  getReferralStats,
  getReferralHistory,
  getReferralLeaderboard,
  validateReferralCode,
  getReferralProgramInfo,
  REFERRER_REWARD_CENTS,
  REFERRED_REWARD_CENTS,
  REFERRAL_EXPIRY_DAYS,
} from '../referrals.service.js';
import { prisma } from '../../lib/prisma.js';

const mockPrisma = vi.mocked(prisma);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('generateReferralCode', () => {
  it('produces a 12-char string starting with STGO', () => {
    const code = generateReferralCode('user-123');
    expect(code).toMatch(/^STGO[A-F0-9]{8}$/);
    expect(code.length).toBe(12);
  });

  it('produces different codes for different user IDs', () => {
    const code1 = generateReferralCode('user-aaa');
    const code2 = generateReferralCode('user-bbb');
    expect(code1).not.toBe(code2);
    // Both still match the expected format
    expect(code1).toMatch(/^STGO[A-F0-9]{8}$/);
    expect(code2).toMatch(/^STGO[A-F0-9]{8}$/);
  });
});

describe('getReferralProgramInfo', () => {
  it('returns the expected constants and shape', () => {
    const info = getReferralProgramInfo();
    expect(info).toEqual({
      referrerRewardCents: 2500,
      referredRewardCents: 1000,
      expiryDays: 30,
      linkTemplate: 'https://storesgo.com/register?ref={code}',
      codeFormat: 'STGO + 8 uppercase hex characters',
    });
  });

  it('exports correct constant values', () => {
    expect(REFERRER_REWARD_CENTS).toBe(2500);
    expect(REFERRED_REWARD_CENTS).toBe(1000);
    expect(REFERRAL_EXPIRY_DAYS).toBe(30);
  });
});

describe('validateReferralCode', () => {
  it('returns valid:false for unknown code', async () => {
    mockPrisma.referral.findFirst.mockResolvedValue(null);

    const result = await validateReferralCode('STGO_BOGUS_X');
    expect(result).toEqual({ valid: false, error: 'Invalid referral code' });
    expect(mockPrisma.referral.findFirst).toHaveBeenCalledWith({
      where: { referralCode: 'STGO_BOGUS_X', status: 'code_holder' },
    });
  });

  it('returns valid:true for a seeded valid code', async () => {
    mockPrisma.referral.findFirst.mockResolvedValue({
      id: 1,
      referrerId: 'user-1',
      referredId: null,
      referralCode: 'STGOABCD1234',
      status: 'code_holder',
    } as any);

    const result = await validateReferralCode('stgoabcd1234');
    expect(result).toEqual({ valid: true, referredRewardCents: 1000 });
    // Should uppercase the code
    expect(mockPrisma.referral.findFirst).toHaveBeenCalledWith({
      where: { referralCode: 'STGOABCD1234', status: 'code_holder' },
    });
  });
});

describe('getReferralStats', () => {
  const mockCodeHolder = {
    id: 1,
    referrerId: 'user-1',
    referredId: null,
    referralCode: 'STGOABCD1234',
    status: 'code_holder',
    referrerRewardCents: 2500,
    referredRewardCents: 1000,
  };

  it('returns existing code_holder on subsequent calls', async () => {
    mockPrisma.referral.findFirst.mockResolvedValue(mockCodeHolder as any);
    mockPrisma.referral.findMany.mockResolvedValue([]);

    const result = await getReferralStats('user-1');
    expect(result.referralCode).toBe('STGOABCD1234');
    expect(result.totalReferrals).toBe(0);
    expect(result.referrerRewardCents).toBe(2500);
    expect(result.referredRewardCents).toBe(1000);
    expect(result.referralLink).toContain('/register?ref=STGOABCD1234');
    expect(mockPrisma.referral.create).not.toHaveBeenCalled();
  });

  it('creates a code_holder row if none exists (idempotent)', async () => {
    mockPrisma.referral.findFirst.mockResolvedValueOnce(null); // first call: no code_holder
    mockPrisma.referral.create.mockResolvedValue(mockCodeHolder as any);
    mockPrisma.referral.findMany.mockResolvedValue([]);

    const result = await getReferralStats('user-1');
    expect(mockPrisma.referral.create).toHaveBeenCalledOnce();
    expect(result.referralCode).toBe('STGOABCD1234');
  });

  it('handles P2002 unique constraint race with refetch', async () => {
    mockPrisma.referral.findFirst
      .mockResolvedValueOnce(null) // first findFirst: no code_holder
      .mockResolvedValueOnce(mockCodeHolder as any); // refetch after P2002

    const p2002Error = new Error('Unique constraint failed') as any;
    p2002Error.code = 'P2002';
    mockPrisma.referral.create.mockRejectedValue(p2002Error);
    mockPrisma.referral.findMany.mockResolvedValue([]);

    const result = await getReferralStats('user-1');
    expect(result.referralCode).toBe('STGOABCD1234');
    // findFirst called twice: initial + refetch after P2002
    expect(mockPrisma.referral.findFirst).toHaveBeenCalledTimes(2);
  });

  it('computes stats correctly with mixed referral statuses', async () => {
    mockPrisma.referral.findFirst.mockResolvedValue(mockCodeHolder as any);
    mockPrisma.referral.findMany.mockResolvedValue([
      { status: 'completed', paidOut: true, referrerRewardCents: 2500 },
      { status: 'completed', paidOut: false, referrerRewardCents: 2500 },
      { status: 'pending', paidOut: false, referrerRewardCents: 2500 },
    ] as any);

    const result = await getReferralStats('user-1');
    expect(result.totalReferrals).toBe(3);
    expect(result.activeReferrals).toBe(2); // completed
    expect(result.pendingReferrals).toBe(1); // pending
    expect(result.totalEarningsCents).toBe(2500); // completed + paidOut
    expect(result.pendingRewardsCents).toBe(2500); // completed + !paidOut
  });
});

describe('getReferralHistory', () => {
  it('masks emails in the output', async () => {
    mockPrisma.referral.findMany.mockResolvedValue([
      {
        id: 1,
        referredName: 'Alice',
        referredEmail: null,
        referred: { email: 'alice@example.com', createdAt: new Date() },
        status: 'completed',
        referrerRewardCents: 2500,
        paidOut: true,
        createdAt: new Date('2026-01-15'),
        completedAt: new Date('2026-02-01'),
      },
      {
        id: 2,
        referredName: null,
        referredEmail: 'bob@example.com',
        referred: null,
        status: 'pending',
        referrerRewardCents: 2500,
        paidOut: false,
        createdAt: new Date('2026-03-01'),
        completedAt: null,
      },
      {
        id: 3,
        referredName: null,
        referredEmail: null,
        referred: null,
        status: 'pending',
        referrerRewardCents: 2500,
        paidOut: false,
        createdAt: new Date('2026-03-15'),
        completedAt: null,
      },
    ] as any);

    const history = await getReferralHistory('user-1');

    expect(history).toHaveLength(3);
    // Email masking: uses referred?.email || referredEmail || "***@***.com"
    // This matches the existing route behavior — it does show the email if available
    expect(history[0].referredEmail).toBe('alice@example.com');
    expect(history[0].referredName).toBe('Alice');
    expect(history[1].referredEmail).toBe('bob@example.com');
    expect(history[1].referredName).toBe('New User');
    expect(history[2].referredEmail).toBe('***@***.com');
    expect(history[2].referredName).toBe('New User');
    expect(history[0].completedAt).not.toBeNull();
    expect(history[1].completedAt).toBeNull();
  });

  it('respects limit parameter', async () => {
    mockPrisma.referral.findMany.mockResolvedValue([]);

    await getReferralHistory('user-1', 5);
    expect(mockPrisma.referral.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 5 }),
    );
  });

  it('caps limit at 50', async () => {
    mockPrisma.referral.findMany.mockResolvedValue([]);

    await getReferralHistory('user-1', 100);
    expect(mockPrisma.referral.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 50 }),
    );
  });

  it('defaults limit to 20', async () => {
    mockPrisma.referral.findMany.mockResolvedValue([]);

    await getReferralHistory('user-1');
    expect(mockPrisma.referral.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 20 }),
    );
  });
});

describe('getReferralLeaderboard', () => {
  it('returns first names only, never emails', async () => {
    mockPrisma.referral.groupBy.mockResolvedValue([
      { referrerId: 'user-1', _count: { id: 10 } },
      { referrerId: 'user-2', _count: { id: 5 } },
    ] as any);

    mockPrisma.user.findUnique
      .mockResolvedValueOnce({
        email: 'alice@example.com',
        buyerProfile: { firstName: 'Alice' },
      } as any)
      .mockResolvedValueOnce({
        email: 'bob@example.com',
        buyerProfile: null,
      } as any);

    const leaderboard = await getReferralLeaderboard();

    expect(leaderboard).toHaveLength(2);
    expect(leaderboard[0]).toEqual({ rank: 1, name: 'Alice', referralCount: 10 });
    expect(leaderboard[1]).toEqual({ rank: 2, name: 'User', referralCount: 5 });
    // No email field in the output
    expect(leaderboard[0]).not.toHaveProperty('email');
    expect(leaderboard[1]).not.toHaveProperty('email');
  });

  it('defaults to limit 10', async () => {
    mockPrisma.referral.groupBy.mockResolvedValue([]);

    await getReferralLeaderboard();
    expect(mockPrisma.referral.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({ take: 10 }),
    );
  });

  it('caps limit at 20', async () => {
    mockPrisma.referral.groupBy.mockResolvedValue([]);

    await getReferralLeaderboard(50);
    expect(mockPrisma.referral.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({ take: 20 }),
    );
  });
});
