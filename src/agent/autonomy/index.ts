// Agent Suite — Autonomy barrel export (Phase 0 Part E)

export * from './promotion-criteria.js';
export {
  promoteFeatureLevel,
  checkPromotionReadiness,
  PromotionError,
} from './promotion.js';
export {
  getAutonomyDashboardData,
  type AutonomyDashboardRow,
} from './dashboard.js';
