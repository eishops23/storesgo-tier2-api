// Agent Suite — Referrals tools barrel export (Phase 5 Prompt 3)

import type { ToolRegistry } from '../registry.js';
import { getReferralStatsTool } from './get-referral-stats.js';
import { getReferralHistoryTool } from './get-referral-history.js';
import { validateReferralCodeTool } from './validate-referral-code.js';
import { getReferralLeaderboardTool } from './get-referral-leaderboard.js';
import { getReferralProgramInfoTool } from './get-referral-program-info.js';

export {
  getReferralStatsTool,
  getReferralHistoryTool,
  validateReferralCodeTool,
  getReferralLeaderboardTool,
  getReferralProgramInfoTool,
};

export function registerReferralsTools(registry: ToolRegistry): void {
  registry.register(getReferralStatsTool);
  registry.register(getReferralHistoryTool);
  registry.register(validateReferralCodeTool);
  registry.register(getReferralLeaderboardTool);
  registry.register(getReferralProgramInfoTool);
}
