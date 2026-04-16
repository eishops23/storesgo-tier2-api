// Agent Suite — Environment-based flag provider (Phase 0 Part E)

import type { FlagProvider } from './types.js';
import type { AiAutonomyLevel } from '@prisma/client';

const VALID_LEVELS: AiAutonomyLevel[] = ['L0', 'L1', 'L2', 'L3'];

export class EnvFlagProvider implements FlagProvider {
  isKillSwitchActive(): boolean {
    return process.env['AGENT_KILL_SWITCH'] === 'true';
  }

  getSuiteEnabled(): boolean {
    if (process.env['AGENT_SUITE_ENABLED'] === undefined) return true;
    return process.env['AGENT_SUITE_ENABLED'] === 'true';
  }

  isFeatureAllowed(featureKey: string): boolean {
    if (this.isKillSwitchActive()) return false;
    if (!this.getSuiteEnabled()) return false;
    if (process.env['AGENT_SUITE_ENABLED'] === undefined) return true;
    const flagsList = process.env['AGENT_FEATURE_FLAGS']
      ?.split(',')
      .map((s) => s.trim())
      .filter(Boolean) ?? [];
    return flagsList.includes(featureKey);
  }

  getMaxLevel(featureKey: string): AiAutonomyLevel | undefined {
    const envKey = `AGENT_FEATURE_${featureKey.toUpperCase()}_MAX_LEVEL`;
    const value = process.env[envKey];
    if (!value) return undefined;
    if (VALID_LEVELS.includes(value as AiAutonomyLevel)) {
      return value as AiAutonomyLevel;
    }
    return undefined;
  }
}
