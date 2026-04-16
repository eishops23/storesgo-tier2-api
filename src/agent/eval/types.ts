// Agent Suite — Eval scorer types (Phase 0 Part E)

import type { RunResult } from '../runner/types.js';

export interface EvalScore {
  score: number;
  reasoning: string;
  scorerName: string;
}

export interface EvalScorer {
  name: string;
  scoreRun(result: RunResult): Promise<EvalScore | null>;
}
