// Agent Suite — Reviews handler tests (Phase 11 Prompt 3)

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockRunnerRun = vi.fn();

vi.mock('../../../runner/agent-runner.js', () => ({
  AgentRunner: class {
    run = mockRunnerRun;
  },
}));

vi.mock('../../../storage/index.js', () => ({
  AutonomyRepo: {
    initializeFeature: vi.fn(),
  },
  IdentityRepo: {
    findOrCreateIdentityByAlias: vi.fn(),
  },
}));

vi.mock('../../../storage/prisma-client.js', () => ({
  getPrisma: vi.fn(() => ({})),
}));

vi.mock('../../../tools/registry.js', () => {
  return {
    ToolRegistry: class {
      private tools = new Map();
      register(t: any) { this.tools.set(t.name, t); }
      list() { return Array.from(this.tools.values()); }
      get(n: string) { return this.tools.get(n); }
      has(n: string) { return this.tools.has(n); }
    },
  };
});

vi.mock('../../../tools/reviews/index.js', () => ({
  registerReviewsTools: vi.fn((reg: any) => {
    reg.register({ name: 'list_my_reviews' });
    reg.register({ name: 'get_review_by_id' });
    reg.register({ name: 'get_review_stats' });
    reg.register({ name: 'find_reviews_needing_response' });
    reg.register({ name: 'draft_response' });
  }),
}));

vi.mock('../identity-resolver.js', () => ({
  resolveReviewsIdentity: vi.fn(),
}));

vi.mock('../system-prompt.js', () => ({
  renderReviewsSystemPrompt: vi.fn(() => 'rendered reviews system prompt'),
  REVIEWS_FEATURE_KEY: 'reviews',
  REVIEWS_TEMPLATE_HASH: 'testhash1234abcd',
}));

vi.mock('../response-shaper.js', () => ({
  shapeResponse: vi.fn(),
  shapeErrorResponse: vi.fn(),
}));

vi.mock('../../../observability/index.js', () => ({
  createChildLogger: vi.fn(() => ({
    child: vi.fn(() => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() })),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}));

import { runReviews, _resetHandler } from '../handler.js';
import { resolveReviewsIdentity } from '../identity-resolver.js';
import { shapeResponse, shapeErrorResponse } from '../response-shaper.js';
import { AutonomyRepo } from '../../../storage/index.js';
import type { RunResult } from '../../../runner/types.js';

const mockResolveIdentity = vi.mocked(resolveReviewsIdentity);
const mockShapeResponse = vi.mocked(shapeResponse);
const mockShapeErrorResponse = vi.mocked(shapeErrorResponse);
const mockInitFeature = vi.mocked(AutonomyRepo.initializeFeature);

function makeRunResult(overrides: Partial<RunResult> = {}): RunResult {
  return {
    text: 'Here are your reviews.',
    conversationId: 'conv-1',
    userMessageId: 'msg-1',
    assistantMessageId: 'msg-2',
    toolCallsExecuted: 1,
    toolCallIds: ['tc-1'],
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

describe('runReviews handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    _resetHandler();

    mockResolveIdentity.mockResolvedValue({
      identityId: 'id-1',
      aliasValue: 'seller-42-user-123',
      isAuthenticated: true,
    });

    mockRunnerRun.mockResolvedValue(makeRunResult());

    mockShapeResponse.mockResolvedValue({
      ok: true,
      response: 'Here are your reviews.',
      suggestions: ['Show review stats'],
      conversationId: 'conv-1',
      correlationId: 'corr-1',
    });

    mockShapeErrorResponse.mockReturnValue({
      ok: false,
      response: "I'm having a brief issue with the reviews assistant.",
      suggestions: ['Try again'],
      conversationId: '',
      correlationId: '',
    });
  });

  it('calls ensureFeatureInitialized before run', async () => {
    await runReviews({ userText: 'show my reviews', userId: 'user-123', sellerId: 42 });
    expect(mockInitFeature).toHaveBeenCalledWith('reviews');
  });

  it('passes featureKey reviews to runner', async () => {
    await runReviews({ userText: 'show my reviews', userId: 'user-123', sellerId: 42 });
    expect(mockRunnerRun).toHaveBeenCalledWith(
      expect.objectContaining({ featureKey: 'reviews' }),
    );
  });

  it('forwards sellerId, userId, conversationId, identityId to runner.run', async () => {
    await runReviews({
      userText: 'show my reviews',
      userId: 'user-456',
      sellerId: 42,
      conversationId: 'conv-existing',
    });

    expect(mockRunnerRun).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-456',
        sellerId: 42,
        conversationId: 'conv-existing',
        identityId: 'id-1',
      }),
    );
  });

  it('returns shaped response', async () => {
    const result = await runReviews({
      userText: 'show my reviews',
      userId: 'user-123',
      sellerId: 42,
    });

    expect(result.ok).toBe(true);
    expect(result.response).toBe('Here are your reviews.');
    expect(result.suggestions).toEqual(['Show review stats']);
  });

  it('returns error response on runner failure', async () => {
    mockRunnerRun.mockRejectedValue(new Error('LLM exploded'));

    const result = await runReviews({
      userText: 'show my reviews',
      userId: 'user-123',
      sellerId: 42,
    });

    expect(result.ok).toBe(false);
    expect(mockShapeErrorResponse).toHaveBeenCalled();
  });

  it('handles unauthenticated caller (no sellerId) without crashing', async () => {
    mockResolveIdentity.mockResolvedValue({
      identityId: 'id-guest',
      aliasValue: 'fresh-uuid',
      isAuthenticated: false,
    });

    const result = await runReviews({
      userText: 'how do reviews work?',
      userId: null,
      sellerId: null,
    });

    expect(result.ok).toBe(true);
    // Should still call runner.run but with sellerId undefined
    expect(mockRunnerRun).toHaveBeenCalledWith(
      expect.objectContaining({ sellerId: undefined }),
    );
  });
});
