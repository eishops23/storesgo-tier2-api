// Agent Suite — Structured JSON logging with pino (Phase 0.9)

import pino from 'pino';
import { randomUUID } from 'node:crypto';

function resolveLogLevel(): string {
  if (process.env['LOG_LEVEL']) return process.env['LOG_LEVEL'];
  if (process.env['NODE_ENV'] === 'test') return 'silent';
  return 'warn';
}

export const rootLogger = pino({
  level: resolveLogLevel(),
  base: { component: 'agent' },
});

export function createChildLogger(context: Record<string, unknown>): pino.Logger {
  return rootLogger.child(context);
}

export function createCorrelationId(): string {
  return randomUUID();
}
