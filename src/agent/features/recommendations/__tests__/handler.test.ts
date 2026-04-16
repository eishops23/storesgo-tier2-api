// Agent Suite — Recommendations handler tests (Phase 18A Prompt 3)

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

vi.mock('../../../tools/recommendations/index.js', () => ({
  registerRecommendationsTools: vi.fn((reg: any) => {
    reg.register({ name: 'get_product_details' });
    reg.register({ name: 'find_similar_products' });
    reg.register({ name: 'find_complementary_products' });
    reg.register({ name: 'find_recipes_for_products' });
    reg.register({ name: 'recommend_from_cart' });
    reg.register({ name: 'recommend_from_history' });
  }),
}));

vi.mock('../identity-resolver.js', () => ({
  resolveRecommendationsIdentity: vi.fn(),
}));

vi.mock('../system-prompt.js', () => ({
  renderRecommendationsSystemPrompt: vi.fn(() => 'rendered recommendations system prompt'),
  RECOMMENDATIONS_FEATURE_KEY: 'recommendations',
  RECOMMENDATIONS_TEMPLATE_HASH: 'rechash1234abcd',
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

import { runRecommendations, _resetHandler } from '../handler.js';
import { resolveRecommendationsIdentity } from '../identity-resolver.js';
import { shapeResponse, shapeErrorResponse } from '../response-shaper.js';
import { AutonomyRepo } from '../../../storage/index.js';
import type { RunResult } from '../../../runner/types.js';

const mockResolveIdentity = vi.mocked(resolveRecommendationsIdentity);
const mockShapeResponse = vi.mocked(shapeResponse);
const mockShapeErrorResponse = vi.mocked(shapeErrorResponse);
const mockInitFeature = vi.mocked(AutonomyRepo.initializeFeature);

function makeRunResult(overrides: Partial<RunResult> = {}): RunResult {
  return {
    text: 'Here are some recommendations.',
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

describe('runRecommendations handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    _resetHandler();

    mockResolveIdentity.mockResolvedValue({
      identityId: 'id-1',
      aliasValue: 'user-123',
      isAuthenticated: true,
    });

    mockRunnerRun.mockResolvedValue(makeRunResult());

    mockShapeResponse.mockResolvedValue({
      ok: true,
      response: 'Here are some recommendations.',
      suggestions: ['Find similar'],
      conversationId: 'conv-1',
      correlationId: 'corr-1',
    });

    mockShapeErrorResponse.mockReturnValue({
      ok: false,
      response: "I'm having a brief issue with the recommendations assistant.",
      suggestions: ['Try again'],
      conversationId: '',
      correlationId: '',
    });
  });

  it('calls ensureFeatureInitialized before run', async () => {
    await runRecommendations({ userText: 'what goes with plantains?', userId: 'user-123' });
    expect(mockInitFeature).toHaveBeenCalledWith('recommendations');
  });

  it('passes featureKey recommendations to runner', async () => {
    await runRecommendations({ userText: 'what goes with plantains?', userId: 'user-123' });
    expect(mockRunnerRun).toHaveBeenCalledWith(
      expect.objectContaining({ featureKey: 'recommendations' }),
    );
  });

  it('forwards userId to runner.run for authenticated users', async () => {
    await runRecommendations({
      userText: 'recommend from my history',
      userId: 'user-456',
      conversationId: 'conv-existing',
    });

    expect(mockRunnerRun).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-456',
        conversationId: 'conv-existing',
        identityId: 'id-1',
      }),
    );
  });

  it('passes userId as undefined for guests', async () => {
    mockResolveIdentity.mockResolvedValue({
      identityId: 'id-guest',
      aliasValue: 'fresh-uuid',
      isAuthenticated: false,
    });

    await runRecommendations({ userText: 'what goes with plantains?', userId: null });

    expect(mockRunnerRun).toHaveBeenCalledWith(
      expect.objectContaining({ userId: undefined }),
    );
  });

  it('mints guestSessionId for fresh guests', async () => {
    mockResolveIdentity.mockResolvedValue({
      identityId: 'id-guest',
      aliasValue: 'fresh-uuid',
      isAuthenticated: false,
    });

    const result = await runRecommendations({
      userText: 'what goes with plantains?',
      userId: null,
    });

    expect(result.guestSessionId).toBe('fresh-uuid');
  });

  it('does NOT mint guestSessionId when existing session provided', async () => {
    mockResolveIdentity.mockResolvedValue({
      identityId: 'id-guest',
      aliasValue: 'existing-sess',
      isAuthenticated: false,
    });

    const result = await runRecommendations({
      userText: 'what goes with plantains?',
      userId: null,
      guestSessionId: 'existing-sess',
    });

    expect(result.guestSessionId).toBeUndefined();
  });

  it('returns shaped response', async () => {
    const result = await runRecommendations({
      userText: 'what goes with plantains?',
      userId: 'user-123',
    });

    expect(result.ok).toBe(true);
    expect(result.response).toBe('Here are some recommendations.');
    expect(result.suggestions).toEqual(['Find similar']);
  });

  it('returns error response on runner failure', async () => {
    mockRunnerRun.mockRejectedValue(new Error('LLM exploded'));

    const result = await runRecommendations({
      userText: 'what goes with plantains?',
      userId: 'user-123',
    });

    expect(result.ok).toBe(false);
    expect(mockShapeErrorResponse).toHaveBeenCalled();
  });
});
