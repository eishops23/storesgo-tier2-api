// Agent Suite — Eval scorer registry (Phase 0 Part E)

import type { EvalScorer, EvalScore } from './types.js';
import type { RunResult } from '../runner/types.js';

export class EvalRegistry {
  private scorers = new Map<string, EvalScorer>();

  register(featureKey: string, scorer: EvalScorer): void {
    this.scorers.set(featureKey, scorer);
  }

  get(featureKey: string): EvalScorer | undefined {
    return this.scorers.get(featureKey);
  }

  async scoreRun(featureKey: string, result: RunResult): Promise<EvalScore | null> {
    const scorer = this.scorers.get(featureKey);
    if (!scorer) return null;
    return scorer.scoreRun(result);
  }

  clear(): void {
    this.scorers.clear();
  }

  get size(): number {
    return this.scorers.size;
  }
}

let defaultRegistry: EvalRegistry | undefined;

export function getDefaultEvalRegistry(): EvalRegistry {
  if (!defaultRegistry) defaultRegistry = new EvalRegistry();
  return defaultRegistry;
}

export function resetDefaultEvalRegistry(): void {
  defaultRegistry = undefined;
}
