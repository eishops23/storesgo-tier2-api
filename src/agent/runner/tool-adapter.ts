// Agent Suite — Tool adapter: converts AgentTools to LLMToolDefinitions (Phase 0 Part D)

import type { LLMToolDefinition } from '../types/llm.types.js';
import { executeTool } from '../tools/executor.js';
import { ToolRegistry, getDefaultRegistry } from '../tools/registry.js';
import { writeAdminAuditLog } from '../storage/admin-audit-log.repo.js';

export interface ToolAdapterContext {
  sessionId: string;
  featureKey: string;
  conversationId: string;
  messageId: string;
  identityId?: string;
  userId?: string;
  /** Optional. Forwarded from RunInput.sellerId for seller-scoped features. */
  sellerId?: number;
  /** Optional. Forwarded from RunInput.adminId for admin-scoped features. */
  adminId?: number;
}

export function buildLLMTools(
  toolNames: string[],
  ctx: ToolAdapterContext,
  registry?: ToolRegistry,
): Record<string, LLMToolDefinition> {
  const reg = registry ?? getDefaultRegistry();
  const result: Record<string, LLMToolDefinition> = {};

  for (const toolName of toolNames) {
    const tool = reg.get(toolName);
    result[toolName] = {
      name: toolName,
      description: tool.description,
      inputSchema: tool.argsSchema,
      execute: async (args: unknown) => {
        const startTime = Date.now();
        let execResult: Awaited<ReturnType<typeof executeTool>> | undefined;
        let auditSuccess = true;
        let auditError: string | null = null;
        let auditResult: unknown = null;

        try {
          execResult = await executeTool(toolName, args, {
            sessionId: ctx.sessionId,
            featureKey: ctx.featureKey,
            conversationId: ctx.conversationId,
            messageId: ctx.messageId,
            identityId: ctx.identityId,
            userId: ctx.userId,
            sellerId: ctx.sellerId,
            adminId: ctx.adminId,
          }, { registry: reg });

          if (execResult.status === 'executed') {
            auditResult = execResult.result;
          } else if (execResult.status === 'error' || execResult.status === 'timeout') {
            auditSuccess = false;
            auditError = execResult.error?.message ?? `tool ${execResult.status}`;
          } else if (execResult.status === 'proposed') {
            auditResult = { _proposed: true, argsPreview: execResult.proposal?.argsPreview };
          }
        } catch (err) {
          auditSuccess = false;
          auditError = err instanceof Error ? err.message : String(err);
          // Re-throw after the finally — audit log is observability, not control flow.
          throw err;
        } finally {
          // Phase 9 audit log: synchronous write when adminId is present.
          // writeAdminAuditLog swallows its own errors so this finally
          // block can never break the tool execution path.
          if (ctx.adminId !== undefined) {
            await writeAdminAuditLog({
              adminId: ctx.adminId,
              featureKey: ctx.featureKey,
              conversationId: ctx.conversationId,
              toolName,
              action: toolName,
              inputSummary: args,
              resultSummary: auditResult,
              success: auditSuccess,
              errorMessage: auditError,
              durationMs: Date.now() - startTime,
            });
          }
        }

        // execResult is guaranteed to be set here — if executeTool threw,
        // the catch block re-threw and we never reach this line.
        if (!execResult) {
          throw new Error(`Tool execution returned no result for ${toolName}`);
        }

        if (execResult.status === 'proposed') {
          return {
            _agentProposed: true,
            message: `Tool '${toolName}' was proposed but not executed (autonomy level too low).`,
            wouldHaveCalled: toolName,
            argsPreview: execResult.proposal?.argsPreview,
          };
        }

        if (execResult.status === 'executed') {
          return execResult.result;
        }

        if (execResult.status === 'error' || execResult.status === 'timeout') {
          throw new Error(execResult.error?.message ?? 'Unknown tool execution error');
        }

        throw new Error(`Unexpected tool execution status: ${execResult.status}`);
      },
    };
  }

  return result;
}

export function buildAllRegisteredTools(
  ctx: ToolAdapterContext,
  registry?: ToolRegistry,
): Record<string, LLMToolDefinition> {
  const reg = registry ?? getDefaultRegistry();
  const toolNames = reg.list().map((t) => t.name);
  return buildLLMTools(toolNames, ctx, reg);
}
