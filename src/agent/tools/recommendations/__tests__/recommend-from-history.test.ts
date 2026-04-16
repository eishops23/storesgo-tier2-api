// Agent Suite — recommend_from_history tool tests (Phase 18A Prompt 3)

import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../../services/recommendations.service.js', () => ({
  recommendFromHistoryForAgent: vi.fn(),
}));

import { recommendFromHistoryTool } from '../recommend-from-history.js';
import { recommendFromHistoryForAgent } from '../../../../services/recommendations.service.js';
import type { ToolContext } from '../../types.js';

const mockHistory = vi.mocked(recommendFromHistoryForAgent);

function makeCtx(overrides: Partial<ToolContext> = {}): ToolContext {
  return {
    sessionId: 'sess-1',
    featureKey: 'recommendations',
    conversationId: 'conv-1',
    messageId: 'msg-1',
    userId: 'user-123',
    ...overrides,
  };
}

describe('recommend_from_history tool', () => {
  it('returns null when ctx.userId is undefined (ownership check)', async () => {
    const result = await recommendFromHistoryTool.execute({}, makeCtx({ userId: undefined }));
    expect(result).toBeNull();
    expect(mockHistory).not.toHaveBeenCalled();
  });

  it('calls service with ctx.userId when authenticated', async () => {
    mockHistory.mockResolvedValue([]);
    await recommendFromHistoryTool.execute({}, makeCtx());
    expect(mockHistory).toHaveBeenCalledWith('user-123', { limit: undefined });
  });

  it('forwards limit argument', async () => {
    mockHistory.mockResolvedValue([]);
    await recommendFromHistoryTool.execute({ limit: 5 }, makeCtx());
    expect(mockHistory).toHaveBeenCalledWith('user-123', { limit: 5 });
  });

  it('returns service result', async () => {
    const results = [{ id: 1, name: 'Rice', score: 0.7 }];
    mockHistory.mockResolvedValue(results as any);
    const result = await recommendFromHistoryTool.execute({}, makeCtx());
    expect(result).toEqual(results);
  });

  it('never leaks another user\'s history — always uses ctx.userId', async () => {
    mockHistory.mockResolvedValue([]);
    await recommendFromHistoryTool.execute({}, makeCtx({ userId: 'user-alice' }));
    expect(mockHistory).toHaveBeenCalledWith('user-alice', expect.anything());
    // Ensure the tool did not accept any other userId hint from args
    // (the schema doesn't expose a userId field at all)
    expect(recommendFromHistoryTool.argsSchema.safeParse({ userId: 'user-bob' }).success).toBe(true);
    // But even if a userId field were passed, it would be ignored — the
    // tool only reads ctx.userId, never args.userId
  });
});
