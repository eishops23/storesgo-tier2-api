// Agent Suite — Tool executor with autonomy check, timeout, + audit logging (Phase 0 Part C, hardened Phase 0.9)

import type { ToolContext, ToolExecutionResult } from './types.js';
import { ToolRegistry, getDefaultRegistry } from './registry.js';
import { ToolArgsInvalidError, ToolTimeoutError } from './errors.js';
import { ConversationRepo, AutonomyRepo } from '../storage/index.js';
import { createChildLogger } from '../observability/index.js';
import type { AiAutonomyLevel } from '@prisma/client';

const LEVEL_ORDER: AiAutonomyLevel[] = ['L0', 'L1', 'L2', 'L3'];
const DEFAULT_TOOL_TIMEOUT_MS = 30_000;

const log = createChildLogger({ subsystem: 'tool-executor' });

function levelMeets(current: AiAutonomyLevel, required: AiAutonomyLevel): boolean {
  return LEVEL_ORDER.indexOf(current) >= LEVEL_ORDER.indexOf(required);
}

export interface ExecuteOptions {
  registry?: ToolRegistry;
}

export async function executeTool<T = unknown>(
  toolName: string,
  args: unknown,
  ctx: ToolContext,
  options: ExecuteOptions = {},
): Promise<ToolExecutionResult<T>> {
  const registry = options.registry ?? getDefaultRegistry();
  const startTime = Date.now();

  // Step 1: Look up the tool
  const tool = registry.get(toolName);

  // Step 2: Validate args with Zod
  const parseResult = tool.argsSchema.safeParse(args);
  if (!parseResult.success) {
    throw new ToolArgsInvalidError(toolName, parseResult.error.issues);
  }
  const validatedArgs = parseResult.data;

  // Step 3: Check autonomy level
  const currentLevel = await AutonomyRepo.getCurrentLevel(ctx.featureKey);
  const canExecute = levelMeets(currentLevel, tool.requiredAutonomy);

  // Step 4: Create AiToolCall audit row BEFORE execution
  const toolCall = await ConversationRepo.appendToolCall(ctx.messageId, {
    toolName: tool.name,
    argsJson: validatedArgs as object,
    autonomyLevelAtExecution: currentLevel,
  });

  log.info(
    { event: 'tool.call.start', toolName, conversationId: ctx.conversationId, toolCallId: toolCall.id },
    'Tool call started',
  );

  // Step 5: If autonomy blocks execution, return as 'proposed'
  if (!canExecute) {
    log.info(
      { event: 'tool.call.proposed', toolName, currentLevel, requiredLevel: tool.requiredAutonomy },
      'Tool call proposed (autonomy insufficient)',
    );
    return {
      status: 'proposed',
      toolCallId: toolCall.id,
      toolName: tool.name,
      durationMs: Date.now() - startTime,
      proposal: {
        description: tool.description,
        argsPreview: validatedArgs,
      },
    };
  }

  // Step 6: Execute the tool WITH TIMEOUT
  const effectiveTimeout = tool.timeoutMs ?? DEFAULT_TOOL_TIMEOUT_MS;

  try {
    const result = await Promise.race([
      tool.execute(validatedArgs, ctx),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new ToolTimeoutError(tool.name, effectiveTimeout)),
          effectiveTimeout,
        ),
      ),
    ]);

    const durationMs = Date.now() - startTime;
    await ConversationRepo.updateToolCallResult(toolCall.id, result as object, durationMs);
    await AutonomyRepo.recordExecution(ctx.featureKey, true);

    log.info(
      { event: 'tool.call.complete', toolName, toolCallId: toolCall.id, durationMs, status: 'executed' },
      'Tool call completed',
    );

    return {
      status: 'executed',
      toolCallId: toolCall.id,
      toolName: tool.name,
      durationMs,
      result: result as T,
    };
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const isTimeout = error instanceof ToolTimeoutError;
    const errMsg = error instanceof Error ? error.message : String(error);

    if (isTimeout) {
      await ConversationRepo.markToolCallTimeout(toolCall.id, durationMs);
      log.warn(
        { event: 'tool.call.timeout', toolName, toolCallId: toolCall.id, durationMs, timeoutMs: effectiveTimeout },
        'Tool call timed out',
      );
    } else {
      await ConversationRepo.markToolCallError(toolCall.id, errMsg);
      log.error(
        { event: 'tool.call.error', toolName, toolCallId: toolCall.id, durationMs, error: errMsg },
        'Tool call failed',
      );
    }
    await AutonomyRepo.recordExecution(ctx.featureKey, false);

    return {
      status: isTimeout ? 'timeout' : 'error',
      toolCallId: toolCall.id,
      toolName: tool.name,
      durationMs,
      error: {
        name: error instanceof Error ? error.name : 'UnknownError',
        message: errMsg,
      },
    };
  }
}
