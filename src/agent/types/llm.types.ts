// Agent Suite — LLM type definitions (Phase 0 Part A, extended Part D)

import type { z } from 'zod';

export type LLMProvider = 'anthropic' | 'openai' | 'google';

export type LLMTaskType = 'reasoning' | 'classification' | 'extraction' | 'summarization';

export interface LLMConfig {
  provider: LLMProvider;
  model: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
}

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
  toolCallId?: string;
}

export interface LLMUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
}

export interface LLMStepInfo {
  text: string;
  toolCalls: Array<{ toolName: string; args: unknown; toolCallId: string }>;
  toolResults: Array<{ toolCallId: string; result: unknown }>;
  finishReason: string;
}

export interface LLMResponse {
  text: string;
  usage: LLMUsage;
  provider: LLMProvider;
  model: string;
  finishReason: string;
  raw?: unknown;
  steps?: LLMStepInfo[];
  toolCallsExecuted?: number;
  fallbackHops?: number;
  attemptedProviders?: string[];
}

export interface LLMToolDefinition {
  name: string;
  description: string;
  inputSchema: z.ZodType<unknown>;
  execute: (args: unknown) => Promise<unknown>;
}

export interface LLMCallOptions {
  taskType?: LLMTaskType;
  config?: Partial<LLMConfig>;
  systemPrompt?: string;
  maxRetries?: number;
  timeoutMs?: number;
  sessionId?: string;
  tools?: Record<string, LLMToolDefinition>;
  maxSteps?: number;
}

export interface BudgetLimits {
  maxTokensPerSession: number;
  maxCostUsdPerSession: number;
}

export class LLMBudgetExceededError extends Error {
  public readonly sessionId: string;
  public readonly used: number;
  public readonly limit: number;

  constructor(message: string, sessionId: string, used: number, limit: number) {
    super(message);
    this.name = 'LLMBudgetExceededError';
    this.sessionId = sessionId;
    this.used = used;
    this.limit = limit;
  }
}

export class LLMProviderError extends Error {
  public readonly provider: LLMProvider;
  public readonly model: string;
  public readonly cause: unknown;

  constructor(message: string, provider: LLMProvider, model: string, cause: unknown) {
    super(message);
    this.name = 'LLMProviderError';
    this.provider = provider;
    this.model = model;
    this.cause = cause;
  }
}
