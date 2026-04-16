// Agent Suite — AgentRunner: ties LLM + tools + storage into a working agent loop (Phase 0 Part D, hardened Phase 0.9)

import type { AiChannel } from '@prisma/client';
import { Prisma } from '@prisma/client';
import type { RunInput, RunResult, AgentRunnerConfig } from './types.js';
import { llmCall } from '../llm/client.js';
import { ConversationRepo } from '../storage/index.js';
import { isFeatureAllowed, getEffectiveLevel } from '../flags/index.js';
import { getPrisma } from '../storage/prisma-client.js';
import { buildAllRegisteredTools } from './tool-adapter.js';
import type { ToolRegistry } from '../tools/registry.js';
import { loadConversationHistory } from './message-history.js';
import { createChildLogger, createCorrelationId } from '../observability/index.js';
import { initSession } from '../llm/budget.js';
import { isShuttingDown } from './shutdown.js';

const DEFAULT_MAX_STEPS = 5;
const DEFAULT_SYSTEM_PROMPT = `You are a helpful AI assistant for StoresGo, a multi-vendor ethnic grocery marketplace serving South Florida. Be warm, respectful, and culturally aware. When customers ask about products or orders, use the tools available to look up real information — do not make up facts.`;
const DEFAULT_CONVERSATION_BUDGET_USD = 0.25;

const log = createChildLogger({ subsystem: 'runner' });

export class AgentRunner {
  private maxSteps: number;
  private defaultSystemPrompt: string;
  private registry?: ToolRegistry;

  constructor(config: AgentRunnerConfig = {}) {
    this.maxSteps = config.defaultMaxSteps ?? DEFAULT_MAX_STEPS;
    this.defaultSystemPrompt = config.defaultSystemPrompt ?? DEFAULT_SYSTEM_PROMPT;
    this.registry = config.registry;
  }

