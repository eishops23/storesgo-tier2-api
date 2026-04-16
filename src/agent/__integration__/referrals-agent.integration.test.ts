// Phase 5 Prompt 4 — Referrals agent integration tests
// Run: npx vitest run --config vitest.config.ts src/agent/__integration__/referrals-agent.integration.test.ts
// Excluded from default `npx vitest run` via vitest.config.ts exclude pattern
// Requires: AGENT_SUITE_ENABLED=true, AGENT_FEATURE_FLAGS=referrals

import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import Fastify from 'fastify';

// --- Mock the LLM layer so we don't need real API keys ---
vi.mock('../llm/client.js', () => ({
  llmCall: vi.fn(),
}));

// --- Mock the service layer so we don't need a real DB tunnel ---
vi.mock('../../services/referrals.service.js', () => ({
  getReferralStats: vi.fn(() => Promise.resolve({
    referralCode: 'STGOTEST1234',
    referralLink: 'https://storesgo.com/register?ref=STGOTEST1234',
    totalReferrals: 3,
    activeReferrals: 2,
    pendingReferrals: 1,
    pendingRewardsCents: 2500,
    totalEarningsCents: 5000,
    referrerRewardCents: 2500,
    referredRewardCents: 1000,
  })),
  getReferralHistory: vi.fn(() => Promise.resolve([
    { id: 1, referredName: 'Alice', referredEmail: '***@***.com', status: 'completed', rewardCents: 2500, paidOut: true, createdAt: '2026-01-15T00:00:00.000Z', completedAt: '2026-02-01T00:00:00.000Z' },
  ])),
  validateReferralCode: vi.fn((code: string) => Promise.resolve(
    code === 'STGOTEST1234' ? { valid: true, referredRewardCents: 1000 } : { valid: false, error: 'Invalid referral code' },
  )),
  getReferralLeaderboard: vi.fn(() => Promise.resolve([
    { rank: 1, name: 'Alice', referralCount: 10 },
  ])),
  getReferralProgramInfo: vi.fn(() => ({
    referrerRewardCents: 2500,
    referredRewardCents: 1000,
    expiryDays: 30,
    linkTemplate: 'https://storesgo.com/register?ref={code}',
    codeFormat: 'STGO + 8 uppercase hex characters',
  })),
  generateReferralCode: vi.fn(() => 'STGOTEST1234'),
  REFERRER_REWARD_CENTS: 2500,
  REFERRED_REWARD_CENTS: 1000,
  REFERRAL_EXPIRY_DAYS: 30,
}));

// --- Mock prisma for the agent storage layer ---
const mockConversation = { id: 'conv-int-1', featureKey: 'referrals', channel: 'chat', status: 'active', totalTokensUsed: 0, totalCostUsd: 0, messageCount: 0, startedAt: new Date(), lastMessageAt: new Date(), createdAt: new Date(), updatedAt: new Date() };
const mockUserMsg = { id: 'msg-int-1', conversationId: 'conv-int-1', role: 'user', content: '', createdAt: new Date() };
const mockAssistantMsg = { id: 'msg-int-2', conversationId: 'conv-int-1', role: 'assistant', content: '', createdAt: new Date() };
const mockToolCall = { id: 'tc-int-1', messageId: 'msg-int-2', toolName: 'get_referral_program_info', status: 'success', argsJson: {}, resultJson: {}, createdAt: new Date(), updatedAt: new Date() };

vi.mock('../storage/prisma-client.js', () => ({
  getPrisma: vi.fn(() => mockPrisma),
}));

const mockPrisma = {
  aiConversation: {
    create: vi.fn(() => Promise.resolve(mockConversation)),
    findUnique: vi.fn(() => Promise.resolve({ ...mockConversation, messages: [] })),
    update: vi.fn(() => Promise.resolve(mockConversation)),
    aggregate: vi.fn(() => Promise.resolve({ _sum: { totalCostUsd: 0 } })),
  },
  aiMessage: {
    create: vi.fn((args: any) => {
      if (args.data?.role === 'user') return Promise.resolve(mockUserMsg);
      return Promise.resolve(mockAssistantMsg);
    }),
    update: vi.fn(() => Promise.resolve(mockAssistantMsg)),
    findMany: vi.fn(() => Promise.resolve([mockUserMsg, mockAssistantMsg])),
  },
  aiToolCall: {
    create: vi.fn(() => Promise.resolve(mockToolCall)),
    update: vi.fn(() => Promise.resolve(mockToolCall)),
    findMany: vi.fn(() => Promise.resolve([
      { toolName: 'get_referral_program_info', resultJson: { referrerRewardCents: 2500 } },
    ])),
  },
  aiAutonomyState: {
    upsert: vi.fn(() => Promise.resolve({ featureKey: 'referrals', currentLevel: 'L0' })),
    findUnique: vi.fn(() => Promise.resolve({ featureKey: 'referrals', currentLevel: 'L0', costBudgetCents: 50000 })),
    update: vi.fn(() => Promise.resolve({})),
  },
  aiCustomerIdentity: {
    create: vi.fn(() => Promise.resolve({ id: 'ident-int-1' })),
  },
  aiIdentityAlias: {
    findUnique: vi.fn(() => Promise.resolve(null)),
    create: vi.fn(() => Promise.resolve({ id: 'alias-int-1', identityId: 'ident-int-1' })),
  },
  $transaction: vi.fn((fn: any) => fn(mockPrisma)),
} as any;

