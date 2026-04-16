// Agent Suite — Merchandising response shaper tests (Phase 12 Prompt 2)

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
    text: 'Here is the current merchandising snapshot.',
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

describe('merchandising response-shaper', () => {
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

  it('maps get_merchandising_snapshot to correct suggestions', async () => {
    mockPrisma.aiToolCall.findMany.mockResolvedValue([
      { toolName: 'get_merchandising_snapshot', resultJson: { featuredProducts: [] } },
    ]);
    const result = await shapeResponse(makeRunResult({ toolCallIds: ['tc-1'] }));
    expect(result.suggestions).toEqual([
      'Find featured products with zero orders',
      'Find uncovered categories',
      'List active CMS blocks',
    ]);
  });

  it('maps find_featured_products_zero_orders to correct suggestions', async () => {
    mockPrisma.aiToolCall.findMany.mockResolvedValue([
      { toolName: 'find_featured_products_zero_orders', resultJson: [] },
    ]);
    const result = await shapeResponse(makeRunResult({ toolCallIds: ['tc-1'] }));
    expect(result.suggestions).toEqual([
      'Get details for the first dead slot',
      'Find uncovered categories to fill the slots',
      'Show the full merchandising snapshot',
    ]);
    expect(result.data).toEqual([]);
  });

  it('maps list_cms_blocks_schedule to correct suggestions', async () => {
    mockPrisma.aiToolCall.findMany.mockResolvedValue([
      { toolName: 'list_cms_blocks_schedule', resultJson: [] },
    ]);
    const result = await shapeResponse(makeRunResult({ toolCallIds: ['tc-1'] }));
    expect(result.suggestions).toEqual([
      'Show the full merchandising snapshot',
      'Find featured products with zero orders',
      'Find uncovered categories',
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
      response: 'Here is the current merchandising snapshot.',
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
      'Show the merchandising snapshot',
      'Find featured products with zero orders',
      'Find uncovered categories',
    ]);
  });
});

describe('shapeErrorResponse', () => {
  it('returns ok:false with merchandising-flavored message', () => {
    const result = shapeErrorResponse('conv-1', 'corr-1');
    expect(result.ok).toBe(false);
    expect(result.response).toContain('merchandising assistant');
    expect(result.conversationId).toBe('conv-1');
    expect(result.correlationId).toBe('corr-1');
  });
});
