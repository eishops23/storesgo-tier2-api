// Agent Suite — Recommendations feature barrel export (Phase 18A Prompt 3)

export {
  runRecommendations,
  RECOMMENDATIONS_FEATURE_KEY,
  ensureFeatureInitialized,
  _resetHandler,
} from './handler.js';
export type {
  RecommendationsChatInput,
  RecommendationsChatResult,
} from './handler.js';
export { RECOMMENDATIONS_TEMPLATE_HASH } from './system-prompt.js';
