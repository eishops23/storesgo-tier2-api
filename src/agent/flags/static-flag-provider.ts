// Agent Suite — Static flag provider for tests (Phase 0 Part E)

import type { FlagProvider, FeatureFlagConfig } from './types.js';
import type { AiAutonomyLevel } from '@prisma/client';

export class StaticFlagProvider implements FlagProvider {
  private killSwitch: boolean;
  private suiteEnabled: boolean;
  private features: Map<string, FeatureFlagConfig>;

  constructor(
    config: {
      killSwitch?: boolean;
      suiteEnabled?: boolean;
      features?: Record<string, FeatureFlagConfig>;
    } = {},
  ) {
    this.killSwitch = config.killSwitch ?? false;
    this.suiteEnabled = config.suiteEnabled ?? true;
    this.features = new Map(Object.entries(config.features ?? {}));
  }

  isKillSwitchActive(): boolean {
    return this.killSwitch;
  }

  getSuiteEnabled(): boolean {
    return this.suiteEnabled;
  }

  isFeatureAllowed(featureKey: string): boolean {
    if (this.killSwitch) return false;
    if (!this.suiteEnabled) return false;
    const feature = this.features.get(featureKey);
    if (!feature) return true;
    return feature.enabled;
  }

  getMaxLevel(featureKey: string): AiAutonomyLevel | undefined {
    return this.features.get(featureKey)?.maxLevel;
  }
}
