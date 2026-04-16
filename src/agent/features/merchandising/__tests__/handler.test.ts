// Agent Suite — Merchandising handler tests (Phase 12 Prompt 2)

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

vi.mock('../../../tools/merchandising/index.js', () => ({
  registerMerchandisingTools: vi.fn((reg: any) => {
    reg.register({ name: 'get_merchandising_snapshot' });
    reg.register({ name: 'find_featured_products_zero_orders' });
    reg.register({ name: 'find_uncovered_categories' });
    reg.register({ name: 'get_featured_product_performance' });
    reg.register({ name: 'list_cms_blocks_schedule' });
  }),
}));

vi.mock('../identity-resolver.js', () => ({
  resolveMerchandisingIdentity: vi.fn(),
}));

vi.mock('../system-prompt.js', () => ({
  renderMerchandisingSystemPrompt: vi.fn(() => 'rendered merchandising system prompt'),
  MERCHANDISING_FEATURE_KEY: 'merchandising',
  MERCHANDISING_TEMPLATE_HASH: 'merchhash1234abc',
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

import { runMerchandising, _resetHandler } from '../handler.js';
import { resolveMerchandisingIdentity } from '../identity-resolver.js';
import { shapeResponse, shapeErrorResponse } from '../response-shaper.js';
import { AutonomyRepo } from '../../../storage/index.js';
import type { RunResult } from '../../../runner/types.js';

const mockResolveIdentity = vi.mocked(resolveMerchandisingIdentity);
const mockShapeResponse = vi.mocked(shapeResponse);
const mockShapeErrorResponse = vi.mocked(shapeErrorResponse);
const mockInitFeature = vi.mocked(AutonomyRepo.initializeFeature);

function makeRunResult(overrides: Partial<RunResult> = {}): RunResult {
  return {
    text: 'Merchandising snapshot returned.',
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

describe('runMerchandising handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    _resetHandler();

    mockResolveIdentity.mockResolvedValue({
      identityId: 'id-1',
      aliasValue: 'admin-7',
      isAuthenticated: true,
    });

    mockRunnerRun.mockResolvedValue(makeRunResult());

    mockShapeResponse.mockResolvedValue({
      ok: true,
      response: 'Merchandising snapshot returned.',
      suggestions: ['Find featured products with zero orders'],
      conversationId: 'conv-1',
      correlationId: 'corr-1',
    });

    mockShapeErrorResponse.mockReturnValue({
      ok: false,
      response: "I'm having a brief issue with the merchandising assistant.",
      suggestions: ['Try again'],
      conversationId: '',
      correlationId: '',
    });
  });

  it('calls ensureFeatureInitialized before run', async () => {
    await runMerchandising({ userText: "what's on my homepage?", adminId: 7 });
    expect(mockInitFeature).toHaveBeenCalledWith('merchandising');
  });

  it('passes featureKey merchandising to runner', async () => {
    await runMerchandising({ userText: "what's on my homepage?", adminId: 7 });
    expect(mockRunnerRun).toHaveBeenCalledWith(
      expect.objectContaining({ featureKey: 'merchandising' }),
    );
  });

  it('forwards adminId to runner.run', async () => {
    await runMerchandising({
      userText: "what's on my homepage?",
      adminId: 7,
      conversationId: 'conv-existing',
    });

    expect(mockRunnerRun).toHaveBeenCalledWith(
      expect.objectContaining({
        adminId: 7,
        conversationId: 'conv-existing',
        identityId: 'id-1',
      }),
    );
  });

  it('returns shaped response', async () => {
    const result = await runMerchandising({ userText: "what's on my homepage?", adminId: 7 });
    expect(result.ok).toBe(true);
    expect(result.response).toBe('Merchandising snapshot returned.');
    expect(result.suggestions).toEqual(['Find featured products with zero orders']);
  });

  it('returns error response on runner failure', async () => {
    mockRunnerRun.mockRejectedValue(new Error('LLM exploded'));
    const result = await runMerchandising({ userText: "what's on my homepage?", adminId: 7 });
    expect(result.ok).toBe(false);
    expect(mockShapeErrorResponse).toHaveBeenCalled();
  });

  it('handles unauthenticated caller (no adminId) without crashing', async () => {
    mockResolveIdentity.mockResolvedValue({
      identityId: 'id-guest',
      aliasValue: 'fresh-uuid',
      isAuthenticated: false,
    });

    const result = await runMerchandising({ userText: 'how do I use this?', adminId: null });

    expect(result.ok).toBe(true);
    expect(mockRunnerRun).toHaveBeenCalledWith(
      expect.objectContaining({ adminId: undefined }),
    );
  });
});
