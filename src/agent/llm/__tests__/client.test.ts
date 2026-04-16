// Agent Suite — LLM client unit tests (Phase 0 Part A)

import { describe, it, expect, beforeEach } from 'vitest';
import { MODELS, DEFAULT_MODELS, getModelConfig, getDefaultModelForTask, estimateCost } from '../models.js';
import { initSession, checkBudget, recordUsage, getSessionUsage, resetSession, _clearAllSessions } from '../budget.js';
import { LLMBudgetExceededError } from '../../types/llm.types.js';

describe('models', () => {
  it('defaults to Claude Sonnet 4.6 for reasoning tasks', () => {
    const model = getDefaultModelForTask('reasoning');
    expect(model.modelId).toBe('claude-sonnet-4-6');
    expect(model.provider).toBe('anthropic');
  });

  it('defaults to Claude Haiku 4.5 for classification tasks', () => {
    const model = getDefaultModelForTask('classification');
    expect(model.modelId).toBe('claude-haiku-4-5-20251001');
    expect(model.provider).toBe('anthropic');
  });

  it('defaults to Claude Haiku 4.5 for extraction tasks', () => {
    const model = getDefaultModelForTask('extraction');
    expect(model.modelId).toBe('claude-haiku-4-5-20251001');
  });

  it('defaults to Claude Haiku 4.5 for summarization tasks', () => {
    const model = getDefaultModelForTask('summarization');
    expect(model.modelId).toBe('claude-haiku-4-5-20251001');
  });

  it('has all three providers in catalog', () => {
    const providers = new Set(Object.values(MODELS).map(m => m.provider));
    expect(providers.has('anthropic')).toBe(true);
    expect(providers.has('openai')).toBe(true);
    expect(providers.has('google')).toBe(true);
  });

  it('estimates cost for Claude Sonnet 4.6 correctly', () => {
    // 1000 prompt tokens at $3/1M = $0.003
    // 500 completion tokens at $15/1M = $0.0075
    // Total = $0.0105
    const cost = estimateCost('claude-sonnet-4-6', 1000, 500);
    expect(cost).toBeCloseTo(0.0105, 6);
  });

  it('throws for unknown model key', () => {
    expect(() => getModelConfig('nonexistent-model')).toThrow('Unknown model key');
  });
});

describe('budget', () => {
  beforeEach(() => {
    _clearAllSessions();
  });

  it('allows calls under budget', () => {
    initSession('test-1');
    recordUsage('test-1', {
      promptTokens: 100,
      completionTokens: 50,
      totalTokens: 150,
      estimatedCostUsd: 0.001,
    });
    // Should not throw
    expect(() => checkBudget('test-1')).not.toThrow();
  });

  it('records usage cumulatively', () => {
    initSession('test-2');
    recordUsage('test-2', {
      promptTokens: 100,
      completionTokens: 50,
      totalTokens: 150,
      estimatedCostUsd: 0.001,
    });
    recordUsage('test-2', {
      promptTokens: 200,
      completionTokens: 100,
      totalTokens: 300,
      estimatedCostUsd: 0.002,
    });
    const usage = getSessionUsage('test-2');
    expect(usage?.totalTokens).toBe(450);
    expect(usage?.totalCostUsd).toBeCloseTo(0.003, 6);
  });

  it('throws LLMBudgetExceededError when tokens exceed limit', () => {
    initSession('test-3');
    recordUsage('test-3', {
      promptTokens: 400_000,
      completionTokens: 100_001,
      totalTokens: 500_001,
      estimatedCostUsd: 1.0,
    });
    expect(() => checkBudget('test-3')).toThrow(LLMBudgetExceededError);
  });

  it('throws LLMBudgetExceededError when cost exceeds limit', () => {
    initSession('test-4');
    recordUsage('test-4', {
      promptTokens: 1000,
      completionTokens: 500,
      totalTokens: 1500,
      estimatedCostUsd: 5.01,
    });
    expect(() => checkBudget('test-4')).toThrow(LLMBudgetExceededError);
  });

  it('resetSession clears usage', () => {
    initSession('test-5');
    recordUsage('test-5', {
      promptTokens: 1000,
      completionTokens: 500,
      totalTokens: 1500,
      estimatedCostUsd: 1.0,
    });
    resetSession('test-5');
    expect(getSessionUsage('test-5')).toBeUndefined();
  });
});
