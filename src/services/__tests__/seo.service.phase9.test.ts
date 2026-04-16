// Phase 9 — seo.service.ts agent read function tests

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../plugins/prisma.js", () => {
  const mockPrisma = {
    seoPage: {
      findUnique: vi.fn(),
    },
  };
  return { prisma: mockPrisma };
});

import { auditSeoPageForOperator } from "../seo.service.js";
import { prisma } from "../../plugins/prisma.js";

const mockPrisma = vi.mocked(prisma);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("auditSeoPageForOperator", () => {
  it("returns null for nonexistent page", async () => {
    mockPrisma.seoPage.findUnique.mockResolvedValue(null);
    const result = await auditSeoPageForOperator(1, 999);
    expect(result).toBeNull();
  });

  it("flags missing embedding as warning (not critical)", async () => {
    // Prod has 0/633 SeoPage embeddings populated. Critical severity
    // would mass-flag every row. This test guards the severity choice.
    mockPrisma.seoPage.findUnique.mockResolvedValue({
      id: 1,
      type: "guide",
      slug: "x",
      title: "A reasonable forty character title for X here",
      metaTitle: "Meta title",
      metaDescription: "A".repeat(140),
      contentHtml: "<h2>X</h2>" + "word ".repeat(400) + '<a href="/a">l1</a><a href="/b">l2</a>',
      published: true,
      publishedAt: new Date(),
      embedding: [],
    } as any);

    const result = await auditSeoPageForOperator(1, 1);
    expect(result).not.toBeNull();
    const emb = result!.issues.find((i) => i.code === "embedding_missing");
    expect(emb).toBeDefined();
    expect(emb!.severity).toBe("warning");
  });

  it("returns score 100 for a clean page (with embedding)", async () => {
    mockPrisma.seoPage.findUnique.mockResolvedValue({
      id: 1,
      type: "guide",
      slug: "x",
      title: "A reasonable forty character title for X here",
      metaTitle: "Meta title",
      metaDescription:
        "A meta description that is exactly between one hundred twenty and one hundred sixty characters in length, suitable for SEO snippets.",
      contentHtml:
        "<h2>X</h2>" + "word ".repeat(400) + '<a href="/a">l1</a><a href="/b">l2</a>',
      published: true,
      publishedAt: new Date(),
      embedding: [0.1, 0.2],
    } as any);

    const result = await auditSeoPageForOperator(1, 1);
    expect(result!.score).toBe(100);
    expect(result!.issues).toHaveLength(0);
  });

  it("flags critical missing meta description", async () => {
    mockPrisma.seoPage.findUnique.mockResolvedValue({
      id: 1,
      type: "page",
      slug: "x",
      title: "A reasonable forty character title for X here",
      metaTitle: "Meta",
      metaDescription: null,
      contentHtml: "<h2>X</h2>" + "word ".repeat(400),
      published: true,
      publishedAt: new Date(),
      embedding: [0.1],
    } as any);
    const result = await auditSeoPageForOperator(1, 1);
    const meta = result!.issues.find((i) => i.code === "meta_description_missing");
    expect(meta).toBeDefined();
    expect(meta!.severity).toBe("critical");
  });

  it("flags published page with missing publishedAt", async () => {
    mockPrisma.seoPage.findUnique.mockResolvedValue({
      id: 1,
      type: "page",
      slug: "x",
      title: "A reasonable forty character title for X here",
      metaTitle: "Meta title",
      metaDescription: "A".repeat(140),
      contentHtml: "<h2>X</h2>" + "word ".repeat(400),
      published: true,
      publishedAt: null,
      embedding: [0.1],
    } as any);
    const result = await auditSeoPageForOperator(1, 1);
    expect(result!.issues.some((i) => i.code === "published_at_missing")).toBe(true);
  });
});
