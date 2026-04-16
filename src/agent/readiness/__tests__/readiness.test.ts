// Agent Suite — Readiness checks tests (Phase 0 Part E)

import { describe, it, expect, afterEach, vi } from 'vitest';

vi.mock('../../storage/prisma-client.js', () => ({
  getPrisma: vi.fn(() => mockPrisma),
}));

const mockPrisma = {
  $queryRaw: vi.fn(),
} as any;

import {
  checkAnthropicKey,
  checkDatabaseConnection,
  checkMigrationApplied,
  checkSuiteEnabled,
  checkKillSwitch,
} from '../checks.js';
import { runReadinessCheck } from '../readiness.js';

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
  vi.clearAllMocks();
});

describe('checkAnthropicKey', () => {
  it('fails when key not set', async () => {
    delete process.env['ANTHROPIC_API_KEY'];
    const result = await checkAnthropicKey();
    expect(result.status).toBe('fail');
  });

  it('warns when key has unexpected format', async () => {
    process.env['ANTHROPIC_API_KEY'] = 'bad-format-key';
    const result = await checkAnthropicKey();
    expect(result.status).toBe('warn');
  });

  it('passes with correct format', async () => {
    process.env['ANTHROPIC_API_KEY'] = 'sk-ant-correct-key';
    const result = await checkAnthropicKey();
    expect(result.status).toBe('pass');
  });
});

describe('checkDatabaseConnection', () => {
  it('passes when DB is reachable', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
    const result = await checkDatabaseConnection();
    expect(result.status).toBe('pass');
  });

  it('fails when DB is unreachable', async () => {
    mockPrisma.$queryRaw.mockRejectedValue(new Error('ECONNREFUSED'));
    const result = await checkDatabaseConnection();
    expect(result.status).toBe('fail');
    expect(result.message).toContain('ECONNREFUSED');
  });
});

describe('checkSuiteEnabled', () => {
  it('warns when env var not set', async () => {
    delete process.env['AGENT_SUITE_ENABLED'];
    const result = await checkSuiteEnabled();
    expect(result.status).toBe('warn');
    expect(result.message).toContain('dev/test');
  });

  it('warns when set to false', async () => {
    process.env['AGENT_SUITE_ENABLED'] = 'false';
    const result = await checkSuiteEnabled();
    expect(result.status).toBe('warn');
    expect(result.message).toContain('OFF');
  });

  it('warns when true but no feature flags', async () => {
    process.env['AGENT_SUITE_ENABLED'] = 'true';
    delete process.env['AGENT_FEATURE_FLAGS'];
    const result = await checkSuiteEnabled();
    expect(result.status).toBe('warn');
    expect(result.message).toContain('empty');
  });

  it('passes when fully configured', async () => {
    process.env['AGENT_SUITE_ENABLED'] = 'true';
    process.env['AGENT_FEATURE_FLAGS'] = 'cs_chat,seo_writer';
    const result = await checkSuiteEnabled();
    expect(result.status).toBe('pass');
  });
});

describe('checkKillSwitch', () => {
  it('warns when kill switch is active', async () => {
    process.env['AGENT_KILL_SWITCH'] = 'true';
    const result = await checkKillSwitch();
    expect(result.status).toBe('warn');
  });

  it('passes when kill switch is not active', async () => {
    delete process.env['AGENT_KILL_SWITCH'];
    const result = await checkKillSwitch();
    expect(result.status).toBe('pass');
  });
});

describe('runReadinessCheck', () => {
  it('returns not_ready when DB fails', async () => {
    process.env['ANTHROPIC_API_KEY'] = 'sk-ant-test';
    delete process.env['AGENT_SUITE_ENABLED'];
    delete process.env['AGENT_KILL_SWITCH'];
    mockPrisma.$queryRaw.mockRejectedValue(new Error('DB down'));

    const report = await runReadinessCheck();
    expect(report.status).toBe('not_ready');
    expect(report.checks.some((c) => c.status === 'fail')).toBe(true);
    expect(report.timestamp).toBeTruthy();
  });

  it('returns degraded when only warnings exist', async () => {
    process.env['ANTHROPIC_API_KEY'] = 'sk-ant-test';
    delete process.env['AGENT_SUITE_ENABLED'];
    delete process.env['AGENT_KILL_SWITCH'];
    mockPrisma.$queryRaw.mockResolvedValue([{ count: 0 }]);

    const report = await runReadinessCheck();
    // AGENT_SUITE_ENABLED undefined → warn, everything else passes
    expect(report.status).toBe('degraded');
  });

  it('has correct number of checks', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([{}]);
    const report = await runReadinessCheck();
    expect(report.checks).toHaveLength(5);
  });
});
