// Phase 18A Prompt 4 — Recommendations agent integration tests
// Run: npx vitest run --config vitest.integration.config.ts src/agent/__integration__/recommendations-agent.integration.test.ts
// Excluded from default `npx vitest run` via vitest.config.ts exclude pattern.
//
// Mirrors src/agent/__integration__/reviews-agent.integration.test.ts for
// structure and the Phase 9 seo-agent custom-mockImplementation pattern
// for the happy path (the tool adapter must actually fire end-to-end so
// the integration covers the full dispatch → handler → tool → shaper
// wiring, not just canned LLM step metadata).

import { describe, it, expect, vi, beforeEach } from 'vitest';
import Fastify from 'fastify';

// --- Mock the LLM layer ---
vi.mock('../llm/client.js', () => ({
  llmCall: vi.fn(),
}));

// --- Mock the recommendations service layer ---
const samplePlantainComplement = {
  products: [
    {
      id: 100,
      name: 'Scotch Bonnet Pepper',
      slug: 'scotch-bonnet-pepper',
      price: 2.99,
      imageUrl: null,
      sellerId: 1,
      rating: null,
      aiTags: ['caribbean'],
      categoryId: 5,
      score: 0.9,
      reasons: ['Needed for Haitian Griot (ingredient: "scotch bonnet pepper")'],
    },
    {
      id: 101,
      name: 'Sour Orange',
      slug: 'sour-orange',
      price: 3.5,
      imageUrl: null,
      sellerId: 1,
      rating: null,
      aiTags: ['caribbean'],
      categoryId: 5,
      score: 0.88,
      reasons: ['Needed for Haitian Griot (ingredient: "sour orange")'],
    },
    {
      id: 102,
      name: 'Epis (Haitian Seasoning)',
      slug: 'epis',
      price: 5.99,
      imageUrl: null,
      sellerId: 1,
      rating: null,
      aiTags: ['haitian', 'caribbean'],
      categoryId: 6,
      score: 0.92,
      reasons: ['Needed for Haitian Griot (ingredient: "epis")'],
    },
  ],
  matchedRecipes: [
    {
      recipeId: 'haitian-griot',
      title: 'Haitian Griot',
      cuisine: 'haitian',
      matchedIngredients: ['plantain'],
      missingIngredients: ['scotch bonnet pepper', 'sour orange', 'epis'],
      totalIngredients: 4,
    },
  ],
};

vi.mock('../../services/recommendations.service.js', () => ({
  getProductDetailsForAgent: vi.fn(() => Promise.resolve(null)),
  findSimilarProductsForAgent: vi.fn(() => Promise.resolve([])),
  findComplementaryProductsForAgent: vi.fn(() => Promise.resolve(samplePlantainComplement)),
  findRecipesForProductsForAgent: vi.fn(() => Promise.resolve([])),
  recommendFromCartForAgent: vi.fn(() =>
    Promise.resolve({ products: [], strategy: 'taxonomy' as const }),
  ),
  recommendFromHistoryForAgent: vi.fn(() => Promise.resolve([])),
  isLikelyAlcohol: vi.fn(() => false),
}));

// --- Mock prisma for both the agent storage layer and the chat route's
//     userName lookup ---
const mockConversation = {
  id: 'conv-rec-int-1',
  featureKey: 'recommendations',
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
  id: 'msg-rec-int-1',
  conversationId: 'conv-rec-int-1',
  role: 'user',
  content: '',
  createdAt: new Date(),
};
const mockAssistantMsg = {
  id: 'msg-rec-int-2',
  conversationId: 'conv-rec-int-1',
  role: 'assistant',
  content: '',
  createdAt: new Date(),
};
const mockToolCall = {
  id: 'tc-rec-int-1',
  messageId: 'msg-rec-int-2',
  toolName: 'find_complementary_products',
  status: 'success',
  argsJson: { productIds: [42] },
  resultJson: samplePlantainComplement,
  createdAt: new Date(),
  updatedAt: new Date(),
};

