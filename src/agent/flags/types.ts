// Agent Suite — Feature flag types (Phase 0 Part E)

import type { AiAutonomyLevel } from '@prisma/client';

export interface FeatureFlagConfig {
  enabled: boolean;
  maxLevel?: AiAutonomyLevel;
}

export interface FlagProvider {
  isFeatureAllowed(featureKey: string): boolean;
  getMaxLevel(featureKey: string): AiAutonomyLevel | undefined;
  isKillSwitchActive(): boolean;
  getSuiteEnabled(): boolean;
}

export class FeatureDisabledError extends Error {
  constructor(
    public readonly featureKey: string,
    public readonly reason: string,
  ) {
    super(`Feature '${featureKey}' is disabled: ${reason}`);
    this.name = 'FeatureDisabledError';
  }
}
