// Agent Suite — ToolRegistry tests (Phase 0 Part C)

import { describe, it, expect, beforeEach } from 'vitest';
import { z } from 'zod';
import { ToolRegistry, getDefaultRegistry, resetDefaultRegistry } from '../registry.js';
import { ToolNotFoundError } from '../errors.js';
import type { AgentTool } from '../types.js';

function makeTool(overrides: Partial<AgentTool> = {}): AgentTool {
  return {
    name: overrides.name ?? 'test_tool',
    description: 'A test tool',
    argsSchema: z.object({}),
    requiredAutonomy: 'L0',
    reversible: true,
    tags: overrides.tags ?? ['test'],
    execute: async () => ({ ok: true }),
    ...overrides,
  };
}

describe('ToolRegistry', () => {
  let registry: ToolRegistry;

  beforeEach(() => {
    registry = new ToolRegistry();
  });

  it('registers and retrieves a tool', () => {
    const tool = makeTool();
    registry.register(tool);
    expect(registry.get('test_tool')).toBe(tool);
  });

  it('throws ToolNotFoundError for unknown tool', () => {
    expect(() => registry.get('nonexistent')).toThrow(ToolNotFoundError);
    expect(() => registry.get('nonexistent')).toThrow('Tool not found: nonexistent');
  });

  it('throws on duplicate registration', () => {
    registry.register(makeTool());
    expect(() => registry.register(makeTool())).toThrow('Tool already registered: test_tool');
  });

  it('has() returns true for registered, false for unregistered', () => {
    registry.register(makeTool());
    expect(registry.has('test_tool')).toBe(true);
    expect(registry.has('other')).toBe(false);
  });

  it('list() returns all registered tools', () => {
    registry.register(makeTool({ name: 'a' }));
    registry.register(makeTool({ name: 'b' }));
    registry.register(makeTool({ name: 'c' }));
    expect(registry.list()).toHaveLength(3);
  });

  it('listByTag() filters by tag', () => {
    registry.register(makeTool({ name: 'a', tags: ['read', 'product'] }));
    registry.register(makeTool({ name: 'b', tags: ['write', 'product'] }));
    registry.register(makeTool({ name: 'c', tags: ['read', 'order'] }));

    expect(registry.listByTag('read')).toHaveLength(2);
    expect(registry.listByTag('product')).toHaveLength(2);
    expect(registry.listByTag('write')).toHaveLength(1);
    expect(registry.listByTag('nonexistent')).toHaveLength(0);
  });

  it('unregister() removes a tool', () => {
    registry.register(makeTool());
    expect(registry.has('test_tool')).toBe(true);
    registry.unregister('test_tool');
    expect(registry.has('test_tool')).toBe(false);
  });

  it('clear() removes all tools', () => {
    registry.register(makeTool({ name: 'a' }));
    registry.register(makeTool({ name: 'b' }));
    expect(registry.size).toBe(2);
    registry.clear();
    expect(registry.size).toBe(0);
  });

  it('size returns correct count', () => {
    expect(registry.size).toBe(0);
    registry.register(makeTool({ name: 'a' }));
    expect(registry.size).toBe(1);
    registry.register(makeTool({ name: 'b' }));
    expect(registry.size).toBe(2);
  });
});

describe('default registry', () => {
  beforeEach(() => {
    resetDefaultRegistry();
  });

  it('returns a singleton instance', () => {
    const a = getDefaultRegistry();
    const b = getDefaultRegistry();
    expect(a).toBe(b);
  });

  it('resetDefaultRegistry creates a fresh instance', () => {
    const a = getDefaultRegistry();
    a.register(makeTool());
    resetDefaultRegistry();
    const b = getDefaultRegistry();
    expect(b.size).toBe(0);
    expect(a).not.toBe(b);
  });
});
