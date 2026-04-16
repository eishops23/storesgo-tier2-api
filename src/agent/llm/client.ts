// Agent Suite — Multi-provider LLM client with fallback chain (Phase 0 Part A, hardened Phase 0.9)

import { generateText, stepCountIs, tool, type ModelMessage } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

import type {
  LLMConfig,
  LLMMessage,
  LLMCallOptions,
  LLMResponse,
  LLMToolDefinition,
} from '../types/llm.types.js';
import { LLMProviderError } from '../types/llm.types.js';
import { getDefaultModelForTask, getModelConfig, estimateCost, DEFAULT_MODELS, MODELS } from './models.js';
import { checkBudget, recordUsage } from './budget.js';
import { getObserver } from './observability.js';
import { withRetry } from './retry.js';
import { createChildLogger } from '../observability/index.js';

const log = createChildLogger({ subsystem: 'llm-client' });

// --- Fallback chain per task type ---

export const FALLBACK_CHAINS: Record<string, string[]> = {
  reasoning: ['claude-sonnet-4-6', 'claude-haiku-4-5', 'gpt-4o-mini', 'gemini-2-0-flash'],
  classification: ['claude-haiku-4-5', 'gpt-4o-mini', 'gemini-2-0-flash'],
  extraction: ['claude-haiku-4-5', 'gpt-4o-mini', 'gemini-2-0-flash'],
  summarization: ['claude-haiku-4-5', 'gpt-4o-mini', 'gemini-2-0-flash'],
};

// --- Default timeouts per task type ---

const DEFAULT_TIMEOUTS: Record<string, number> = {
  reasoning: 60_000,
  classification: 30_000,
  extraction: 30_000,
  summarization: 30_000,
};

// --- Lazy provider factories ---

let anthropicInstance: ReturnType<typeof createAnthropic> | null = null;
let openaiInstance: ReturnType<typeof createOpenAI> | null = null;
let googleInstance: ReturnType<typeof createGoogleGenerativeAI> | null = null;

function getAnthropicProvider() {
  if (!anthropicInstance) {
    const apiKey = process.env['ANTHROPIC_API_KEY'];
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY environment variable is not set');
    anthropicInstance = createAnthropic({ apiKey });
  }
  return anthropicInstance;
}

function getOpenAIProvider() {
  if (!openaiInstance) {
    const apiKey = process.env['OPENAI_API_KEY'];
    if (!apiKey) throw new Error('OPENAI_API_KEY environment variable is not set');
    openaiInstance = createOpenAI({ apiKey });
  }
  return openaiInstance;
}

function getGoogleProvider() {
  if (!googleInstance) {
    const apiKey = process.env['GOOGLE_AI_API_KEY'];
    if (!apiKey) throw new Error('GOOGLE_AI_API_KEY environment variable is not set');
    googleInstance = createGoogleGenerativeAI({ apiKey });
  }
  return googleInstance;
}

function resolveModel(config: LLMConfig) {
  const modelEntry = getModelConfig(config.model);
  switch (config.provider) {
    case 'anthropic':
      return getAnthropicProvider()(modelEntry.modelId);
    case 'openai':
      return getOpenAIProvider()(modelEntry.modelId);
    case 'google':
      return getGoogleProvider()(modelEntry.modelId);
    default:
      throw new Error(`Unsupported provider: ${config.provider as string}`);
  }
}

function isProviderAvailable(provider: string): boolean {
  switch (provider) {
    case 'anthropic':
      return !!process.env['ANTHROPIC_API_KEY'];
    case 'openai':
      return !!process.env['OPENAI_API_KEY'];
    case 'google':
      return !!process.env['GOOGLE_AI_API_KEY'];
    default:
      return false;
  }
}

function isRetryableError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  // 5xx, rate limits, network errors
  return (
    msg.includes('500') ||
    msg.includes('502') ||
    msg.includes('503') ||
    msg.includes('529') ||
    msg.includes('rate') ||
    msg.includes('timeout') ||
    msg.includes('econnrefused') ||
    msg.includes('econnreset') ||
    msg.includes('fetch failed')
  );
}

function toModelMessages(messages: LLMMessage[]): ModelMessage[] {
  return messages.map((msg): ModelMessage => {
    if (msg.role === 'tool') {
      return {
        role: 'tool',
        content: [
          {
            type: 'tool-result' as const,
            toolCallId: msg.toolCallId ?? 'unknown',
            toolName: msg.name ?? 'unknown',
            output: { type: 'text' as const, value: msg.content },
          },
        ],
      };
    }
    return { role: msg.role, content: msg.content } as ModelMessage;
  });
}

function convertToSDKTools(tools: Record<string, LLMToolDefinition> | undefined) {
  if (!tools) return undefined;
  const result: Record<string, any> = {};
  for (const [name, def] of Object.entries(tools)) {
    result[name] = tool({
      description: def.description,
      inputSchema: def.inputSchema,
      execute: def.execute,
    });
  }
  return result;
}

