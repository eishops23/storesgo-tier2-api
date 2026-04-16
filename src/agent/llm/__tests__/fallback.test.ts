// Agent Suite — LLM fallback chain tests (Phase 0.9)

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the AI SDK generateText
vi.mock('ai', () => ({
  generateText: vi.fn(),
  stepCountIs: vi.fn(() => () => false),
}));

// Mock provider factories
vi.mock('@ai-sdk/anthropic', () => ({
  createAnthropic: vi.fn(() => vi.fn(() => 'anthropic-model')),
}));
vi.mock('@ai-sdk/openai', () => ({
  createOpenAI: vi.fn(() => vi.fn(() => 'openai-model')),
}));
vi.mock('@ai-sdk/google', () => ({
  createGoogleGenerativeAI: vi.fn(() => vi.fn(() => 'google-model')),
}));

// Mock observability
vi.mock('../observability.js', () => ({
  getObserver: vi.fn(() => ({
    onCallStart: vi.fn(),
    onCallEnd: vi.fn(),
    onCallError: vi.fn(),
    onCallFailover: vi.fn(),
  })),
}));

// Mock budget
vi.mock('../budget.js', () => ({
  checkBudget: vi.fn(),
  recordUsage: vi.fn(),
}));

// Mock observability logger
vi.mock('../../observability/index.js', () => ({
  createChildLogger: vi.fn(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}));

import { generateText } from 'ai';
import { llmCall, FALLBACK_CHAINS } from '../client.js';
import { getObserver } from '../observability.js';
import { LLMProviderError } from '../../types/llm.types.js';

const mockGenerateText = vi.mocked(generateText);
const mockGetObserver = vi.mocked(getObserver);

function makeGenerateTextResult(overrides: any = {}) {
  return {
    text: 'response text',
    usage: { inputTokens: 100, outputTokens: 50 },
    finishReason: 'stop',
    steps: [],
    ...overrides,
  };
}

describe('llmCall fallback chain', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Set all API keys so all providers are available
    process.env['ANTHROPIC_API_KEY'] = 'test-key';
    process.env['OPENAI_API_KEY'] = 'test-key';
    process.env['GOOGLE_AI_API_KEY'] = 'test-key';

    mockGetObserver.mockReturnValue({
      onCallStart: vi.fn(),
      onCallEnd: vi.fn(),
      onCallError: vi.fn(),
      onCallFailover: vi.fn(),
    });
  });

  it('succeeds on primary provider', async () => {
    mockGenerateText.mockResolvedValue(makeGenerateTextResult());

    const response = await llmCall(
      [{ role: 'user', content: 'Hi' }],
      { taskType: 'reasoning' },
    );

    expect(response.text).toBe('response text');
    expect(response.fallbackHops).toBe(0);
    expect(mockGenerateText).toHaveBeenCalledTimes(1);
  });

  it('has correct fallback chain for reasoning tasks', () => {
    expect(FALLBACK_CHAINS['reasoning']).toEqual([
      'claude-sonnet-4-6',
      'claude-haiku-4-5',
      'gpt-4o-mini',
      'gemini-2-0-flash',
    ]);
  });

  it('falls back to next provider on retryable error', async () => {
    mockGenerateText
      .mockRejectedValueOnce(new Error('503 Service Unavailable'))  // primary fails
      .mockRejectedValueOnce(new Error('503 Service Unavailable'))  // primary retry fails
      .mockResolvedValueOnce(makeGenerateTextResult({ text: 'fallback response' })); // second provider succeeds

    const response = await llmCall(
      [{ role: 'user', content: 'Hi' }],
      { taskType: 'reasoning' },
    );

    expect(response.text).toBe('fallback response');
    expect(response.fallbackHops).toBe(1);
  });

  it('fires onCallFailover when falling back', async () => {
    const mockObserver = {
      onCallStart: vi.fn(),
      onCallEnd: vi.fn(),
      onCallError: vi.fn(),
      onCallFailover: vi.fn(),
    };
    mockGetObserver.mockReturnValue(mockObserver);

    mockGenerateText
      .mockRejectedValueOnce(new Error('503 error'))
      .mockRejectedValueOnce(new Error('503 error'))
      .mockResolvedValueOnce(makeGenerateTextResult());

    await llmCall(
      [{ role: 'user', content: 'Hi' }],
      { taskType: 'reasoning' },
    );

    expect(mockObserver.onCallFailover).toHaveBeenCalled();
  });

  it('throws LLMProviderError when all providers fail', async () => {
    mockGenerateText.mockRejectedValue(new Error('503 error'));

    await expect(
      llmCall(
        [{ role: 'user', content: 'Hi' }],
        { taskType: 'reasoning' },
      ),
    ).rejects.toThrow(LLMProviderError);
  });

  it('does not fall back on non-retryable errors', async () => {
    mockGenerateText.mockRejectedValue(new Error('Invalid API key'));

    await expect(
      llmCall(
        [{ role: 'user', content: 'Hi' }],
        { taskType: 'reasoning' },
      ),
    ).rejects.toThrow(LLMProviderError);

    // Should only try primary (with retry) not fallback providers
    // Primary gets 1 initial + 1 retry = 2 calls max
    expect(mockGenerateText).toHaveBeenCalledTimes(2);
  });

  it('skips providers without API keys', async () => {
    delete process.env['OPENAI_API_KEY'];
    delete process.env['GOOGLE_AI_API_KEY'];

    mockGenerateText.mockRejectedValue(new Error('503 error'));

    // Only anthropic providers available (sonnet + haiku)
    await expect(
      llmCall(
        [{ role: 'user', content: 'Hi' }],
        { taskType: 'reasoning' },
      ),
    ).rejects.toThrow(LLMProviderError);
  });

  it('includes attemptedProviders in response', async () => {
    mockGenerateText.mockResolvedValue(makeGenerateTextResult());

    const response = await llmCall(
      [{ role: 'user', content: 'Hi' }],
      { taskType: 'reasoning' },
    );

    expect(response.attemptedProviders).toContain('anthropic');
  });
});
