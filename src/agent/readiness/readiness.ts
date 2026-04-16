// Agent Suite — Readiness aggregator (Phase 0 Part E)

import {
  checkAnthropicKey,
  checkDatabaseConnection,
  checkMigrationApplied,
  checkSuiteEnabled,
  checkKillSwitch,
  type CheckResult,
} from './checks.js';

export type ReadinessStatus = 'ready' | 'degraded' | 'not_ready';

export interface ReadinessReport {
  status: ReadinessStatus;
  checks: CheckResult[];
  timestamp: string;
}

export async function runReadinessCheck(): Promise<ReadinessReport> {
  const checks = await Promise.all([
    checkAnthropicKey(),
    checkDatabaseConnection(),
    checkMigrationApplied(),
    checkSuiteEnabled(),
    checkKillSwitch(),
  ]);

  const hasFail = checks.some((c) => c.status === 'fail');
  const hasWarn = checks.some((c) => c.status === 'warn');

  const status: ReadinessStatus = hasFail
    ? 'not_ready'
    : hasWarn
      ? 'degraded'
      : 'ready';

  return {
    status,
    checks,
    timestamp: new Date().toISOString(),
  };
}
