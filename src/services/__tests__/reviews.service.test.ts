import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock prisma before importing the service
vi.mock("../../lib/prisma.js", () => {
  const mockPrisma = {
    review: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn(),
      groupBy: vi.fn(),
    },
    product: {
      findUnique: vi.fn(),
    },
  };
  return { prisma: mockPrisma };
});

import {
  listReviewsForSeller,
  getReviewByIdForSeller,
  getReviewStatsForSeller,
  findReviewsNeedingResponse,
  loadReviewForDrafting,
} from "../reviews.service.js";
import { prisma } from "../../lib/prisma.js";

const mockPrisma = vi.mocked(prisma);

beforeEach(() => {
  vi.clearAllMocks();
});

// =============================================================================
// listReviewsForSeller
// =============================================================================

describe("listReviewsForSeller", () => {
  it("filters by sellerId", async () => {
    mockPrisma.review.findMany.mockResolvedValue([]);

    await listReviewsForSeller(42);

    expect(mockPrisma.review.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ sellerId: 42 }),
      }),
    );
  });

  it("defaults limit to 20", async () => {
    mockPrisma.review.findMany.mockResolvedValue([]);

    await listReviewsForSeller(1);

    expect(mockPrisma.review.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 20 }),
    );
  });

  it("respects custom limit", async () => {
    mockPrisma.review.findMany.mockResolvedValue([]);

    await listReviewsForSeller(1, { limit: 5 });

    expect(mockPrisma.review.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 5 }),
    );
  });

  it("clamps limit to 50 when caller asks for more", async () => {
    mockPrisma.review.findMany.mockResolvedValue([]);

    await listReviewsForSeller(1, { limit: 200 });

    expect(mockPrisma.review.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 50 }),
    );
  });

  it("filters by minRating and maxRating", async () => {
    mockPrisma.review.findMany.mockResolvedValue([]);

    await listReviewsForSeller(1, { minRating: 2, maxRating: 4 });

    expect(mockPrisma.review.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          sellerId: 1,
          rating: { gte: 2, lte: 4 },
        }),
      }),
    );
  });

  it("filters by sinceDays window", async () => {
    mockPrisma.review.findMany.mockResolvedValue([]);

    await listReviewsForSeller(1, { sinceDays: 7 });

    const call = mockPrisma.review.findMany.mock.calls[0][0] as any;
    expect(call.where.createdAt.gte).toBeInstanceOf(Date);
    const ageMs = Date.now() - call.where.createdAt.gte.getTime();
    // 7 days = 604_800_000 ms; allow generous slack for clock + test latency
    expect(ageMs).toBeGreaterThanOrEqual(7 * 24 * 60 * 60 * 1000 - 1000);
    expect(ageMs).toBeLessThanOrEqual(7 * 24 * 60 * 60 * 1000 + 1000);
  });

  it("returns empty array when no matching reviews", async () => {
    mockPrisma.review.findMany.mockResolvedValue([]);

    const result = await listReviewsForSeller(1);

    expect(result).toEqual([]);
  });

  it("excludes rows with NULL sellerId via the post-query defensive filter", async () => {
    mockPrisma.review.findMany.mockResolvedValue([
      {
        id: 1,
        userId: "u1",
        sellerId: 42,
        productId: 100,
        rating: 4,
        comment: "good",
        createdAt: new Date(),
        product: { id: 100, name: "Hot Sauce", imageUrl: null },
      },
      {
        id: 2,
        userId: "u2",
        sellerId: null, // legacy row that should never be returned
        productId: 101,
        rating: 5,
        comment: "amazing",
        createdAt: new Date(),
        product: { id: 101, name: "Plantains", imageUrl: null },
      },
      {
        id: 3,
        userId: "u3",
        sellerId: 99, // different seller — should never be returned
        productId: 102,
        rating: 3,
        comment: "ok",
        createdAt: new Date(),
        product: { id: 102, name: "Yams", imageUrl: null },
      },
    ] as any);

    const result = await listReviewsForSeller(42);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(1);
    expect(result[0].sellerId).toBe(42);
  });
});

