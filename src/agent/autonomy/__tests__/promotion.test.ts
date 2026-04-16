// Agent Suite — Promotion criteria + orchestrator tests (Phase 0 Part E)

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Prisma } from '@prisma/client';
import { evaluatePromotion, PROMOTION_CRITERIA } from '../promotion-criteria.js';

vi.mock('../../storage/index.js', () => ({
  AutonomyRepo: {
    initializeFeature: vi.fn(async () => ({})),
    getAllStates: vi.fn(async () => []),
    promoteLevel: vi.fn(async () => ({})),
  },
}));

import { promoteFeatureLevel, checkPromotionReadiness, PromotionError } from '../promotion.js';
import { AutonomyRepo } from '../../storage/index.js';

const mockAutoRepo = vi.mocked(AutonomyRepo);

function makeState(overrides: any = {}) {
  return {
    id: 'state-1',
    featureKey: 'cs_chat',
    currentLevel: 'L0' as const,
    evalScoreAvg: new Prisma.Decimal(4.0),
    totalExecutions: 30,
    successCount: 28,
    errorCount: 2,
    lastPromotedAt: null,
    promotedBy: null,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('evaluatePromotion', () => {
  it('returns canPromote=true when all L0→L1 criteria met', () => {
    const state = makeState({
      currentLevel: 'L0',
      totalExecutions: 25,
      successCount: 24,
      errorCount: 1,
      evalScoreAvg: new Prisma.Decimal(3.8),
    });
    const result = evaluatePromotion(state, 'L1');
    expect(result.canPromote).toBe(true);
    expect(result.reasons).toContain('all criteria met');
  });

  it('denies when executions too low', () => {
    const state = makeState({ currentLevel: 'L0', totalExecutions: 5 });
    const result = evaluatePromotion(state, 'L1');
    expect(result.canPromote).toBe(false);
    expect(result.reasons.some((r: string) => r.includes('executions'))).toBe(true);
  });

  it('denies when eval score too low', () => {
    const state = makeState({
      currentLevel: 'L0',
      evalScoreAvg: new Prisma.Decimal(2.0),
    });
    const result = evaluatePromotion(state, 'L1');
    expect(result.canPromote).toBe(false);
    expect(result.reasons.some((r: string) => r.includes('eval score'))).toBe(true);
  });

  it('denies when error rate too high', () => {
    const state = makeState({
      currentLevel: 'L0',
      totalExecutions: 20,
      errorCount: 5,
      successCount: 15,
    });
    const result = evaluatePromotion(state, 'L1');
    expect(result.canPromote).toBe(false);
    expect(result.reasons.some((r: string) => r.includes('error rate'))).toBe(true);
  });

  it('returns no promotion path for illegal transitions', () => {
    const state = makeState({ currentLevel: 'L0' });
    const result = evaluatePromotion(state, 'L2');
    expect(result.canPromote).toBe(false);
    expect(result.reasons[0]).toContain('no promotion path');
  });

  it('returns no promotion path for L3→L0 downgrade', () => {
    const state = makeState({ currentLevel: 'L3' });
    const result = evaluatePromotion(state, 'L0');
    expect(result.canPromote).toBe(false);
  });

  it('includes current metrics in evaluation', () => {
    const state = makeState({ totalExecutions: 30, errorCount: 3 });
    const result = evaluatePromotion(state, 'L1');
    expect(result.currentMetrics.executions).toBe(30);
    expect(result.currentMetrics.errorRate).toBeCloseTo(0.1);
  });

  it('has correct L2→L3 criteria', () => {
    const criteria = PROMOTION_CRITERIA.find((c) => c.fromLevel === 'L2');
    expect(criteria?.minExecutions).toBe(500);
    expect(criteria?.minEvalScore).toBe(4.5);
    expect(criteria?.maxErrorRate).toBe(0.01);
  });
});

describe('promoteFeatureLevel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws PromotionError when criteria not met', async () => {
    mockAutoRepo.getAllStates.mockResolvedValue([
      makeState({ totalExecutions: 5, evalScoreAvg: new Prisma.Decimal(1.0) }),
    ]);

    await expect(
      promoteFeatureLevel('cs_chat', 'L1', 'jon'),
    ).rejects.toThrow(PromotionError);
  });

  it('succeeds when criteria are met', async () => {
    const state = makeState({
      totalExecutions: 25,
      successCount: 24,
      errorCount: 1,
      evalScoreAvg: new Prisma.Decimal(3.8),
    });
    mockAutoRepo.getAllStates.mockResolvedValue([state]);
    mockAutoRepo.promoteLevel.mockResolvedValue({ ...state, currentLevel: 'L1' } as any);

    const result = await promoteFeatureLevel('cs_chat', 'L1', 'jon', 'ready');
    expect(mockAutoRepo.promoteLevel).toHaveBeenCalledWith('cs_chat', 'L1', 'jon', 'ready');
  });
});

describe('checkPromotionReadiness', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns evaluation without promoting', async () => {
    mockAutoRepo.getAllStates.mockResolvedValue([makeState()]);

    const result = await checkPromotionReadiness('cs_chat', 'L1');
    expect(result.canPromote).toBeDefined();
    expect(mockAutoRepo.promoteLevel).not.toHaveBeenCalled();
  });
});
