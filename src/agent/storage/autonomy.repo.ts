// Agent Suite — Autonomy state repository (Phase 0 Part B)

import type { PrismaClient, AiAutonomyState, AiAutonomyLevel } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { getPrisma } from './prisma-client.js';

const LEVEL_ORDER: AiAutonomyLevel[] = ['L0', 'L1', 'L2', 'L3'];

function levelIndex(level: AiAutonomyLevel): number {
  return LEVEL_ORDER.indexOf(level);
}

export async function initializeFeature(
  featureKey: string,
  db: PrismaClient = getPrisma(),
): Promise<AiAutonomyState> {
  return db.aiAutonomyState.upsert({
    where: { featureKey },
    create: { featureKey },
    update: {},
  });
}

export async function getCurrentLevel(
  featureKey: string,
  db: PrismaClient = getPrisma(),
): Promise<AiAutonomyLevel> {
  const state = await db.aiAutonomyState.findUnique({ where: { featureKey } });
  if (!state) {
    await initializeFeature(featureKey, db);
    return 'L0';
  }
  return state.currentLevel;
}

export async function recordExecution(
  featureKey: string,
  success: boolean,
  db: PrismaClient = getPrisma(),
): Promise<AiAutonomyState> {
  // Ensure the feature row exists
  await initializeFeature(featureKey, db);

  return db.aiAutonomyState.update({
    where: { featureKey },
    data: {
      totalExecutions: { increment: 1 },
      ...(success
        ? { successCount: { increment: 1 } }
        : { errorCount: { increment: 1 } }),
    },
  });
}

export async function promoteLevel(
  featureKey: string,
  newLevel: AiAutonomyLevel,
  promotedBy: string,
  notes?: string,
  db: PrismaClient = getPrisma(),
): Promise<AiAutonomyState> {
  const state = await db.aiAutonomyState.findUnique({ where: { featureKey } });
  if (!state) {
    throw new Error(`Feature "${featureKey}" not initialized. Call initializeFeature first.`);
  }

  const currentIdx = levelIndex(state.currentLevel);
  const newIdx = levelIndex(newLevel);

  if (newIdx <= currentIdx) {
    throw new Error(
      `Cannot promote ${featureKey} from ${state.currentLevel} to ${newLevel}: ` +
      `new level must be higher than current level`,
    );
  }

  if (newIdx - currentIdx > 1) {
    throw new Error(
      `Cannot promote ${featureKey} from ${state.currentLevel} to ${newLevel}: ` +
      `cannot skip levels (must go one step at a time)`,
    );
  }

  return db.aiAutonomyState.update({
    where: { featureKey },
    data: {
      currentLevel: newLevel,
      lastPromotedAt: new Date(),
      promotedBy,
      notes: notes ?? null,
    },
  });
}

export async function updateEvalScore(
  featureKey: string,
  newScore: number,
  db: PrismaClient = getPrisma(),
): Promise<AiAutonomyState> {
  return db.aiAutonomyState.update({
    where: { featureKey },
    data: { evalScoreAvg: new Prisma.Decimal(newScore) },
  });
}

export async function getAllStates(
  db: PrismaClient = getPrisma(),
): Promise<AiAutonomyState[]> {
  return db.aiAutonomyState.findMany({
    orderBy: { featureKey: 'asc' },
  });
}
