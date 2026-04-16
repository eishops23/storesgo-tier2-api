// Agent Suite — Reviews response shaper tests (Phase 11 Prompt 3)

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
    text: 'Here are the reviews needing your attention.',
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

describe('reviews response-shaper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.aiToolCall.findMany.mockResolvedValue([]);
  });

  it('queries ai_tool_calls by messageId, NOT toolCallIds (Bug 3 fix)', async () => {
    await shapeResponse(
      makeRunResult({
        toolCallIds: ['tc-1'],
        assistantMessageId: 'msg-2',
      }),
    );

    expect(mockPrisma.aiToolCall.findMany).toHaveBeenCalledWith({
      where: {
        messageId: 'msg-2',
        status: 'success',
      },
      orderBy: { createdAt: 'desc' },
      select: { toolName: true, resultJson: true },
    });
  });

  it('maps list_my_reviews to correct suggestions', async () => {
    mockPrisma.aiToolCall.findMany.mockResolvedValue([
      { toolName: 'list_my_reviews', resultJson: [] },
    ]);

    const result = await shapeResponse(makeRunResult({ toolCallIds: ['tc-1'] }));

    expect(result.suggestions).toEqual([
      'Show review stats',
      'Find reviews needing a response',
      'Draft a response to one of these',
    ]);
  });

  it('maps find_reviews_needing_response to correct suggestions', async () => {
    mockPrisma.aiToolCall.findMany.mockResolvedValue([
      { toolName: 'find_reviews_needing_response', resultJson: [] },
    ]);

    const result = await shapeResponse(makeRunResult({ toolCallIds: ['tc-1'] }));

    expect(result.suggestions).toEqual([
      'Draft a response to the first one',
      'Show review stats',
      'List all my recent reviews',
    ]);
  });

  it('maps draft_response to correct suggestions', async () => {
    mockPrisma.aiToolCall.findMany.mockResolvedValue([
      {
        toolName: 'draft_response',
        resultJson: {
          reviewId: 7,
          productName: 'X',
          customerFirstName: 'Alice',
          rating: 4,
          originalComment: 'good',
          suggestedToneNotes: 'appreciative',
        },
      },
    ]);

    const result = await shapeResponse(makeRunResult({ toolCallIds: ['tc-1'] }));

    expect(result.suggestions).toEqual([
      'Draft another response',
      'Show review stats',
      'Find more reviews needing a response',
    ]);
    expect(result.data).toEqual(
      expect.objectContaining({ reviewId: 7, customerFirstName: 'Alice' }),
    );
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
      response: 'Here are the reviews needing your attention.',
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
      'Show review stats',
      'Find reviews needing a response',
      'List my recent reviews',
    ]);
  });
});

describe('shapeErrorResponse', () => {
  it('returns ok:false with canned reviews-flavored message', () => {
    const result = shapeErrorResponse('conv-1', 'corr-1');
    expect(result.ok).toBe(false);
    expect(result.response).toContain('reviews assistant');
    expect(result.conversationId).toBe('conv-1');
    expect(result.correlationId).toBe('corr-1');
  });
});
