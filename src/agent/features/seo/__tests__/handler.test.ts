// Agent Suite — SEO handler tests (Phase 9 Prompt 3)

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

vi.mock('../../../tools/seo/index.js', () => ({
  registerSeoTools: vi.fn((reg: any) => {
    reg.register({ name: 'audit_blog_post' });
    reg.register({ name: 'audit_seo_page' });
    reg.register({ name: 'find_content_gaps' });
    reg.register({ name: 'find_orphan_blog_posts' });
    reg.register({ name: 'find_similar_blog_posts' });
    reg.register({ name: 'get_blog_stats' });
    reg.register({ name: 'draft_blog_post_outline' });
  }),
}));

vi.mock('../identity-resolver.js', () => ({
  resolveSeoIdentity: vi.fn(),
}));

vi.mock('../system-prompt.js', () => ({
  renderSeoSystemPrompt: vi.fn(() => 'rendered seo system prompt'),
  SEO_FEATURE_KEY: 'seo',
  SEO_TEMPLATE_HASH: 'seohash1234abcd',
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

import { runSeo, _resetHandler } from '../handler.js';
import { resolveSeoIdentity } from '../identity-resolver.js';
import { shapeResponse, shapeErrorResponse } from '../response-shaper.js';
import { AutonomyRepo } from '../../../storage/index.js';
import type { RunResult } from '../../../runner/types.js';

const mockResolveIdentity = vi.mocked(resolveSeoIdentity);
const mockShapeResponse = vi.mocked(shapeResponse);
const mockShapeErrorResponse = vi.mocked(shapeErrorResponse);
const mockInitFeature = vi.mocked(AutonomyRepo.initializeFeature);

function makeRunResult(overrides: Partial<RunResult> = {}): RunResult {
  return {
    text: 'Audit complete.',
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

describe('runSeo handler', () => {
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
      response: 'Audit complete.',
      suggestions: ['Find similar posts'],
      conversationId: 'conv-1',
      correlationId: 'corr-1',
    });

    mockShapeErrorResponse.mockReturnValue({
      ok: false,
      response: "I'm having a brief issue with the SEO assistant.",
      suggestions: ['Try again'],
      conversationId: '',
      correlationId: '',
    });
  });

  it('calls ensureFeatureInitialized before run', async () => {
    await runSeo({ userText: 'audit post 1', adminId: 7 });
    expect(mockInitFeature).toHaveBeenCalledWith('seo');
  });

  it('passes featureKey seo to runner', async () => {
    await runSeo({ userText: 'audit post 1', adminId: 7 });
    expect(mockRunnerRun).toHaveBeenCalledWith(
      expect.objectContaining({ featureKey: 'seo' }),
    );
  });

  it('forwards adminId to runner.run', async () => {
    await runSeo({ userText: 'audit post 1', adminId: 7, conversationId: 'conv-existing' });

    expect(mockRunnerRun).toHaveBeenCalledWith(
      expect.objectContaining({
        adminId: 7,
        conversationId: 'conv-existing',
        identityId: 'id-1',
      }),
    );
  });

  it('returns shaped response', async () => {
    const result = await runSeo({ userText: 'audit post 1', adminId: 7 });
    expect(result.ok).toBe(true);
    expect(result.response).toBe('Audit complete.');
    expect(result.suggestions).toEqual(['Find similar posts']);
  });

  it('returns error response on runner failure', async () => {
    mockRunnerRun.mockRejectedValue(new Error('LLM exploded'));
    const result = await runSeo({ userText: 'audit post 1', adminId: 7 });
    expect(result.ok).toBe(false);
    expect(mockShapeErrorResponse).toHaveBeenCalled();
  });

  it('handles unauthenticated caller (no adminId) without crashing', async () => {
    mockResolveIdentity.mockResolvedValue({
      identityId: 'id-guest',
      aliasValue: 'fresh-uuid',
      isAuthenticated: false,
    });

    const result = await runSeo({ userText: 'how do I use this?', adminId: null });

    expect(result.ok).toBe(true);
    expect(mockRunnerRun).toHaveBeenCalledWith(
      expect.objectContaining({ adminId: undefined }),
    );
  });
});