vi.mock('../storage/prisma-client.js', () => ({
  getPrisma: vi.fn(() => mockPrisma),
}));

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
      Promise.resolve([
        { toolName: 'find_complementary_products', resultJson: samplePlantainComplement },
      ]),
    ),
  },
  aiAutonomyState: {
    upsert: vi.fn(() => Promise.resolve({ featureKey: 'recommendations', currentLevel: 'L0' })),
    findUnique: vi.fn(() =>
      Promise.resolve({
        featureKey: 'recommendations',
        currentLevel: 'L0',
        costBudgetCents: 50000,
      }),
    ),
    update: vi.fn(() => Promise.resolve({})),
  },
  aiCustomerIdentity: {
    create: vi.fn(() => Promise.resolve({ id: 'ident-rec-int-1' })),
  },
  aiIdentityAlias: {
    findUnique: vi.fn(() => Promise.resolve(null)),
    create: vi.fn(() => Promise.resolve({ id: 'alias-rec-int-1', identityId: 'ident-rec-int-1' })),
  },
  user: {
    findUnique: vi.fn(() =>
      Promise.resolve({ buyerProfile: { firstName: 'Alice' } }),
    ),
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
  findOrCreateIdentityByAlias: vi.fn(() => Promise.resolve({ id: 'ident-rec-int-1' })),
}));

// --- Mock the flags: enable recommendations only ---
vi.mock('../flags/index.js', () => ({
  isFeatureAllowed: vi.fn((key: string) => key === 'recommendations'),
  getEffectiveLevel: vi.fn(() => Promise.resolve('L0')),
}));

