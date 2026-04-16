// Agent Suite — CS Chat handler tests (Phase 1 Prompt 3)

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

vi.mock('../../../tools/cs/index.js', () => ({
  registerCsTools: vi.fn((reg: any) => {
    reg.register({ name: 'get_order_by_id' });
    reg.register({ name: 'get_user_orders' });
    reg.register({ name: 'get_seller_info' });
    reg.register({ name: 'search_products_meili' });
  }),
}));

vi.mock('../../../tools/catalog/index.js', () => ({
  getProductByIdTool: { name: 'get_product_by_id' },
  listCategoriesTool: { name: 'list_categories' },
  getStoreStatsTool: { name: 'get_store_stats' },
}));

vi.mock('../context-cache.js', () => ({
  getStoreContext: vi.fn(),
}));

vi.mock('../identity-resolver.js', () => ({
  resolveCsIdentity: vi.fn(),
}));

vi.mock('../system-prompt.js', () => ({
  renderCsSystemPrompt: vi.fn(() => 'rendered system prompt'),
  CS_TEMPLATE_HASH: 'testhash1234abcd',
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

import { runCsChat, _resetHandler } from '../handler.js';
import { getStoreContext } from '../context-cache.js';
import { resolveCsIdentity } from '../identity-resolver.js';
import { shapeResponse, shapeErrorResponse } from '../response-shaper.js';
import { AutonomyRepo } from '../../../storage/index.js';
import type { RunResult } from '../../../runner/types.js';

const mockGetStoreContext = vi.mocked(getStoreContext);
const mockResolveCsIdentity = vi.mocked(resolveCsIdentity);
const mockShapeResponse = vi.mocked(shapeResponse);
const mockShapeErrorResponse = vi.mocked(shapeErrorResponse);
const mockInitFeature = vi.mocked(AutonomyRepo.initializeFeature);

function makeRunResult(overrides: Partial<RunResult> = {}): RunResult {
  return {
    text: 'Hello!',
    conversationId: 'conv-1',
    userMessageId: 'msg-1',
    assistantMessageId: 'msg-2',
    toolCallsExecuted: 0,
    toolCallIds: [],
    autonomyLevel: 'L1',
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

describe('runCsChat handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    _resetHandler();

    mockGetStoreContext.mockResolvedValue({
      productCount: 1000,
      activeSellerCount: 10,
      categoryCount: 50,
      orderCount: 500,
      sellerNames: ['Store A'],
      categoryNames: ['Produce'],
      cachedAt: Date.now(),
    });

    mockResolveCsIdentity.mockResolvedValue({
      identityId: 'id-1',
      aliasValue: 'user-123',
      isGuest: false,
      userName: 'Jon',
      email: 'jon@storesgo.com',
      recentOrders: [],
    });

    mockRunnerRun.mockResolvedValue(makeRunResult());

    mockShapeResponse.mockResolvedValue({
      ok: true,
      response: 'Hello!',
      suggestions: ['Browse'],
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

  it('resolves identity, runs agent, and returns shaped response', async () => {
    const result = await runCsChat({ userText: 'Hi', userId: 'user-123' });

    expect(result.ok).toBe(true);
    expect(result.response).toBe('Hello!');
    expect(mockResolveCsIdentity).toHaveBeenCalledWith({ userId: 'user-123', guestSessionId: undefined });
    expect(mockRunnerRun).toHaveBeenCalledWith(
      expect.objectContaining({
        featureKey: 'cs_chat',
        userText: 'Hi',
        userId: 'user-123',
        identityId: 'id-1',
      }),
    );
  });

  it('passes userId through to runner for ownership-checked tools', async () => {
    await runCsChat({ userText: 'My orders', userId: 'user-456' });

    expect(mockRunnerRun).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-456' }),
    );
  });

  it('mints guestSessionId for fresh guest', async () => {
    mockResolveCsIdentity.mockResolvedValue({
      identityId: 'id-guest',
      aliasValue: 'fresh-uuid',
      isGuest: true,
    });

    const result = await runCsChat({ userText: 'Hi' });

    expect(result.guestSessionId).toBe('fresh-uuid');
  });

  it('does NOT return guestSessionId for existing guest session', async () => {
    mockResolveCsIdentity.mockResolvedValue({
      identityId: 'id-guest',
      aliasValue: 'existing-sess',
      isGuest: true,
    });

    const result = await runCsChat({ userText: 'Hi', guestSessionId: 'existing-sess' });

    expect(result.guestSessionId).toBeUndefined();
  });

  it('returns canned error response on runner failure', async () => {
    mockRunnerRun.mockRejectedValue(new Error('LLM exploded'));

    const result = await runCsChat({ userText: 'Hi', userId: 'user-123' });

    expect(result.ok).toBe(false);
    expect(mockShapeErrorResponse).toHaveBeenCalled();
  });

  it('initializes feature before first run', async () => {
    await runCsChat({ userText: 'Hi', userId: 'user-123' });

    expect(mockInitFeature).toHaveBeenCalledWith('cs_chat');
  });

  it('uses cached store context for system prompt', async () => {
    await runCsChat({ userText: 'Hi', userId: 'user-123' });

    expect(mockGetStoreContext).toHaveBeenCalled();
  });
});
