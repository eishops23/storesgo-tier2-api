// Agent Suite — Promotion criteria and evaluation (Phase 0 Part E)

import type { AiAutonomyLevel, AiAutonomyState } from '@prisma/client';

export interface PromotionCriteria {
  fromLevel: AiAutonomyLevel;
  toLevel: AiAutonomyLevel;
  minExecutions: number;
  minEvalScore: number;
  maxErrorRate: number;
}

export const PROMOTION_CRITERIA: PromotionCriteria[] = [
  {
    fromLevel: 'L0',
    toLevel: 'L1',
    minExecutions: 20,
    minEvalScore: 3.5,
    maxErrorRate: 0.10,
  },
  {
    fromLevel: 'L1',
    toLevel: 'L2',
    minExecutions: 50,
    minEvalScore: 4.0,
    maxErrorRate: 0.05,
  },
  {
    fromLevel: 'L2',
    toLevel: 'L3',
    minExecutions: 500,
    minEvalScore: 4.5,
    maxErrorRate: 0.01,
  },
];

export interface PromotionEvaluation {
  canPromote: boolean;
  reasons: string[];
  currentMetrics: {
    executions: number;
    evalScore: number;
    errorRate: number;
  };
  requiredMetrics: PromotionCriteria | null;
}

export function evaluatePromotion(
  state: AiAutonomyState,
  targetLevel: AiAutonomyLevel,
): PromotionEvaluation {
  const criteria = PROMOTION_CRITERIA.find(
    (c) => c.fromLevel === state.currentLevel && c.toLevel === targetLevel,
  );

  const errorRate =
    state.totalExecutions > 0 ? state.errorCount / state.totalExecutions : 0;
  const evalScore = Number(state.evalScoreAvg);

  const currentMetrics = {
    executions: state.totalExecutions,
    evalScore,
    errorRate,
  };

  if (!criteria) {
    return {
      canPromote: false,
      reasons: [`no promotion path from ${state.currentLevel} to ${targetLevel}`],
      currentMetrics,
      requiredMetrics: null,
    };
  }

  const reasons: string[] = [];
  if (state.totalExecutions < criteria.minExecutions) {
    reasons.push(
      `executions ${state.totalExecutions} < required ${criteria.minExecutions}`,
    );
  }
  if (evalScore < criteria.minEvalScore) {
    reasons.push(
      `eval score ${evalScore.toFixed(2)} < required ${criteria.minEvalScore}`,
    );
  }
  if (errorRate > criteria.maxErrorRate) {
    reasons.push(
      `error rate ${(errorRate * 100).toFixed(2)}% > max ${(criteria.maxErrorRate * 100).toFixed(2)}%`,
    );
  }

  return {
    canPromote: reasons.length === 0,
    reasons: reasons.length === 0 ? ['all criteria met'] : reasons,
    currentMetrics,
    requiredMetrics: criteria,
  };
}