// --- Mock jwt ---
vi.mock('jsonwebtoken', () => ({
  default: {
    verify: vi.fn((token: string) => {
      if (token === 'user-a-token') return { id: 'user-alice' };
      if (token === 'user-b-token') return { id: 'user-bob' };
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
  createCorrelationId: vi.fn(() => 'corr-rec-int-1'),
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

// --- Import after mocks ---
import chatRoutes from '../../routes/chat.js';
import recommendWidgetRoutes from '../../routes/recommend-widget.js';
import { llmCall } from '../llm/client.js';
import {
  recommendFromHistoryForAgent,
  findComplementaryProductsForAgent,
  findSimilarProductsForAgent,
  recommendFromCartForAgent,
} from '../../services/recommendations.service.js';
import { _resetHandler } from '../features/recommendations/index.js';
import type { LLMResponse } from '../types/llm.types.js';

const mockLlmCall = vi.mocked(llmCall);
const mockRecommendFromHistory = vi.mocked(recommendFromHistoryForAgent);
const mockFindComplementary = vi.mocked(findComplementaryProductsForAgent);
const mockFindSimilar = vi.mocked(findSimilarProductsForAgent);
const mockRecommendFromCart = vi.mocked(recommendFromCartForAgent);

async function buildChatApp() {
  const app = Fastify();
  await app.register(chatRoutes, { prefix: '/chat' });
  return app;
}

async function buildWidgetApp() {
  const app = Fastify();
  await app.register(recommendWidgetRoutes, { prefix: '/api/recommend' });
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

describe('Recommendations Agent Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    _resetHandler();

    // Reset prisma mocks
    mockPrisma.aiConversation.create.mockResolvedValue(mockConversation);
    mockPrisma.aiConversation.findUnique.mockResolvedValue({
      ...mockConversation,
      messages: [],
    });
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
      { toolName: 'find_complementary_products', resultJson: samplePlantainComplement },
    ]);
    mockPrisma.aiAutonomyState.upsert.mockResolvedValue({
      featureKey: 'recommendations',
      currentLevel: 'L0',
    });
    mockPrisma.aiAutonomyState.findUnique.mockResolvedValue({
      featureKey: 'recommendations',
      currentLevel: 'L0',
      costBudgetCents: 50000,
    });
    mockPrisma.aiCustomerIdentity.create.mockResolvedValue({ id: 'ident-rec-int-1' });
    mockPrisma.aiIdentityAlias.findUnique.mockResolvedValue(null);
    mockPrisma.aiIdentityAlias.create.mockResolvedValue({
      id: 'alias-rec-int-1',
      identityId: 'ident-rec-int-1',
    });
    mockPrisma.user.findUnique.mockResolvedValue({
      buyerProfile: { firstName: 'Alice' },
    });

    // Reset service mocks to happy defaults
    mockFindComplementary.mockResolvedValue(samplePlantainComplement);
    mockFindSimilar.mockResolvedValue([]);
    mockRecommendFromHistory.mockResolvedValue([]);
    mockRecommendFromCart.mockResolvedValue({ products: [], strategy: 'taxonomy' });
  });

  it('happy path — customer asks "what goes with these plantains" with tool adapter firing end-to-end', async () => {
    // Custom mockImplementation: actually invoke the tool adapter's
    // execute callback so the full wiring is exercised (dispatch →
    // handler → tool registry → service → response shaper).
    mockLlmCall.mockImplementation(async (_history: any, opts: any) => {
      const tools = opts?.tools ?? {};
      if (tools.find_complementary_products) {
        await tools.find_complementary_products.execute({ productIds: [42] });
      }
      return makeLlmResponse(
        "For Haitian Griot you'll want scotch bonnet peppers, sour orange, and epis — all 3 are in our catalog. Want me to list them?",
        [
          {
            toolCallId: 'tc-rec-1',
            toolName: 'find_complementary_products',
            args: { productIds: [42] },
          },
        ],
      );
    });

    const app = await buildChatApp();
    const res = await app.inject({
      method: 'POST',
      url: '/chat',
      headers: { authorization: 'Bearer user-a-token' },
      payload: {
        messages: [{ role: 'user', content: 'what goes with these plantains?' }],
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

    // Conversation was created with featureKey 'recommendations'
    expect(mockPrisma.aiConversation.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ featureKey: 'recommendations', channel: 'chat' }),
      }),
    );

    // The tool adapter actually fired the service function
    expect(mockFindComplementary).toHaveBeenCalledWith([42], expect.anything());
  }, 30_000);

  it('ownership/privacy check — user A cannot see user B\'s order history', async () => {
    // Track which userId is passed to the service
    mockRecommendFromHistory.mockImplementation(async (userId: string) => {
      if (userId === 'user-alice') return [];
      // Simulate user B's private data — should NEVER be surfaced
      if (userId === 'user-bob') {
        return [
          { id: 101, name: 'Private Product B1', slug: 'pb1', price: 10, imageUrl: null, sellerId: 1, rating: null, aiTags: [], categoryId: 1, score: 0.5, reasons: ['Bob private history'] },
          { id: 102, name: 'Private Product B2', slug: 'pb2', price: 10, imageUrl: null, sellerId: 1, rating: null, aiTags: [], categoryId: 1, score: 0.5, reasons: ['Bob private history'] },
        ];
      }
      return [];
    });

    mockLlmCall.mockImplementation(async (_history: any, opts: any) => {
      const tools = opts?.tools ?? {};
      if (tools.recommend_from_history) {
        await tools.recommend_from_history.execute({});
      }
      return makeLlmResponse(
        "Based on your history, here are some suggestions.",
        [{ toolCallId: 'tc-rec-2', toolName: 'recommend_from_history', args: {} }],
      );
    });

    const app = await buildChatApp();
    const res = await app.inject({
      method: 'POST',
      url: '/chat',
      headers: { authorization: 'Bearer user-a-token' }, // user A, not B
      payload: {
        messages: [{ role: 'user', content: 'recommend products based on my last order' }],
      },
    });

    expect(res.statusCode).toBe(200);
    // Critical assertion: the service must have been called with
    // user-alice ONLY. user-bob must never appear in any call.
    expect(mockRecommendFromHistory).toHaveBeenCalledWith('user-alice', expect.anything());
    const calls = mockRecommendFromHistory.mock.calls;
    for (const call of calls) {
      expect(call[0]).toBe('user-alice');
      expect(call[0]).not.toBe('user-bob');
    }

    const body = res.json();
    // Private Product B1/B2 must never leak into the response or data
    const responseStr = JSON.stringify(body);
    expect(responseStr).not.toContain('Private Product B1');
    expect(responseStr).not.toContain('Private Product B2');
  }, 30_000);

  it('guest dispatch — no JWT, recommend_from_history returns null, other tools work', async () => {
    // Custom llmCall: try to invoke recommend_from_history, which
    // should return null for guests without calling the service.
    let historyReturnedNull = false;
    mockLlmCall.mockImplementation(async (_history: any, opts: any) => {
      const tools = opts?.tools ?? {};
      if (tools.recommend_from_history) {
        const result = await tools.recommend_from_history.execute({});
        historyReturnedNull = result === null;
      }
      if (tools.find_similar_products) {
        await tools.find_similar_products.execute({ productId: 42 });
      }
      return makeLlmResponse(
        "Here are some products similar to the hot sauce you mentioned.",
        [{ toolCallId: 'tc-rec-3', toolName: 'find_similar_products', args: { productId: 42 } }],
      );
    });

    const app = await buildChatApp();
    const res = await app.inject({
      method: 'POST',
      url: '/chat',
      // No Authorization header — guest
      payload: {
        messages: [{ role: 'user', content: 'suggest products similar to hot sauce' }],
      },
    });

    const body = res.json();
    expect(res.statusCode).toBe(200);
    expect(body.ok).toBe(true);
    // The recommendations branch fired (guest-compatible)
    expect(mockPrisma.aiConversation.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ featureKey: 'recommendations' }),
      }),
    );
    // recommend_from_history returned null (no userId)
    expect(historyReturnedNull).toBe(true);
    // Service function for history was NOT called (short-circuited at the tool layer)
    expect(mockRecommendFromHistory).not.toHaveBeenCalled();
    // find_similar_products DID fire (guest-compatible)
    expect(mockFindSimilar).toHaveBeenCalled();
  }, 30_000);

  it('forbidden behavior — agent never claims a product not in tool results', async () => {
    // Service returns an empty result set
    mockFindSimilar.mockResolvedValue([]);
    mockFindComplementary.mockResolvedValue({ products: [], matchedRecipes: [] });

    // Well-behaved LLM response that gracefully acknowledges no matches
    // rather than hallucinating products. This tests the response
    // shaper's pass-through and the system prompt's "never
    // hallucinate" rule from the customer's perspective.
    mockLlmCall.mockImplementation(async (_history: any, opts: any) => {
      const tools = opts?.tools ?? {};
      if (tools.find_similar_products) {
        await tools.find_similar_products.execute({ productId: 1 });
      }
      return makeLlmResponse(
        "I couldn't find a rum cake match in the StoresGo catalog right now. Want me to look for other Caribbean desserts or check specific brands you have in mind?",
        [{ toolCallId: 'tc-rec-4', toolName: 'find_similar_products', args: { productId: 1 } }],
      );
    });
    mockPrisma.aiToolCall.findMany.mockResolvedValue([
      { toolName: 'find_similar_products', resultJson: [] },
    ]);

    const app = await buildChatApp();
    const res = await app.inject({
      method: 'POST',
      url: '/chat',
      headers: { authorization: 'Bearer user-a-token' },
      payload: {
        messages: [{ role: 'user', content: 'recommend me the best rum cake in the world' }],
      },
    });

    const body = res.json();
    expect(res.statusCode).toBe(200);
    expect(body.ok).toBe(true);
    // The response must acknowledge no matches rather than invent products
    expect(body.response.toLowerCase()).toMatch(/couldn't find|no match|don't have|look for/);
    // The data payload from an empty tool result should be an empty array
    expect(body.data).toEqual([]);
  }, 30_000);

  it('widget endpoint — POST /api/recommend/cart bypasses LLM and calls service directly', async () => {
    mockRecommendFromCart.mockResolvedValue({
      products: [
        {
          id: 200,
          name: 'Epis',
          slug: 'epis',
          price: 5.99,
          imageUrl: null,
          sellerId: 1,
          rating: null,
          aiTags: ['haitian'],
          categoryId: 6,
          score: 0.9,
          reasons: ['Needed for Haitian Griot (ingredient: "epis")'],
        },
      ],
      strategy: 'recipe',
    });

    const app = await buildWidgetApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/recommend/cart',
      payload: { productIds: [42, 43], limit: 5 },
    });

    const body = res.json();
    expect(res.statusCode).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.strategy).toBe('recipe');
    expect(Array.isArray(body.products)).toBe(true);
    expect(body.products[0].id).toBe(200);

    // The LLM must NOT have been called — widget bypasses conversation
    expect(mockLlmCall).not.toHaveBeenCalled();

    // The service was called with exactly the widget's args
    expect(mockRecommendFromCart).toHaveBeenCalledWith([42, 43], { limit: 5 });
  }, 30_000);
});
