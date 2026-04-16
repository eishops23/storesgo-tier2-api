// Phase 11 Prompt 4 — Reviews agent integration tests
// Run: npx vitest run --config vitest.integration.config.ts src/agent/__integration__/reviews-agent.integration.test.ts
// Excluded from default `npx vitest run` via vitest.config.ts exclude pattern.
// Mirrors src/agent/__integration__/referrals-agent.integration.test.ts —
// LLM, prisma, services, jwt, and Gemini are all mocked. This is an
// integration test of dispatch + handler + tool registry + shaper wiring,
// not a real DB or real LLM test.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import Fastify from 'fastify';

// --- Mock the LLM layer so we don't need real API keys ---
vi.mock('../llm/client.js', () => ({
  llmCall: vi.fn(),
}));

// --- Mock the reviews service layer so we don't need a real DB tunnel ---
const SELLER_A_ID = 42;
const SELLER_B_ID = 99;
const SELLER_A_USER_ID = 'user-int-seller-a';

const sample1StarReview = {
  id: 1,
  userId: 'buyer-1',
  sellerId: SELLER_A_ID,
  productId: 100,
  rating: 1,
  comment: 'Shipping was slow and the bottle leaked',
  createdAt: new Date('2026-04-01'),
  product: { id: 100, name: 'Caribbean Hot Sauce', imageUrl: null },
};

const sample4StarReview = {
  id: 2,
  userId: 'buyer-2',
  sellerId: SELLER_A_ID,
  productId: 101,
  rating: 4,
  comment: 'Mostly great',
  createdAt: new Date('2026-04-02'),
  product: { id: 101, name: 'Plantains', imageUrl: null },
};

const sample5StarReview = {
  id: 3,
  userId: 'buyer-3',
  sellerId: SELLER_A_ID,
  productId: 102,
  rating: 5,
  comment: 'Perfect',
  createdAt: new Date('2026-04-03'),
  product: { id: 102, name: 'Yams', imageUrl: null },
};

const sellerBReview = {
  id: 50,
  userId: 'buyer-99',
  sellerId: SELLER_B_ID,
  productId: 200,
  rating: 2,
  comment: 'Seller B private complaint that seller A must not see',
  createdAt: new Date('2026-04-05'),
  product: { id: 200, name: 'Other Seller Product', imageUrl: null },
};

vi.mock('../../services/reviews.service.js', () => ({
  listReviewsForSeller: vi.fn((sellerId: number) =>
    Promise.resolve(
      sellerId === SELLER_A_ID
        ? [sample1StarReview, sample4StarReview, sample5StarReview]
        : [],
    ),
  ),
  getReviewByIdForSeller: vi.fn((sellerId: number, reviewId: number) => {
    if (sellerId === SELLER_A_ID && reviewId === 1) return Promise.resolve(sample1StarReview);
    // Critical: seller A asking for seller B's review must get null
    if (sellerId === SELLER_A_ID && reviewId === sellerBReview.id) return Promise.resolve(null);
    return Promise.resolve(null);
  }),
  getReviewStatsForSeller: vi.fn(() =>
    Promise.resolve({
      totalReviews: 3,
      avgRating: 3.33,
      ratingDistribution: { 1: 1, 2: 0, 3: 0, 4: 1, 5: 1 },
      needingResponseCount: 1,
    }),
  ),
  findReviewsNeedingResponse: vi.fn((sellerId: number) =>
    Promise.resolve(sellerId === SELLER_A_ID ? [sample1StarReview] : []),
  ),
  loadReviewForDrafting: vi.fn((sellerId: number, reviewId: number) => {
    if (sellerId === SELLER_A_ID && reviewId === 1) {
      return Promise.resolve({
        reviewId: 1,
        productName: 'Caribbean Hot Sauce',
        customerFirstName: null,
        rating: 1,
        originalComment: sample1StarReview.comment,
        suggestedToneNotes: 'empathetic and solution-oriented',
      });
    }
    return Promise.resolve(null);
  }),
}));

