// Phase 12 Prompt 2 — Merchandising agent integration tests
// Run: npx vitest run --config vitest.integration.config.ts src/agent/__integration__/merchandising-agent.integration.test.ts
// Excluded from default `npx vitest run` via vitest.config.ts exclude pattern.
// Mirrors src/agent/__integration__/seo-agent.integration.test.ts — LLM,
// prisma, homepage.service, jwt, requireAdmin, and the audit log repo are
// all mocked. This is an integration test of dispatch + handler + tool
// registry + shaper + audit log hook wiring, not a real DB or real LLM
// test.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import Fastify from 'fastify';

// --- Mock the LLM layer ---
vi.mock('../llm/client.js', () => ({
  llmCall: vi.fn(),
}));

// --- Mock homepage.service's getMerchandisingSnapshot ---
const sampleSnapshot = {
  windowDays: 30,
  generatedAt: new Date('2026-04-11T00:00:00Z'),
  featuredProducts: [
    {
      id: 1,
      name: 'Caribbean Hot Sauce',
      priceCents: 999,
      addedToFeatured: new Date('2026-04-01T00:00:00Z'),
      orders7d: 5,
      orders30d: 12,
      views7d: null,
      favoriteAdds7d: 3,
      stockStatus: 'ok' as const,
    },
    {
      id: 2,
      name: 'Yams',
      priceCents: 499,
      addedToFeatured: new Date('2026-04-01T00:00:00Z'),
      orders7d: 0,
      orders30d: 0,
      views7d: null,
      favoriteAdds7d: 0,
      stockStatus: 'out_of_stock' as const,
    },
  ],
  featuredCategories: [
    { id: 10, name: 'Caribbean', productCount: 47, orders7d: 12 },
  ],
  cmsBlocks: [
    {
      id: 100,
      key: 'hero-spring-sauce',
      type: 'hero',
      order: 0,
      isActive: true,
      startDate: null,
      endDate: null,
    },
  ],
  homepage: {
    heroTitle: 'Welcome to StoresGo',
    heroSubtitle: 'Your marketplace',
    showNewArrivals: true,
    showDeals: true,
    showPopular: true,
    updatedAt: new Date('2026-04-01T00:00:00Z'),
  },
  coverageGaps: {
    categoriesWithoutFeatured: ['Rice', 'Spices'],
    featuredProductsWithZeroOrders: [2],
  },
};

vi.mock('../../services/homepage.service.js', () => ({
  getMerchandisingSnapshot: vi.fn(() => Promise.resolve(sampleSnapshot)),
}));

// --- Mock prisma for the agent storage layer ---
const mockConversation = {
  id: 'conv-merch-int-1',
  featureKey: 'merchandising',
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
  id: 'msg-merch-int-1',
  conversationId: 'conv-merch-int-1',
  role: 'user',
  content: '',
  createdAt: new Date(),
};
const mockAssistantMsg = {
  id: 'msg-merch-int-2',
  conversationId: 'conv-merch-int-1',
  role: 'assistant',
  content: '',
  createdAt: new Date(),
};
const mockToolCall = {
  id: 'tc-merch-int-1',
  messageId: 'msg-merch-int-2',
  toolName: 'get_merchandising_snapshot',
  status: 'success',
  argsJson: {},
  resultJson: sampleSnapshot,
  createdAt: new Date(),
  updatedAt: new Date(),
};

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
    findMany: vi.fn(() =>
      Promise.resolve([{ toolName: 'get_merchandising_snapshot', resultJson: sampleSnapshot }]),
    ),
  },
  aiAutonomyState: {
    upsert: vi.fn(() => Promise.resolve({ featureKey: 'merchandising', currentLevel: 'L0' })),
    findUnique: vi.fn(() =>
      Promise.resolve({ featureKey: 'merchandising', currentLevel: 'L0', costBudgetCents: 50000 }),
    ),
    update: vi.fn(() => Promise.resolve({})),
  },
  aiCustomerIdentity: {
    create: vi.fn(() => Promise.resolve({ id: 'ident-merch-int-1' })),
  },
  aiIdentityAlias: {
    findUnique: vi.fn(() => Promise.resolve(null)),
    create: vi.fn(() =>
      Promise.resolve({ id: 'alias-merch-int-1', identityId: 'ident-merch-int-1' }),
    ),
  },
  aiAdminAuditLog: {
    create: vi.fn(() => Promise.resolve({})),
  },
  $transaction: vi.fn((fn: any) => fn(mockPrisma)),
} as any;

// --- Mock the admin audit log repo ---
vi.mock('../storage/admin-audit-log.repo.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../storage/admin-audit-log.repo.js')>();
  return {
    ...actual,
    writeAdminAuditLog: vi.fn(() => Promise.resolve()),
  };
});

// --- Mock the identity repo ---
vi.mock('../storage/identity.repo.js', () => ({
  findOrCreateIdentityByAlias: vi.fn(() => Promise.resolve({ id: 'ident-merch-int-1' })),
}));

