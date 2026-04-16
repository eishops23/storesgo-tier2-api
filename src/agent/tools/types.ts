// Agent Suite — Tool framework type definitions (Phase 0 Part C)

import type { z } from 'zod';
import type { PrismaClient, AiAutonomyLevel } from '@prisma/client';

export interface ToolContext {
  sessionId: string;
  featureKey: string;
  conversationId: string;
  messageId: string;
  identityId?: string;
  userId?: string;
  /**
   * Optional. Set when the dispatching feature has resolved a seller
   * identity (e.g. Phase 11 Reviews Agent). Tools that need
   * seller-scoped data check this and return null when undefined,
   * matching the Phase 1 ctx.userId convention.
   */
  sellerId?: number;
  /**
   * Optional. Set when the dispatching feature has resolved an admin
   * identity (e.g. Phase 9 SEO Agent). Tools that need admin-scoped
   * data check this and return null when undefined. Also triggers
   * the synchronous admin audit log write in tool-adapter.ts.
   */
  adminId?: number;
  prisma?: PrismaClient;
}

export interface AgentTool<TArgs = unknown, TResult = unknown> {
  name: string;
  description: string;
  argsSchema: z.ZodType<TArgs>;
  returnsSchema?: z.ZodType<TResult>;
  requiredAutonomy: AiAutonomyLevel;
  reversible: boolean;
  tags?: string[];
  timeoutMs?: number;
  execute(args: TArgs, ctx: ToolContext): Promise<TResult>;
}

export type ToolExecutionStatus = 'executed' | 'proposed' | 'blocked' | 'error' | 'timeout';

export interface ToolExecutionResult<T = unknown> {
  status: ToolExecutionStatus;
  toolCallId: string;
  toolName: string;
  durationMs: number;
  result?: T;
  proposal?: {
    description: string;
    argsPreview: unknown;
  };
  error?: {
    name: string;
    message: string;
  };
}