// =============================================================================
// getReviewByIdForSeller
// =============================================================================

describe("getReviewByIdForSeller", () => {
  it("returns the review when sellerId matches", async () => {
    mockPrisma.review.findUnique.mockResolvedValue({
      id: 7,
      userId: "u1",
      sellerId: 42,
      productId: 100,
      rating: 5,
      comment: "great",
      createdAt: new Date(),
    } as any);

    const result = await getReviewByIdForSeller(42, 7);

    expect(result).not.toBeNull();
    expect(result?.id).toBe(7);
    expect(result?.sellerId).toBe(42);
  });

  it("returns null when sellerId does NOT match (ownership check)", async () => {
    mockPrisma.review.findUnique.mockResolvedValue({
      id: 7,
      userId: "u1",
      sellerId: 99, // belongs to a different seller
      productId: 100,
      rating: 5,
      comment: "great",
      createdAt: new Date(),
    } as any);

    const result = await getReviewByIdForSeller(42, 7);

    expect(result).toBeNull();
  });

  it("returns null for nonexistent reviewId", async () => {
    mockPrisma.review.findUnique.mockResolvedValue(null);

    const result = await getReviewByIdForSeller(42, 999);

    expect(result).toBeNull();
  });

  it("returns null when stored review has NULL sellerId", async () => {
    mockPrisma.review.findUnique.mockResolvedValue({
      id: 7,
      userId: "u1",
      sellerId: null,
      productId: 100,
      rating: 5,
      comment: "legacy",
      createdAt: new Date(),
    } as any);

    const result = await getReviewByIdForSeller(42, 7);

    expect(result).toBeNull();
  });
});

// =============================================================================
// getReviewStatsForSeller
// =============================================================================

describe("getReviewStatsForSeller", () => {
  it("computes totalReviews, avgRating, and ratingDistribution", async () => {
    mockPrisma.review.count
      .mockResolvedValueOnce(10) // total
      .mockResolvedValueOnce(3); // needingResponseCount
    mockPrisma.review.aggregate.mockResolvedValue({
      _avg: { rating: 4.2 },
    } as any);
    mockPrisma.review.groupBy.mockResolvedValue([
      { rating: 5, _count: { rating: 6 } },
      { rating: 4, _count: { rating: 1 } },
      { rating: 3, _count: { rating: 1 } },
      { rating: 1, _count: { rating: 2 } },
    ] as any);

    const stats = await getReviewStatsForSeller(42);

    expect(stats.totalReviews).toBe(10);
    expect(stats.avgRating).toBe(4.2);
    expect(stats.ratingDistribution).toEqual({
      1: 2,
      2: 0,
      3: 1,
      4: 1,
      5: 6,
    });
    expect(stats.needingResponseCount).toBe(3);
  });

  it("scopes to sinceDays window and clamps to 365", async () => {
    mockPrisma.review.count.mockResolvedValue(0);
    mockPrisma.review.aggregate.mockResolvedValue({
      _avg: { rating: null },
    } as any);
    mockPrisma.review.groupBy.mockResolvedValue([] as any);

    await getReviewStatsForSeller(42, 9999);

    const call = mockPrisma.review.count.mock.calls[0][0] as any;
    expect(call.where.sellerId).toBe(42);
    const ageMs = Date.now() - call.where.createdAt.gte.getTime();
    // Should be clamped to 365 days, not 9999
    expect(ageMs).toBeLessThanOrEqual(365 * 24 * 60 * 60 * 1000 + 1000);
    expect(ageMs).toBeGreaterThanOrEqual(365 * 24 * 60 * 60 * 1000 - 1000);
  });

  it("defaults sinceDays to 90", async () => {
    mockPrisma.review.count.mockResolvedValue(0);
    mockPrisma.review.aggregate.mockResolvedValue({
      _avg: { rating: null },
    } as any);
    mockPrisma.review.groupBy.mockResolvedValue([] as any);

    await getReviewStatsForSeller(42);

    const call = mockPrisma.review.count.mock.calls[0][0] as any;
    const ageMs = Date.now() - call.where.createdAt.gte.getTime();
    expect(ageMs).toBeLessThanOrEqual(90 * 24 * 60 * 60 * 1000 + 1000);
    expect(ageMs).toBeGreaterThanOrEqual(90 * 24 * 60 * 60 * 1000 - 1000);
  });

  it("returns avgRating as 0 when no reviews", async () => {
    mockPrisma.review.count.mockResolvedValue(0);
    mockPrisma.review.aggregate.mockResolvedValue({
      _avg: { rating: null },
    } as any);
    mockPrisma.review.groupBy.mockResolvedValue([] as any);

    const stats = await getReviewStatsForSeller(42);

    expect(stats.avgRating).toBe(0);
    expect(stats.totalReviews).toBe(0);
  });
});

