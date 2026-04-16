// Agent Suite — Autonomy repository tests (Phase 0 Part B)

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Prisma } from '@prisma/client';
import {
  initializeFeature,
  getCurrentLevel,
  recordExecution,
  promoteLevel,
  updateEvalScore,
  getAllStates,
} from '../autonomy.repo.js';

function createMockPrisma() {
  return {
    aiAutonomyState: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
    },
  } as any;
}

let mockPrisma: ReturnType<typeof createMockPrisma>;

beforeEach(() => {
  mockPrisma = createMockPrisma();
});

describe('initializeFeature', () => {
  it('upserts a feature at L0', async () => {
    const state = { id: 'state-1', featureKey: 'cs-agent', currentLevel: 'L0' };
    mockPrisma.aiAutonomyState.upsert.mockResolvedValue(state);

    const result = await initializeFeature('cs-agent', mockPrisma);

    expect(result.featureKey).toBe('cs-agent');
    expect(mockPrisma.aiAutonomyState.upsert).toHaveBeenCalledWith({
      where: { featureKey: 'cs-agent' },
      create: { featureKey: 'cs-agent' },
      update: {},
    });
  });
});

describe('getCurrentLevel', () => {
  it('returns current level when feature exists', async () => {
    mockPrisma.aiAutonomyState.findUnique.mockResolvedValue({
      featureKey: 'cs-agent',
      currentLevel: 'L2',
    });

    const level = await getCurrentLevel('cs-agent', mockPrisma);
    expect(level).toBe('L2');
  });

  it('returns L0 and initializes when feature does not exist', async () => {
    mockPrisma.aiAutonomyState.findUnique.mockResolvedValue(null);
    mockPrisma.aiAutonomyState.upsert.mockResolvedValue({ featureKey: 'new-agent', currentLevel: 'L0' });

    const level = await getCurrentLevel('new-agent', mockPrisma);
    expect(level).toBe('L0');
    expect(mockPrisma.aiAutonomyState.upsert).toHaveBeenCalled();
  });
});

describe('recordExecution', () => {
  it('increments successCount on success', async () => {
    mockPrisma.aiAutonomyState.upsert.mockResolvedValue({});
    mockPrisma.aiAutonomyState.update.mockResolvedValue({
      totalExecutions: 11, successCount: 10, errorCount: 1,
    });

    const result = await recordExecution('cs-agent', true, mockPrisma);

    expect(mockPrisma.aiAutonomyState.update).toHaveBeenCalledWith({
      where: { featureKey: 'cs-agent' },
      data: {
        totalExecutions: { increment: 1 },
        successCount: { increment: 1 },
      },
    });
  });

  it('increments errorCount on failure', async () => {
    mockPrisma.aiAutonomyState.upsert.mockResolvedValue({});
    mockPrisma.aiAutonomyState.update.mockResolvedValue({
      totalExecutions: 11, successCount: 9, errorCount: 2,
    });

    await recordExecution('cs-agent', false, mockPrisma);

    expect(mockPrisma.aiAutonomyState.update).toHaveBeenCalledWith({
      where: { featureKey: 'cs-agent' },
      data: {
        totalExecutions: { increment: 1 },
        errorCount: { increment: 1 },
      },
    });
  });
});

