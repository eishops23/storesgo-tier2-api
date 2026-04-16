// Agent Suite — Model catalog and cost estimation (Phase 0 Part A)

import type { LLMProvider, LLMTaskType } from '../types/llm.types.js';

export interface ModelEntry {
  modelId: string;
  provider: LLMProvider;
  displayName: string;
  contextWindow: number;
  inputCostPer1M: number;
  outputCostPer1M: number;
}

export const MODELS: Record<string, ModelEntry> = {
  'claude-sonnet-4-6': {
    modelId: 'claude-sonnet-4-6',
    provider: 'anthropic',
    displayName: 'Claude Sonnet 4.6',
    contextWindow: 200_000,
    inputCostPer1M: 3,
    outputCostPer1M: 15,
  },
  'claude-opus-4-6': {
    modelId: 'claude-opus-4-6',
    provider: 'anthropic',
    displayName: 'Claude Opus 4.6',
    contextWindow: 1_000_000,
    inputCostPer1M: 15,
    outputCostPer1M: 75,
  },
  'claude-haiku-4-5': {
    modelId: 'claude-haiku-4-5-20251001',
    provider: 'anthropic',
    displayName: 'Claude Haiku 4.5',
    contextWindow: 200_000,
    inputCostPer1M: 1,
    outputCostPer1M: 5,
  },
  'gpt-4o-mini': {
    modelId: 'gpt-4o-mini',
    provider: 'openai',
    displayName: 'GPT-4o Mini',
    contextWindow: 128_000,
    inputCostPer1M: 0.15,
    outputCostPer1M: 0.60,
  },
  'gemini-2-0-flash': {
    modelId: 'gemini-2.0-flash',
    provider: 'google',
    displayName: 'Gemini 2.0 Flash',
    contextWindow: 1_000_000,
    inputCostPer1M: 0.075,
    outputCostPer1M: 0.30,
  },
};

export const DEFAULT_MODELS: Record<LLMTaskType, string> = {
  reasoning: 'claude-sonnet-4-6',
  classification: 'claude-haiku-4-5',
  extraction: 'claude-haiku-4-5',
  summarization: 'claude-haiku-4-5',
};

export function getModelConfig(modelKey: string): ModelEntry {
  const entry = MODELS[modelKey];
  if (!entry) {
    throw new Error(`Unknown model key: ${modelKey}. Available: ${Object.keys(MODELS).join(', ')}`);
  }
  return entry;
}

export function getDefaultModelForTask(taskType: LLMTaskType): ModelEntry {
  const modelKey = DEFAULT_MODELS[taskType];
  return getModelConfig(modelKey);
}

export function estimateCost(modelKey: string, promptTokens: number, completionTokens: number): number {
  const entry = getModelConfig(modelKey);
  const inputCost = (promptTokens / 1_000_000) * entry.inputCostPer1M;
  const outputCost = (completionTokens / 1_000_000) * entry.outputCostPer1M;
  return inputCost + outputCost;
}
