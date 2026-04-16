// Phase 9 Prompt 4 — SEO agent integration tests
// Run: npx vitest run --config vitest.integration.config.ts src/agent/__integration__/seo-agent.integration.test.ts
// Excluded from default `npx vitest run` via vitest.config.ts exclude pattern.
// Mirrors src/agent/__integration__/reviews-agent.integration.test.ts —
// LLM, prisma, services, jwt, requireAdmin, and the audit log repo are
// all mocked. This is an integration test of dispatch + handler + tool
// registry + shaper + audit log hook wiring, not a real DB or real
// LLM test.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import Fastify from 'fastify';

// --- Mock the LLM layer ---
vi.mock('../llm/client.js', () => ({
  llmCall: vi.fn(),
}));

// --- Mock the blog/seo service layer used by Phase 9 tools ---
const sampleAudit = {
  postId: 42,
  slug: 'caribbean-hot-sauce-guide',
  title: 'The Complete Caribbean Hot Sauce Guide',
  published: true,
  publishedAt: new Date('2026-03-01'),
  metrics: {
    titleLength: 43,
    metaDescriptionLength: 155,
    contentWordCount: 1200,
    h2Count: 6,
    internalLinkCount: 4,
    imageReferenceCount: 3,
    hasEmbedding: true,
  },
  issues: [
    {
      severity: 'warning' as const,
      code: 'few_internal_links',
      message: 'Only 4 internal links (recommended 2+)',
    },
    {
      severity: 'info' as const,
      code: 'no_images',
      message: 'Consider adding more featured imagery',
    },
  ],
  score: 94,
};

vi.mock('../../services/blog.service.js', () => ({
  auditBlogPostForOperator: vi.fn(() => Promise.resolve(sampleAudit)),
  findContentGapsForVertical: vi.fn(() => Promise.resolve([])),
  findOrphanBlogPosts: vi.fn(() => Promise.resolve([])),
  findSimilarBlogPosts: vi.fn(() => Promise.resolve([])),
  getBlogStatsForOperator: vi.fn(() =>
    Promise.resolve({
      total: 632,
      publishedLast7Days: 7,
      publishedLast30Days: 30,
      avgWordCount: 800,
      avgQualityScore: 85,
      topTags: [],
      orphanCount: 12,
      postsWithoutEmbedding: 0,
    }),
  ),
  loadBlogPostContextForDrafting: vi.fn(() =>
    Promise.resolve({
      topic: 'X',
      vertical: null,
      similarExistingPosts: [],
      relevantTags: [],
      recommendedWordCount: 800,
      recommendedHeadingStructure: [],
      forbiddenOverlap: [],
    }),
  ),
}));

vi.mock('../../services/seo.service.js', () => ({
  auditSeoPageForOperator: vi.fn(() => Promise.resolve(null)),
  // Existing pre-Phase-9 functions imported by other code paths:
  listSeoPages: vi.fn(() => Promise.resolve({ items: [], total: 0, page: 1, pageSize: 20 })),
  getSeoPageBySlug: vi.fn(() => Promise.resolve(null)),
  listSeasonalDeals: vi.fn(() => Promise.resolve({ items: [], total: 0, page: 1, pageSize: 20 })),
  getSeasonalDealById: vi.fn(() => Promise.resolve(null)),
}));

// --- Mock prisma for the agent storage layer ---
const mockConversation = {
  id: 'conv-seo-int-1',
  featureKey: 'seo',
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
  id: 'msg-seo-int-1',
  conversationId: 'conv-seo-int-1',
  role: 'user',
  content: '',
  createdAt: new Date(),
};
const mockAssistantMsg = {
  id: 'msg-seo-int-2',
  conversationId: 'conv-seo-int-1',
  role: 'assistant',
  content: '',
  createdAt: new Date(),
};
const mockToolCall = {
  id: 'tc-seo-int-1',
  messageId: 'msg-seo-int-2',
  toolName: 'audit_blog_post',
  status: 'success',
  argsJson: { postId: 42 },
  resultJson: sampleAudit,
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
      Promise.resolve([{ toolName: 'audit_blog_post', resultJson: sampleAudit }]),
    ),
  },
  aiAutonomyState: {
    upsert: vi.fn(() => Promise.resolve({ featureKey: 'seo', currentLevel: 'L0' })),
    findUnique: vi.fn(() =>
      Promise.resolve({ featureKey: 'seo', currentLevel: 'L0', costBudgetCents: 50000 }),
    ),
    update: vi.fn(() => Promise.resolve({})),
  },
  aiCustomerIdentity: {
    create: vi.fn(() => Promise.resolve({ id: 'ident-seo-int-1' })),
  },
  aiIdentityAlias: {
    findUnique: vi.fn(() => Promise.resolve(null)),
    create: vi.fn(() => Promise.resolve({ id: 'alias-seo-int-1', identityId: 'ident-seo-int-1' })),
  },
  aiAdminAuditLog: {
    create: vi.fn(() => Promise.resolve({})),
  },
  $transaction: vi.fn((fn: any) => fn(mockPrisma)),
} as any;

