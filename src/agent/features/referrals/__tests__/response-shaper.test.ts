// Agent Suite — Referrals response shaper tests (Phase 5 Prompt 3)

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
    text: 'Your referral code is STGOABCD1234.',
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

describe('referrals response-shaper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.aiToolCall.findMany.mockResolvedValue([]);
  });

  it('queries ai_tool_calls by messageId, NOT toolCallIds (Bug 3)', async () => {
    await shapeResponse(makeRunResult({
      toolCallIds: ['tc-1'],
      assistantMessageId: 'msg-2',
    }));

    expect(mockPrisma.aiToolCall.findMany).toHaveBeenCalledWith({
      where: {
        messageId: 'msg-2',
        status: 'success',
      },
      orderBy: { createdAt: 'desc' },
      select: { toolName: true, resultJson: true },
    });
  });

  it('maps get_referral_stats to correct suggestions', async () => {
    mockPrisma.aiToolCall.findMany.mockResolvedValue([
      { toolName: 'get_referral_stats', resultJson: { referralCode: 'STGOTEST' } },
    ]);

    const result = await shapeResponse(makeRunResult({ toolCallIds: ['tc-1'] }));

    expect(result.suggestions).toEqual(['Show my referral history', 'How does the program work?', 'Share my link']);
    expect(result.data).toEqual({ referralCode: 'STGOTEST' });
  });

  it('maps get_referral_history to correct suggestions', async () => {
    mockPrisma.aiToolCall.findMany.mockResolvedValue([
      { toolName: 'get_referral_history', resultJson: [] },
    ]);

    const result = await shapeResponse(makeRunResult({ toolCallIds: ['tc-1'] }));

    expect(result.suggestions).toEqual(['See my stats', 'Top referrers', 'Program details']);
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
      response: 'Your referral code is STGOABCD1234.',
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

    expect(result.suggestions).toEqual(['My referral code', 'How does the program work?', 'Top referrers']);
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
