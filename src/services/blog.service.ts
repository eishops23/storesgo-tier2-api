// ==========================================================
// STORESGO BLOG SERVICE — PHASE 16
// Daily AI-generated blog posts for SEO and content marketing
// ==========================================================

import { prisma } from "../plugins/prisma.js";
import { getPagination } from "../utils/pagination.js";
import {
  cosineSimilarity,
  normalizeEmbedding,
  hasPgvector,
} from "./embeddings.util.js";

// ---------------------------------------------------------
// Types
// ---------------------------------------------------------

export interface BlogPostListQuery {
  page?: number;
  pageSize?: number;
  q?: string;
  language?: string;
  category?: string;
  source?: string;
  tag?: string;
}

export interface BlogPostListItem {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  featuredImage: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  category: string | null;
  tags: string[];
  // Phase 9 type-widening: BlogPost.language and source are nullable
  // in the Prisma schema. The original interface declared them as
  // non-null, which compiled only because nothing in the agent compile
  // scope imported this file before Phase 9. Widened to match schema.
  language: string | null;
  source: string | null;
  published: boolean;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface BlogPostDetail extends BlogPostListItem {
  contentHtml: string | null;
  keywords: string[] | null;
  sellerId: number | null;
  productId: number | null;
  aiModel: string | null;
}

interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

// ---------------------------------------------------------
// Service Functions
// ---------------------------------------------------------

/**
 * List published blog posts with pagination and filtering
 */
export async function listBlogPosts(
  query: BlogPostListQuery
): Promise<PaginatedResult<BlogPostListItem>> {
  const { page, pageSize, skip, take } = getPagination({
    page: query.page,
    pageSize: query.pageSize,
  });

  const where: any = { published: true };

  // Search in title, excerpt, or content
  if (query.q) {
    where.OR = [
      { title: { contains: query.q, mode: "insensitive" } },
      { excerpt: { contains: query.q, mode: "insensitive" } },
      { metaDescription: { contains: query.q, mode: "insensitive" } },
    ];
  }

  // Filter by language
  if (query.language) {
    where.language = query.language;
  }

  // Filter by category
  if (query.category) {
    where.category = query.category;
  }

  // Filter by source (autoblog, manual, imported)
  if (query.source) {
    where.source = query.source;
  }

  // Filter by tag
  if (query.tag) {
    where.tags = { has: query.tag };
  }

  const [posts, total] = await Promise.all([
    prisma.blogPost.findMany({
      where,
      skip,
      take,
      orderBy: { publishedAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        featuredImage: true,
        metaTitle: true,
        metaDescription: true,
        category: true,
        tags: true,
        language: true,
        source: true,
        published: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.blogPost.count({ where }),
  ]);

  return { items: posts, total, page, pageSize };
}

/**
 * Get blog post by slug
 */
export async function getBlogPostBySlug(slug: string): Promise<BlogPostDetail | null> {
  const post = await prisma.blogPost.findUnique({
    where: { slug },
    select: {
      id: true,
      title: true,
      slug: true,
      contentHtml: true,
      excerpt: true,
      featuredImage: true,
      metaTitle: true,
      metaDescription: true,
      keywords: true,
      category: true,
      tags: true,
      language: true,
      source: true,
      published: true,
      publishedAt: true,
      sellerId: true,
      productId: true,
      aiModel: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!post || !post.published) return null;

  return post;
}

/**
 * Get all blog post slugs (for sitemap generation)
 */
export async function getAllBlogSlugs(): Promise<{ slug: string; updatedAt: Date }[]> {
  const posts = await prisma.blogPost.findMany({
    where: { published: true },
    select: { slug: true, updatedAt: true },
    orderBy: { publishedAt: "desc" },
  });

  return posts;
}

/**
 * Get recent blog posts (for widgets/sidebar)
 */
export async function getRecentBlogPosts(
  limit: number = 5,
  language: string = "en"
): Promise<BlogPostListItem[]> {
  const posts = await prisma.blogPost.findMany({
    where: { published: true, language },
    take: limit,
    orderBy: { publishedAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      featuredImage: true,
      metaTitle: true,
      metaDescription: true,
      category: true,
      tags: true,
      language: true,
      source: true,
      published: true,
      publishedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return posts;
}

/**
 * Get blog post categories with counts
 */
export async function getBlogCategories(): Promise<{ category: string; count: number }[]> {
  const posts = await prisma.blogPost.groupBy({
    by: ["category"],
    where: { published: true, category: { not: null } },
    _count: { category: true },
    orderBy: { _count: { category: "desc" } },
  });

  return posts
    .filter((p) => p.category)
    .map((p) => ({
      category: p.category!,
      count: p._count.category,
    }));
}

/**
 * Get all unique blog tags
 */
export async function getBlogTags(): Promise<string[]> {
  const posts = await prisma.blogPost.findMany({
    where: { published: true },
    select: { tags: true },
  });

  const tagSet = new Set<string>();
  posts.forEach((post) => {
    post.tags.forEach((tag) => tagSet.add(tag));
  });

  return Array.from(tagSet).sort();
}

/**
 * Check if a blog post was already created today (idempotency)
 */
export async function hasBlogPostToday(source: string = "autoblog"): Promise<boolean> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const count = await prisma.blogPost.count({
    where: {
      source,
      createdAt: {
        gte: today,
        lt: tomorrow,
      },
    },
  });

  return count > 0;
}

/**
 * Get blog post count by source
 */
export async function getBlogPostStats(): Promise<{
  total: number;
  published: number;
  bySource: { source: string | null; count: number }[];
}> {
  const [total, published, bySource] = await Promise.all([
    prisma.blogPost.count(),
    prisma.blogPost.count({ where: { published: true } }),
    prisma.blogPost.groupBy({
      by: ["source"],
      _count: { source: true },
    }),
  ]);

  return {
    total,
    published,
    bySource: bySource.map((s) => ({
      source: s.source,
      count: s._count.source,
    })),
  };
}

/**
 * Get related blog posts (same category or overlapping tags)
 */
export async function getRelatedBlogPosts(
  slug: string,
  limit: number = 4
): Promise<BlogPostListItem[]> {
  // First get the current post
  const currentPost = await prisma.blogPost.findUnique({
    where: { slug },
    select: { id: true, category: true, tags: true, language: true },
  });

  if (!currentPost) return [];

  const where: any = {
    published: true,
    id: { not: currentPost.id },
    language: currentPost.language,
    OR: [],
  };

  // Match by category
  if (currentPost.category) {
    where.OR.push({ category: currentPost.category });
  }

  // Match by tags (if any)
  if (currentPost.tags.length > 0) {
    where.OR.push({ tags: { hasSome: currentPost.tags } });
  }

  // If no filters, just get recent posts
  if (where.OR.length === 0) {
    delete where.OR;
  }

  const posts = await prisma.blogPost.findMany({
    where,
    take: limit,
    orderBy: { publishedAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      featuredImage: true,
      metaTitle: true,
      metaDescription: true,
      category: true,
      tags: true,
      language: true,
      source: true,
      published: true,
      publishedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return posts;
}

// ============================================================
// Phase 9 Agent Read Functions (operator-facing, L0-safe)
// Added 2026-04-10 — audit: docs/phase9-seo-audit.md
// All functions take adminId as the first parameter for the
// future audit log (Prompt 3 will introduce ai_admin_audit_log).
// adminId is currently unused inside the function body — it is
// a forward-compatible parameter so the agent tool layer can
// pass it through without a signature change later.
// All functions are pure reads with defensive null handling.
// ============================================================

// --- Types ---

export interface QualityIssue {
  severity: "critical" | "warning" | "info";
  code: string;
  message: string;
}

export interface BlogPostAudit {
  postId: number;
  slug: string;
  title: string;
  published: boolean;
  publishedAt: Date | null;
  metrics: {
    titleLength: number;
    metaDescriptionLength: number;
    contentWordCount: number;
    h2Count: number;
    internalLinkCount: number;
    imageReferenceCount: number;
    hasEmbedding: boolean;
  };
  issues: QualityIssue[];
  score: number;
}

export interface ContentGap {
  vertical: string;
  suggestedTopic: string;
  reason: string;
  similarExistingPosts: number[];
}

export interface OrphanPost {
  postId: number;
  slug: string;
  title: string;
  publishedAt: Date | null;
}

export interface SimilarPost {
  postId: number;
  slug: string;
  title: string;
  similarity: number;
}

export interface BlogStats {
  total: number;
  publishedLast7Days: number;
  publishedLast30Days: number;
  avgWordCount: number;
  avgQualityScore: number;
  topTags: { tag: string; count: number }[];
  orphanCount: number;
  postsWithoutEmbedding: number;
}

export interface BlogDraftContext {
  topic: string;
  vertical: string | null;
  similarExistingPosts: { id: number; title: string; slug: string; excerpt: string | null }[];
  relevantTags: string[];
  recommendedWordCount: number;
  recommendedHeadingStructure: string[];
  forbiddenOverlap: { postId: number; slug: string; title: string; similarity: number }[];
}

// --- Internal helpers ---

function countWords(html: string | null | undefined): number {
  if (!html) return 0;
  const text = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  if (!text) return 0;
  return text.split(" ").filter((w) => w.length > 0).length;
}

function countH2Headings(html: string | null | undefined): number {
  if (!html) return 0;
  const matches = html.match(/<h2[\s>]/gi);
  return matches ? matches.length : 0;
}

function countInternalLinks(html: string | null | undefined): number {
  if (!html) return 0;
  // Count anchors whose href starts with "/" or "https://(www.)?storesgo.com"
  const matches = html.match(/<a[^>]+href=["'](\/|https?:\/\/(?:www\.)?storesgo\.com)/gi);
  return matches ? matches.length : 0;
}

function countImageReferences(html: string | null | undefined): number {
  if (!html) return 0;
  const matches = html.match(/<img[\s>]/gi);
  return matches ? matches.length : 0;
}

function classifyTitleLength(len: number): QualityIssue | null {
  if (len === 0) {
    return { severity: "critical", code: "title_empty", message: "Title is empty" };
  }
  if (len < 30) {
    return {
      severity: "warning",
      code: "title_short",
      message: `Title is ${len} chars (recommended 30-60)`,
    };
  }
  if (len > 60) {
    return {
      severity: "warning",
      code: "title_long",
      message: `Title is ${len} chars (recommended 30-60, search results truncate at ~60)`,
    };
  }
  return null;
}

function classifyMetaDescription(value: string | null | undefined): QualityIssue | null {
  if (!value) {
    return {
      severity: "critical",
      code: "meta_description_missing",
      message: "metaDescription is missing — search snippets will be auto-generated",
    };
  }
  const len = value.length;
  if (len < 120) {
    return {
      severity: "warning",
      code: "meta_description_short",
      message: `metaDescription is ${len} chars (recommended 120-160)`,
    };
  }
  if (len > 160) {
    return {
      severity: "warning",
      code: "meta_description_long",
      message: `metaDescription is ${len} chars (recommended 120-160, will be truncated)`,
    };
  }
  return null;
}

function scoreFromIssues(issues: QualityIssue[]): number {
  let score = 100;
  for (const issue of issues) {
    if (issue.severity === "critical") score -= 10;
    else if (issue.severity === "warning") score -= 5;
    else score -= 1;
  }
  return Math.max(0, Math.min(100, score));
}

// --- auditBlogPostForOperator ---

export async function auditBlogPostForOperator(
  _adminId: number,
  postId: number,
): Promise<BlogPostAudit | null> {
  const post = await prisma.blogPost.findUnique({
    where: { id: postId },
    select: {
      id: true,
      slug: true,
      title: true,
      contentHtml: true,
      metaDescription: true,
      published: true,
      publishedAt: true,
      embedding: true,
      tags: true,
    },
  });

  if (!post) return null;

  const titleLength = post.title?.length ?? 0;
  const metaDescriptionLength = post.metaDescription?.length ?? 0;
  const contentWordCount = countWords(post.contentHtml);
  const h2Count = countH2Headings(post.contentHtml);
  const internalLinkCount = countInternalLinks(post.contentHtml);
  const imageReferenceCount = countImageReferences(post.contentHtml);
  const hasEmbedding = Array.isArray(post.embedding) && post.embedding.length > 0;

  const issues: QualityIssue[] = [];

  const titleIssue = classifyTitleLength(titleLength);
  if (titleIssue) issues.push(titleIssue);

  const metaIssue = classifyMetaDescription(post.metaDescription);
  if (metaIssue) issues.push(metaIssue);

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
      message: `Content is ${contentWordCount} words (recommended 300+ for SEO weight)`,
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

  if (imageReferenceCount === 0 && contentWordCount > 200) {
    issues.push({
      severity: "info",
      code: "no_images",
      message: "Post has no <img> references — consider adding featured imagery",
    });
  }

  if (!post.publishedAt && post.published) {
    issues.push({
      severity: "warning",
      code: "published_at_missing",
      message: "Post is marked published but publishedAt is null",
    });
  }

  if (!hasEmbedding) {
    issues.push({
      severity: "info",
      code: "embedding_missing",
      message: "Post has no embedding vector — semantic similarity tools will skip it",
    });
  }

  return {
    postId: post.id,
    slug: post.slug,
    title: post.title,
    published: post.published,
    publishedAt: post.publishedAt,
    metrics: {
      titleLength,
      metaDescriptionLength,
      contentWordCount,
      h2Count,
      internalLinkCount,
      imageReferenceCount,
      hasEmbedding,
    },
    issues,
    score: scoreFromIssues(issues),
  };
}

// --- findContentGapsForVertical ---
//
// "Vertical" maps to BlogPost.category in the current schema.
// Mode: TAXONOMY-FALLBACK. The pgvector path is not implemented
// because BlogPost.embedding is Float[], not vector — see
// embeddings.util.ts header for the constraint. hasPgvector() is
// still consulted so future-you can branch on it.

export async function findContentGapsForVertical(
  _adminId: number,
  opts?: { vertical?: string; limit?: number },
): Promise<ContentGap[]> {
  const limit = Math.min(opts?.limit ?? 10, 50);

  const usingPgvector = await hasPgvector();
  void usingPgvector; // reserved for future optimized path

  const grouped = await prisma.blogPost.groupBy({
    by: ["category"],
    where: {
      published: true,
      category: { not: null },
      ...(opts?.vertical ? { category: opts.vertical } : {}),
    },
    _count: { category: true },
  });

  const thin = grouped
    .filter((g) => g.category && (g._count.category ?? 0) < 5)
    .map((g) => ({
      category: g.category as string,
      count: g._count.category ?? 0,
    }));

  if (thin.length === 0) return [];

  const gaps: ContentGap[] = [];
  for (const t of thin.slice(0, limit)) {
    const existing = await prisma.blogPost.findMany({
      where: { category: t.category, published: true },
      select: { id: true },
      orderBy: { publishedAt: "desc" },
      take: 3,
    });

    gaps.push({
      vertical: t.category,
      suggestedTopic: `Expand "${t.category}" coverage — only ${t.count} published post${t.count === 1 ? "" : "s"} so far`,
      reason: `Category has ${t.count} published post${t.count === 1 ? "" : "s"}, below the 5-post threshold for adequate vertical coverage`,
      similarExistingPosts: existing.map((e) => e.id),
    });
  }

  return gaps;
}

// --- findOrphanBlogPosts ---
//
// Inbound-link detection by string match against /blog/{slug}.
// Best-effort — see audit B12 risk #5.

export async function findOrphanBlogPosts(
  _adminId: number,
  opts?: { limit?: number },
): Promise<OrphanPost[]> {
  const limit = Math.min(opts?.limit ?? 20, 100);

  const allPosts = await prisma.blogPost.findMany({
    where: { published: true },
    select: { id: true, slug: true, title: true, publishedAt: true, contentHtml: true },
    orderBy: { publishedAt: "desc" },
  });

  const contentById = new Map<number, string>();
  for (const p of allPosts) {
    contentById.set(p.id, p.contentHtml ?? "");
  }

  const orphans: OrphanPost[] = [];
  for (const candidate of allPosts) {
    const needle = `/blog/${candidate.slug}`;
    let foundInbound = false;
    for (const [otherId, otherHtml] of contentById) {
      if (otherId === candidate.id) continue;
      if (otherHtml.includes(needle)) {
        foundInbound = true;
        break;
      }
    }
    if (!foundInbound) {
      orphans.push({
        postId: candidate.id,
        slug: candidate.slug,
        title: candidate.title,
        publishedAt: candidate.publishedAt,
      });
      if (orphans.length >= limit) break;
    }
  }

  return orphans;
}

// --- findSimilarBlogPosts ---
//
// In-process cosine similarity over BlogPost.embedding (Float[]).
// Returns null if the source post does not exist; returns [] if
// the source post has no embedding so the agent tool can fall
// back to getRelatedBlogPosts.

export async function findSimilarBlogPosts(
  _adminId: number,
  postId: number,
  opts?: { limit?: number; threshold?: number },
): Promise<SimilarPost[] | null> {
  const limit = Math.min(opts?.limit ?? 5, 20);
  const threshold = opts?.threshold ?? 0.7;

  const source = await prisma.blogPost.findUnique({
    where: { id: postId },
    select: { id: true, embedding: true, language: true },
  });

  if (!source) return null;

  const sourceEmbedding = normalizeEmbedding(source.embedding);
  if (!sourceEmbedding) return [];

  const candidates = await prisma.blogPost.findMany({
    where: {
      published: true,
      id: { not: postId },
      ...(source.language ? { language: source.language } : {}),
    },
    select: { id: true, slug: true, title: true, embedding: true },
  });

  const scored: SimilarPost[] = [];
  for (const c of candidates) {
    const candEmbedding = normalizeEmbedding(c.embedding);
    if (!candEmbedding) continue;
    const sim = cosineSimilarity(sourceEmbedding, candEmbedding);
    if (sim >= threshold) {
      scored.push({
        postId: c.id,
        slug: c.slug,
        title: c.title,
        similarity: sim,
      });
    }
  }

  scored.sort((a, b) => b.similarity - a.similarity);
  return scored.slice(0, limit);
}

// --- getBlogStatsForOperator ---

export async function getBlogStatsForOperator(
  _adminId: number,
  opts?: { sinceDays?: number },
): Promise<BlogStats> {
  const days = Math.min(opts?.sinceDays ?? 90, 365);
  void days; // reserved for windowed metrics in a follow-up

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [total, last7, last30, samples] = await Promise.all([
    prisma.blogPost.count({ where: { published: true } }),
    prisma.blogPost.count({
      where: { published: true, publishedAt: { gte: sevenDaysAgo } },
    }),
    prisma.blogPost.count({
      where: { published: true, publishedAt: { gte: thirtyDaysAgo } },
    }),
    prisma.blogPost.findMany({
      where: { published: true },
      select: { contentHtml: true, embedding: true, tags: true },
      take: 100,
      orderBy: { publishedAt: "desc" },
    }),
  ]);

  let totalWords = 0;
  let withoutEmbedding = 0;
  const tagCounts = new Map<string, number>();
  for (const s of samples) {
    totalWords += countWords(s.contentHtml);
    const emb = normalizeEmbedding(s.embedding);
    if (!emb) withoutEmbedding++;
    for (const tag of s.tags ?? []) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    }
  }
  const avgWordCount = samples.length > 0 ? Math.round(totalWords / samples.length) : 0;

  let avgQualityScore = 0;
  if (samples.length > 0) {
    avgQualityScore = Math.round(
      Math.max(0, Math.min(100, 80 + Math.max(0, (avgWordCount - 200) / 200) * 5)),
    );
  }

  const topTags = Array.from(tagCounts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const orphans = await findOrphanBlogPosts(_adminId, { limit: 100 });

  return {
    total,
    publishedLast7Days: last7,
    publishedLast30Days: last30,
    avgWordCount,
    avgQualityScore,
    topTags,
    orphanCount: orphans.length,
    postsWithoutEmbedding: withoutEmbedding,
  };
}

// --- loadBlogPostContextForDrafting ---
//
// Operator-facing equivalent of Phase 11's loadReviewForDrafting.
// Returns context only — the LLM composes the actual outline in
// its user-facing reply. Nothing is persisted.

export async function loadBlogPostContextForDrafting(
  _adminId: number,
  opts: { topic: string; vertical?: string; referencePostIds?: number[] },
): Promise<BlogDraftContext> {
  const topic = opts.topic.trim();
  const vertical = opts.vertical?.trim() || null;

  const candidates = await prisma.blogPost.findMany({
    where: {
      published: true,
      ...(vertical ? { category: vertical } : {}),
    },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      tags: true,
      embedding: true,
    },
    orderBy: { publishedAt: "desc" },
    take: 50,
  });

  let anchorEmbeddings: number[][] = [];
  if (opts.referencePostIds && opts.referencePostIds.length > 0) {
    const refs = await prisma.blogPost.findMany({
      where: { id: { in: opts.referencePostIds } },
      select: { embedding: true },
    });
    anchorEmbeddings = refs
      .map((r) => normalizeEmbedding(r.embedding))
      .filter((e): e is number[] => e !== null);
  }

  const scored = candidates
    .map((c) => {
      const cEmb = normalizeEmbedding(c.embedding);
      if (!cEmb || anchorEmbeddings.length === 0) {
        return { ...c, similarity: 0 };
      }
      let maxSim = 0;
      for (const a of anchorEmbeddings) {
        const sim = cosineSimilarity(a, cEmb);
        if (sim > maxSim) maxSim = sim;
      }
      return { ...c, similarity: maxSim };
    })
    .sort((a, b) => b.similarity - a.similarity);

  const similarExistingPosts = scored
    .filter((s) => s.similarity > 0)
    .slice(0, 5)
    .map((s) => ({ id: s.id, title: s.title, slug: s.slug, excerpt: s.excerpt }));

  const fallbackPosts =
    similarExistingPosts.length === 0
      ? scored.slice(0, 5).map((s) => ({
          id: s.id,
          title: s.title,
          slug: s.slug,
          excerpt: s.excerpt,
        }))
      : similarExistingPosts;

  const forbiddenOverlap = scored
    .filter((s) => s.similarity > 0.85)
    .map((s) => ({
      postId: s.id,
      slug: s.slug,
      title: s.title,
      similarity: s.similarity,
    }));

  const tagCounts = new Map<string, number>();
  for (const c of candidates) {
    for (const tag of c.tags ?? []) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    }
  }
  const relevantTags = Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([tag]) => tag);

  return {
    topic,
    vertical,
    similarExistingPosts: fallbackPosts,
    relevantTags,
    recommendedWordCount: 800,
    recommendedHeadingStructure: [
      "H1: Title (set by post.title)",
      "H2: Introduction — hook + what the reader will learn",
      "H2: 3-5 main sections, each with a focused subtopic",
      "H2: Conclusion — recap + call to action / internal link",
    ],
    forbiddenOverlap,
  };
}

