// Agent Suite — Graceful shutdown tests (Phase 0.9)

import { describe, it, expect, beforeEach } from 'vitest';
import {
  isShuttingDown,
  trackRunStart,
  trackRunEnd,
  getActiveRunCount,
  waitForActiveRuns,
  _resetShutdownState,
  _setShuttingDown,
} from '../shutdown.js';

describe('shutdown', () => {
  beforeEach(() => {
    _resetShutdownState();
  });

  it('isShuttingDown returns false initially', () => {
    expect(isShuttingDown()).toBe(false);
  });

  it('isShuttingDown returns true after _setShuttingDown(true)', () => {
    _setShuttingDown(true);
    expect(isShuttingDown()).toBe(true);
  });

  it('tracks active runs', () => {
    expect(getActiveRunCount()).toBe(0);
    trackRunStart();
    expect(getActiveRunCount()).toBe(1);
    trackRunStart();
    expect(getActiveRunCount()).toBe(2);
    trackRunEnd();
    expect(getActiveRunCount()).toBe(1);
    trackRunEnd();
    expect(getActiveRunCount()).toBe(0);
  });

  it('trackRunEnd does not go below zero', () => {
    trackRunEnd();
    expect(getActiveRunCount()).toBe(0);
  });

  it('waitForActiveRuns resolves immediately when no active runs', async () => {
    const start = Date.now();
    await waitForActiveRuns(1000);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(500);
  });

  it('waitForActiveRuns waits for runs to complete', async () => {
    trackRunStart();

    // Simulate run ending after 300ms
    setTimeout(() => trackRunEnd(), 300);

    const start = Date.now();
    await waitForActiveRuns(5000);
    const elapsed = Date.now() - start;

    expect(elapsed).toBeGreaterThanOrEqual(200);
    expect(getActiveRunCount()).toBe(0);
  });

  it('waitForActiveRuns times out if runs never end', async () => {
    trackRunStart();

    const start = Date.now();
    await waitForActiveRuns(500);
    const elapsed = Date.now() - start;

    expect(elapsed).toBeGreaterThanOrEqual(400);
    expect(getActiveRunCount()).toBe(1); // still active
  });

  it('_resetShutdownState clears all state', () => {
    _setShuttingDown(true);
    trackRunStart();
    trackRunStart();

    _resetShutdownState();

    expect(isShuttingDown()).toBe(false);
    expect(getActiveRunCount()).toBe(0);
  });
});
