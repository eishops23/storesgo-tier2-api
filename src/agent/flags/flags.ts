// Agent Suite — Flag singleton API (Phase 0 Part E)

import type { AiAutonomyLevel } from '@prisma/client';
import type { FlagProvider } from './types.js';
import { FeatureDisabledError } from './types.js';
import { EnvFlagProvider } from './env-flag-provider.js';
import { AutonomyRepo } from '../storage/index.js';

let activeProvider: FlagProvider = new EnvFlagProvider();

export function setFlagProvider(provider: FlagProvider): void {
  activeProvider = provider;
}

export function getFlagProvider(): FlagProvider {
  return activeProvider;
}

export function resetFlagProvider(): void {
  activeProvider = new EnvFlagProvider();
}

export function isFeatureAllowed(featureKey: string): boolean {
  return activeProvider.isFeatureAllowed(featureKey);
}

export async function getEffectiveLevel(featureKey: string): Promise<AiAutonomyLevel> {
  if (activeProvider.isKillSwitchActive()) {
    throw new FeatureDisabledError(featureKey, 'kill switch active');
  }
  if (!activeProvider.getSuiteEnabled()) {
    throw new FeatureDisabledError(featureKey, 'agent suite not enabled');
  }
  if (!activeProvider.isFeatureAllowed(featureKey)) {
    throw new FeatureDisabledError(featureKey, 'feature not in allowlist');
  }

  const dbLevel = await AutonomyRepo.getCurrentLevel(featureKey);
  const maxLevel = activeProvider.getMaxLevel(featureKey);

  if (!maxLevel) return dbLevel;

  const LEVEL_ORDER: AiAutonomyLevel[] = ['L0', 'L1', 'L2', 'L3'];
  const dbIdx = LEVEL_ORDER.indexOf(dbLevel);
  const maxIdx = LEVEL_ORDER.indexOf(maxLevel);
  return LEVEL_ORDER[Math.min(dbIdx, maxIdx)]!;
}
