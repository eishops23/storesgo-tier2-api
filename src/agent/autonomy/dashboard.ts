// Agent Suite — Autonomy dashboard data (Phase 0 Part E)

import type { AiAutonomyState } from '@prisma/client';
import { AutonomyRepo } from '../storage/index.js';
import { evaluatePromotion, type PromotionEvaluation } from './promotion-criteria.js';

export interface AutonomyDashboardRow {
  state: AiAutonomyState;
  nextLevelEvaluation: PromotionEvaluation | null;
}

export async function getAutonomyDashboardData(): Promise<AutonomyDashboardRow[]> {
  const states = await AutonomyRepo.getAllStates();
  return states.map((state) => {
    const nextLevel =
      state.currentLevel === 'L0'
        ? 'L1'
        : state.currentLevel === 'L1'
          ? 'L2'
          : state.currentLevel === 'L2'
            ? 'L3'
            : null;

    return {
      state,
      nextLevelEvaluation: nextLevel
        ? evaluatePromotion(state, nextLevel)
        : null,
    };
  });
}
