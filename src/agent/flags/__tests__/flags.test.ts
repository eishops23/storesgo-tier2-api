// Agent Suite — Feature flag tests (Phase 0 Part E)

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EnvFlagProvider } from '../env-flag-provider.js';
import { StaticFlagProvider } from '../static-flag-provider.js';

vi.mock('../../storage/index.js', () => ({
  AutonomyRepo: {
    getCurrentLevel: vi.fn(async () => 'L2'),
    initializeFeature: vi.fn(),
  },
}));

import {
  isFeatureAllowed,
  getEffectiveLevel,
  setFlagProvider,
  resetFlagProvider,
} from '../flags.js';
import { FeatureDisabledError } from '../types.js';
import { AutonomyRepo } from '../../storage/index.js';

const mockAutoRepo = vi.mocked(AutonomyRepo);

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
  resetFlagProvider();
  vi.clearAllMocks();
});

describe('EnvFlagProvider', () => {
  let provider: EnvFlagProvider;

  beforeEach(() => {
    provider = new EnvFlagProvider();
  });

  it('defaults suiteEnabled to true when env var undefined', () => {
    delete process.env['AGENT_SUITE_ENABLED'];
    expect(provider.getSuiteEnabled()).toBe(true);
  });

  it('returns false when AGENT_SUITE_ENABLED is "false"', () => {
    process.env['AGENT_SUITE_ENABLED'] = 'false';
    expect(provider.getSuiteEnabled()).toBe(false);
  });

  it('returns true when AGENT_SUITE_ENABLED is "true"', () => {
    process.env['AGENT_SUITE_ENABLED'] = 'true';
    expect(provider.getSuiteEnabled()).toBe(true);
  });

  it('kill switch overrides everything', () => {
    process.env['AGENT_KILL_SWITCH'] = 'true';
    process.env['AGENT_SUITE_ENABLED'] = 'true';
    process.env['AGENT_FEATURE_FLAGS'] = 'cs_chat';
    expect(provider.isFeatureAllowed('cs_chat')).toBe(false);
  });

  it('allows all features when AGENT_SUITE_ENABLED undefined (dev mode)', () => {
    delete process.env['AGENT_SUITE_ENABLED'];
    expect(provider.isFeatureAllowed('cs_chat')).toBe(true);
    expect(provider.isFeatureAllowed('any_random_feature')).toBe(true);
  });

  it('requires allowlist when AGENT_SUITE_ENABLED is true', () => {
    process.env['AGENT_SUITE_ENABLED'] = 'true';
    process.env['AGENT_FEATURE_FLAGS'] = 'cs_chat,seo_writer';
    expect(provider.isFeatureAllowed('cs_chat')).toBe(true);
    expect(provider.isFeatureAllowed('seo_writer')).toBe(true);
    expect(provider.isFeatureAllowed('unknown')).toBe(false);
  });

  it('parses MAX_LEVEL from env', () => {
    process.env['AGENT_FEATURE_CS_CHAT_MAX_LEVEL'] = 'L2';
    expect(provider.getMaxLevel('cs_chat')).toBe('L2');
  });

  it('returns undefined for missing or invalid MAX_LEVEL', () => {
    expect(provider.getMaxLevel('cs_chat')).toBeUndefined();
    process.env['AGENT_FEATURE_CS_CHAT_MAX_LEVEL'] = 'INVALID';
    expect(provider.getMaxLevel('cs_chat')).toBeUndefined();
  });
});

describe('StaticFlagProvider', () => {
  it('defaults to all allowed', () => {
    const provider = new StaticFlagProvider();
    expect(provider.isFeatureAllowed('anything')).toBe(true);
    expect(provider.getSuiteEnabled()).toBe(true);
    expect(provider.isKillSwitchActive()).toBe(false);
  });

  it('respects kill switch', () => {
    const provider = new StaticFlagProvider({ killSwitch: true });
    expect(provider.isFeatureAllowed('cs_chat')).toBe(false);
  });

  it('respects suite disabled', () => {
    const provider = new StaticFlagProvider({ suiteEnabled: false });
    expect(provider.isFeatureAllowed('cs_chat')).toBe(false);
  });

  it('respects per-feature config', () => {
    const provider = new StaticFlagProvider({
      features: {
        cs_chat: { enabled: true, maxLevel: 'L1' },
        seo_writer: { enabled: false },
      },
    });
    expect(provider.isFeatureAllowed('cs_chat')).toBe(true);
    expect(provider.isFeatureAllowed('seo_writer')).toBe(false);
    expect(provider.getMaxLevel('cs_chat')).toBe('L1');
  });
});

describe('getEffectiveLevel', () => {
  beforeEach(() => {
    mockAutoRepo.getCurrentLevel.mockResolvedValue('L2');
  });

  it('returns DB level when no cap is set', async () => {
    setFlagProvider(new StaticFlagProvider());
    const level = await getEffectiveLevel('cs_chat');
    expect(level).toBe('L2');
  });

  it('caps at maxLevel when DB level is higher', async () => {
    setFlagProvider(new StaticFlagProvider({
      features: { cs_chat: { enabled: true, maxLevel: 'L1' } },
    }));
    const level = await getEffectiveLevel('cs_chat');
    expect(level).toBe('L1');
  });

  it('returns DB level when it is lower than cap', async () => {
    mockAutoRepo.getCurrentLevel.mockResolvedValue('L0');
    setFlagProvider(new StaticFlagProvider({
      features: { cs_chat: { enabled: true, maxLevel: 'L2' } },
    }));
    const level = await getEffectiveLevel('cs_chat');
    expect(level).toBe('L0');
  });

  it('throws FeatureDisabledError when kill switch active', async () => {
    setFlagProvider(new StaticFlagProvider({ killSwitch: true }));
    await expect(getEffectiveLevel('cs_chat')).rejects.toThrow(FeatureDisabledError);
    await expect(getEffectiveLevel('cs_chat')).rejects.toThrow('kill switch');
  });

  it('throws FeatureDisabledError when suite disabled', async () => {
    setFlagProvider(new StaticFlagProvider({ suiteEnabled: false }));
    await expect(getEffectiveLevel('cs_chat')).rejects.toThrow(FeatureDisabledError);
    await expect(getEffectiveLevel('cs_chat')).rejects.toThrow('not enabled');
  });

  it('throws FeatureDisabledError when feature not allowed', async () => {
    setFlagProvider(new StaticFlagProvider({
      features: { cs_chat: { enabled: false } },
    }));
    await expect(getEffectiveLevel('cs_chat')).rejects.toThrow(FeatureDisabledError);
    await expect(getEffectiveLevel('cs_chat')).rejects.toThrow('not in allowlist');
  });
});

describe('setFlagProvider / resetFlagProvider', () => {
  it('swaps the provider', () => {
    setFlagProvider(new StaticFlagProvider({ killSwitch: true }));
    expect(isFeatureAllowed('cs_chat')).toBe(false);

    resetFlagProvider();
    // Back to env provider, AGENT_SUITE_ENABLED undefined → allow
    delete process.env['AGENT_SUITE_ENABLED'];
    expect(isFeatureAllowed('cs_chat')).toBe(true);
  });
});
