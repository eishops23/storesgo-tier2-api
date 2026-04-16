// Agent Suite — Flags barrel export (Phase 0 Part E)

export type { FlagProvider, FeatureFlagConfig } from './types.js';
export { FeatureDisabledError } from './types.js';
export { EnvFlagProvider } from './env-flag-provider.js';
export { StaticFlagProvider } from './static-flag-provider.js';
export {
  isFeatureAllowed,
  getEffectiveLevel,
  setFlagProvider,
  getFlagProvider,
  resetFlagProvider,
} from './flags.js';
