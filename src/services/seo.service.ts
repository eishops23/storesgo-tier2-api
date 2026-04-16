// ==========================================================
// STORESGO SEO SERVICE — PHASE 6
// Provides SEO pages, blog content, and deals for storefront
// ==========================================================

import { prisma } from "../plugins/prisma.js";
import { getPagination } from "../utils/pagination.js";
import type { QualityIssue } from "./blog.service.js";

export interface SeoPageListQuery {
  page?: number;
  pageSize?: number;
  q?: string;
}

export interface SeoPageListItem {
  id: number;
  title: string;
  slug: string;
  metaTitle: string | null;
  metaDescription: string | null;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SeoPageDetail extends SeoPageListItem {
  contentHtml: string | null;
}

export interface SeasonalDealItem {
  id: number;
  title: string;
  description: string | null;
  imageUrl: string | null;
  discountPct: number | null;
  startDate: Date;
  endDate: Date;
  active: boolean;
}

interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * List published SEO pages with pagination
 */
export async function listSeoPages(
  query: SeoPageListQuery
): Promise<PaginatedResult<SeoPageListItem>> {
  const { page, pageSize, skip, take } = getPagination({
    page: query.page,
    pageSize: query.pageSize,
  });

  const where: any = { published: true };

  if (query.q) {
    where.OR = [
      { title: { contains: query.q, mode: "insensitive" } },
      { metaDescription: { contains: query.q, mode: "insensitive" } },
    ];
  }

  const [pages, total] = await Promise.all([
    prisma.seoPage.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        metaTitle: true,
        metaDescription: true,
        published: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.seoPage.count({ where }),
  ]);

  return { items: pages, total, page, pageSize };
}

/**
 * Get SEO page by slug
 */
export async function getSeoPageBySlug(slug: string): Promise<SeoPageDetail | null> {
  const page = await prisma.seoPage.findUnique({
    where: { slug },
    select: {
      id: true,
      title: true,
      slug: true,
      metaTitle: true,
      metaDescription: true,
      contentHtml: true,
      published: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!page || !page.published) return null;

  return page;
}

/**
 * List active seasonal deals with pagination
 */
export async function listSeasonalDeals(
  query: { page?: number; pageSize?: number; activeOnly?: boolean }
): Promise<PaginatedResult<SeasonalDealItem>> {
  const { page, pageSize, skip, take } = getPagination({
    page: query.page,
    pageSize: query.pageSize,
  });

  const now = new Date();
  const where: any = {};

  // Filter for active deals only (active flag + within date range)
  if (query.activeOnly !== false) {
    where.active = true;
    where.startDate = { lte: now };
    where.endDate = { gte: now };
  }

  const [deals, total] = await Promise.all([
    prisma.seasonalDeal.findMany({
      where,
      skip,
      take,
      orderBy: { endDate: "asc" },
      select: {
        id: true,
        title: true,
        description: true,
        imageUrl: true,
        discountPct: true,
        startDate: true,
        endDate: true,
        active: true,
      },
    }),
    prisma.seasonalDeal.count({ where }),
  ]);

  return { items: deals, total, page, pageSize };
}

/**
 * Get seasonal deal by ID
 */
export async function getSeasonalDealById(id: number): Promise<SeasonalDealItem | null> {
  const deal = await prisma.seasonalDeal.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      description: true,
      imageUrl: true,
      discountPct: true,
      startDate: true,
      endDate: true,
      active: true,
    },
  });

  return deal;
}

// ============================================================
// Phase 9 Agent Read Functions (operator-facing, L0-safe)
// Added 2026-04-10 — audit: docs/phase9-seo-audit.md
// adminId is the first parameter of every Phase 9 function so
// the future ai_admin_audit_log table (Prompt 3) can record the
// caller. It is currently unused inside the function bodies.
// ============================================================

export interface SeoPageAudit {
  pageId: number;
  slug: string;
  title: string;
  type: string | null;
  published: boolean;
  publishedAt: Date | null;
  metrics: {
    titleLength: number;
    metaTitleLength: number;
    metaDescriptionLength: number;
    contentWordCount: number;
    h2Count: number;
    internalLinkCount: number;
    hasEmbedding: boolean;
  };
  issues: QualityIssue[];
  score: number;
}

// Local helpers — duplicated from blog.service.ts to keep this
// section self-contained. The two helpers are simple enough that
// the duplication is preferable to creating a third utility module.

function _countWords(html: string | null | undefined): number {
  if (!html) return 0;
  const text = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  if (!text) return 0;
  return text.split(" ").filter((w) => w.length > 0).length;
}

function _countH2(html: string | null | undefined): number {
  if (!html) return 0;
  const matches = html.match(/<h2[\s>]/gi);
  return matches ? matches.length : 0;
}

