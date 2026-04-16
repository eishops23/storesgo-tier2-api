// Agent Suite — Tool adapter tests (Phase 0 Part D)

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { z } from 'zod';

// Mock executor and registry before importing
vi.mock('../../tools/executor.js', () => ({
  executeTool: vi.fn(),
}));

vi.mock('../../tools/registry.js', () => {
  const tools = new Map<string, any>();
  return {
    getDefaultRegistry: vi.fn(() => ({
      get: vi.fn((name: string) => {
        const tool = tools.get(name);
        if (!tool) throw new Error(`Tool not found: ${name}`);
        return tool;
      }),
      list: vi.fn(() => Array.from(tools.values())),
      _tools: tools,
    })),
  };
});

import { buildLLMTools, buildAllRegisteredTools } from '../tool-adapter.js';
import { executeTool } from '../../tools/executor.js';
import { getDefaultRegistry } from '../../tools/registry.js';

const mockExecuteTool = vi.mocked(executeTool);

const testTool = {
  name: 'test_tool',
  description: 'A test tool',
  argsSchema: z.object({ query: z.string() }),
  requiredAutonomy: 'L0' as const,
  reversible: true,
  tags: ['test'],
  execute: vi.fn(),
};

const ctx = {
  sessionId: 'sess-1',
  featureKey: 'cs_chat',
  conversationId: 'conv-1',
  messageId: 'msg-1',
};

beforeEach(() => {
  vi.clearAllMocks();
  const registry = getDefaultRegistry() as any;
  registry._tools.clear();
  registry._tools.set('test_tool', testTool);
});

describe('buildLLMTools', () => {
  it('converts registered tools to LLMToolDefinition format', () => {
    const tools = buildLLMTools(['test_tool'], ctx);

    expect(tools['test_tool']).toBeDefined();
    expect(tools['test_tool'].name).toBe('test_tool');
    expect(tools['test_tool'].description).toBe('A test tool');
    expect(typeof tools['test_tool'].execute).toBe('function');
  });

  it('routed execute calls through executeTool', async () => {
    mockExecuteTool.mockResolvedValue({
      status: 'executed',
      toolCallId: 'tc-1',
      toolName: 'test_tool',
      durationMs: 10,
      result: { found: true },
    });

    const tools = buildLLMTools(['test_tool'], ctx);
    const result = await tools['test_tool'].execute({ query: 'rice' });

    expect(mockExecuteTool).toHaveBeenCalledWith(
      'test_tool',
      { query: 'rice' },
      expect.objectContaining({
        sessionId: 'sess-1',
        featureKey: 'cs_chat',
        conversationId: 'conv-1',
        messageId: 'msg-1',
      }),
      expect.objectContaining({ registry: expect.anything() }),
    );
    expect(result).toEqual({ found: true });
  });

  it('returns structured proposal object when status is proposed', async () => {
    mockExecuteTool.mockResolvedValue({
      status: 'proposed',
      toolCallId: 'tc-1',
      toolName: 'test_tool',
      durationMs: 5,
      proposal: {
        description: 'A test tool',
        argsPreview: { query: 'rice' },
      },
    });

    const tools = buildLLMTools(['test_tool'], ctx);
    const result = await tools['test_tool'].execute({ query: 'rice' });

    expect(result).toEqual({
      _agentProposed: true,
      message: expect.stringContaining('proposed but not executed'),
      wouldHaveCalled: 'test_tool',
      argsPreview: { query: 'rice' },
    });
  });

  it('throws when status is error', async () => {
    mockExecuteTool.mockResolvedValue({
      status: 'error',
      toolCallId: 'tc-1',
      toolName: 'test_tool',
      durationMs: 5,
      error: { name: 'DBError', message: 'Connection lost' },
    });

    const tools = buildLLMTools(['test_tool'], ctx);

    await expect(tools['test_tool'].execute({ query: 'rice' })).rejects.toThrow('Connection lost');
  });

  it('throws ToolNotFoundError for unknown tool name', () => {
    expect(() => buildLLMTools(['unknown_tool'], ctx)).toThrow('Tool not found');
  });
});

describe('buildAllRegisteredTools', () => {
  it('returns tools for all registered tools', () => {
    const tools = buildAllRegisteredTools(ctx);
    expect(Object.keys(tools)).toContain('test_tool');
  });

  it('returns empty object when registry is empty', () => {
    const registry = getDefaultRegistry() as any;
    registry._tools.clear();
    registry.list.mockReturnValue([]);

    const tools = buildAllRegisteredTools(ctx);
    expect(Object.keys(tools)).toHaveLength(0);
  });
});
