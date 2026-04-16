// Agent Suite — SEO response shaper tests (Phase 9 Prompt 3)

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../storage/prisma-client.js', () => ({
  getPrisma: vi.fn(() => mockPrisma),
}));

const mockPrisma = {
  aiToolCall: { findMany: vi.fn() },
} as any;

import { shapeResponse, shapeErrorResponse } from '../response-shaper.js';
import type { RunResult } from '../../../runner/types.js';

function makeRunResult(overrides: Partial<RunResult> = {}): RunResult {
  return {
    text: 'Audit complete: title is too short, score 75.',
    conversationId: 'conv-1',
    userMessageId: 'msg-1',
    assistantMessageId: 'msg-2',
    toolCallsExecuted: 0,
    toolCallIds: [],
    autonomyLevel: 'L0',
    promptTokens: 100,
    completionTokens: 50,
    totalTokens: 150,
    costUsd: 0.001,
    durationMs: 500,
    finishReason: 'stop',
    correlationId: 'corr-1',
    ...overrides,
  };
}

describe('seo response-shaper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.aiToolCall.findMany.mockResolvedValue([]);
  });

  it('queries ai_tool_calls by messageId, NOT toolCallIds (Bug 3 fix)', async () => {
    await shapeResponse(
      makeRunResult({ toolCallIds: ['tc-1'], assistantMessageId: 'msg-2' }),
    );

    expect(mockPrisma.aiToolCall.findMany).toHaveBeenCalledWith({
      where: { messageId: 'msg-2', status: 'success' },
      orderBy: { createdAt: 'desc' },
      select: { toolName: true, resultJson: true },
    });
  });

  it('maps audit_blog_post to correct suggestions', async () => {
    mockPrisma.aiToolCall.findMany.mockResolvedValue([
      { toolName: 'audit_blog_post', resultJson: { score: 80 } },
    ]);
    const result = await shapeResponse(makeRunResult({ toolCallIds: ['tc-1'] }));
    expect(result.suggestions).toEqual([
      'Find similar posts to this one',
      'Show overall blog stats',
      'Find content gaps in this category',
    ]);
  });

  it('maps draft_blog_post_outline to correct suggestions', async () => {
    mockPrisma.aiToolCall.findMany.mockResolvedValue([
      { toolName: 'draft_blog_post_outline', resultJson: { topic: 'X' } },
    ]);
    const result = await shapeResponse(makeRunResult({ toolCallIds: ['tc-1'] }));
    expect(result.suggestions).toEqual([
      'Audit a similar existing post',
      'Find more content gaps',
      'Show overall blog stats',
    ]);
    expect(result.data).toEqual({ topic: 'X' });
  });

  it('handles empty toolCallIds array', async () => {
    const result = await shapeResponse(makeRunResult({ toolCallIds: [] }));
    expect(result.data).toBeUndefined();
    expect(mockPrisma.aiToolCall.findMany).not.toHaveBeenCalled();
  });

  it('returns correct envelope shape', async () => {
    const result = await shapeResponse(makeRunResult());
    expect(result).toEqual({
      ok: true,
      response: 'Audit complete: title is too short, score 75.',
      suggestions: expect.any(Array),
      conversationId: 'conv-1',
      correlationId: 'corr-1',
    });
  });

  it('falls back to default suggestions for unknown tool', async () => {
    mockPrisma.aiToolCall.findMany.mockResolvedValue([
      { toolName: 'unknown_tool', resultJson: {} },
    ]);
    const result = await shapeResponse(makeRunResult({ toolCallIds: ['tc-1'] }));
    expect(result.suggestions).toEqual([
      'Show blog stats',
      'Find content gaps',
      'Find orphan posts',
    ]);
  });
});

describe('shapeErrorResponse', () => {
  it('returns ok:false with SEO-flavored message', () => {
    const result = shapeErrorResponse('conv-1', 'corr-1');
    expect(result.ok).toBe(false);
    expect(result.response).toContain('SEO assistant');
    expect(result.conversationId).toBe('conv-1');
    expect(result.correlationId).toBe('corr-1');
  });
});
