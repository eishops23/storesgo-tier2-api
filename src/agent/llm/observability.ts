// Agent Suite — LLM observability hooks (Phase 0 Part A, updated Phase 0.9)

import type { LLMCallOptions, LLMResponse, LLMMessage } from '../types/llm.types.js';
import { createChildLogger } from '../observability/index.js';

export interface LLMObserver {
  onCallStart(messages: LLMMessage[], options: LLMCallOptions): void;
  onCallEnd(response: LLMResponse, durationMs: number): void;
  onCallError(error: unknown, durationMs: number): void;
  onCallFailover?(fromProvider: string, toProvider: string, reason: string): void;
}

const log = createChildLogger({ subsystem: 'llm' });

export class PinoObserver implements LLMObserver {
  onCallStart(messages: LLMMessage[], options: LLMCallOptions): void {
    log.info(
      {
        event: 'llm.call.start',
        provider: options.config?.provider ?? 'default',
        model: options.config?.model ?? 'default',
        taskType: options.taskType ?? 'unspecified',
        messageCount: messages.length,
      },
      'LLM call started',
    );
  }

  onCallEnd(response: LLMResponse, durationMs: number): void {
    log.info(
      {
        event: 'llm.call.complete',
        provider: response.provider,
        model: response.model,
        tokens: response.usage.totalTokens,
        costUsd: response.usage.estimatedCostUsd,
        durationMs,
        finishReason: response.finishReason,
        toolCallsExecuted: response.toolCallsExecuted ?? 0,
      },
      'LLM call completed',
    );
  }

  onCallError(error: unknown, durationMs: number): void {
    const message = error instanceof Error ? error.message : String(error);
    log.error(
      {
        event: 'llm.call.error',
        error: message,
        durationMs,
      },
      'LLM call failed',
    );
  }

  onCallFailover(fromProvider: string, toProvider: string, reason: string): void {
    log.warn(
      {
        event: 'llm.call.failover',
        fromProvider,
        toProvider,
        reason,
      },
      'LLM provider failover',
    );
  }
}

let activeObserver: LLMObserver = new PinoObserver();

export function setObserver(observer: LLMObserver): void {
  activeObserver = observer;
}

export function getObserver(): LLMObserver {
  return activeObserver;
}
