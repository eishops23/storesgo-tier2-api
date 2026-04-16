// Agent Suite — Conversation history loader (Phase 0 Part D)

import type { LLMMessage } from '../types/llm.types.js';
import { getPrisma } from '../storage/prisma-client.js';

export async function loadConversationHistory(
  conversationId: string,
  limit = 50,
): Promise<LLMMessage[]> {
  const prisma = getPrisma();
  const messages = await prisma.aiMessage.findMany({
    where: {
      conversationId,
      role: { in: ['user', 'assistant'] },
    },
    orderBy: { createdAt: 'asc' },
    take: limit,
    select: {
      role: true,
      content: true,
    },
  });

  return messages.map((m) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }));
}
