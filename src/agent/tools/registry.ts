// Agent Suite — Tool registry (Phase 0 Part C)

import type { AgentTool } from './types.js';
import { ToolNotFoundError } from './errors.js';

export class ToolRegistry {
  private tools = new Map<string, AgentTool>();

  register<TArgs, TResult>(tool: AgentTool<TArgs, TResult>): void {
    if (this.tools.has(tool.name)) {
      throw new Error(`Tool already registered: ${tool.name}`);
    }
    this.tools.set(tool.name, tool as AgentTool);
  }

  unregister(name: string): void {
    this.tools.delete(name);
  }

  get(name: string): AgentTool {
    const tool = this.tools.get(name);
    if (!tool) throw new ToolNotFoundError(name);
    return tool;
  }

  has(name: string): boolean {
    return this.tools.has(name);
  }

  list(): AgentTool[] {
    return Array.from(this.tools.values());
  }

  listByTag(tag: string): AgentTool[] {
    return this.list().filter((t) => t.tags?.includes(tag) ?? false);
  }

  clear(): void {
    this.tools.clear();
  }

  get size(): number {
    return this.tools.size;
  }
}

let defaultRegistry: ToolRegistry | undefined;

export function getDefaultRegistry(): ToolRegistry {
  if (!defaultRegistry) defaultRegistry = new ToolRegistry();
  return defaultRegistry;
}

export function resetDefaultRegistry(): void {
  defaultRegistry = new ToolRegistry();
}