function _countInternalLinks(html: string | null | undefined): number {
  if (!html) return 0;
  const matches = html.match(/<a[^>]+href=["'](\/|https?:\/\/(?:www\.)?storesgo\.com)/gi);
  return matches ? matches.length : 0;
}

function _scoreFromIssues(issues: QualityIssue[]): number {
  let score = 100;
  for (const issue of issues) {
    if (issue.severity === "critical") score -= 10;
    else if (issue.severity === "warning") score -= 5;
    else score -= 1;
  }
  return Math.max(0, Math.min(100, score));
}

/**
 * auditSeoPageForOperator
 *
 * Structural quality audit for a single SeoPage row by ID. Mirrors
 * auditBlogPostForOperator in blog.service.ts but adapted for the
 * SeoPage shape (no `tags`, has `type`, has `metaTitle`).
 *
 * Note on embeddings: prod has 0/633 SeoPage embeddings populated
 * as of 2026-04-10. The "embedding missing" issue is therefore
 * raised at "warning" severity (not critical) so audits do not
 * mass-flag the entire table.
 */
export async function auditSeoPageForOperator(
  _adminId: number,
  pageId: number,
): Promise<SeoPageAudit | null> {
  const page = await prisma.seoPage.findUnique({
    where: { id: pageId },
    select: {
      id: true,
      type: true,
      slug: true,
      title: true,
      metaTitle: true,
      metaDescription: true,
      contentHtml: true,
      published: true,
      publishedAt: true,
      embedding: true,
    },
  });

  if (!page) return null;

  const titleLength = page.title?.length ?? 0;
  const metaTitleLength = page.metaTitle?.length ?? 0;
  const metaDescriptionLength = page.metaDescription?.length ?? 0;
  const contentWordCount = _countWords(page.contentHtml);
  const h2Count = _countH2(page.contentHtml);
  const internalLinkCount = _countInternalLinks(page.contentHtml);
  const hasEmbedding = Array.isArray(page.embedding) && page.embedding.length > 0;

  const issues: QualityIssue[] = [];

  if (titleLength === 0) {
    issues.push({ severity: "critical", code: "title_empty", message: "Title is empty" });
  } else if (titleLength < 30) {
    issues.push({
      severity: "warning",
      code: "title_short",
      message: `Title is ${titleLength} chars (recommended 30-60)`,
    });
  } else if (titleLength > 60) {
    issues.push({
      severity: "warning",
      code: "title_long",
      message: `Title is ${titleLength} chars (recommended 30-60)`,
    });
  }

  if (metaTitleLength === 0) {
    issues.push({
      severity: "warning",
      code: "meta_title_missing",
      message: "metaTitle is empty — search results will fall back to title",
    });
  }

  if (metaDescriptionLength === 0) {
    issues.push({
      severity: "critical",
      code: "meta_description_missing",
      message: "metaDescription is missing — search snippets will be auto-generated",
    });
  } else if (metaDescriptionLength < 120) {
    issues.push({
      severity: "warning",
      code: "meta_description_short",
      message: `metaDescription is ${metaDescriptionLength} chars (recommended 120-160)`,
    });
  } else if (metaDescriptionLength > 160) {
    issues.push({
      severity: "warning",
      code: "meta_description_long",
      message: `metaDescription is ${metaDescriptionLength} chars (recommended 120-160)`,
    });
  }

  if (contentWordCount === 0) {
    issues.push({
      severity: "critical",
      code: "content_empty",
      message: "contentHtml is empty",
    });
  } else if (contentWordCount < 300) {
    issues.push({
      severity: "warning",
      code: "content_short",
      message: `Content is ${contentWordCount} words (recommended 300+)`,
    });
  }

  if (h2Count === 0 && contentWordCount > 100) {
    issues.push({
      severity: "warning",
      code: "no_h2_headings",
      message: "Content has no <h2> headings — heading hierarchy missing",
    });
  }

  if (internalLinkCount < 2 && contentWordCount > 200) {
    issues.push({
      severity: "warning",
      code: "few_internal_links",
      message: `Only ${internalLinkCount} internal links (recommended 2+)`,
    });
  }

  if (page.published && !page.publishedAt) {
    issues.push({
      severity: "warning",
      code: "published_at_missing",
      message: "Page is marked published but publishedAt is null",
    });
  }

  if (!hasEmbedding) {
    // Warning, not critical: prod has 0/633 embeddings populated.
    // Mass-flagging at critical severity would render the score
    // useless for the operator.
    issues.push({
      severity: "warning",
      code: "embedding_missing",
      message:
        "Page has no embedding vector — semantic similarity tools will skip it (current prod default)",
    });
  }

  return {
    pageId: page.id,
    slug: page.slug,
    title: page.title,
    type: page.type,
    published: page.published,
    publishedAt: page.publishedAt,
    metrics: {
      titleLength,
      metaTitleLength,
      metaDescriptionLength,
      contentWordCount,
      h2Count,
      internalLinkCount,
      hasEmbedding,
    },
    issues,
    score: _scoreFromIssues(issues),
  };
}
