// Agent Suite — Per-session token budget tracking (Phase 0 Part A, hardened Phase 0.9)

import type { LLMUsage } from '../types/llm.types.js';
import { LLMBudgetExceededError } from '../types/llm.types.js';

export interface BudgetLimits {
  maxTokensPerSession: number;
  maxCostUsdPerSession: number;
}

export const DEFAULT_BUDGET: BudgetLimits = {
  maxTokensPerSession: 500_000,
  maxCostUsdPerSession: 5.00,
};

interface SessionUsage {
  totalTokens: number;
  totalCostUsd: number;
  maxTokens: number;
  maxCostUsd: number;
}

const sessions = new Map<string, SessionUsage>();

export interface InitSessionOptions {
  existingCostUsd?: number;
  existingTokens?: number;
  maxCostUsdOverride?: number;
  maxTokensOverride?: number;
}

export function initSession(sessionId: string, options?: InitSessionOptions): void {
  sessions.set(sessionId, {
    totalTokens: options?.existingTokens ?? 0,
    totalCostUsd: options?.existingCostUsd ?? 0,
    maxTokens: options?.maxTokensOverride ?? DEFAULT_BUDGET.maxTokensPerSession,
    maxCostUsd: options?.maxCostUsdOverride ?? DEFAULT_BUDGET.maxCostUsdPerSession,
  });
}

export function checkBudget(sessionId: string): void {
  const usage = sessions.get(sessionId);
  if (!usage) return; // No usage recorded yet — allow

  if (usage.totalTokens >= usage.maxTokens) {
    throw new LLMBudgetExceededError(
      `Token budget exceeded for session ${sessionId}: ${usage.totalTokens} >= ${usage.maxTokens}`,
      sessionId,
      usage.totalTokens,
      usage.maxTokens,
    );
  }

  if (usage.totalCostUsd >= usage.maxCostUsd) {
    throw new LLMBudgetExceededError(
      `Cost budget exceeded for session ${sessionId}: $${usage.totalCostUsd.toFixed(4)} >= $${usage.maxCostUsd.toFixed(2)}`,
      sessionId,
      usage.totalCostUsd,
      usage.maxCostUsd,
    );
  }
}

export function recordUsage(sessionId: string, usage: LLMUsage): void {
  const current = sessions.get(sessionId);
  if (!current) {
    // Auto-init with defaults if not explicitly initialized
    sessions.set(sessionId, {
      totalTokens: usage.totalTokens,
      totalCostUsd: usage.estimatedCostUsd,
      maxTokens: DEFAULT_BUDGET.maxTokensPerSession,
      maxCostUsd: DEFAULT_BUDGET.maxCostUsdPerSession,
    });
    return;
  }
  current.totalTokens += usage.totalTokens;
  current.totalCostUsd += usage.estimatedCostUsd;
}

export function getSessionUsage(sessionId: string): { totalTokens: number; totalCostUsd: number } | undefined {
  const s = sessions.get(sessionId);
  if (!s) return undefined;
  return { totalTokens: s.totalTokens, totalCostUsd: s.totalCostUsd };
}

export function resetSession(sessionId: string): void {
  sessions.delete(sessionId);
}

export function _clearAllSessions(): void {
  sessions.clear();
}
