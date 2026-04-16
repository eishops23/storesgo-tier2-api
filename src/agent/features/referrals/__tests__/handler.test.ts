// Agent Suite — Referrals handler tests (Phase 5 Prompt 3)

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

vi.mock('../../../tools/referrals/index.js', () => ({
  registerReferralsTools: vi.fn((reg: any) => {
    reg.register({ name: 'get_referral_stats' });
    reg.register({ name: 'get_referral_history' });
    reg.register({ name: 'validate_referral_code' });
    reg.register({ name: 'get_referral_leaderboard' });
    reg.register({ name: 'get_referral_program_info' });
  }),
}));

vi.mock('../identity-resolver.js', () => ({
  resolveReferralsIdentity: vi.fn(),
}));

vi.mock('../system-prompt.js', () => ({
  renderReferralsSystemPrompt: vi.fn(() => 'rendered referrals system prompt'),
  REFERRALS_FEATURE_KEY: 'referrals',
  REFERRALS_TEMPLATE_HASH: 'testhash5678abcd',
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

import { runReferrals, _resetHandler } from '../handler.js';
import { resolveReferralsIdentity } from '../identity-resolver.js';
import { shapeResponse, shapeErrorResponse } from '../response-shaper.js';
import { AutonomyRepo } from '../../../storage/index.js';
import type { RunResult } from '../../../runner/types.js';

const mockResolveIdentity = vi.mocked(resolveReferralsIdentity);
const mockShapeResponse = vi.mocked(shapeResponse);
const mockShapeErrorResponse = vi.mocked(shapeErrorResponse);
const mockInitFeature = vi.mocked(AutonomyRepo.initializeFeature);

function makeRunResult(overrides: Partial<RunResult> = {}): RunResult {
  return {
    text: 'Your referral code is STGOABCD1234.',
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

describe('runReferrals handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    _resetHandler();

    mockResolveIdentity.mockResolvedValue({
      identityId: 'id-1',
      aliasValue: 'user-123',
      isGuest: false,
    });

    mockRunnerRun.mockResolvedValue(makeRunResult());

    mockShapeResponse.mockResolvedValue({
      ok: true,
      response: 'Your referral code is STGOABCD1234.',
      suggestions: ['Show my referral history'],
      conversationId: 'conv-1',
      correlationId: 'corr-1',
    });

    mockShapeErrorResponse.mockReturnValue({
      ok: false,
      response: "I'm having a brief issue.",
      suggestions: ['Try again'],
      conversationId: '',
      correlationId: '',
    });
  });

  it('calls ensureFeatureInitialized before run', async () => {
    await runReferrals({ userText: 'My code?', userId: 'user-123' });
    expect(mockInitFeature).toHaveBeenCalledWith('referrals');
  });

  it('passes correct featureKey to runner', async () => {
    await runReferrals({ userText: 'My code?', userId: 'user-123' });
    expect(mockRunnerRun).toHaveBeenCalledWith(
      expect.objectContaining({ featureKey: 'referrals' }),
    );
  });

  it('forwards userId, conversationId, identityId', async () => {
    await runReferrals({
      userText: 'My code?',
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

  it('returns shaped response', async () => {
    const result = await runReferrals({ userText: 'My code?', userId: 'user-123' });

    expect(result.ok).toBe(true);
    expect(result.response).toBe('Your referral code is STGOABCD1234.');
    expect(result.suggestions).toEqual(['Show my referral history']);
  });

  it('returns error response on runner failure', async () => {
    mockRunnerRun.mockRejectedValue(new Error('LLM exploded'));

    const result = await runReferrals({ userText: 'My code?', userId: 'user-123' });

    expect(result.ok).toBe(false);
    expect(mockShapeErrorResponse).toHaveBeenCalled();
  });

  it('mints guestSessionId for fresh guest', async () => {
    mockResolveIdentity.mockResolvedValue({
      identityId: 'id-guest',
      aliasValue: 'fresh-uuid',
      isGuest: true,
    });

    const result = await runReferrals({ userText: 'How does it work?' });

    expect(result.guestSessionId).toBe('fresh-uuid');
  });

  it('does NOT return guestSessionId for existing guest session', async () => {
    mockResolveIdentity.mockResolvedValue({
      identityId: 'id-guest',
      aliasValue: 'existing-sess',
      isGuest: true,
    });

    const result = await runReferrals({
      userText: 'How does it work?',
      guestSessionId: 'existing-sess',
    });

    expect(result.guestSessionId).toBeUndefined();
  });
});
