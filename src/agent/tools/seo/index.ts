// Agent Suite — SEO tools barrel export (Phase 9 Prompt 3)

import type { ToolRegistry } from '../registry.js';
import { auditBlogPostTool } from './audit-blog-post.js';
import { auditSeoPageTool } from './audit-seo-page.js';
import { findContentGapsTool } from './find-content-gaps.js';
import { findOrphanBlogPostsTool } from './find-orphan-blog-posts.js';
import { findSimilarBlogPostsTool } from './find-similar-blog-posts.js';
import { getBlogStatsTool } from './get-blog-stats.js';
import { draftBlogPostOutlineTool } from './draft-blog-post-outline.js';

export {
  auditBlogPostTool,
  auditSeoPageTool,
  findContentGapsTool,
  findOrphanBlogPostsTool,
  findSimilarBlogPostsTool,
  getBlogStatsTool,
  draftBlogPostOutlineTool,
};

export function registerSeoTools(registry: ToolRegistry): void {
  registry.register(auditBlogPostTool);
  registry.register(auditSeoPageTool);
  registry.register(findContentGapsTool);
  registry.register(findOrphanBlogPostsTool);
  registry.register(findSimilarBlogPostsTool);
  registry.register(getBlogStatsTool);
  registry.register(draftBlogPostOutlineTool);
}
