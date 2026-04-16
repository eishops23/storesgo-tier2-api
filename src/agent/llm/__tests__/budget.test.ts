// Agent Suite — Budget tracking tests (Phase 0.9)

import { describe, it, expect, beforeEach } from 'vitest';
import {
  initSession,
  checkBudget,
  recordUsage,
  getSessionUsage,
  resetSession,
  _clearAllSessions,
  DEFAULT_BUDGET,
} from '../budget.js';

describe('budget', () => {
  beforeEach(() => {
    _clearAllSessions();
  });

  describe('initSession', () => {
    it('creates session with zero usage and default limits', () => {
      initSession('s1');
      const usage = getSessionUsage('s1');
      expect(usage).toEqual({ totalTokens: 0, totalCostUsd: 0 });
    });

    it('creates session with existing cost pre-loaded', () => {
      initSession('s1', { existingCostUsd: 0.15 });
      const usage = getSessionUsage('s1');
      expect(usage?.totalCostUsd).toBe(0.15);
    });

    it('creates session with existing tokens pre-loaded', () => {
      initSession('s1', { existingTokens: 1000 });
      const usage = getSessionUsage('s1');
      expect(usage?.totalTokens).toBe(1000);
    });
  });

  describe('checkBudget with default limits', () => {
    it('does not throw when under budget', () => {
      initSession('s1');
      recordUsage('s1', { promptTokens: 100, completionTokens: 50, totalTokens: 150, estimatedCostUsd: 0.001 });
      expect(() => checkBudget('s1')).not.toThrow();
    });

    it('throws when cost exceeds default $5 limit', () => {
      initSession('s1');
      recordUsage('s1', { promptTokens: 0, completionTokens: 0, totalTokens: 0, estimatedCostUsd: 5.01 });
      expect(() => checkBudget('s1')).toThrow('Cost budget exceeded');
    });

    it('throws when tokens exceed default 500K limit', () => {
      initSession('s1');
      recordUsage('s1', { promptTokens: 500001, completionTokens: 0, totalTokens: 500001, estimatedCostUsd: 0 });
      expect(() => checkBudget('s1')).toThrow('Token budget exceeded');
    });
  });

  describe('checkBudget with per-session overrides', () => {
    it('enforces maxCostUsdOverride of $0.25', () => {
      initSession('s1', { maxCostUsdOverride: 0.25 });

      recordUsage('s1', { promptTokens: 0, completionTokens: 0, totalTokens: 0, estimatedCostUsd: 0.20 });
      expect(() => checkBudget('s1')).not.toThrow();

      recordUsage('s1', { promptTokens: 0, completionTokens: 0, totalTokens: 0, estimatedCostUsd: 0.10 });
      expect(() => checkBudget('s1')).toThrow('Cost budget exceeded');
    });

    it('enforces maxTokensOverride', () => {
      initSession('s1', { maxTokensOverride: 1000 });

      recordUsage('s1', { promptTokens: 500, completionTokens: 0, totalTokens: 500, estimatedCostUsd: 0 });
      expect(() => checkBudget('s1')).not.toThrow();

      recordUsage('s1', { promptTokens: 600, completionTokens: 0, totalTokens: 600, estimatedCostUsd: 0 });
      expect(() => checkBudget('s1')).toThrow('Token budget exceeded');
    });

    it('combines existing cost with new usage', () => {
      initSession('s1', { existingCostUsd: 0.20, maxCostUsdOverride: 0.25 });
      expect(() => checkBudget('s1')).not.toThrow();

      recordUsage('s1', { promptTokens: 0, completionTokens: 0, totalTokens: 0, estimatedCostUsd: 0.06 });
      expect(() => checkBudget('s1')).toThrow('Cost budget exceeded');
    });
  });

  describe('recordUsage', () => {
    it('accumulates across multiple calls', () => {
      initSession('s1');
      recordUsage('s1', { promptTokens: 100, completionTokens: 50, totalTokens: 150, estimatedCostUsd: 0.001 });
      recordUsage('s1', { promptTokens: 200, completionTokens: 100, totalTokens: 300, estimatedCostUsd: 0.002 });

      const usage = getSessionUsage('s1');
      expect(usage?.totalTokens).toBe(450);
      expect(usage?.totalCostUsd).toBeCloseTo(0.003);
    });

    it('auto-inits session with defaults if not explicitly initialized', () => {
      recordUsage('auto', { promptTokens: 100, completionTokens: 50, totalTokens: 150, estimatedCostUsd: 0.001 });

      const usage = getSessionUsage('auto');
      expect(usage?.totalTokens).toBe(150);
      expect(usage?.totalCostUsd).toBe(0.001);
    });
  });

  describe('resetSession', () => {
    it('removes session data', () => {
      initSession('s1');
      resetSession('s1');
      expect(getSessionUsage('s1')).toBeUndefined();
    });
  });

  it('checkBudget does not throw for unknown session', () => {
    expect(() => checkBudget('unknown')).not.toThrow();
  });
});
