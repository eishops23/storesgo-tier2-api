// Agent Suite — Message history loader tests (Phase 0 Part D)

import { describe, it, expect, vi } from 'vitest';

vi.mock('../../storage/prisma-client.js', () => ({
  getPrisma: vi.fn(() => mockPrisma),
}));

const mockPrisma = {
  aiMessage: {
    findMany: vi.fn(),
  },
} as any;

import { loadConversationHistory } from '../message-history.js';

describe('loadConversationHistory', () => {
  it('loads messages in chronological order', async () => {
    mockPrisma.aiMessage.findMany.mockResolvedValue([
      { role: 'user', content: 'hello' },
      { role: 'assistant', content: 'hi there' },
    ]);

    const messages = await loadConversationHistory('conv-1');

    expect(messages).toEqual([
      { role: 'user', content: 'hello' },
      { role: 'assistant', content: 'hi there' },
    ]);
    expect(mockPrisma.aiMessage.findMany).toHaveBeenCalledWith({
      where: {
        conversationId: 'conv-1',
        role: { in: ['user', 'assistant'] },
      },
      orderBy: { createdAt: 'asc' },
      take: 50,
      select: { role: true, content: true },
    });
  });

  it('filters out tool messages via the where clause', async () => {
    mockPrisma.aiMessage.findMany.mockResolvedValue([]);

    await loadConversationHistory('conv-1');

    const call = mockPrisma.aiMessage.findMany.mock.calls[0][0];
    expect(call.where.role).toEqual({ in: ['user', 'assistant'] });
  });

  it('respects custom limit', async () => {
    mockPrisma.aiMessage.findMany.mockResolvedValue([]);

    await loadConversationHistory('conv-1', 20);

    expect(mockPrisma.aiMessage.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 20 }),
    );
  });

  it('returns empty array for unknown conversation', async () => {
    mockPrisma.aiMessage.findMany.mockResolvedValue([]);

    const messages = await loadConversationHistory('nonexistent');
    expect(messages).toEqual([]);
  });

  it('maps DB fields to LLMMessage format', async () => {
    mockPrisma.aiMessage.findMany.mockResolvedValue([
      { role: 'user', content: 'What Caribbean sauces do you have?' },
    ]);

    const messages = await loadConversationHistory('conv-1');

    expect(messages[0]).toHaveProperty('role', 'user');
    expect(messages[0]).toHaveProperty('content');
    // Should NOT have DB-only fields like id, conversationId, createdAt
    expect(messages[0]).not.toHaveProperty('id');
    expect(messages[0]).not.toHaveProperty('conversationId');
  });
});