// --- Mock the admin audit log repo ---
// Factory-declared mock. The test body grabs a typed handle via
// vi.mocked(writeAdminAuditLog) after importing from the real path.
// This matches the pattern used by reviews-agent.integration.test.ts
// for llmCall and avoids the hoisting trap where vi.mock factories
// run before top-level const declarations.
vi.mock('../storage/admin-audit-log.repo.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../storage/admin-audit-log.repo.js')>();
  return {
    ...actual,
    writeAdminAuditLog: vi.fn(() => Promise.resolve()),
  };
});

// --- Mock the identity repo ---
vi.mock('../storage/identity.repo.js', () => ({
  findOrCreateIdentityByAlias: vi.fn(() => Promise.resolve({ id: 'ident-seo-int-1' })),
}));

// --- Mock the flags ---
let mockAllowedFeatures = new Set<string>(['seo']);
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
  createCorrelationId: vi.fn(() => 'corr-seo-int-1'),
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

// --- Reset the SEO handler module-level singletons between tests ---
vi.mock('../features/seo/handler.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../features/seo/handler.js')>();
  return actual;
});

import adminAgentSeoRoutes from '../../routes/admin/agent-seo.js';
import { llmCall } from '../llm/client.js';
import { _resetHandler } from '../features/seo/handler.js';
import { writeAdminAuditLog } from '../storage/admin-audit-log.repo.js';
import type { LLMResponse } from '../types/llm.types.js';
const mockLlmCall = vi.mocked(llmCall);
const mockWriteAuditLog = vi.mocked(writeAdminAuditLog);

