// Agent Suite — Conversation repository tests (Phase 0 Part B)

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createConversation,
  getConversationById,
  appendMessage,
  appendToolCall,
  updateToolCallResult,
  markToolCallError,
  closeConversation,
  listActiveConversations,
} from '../conversation.repo.js';

function createMockPrisma(): any {
  const mock: any = {
    aiConversation: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
    },
    aiMessage: {
      create: vi.fn(),
    },
    aiToolCall: {
      create: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(async (fn: (tx: any) => Promise<any>) => {
      return fn(mock);
    }),
  };
  return mock;
}

let mockPrisma: any;

beforeEach(() => {
  mockPrisma = createMockPrisma();
});

describe('createConversation', () => {
  it('creates a conversation with required fields', async () => {
    const conv = { id: 'conv-1', channel: 'chat', featureKey: 'cs-agent', status: 'active' };
    mockPrisma.aiConversation.create.mockResolvedValue(conv);

    const result = await createConversation(
      { channel: 'chat', featureKey: 'cs-agent' },
      mockPrisma,
    );

    expect(result.id).toBe('conv-1');
    expect(mockPrisma.aiConversation.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        channel: 'chat',
        featureKey: 'cs-agent',
        identityId: null,
        externalId: null,
      }),
    });
  });

  it('creates a conversation with optional identityId', async () => {
    mockPrisma.aiConversation.create.mockResolvedValue({ id: 'conv-2' });

    await createConversation(
      { channel: 'email', featureKey: 'email-agent', identityId: 'identity-1' },
      mockPrisma,
    );

    expect(mockPrisma.aiConversation.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ identityId: 'identity-1' }),
    });
  });
});

describe('getConversationById', () => {
  it('returns conversation with messages and tool calls', async () => {
    const conv = {
      id: 'conv-1',
      messages: [
        { id: 'msg-1', role: 'user', content: 'hello', toolCalls: [] },
        { id: 'msg-2', role: 'assistant', content: 'hi', toolCalls: [{ id: 'tc-1' }] },
      ],
    };
    mockPrisma.aiConversation.findUnique.mockResolvedValue(conv);

    const result = await getConversationById('conv-1', mockPrisma);
    expect(result?.messages).toHaveLength(2);
    expect(mockPrisma.aiConversation.findUnique).toHaveBeenCalledWith({
      where: { id: 'conv-1' },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 50,
          include: { toolCalls: true },
        },
      },
    });
  });

  it('returns null for nonexistent conversation', async () => {
    mockPrisma.aiConversation.findUnique.mockResolvedValue(null);
    const result = await getConversationById('nonexistent', mockPrisma);
    expect(result).toBeNull();
  });
});

describe('appendMessage', () => {
  it('creates message and updates conversation totals in a transaction', async () => {
    const message = { id: 'msg-1', conversationId: 'conv-1', role: 'assistant', content: 'hi' };
    mockPrisma.aiMessage.create.mockResolvedValue(message);
    mockPrisma.aiConversation.update.mockResolvedValue({});

    const result = await appendMessage(
      'conv-1',
      { role: 'assistant', content: 'hi', tokensIn: 100, tokensOut: 50, costUsd: 0.001 },
      mockPrisma,
    );

    expect(result.id).toBe('msg-1');

    // Verify transaction was used
    expect(mockPrisma.$transaction).toHaveBeenCalled();

    // Verify conversation totals were updated
    expect(mockPrisma.aiConversation.update).toHaveBeenCalledWith({
      where: { id: 'conv-1' },
      data: {
        messageCount: { increment: 1 },
        totalTokensUsed: { increment: 150 },
        totalCostUsd: { increment: 0.001 },
        lastMessageAt: expect.any(Date),
      },
    });
  });

  it('defaults token and cost values to 0', async () => {
    mockPrisma.aiMessage.create.mockResolvedValue({ id: 'msg-2' });
    mockPrisma.aiConversation.update.mockResolvedValue({});

    await appendMessage('conv-1', { role: 'user', content: 'test' }, mockPrisma);

    expect(mockPrisma.aiMessage.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tokensIn: 0,
        tokensOut: 0,
        costUsd: 0,
      }),
    });
  });
});

describe('appendToolCall', () => {
  it('creates a tool call record', async () => {
    const tc = { id: 'tc-1', messageId: 'msg-1', toolName: 'searchProducts', status: 'pending' };
    mockPrisma.aiToolCall.create.mockResolvedValue(tc);

    const result = await appendToolCall(
      'msg-1',
      { toolName: 'searchProducts', argsJson: { query: 'rice' }, autonomyLevelAtExecution: 'L1' },
      mockPrisma,
    );

    expect(result.toolName).toBe('searchProducts');
    expect(mockPrisma.aiToolCall.create).toHaveBeenCalledWith({
      data: {
        messageId: 'msg-1',
        toolName: 'searchProducts',
        argsJson: { query: 'rice' },
        autonomyLevelAtExecution: 'L1',
      },
    });
  });
});

describe('updateToolCallResult', () => {
  it('sets result, status to success, and durationMs', async () => {
    mockPrisma.aiToolCall.update.mockResolvedValue({ id: 'tc-1', status: 'success' });

    const result = await updateToolCallResult('tc-1', { products: [] }, 150, mockPrisma);

    expect(result.status).toBe('success');
    expect(mockPrisma.aiToolCall.update).toHaveBeenCalledWith({
      where: { id: 'tc-1' },
      data: {
        resultJson: { products: [] },
        status: 'success',
        durationMs: 150,
      },
    });
  });
});

describe('markToolCallError', () => {
  it('sets status to error with message', async () => {
    mockPrisma.aiToolCall.update.mockResolvedValue({ id: 'tc-1', status: 'error' });

    await markToolCallError('tc-1', 'Connection timeout', mockPrisma);

    expect(mockPrisma.aiToolCall.update).toHaveBeenCalledWith({
      where: { id: 'tc-1' },
      data: {
        status: 'error',
        errorMessage: 'Connection timeout',
      },
    });
  });
});

describe('closeConversation', () => {
  it('sets status and closedAt timestamp', async () => {
    mockPrisma.aiConversation.update.mockResolvedValue({ id: 'conv-1', status: 'resolved' });

    const result = await closeConversation('conv-1', 'resolved', mockPrisma);

    expect(result.status).toBe('resolved');
    expect(mockPrisma.aiConversation.update).toHaveBeenCalledWith({
      where: { id: 'conv-1' },
      data: {
        status: 'resolved',
        closedAt: expect.any(Date),
      },
    });
  });
});

describe('listActiveConversations', () => {
  it('returns active conversations ordered by lastMessageAt desc', async () => {
    mockPrisma.aiConversation.findMany.mockResolvedValue([{ id: 'conv-1' }, { id: 'conv-2' }]);

    const result = await listActiveConversations(undefined, 50, mockPrisma);

    expect(result).toHaveLength(2);
    expect(mockPrisma.aiConversation.findMany).toHaveBeenCalledWith({
      where: { status: 'active' },
      orderBy: { lastMessageAt: 'desc' },
      take: 50,
    });
  });

  it('filters by featureKey when provided', async () => {
    mockPrisma.aiConversation.findMany.mockResolvedValue([]);

    await listActiveConversations('cs-agent', 10, mockPrisma);

    expect(mockPrisma.aiConversation.findMany).toHaveBeenCalledWith({
      where: { status: 'active', featureKey: 'cs-agent' },
      orderBy: { lastMessageAt: 'desc' },
      take: 10,
    });
  });
});
