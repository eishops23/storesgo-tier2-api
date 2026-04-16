// Agent Suite — get_referral_history tool tests (Phase 5 Prompt 3)

import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../../services/referrals.service.js', () => ({
  getReferralHistory: vi.fn(),
}));

import { getReferralHistoryTool } from '../get-referral-history.js';
import { getReferralHistory } from '../../../../services/referrals.service.js';
import type { ToolContext } from '../../types.js';

const mockGetReferralHistory = vi.mocked(getReferralHistory);

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

const sampleHistory = [
  {
    id: 1,
    referredName: 'Alice',
    referredEmail: '***@***.com',
    status: 'completed',
    rewardCents: 2500,
    paidOut: true,
    createdAt: '2026-01-15T00:00:00.000Z',
    completedAt: '2026-02-01T00:00:00.000Z',
  },
];

describe('get_referral_history tool', () => {
  it('has correct metadata', () => {
    expect(getReferralHistoryTool.name).toBe('get_referral_history');
    expect(getReferralHistoryTool.requiredAutonomy).toBe('L0');
    expect(getReferralHistoryTool.tags).toContain('referrals');
  });

  it('returns null when ctx.userId is missing (ownership check)', async () => {
    const result = await getReferralHistoryTool.execute({}, makeCtx({ userId: undefined }));
    expect(result).toBeNull();
    expect(mockGetReferralHistory).not.toHaveBeenCalled();
  });

  it('calls service with userId and no limit when limit not provided', async () => {
    mockGetReferralHistory.mockResolvedValue(sampleHistory);

    await getReferralHistoryTool.execute({}, makeCtx());
    expect(mockGetReferralHistory).toHaveBeenCalledWith('user-123', undefined);
  });

  it('passes limit parameter through to service', async () => {
    mockGetReferralHistory.mockResolvedValue(sampleHistory);

    await getReferralHistoryTool.execute({ limit: 5 }, makeCtx());
    expect(mockGetReferralHistory).toHaveBeenCalledWith('user-123', 5);
  });

  it('returns service result on success', async () => {
    mockGetReferralHistory.mockResolvedValue(sampleHistory);

    const result = await getReferralHistoryTool.execute({}, makeCtx());
    expect(result).toEqual(sampleHistory);
  });

  it('validates args with Zod schema', () => {
    expect(getReferralHistoryTool.argsSchema.safeParse({}).success).toBe(true);
    expect(getReferralHistoryTool.argsSchema.safeParse({ limit: 10 }).success).toBe(true);
    expect(getReferralHistoryTool.argsSchema.safeParse({ limit: 51 }).success).toBe(false);
    expect(getReferralHistoryTool.argsSchema.safeParse({ limit: 0 }).success).toBe(false);
  });
});
