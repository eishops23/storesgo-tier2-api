// Agent Suite — Basic heuristic scorer (Phase 0 Part E)

import type { EvalScorer, EvalScore } from './types.js';
import type { RunResult } from '../runner/types.js';

export class BasicHeuristicScorer implements EvalScorer {
  name = 'basic-heuristic';

  async scoreRun(result: RunResult): Promise<EvalScore | null> {
    let score = 3.0;
    const reasons: string[] = [];

    if (result.finishReason === 'error') {
      score -= 2.0;
      reasons.push('finish reason is error (-2.0)');
    } else if (result.finishReason === 'length') {
      score -= 1.0;
      reasons.push('response hit token limit (-1.0)');
    }

    if (result.toolCallsExecuted > 0) {
      score += 0.5;
      reasons.push(`used ${result.toolCallsExecuted} tool(s) (+0.5)`);
    }

    const len = result.text.length;
    if (len > 50 && len < 2000) {
      score += 0.5;
      reasons.push(`response length ${len} is in healthy range (+0.5)`);
    } else if (len < 20) {
      score -= 1.0;
      reasons.push(`response length ${len} is too short (-1.0)`);
    }

    score = Math.max(0, Math.min(5, score));

    return {
      score,
      reasoning: reasons.join('; ') || 'no adjustments',
      scorerName: this.name,
    };
  }
}