describe('promoteLevel', () => {
  it('allows L0 to L1 promotion', async () => {
    mockPrisma.aiAutonomyState.findUnique.mockResolvedValue({
      featureKey: 'cs-agent', currentLevel: 'L0',
    });
    mockPrisma.aiAutonomyState.update.mockResolvedValue({
      featureKey: 'cs-agent', currentLevel: 'L1',
    });

    const result = await promoteLevel('cs-agent', 'L1', 'jon', 'passed eval', mockPrisma);
    expect(result.currentLevel).toBe('L1');
    expect(mockPrisma.aiAutonomyState.update).toHaveBeenCalledWith({
      where: { featureKey: 'cs-agent' },
      data: {
        currentLevel: 'L1',
        lastPromotedAt: expect.any(Date),
        promotedBy: 'jon',
        notes: 'passed eval',
      },
    });
  });

  it('allows L1 to L2 promotion', async () => {
    mockPrisma.aiAutonomyState.findUnique.mockResolvedValue({
      featureKey: 'cs-agent', currentLevel: 'L1',
    });
    mockPrisma.aiAutonomyState.update.mockResolvedValue({ currentLevel: 'L2' });

    const result = await promoteLevel('cs-agent', 'L2', 'jon', undefined, mockPrisma);
    expect(result.currentLevel).toBe('L2');
  });

  it('allows L2 to L3 promotion', async () => {
    mockPrisma.aiAutonomyState.findUnique.mockResolvedValue({
      featureKey: 'cs-agent', currentLevel: 'L2',
    });
    mockPrisma.aiAutonomyState.update.mockResolvedValue({ currentLevel: 'L3' });

    const result = await promoteLevel('cs-agent', 'L3', 'jon', undefined, mockPrisma);
    expect(result.currentLevel).toBe('L3');
  });

  it('throws when skipping levels (L0 to L2)', async () => {
    mockPrisma.aiAutonomyState.findUnique.mockResolvedValue({
      featureKey: 'cs-agent', currentLevel: 'L0',
    });

    await expect(
      promoteLevel('cs-agent', 'L2', 'jon', undefined, mockPrisma),
    ).rejects.toThrow('cannot skip levels');
  });

  it('throws when skipping levels (L0 to L3)', async () => {
    mockPrisma.aiAutonomyState.findUnique.mockResolvedValue({
      featureKey: 'cs-agent', currentLevel: 'L0',
    });

    await expect(
      promoteLevel('cs-agent', 'L3', 'jon', undefined, mockPrisma),
    ).rejects.toThrow('cannot skip levels');
  });

  it('throws when demoting (L2 to L1)', async () => {
    mockPrisma.aiAutonomyState.findUnique.mockResolvedValue({
      featureKey: 'cs-agent', currentLevel: 'L2',
    });

    await expect(
      promoteLevel('cs-agent', 'L1', 'jon', undefined, mockPrisma),
    ).rejects.toThrow('new level must be higher');
  });

  it('throws when promoting to same level', async () => {
    mockPrisma.aiAutonomyState.findUnique.mockResolvedValue({
      featureKey: 'cs-agent', currentLevel: 'L1',
    });

    await expect(
      promoteLevel('cs-agent', 'L1', 'jon', undefined, mockPrisma),
    ).rejects.toThrow('new level must be higher');
  });

  it('throws when feature is not initialized', async () => {
    mockPrisma.aiAutonomyState.findUnique.mockResolvedValue(null);

    await expect(
      promoteLevel('unknown-agent', 'L1', 'jon', undefined, mockPrisma),
    ).rejects.toThrow('not initialized');
  });
});

describe('updateEvalScore', () => {
  it('updates the eval score', async () => {
    mockPrisma.aiAutonomyState.update.mockResolvedValue({
      featureKey: 'cs-agent', evalScoreAvg: new Prisma.Decimal(0.85),
    });

    const result = await updateEvalScore('cs-agent', 0.85, mockPrisma);
    expect(mockPrisma.aiAutonomyState.update).toHaveBeenCalledWith({
      where: { featureKey: 'cs-agent' },
      data: { evalScoreAvg: expect.any(Prisma.Decimal) },
    });
  });
});

describe('getAllStates', () => {
  it('returns all states ordered by featureKey', async () => {
    mockPrisma.aiAutonomyState.findMany.mockResolvedValue([
      { featureKey: 'cs-agent' },
      { featureKey: 'seo-agent' },
    ]);

    const result = await getAllStates(mockPrisma);
    expect(result).toHaveLength(2);
    expect(mockPrisma.aiAutonomyState.findMany).toHaveBeenCalledWith({
      orderBy: { featureKey: 'asc' },
    });
  });
});
