// Agent Suite — CS Chat response shaper tests (Phase 1 Prompt 3)

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
    text: 'Here are some products.',
    conversationId: 'conv-1',
    userMessageId: 'msg-1',
    assistantMessageId: 'msg-2',
    toolCallsExecuted: 0,
    toolCallIds: [],
    autonomyLevel: 'L1',
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

describe('response-shaper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.aiToolCall.findMany.mockResolvedValue([]);
  });

  it('extracts text from RunResult as response', async () => {
    const result = await shapeResponse(makeRunResult({ text: 'Hello!' }));

    expect(result.ok).toBe(true);
    expect(result.response).toBe('Hello!');
    expect(result.conversationId).toBe('conv-1');
    expect(result.correlationId).toBe('corr-1');
  });

  it('uses default suggestions when no tool calls', async () => {
    const result = await shapeResponse(makeRunResult());

    expect(result.suggestions).toEqual(['Track my order', 'Find products', 'Become a seller']);
  });

  it('fetches tool call results and sets data + suggestions', async () => {
    mockPrisma.aiToolCall.findMany.mockResolvedValue([
      { toolName: 'search_products_meili', resultJson: [{ id: 1, name: 'Rice' }] },
    ]);

    const result = await shapeResponse(makeRunResult({
      toolCallIds: ['tc-1'],
      toolCallsExecuted: 1,
    }));

    expect(result.data).toEqual([{ id: 1, name: 'Rice' }]);
    expect(result.suggestions).toEqual(['Show more', 'Filter by price', 'Similar products']);
  });

  it('handles empty toolCallIds array', async () => {
    const result = await shapeResponse(makeRunResult({ toolCallIds: [] }));

    expect(result.data).toBeUndefined();
    expect(mockPrisma.aiToolCall.findMany).not.toHaveBeenCalled();
  });

  it('falls back to default suggestions for unknown tool', async () => {
    mockPrisma.aiToolCall.findMany.mockResolvedValue([
      { toolName: 'unknown_tool', resultJson: {} },
    ]);

    const result = await shapeResponse(makeRunResult({ toolCallIds: ['tc-1'] }));

    expect(result.suggestions).toEqual(['Track my order', 'Find products', 'Become a seller']);
  });
});

describe('shapeErrorResponse', () => {
  it('returns ok:false with canned message', () => {
    const result = shapeErrorResponse('conv-1', 'corr-1');

    expect(result.ok).toBe(false);
    expect(result.response).toContain('brief issue');
    expect(result.conversationId).toBe('conv-1');
    expect(result.correlationId).toBe('corr-1');
  });
});
