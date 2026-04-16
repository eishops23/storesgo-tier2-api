// Agent Suite — Graceful shutdown support (Phase 0.9)

import { createChildLogger } from '../observability/index.js';

const log = createChildLogger({ subsystem: 'shutdown' });

let shuttingDown = false;
let activeRuns = 0;

const SHUTDOWN_TIMEOUT_MS = 10_000;

export function isShuttingDown(): boolean {
  return shuttingDown;
}

export function trackRunStart(): void {
  activeRuns++;
}

export function trackRunEnd(): void {
  activeRuns = Math.max(0, activeRuns - 1);
}

export function getActiveRunCount(): number {
  return activeRuns;
}

export async function waitForActiveRuns(timeoutMs: number = SHUTDOWN_TIMEOUT_MS): Promise<void> {
  if (activeRuns === 0) return;

  log.info({ event: 'shutdown.draining', activeRuns }, 'Waiting for active runs to complete');

  const deadline = Date.now() + timeoutMs;
  while (activeRuns > 0 && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  if (activeRuns > 0) {
    log.warn({ event: 'shutdown.timeout', activeRuns }, 'Shutdown timeout — forcing exit with active runs');
  } else {
    log.info({ event: 'shutdown.drained' }, 'All active runs completed');
  }
}

export function registerShutdownHook(): void {
  const handler = async (signal: string) => {
    if (shuttingDown) return; // prevent double-fire
    shuttingDown = true;
    log.warn({ event: 'shutdown.signal', signal, activeRuns }, 'Shutdown signal received');
    await waitForActiveRuns();
  };

  process.on('SIGTERM', () => { void handler('SIGTERM'); });
  process.on('SIGINT', () => { void handler('SIGINT'); });
}

// For testing
export function _resetShutdownState(): void {
  shuttingDown = false;
  activeRuns = 0;
}

export function _setShuttingDown(value: boolean): void {
  shuttingDown = value;
}
