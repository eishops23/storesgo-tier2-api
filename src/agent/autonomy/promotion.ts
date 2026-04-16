// Agent Suite — Promotion orchestrator (Phase 0 Part E)

import type { AiAutonomyLevel, AiAutonomyState } from '@prisma/client';
import { AutonomyRepo } from '../storage/index.js';
import { evaluatePromotion, type PromotionEvaluation } from './promotion-criteria.js';

export class PromotionError extends Error {
  constructor(
    public readonly featureKey: string,
    public readonly targetLevel: AiAutonomyLevel,
    public readonly evaluation: PromotionEvaluation,
  ) {
    super(
      `Cannot promote ${featureKey} to ${targetLevel}: ${evaluation.reasons.join('; ')}`,
    );
    this.name = 'PromotionError';
  }
}

export async function promoteFeatureLevel(
  featureKey: string,
  targetLevel: AiAutonomyLevel,
  promotedBy: string,
  notes?: string,
): Promise<AiAutonomyState> {
  await AutonomyRepo.initializeFeature(featureKey);
  const states = await AutonomyRepo.getAllStates();
  const state = states.find((s) => s.featureKey === featureKey);

  if (!state) {
    throw new Error(`Feature state not found after initialization: ${featureKey}`);
  }

  const evaluation = evaluatePromotion(state, targetLevel);
  if (!evaluation.canPromote) {
    throw new PromotionError(featureKey, targetLevel, evaluation);
  }

  return AutonomyRepo.promoteLevel(featureKey, targetLevel, promotedBy, notes);
}

export async function checkPromotionReadiness(
  featureKey: string,
  targetLevel: AiAutonomyLevel,
): Promise<PromotionEvaluation> {
  await AutonomyRepo.initializeFeature(featureKey);
  const states = await AutonomyRepo.getAllStates();
  const state = states.find((s) => s.featureKey === featureKey);

  if (!state) {
    throw new Error(`Feature state not found: ${featureKey}`);
  }

  return evaluatePromotion(state, targetLevel);
}
