// Agent Suite — Retry with jitter tests (Phase 0.9)

import { describe, it, expect, vi } from 'vitest';
import { withRetry } from '../retry.js';

describe('withRetry', () => {
  it('returns result on first success', async () => {
    const fn = vi.fn().mockResolvedValue('ok');
    const result = await withRetry(fn, { maxRetries: 2, baseDelayMs: 10, maxDelayMs: 50 });

    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries on failure and succeeds on second attempt', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValue('ok');

    const result = await withRetry(fn, { maxRetries: 2, baseDelayMs: 1, maxDelayMs: 5 });

    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('throws after exhausting all retries', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('persistent fail'));

    await expect(
      withRetry(fn, { maxRetries: 2, baseDelayMs: 1, maxDelayMs: 5 }),
    ).rejects.toThrow('persistent fail');

    expect(fn).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
  });

  it('does not retry when maxRetries is 0', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('fail'));

    await expect(
      withRetry(fn, { maxRetries: 0, baseDelayMs: 1, maxDelayMs: 5 }),
    ).rejects.toThrow('fail');

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('delays between retries', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValue('ok');

    const start = Date.now();
    await withRetry(fn, { maxRetries: 1, baseDelayMs: 50, maxDelayMs: 200 });
    const elapsed = Date.now() - start;

    // Should have waited at least 50ms (base delay)
    expect(elapsed).toBeGreaterThanOrEqual(40); // allow small timer variance
  });
});