  async run(input: RunInput): Promise<RunResult> {
    const startTime = Date.now();
    const correlationId = input.correlationId ?? createCorrelationId();
    const runLog = log.child({ correlationId, featureKey: input.featureKey });

    runLog.info({ event: 'agent.run.start', userTextLength: input.userText.length }, 'Agent run started');

    // SHUTDOWN GUARD — refuse new work if shutting down
    if (isShuttingDown()) {
      runLog.warn({ event: 'agent.run.rejected' }, 'Rejected: server is shutting down');
      return {
        text: 'The server is restarting. Please try again in a moment.',
        conversationId: '',
        userMessageId: '',
        assistantMessageId: '',
        toolCallsExecuted: 0,
        toolCallIds: [],
        autonomyLevel: 'L0',
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        costUsd: 0,
        durationMs: Date.now() - startTime,
        finishReason: 'shutdown',
        correlationId,
      };
    }

    // FEATURE FLAG GUARD — disabled features get a polite response, no DB writes, no LLM calls
    if (!isFeatureAllowed(input.featureKey)) {
      runLog.info({ event: 'agent.run.blocked', reason: 'feature_disabled' }, 'Feature disabled');
      return {
        text: 'This feature is currently unavailable. Please try again later or contact support.',
        conversationId: '',
        userMessageId: '',
        assistantMessageId: '',
        toolCallsExecuted: 0,
        toolCallIds: [],
        autonomyLevel: 'L0',
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        costUsd: 0,
        durationMs: Date.now() - startTime,
        finishReason: 'feature_disabled',
        correlationId,
      };
    }

    // 1. Get or create conversation
    let conversation;
    if (input.conversationId) {
      conversation = await ConversationRepo.getConversationById(input.conversationId);
      if (!conversation) {
        throw new Error(`Conversation not found: ${input.conversationId}`);
      }
    } else {
      conversation = await ConversationRepo.createConversation({
        channel: (input.channel ?? 'chat') as AiChannel,
        featureKey: input.featureKey,
        identityId: input.identityId,
        externalId: input.externalId,
        metadata: (input.metadata as Prisma.InputJsonValue) ?? Prisma.JsonNull,
      });
    }

    // 2. PER-FEATURE COST CAP — check aggregate spend across all conversations for this feature
    const prisma = getPrisma();
    const featureState = await prisma.aiAutonomyState.findUnique({
      where: { featureKey: input.featureKey },
      select: { costBudgetCents: true },
    });
    const featureBudgetUsd = (featureState?.costBudgetCents ?? 50000) / 100; // default $500

    const featureAggregate = await prisma.aiConversation.aggregate({
      where: { featureKey: input.featureKey },
      _sum: { totalCostUsd: true },
    });
    const featureTotalCostUsd = Number(featureAggregate._sum.totalCostUsd ?? 0);

    if (featureTotalCostUsd >= featureBudgetUsd) {
      runLog.error(
        {
          event: 'agent.run.feature_budget_exceeded',
          featureKey: input.featureKey,
          featureTotalCostUsd,
          featureBudgetUsd,
        },
        'Feature-level cost budget exceeded',
      );
      return {
        text: 'This service has temporarily reached its usage limit. Please contact support.',
        conversationId: conversation.id,
        userMessageId: '',
        assistantMessageId: '',
        toolCallsExecuted: 0,
        toolCallIds: [],
        autonomyLevel: 'L0',
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        costUsd: 0,
        durationMs: Date.now() - startTime,
        finishReason: 'feature_budget_exceeded',
        correlationId,
      };
    }

    // 3. PER-CONVERSATION COST CAP — check this conversation's accumulated cost
    const existingCostUsd = Number(conversation.totalCostUsd ?? 0);
    const conversationBudgetUsd = input.costBudgetOverrideCents
      ? input.costBudgetOverrideCents / 100
      : DEFAULT_CONVERSATION_BUDGET_USD;

    if (existingCostUsd >= conversationBudgetUsd) {
      runLog.warn(
        { event: 'agent.run.budget_exceeded', existingCostUsd, conversationBudgetUsd, conversationId: conversation.id },
        'Conversation budget already exceeded',
      );
      return {
        text: 'This conversation has reached its cost limit. Please start a new conversation or contact support.',
        conversationId: conversation.id,
        userMessageId: '',
        assistantMessageId: '',
        toolCallsExecuted: 0,
        toolCallIds: [],
        autonomyLevel: 'L0',
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        costUsd: 0,
        durationMs: Date.now() - startTime,
        finishReason: 'budget_exceeded',
        correlationId,
      };
    }

    // 4. Seed the in-memory budget tracker with existing spend AND the conversation cap
    //    so that llm/client.ts checkBudget() enforces the correct per-conversation ceiling
    initSession(conversation.id, {
      existingCostUsd: existingCostUsd > 0 ? existingCostUsd : undefined,
      maxCostUsdOverride: conversationBudgetUsd,
    });

    // 5. Append the user message
    const userMessage = await ConversationRepo.appendMessage(conversation.id, {
      role: 'user',
      content: input.userText,
    });

    // 6. Load conversation history BEFORE creating the empty placeholder
    const history = await loadConversationHistory(conversation.id);

    // 7. Create a placeholder assistant message BEFORE LLM call
    const placeholderAssistant = await ConversationRepo.appendMessage(conversation.id, {
      role: 'assistant',
      content: '',
    });

    // 8. Build tools with current context
    const tools = buildAllRegisteredTools({
      sessionId: conversation.id,
      featureKey: input.featureKey,
      conversationId: conversation.id,
      messageId: placeholderAssistant.id,
      identityId: input.identityId,
      userId: input.userId,
      sellerId: input.sellerId,
      adminId: input.adminId,
    }, this.registry);

    // 9. Compute prompt hash for drift tracking
    const systemPrompt = input.systemPrompt ?? this.defaultSystemPrompt;
    let promptHash: string | undefined;
    try {
      const { createHash } = await import('node:crypto');
      promptHash = createHash('sha256').update(systemPrompt).digest('hex').slice(0, 16);
    } catch {
      // crypto unavailable — skip hash
    }

    // 10. Call the LLM with tools enabled
    const llmResponse = await llmCall(history, {
      taskType: 'reasoning',
      systemPrompt,
      sessionId: conversation.id,
      tools,
      maxSteps: input.maxSteps ?? this.maxSteps,
    });

    // 11. POST-CALL COST OVERSHOOT CHECK — log warning if this call pushed over budget
    const postCallTotalCostUsd = existingCostUsd + llmResponse.usage.estimatedCostUsd;
    if (postCallTotalCostUsd >= conversationBudgetUsd) {
      runLog.warn(
        {
          event: 'agent.run.budget_overshoot',
          conversationId: conversation.id,
          existingCostUsd,
          callCostUsd: llmResponse.usage.estimatedCostUsd,
          postCallTotalCostUsd,
          conversationBudgetUsd,
        },
        'Conversation budget exceeded after LLM call (next call will be blocked)',
      );
    }

    // 12. Update the placeholder assistant message with final text + usage + promptHash
    await prisma.aiMessage.update({
      where: { id: placeholderAssistant.id },
      data: {
        content: llmResponse.text,
        provider: llmResponse.provider,
        model: llmResponse.model,
        tokensIn: llmResponse.usage.promptTokens,
        tokensOut: llmResponse.usage.completionTokens,
        costUsd: llmResponse.usage.estimatedCostUsd,
        finishReason: llmResponse.finishReason,
        ...(promptHash ? { promptHash } : {}),
      },
    });

    // 13. Update conversation totals
    await prisma.aiConversation.update({
      where: { id: conversation.id },
      data: {
        totalTokensUsed: { increment: llmResponse.usage.totalTokens },
        totalCostUsd: { increment: llmResponse.usage.estimatedCostUsd },
        lastMessageAt: new Date(),
      },
    });

    // 14. Collect tool call IDs from the response steps
    const toolCallIds: string[] = [];
    if (llmResponse.steps) {
      for (const step of llmResponse.steps) {
        for (const tc of step.toolCalls) {
          toolCallIds.push(tc.toolCallId);
        }
      }
    }

    // 15. Get current autonomy level (respects flag-based caps)
    const currentAutonomy = await getEffectiveLevel(input.featureKey);

    const durationMs = Date.now() - startTime;

    runLog.info(
      {
        event: 'agent.run.complete',
        conversationId: conversation.id,
        durationMs,
        costUsd: llmResponse.usage.estimatedCostUsd,
        tokens: llmResponse.usage.totalTokens,
        toolCallsExecuted: llmResponse.toolCallsExecuted ?? 0,
        finishReason: llmResponse.finishReason,
      },
      'Agent run completed',
    );

    return {
      text: llmResponse.text,
      conversationId: conversation.id,
      userMessageId: userMessage.id,
      assistantMessageId: placeholderAssistant.id,
      toolCallsExecuted: llmResponse.toolCallsExecuted ?? 0,
      toolCallIds,
      autonomyLevel: currentAutonomy,
      promptTokens: llmResponse.usage.promptTokens,
      completionTokens: llmResponse.usage.completionTokens,
      totalTokens: llmResponse.usage.totalTokens,
      costUsd: llmResponse.usage.estimatedCostUsd,
      durationMs,
      finishReason: llmResponse.finishReason,
      steps: llmResponse.steps,
      correlationId,
    };
  }
}

let defaultRunner: AgentRunner | undefined;

export function getDefaultRunner(): AgentRunner {
  if (!defaultRunner) defaultRunner = new AgentRunner();
  return defaultRunner;
}

export function resetDefaultRunner(): void {
  defaultRunner = undefined;
}