async function buildApp() {
  const app = Fastify();
  // Mount at /api/admin/agent/seo to match the real prefix chain
  // (src/routes/index.ts + src/routes/admin/index.ts chain the prefixes).
  await app.register(adminAgentSeoRoutes, { prefix: '/api/admin/agent/seo' });
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

describe('SEO Agent Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    _resetHandler();

    // Reset the swappable state
    mockAllowedFeatures = new Set(['seo']);
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
      { toolName: 'audit_blog_post', resultJson: sampleAudit },
    ]);
    mockPrisma.aiAutonomyState.upsert.mockResolvedValue({ featureKey: 'seo', currentLevel: 'L0' });
    mockPrisma.aiAutonomyState.findUnique.mockResolvedValue({
      featureKey: 'seo',
      currentLevel: 'L0',
      costBudgetCents: 50000,
    });
    mockPrisma.aiCustomerIdentity.create.mockResolvedValue({ id: 'ident-seo-int-1' });
    mockPrisma.aiIdentityAlias.findUnique.mockResolvedValue(null);
    mockPrisma.aiIdentityAlias.create.mockResolvedValue({
      id: 'alias-seo-int-1',
      identityId: 'ident-seo-int-1',
    });
  });

  it('happy path — admin asks "audit blog post 42", tool runs, audit log fires', async () => {
    // Custom mock: actually invoke the tool's execute callback via the
    // tool-adapter so the audit log hook in tool-adapter.ts fires. A
    // plain mockResolvedValue(makeLlmResponse(..., [...])) only attaches
    // fake steps metadata and never calls the tool adapter, so the
    // audit log wiring wouldn't be exercised end-to-end.
    mockLlmCall.mockImplementation(async (_history: any, opts: any) => {
      const tools = opts?.tools ?? {};
      if (tools.audit_blog_post) {
        await tools.audit_blog_post.execute({ postId: 42 });
      }
      return makeLlmResponse(
        "Here's the audit for post 42 (Caribbean Hot Sauce Guide): overall score 94. Two issues: only 4 internal links (recommended 2+) and no images. Otherwise strong — title 43 chars, meta 155 chars, 1200 words, 6 H2 sections.",
        [{ toolCallId: 'tc-seo-1', toolName: 'audit_blog_post', args: { postId: 42 } }],
      );
    });

    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/admin/agent/seo',
      headers: { authorization: 'Bearer admin-token' },
      payload: { userText: 'audit blog post 42' },
    });

    const body = res.json();
    expect(res.statusCode).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.response).toBeTruthy();
    expect(body.response.length).toBeGreaterThan(0);
    expect(body.suggestions).toBeInstanceOf(Array);
    expect(body.conversationId).toBeTruthy();
    // body.data comes back through JSON serialization, so the Date
    // becomes an ISO string. Compare the stable fields explicitly.
    expect(body.data.postId).toBe(42);
    expect(body.data.slug).toBe('caribbean-hot-sauce-guide');
    expect(body.data.score).toBe(94);
    expect(body.data.issues).toHaveLength(2);

    // Confirm the conversation was created with featureKey 'seo'
    expect(mockPrisma.aiConversation.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ featureKey: 'seo', channel: 'chat' }),
      }),
    );

    // Confirm the audit log hook fired with adminId=7 and success=true
    expect(mockWriteAuditLog).toHaveBeenCalled();
    const auditCall = mockWriteAuditLog.mock.calls[0]?.[0];
    expect(auditCall).toBeDefined();
    expect((auditCall as any).adminId).toBe(7);
    expect((auditCall as any).featureKey).toBe('seo');
    expect((auditCall as any).toolName).toBe('audit_blog_post');
    expect((auditCall as any).success).toBe(true);
  }, 30_000);

  it('admin identity missing — requireAdmin rejects, runSeo never invoked', async () => {
    // Swap the mock to simulate rejection
    mockAdminPayload = null;

    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/admin/agent/seo',
      payload: { userText: 'audit blog post 42' },
    });

    expect(res.statusCode).toBe(401);

    // runSeo -> runner -> LLM should NEVER have been called
    expect(mockLlmCall).not.toHaveBeenCalled();
    // No conversation row was created with featureKey 'seo'
    const seoConvCreates = mockPrisma.aiConversation.create.mock.calls.filter(
      (call: any) => call[0]?.data?.featureKey === 'seo',
    );
    expect(seoConvCreates).toHaveLength(0);
    // No audit log write fired
    expect(mockWriteAuditLog).not.toHaveBeenCalled();
  }, 30_000);

  it('feature flag disabled — route returns 403, runSeo never invoked', async () => {
    // seo missing from the allowed set
    mockAllowedFeatures = new Set(['cs_chat', 'referrals', 'reviews']);

    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/admin/agent/seo',
      headers: { authorization: 'Bearer admin-token' },
      payload: { userText: 'audit blog post 42' },
    });

    expect(res.statusCode).toBe(403);
    const body = res.json();
    expect(body.ok).toBe(false);
    expect(body.error).toContain('not enabled');

    // runSeo -> runner -> LLM should NEVER have been called
    expect(mockLlmCall).not.toHaveBeenCalled();
    // No audit log write fired
    expect(mockWriteAuditLog).not.toHaveBeenCalled();
  }, 30_000);

  it('forbidden behavior — agent never claims to have published', async () => {
    // A well-behaved LLM response that follows the system prompt's
    // NEVER PUBLISH rule. The test guards the response shaper against
    // accidentally amplifying any publishing claim the LLM might emit.
    mockLlmCall.mockResolvedValue(
      makeLlmResponse(
        "I cannot publish blog posts — I'm a read-only SEO auditor. If you want me to help, I can audit the current draft, suggest related posts to link to, or outline improvements you can apply manually.",
        [],
      ),
    );

    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/admin/agent/seo',
      headers: { authorization: 'Bearer admin-token' },
      payload: { userText: 'publish this blog post for me' },
    });

    const body = res.json();
    expect(res.statusCode).toBe(200);
    expect(body.ok).toBe(true);

    // The response must NOT claim the agent published anything
    expect(body.response).not.toMatch(/I have published/i);
    expect(body.response).not.toMatch(/I've posted/i);
    expect(body.response).not.toMatch(/your (?:post|response) is now live/i);
    expect(body.response).not.toMatch(/published successfully/i);
    expect(body.response).not.toMatch(/I have updated/i);
    // It SHOULD explicitly refuse or redirect to read-only alternatives
    expect(body.response.toLowerCase()).toMatch(/cannot publish|audit|read-only/);
  }, 30_000);
});
