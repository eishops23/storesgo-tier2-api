// Agent Suite — Recommendations response shaper tests (Phase 18A Prompt 3)

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
    text: "Here are 3 products that go well with plantains.",
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

describe('recommendations response-shaper', () => {
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

  it('maps find_complementary_products to correct suggestions', async () => {
    mockPrisma.aiToolCall.findMany.mockResolvedValue([
      {
        toolName: 'find_complementary_products',
        resultJson: { products: [], matchedRecipes: [{ recipeId: 'griot' }] },
      },
    ]);
    const result = await shapeResponse(makeRunResult({ toolCallIds: ['tc-1'] }));
    expect(result.suggestions).toEqual([
      'Show me the full recipe',
      'Find more like these',
      'Recommend more for my cart',
    ]);
    expect((result.data as any).matchedRecipes[0].recipeId).toBe('griot');
  });

  it('maps recommend_from_history to correct suggestions', async () => {
    mockPrisma.aiToolCall.findMany.mockResolvedValue([
      { toolName: 'recommend_from_history', resultJson: [] },
    ]);
    const result = await shapeResponse(makeRunResult({ toolCallIds: ['tc-1'] }));
    expect(result.suggestions).toEqual([
      'Similar to my favorites',
      'Browse categories',
      'Complete my cart',
    ]);
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
      response: 'Here are 3 products that go well with plantains.',
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
      'Find similar products',
      'What can I cook with these?',
      'Recommend from my cart',
    ]);
  });
});

describe('shapeErrorResponse', () => {
  it('returns ok:false with recommendations-flavored message', () => {
    const result = shapeErrorResponse('conv-1', 'corr-1');
    expect(result.ok).toBe(false);
    expect(result.response).toContain('recommendations');
    expect(result.conversationId).toBe('conv-1');
    expect(result.correlationId).toBe('corr-1');
  });
});