// =============================================================================
// findReviewsNeedingResponse
// =============================================================================

describe("findReviewsNeedingResponse", () => {
  it("defaults to rating <= 3, sinceDays = 30, limit = 20", async () => {
    mockPrisma.review.findMany.mockResolvedValue([]);

    await findReviewsNeedingResponse(42);

    const call = mockPrisma.review.findMany.mock.calls[0][0] as any;
    expect(call.where.sellerId).toBe(42);
    expect(call.where.rating).toEqual({ lte: 3 });
    expect(call.take).toBe(20);
    const ageMs = Date.now() - call.where.createdAt.gte.getTime();
    expect(ageMs).toBeLessThanOrEqual(30 * 24 * 60 * 60 * 1000 + 1000);
    expect(ageMs).toBeGreaterThanOrEqual(30 * 24 * 60 * 60 * 1000 - 1000);
  });

  it("respects custom ratingThreshold", async () => {
    mockPrisma.review.findMany.mockResolvedValue([]);

    await findReviewsNeedingResponse(42, { ratingThreshold: 2 });

    const call = mockPrisma.review.findMany.mock.calls[0][0] as any;
    expect(call.where.rating).toEqual({ lte: 2 });
  });

  it("excludes rows with mismatched or NULL sellerId via defensive filter", async () => {
    mockPrisma.review.findMany.mockResolvedValue([
      {
        id: 1,
        userId: "u1",
        sellerId: 42,
        productId: 100,
        rating: 1,
        comment: "bad",
        createdAt: new Date(),
        product: { id: 100, name: "X", imageUrl: null },
      },
      {
        id: 2,
        userId: "u2",
        sellerId: null,
        productId: 101,
        rating: 1,
        comment: "legacy",
        createdAt: new Date(),
        product: { id: 101, name: "Y", imageUrl: null },
      },
    ] as any);

    const result = await findReviewsNeedingResponse(42);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(1);
  });
});

// =============================================================================
// loadReviewForDrafting
// =============================================================================