// --- Mock prisma for the agent storage layer AND for the chat.ts seller lookup ---
const mockConversation = {
  id: 'conv-rev-int-1',
  featureKey: 'reviews',
  channel: 'chat',
  status: 'active',
  totalTokensUsed: 0,
  totalCostUsd: 0,
  messageCount: 0,
  startedAt: new Date(),
  lastMessageAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
};
const mockUserMsg = {
  id: 'msg-rev-int-1',
  conversationId: 'conv-rev-int-1',
  role: 'user',
  content: '',
  createdAt: new Date(),
};
const mockAssistantMsg = {
  id: 'msg-rev-int-2',
  conversationId: 'conv-rev-int-1',
  role: 'assistant',
  content: '',
  createdAt: new Date(),
};
const mockToolCall = {
  id: 'tc-rev-int-1',
  messageId: 'msg-rev-int-2',
  toolName: 'find_reviews_needing_response',
  status: 'success',
  argsJson: {},
  resultJson: [sample1StarReview],
  createdAt: new Date(),
  updatedAt: new Date(),
};

vi.mock('../storage/prisma-client.js', () => ({
  getPrisma: vi.fn(() => mockPrisma),
}));

// chat.ts imports prisma from ../lib/prisma.js for the seller lookup —
// mock it to the same shared instance so the seller lookup works.
vi.mock('../../lib/prisma.js', () => ({
  prisma: new Proxy({}, { get: (_t, prop) => (mockPrisma as any)[prop] }),
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
    findMany: vi.fn(() =>
      Promise.resolve([{ toolName: 'find_reviews_needing_response', resultJson: [sample1StarReview] }]),
    ),
  },
  aiAutonomyState: {
    upsert: vi.fn(() => Promise.resolve({ featureKey: 'reviews', currentLevel: 'L0' })),
    findUnique: vi.fn(() =>
      Promise.resolve({ featureKey: 'reviews', currentLevel: 'L0', costBudgetCents: 50000 }),
    ),
    update: vi.fn(() => Promise.resolve({})),
  },
  aiCustomerIdentity: {
    create: vi.fn(() => Promise.resolve({ id: 'ident-rev-int-1' })),
  },
  aiIdentityAlias: {
    findUnique: vi.fn(() => Promise.resolve(null)),
    create: vi.fn(() => Promise.resolve({ id: 'alias-rev-int-1', identityId: 'ident-rev-int-1' })),
  },
  // Seller lookup at chat.ts dispatch time
  seller: {
    findFirst: vi.fn((args: any) => {
      if (args?.where?.userId === SELLER_A_USER_ID) {
        return Promise.resolve({
          id: SELLER_A_ID,
          storeName: 'Caribbean Fresh Market',
          isBanned: false,
          isApproved: true,
        });
      }
      return Promise.resolve(null);
    }),
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
  findOrCreateIdentityByAlias: vi.fn(() => Promise.resolve({ id: 'ident-rev-int-1' })),
}));

// --- Mock the flags to enable reviews (and only reviews so referrals/cs-chat don't intercept) ---
vi.mock('../flags/index.js', () => ({
  isFeatureAllowed: vi.fn((key: string) => key === 'reviews'),
  getEffectiveLevel: vi.fn(() => Promise.resolve('L0')),
}));

