// Agent Suite — Tool executor tests (Phase 0 Part C)

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { z } from 'zod';
import { ToolRegistry } from '../registry.js';
import { executeTool } from '../executor.js';
import { ToolArgsInvalidError, ToolNotFoundError } from '../errors.js';
import type { AgentTool, ToolContext } from '../types.js';

// Mock the storage modules
vi.mock('../../storage/index.js', () => ({
  ConversationRepo: {
    appendToolCall: vi.fn(),
    updateToolCallResult: vi.fn(),
    markToolCallError: vi.fn(),
    markToolCallTimeout: vi.fn(),
  },
  AutonomyRepo: {
    getCurrentLevel: vi.fn(),
    recordExecution: vi.fn(),
    initializeFeature: vi.fn(),
  },
}));

vi.mock('../../storage/prisma-client.js', () => ({
  getPrisma: vi.fn(() => ({})),
}));

vi.mock('../../observability/index.js', () => ({
  createChildLogger: vi.fn(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}));

// Import after mocking
import { ConversationRepo, AutonomyRepo } from '../../storage/index.js';

const mockConvRepo = vi.mocked(ConversationRepo);
const mockAutoRepo = vi.mocked(AutonomyRepo);

function makeCtx(overrides: Partial<ToolContext> = {}): ToolContext {
  return {
    sessionId: 'sess-1',
    featureKey: 'cs_chat',
    conversationId: 'conv-1',
    messageId: 'msg-1',
    ...overrides,
  };
}

function makeTool(overrides: Partial<AgentTool<any, any>> = {}): AgentTool {
  return {
    name: 'test_tool',
    description: 'A test tool',
    argsSchema: z.object({ value: z.string() }),
    requiredAutonomy: 'L0',
    reversible: true,
    tags: ['test'],
    execute: vi.fn(async () => ({ result: 'ok' })),
    ...overrides,
  };
}

describe('executeTool', () => {
  let registry: ToolRegistry;

  beforeEach(() => {
    vi.clearAllMocks();
    registry = new ToolRegistry();

    // Default mock returns
    mockAutoRepo.getCurrentLevel.mockResolvedValue('L1');
    mockAutoRepo.recordExecution.mockResolvedValue({} as any);
    mockAutoRepo.initializeFeature.mockResolvedValue({} as any);
    mockConvRepo.appendToolCall.mockResolvedValue({ id: 'tc-1' } as any);
    mockConvRepo.updateToolCallResult.mockResolvedValue({} as any);
    mockConvRepo.markToolCallError.mockResolvedValue({} as any);
    mockConvRepo.markToolCallTimeout.mockResolvedValue({} as any);
  });

  it('executes successfully and returns result', async () => {
    const tool = makeTool();
    registry.register(tool);

    const result = await executeTool('test_tool', { value: 'hello' }, makeCtx(), { registry });

    expect(result.status).toBe('executed');
    expect(result.toolCallId).toBe('tc-1');
    expect(result.toolName).toBe('test_tool');
    expect(result.result).toEqual({ result: 'ok' });
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  it('throws ToolNotFoundError for unknown tool', async () => {
    await expect(
      executeTool('unknown', {}, makeCtx(), { registry }),
    ).rejects.toThrow(ToolNotFoundError);
  });

  it('throws ToolArgsInvalidError for bad args', async () => {
    registry.register(makeTool());

    await expect(
      executeTool('test_tool', { value: 123 }, makeCtx(), { registry }),
    ).rejects.toThrow(ToolArgsInvalidError);
  });

  it('does not create audit row when args are invalid', async () => {
    registry.register(makeTool());

    await expect(
      executeTool('test_tool', { wrong: 'field' }, makeCtx(), { registry }),
    ).rejects.toThrow(ToolArgsInvalidError);

    expect(mockConvRepo.appendToolCall).not.toHaveBeenCalled();
  });

  it('creates audit row BEFORE execution', async () => {
    const executionOrder: string[] = [];

    mockConvRepo.appendToolCall.mockImplementation(async () => {
      executionOrder.push('audit_create');
      return { id: 'tc-1' } as any;
    });

    const tool = makeTool({
      execute: vi.fn(async () => {
        executionOrder.push('tool_execute');
        return { ok: true };
      }),
    });
    registry.register(tool);

    await executeTool('test_tool', { value: 'test' }, makeCtx(), { registry });

    expect(executionOrder).toEqual(['audit_create', 'tool_execute']);
  });

  it('updates audit row on success', async () => {
    registry.register(makeTool());

    await executeTool('test_tool', { value: 'test' }, makeCtx(), { registry });

    expect(mockConvRepo.updateToolCallResult).toHaveBeenCalledWith(
      'tc-1',
      { result: 'ok' },
      expect.any(Number),
    );
  });

  it('updates audit row on error', async () => {
    const tool = makeTool({
      execute: vi.fn(async () => { throw new Error('boom'); }),
    });
    registry.register(tool);

    const result = await executeTool('test_tool', { value: 'test' }, makeCtx(), { registry });

    expect(result.status).toBe('error');
    expect(result.error?.message).toBe('boom');
    expect(mockConvRepo.markToolCallError).toHaveBeenCalledWith('tc-1', 'boom');
  });

  it('records successful execution in autonomy', async () => {
    registry.register(makeTool());

    await executeTool('test_tool', { value: 'test' }, makeCtx(), { registry });

    expect(mockAutoRepo.recordExecution).toHaveBeenCalledWith('cs_chat', true);
  });

  it('records failed execution in autonomy', async () => {
    const tool = makeTool({
      execute: vi.fn(async () => { throw new Error('fail'); }),
    });
    registry.register(tool);

    await executeTool('test_tool', { value: 'test' }, makeCtx(), { registry });

    expect(mockAutoRepo.recordExecution).toHaveBeenCalledWith('cs_chat', false);
  });

  it('returns proposed when autonomy level is insufficient', async () => {
    mockAutoRepo.getCurrentLevel.mockResolvedValue('L0');

    const tool = makeTool({ requiredAutonomy: 'L1' });
    registry.register(tool);

    const result = await executeTool('test_tool', { value: 'test' }, makeCtx(), { registry });

    expect(result.status).toBe('proposed');
    expect(result.proposal).toBeDefined();
    expect(result.proposal?.description).toBe('A test tool');
    expect(result.proposal?.argsPreview).toEqual({ value: 'test' });
    // Execution function was NOT called
    expect(tool.execute).not.toHaveBeenCalled();
  });

  it('creates audit row even when proposed (not executed)', async () => {
    mockAutoRepo.getCurrentLevel.mockResolvedValue('L0');

    const tool = makeTool({ requiredAutonomy: 'L1' });
    registry.register(tool);

    await executeTool('test_tool', { value: 'test' }, makeCtx(), { registry });

    expect(mockConvRepo.appendToolCall).toHaveBeenCalledWith('msg-1', {
      toolName: 'test_tool',
      argsJson: { value: 'test' },
      autonomyLevelAtExecution: 'L0',
    });
  });

  it('does not record autonomy execution when proposed', async () => {
    mockAutoRepo.getCurrentLevel.mockResolvedValue('L0');

    const tool = makeTool({ requiredAutonomy: 'L1' });
    registry.register(tool);

    await executeTool('test_tool', { value: 'test' }, makeCtx(), { registry });

    expect(mockAutoRepo.recordExecution).not.toHaveBeenCalled();
  });

  it('allows execution at exact required level', async () => {
    mockAutoRepo.getCurrentLevel.mockResolvedValue('L2');

    const tool = makeTool({ requiredAutonomy: 'L2' });
    registry.register(tool);

    const result = await executeTool('test_tool', { value: 'test' }, makeCtx(), { registry });

    expect(result.status).toBe('executed');
  });

  it('allows execution above required level', async () => {
    mockAutoRepo.getCurrentLevel.mockResolvedValue('L3');

    const tool = makeTool({ requiredAutonomy: 'L1' });
    registry.register(tool);

    const result = await executeTool('test_tool', { value: 'test' }, makeCtx(), { registry });

    expect(result.status).toBe('executed');
  });

  it('tracks duration across execution', async () => {
    const tool = makeTool({
      execute: vi.fn(async () => {
        // Simulate some work
        await new Promise((r) => setTimeout(r, 10));
        return { ok: true };
      }),
    });
    registry.register(tool);

    const result = await executeTool('test_tool', { value: 'test' }, makeCtx(), { registry });

    expect(result.durationMs).toBeGreaterThanOrEqual(5);
  });

  // --- Phase 0.9 timeout tests ---

  it('returns timeout status when tool exceeds its timeoutMs', async () => {
    const tool = makeTool({
      timeoutMs: 50, // 50ms timeout
      execute: vi.fn(async () => {
        await new Promise((r) => setTimeout(r, 200)); // takes 200ms
        return { ok: true };
      }),
    });
    registry.register(tool);

    const result = await executeTool('test_tool', { value: 'test' }, makeCtx(), { registry });

    expect(result.status).toBe('timeout');
    expect(result.error?.name).toBe('ToolTimeoutError');
    expect(result.error?.message).toContain('Timed out');
  });

  it('marks tool call as timeout in audit on timeout', async () => {
    const tool = makeTool({
      timeoutMs: 50,
      execute: vi.fn(async () => {
        await new Promise((r) => setTimeout(r, 200));
        return { ok: true };
      }),
    });
    registry.register(tool);

    await executeTool('test_tool', { value: 'test' }, makeCtx(), { registry });

    expect(mockConvRepo.markToolCallTimeout).toHaveBeenCalledWith('tc-1', expect.any(Number));
    expect(mockConvRepo.markToolCallError).not.toHaveBeenCalled();
  });

  it('records failed execution in autonomy on timeout', async () => {
    const tool = makeTool({
      timeoutMs: 50,
      execute: vi.fn(async () => {
        await new Promise((r) => setTimeout(r, 200));
        return { ok: true };
      }),
    });
    registry.register(tool);

    await executeTool('test_tool', { value: 'test' }, makeCtx(), { registry });

    expect(mockAutoRepo.recordExecution).toHaveBeenCalledWith('cs_chat', false);
  });

  it('succeeds when tool completes within timeoutMs', async () => {
    const tool = makeTool({
      timeoutMs: 500,
      execute: vi.fn(async () => {
        await new Promise((r) => setTimeout(r, 10));
        return { result: 'fast' };
      }),
    });
    registry.register(tool);

    const result = await executeTool('test_tool', { value: 'test' }, makeCtx(), { registry });

    expect(result.status).toBe('executed');
    expect(result.result).toEqual({ result: 'fast' });
  });
});