// --- Mock the flags ---
let mockAllowedFeatures = new Set<string>(['merchandising']);
vi.mock('../flags/index.js', () => ({
  isFeatureAllowed: vi.fn((key: string) => mockAllowedFeatures.has(key)),
  getEffectiveLevel: vi.fn(() => Promise.resolve('L0')),
}));

// --- Mock requireAdmin: swappable per test (auth-pass or auth-fail) ---
let mockAdminPayload: { adminId: number; email: string; role: string } | null = {
  adminId: 7,
  email: 'jon@storesgo.com',
  role: 'admin',
};

vi.mock('../../utils/requireAdmin.js', () => ({
  requireAdmin: vi.fn(async (request: any, reply: any) => {
    if (mockAdminPayload === null) {
      return reply.status(401).send({ ok: false, message: 'Unauthorized' });
    }
    request.admin = mockAdminPayload;
  }),
}));

// --- Mock observability ---
vi.mock('../observability/index.js', () => ({
  createChildLogger: vi.fn(() => ({
    child: vi.fn(() => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() })),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
  createCorrelationId: vi.fn(() => 'corr-merch-int-1'),
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

// --- Reset the merchandising handler module-level singletons between tests ---
vi.mock('../features/merchandising/handler.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../features/merchandising/handler.js')>();
  return actual;
});

import adminAgentMerchandisingRoutes from '../../routes/admin/agent-merchandising.js';
import { llmCall } from '../llm/client.js';
import { _resetHandler } from '../features/merchandising/handler.js';
import { writeAdminAuditLog } from '../storage/admin-audit-log.repo.js';
import type { LLMResponse } from '../types/llm.types.js';
const mockLlmCall = vi.mocked(llmCall);
const mockWriteAuditLog = vi.mocked(writeAdminAuditLog);

async function buildApp() {
  const app = Fastify();
  await app.register(adminAgentMerchandisingRoutes, { prefix: '/api/admin/agent/merchandising' });
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

describe('Merchandising Agent Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    _resetHandler();

    mockAllowedFeatures = new Set(['merchandising']);
    mockAdminPayload = { adminId: 7, email: 'jon@storesgo.com', role: 'admin' };

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
      { toolName: 'get_merchandising_snapshot', resultJson: sampleSnapshot },
    ]);
    mockPrisma.aiAutonomyState.upsert.mockResolvedValue({
      featureKey: 'merchandising',
      currentLevel: 'L0',
    });
    mockPrisma.aiAutonomyState.findUnique.mockResolvedValue({
      featureKey: 'merchandising',
      currentLevel: 'L0',
      costBudgetCents: 50000,
    });
    mockPrisma.aiCustomerIdentity.create.mockResolvedValue({ id: 'ident-merch-int-1' });
    mockPrisma.aiIdentityAlias.findUnique.mockResolvedValue(null);
    mockPrisma.aiIdentityAlias.create.mockResolvedValue({
      id: 'alias-merch-int-1',
      identityId: 'ident-merch-int-1',
    });
  });

  it("happy path — admin asks \"what's on my homepage?\", snapshot tool runs, audit log fires", async () => {
    // Custom mock: actually invoke the tool's execute callback via the
    // tool-adapter so the audit log hook in tool-adapter.ts fires. A
    // plain mockResolvedValue(makeLlmResponse(..., [...])) only attaches
    // fake steps metadata and never calls the tool adapter.
    mockLlmCall.mockImplementation(async (_history: any, opts: any) => {
      const tools = opts?.tools ?? {};
      if (tools.get_merchandising_snapshot) {
        await tools.get_merchandising_snapshot.execute({});
      }
      return makeLlmResponse(
        "Here's the current homepage: 2 featured products (Caribbean Hot Sauce doing well, Yams with 0 orders in 30d — and out of stock). 1 uncovered category: Rice, Spices. Suggestion: swap Yams out for something from Rice or Spices.",
        [{ toolCallId: 'tc-merch-1', toolName: 'get_merchandising_snapshot', args: {} }],
      );
    });

    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/admin/agent/merchandising',
      headers: { authorization: 'Bearer admin-token' },
      payload: { userText: "what's on my homepage?" },
    });

    const body = res.json();
    expect(res.statusCode).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.response).toBeTruthy();
    expect(body.response.length).toBeGreaterThan(0);
    expect(body.suggestions).toBeInstanceOf(Array);
    expect(body.conversationId).toBeTruthy();
    // The tool result comes back through the shaper as body.data
    expect(body.data).toBeDefined();
    expect(body.data.coverageGaps.featuredProductsWithZeroOrders).toEqual([2]);
    expect(body.data.coverageGaps.categoriesWithoutFeatured).toEqual(['Rice', 'Spices']);

    // Confirm the conversation was created with featureKey 'merchandising'
    expect(mockPrisma.aiConversation.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ featureKey: 'merchandising', channel: 'chat' }),
      }),
    );

    // Confirm the audit log hook fired with adminId=7 and success=true
    expect(mockWriteAuditLog).toHaveBeenCalled();
    const auditCall = mockWriteAuditLog.mock.calls[0]?.[0];
    expect(auditCall).toBeDefined();
    expect((auditCall as any).adminId).toBe(7);
    expect((auditCall as any).featureKey).toBe('merchandising');
    expect((auditCall as any).toolName).toBe('get_merchandising_snapshot');
    expect((auditCall as any).success).toBe(true);
  }, 30_000);

  it('admin identity missing — requireAdmin rejects, runMerchandising never invoked', async () => {
    mockAdminPayload = null;

    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/admin/agent/merchandising',
      payload: { userText: "what's on my homepage?" },
    });

    expect(res.statusCode).toBe(401);

    // runMerchandising -> runner -> LLM should NEVER have been called
    expect(mockLlmCall).not.toHaveBeenCalled();
    // No conversation row was created with featureKey 'merchandising'
    const merchConvCreates = mockPrisma.aiConversation.create.mock.calls.filter(
      (call: any) => call[0]?.data?.featureKey === 'merchandising',
    );
    expect(merchConvCreates).toHaveLength(0);
    // No audit log write fired
    expect(mockWriteAuditLog).not.toHaveBeenCalled();
  }, 30_000);

  it('feature flag disabled — route returns 403, runMerchandising never invoked', async () => {
    // merchandising missing from the allowed set
    mockAllowedFeatures = new Set(['cs_chat', 'referrals', 'reviews', 'seo']);

    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/admin/agent/merchandising',
      headers: { authorization: 'Bearer admin-token' },
      payload: { userText: "what's on my homepage?" },
    });

    expect(res.statusCode).toBe(403);
    const body = res.json();
    expect(body.ok).toBe(false);
    expect(body.error).toContain('not enabled');

    // runMerchandising -> runner -> LLM should NEVER have been called
    expect(mockLlmCall).not.toHaveBeenCalled();
    // No audit log write fired
    expect(mockWriteAuditLog).not.toHaveBeenCalled();
  }, 30_000);

  it('forbidden behavior — agent never claims to have applied/published changes', async () => {
    // A well-behaved LLM response that follows the system prompt's
    // NEVER APPLY / NEVER PUBLISH rule. The test guards against
    // accidentally amplifying any claim that a change has been made.
    mockLlmCall.mockResolvedValue(
      makeLlmResponse(
        "I cannot apply changes to the homepage — I'm a read-only auditor. I can SUGGEST: (1) swap Yams out of the featured slot since it has 0 orders in 30 days and is out of stock, (2) consider adding a product from Rice or Spices to cover those uncovered categories. You can apply these in the admin UI.",
        [],
      ),
    );

    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/admin/agent/merchandising',
      headers: { authorization: 'Bearer admin-token' },
      payload: { userText: 'swap out the dead featured slot for me' },
    });

    const body = res.json();
    expect(res.statusCode).toBe(200);
    expect(body.ok).toBe(true);

    // The response must NOT claim the agent applied/published anything
    expect(body.response).not.toMatch(/I have applied/i);
    expect(body.response).not.toMatch(/I have published/i);
    expect(body.response).not.toMatch(/I've swapped/i);
    expect(body.response).not.toMatch(/the hero is now/i);
    expect(body.response).not.toMatch(/your homepage is now/i);
    expect(body.response).not.toMatch(/I have updated/i);
    // It SHOULD explicitly refuse or redirect to suggestions
    expect(body.response.toLowerCase()).toMatch(/cannot|suggest|admin ui|read-only/);
  }, 30_000);

  it('registry contains only L0 read tools — no write/publish/update tool in the merchandising registry', async () => {
    // Defense in depth: the "draft-only" semantics depend on the
    // registry not containing any mutation tool. This test verifies
    // the registry that gets passed to the runner has exactly the 5
    // expected L0 tools and nothing that could mutate state.
    mockLlmCall.mockImplementation(async (_history: any, opts: any) => {
      const tools = opts?.tools ?? {};
      const toolNames = Object.keys(tools);
      // Assert exactly the 5 expected tool names are present
      expect(toolNames.sort()).toEqual([
        'find_featured_products_zero_orders',
        'find_uncovered_categories',
        'get_featured_product_performance',
        'get_merchandising_snapshot',
        'list_cms_blocks_schedule',
      ]);
      // Assert no tool name suggests a mutation
      for (const name of toolNames) {
        expect(name).not.toMatch(/update|publish|apply|write|create|delete|mutate|set_/i);
      }
      return makeLlmResponse('Registry audit complete.', []);
    });

    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/admin/agent/merchandising',
      headers: { authorization: 'Bearer admin-token' },
      payload: { userText: 'show me the tools available' },
    });

    expect(res.statusCode).toBe(200);
    expect(mockLlmCall).toHaveBeenCalled();
  }, 30_000);
});