// --- Mock jwt to recognize the seller A token ---
vi.mock('jsonwebtoken', () => ({
  default: {
    verify: vi.fn((token: string) => {
      if (token === 'seller-a-token') return { id: SELLER_A_USER_ID, role: 'SELLER' };
      if (token === 'unknown-user-token') return { id: 'user-with-no-seller' };
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
  createCorrelationId: vi.fn(() => 'corr-rev-int-1'),
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

// --- Reset the reviews handler module-level singletons between tests ---
vi.mock('../features/reviews/handler.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../features/reviews/handler.js')>();
  return actual;
});

import chatRoutes from '../../routes/chat.js';
import { llmCall } from '../llm/client.js';
import { _resetHandler } from '../features/reviews/handler.js';
import type { LLMResponse } from '../types/llm.types.js';
const mockLlmCall = vi.mocked(llmCall);

async function buildApp() {
  const app = Fastify();
  await app.register(chatRoutes, { prefix: '/chat' });
  return app;
}

function makeLlmResponse(text: string, toolCalls: any[] = []): LLMResponse {
  return {
    text,
    provider: 'anthropic',
    model: 'claude-sonnet-4-6',
    usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150, estimatedCostUsd: 0.001 },
    finishReason: 'stop',
    toolCallsExecuted: toolCalls.length,
    fallbackHops: 0,
    steps: toolCalls.length > 0 ? ([{ toolCalls }] as any) : undefined,
  };
}

describe('Reviews Agent Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    _resetHandler();

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
      { toolName: 'find_reviews_needing_response', resultJson: [sample1StarReview] },
    ]);
    mockPrisma.aiAutonomyState.upsert.mockResolvedValue({ featureKey: 'reviews', currentLevel: 'L0' });
    mockPrisma.aiAutonomyState.findUnique.mockResolvedValue({
      featureKey: 'reviews',
      currentLevel: 'L0',
      costBudgetCents: 50000,
    });
    mockPrisma.aiCustomerIdentity.create.mockResolvedValue({ id: 'ident-rev-int-1' });
    mockPrisma.aiIdentityAlias.findUnique.mockResolvedValue(null);
    mockPrisma.aiIdentityAlias.create.mockResolvedValue({
      id: 'alias-rev-int-1',
      identityId: 'ident-rev-int-1',
    });
    mockPrisma.seller.findFirst.mockImplementation((args: any) => {
      if (args?.where?.userId === SELLER_A_USER_ID) {
        return Promise.resolve({
          id: SELLER_A_ID,
          storeName: 'Caribbean Fresh Market',
          isBanned: false,
          isApproved: true,
        });
      }
      return Promise.resolve(null);
    });
  });

  it('seller asks "what reviews need responses" — full dispatch + handler + shaper wiring', async () => {
    mockLlmCall.mockResolvedValue(
      makeLlmResponse(
        "Here are the reviews that need a response: a 1-star review on Caribbean Hot Sauce — would you like me to draft a reply?",
        [{ toolCallId: 'tc-rev-1', toolName: 'find_reviews_needing_response', args: {} }],
      ),
    );

    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/chat',
      headers: { authorization: 'Bearer seller-a-token' },
      payload: {
        messages: [{ role: 'user', content: 'What reviews need responses?' }],
      },
    });

    const body = res.json();
    expect(res.statusCode).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.response).toBeTruthy();
    expect(body.response.length).toBeGreaterThan(0);
    expect(body.suggestions).toBeInstanceOf(Array);
    expect(body.conversationId).toBeTruthy();
    expect(body.data).toBeDefined();

    // Confirm the conversation was created with featureKey 'reviews'
    expect(mockPrisma.aiConversation.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ featureKey: 'reviews', channel: 'chat' }),
      }),
    );

    // Confirm seller lookup happened at dispatch with the right userId
    expect(mockPrisma.seller.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: SELLER_A_USER_ID } }),
    );
  }, 30_000);

  it('ownership check — seller A cannot see seller B\'s review content', async () => {
    // Tool call returns null because the service mock rejects cross-seller lookups
    mockPrisma.aiToolCall.findMany.mockResolvedValue([
      { toolName: 'get_review_by_id', resultJson: null },
    ]);

    mockLlmCall.mockResolvedValue(
      makeLlmResponse(
        "I couldn't find that review on your products. It may belong to a different seller, or the ID may be wrong.",
        [{ toolCallId: 'tc-rev-2', toolName: 'get_review_by_id', args: { reviewId: 50 } }],
      ),
    );

    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/chat',
      headers: { authorization: 'Bearer seller-a-token' },
      payload: {
        messages: [{ role: 'user', content: 'Show me review 50 — what does that customer say?' }],
      },
    });

    const body = res.json();
    expect(res.statusCode).toBe(200);
    expect(body.ok).toBe(true);
    // Critical: seller B's private comment text must NEVER appear in the response
    expect(body.response).not.toContain(sellerBReview.comment);
    expect(body.response).not.toContain('private complaint');
    // The data envelope must also not leak seller B's content
    if (body.data) {
      const dataStr = JSON.stringify(body.data);
      expect(dataStr).not.toContain('private complaint');
    }
  }, 30_000);

  it('unauthenticated dispatch — no seller token, falls through reviews branch gracefully', async () => {
    // With no token, getUserIdFromToken returns null. The reviews branch
    // skips the runReviews call entirely (no seller can be resolved), and
    // because referrals and cs_chat are disabled in this test, the request
    // falls through to the Gemini fallback.
    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/chat',
      payload: {
        messages: [{ role: 'user', content: 'Show me my reviews' }],
      },
    });

    expect(res.statusCode).toBe(200);
    // Reviews branch must NOT have invoked the LLM
    expect(mockLlmCall).not.toHaveBeenCalled();
    // Seller lookup must NOT have happened (no userId resolved from token)
    expect(mockPrisma.seller.findFirst).not.toHaveBeenCalled();
    // Conversation must NOT have been created with featureKey 'reviews'
    const reviewsConvCreates = mockPrisma.aiConversation.create.mock.calls.filter(
      (call: any) => call[0]?.data?.featureKey === 'reviews',
    );
    expect(reviewsConvCreates).toHaveLength(0);
  }, 30_000);

  it('forbidden behavior — agent never claims to publish a response', async () => {
    // The LLM is instructed by the system prompt to never claim to publish.
    // This test asserts that whatever it returns, our shaper does not
    // accidentally amplify a publishing claim. We mock a well-behaved LLM
    // response that follows the rules.
    mockLlmCall.mockResolvedValue(
      makeLlmResponse(
        "Here's a draft you can review and post yourself: \"I'm sorry to hear about the slow shipping and leaking bottle — please contact our support so we can make this right.\" Let me know if you'd like to adjust the tone.",
        [{ toolCallId: 'tc-rev-3', toolName: 'draft_response', args: { reviewId: 1 } }],
      ),
    );
    mockPrisma.aiToolCall.findMany.mockResolvedValue([
      {
        toolName: 'draft_response',
        resultJson: {
          reviewId: 1,
          productName: 'Caribbean Hot Sauce',
          customerFirstName: null,
          rating: 1,
          originalComment: sample1StarReview.comment,
          suggestedToneNotes: 'empathetic and solution-oriented',
        },
      },
    ]);

    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/chat',
      headers: { authorization: 'Bearer seller-a-token' },
      payload: {
        messages: [{ role: 'user', content: 'Publish a response to review 1 for me please' }],
      },
    });

    const body = res.json();
    expect(res.statusCode).toBe(200);
    expect(body.ok).toBe(true);
    // The response must NOT claim the agent published anything
    expect(body.response).not.toMatch(/I have published/i);
    expect(body.response).not.toMatch(/I've posted/i);
    expect(body.response).not.toMatch(/your response is now live/i);
    expect(body.response).not.toMatch(/published successfully/i);
    // It SHOULD frame the result as a draft
    expect(body.response.toLowerCase()).toContain('draft');
  }, 30_000);

  it('reviews flag off — review-intent message falls through to Gemini', async () => {
    const { isFeatureAllowed } = await import('../flags/index.js');
    const mockIsFeatureAllowed = vi.mocked(isFeatureAllowed);
    // All agent features disabled — reviews branch must not fire, and with
    // referrals and cs_chat also off the request falls through to Gemini.
    mockIsFeatureAllowed.mockImplementation(() => false);

    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/chat',
      headers: { authorization: 'Bearer seller-a-token' },
      payload: {
        messages: [{ role: 'user', content: 'Show me my reviews that need a response' }],
      },
    });

    const body = res.json();
    expect(res.statusCode).toBe(200);
    expect(body.ok).toBe(true);
    // Reviews branch must NOT have invoked the LLM
    expect(mockLlmCall).not.toHaveBeenCalled();
    // Seller lookup must NOT have happened (reviews branch gated off before it)
    expect(mockPrisma.seller.findFirst).not.toHaveBeenCalled();
    // No reviews conversation must have been created
    const reviewsConvCreates = mockPrisma.aiConversation.create.mock.calls.filter(
      (call: any) => call[0]?.data?.featureKey === 'reviews',
    );
    expect(reviewsConvCreates).toHaveLength(0);
  }, 30_000);
});
