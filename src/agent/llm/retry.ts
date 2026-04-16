// Agent Suite — Retry with jitter helper (Phase 0.9)

export interface RetryOptions {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

const DEFAULT_OPTIONS: RetryOptions = {
  maxRetries: 1,
  baseDelayMs: 500,
  maxDelayMs: 5000,
};

function delayWithJitter(attemptIndex: number, opts: RetryOptions): number {
  const exponential = opts.baseDelayMs * Math.pow(2, attemptIndex);
  const capped = Math.min(exponential, opts.maxDelayMs);
  const jitter = Math.random() * Math.min(capped, 500);
  return capped + jitter;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: Partial<RetryOptions> = {},
): Promise<T> {
  const options = { ...DEFAULT_OPTIONS, ...opts };
  let lastError: unknown;

  for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < options.maxRetries) {
        const delay = delayWithJitter(attempt, options);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}
