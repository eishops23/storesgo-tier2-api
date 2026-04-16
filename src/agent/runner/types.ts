// Agent Suite — AgentRunner type definitions (Phase 0 Part D)

import type { AiAutonomyLevel } from '@prisma/client';
import type { LLMStepInfo } from '../types/llm.types.js';

export interface RunInput {
  userText: string;
  featureKey: string;
  conversationId?: string;
  channel?: 'chat' | 'voice' | 'email' | 'whatsapp' | 'sms' | 'webhook';
  identityId?: string;
  externalId?: string;
  systemPrompt?: string;
  maxSteps?: number;
  metadata?: Record<string, unknown>;
  correlationId?: string;
  costBudgetOverrideCents?: number;
  userId?: string;
  /**
   * Optional. Set when the dispatching feature has resolved a seller
   * identity (e.g. Phase 11 Reviews Agent). Forwarded into ToolContext
   * so seller-scoped tools can enforce ownership checks.
   */
  sellerId?: number;
  /**
   * Optional. Set when the dispatching feature has resolved an admin
   * identity (e.g. Phase 9 SEO Agent). Forwarded into ToolContext so
   * admin-scoped tools can enforce gates and so the tool-adapter can
   * fire the synchronous admin audit log write.
   */
  adminId?: number;
}

export interface RunResult {
  text: string;
  conversationId: string;
  userMessageId: string;
  assistantMessageId: string;
  toolCallsExecuted: number;
  toolCallIds: string[];
  autonomyLevel: AiAutonomyLevel;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  costUsd: number;
  durationMs: number;
  finishReason: string;
  steps?: LLMStepInfo[];
  correlationId: string;
}

export interface AgentRunnerConfig {
  defaultMaxSteps?: number;
  defaultSystemPrompt?: string;
  registry?: import('../tools/registry.js').ToolRegistry;
}
