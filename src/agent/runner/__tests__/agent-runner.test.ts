// Agent Suite — AgentRunner tests (Phase 0 Part D, updated Phase 0.9)

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock all dependencies
vi.mock('../../llm/client.js', () => ({
  llmCall: vi.fn(),
}));

vi.mock('../../storage/index.js', () => ({
  ConversationRepo: {
    createConversation: vi.fn(),
    getConversationById: vi.fn(),
    appendMessage: vi.fn(),
  },
}));

vi.mock('../../storage/prisma-client.js', () => ({
  getPrisma: vi.fn(() => mockPrisma),
}));

vi.mock('../tool-adapter.js', () => ({
  buildAllRegisteredTools: vi.fn(() => ({})),
}));

vi.mock('../message-history.js', () => ({
  loadConversationHistory: vi.fn(() => []),
}));

vi.mock('../../flags/index.js', () => ({
  isFeatureAllowed: vi.fn(() => true),
  getEffectiveLevel: vi.fn(async () => 'L1'),
}));

vi.mock('../../llm/budget.js', () => ({
  initSession: vi.fn(),
  recordUsage: vi.fn(),
}));

vi.mock('../shutdown.js', () => ({
  isShuttingDown: vi.fn(() => false),
}));

vi.mock('../../observability/index.js', () => ({
  createChildLogger: vi.fn(() => ({
    child: vi.fn(() => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    })),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
  createCorrelationId: vi.fn(() => 'test-corr-id'),
}));

import { AgentRunner } from '../agent-runner.js';
import { llmCall } from '../../llm/client.js';
import { ConversationRepo } from '../../storage/index.js';
import { buildAllRegisteredTools } from '../tool-adapter.js';
import { loadConversationHistory } from '../message-history.js';
import { isFeatureAllowed, getEffectiveLevel } from '../../flags/index.js';
import { initSession } from '../../llm/budget.js';
import { isShuttingDown } from '../shutdown.js';

const mockLlmCall = vi.mocked(llmCall);
const mockConvRepo = vi.mocked(ConversationRepo);
const mockBuildTools = vi.mocked(buildAllRegisteredTools);
const mockLoadHistory = vi.mocked(loadConversationHistory);
const mockIsFeatureAllowed = vi.mocked(isFeatureAllowed);
const mockGetEffectiveLevel = vi.mocked(getEffectiveLevel);
const mockInitSession = vi.mocked(initSession);
const mockIsShuttingDown = vi.mocked(isShuttingDown);

const mockPrisma = {
  aiMessage: { update: vi.fn() },
  aiConversation: { update: vi.fn(), aggregate: vi.fn() },
  aiAutonomyState: { findUnique: vi.fn() },
} as any;

function makeLlmResponse(overrides: any = {}) {
  return {
    text: 'Hello! How can I help you today?',
    usage: {
      promptTokens: 100,
      completionTokens: 50,
      totalTokens: 150,
      estimatedCostUsd: 0.001,
    },
    provider: 'anthropic',
    model: 'claude-sonnet-4-6',
    finishReason: 'stop',
    steps: [],
    toolCallsExecuted: 0,
    ...overrides,
  };
}

function setupDefaultMocks() {
  mockConvRepo.createConversation.mockResolvedValue({ id: 'conv-new', totalCostUsd: 0 } as any);
  mockConvRepo.getConversationById.mockResolvedValue({ id: 'conv-existing', totalCostUsd: 0 } as any);

  let msgCount = 0;
  mockConvRepo.appendMessage.mockImplementation(async () => {
    msgCount++;
    return { id: `msg-${msgCount}` } as any;
  });

  mockIsFeatureAllowed.mockReturnValue(true);
  mockGetEffectiveLevel.mockResolvedValue('L1');
  mockLlmCall.mockResolvedValue(makeLlmResponse());
  mockBuildTools.mockReturnValue({});
  mockLoadHistory.mockResolvedValue([]);
  mockPrisma.aiMessage.update.mockResolvedValue({});
  mockPrisma.aiConversation.update.mockResolvedValue({});
  mockPrisma.aiAutonomyState.findUnique.mockResolvedValue({ costBudgetCents: 50000 });
  mockPrisma.aiConversation.aggregate.mockResolvedValue({ _sum: { totalCostUsd: 0 } });
  mockIsShuttingDown.mockReturnValue(false);
}

describe('AgentRunner', () => {
  let runner: AgentRunner;

  beforeEach(() => {
    vi.clearAllMocks();
    runner = new AgentRunner();
    setupDefaultMocks();
  });

  it('creates a new conversation when conversationId not provided', async () => {
    const result = await runner.run({
      userText: 'Hi there',
      featureKey: 'cs_chat',
    });

    expect(mockConvRepo.createConversation).toHaveBeenCalledWith(
      expect.objectContaining({
        channel: 'chat',
        featureKey: 'cs_chat',
      }),
    );
    expect(result.conversationId).toBe('conv-new');
  });

  it('resumes an existing conversation when conversationId provided', async () => {
    const result = await runner.run({
      userText: 'Follow up question',
      featureKey: 'cs_chat',
      conversationId: 'conv-existing',
    });

    expect(mockConvRepo.getConversationById).toHaveBeenCalledWith('conv-existing');
    expect(mockConvRepo.createConversation).not.toHaveBeenCalled();
    expect(result.conversationId).toBe('conv-existing');
  });

  it('throws when resuming a nonexistent conversation', async () => {
    mockConvRepo.getConversationById.mockResolvedValue(null);

    await expect(
      runner.run({
        userText: 'Hello',
        featureKey: 'cs_chat',
        conversationId: 'nonexistent',
      }),
    ).rejects.toThrow('Conversation not found: nonexistent');
  });

  it('appends user message before calling LLM', async () => {
    const callOrder: string[] = [];

    mockConvRepo.appendMessage.mockImplementation(async (_convId, input) => {
      callOrder.push(`append_${(input as any).role}`);
      return { id: `msg-${callOrder.length}` } as any;
    });
    mockLlmCall.mockImplementation(async () => {
      callOrder.push('llm_call');
      return makeLlmResponse();
    });

    await runner.run({ userText: 'Hi', featureKey: 'cs_chat' });

    expect(callOrder[0]).toBe('append_user');
    expect(callOrder[1]).toBe('append_assistant');
    expect(callOrder[2]).toBe('llm_call');
  });

  it('creates placeholder assistant message BEFORE calling LLM', async () => {
    const callOrder: string[] = [];

    mockConvRepo.appendMessage.mockImplementation(async (_convId, input) => {
      callOrder.push(`append_${(input as any).role}`);
      return { id: `msg-${callOrder.length}` } as any;
    });
    mockLlmCall.mockImplementation(async () => {
      callOrder.push('llm_call');
      return makeLlmResponse();
    });

    await runner.run({ userText: 'Hi', featureKey: 'cs_chat' });

    const assistantIdx = callOrder.indexOf('append_assistant');
    const llmIdx = callOrder.indexOf('llm_call');
    expect(assistantIdx).toBeLessThan(llmIdx);
  });

  it('passes tools to llmCall', async () => {
    const fakeTools = { search: { name: 'search' } } as any;
    mockBuildTools.mockReturnValue(fakeTools);

    await runner.run({ userText: 'Find me rice', featureKey: 'cs_chat' });

    expect(mockLlmCall).toHaveBeenCalledWith(
      expect.any(Array),
      expect.objectContaining({ tools: fakeTools }),
    );
  });

  it('updates placeholder with final text after LLM returns', async () => {
    mockLlmCall.mockResolvedValue(makeLlmResponse({ text: 'Here are some products.' }));

    await runner.run({ userText: 'Show me sauces', featureKey: 'cs_chat' });

    expect(mockPrisma.aiMessage.update).toHaveBeenCalledWith({
      where: { id: expect.any(String) },
      data: expect.objectContaining({
        content: 'Here are some products.',
        provider: 'anthropic',
        model: 'claude-sonnet-4-6',
      }),
    });
  });

  it('increments conversation totals', async () => {
    await runner.run({ userText: 'Hi', featureKey: 'cs_chat' });

    expect(mockPrisma.aiConversation.update).toHaveBeenCalledWith({
      where: { id: expect.any(String) },
      data: expect.objectContaining({
        totalTokensUsed: { increment: 150 },
        totalCostUsd: { increment: 0.001 },
      }),
    });
  });

  it('returns RunResult with all expected fields populated', async () => {
    const result = await runner.run({ userText: 'Hi', featureKey: 'cs_chat' });

    expect(result.text).toBe('Hello! How can I help you today?');
    expect(result.conversationId).toBeDefined();
    expect(result.userMessageId).toBeDefined();
    expect(result.assistantMessageId).toBeDefined();
    expect(result.toolCallsExecuted).toBe(0);
    expect(result.toolCallIds).toEqual([]);
    expect(result.autonomyLevel).toBe('L1');
    expect(result.promptTokens).toBe(100);
    expect(result.completionTokens).toBe(50);
    expect(result.totalTokens).toBe(150);
    expect(result.costUsd).toBe(0.001);
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
    expect(result.finishReason).toBe('stop');
    expect(result.correlationId).toBe('test-corr-id');
  });

  it('uses default system prompt when none provided', async () => {
    await runner.run({ userText: 'Hi', featureKey: 'cs_chat' });

    expect(mockLlmCall).toHaveBeenCalledWith(
      expect.any(Array),
      expect.objectContaining({
        systemPrompt: expect.stringContaining('StoresGo'),
      }),
    );
  });

  it('uses custom system prompt when provided', async () => {
    await runner.run({
      userText: 'Hi',
      featureKey: 'cs_chat',
      systemPrompt: 'You are a pirate.',
    });

    expect(mockLlmCall).toHaveBeenCalledWith(
      expect.any(Array),
      expect.objectContaining({ systemPrompt: 'You are a pirate.' }),
    );
  });

  it('collects tool call IDs from response steps', async () => {
    mockLlmCall.mockResolvedValue(makeLlmResponse({
      steps: [
        {
          text: '',
          toolCalls: [
            { toolName: 'search', args: {}, toolCallId: 'tc-abc' },
            { toolName: 'stats', args: {}, toolCallId: 'tc-def' },
          ],
          toolResults: [],
          finishReason: 'tool-calls',
        },
        {
          text: 'Found results',
          toolCalls: [],
          toolResults: [],
          finishReason: 'stop',
        },
      ],
      toolCallsExecuted: 2,
    }));

    const result = await runner.run({ userText: 'Search rice', featureKey: 'cs_chat' });

    expect(result.toolCallIds).toEqual(['tc-abc', 'tc-def']);
    expect(result.toolCallsExecuted).toBe(2);
  });

  it('uses custom maxSteps from input', async () => {
    await runner.run({
      userText: 'Hi',
      featureKey: 'cs_chat',
      maxSteps: 10,
    });

    expect(mockLlmCall).toHaveBeenCalledWith(
      expect.any(Array),
      expect.objectContaining({ maxSteps: 10 }),
    );
  });

  it('uses config defaultMaxSteps when input does not specify', async () => {
    const customRunner = new AgentRunner({ defaultMaxSteps: 3 });

    await customRunner.run({ userText: 'Hi', featureKey: 'cs_chat' });

    expect(mockLlmCall).toHaveBeenCalledWith(
      expect.any(Array),
      expect.objectContaining({ maxSteps: 3 }),
    );
  });

  // --- Phase 0.9 hardening tests ---

  it('returns shutdown response when server is shutting down', async () => {
    mockIsShuttingDown.mockReturnValue(true);

    const result = await runner.run({ userText: 'Hi', featureKey: 'cs_chat' });

    expect(result.finishReason).toBe('shutdown');
    expect(result.text).toContain('restarting');
    expect(mockLlmCall).not.toHaveBeenCalled();
  });

  it('returns budget_exceeded when conversation cost already at limit', async () => {
    mockConvRepo.createConversation.mockResolvedValue({ id: 'conv-1', totalCostUsd: 0.30 } as any);

    const result = await runner.run({ userText: 'Hi', featureKey: 'cs_chat' });

    expect(result.finishReason).toBe('budget_exceeded');
    expect(result.text).toContain('cost limit');
    expect(mockLlmCall).not.toHaveBeenCalled();
  });

  it('returns feature_budget_exceeded when feature spend is over ceiling', async () => {
    mockPrisma.aiConversation.aggregate.mockResolvedValue({ _sum: { totalCostUsd: 600 } });

    const result = await runner.run({ userText: 'Hi', featureKey: 'cs_chat' });

    expect(result.finishReason).toBe('feature_budget_exceeded');
    expect(result.text).toContain('usage limit');
    expect(mockLlmCall).not.toHaveBeenCalled();
  });

  it('seeds in-memory budget session with conversation cap', async () => {
    await runner.run({ userText: 'Hi', featureKey: 'cs_chat' });

    expect(mockInitSession).toHaveBeenCalledWith('conv-new', {
      maxCostUsdOverride: 0.25,
    });
  });

  it('seeds in-memory budget with existing cost when conversation has prior spend', async () => {
    mockConvRepo.createConversation.mockResolvedValue({ id: 'conv-1', totalCostUsd: 0.10 } as any);

    await runner.run({ userText: 'Hi', featureKey: 'cs_chat' });

    expect(mockInitSession).toHaveBeenCalledWith('conv-1', {
      existingCostUsd: 0.10,
      maxCostUsdOverride: 0.25,
    });
  });

  it('uses costBudgetOverrideCents from input', async () => {
    await runner.run({
      userText: 'Hi',
      featureKey: 'cs_chat',
      costBudgetOverrideCents: 10, // $0.10
    });

    expect(mockInitSession).toHaveBeenCalledWith('conv-new', {
      maxCostUsdOverride: 0.10,
    });
  });

  it('includes correlationId in result', async () => {
    const result = await runner.run({
      userText: 'Hi',
      featureKey: 'cs_chat',
      correlationId: 'custom-corr',
    });

    expect(result.correlationId).toBe('custom-corr');
  });
});
