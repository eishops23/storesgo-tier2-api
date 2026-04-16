// Phase 9 — blog.service.ts agent read function tests
// Tests live in their own file (not the existing blog.service.test.ts)
// so they can be removed cleanly if a future phase refactors.

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../plugins/prisma.js", () => {
  const mockPrisma = {
    blogPost: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
    },
  };
  return { prisma: mockPrisma };
});

vi.mock("../embeddings.util.js", async (importOriginal) => {
  // Use the real cosineSimilarity / normalizeEmbedding so the math
  // is exercised end to end. Mock only hasPgvector so it doesn't
  // hit the database during unit tests.
  const actual = await importOriginal<typeof import("../embeddings.util.js")>();
  return {
    ...actual,
    hasPgvector: vi.fn(() => Promise.resolve(false)),
  };
});

import {
  auditBlogPostForOperator,
  findContentGapsForVertical,
  findOrphanBlogPosts,
  findSimilarBlogPosts,
  getBlogStatsForOperator,
  loadBlogPostContextForDrafting,
} from "../blog.service.js";
import { prisma } from "../../plugins/prisma.js";

const mockPrisma = vi.mocked(prisma);

beforeEach(() => {
  vi.clearAllMocks();
});

// =============================================================================
// auditBlogPostForOperator
// =============================================================================

describe("auditBlogPostForOperator", () => {
  it("returns null for nonexistent post", async () => {
    mockPrisma.blogPost.findUnique.mockResolvedValue(null);
    const result = await auditBlogPostForOperator(1, 999);
    expect(result).toBeNull();
  });

  it("returns score 100 for a clean post", async () => {
    const longContent =
      "<h2>Section</h2>" +
      ("word ".repeat(400)) +
      '<a href="/blog/other">link 1</a><a href="/page">link 2</a>' +
      "<img src=\"x\">";
    mockPrisma.blogPost.findUnique.mockResolvedValue({
      id: 1,
      slug: "great-post",
      title: "A Reasonable Length Title For Great SEO Coverage",
      contentHtml: longContent,
      metaDescription:
        "A meta description that is exactly between one hundred twenty and one hundred sixty characters in length, suitable for SEO snippet display in Google.",
      published: true,
      publishedAt: new Date(),
      embedding: [0.1, 0.2, 0.3],
      tags: [],
    } as any);

    const result = await auditBlogPostForOperator(1, 1);
    expect(result).not.toBeNull();
    expect(result!.score).toBe(100);
    expect(result!.issues).toHaveLength(0);
    expect(result!.metrics.h2Count).toBeGreaterThan(0);
    expect(result!.metrics.internalLinkCount).toBeGreaterThanOrEqual(2);
    expect(result!.metrics.imageReferenceCount).toBeGreaterThan(0);
    expect(result!.metrics.hasEmbedding).toBe(true);
  });

  it("flags short title (< 30 chars)", async () => {
    mockPrisma.blogPost.findUnique.mockResolvedValue({
      id: 1,
      slug: "x",
      title: "Short title",
      contentHtml: "<h2>X</h2>" + "word ".repeat(400),
      metaDescription: "A".repeat(140),
      published: true,
      publishedAt: new Date(),
      embedding: [0.1],
      tags: [],
    } as any);

    const result = await auditBlogPostForOperator(1, 1);
    expect(result!.issues.some((i) => i.code === "title_short")).toBe(true);
    expect(result!.score).toBeLessThan(100);
  });

  it("flags long title (> 60 chars)", async () => {
    mockPrisma.blogPost.findUnique.mockResolvedValue({
      id: 1,
      slug: "x",
      title: "A".repeat(80),
      contentHtml: "<h2>X</h2>" + "word ".repeat(400),
      metaDescription: "A".repeat(140),
      published: true,
      publishedAt: new Date(),
      embedding: [0.1],
      tags: [],
    } as any);
    const result = await auditBlogPostForOperator(1, 1);
    expect(result!.issues.some((i) => i.code === "title_long")).toBe(true);
  });

  it("flags missing metaDescription as critical", async () => {
    mockPrisma.blogPost.findUnique.mockResolvedValue({
      id: 1,
      slug: "x",
      title: "A reasonable forty character title for X here",
      contentHtml: "<h2>X</h2>" + "word ".repeat(400),
      metaDescription: null,
      published: true,
      publishedAt: new Date(),
      embedding: [0.1],
      tags: [],
    } as any);
    const result = await auditBlogPostForOperator(1, 1);
    const meta = result!.issues.find((i) => i.code === "meta_description_missing");
    expect(meta).toBeDefined();
    expect(meta!.severity).toBe("critical");
  });

  it("flags short content (< 300 words)", async () => {
    mockPrisma.blogPost.findUnique.mockResolvedValue({
      id: 1,
      slug: "x",
      title: "A reasonable forty character title for X here",
      contentHtml: "<p>" + "word ".repeat(50) + "</p>",
      metaDescription: "A".repeat(140),
      published: true,
      publishedAt: new Date(),
      embedding: [0.1],
      tags: [],
    } as any);
    const result = await auditBlogPostForOperator(1, 1);
    expect(result!.issues.some((i) => i.code === "content_short")).toBe(true);
  });

  it("flags missing h2 sections", async () => {
    mockPrisma.blogPost.findUnique.mockResolvedValue({
      id: 1,
      slug: "x",
      title: "A reasonable forty character title for X here",
      contentHtml: "<p>" + "word ".repeat(400) + "</p>",
      metaDescription: "A".repeat(140),
      published: true,
      publishedAt: new Date(),
      embedding: [0.1],
      tags: [],
    } as any);
    const result = await auditBlogPostForOperator(1, 1);
    expect(result!.issues.some((i) => i.code === "no_h2_headings")).toBe(true);
  });

  it("flags missing embedding as info severity", async () => {
    mockPrisma.blogPost.findUnique.mockResolvedValue({
      id: 1,
      slug: "x",
      title: "A reasonable forty character title for X here",
      contentHtml: "<h2>X</h2>" + "word ".repeat(400),
      metaDescription: "A".repeat(140),
      published: true,
      publishedAt: new Date(),
      embedding: null,
      tags: [],
    } as any);
    const result = await auditBlogPostForOperator(1, 1);
    const emb = result!.issues.find((i) => i.code === "embedding_missing");
    expect(emb).toBeDefined();
    expect(emb!.severity).toBe("info");
  });

  it("flags many issues and keeps score non-negative for a disastrous post", async () => {
    // Empty title, null content, null meta, null embedding, published-without-date.
    // The function should surface multiple issues and the score must be
    // both low AND clamped >= 0 (the clamp is a hard guarantee).
    mockPrisma.blogPost.findUnique.mockResolvedValue({
      id: 1,
      slug: "x",
      title: "",
      contentHtml: null,
      metaDescription: null,
      published: true,
      publishedAt: null,
      embedding: null,
      tags: [],
    } as any);
    const result = await auditBlogPostForOperator(1, 1);
    expect(result!.issues.length).toBeGreaterThanOrEqual(4);
    expect(result!.issues.some((i) => i.severity === "critical")).toBe(true);
    expect(result!.score).toBeLessThan(70);
    expect(result!.score).toBeGreaterThanOrEqual(0);
  });
});

