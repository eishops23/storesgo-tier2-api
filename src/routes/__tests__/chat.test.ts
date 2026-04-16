// Phase 1 Prompt 4 — Chat route integration tests

import { describe, it, expect, vi, beforeEach } from 'vitest';
import Fastify from 'fastify';

vi.mock('../../agent/features/cs-chat/index.js', () => ({
  runCsChat: vi.fn(),
}));

vi.mock('../../services/aiChat.service.js', () => ({
  processChat: vi.fn(),
  ChatMessage: {},
  searchProducts: vi.fn(),
  getStoreStats: vi.fn(),
}));

vi.mock('../../agent/flags/index.js', () => ({
  isFeatureAllowed: vi.fn(),
}));

vi.mock('jsonwebtoken', () => ({
  default: { verify: vi.fn() },
}));

import chatRoutes from '../chat.js';
import { runCsChat } from '../../agent/features/cs-chat/index.js';
import { processChat } from '../../services/aiChat.service.js';
import { isFeatureAllowed } from '../../agent/flags/index.js';

const mockRunCsChat = vi.mocked(runCsChat);
const mockProcessChat = vi.mocked(processChat);
const mockFlag = vi.mocked(isFeatureAllowed);

async function buildApp() {
  const app = Fastify();
  await app.register(chatRoutes, { prefix: '/chat' });
  return app;
}

describe('POST /chat — route integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls processChat when feature flag is off', async () => {
    mockFlag.mockReturnValue(false);
    mockProcessChat.mockResolvedValue({ response: 'gemini answer', suggestions: ['a'] } as any);

    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/chat',
      payload: { messages: [{ role: 'user', content: 'hi' }] },
    });

    expect(res.statusCode).toBe(200);
    expect(mockProcessChat).toHaveBeenCalledOnce();
    expect(mockRunCsChat).not.toHaveBeenCalled();
    expect(res.json().ok).toBe(true);
  });

  it('calls runCsChat when feature flag is on', async () => {
    mockFlag.mockReturnValue(true);
    mockRunCsChat.mockResolvedValue({
      ok: true,
      response: 'claude answer',
      data: null,
      suggestions: ['a', 'b'],
      conversationId: 'conv-1',
      correlationId: 'corr-1',
    });

    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/chat',
      payload: { messages: [{ role: 'user', content: 'hi' }] },
    });

    expect(res.statusCode).toBe(200);
    expect(mockRunCsChat).toHaveBeenCalledOnce();
    expect(mockProcessChat).not.toHaveBeenCalled();

    const body = res.json();
    expect(body.ok).toBe(true);
    expect(body.response).toBe('claude answer');
    expect(body.conversationId).toBe('conv-1');
  });

  it('falls through to processChat when runCsChat throws', async () => {
    mockFlag.mockReturnValue(true);
    mockRunCsChat.mockRejectedValue(new Error('LLM provider down'));
    mockProcessChat.mockResolvedValue({ response: 'gemini fallback' } as any);

    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/chat',
      payload: { messages: [{ role: 'user', content: 'hi' }] },
    });

    expect(res.statusCode).toBe(200);
    expect(mockRunCsChat).toHaveBeenCalledOnce();
    expect(mockProcessChat).toHaveBeenCalledOnce();
  });

  it('sets X-Guest-Session-Id header when fresh guest session minted', async () => {
    mockFlag.mockReturnValue(true);
    mockRunCsChat.mockResolvedValue({
      ok: true,
      response: 'hi guest',
      data: null,
      suggestions: [],
      conversationId: 'conv-2',
      correlationId: 'corr-2',
      guestSessionId: 'new-guest-uuid',
    });

    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/chat',
      payload: { messages: [{ role: 'user', content: 'hi' }] },
    });

    expect(res.headers['x-guest-session-id']).toBe('new-guest-uuid');
  });

  it('does not set X-Guest-Session-Id when no guestSessionId returned', async () => {
    mockFlag.mockReturnValue(true);
    mockRunCsChat.mockResolvedValue({
      ok: true,
      response: 'welcome back',
      data: null,
      suggestions: [],
      conversationId: 'conv-3',
      correlationId: 'corr-3',
    });

    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/chat',
      payload: { messages: [{ role: 'user', content: 'hi' }] },
    });

    expect(res.headers['x-guest-session-id']).toBeUndefined();
  });

  it('returns 400 on missing messages', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/chat',
      payload: {},
    });

    expect(res.statusCode).toBe(400);
  });

  it('returns 400 on empty messages array', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/chat',
      payload: { messages: [] },
    });

    expect(res.statusCode).toBe(400);
  });
});