// --- Mock the Gemini fallback so it doesn't fail ---
vi.mock('../../services/aiChat.service.js', () => ({
  processChat: vi.fn(() => Promise.resolve({ response: 'gemini fallback', suggestions: [] })),
  ChatMessage: {},
  searchProducts: vi.fn(() => []),
  getStoreStats: vi.fn(() => ({})),
}));

// --- Mock the identity repo ---
vi.mock('../storage/identity.repo.js', () => ({
  findOrCreateIdentityByAlias: vi.fn(() => Promise.resolve({ id: 'ident-int-1' })),
}));

// --- Mock the flags to enable referrals ---
vi.mock('../flags/index.js', () => ({
  isFeatureAllowed: vi.fn((key: string) => key === 'referrals'),
  getEffectiveLevel: vi.fn(() => Promise.resolve('L0')),
}));

// --- Mock jwt ---
vi.mock('jsonwebtoken', () => ({
  default: {
    verify: vi.fn((token: string) => {
      if (token === 'test-user-token') return { id: 'user-int-1' };
      throw new Error('invalid token');
    }),
  },
}));

// --- Mock observability ---
vi.mock('../observability/index.js', () => ({
  createChildLogger: vi.fn(() => ({
    child: vi.fn(() => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() })),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
  createCorrelationId: vi.fn(() => 'corr-int-1'),
}));

// --- Mock shutdown ---
vi.mock('../runner/shutdown.js', () => ({
  isShuttingDown: vi.fn(() => false),
}));

// --- Mock message history ---
vi.mock('../runner/message-history.js', () => ({
  loadConversationHistory: vi.fn(() => Promise.resolve([])),
}));

// --- Mock budget ---
vi.mock('../llm/budget.js', () => ({
  initSession: vi.fn(),
  getSessionUsage: vi.fn(() => null),
  _clearAllSessions: vi.fn(),
}));

import chatRoutes from '../../routes/chat.js';
import { llmCall } from '../llm/client.js';
const mockLlmCall = vi.mocked(llmCall);

async function buildApp() {
  const app = Fastify();
  await app.register(chatRoutes, { prefix: '/chat' });
  return app;
}

function makeLlmResponse(text: string, toolCalls: any[] = []) {
  return {
    text,
    provider: 'anthropic',
    model: 'claude-haiku-4-5',
    usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150, estimatedCostUsd: 0.001 },
    finishReason: 'stop',
    toolCallsExecuted: toolCalls.length,
    fallbackHops: 0,
    steps: toolCalls.length > 0 ? [{ toolCalls }] : undefined,
  };
}