// =============================================================================
// findContentGapsForVertical
// =============================================================================

describe("findContentGapsForVertical", () => {
  it("returns empty array when all categories are saturated", async () => {
    mockPrisma.blogPost.groupBy.mockResolvedValue([
      { category: "haitian", _count: { category: 12 } },
      { category: "caribbean", _count: { category: 20 } },
    ] as any);

    const result = await findContentGapsForVertical(1);
    expect(result).toEqual([]);
  });

  it("returns gaps when a category has < 5 posts", async () => {
    mockPrisma.blogPost.groupBy.mockResolvedValue([
      { category: "haitian", _count: { category: 12 } },
      { category: "korean", _count: { category: 2 } },
    ] as any);
    mockPrisma.blogPost.findMany.mockResolvedValue([{ id: 100 }, { id: 101 }] as any);

    const result = await findContentGapsForVertical(1);
    expect(result).toHaveLength(1);
    expect(result[0].vertical).toBe("korean");
    expect(result[0].similarExistingPosts).toEqual([100, 101]);
    expect(result[0].suggestedTopic).toContain("korean");
  });

  it("respects vertical filter when provided", async () => {
    mockPrisma.blogPost.groupBy.mockResolvedValue([
      { category: "korean", _count: { category: 1 } },
    ] as any);
    mockPrisma.blogPost.findMany.mockResolvedValue([] as any);

    await findContentGapsForVertical(1, { vertical: "korean" });
    const call = mockPrisma.blogPost.groupBy.mock.calls[0][0] as any;
    expect(call.where.category).toBe("korean");
  });
});

