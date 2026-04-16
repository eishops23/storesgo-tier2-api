// Agent Suite — Individual readiness checks (Phase 0 Part E)

import { getPrisma } from '../storage/prisma-client.js';

export type CheckStatus = 'pass' | 'warn' | 'fail';

export interface CheckResult {
  name: string;
  status: CheckStatus;
  message: string;
}

export async function checkAnthropicKey(): Promise<CheckResult> {
  const key = process.env['ANTHROPIC_API_KEY'];
  if (!key) {
    return { name: 'anthropic_api_key', status: 'fail', message: 'ANTHROPIC_API_KEY not set' };
  }
  if (!key.startsWith('sk-ant-')) {
    return { name: 'anthropic_api_key', status: 'warn', message: 'ANTHROPIC_API_KEY format unexpected' };
  }
  return { name: 'anthropic_api_key', status: 'pass', message: 'key present with correct format' };
}

export async function checkDatabaseConnection(): Promise<CheckResult> {
  try {
    const prisma = getPrisma();
    await prisma.$queryRaw`SELECT 1`;
    return { name: 'database_connection', status: 'pass', message: 'connected' };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { name: 'database_connection', status: 'fail', message: `connection failed: ${msg}` };
  }
}

export async function checkMigrationApplied(): Promise<CheckResult> {
  try {
    const prisma = getPrisma();
    await prisma.$queryRaw`SELECT COUNT(*) FROM ai_autonomy_states LIMIT 1`;
    return { name: 'ai_tables_migration', status: 'pass', message: 'ai_* tables present' };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      name: 'ai_tables_migration',
      status: 'fail',
      message: `migration not applied: ${msg}. Run: psql $DATABASE_URL -f prisma/migrations/manual/2026_04_08_add_ai_tables.sql`,
    };
  }
}

export async function checkSuiteEnabled(): Promise<CheckResult> {
  const enabled = process.env['AGENT_SUITE_ENABLED'];
  if (enabled === undefined) {
    return {
      name: 'agent_suite_enabled',
      status: 'warn',
      message: 'AGENT_SUITE_ENABLED not set (dev/test mode — all features allowed)',
    };
  }
  if (enabled !== 'true') {
    return {
      name: 'agent_suite_enabled',
      status: 'warn',
      message: `AGENT_SUITE_ENABLED=${enabled} — suite is OFF`,
    };
  }
  const flags = process.env['AGENT_FEATURE_FLAGS'];
  if (!flags) {
    return {
      name: 'agent_suite_enabled',
      status: 'warn',
      message: 'AGENT_SUITE_ENABLED=true but AGENT_FEATURE_FLAGS is empty — no features will run',
    };
  }
  return {
    name: 'agent_suite_enabled',
    status: 'pass',
    message: `suite enabled with flags: ${flags}`,
  };
}

export async function checkKillSwitch(): Promise<CheckResult> {
  if (process.env['AGENT_KILL_SWITCH'] === 'true') {
    return { name: 'kill_switch', status: 'warn', message: 'AGENT_KILL_SWITCH=true — ALL features disabled' };
  }
  return { name: 'kill_switch', status: 'pass', message: 'kill switch not active' };
}