describe('Referrals Agent Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Re-setup default mock returns after clearAllMocks
    mockPrisma.aiConversation.create.mockResolvedValue(mockConversation);
    mockPrisma.aiConversation.findUnique.mockResolvedValue({ ...mockConversation, messages: [] });
    mockPrisma.aiConversation.update.mockResolvedValue(mockConversation);
    mockPrisma.aiConversation.aggregate.mockResolvedValue({ _sum: { totalCostUsd: 0 } });
    mockPrisma.aiMessage.create.mockImplementation((args: any) => {
      if (args.data?.role === 'user') return Promise.resolve(mockUserMsg);
      return Promise.resolve(mockAssistantMsg);
    });
    mockPrisma.aiMessage.update.mockResolvedValue(mockAssistantMsg);
    mockPrisma.aiMessage.findMany.mockResolvedValue([mockUserMsg, mockAssistantMsg]);
    mockPrisma.aiToolCall.create.mockResolvedValue(mockToolCall);
    mockPrisma.aiToolCall.update.mockResolvedValue(mockToolCall);
    mockPrisma.aiToolCall.findMany.mockResolvedValue([
      { toolName: 'get_referral_program_info', resultJson: { referrerRewardCents: 2500 } },
    ]);
    mockPrisma.aiAutonomyState.upsert.mockResolvedValue({ featureKey: 'referrals', currentLevel: 'L0' });
    mockPrisma.aiAutonomyState.findUnique.mockResolvedValue({ featureKey: 'referrals', currentLevel: 'L0', costBudgetCents: 50000 });
    mockPrisma.aiCustomerIdentity.create.mockResolvedValue({ id: 'ident-int-1' });
    mockPrisma.aiIdentityAlias.findUnique.mockResolvedValue(null);
    mockPrisma.aiIdentityAlias.create.mockResolvedValue({ id: 'alias-int-1', identityId: 'ident-int-1' });
  });

  it('guest asks about referral program — returns shaped response', async () => {
    mockLlmCall.mockResolvedValue(makeLlmResponse(
      'The StoresGo referral program rewards you $25 for each friend you refer!',
      [{ toolCallId: 'tc-1', toolName: 'get_referral_program_info', args: {} }],
    ));

    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/chat',
      payload: {
        messages: [{ role: 'user', content: 'How does the referral program work?' }],
      },
    });

    const body = res.json();
    expect(res.statusCode).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.response).toBeTruthy();
    expect(body.response.length).toBeGreaterThan(0);
    expect(body.suggestions).toBeInstanceOf(Array);
    expect(body.conversationId).toBeTruthy();
  }, 15_000);

  it('guest gets X-Guest-Session-Id header on response', async () => {
    mockLlmCall.mockResolvedValue(makeLlmResponse(
      'Here is how the referral program works.',
    ));

    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/chat',
      payload: {
        messages: [{ role: 'user', content: 'Tell me about the referral program' }],
      },
    });

    expect(res.statusCode).toBe(200);
    // Guest should get a session ID minted
    expect(res.headers['x-guest-session-id']).toBeTruthy();
  }, 15_000);

  it('authenticated user asks for referral code — returns data', async () => {
    mockLlmCall.mockResolvedValue(makeLlmResponse(
      'Your referral code is STGOTEST1234!',
      [{ toolCallId: 'tc-2', toolName: 'get_referral_stats', args: {} }],
    ));

    mockPrisma.aiToolCall.findMany.mockResolvedValue([
      { toolName: 'get_referral_stats', resultJson: { referralCode: 'STGOTEST1234' } },
    ]);

    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/chat',
      headers: {
        authorization: 'Bearer test-user-token',
      },
      payload: {
        messages: [{ role: 'user', content: "What's my referral code?" }],
      },
    });

    const body = res.json();
    expect(res.statusCode).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.conversationId).toBeTruthy();
    expect(body.data).toBeDefined();
    expect(body.data.referralCode).toBe('STGOTEST1234');
  }, 15_000);

  it('public referral code validation', async () => {
    mockLlmCall.mockResolvedValue(makeLlmResponse(
      'That code is valid! The referred friend will get $10 credit.',
      [{ toolCallId: 'tc-3', toolName: 'validate_referral_code', args: { code: 'STGOTEST1234' } }],
    ));

    mockPrisma.aiToolCall.findMany.mockResolvedValue([
      { toolName: 'validate_referral_code', resultJson: { valid: true, referredRewardCents: 1000 } },
    ]);

    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/chat',
      payload: {
        messages: [{ role: 'user', content: 'Is referral code STGOTEST1234 valid?' }],
      },
    });

    const body = res.json();
    expect(res.statusCode).toBe(200);
    expect(body.ok).toBe(true);
  }, 15_000);

  it('DB persistence — conversation, messages, and tool calls created', async () => {
    mockLlmCall.mockResolvedValue(makeLlmResponse(
      'Here is the referral leaderboard!',
      [{ toolCallId: 'tc-4', toolName: 'get_referral_leaderboard', args: {} }],
    ));

    const app = await buildApp();
    await app.inject({
      method: 'POST',
      url: '/chat',
      payload: {
        messages: [{ role: 'user', content: 'Show me the referral leaderboard' }],
      },
    });

    // Verify ai_conversations was created with featureKey 'referrals'
    expect(mockPrisma.aiConversation.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          featureKey: 'referrals',
          channel: 'chat',
        }),
      }),
    );

    // Verify ai_messages were created (user + assistant placeholder)
    expect(mockPrisma.aiMessage.create).toHaveBeenCalled();
    const messageCalls = mockPrisma.aiMessage.create.mock.calls;
    expect(messageCalls.length).toBeGreaterThanOrEqual(2);

    // Verify user message content
    const userMsgCall = messageCalls.find((c: any) => c[0]?.data?.role === 'user');
    expect(userMsgCall).toBeDefined();
    expect(userMsgCall[0].data.content).toBe('Show me the referral leaderboard');

    // Verify assistant message was updated with LLM response
    expect(mockPrisma.aiMessage.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'msg-int-2' },
        data: expect.objectContaining({
          content: 'Here is the referral leaderboard!',
          provider: 'anthropic',
        }),
      }),
    );
  }, 15_000);

  it('non-referral message falls through to Gemini when cs_chat is also off', async () => {
    const { isFeatureAllowed } = await import('../flags/index.js');
    const mockIsFeatureAllowed = vi.mocked(isFeatureAllowed);
    // referrals enabled but cs_chat not — non-referral message falls to Gemini
    mockIsFeatureAllowed.mockImplementation((key: string) => key === 'referrals');

    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/chat',
      payload: {
        messages: [{ role: 'user', content: 'What rice do you have?' }],
      },
    });

    const body = res.json();
    expect(res.statusCode).toBe(200);
    expect(body.ok).toBe(true);
    // Should have fallen through to Gemini, not to referrals agent
    expect(mockLlmCall).not.toHaveBeenCalled();
  }, 15_000);
});