// =============================================================================
// findOrphanBlogPosts
// =============================================================================

describe("findOrphanBlogPosts", () => {
  it("returns posts with no inbound links", async () => {
    mockPrisma.blogPost.findMany.mockResolvedValue([
      { id: 1, slug: "alpha", title: "Alpha", publishedAt: new Date(), contentHtml: "<a href=\"/blog/beta\">link</a>" },
      { id: 2, slug: "beta", title: "Beta", publishedAt: new Date(), contentHtml: "no links here" },
      { id: 3, slug: "gamma", title: "Gamma", publishedAt: new Date(), contentHtml: "no links here either" },
    ] as any);

    const result = await findOrphanBlogPosts(1);
    // alpha is orphan (nothing links to /blog/alpha)
    // beta is NOT orphan (alpha links to /blog/beta)
    // gamma is orphan (nothing links to /blog/gamma)
    expect(result.map((r) => r.slug).sort()).toEqual(["alpha", "gamma"]);
  });

  it("does not flag self-references", async () => {
    mockPrisma.blogPost.findMany.mockResolvedValue([
      {
        id: 1,
        slug: "alpha",
        title: "Alpha",
        publishedAt: new Date(),
        // alpha references itself but that should not count
        contentHtml: '<a href="/blog/alpha">self</a>',
      },
    ] as any);

    const result = await findOrphanBlogPosts(1);
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe("alpha");
  });

  it("respects limit", async () => {
    const posts = Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      slug: `post-${i}`,
      title: `Post ${i}`,
      publishedAt: new Date(),
      contentHtml: "no links",
    }));
    mockPrisma.blogPost.findMany.mockResolvedValue(posts as any);

    const result = await findOrphanBlogPosts(1, { limit: 5 });
    expect(result).toHaveLength(5);
  });

  it("returns empty when every post has at least one inbound link", async () => {
    mockPrisma.blogPost.findMany.mockResolvedValue([
      { id: 1, slug: "a", title: "A", publishedAt: new Date(), contentHtml: '<a href="/blog/b">link</a>' },
      { id: 2, slug: "b", title: "B", publishedAt: new Date(), contentHtml: '<a href="/blog/a">link</a>' },
    ] as any);
    const result = await findOrphanBlogPosts(1);
    expect(result).toEqual([]);
  });
});

// =============================================================================
// findSimilarBlogPosts
// =============================================================================

describe("findSimilarBlogPosts", () => {
  it("returns null for nonexistent post", async () => {
    mockPrisma.blogPost.findUnique.mockResolvedValue(null);
    const result = await findSimilarBlogPosts(1, 999);
    expect(result).toBeNull();
  });

  it("returns empty array when source post has no embedding", async () => {
    mockPrisma.blogPost.findUnique.mockResolvedValue({
      id: 1,
      embedding: null,
      language: "en",
    } as any);
    const result = await findSimilarBlogPosts(1, 1);
    expect(result).toEqual([]);
  });

  it("returns similarity-sorted results above threshold", async () => {
    mockPrisma.blogPost.findUnique.mockResolvedValue({
      id: 1,
      embedding: [1, 0, 0],
      language: "en",
    } as any);
    mockPrisma.blogPost.findMany.mockResolvedValue([
      { id: 2, slug: "b", title: "B", embedding: [1, 0, 0] }, // sim=1.0
      { id: 3, slug: "c", title: "C", embedding: [0.9, 0.1, 0] }, // sim≈0.99
      { id: 4, slug: "d", title: "D", embedding: [0, 1, 0] }, // sim=0
    ] as any);

    const result = await findSimilarBlogPosts(1, 1, { threshold: 0.7 });
    expect(result).not.toBeNull();
    expect(result!.length).toBe(2);
    expect(result![0].postId).toBe(2);
    expect(result![0].similarity).toBeCloseTo(1.0, 5);
    expect(result![1].postId).toBe(3);
  });

  it("respects limit", async () => {
    mockPrisma.blogPost.findUnique.mockResolvedValue({
      id: 1,
      embedding: [1, 0, 0],
      language: "en",
    } as any);
    mockPrisma.blogPost.findMany.mockResolvedValue([
      { id: 2, slug: "b", title: "B", embedding: [1, 0, 0] },
      { id: 3, slug: "c", title: "C", embedding: [1, 0, 0] },
      { id: 4, slug: "d", title: "D", embedding: [1, 0, 0] },
    ] as any);

    const result = await findSimilarBlogPosts(1, 1, { limit: 2 });
    expect(result).toHaveLength(2);
  });
});

