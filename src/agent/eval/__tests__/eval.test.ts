// Agent Suite — Eval scorer + registry tests (Phase 0 Part E)

import { describe, it, expect, beforeEach } from 'vitest';
import { BasicHeuristicScorer } from '../basic-scorer.js';
import {
  EvalRegistry,
  getDefaultEvalRegistry,
  resetDefaultEvalRegistry,
} from '../registry.js';
import type { RunResult } from '../../runner/types.js';

function makeResult(overrides: Partial<RunResult> = {}): RunResult {
  return {
    text: 'Here are some Caribbean sauces we carry.',
    conversationId: 'conv-1',
    userMessageId: 'msg-1',
    assistantMessageId: 'msg-2',
    toolCallsExecuted: 1,
    toolCallIds: ['tc-1'],
    autonomyLevel: 'L1',
    promptTokens: 100,
    completionTokens: 50,
    totalTokens: 150,
    costUsd: 0.001,
    durationMs: 500,
    finishReason: 'stop',
    correlationId: 'test-corr-1',
    ...overrides,
  };
}

describe('BasicHeuristicScorer', () => {
  const scorer = new BasicHeuristicScorer();

  it('returns score in 0-5 range', async () => {
    const result = await scorer.scoreRun(makeResult());
    expect(result).not.toBeNull();
    expect(result!.score).toBeGreaterThanOrEqual(0);
    expect(result!.score).toBeLessThanOrEqual(5);
  });

  it('penalizes error finish reason', async () => {
    const normal = await scorer.scoreRun(makeResult());
    const error = await scorer.scoreRun(makeResult({ finishReason: 'error' }));
    expect(error!.score).toBeLessThan(normal!.score);
    expect(error!.reasoning).toContain('error');
  });

  it('penalizes length finish reason', async () => {
    const normal = await scorer.scoreRun(makeResult());
    const length = await scorer.scoreRun(makeResult({ finishReason: 'length' }));
    expect(length!.score).toBeLessThan(normal!.score);
  });

  it('rewards tool usage', async () => {
    const noTools = await scorer.scoreRun(makeResult({ toolCallsExecuted: 0 }));
    const withTools = await scorer.scoreRun(makeResult({ toolCallsExecuted: 3 }));
    expect(withTools!.score).toBeGreaterThan(noTools!.score);
  });

  it('penalizes very short responses', async () => {
    const short = await scorer.scoreRun(makeResult({ text: 'ok' }));
    const normal = await scorer.scoreRun(makeResult());
    expect(short!.score).toBeLessThan(normal!.score);
    expect(short!.reasoning).toContain('too short');
  });

  it('has correct scorer name', async () => {
    const result = await scorer.scoreRun(makeResult());
    expect(result!.scorerName).toBe('basic-heuristic');
  });
});

describe('EvalRegistry', () => {
  let registry: EvalRegistry;

  beforeEach(() => {
    registry = new EvalRegistry();
  });

  it('register and get scorer', () => {
    const scorer = new BasicHeuristicScorer();
    registry.register('cs_chat', scorer);
    expect(registry.get('cs_chat')).toBe(scorer);
    expect(registry.size).toBe(1);
  });

  it('returns undefined for unregistered feature', () => {
    expect(registry.get('unknown')).toBeUndefined();
  });

  it('scoreRun delegates to scorer', async () => {
    registry.register('cs_chat', new BasicHeuristicScorer());
    const result = await registry.scoreRun('cs_chat', makeResult());
    expect(result).not.toBeNull();
    expect(result!.score).toBeGreaterThanOrEqual(0);
  });

  it('scoreRun returns null for unregistered feature', async () => {
    const result = await registry.scoreRun('unknown', makeResult());
    expect(result).toBeNull();
  });

  it('clear removes all scorers', () => {
    registry.register('a', new BasicHeuristicScorer());
    registry.register('b', new BasicHeuristicScorer());
    expect(registry.size).toBe(2);
    registry.clear();
    expect(registry.size).toBe(0);
  });
});

describe('default eval registry', () => {
  beforeEach(() => {
    resetDefaultEvalRegistry();
  });

  it('returns a singleton', () => {
    const a = getDefaultEvalRegistry();
    const b = getDefaultEvalRegistry();
    expect(a).toBe(b);
  });

  it('reset creates fresh instance', () => {
    const a = getDefaultEvalRegistry();
    a.register('x', new BasicHeuristicScorer());
    resetDefaultEvalRegistry();
    expect(getDefaultEvalRegistry().size).toBe(0);
  });
});
