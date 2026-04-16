// Agent Suite — Conversation repository (Phase 0 Part B)

import type {
  PrismaClient,
  AiConversation,
  AiMessage,
  AiToolCall,
  AiChannel,
  AiConversationStatus,
  AiMessageRole,
  AiToolCallStatus,
  AiAutonomyLevel,
} from '@prisma/client';
import { Prisma } from '@prisma/client';
import { getPrisma } from './prisma-client.js';

// --- Input types ---

export interface CreateConversationInput {
  identityId?: string;
  channel: AiChannel;
  featureKey: string;
  externalId?: string;
  metadata?: Prisma.InputJsonValue;
}

export interface AppendMessageInput {
  role: AiMessageRole;
  content: string;
  provider?: string;
  model?: string;
  tokensIn?: number;
  tokensOut?: number;
  costUsd?: number;
  finishReason?: string;
}

export interface AppendToolCallInput {
  toolName: string;
  argsJson: Prisma.InputJsonValue;
  autonomyLevelAtExecution: AiAutonomyLevel;
}

// --- Result types ---

type ConversationWithMessages = AiConversation & {
  messages: (AiMessage & { toolCalls: AiToolCall[] })[];
};

// --- Repository functions ---

export async function createConversation(
  input: CreateConversationInput,
  db: PrismaClient = getPrisma(),
): Promise<AiConversation> {
  return db.aiConversation.create({
    data: {
      identityId: input.identityId ?? null,
      channel: input.channel,
      featureKey: input.featureKey,
      externalId: input.externalId ?? null,
      metadata: input.metadata ?? Prisma.JsonNull,
    },
  });
}

export async function getConversationById(
  id: string,
  db: PrismaClient = getPrisma(),
): Promise<ConversationWithMessages | null> {
  return db.aiConversation.findUnique({
    where: { id },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
        take: 50,
        include: { toolCalls: true },
      },
    },
  });
}

export async function appendMessage(
  conversationId: string,
  input: AppendMessageInput,
  db: PrismaClient = getPrisma(),
): Promise<AiMessage> {
  const tokensIn = input.tokensIn ?? 0;
  const tokensOut = input.tokensOut ?? 0;
  const costUsd = input.costUsd ?? 0;

  return db.$transaction(async (tx) => {
    const message = await tx.aiMessage.create({
      data: {
        conversationId,
        role: input.role,
        content: input.content,
        provider: input.provider ?? null,
        model: input.model ?? null,
        tokensIn,
        tokensOut,
        costUsd,
        finishReason: input.finishReason ?? null,
      },
    });

    await tx.aiConversation.update({
      where: { id: conversationId },
      data: {
        messageCount: { increment: 1 },
        totalTokensUsed: { increment: tokensIn + tokensOut },
        totalCostUsd: { increment: costUsd },
        lastMessageAt: new Date(),
      },
    });

    return message;
  });
}

export async function appendToolCall(
  messageId: string,
  input: AppendToolCallInput,
  db: PrismaClient = getPrisma(),
): Promise<AiToolCall> {
  return db.aiToolCall.create({
    data: {
      messageId,
      toolName: input.toolName,
      argsJson: input.argsJson,
      autonomyLevelAtExecution: input.autonomyLevelAtExecution,
    },
  });
}

export async function updateToolCallResult(
  toolCallId: string,
  result: Prisma.InputJsonValue,
  durationMs: number,
  db: PrismaClient = getPrisma(),
): Promise<AiToolCall> {
  return db.aiToolCall.update({
    where: { id: toolCallId },
    data: {
      resultJson: result,
      status: 'success' as AiToolCallStatus,
      durationMs,
    },
  });
}

export async function markToolCallError(
  toolCallId: string,
  errorMessage: string,
  db: PrismaClient = getPrisma(),
): Promise<AiToolCall> {
  return db.aiToolCall.update({
    where: { id: toolCallId },
    data: {
      status: 'error' as AiToolCallStatus,
      errorMessage,
    },
  });
}

export async function markToolCallTimeout(
  toolCallId: string,
  durationMs: number,
  db: PrismaClient = getPrisma(),
): Promise<AiToolCall> {
  return db.aiToolCall.update({
    where: { id: toolCallId },
    data: {
      status: 'timeout' as AiToolCallStatus,
      durationMs,
      errorMessage: `Tool execution timed out after ${durationMs}ms`,
    },
  });
}

export async function closeConversation(
  id: string,
  status: AiConversationStatus,
  db: PrismaClient = getPrisma(),
): Promise<AiConversation> {
  return db.aiConversation.update({
    where: { id },
    data: {
      status,
      closedAt: new Date(),
    },
  });
}

export async function listActiveConversations(
  featureKey?: string,
  limit: number = 50,
  db: PrismaClient = getPrisma(),
): Promise<AiConversation[]> {
  return db.aiConversation.findMany({
    where: {
      status: 'active',
      ...(featureKey ? { featureKey } : {}),
    },
    orderBy: { lastMessageAt: 'desc' },
    take: limit,
  });
}