// =============================================================================
// getBlogStatsForOperator
// =============================================================================

describe("getBlogStatsForOperator", () => {
  it("computes totals and tag aggregation", async () => {
    mockPrisma.blogPost.count
      .mockResolvedValueOnce(632) // total
      .mockResolvedValueOnce(7) // last7
      .mockResolvedValueOnce(30); // last30
    mockPrisma.blogPost.findMany
      // First findMany call: stats sample
      .mockResolvedValueOnce([
        { contentHtml: "word ".repeat(500), embedding: [0.1], tags: ["caribbean", "haitian"] },
        { contentHtml: "word ".repeat(300), embedding: [0.2], tags: ["caribbean"] },
      ] as any)
      // Second findMany call: from findOrphanBlogPosts (called inside)
      .mockResolvedValueOnce([] as any);

    const stats = await getBlogStatsForOperator(1);
    expect(stats.total).toBe(632);
    expect(stats.publishedLast7Days).toBe(7);
    expect(stats.publishedLast30Days).toBe(30);
    expect(stats.avgWordCount).toBeGreaterThan(0);
    expect(stats.topTags[0].tag).toBe("caribbean");
    expect(stats.topTags[0].count).toBe(2);
    expect(stats.postsWithoutEmbedding).toBe(0);
  });

  it("returns empty topTags when no posts have tags", async () => {
    mockPrisma.blogPost.count.mockResolvedValue(0);
    mockPrisma.blogPost.findMany
      .mockResolvedValueOnce([] as any)
      .mockResolvedValueOnce([] as any);

    const stats = await getBlogStatsForOperator(1);
    expect(stats.topTags).toEqual([]);
    expect(stats.avgWordCount).toBe(0);
  });
});

// =============================================================================
// loadBlogPostContextForDrafting
// =============================================================================

describe("loadBlogPostContextForDrafting", () => {
  it("returns the expected context shape", async () => {
    mockPrisma.blogPost.findMany.mockResolvedValueOnce([
      {
        id: 1,
        title: "Existing post",
        slug: "existing-post",
        excerpt: "About things",
        tags: ["food", "haiti"],
        embedding: [0.1, 0.2],
      },
    ] as any);

    const ctx = await loadBlogPostContextForDrafting(1, {
      topic: "Best Haitian breakfast dishes",
      vertical: "haitian",
    });

    expect(ctx.topic).toBe("Best Haitian breakfast dishes");
    expect(ctx.vertical).toBe("haitian");
    expect(ctx.recommendedWordCount).toBe(800);
    expect(ctx.recommendedHeadingStructure.length).toBeGreaterThan(0);
    expect(ctx.relevantTags).toContain("food");
    // No anchor refs → similarity stays 0 → fallback path returns recent posts
    expect(ctx.similarExistingPosts).toHaveLength(1);
    expect(ctx.similarExistingPosts[0].slug).toBe("existing-post");
    expect(ctx.forbiddenOverlap).toEqual([]);
  });

  it("populates forbiddenOverlap for near-duplicates above 0.85", async () => {
    mockPrisma.blogPost.findMany
      // First call: candidates
      .mockResolvedValueOnce([
        { id: 1, title: "Near dup", slug: "near-dup", excerpt: null, tags: [], embedding: [1, 0, 0] },
        { id: 2, title: "Different", slug: "diff", excerpt: null, tags: [], embedding: [0, 1, 0] },
      ] as any)
      // Second call: anchor reference embeddings
      .mockResolvedValueOnce([{ embedding: [1, 0, 0] }] as any);

    const ctx = await loadBlogPostContextForDrafting(1, {
      topic: "X",
      referencePostIds: [42],
    });

    expect(ctx.forbiddenOverlap.length).toBeGreaterThan(0);
    expect(ctx.forbiddenOverlap[0].postId).toBe(1);
    expect(ctx.forbiddenOverlap[0].similarity).toBeCloseTo(1.0, 5);
  });
});
