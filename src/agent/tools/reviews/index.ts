// Agent Suite — Reviews tools barrel export (Phase 11 Prompt 3)

import type { ToolRegistry } from '../registry.js';
import { listMyReviewsTool } from './list-my-reviews.js';
import { getReviewByIdTool } from './get-review-by-id.js';
import { getReviewStatsTool } from './get-review-stats.js';
import { findReviewsNeedingResponseTool } from './find-reviews-needing-response.js';
import { draftResponseTool } from './draft-response.js';
import { suggestReviewResponseToneTool } from './suggest-review-response-tone.js';

export {
  listMyReviewsTool,
  getReviewByIdTool,
  getReviewStatsTool,
  findReviewsNeedingResponseTool,
  draftResponseTool,
  suggestReviewResponseToneTool,
};

export function registerReviewsTools(registry: ToolRegistry): void {
  registry.register(listMyReviewsTool);
  registry.register(getReviewByIdTool);
  registry.register(getReviewStatsTool);
  registry.register(findReviewsNeedingResponseTool);
  registry.register(draftResponseTool);
  registry.register(suggestReviewResponseToneTool);
}