async function callProvider(
  modelKey: string,
  messages: LLMMessage[],
  options: LLMCallOptions,
): Promise<LLMResponse> {
  const modelEntry = getModelConfig(modelKey);
  const config: LLMConfig = {
    provider: modelEntry.provider,
    model: modelKey,
    temperature: options.config?.temperature ?? 0.7,
    maxTokens: options.config?.maxTokens ?? 4096,
    topP: options.config?.topP,
  };

  const modelMessages = toModelMessages(messages);
  const model = resolveModel(config);
  const sdkTools = convertToSDKTools(options.tools);
  const maxSteps = options.maxSteps ?? 1;

  const taskType = options.taskType ?? 'reasoning';
  const defaultTimeout = DEFAULT_TIMEOUTS[taskType] ?? 60_000;
  const timeoutMs = options.timeoutMs ?? defaultTimeout;

  const result = await generateText({
    model,
    messages: modelMessages,
    system: options.systemPrompt,
    temperature: config.temperature,
    maxOutputTokens: config.maxTokens,
    topP: config.topP,
    maxRetries: options.maxRetries ?? 2,
    abortSignal: AbortSignal.timeout(timeoutMs),
    ...(sdkTools ? { tools: sdkTools, stopWhen: stepCountIs(maxSteps) } : {}),
  });

  const promptTokens = result.usage?.inputTokens ?? 0;
  const completionTokens = result.usage?.outputTokens ?? 0;
  const totalTokens = promptTokens + completionTokens;
  const estimatedCostUsd = estimateCost(modelKey, promptTokens, completionTokens);

  const usage = { promptTokens, completionTokens, totalTokens, estimatedCostUsd };

  const steps = (result as any).steps?.map((s: any) => ({
    text: s.text ?? '',
    toolCalls: (s.toolCalls ?? []).map((tc: any) => ({
      toolName: tc.toolName,
      args: tc.args,
      toolCallId: tc.toolCallId,
    })),
    toolResults: (s.toolResults ?? []).map((tr: any) => ({
      toolCallId: tr.toolCallId,
      result: tr.result,
    })),
    finishReason: String(s.finishReason ?? 'stop'),
  })) ?? undefined;

  const toolCallsExecuted = steps?.reduce(
    (sum: number, s: any) => sum + (s.toolCalls?.length ?? 0), 0,
  ) ?? 0;

  return {
    text: result.text,
    usage,
    provider: config.provider,
    model: modelEntry.modelId,
    finishReason: result.finishReason ?? 'unknown',
    raw: result,
    steps,
    toolCallsExecuted,
    fallbackHops: 0,
    attemptedProviders: [config.provider],
  };
}

export async function llmCall(
  messages: LLMMessage[],
  options: LLMCallOptions = {},
): Promise<LLMResponse> {
  const taskType = options.taskType ?? 'reasoning';

  // Budget check
  if (options.sessionId) {
    checkBudget(options.sessionId);
  }

  const observer = getObserver();
  observer.onCallStart(messages, options);

  const startTime = Date.now();

  // Build fallback chain
  const primaryModelKey = options.config?.model ?? DEFAULT_MODELS[taskType];
  const chain = FALLBACK_CHAINS[taskType] ?? [primaryModelKey];

  // Ensure primary is first in chain (may have been overridden via options)
  const orderedChain = [primaryModelKey, ...chain.filter((k) => k !== primaryModelKey)];
  const attemptedProviders: string[] = [];
  let fallbackHops = 0;

  for (let i = 0; i < orderedChain.length; i++) {
    const modelKey = orderedChain[i];
    const modelEntry = MODELS[modelKey];
    if (!modelEntry) continue;

    // Skip providers without API keys configured
    if (!isProviderAvailable(modelEntry.provider)) {
      log.info({ event: 'llm.provider.skipped', provider: modelEntry.provider, reason: 'no_api_key' }, 'Provider skipped');
      continue;
    }

    attemptedProviders.push(modelEntry.provider);

    try {
      // Retry once with jitter on retryable errors (5xx, network)
      const response = await withRetry(
        () => callProvider(modelKey, messages, options),
        { maxRetries: i === 0 ? 1 : 0 },  // retry only on primary
      );

      response.fallbackHops = fallbackHops;
      response.attemptedProviders = attemptedProviders;

      const durationMs = Date.now() - startTime;

      if (options.sessionId) {
        recordUsage(options.sessionId, response.usage);
      }

      observer.onCallEnd(response, durationMs);
      return response;

    } catch (error) {
      const durationMs = Date.now() - startTime;
      const errMsg = error instanceof Error ? error.message : String(error);

      log.warn(
        { event: 'llm.provider.failed', provider: modelEntry.provider, model: modelKey, error: errMsg, durationMs },
        'Provider call failed',
      );

      // If more providers in chain and error is retryable, try next
      if (i < orderedChain.length - 1 && isRetryableError(error)) {
        const nextModelKey = orderedChain[i + 1];
        const nextEntry = MODELS[nextModelKey];
        if (nextEntry) {
          observer.onCallFailover?.(modelEntry.provider, nextEntry.provider, errMsg);
        }
        fallbackHops++;
        continue;
      }

      // Last provider or non-retryable error — throw
      observer.onCallError(error, durationMs);

      if (error instanceof Error && error.name === 'LLMBudgetExceededError') {
        throw error;
      }

      throw new LLMProviderError(
        `LLM call failed after ${fallbackHops + 1} provider(s): ${errMsg}`,
        modelEntry.provider,
        modelEntry.modelId,
        error,
      );
    }
  }

  // All providers skipped (no API keys)
  const durationMs = Date.now() - startTime;
  const err = new LLMProviderError(
    'No LLM providers available — check API key environment variables',
    'anthropic',
    'none',
    null,
  );
  observer.onCallError(err, durationMs);
  throw err;
}

export async function llmAsk(
  prompt: string,
  options: LLMCallOptions = {},
): Promise<string> {
  const messages: LLMMessage[] = [{ role: 'user', content: prompt }];
  const response = await llmCall(messages, options);
  return response.text;
}