describe("loadReviewForDrafting", () => {
  it("returns the expected drafting context shape", async () => {
    mockPrisma.review.findUnique.mockResolvedValue({
      id: 7,
      sellerId: 42,
      rating: 4,
      comment: "Mostly great but slow shipping",
      product: { name: "Caribbean Hot Sauce" },
      user: { buyerProfile: { firstName: "Alice" } },
    } as any);

    const result = await loadReviewForDrafting(42, 7);

    expect(result).toEqual({
      reviewId: 7,
      productName: "Caribbean Hot Sauce",
      customerFirstName: "Alice",
      rating: 4,
      originalComment: "Mostly great but slow shipping",
      suggestedToneNotes: "appreciative",
    });
  });

  it("returns null when not the seller's review", async () => {
    mockPrisma.review.findUnique.mockResolvedValue({
      id: 7,
      sellerId: 99,
      rating: 5,
      comment: "great",
      product: { name: "X" },
      user: { buyerProfile: { firstName: "Alice" } },
    } as any);

    const result = await loadReviewForDrafting(42, 7);

    expect(result).toBeNull();
  });

  it("returns null when review does not exist", async () => {
    mockPrisma.review.findUnique.mockResolvedValue(null);

    const result = await loadReviewForDrafting(42, 999);

    expect(result).toBeNull();
  });

  it("returns null when stored review has NULL sellerId", async () => {
    mockPrisma.review.findUnique.mockResolvedValue({
      id: 7,
      sellerId: null,
      rating: 5,
      comment: "legacy",
      product: { name: "X" },
      user: { buyerProfile: { firstName: "Alice" } },
    } as any);

    const result = await loadReviewForDrafting(42, 7);

    expect(result).toBeNull();
  });

  it("only surfaces customer FIRST name, never full name or email", async () => {
    mockPrisma.review.findUnique.mockResolvedValue({
      id: 7,
      sellerId: 42,
      rating: 5,
      comment: "perfect",
      product: { name: "Plantains" },
      user: {
        buyerProfile: { firstName: "Alice" },
        // Even if a buggy include surfaced lastName/email, the function
        // would not include them in its return value.
      },
    } as any);

    const result = await loadReviewForDrafting(42, 7);

    expect(result).not.toBeNull();
    expect(result).toHaveProperty("customerFirstName", "Alice");
    expect(result).not.toHaveProperty("customerLastName");
    expect(result).not.toHaveProperty("customerEmail");
    expect(result).not.toHaveProperty("email");
  });

  it("derives suggestedToneNotes 'warm and grateful' for 5 stars", async () => {
    mockPrisma.review.findUnique.mockResolvedValue({
      id: 1,
      sellerId: 42,
      rating: 5,
      comment: "wonderful",
      product: { name: "X" },
      user: { buyerProfile: { firstName: "A" } },
    } as any);

    const result = await loadReviewForDrafting(42, 1);
    expect(result?.suggestedToneNotes).toBe("warm and grateful");
  });

  it("derives suggestedToneNotes 'appreciative' for 4 stars", async () => {
    mockPrisma.review.findUnique.mockResolvedValue({
      id: 1,
      sellerId: 42,
      rating: 4,
      comment: "good",
      product: { name: "X" },
      user: { buyerProfile: { firstName: "A" } },
    } as any);

    const result = await loadReviewForDrafting(42, 1);
    expect(result?.suggestedToneNotes).toBe("appreciative");
  });

  it("derives suggestedToneNotes 'constructive and curious' for 3 stars", async () => {
    mockPrisma.review.findUnique.mockResolvedValue({
      id: 1,
      sellerId: 42,
      rating: 3,
      comment: "ok",
      product: { name: "X" },
      user: { buyerProfile: { firstName: "A" } },
    } as any);

    const result = await loadReviewForDrafting(42, 1);
    expect(result?.suggestedToneNotes).toBe("constructive and curious");
  });

  it("derives suggestedToneNotes 'empathetic and solution-oriented' for 1-2 stars", async () => {
    mockPrisma.review.findUnique.mockResolvedValue({
      id: 1,
      sellerId: 42,
      rating: 1,
      comment: "bad",
      product: { name: "X" },
      user: { buyerProfile: { firstName: "A" } },
    } as any);
    const r1 = await loadReviewForDrafting(42, 1);
    expect(r1?.suggestedToneNotes).toBe("empathetic and solution-oriented");

    mockPrisma.review.findUnique.mockResolvedValue({
      id: 2,
      sellerId: 42,
      rating: 2,
      comment: "bad",
      product: { name: "X" },
      user: { buyerProfile: { firstName: "A" } },
    } as any);
    const r2 = await loadReviewForDrafting(42, 2);
    expect(r2?.suggestedToneNotes).toBe("empathetic and solution-oriented");
  });
});
