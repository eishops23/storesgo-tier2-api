// Reviews service — extracted from src/routes/reviews/index.ts in Phase 11 Prompt 2.
// Mirrors the Phase 5 referrals.service.ts pattern (commit 13c10ac).
//
// Two surfaces live here:
//   1. Existing-route-supporting functions (createReview, listReviewsWithStats, etc.).
//      These back the 7 existing review endpoints — behavior is byte-identical to the
//      pre-refactor route handlers, including response shapes and side-effect contracts.
//   2. New seller-scoped read functions (listReviewsForSeller, getReviewByIdForSeller,
//      getReviewStatsForSeller, findReviewsNeedingResponse, loadReviewForDrafting).
//      These exist for the Phase 11 Reviews Agent tools (Prompt 3).
//
// Note on sellerId types: Seller.id is Int @id @default(autoincrement()) and
// Review.sellerId is Int?. All sellerId parameters here are `number`, not `string`.
// The Prompt 2 spec said `string`, but the audit (B1) and the existing route's
// `whereClause.sellerId = Number(sellerId)` confirm Int. Using `string` would not
// type-check against the Prisma client.

import { prisma } from "../lib/prisma.js";

// =============================================================================
// Types
// =============================================================================

export interface ReviewListItem {
  id: number;
  userId: string;
  sellerId: number | null;
  productId: number;
  rating: number;
  comment: string | null;
  createdAt: Date;
  product: {
    id: number;
    name: string;
    imageUrl: string | null;
  } | null;
}

export interface ReviewWithRelations {
  id: number;
  userId: string;
  sellerId: number | null;
  productId: number;
  rating: number;
  comment: string | null;
  createdAt: Date;
  user?: {
    id: string;
    email: string;
    buyerProfile?: { firstName: string | null } | null;
  };
  product?: {
    id: number;
    name: string;
    imageUrl: string | null;
  };
  seller?: {
    id: number;
    storeName: string;
  } | null;
}

export interface ReviewStats {
  totalReviews: number;
  avgRating: number;
  ratingDistribution: { 1: number; 2: number; 3: number; 4: number; 5: number };
  needingResponseCount: number;
}

export interface DraftingContext {
  reviewId: number;
  productName: string | null;
  customerFirstName: string | null;
  rating: number;
  originalComment: string | null;
  suggestedToneNotes: string;
}

// =============================================================================
// Existing-route-supporting functions
// =============================================================================

// --- POST / (create review) ---

export type CreateReviewResult =
  | {
      ok: true;
      review: any;
      product: {
        id: number;
        name: string;
        sellerId: number | null;
        sellerEmail: string | null;
      };
    }
  | { ok: false; reason: "product_not_found" | "duplicate" };

export async function createReview(
  userId: string,
  input: { productId: number; rating: number; comment?: string },
): Promise<CreateReviewResult> {
  const product = await prisma.product.findUnique({
    where: { id: input.productId },
    include: {
      seller: {
        include: { user: true },
      },
    },
  });

  if (!product) {
    return { ok: false, reason: "product_not_found" };
  }

  const existingReview = await prisma.review.findFirst({
    where: { userId, productId: input.productId },
  });

  if (existingReview) {
    return { ok: false, reason: "duplicate" };
  }

  const review = await prisma.review.create({
    data: {
      userId,
      productId: input.productId,
      sellerId: product.sellerId,
      rating: input.rating,
      comment: input.comment,
    },
    include: {
      user: { select: { id: true, email: true } },
      product: { select: { id: true, name: true } },
    },
  });

  return {
    ok: true,
    review,
    product: {
      id: product.id,
      name: product.name,
      sellerId: product.sellerId,
      sellerEmail: product.seller?.user?.email ?? null,
    },
  };
}

// --- GET / (list reviews with stats) ---

export interface ListReviewsFilters {
  productId?: number;
  sellerId?: number;
  page?: number;
  limit?: number;
}

export async function listReviewsWithStats(filters: ListReviewsFilters) {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;

  const whereClause: { productId?: number; sellerId?: number } = {};
  if (filters.productId) whereClause.productId = Number(filters.productId);
  if (filters.sellerId) whereClause.sellerId = Number(filters.sellerId);

  const skip = (page - 1) * limit;

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: whereClause,
      include: {
        user: { select: { id: true, email: true, buyerProfile: true } },
        product: { select: { id: true, name: true, imageUrl: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.review.count({ where: whereClause }),
  ]);

  const avgResult = await prisma.review.aggregate({
    where: whereClause,
    _avg: { rating: true },
  });

  const ratingDistribution = await prisma.review.groupBy({
    by: ["rating"],
    where: whereClause,
    _count: { rating: true },
  });

  return {
    reviews,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    stats: {
      averageRating: avgResult._avg.rating || 0,
      totalReviews: total,
      ratingDistribution: ratingDistribution.map((r) => ({
        rating: r.rating,
        count: r._count.rating,
      })),
    },
  };
}

// --- GET /:id (single review) ---

export async function getReviewWithDetailsById(reviewId: number) {
  return prisma.review.findUnique({
    where: { id: reviewId },
    include: {
      user: { select: { id: true, email: true, buyerProfile: true } },
      product: { select: { id: true, name: true, imageUrl: true } },
      seller: { select: { id: true, storeName: true } },
    },
  });
}

// --- PATCH /:id (update — review-author owned) ---

export type UpdateReviewResult =
  | { ok: true; review: any }
  | { ok: false; reason: "not_found" | "forbidden" };

export async function updateReview(
  userId: string,
  reviewId: number,
  patch: { rating?: number; comment?: string },
): Promise<UpdateReviewResult> {
  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review) return { ok: false, reason: "not_found" };
  if (review.userId !== userId) return { ok: false, reason: "forbidden" };

  const updated = await prisma.review.update({
    where: { id: reviewId },
    data: {
      ...(patch.rating !== undefined && { rating: patch.rating }),
      ...(patch.comment !== undefined && { comment: patch.comment }),
    },
    include: {
      user: { select: { id: true, email: true } },
      product: { select: { id: true, name: true } },
    },
  });

  return { ok: true, review: updated };
}

// --- DELETE /:id (review-author owned) ---

export type DeleteReviewResult =
  | { ok: true }
  | { ok: false; reason: "not_found" | "forbidden" };

export async function deleteReview(
  userId: string,
  reviewId: number,
): Promise<DeleteReviewResult> {
  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review) return { ok: false, reason: "not_found" };
  if (review.userId !== userId) return { ok: false, reason: "forbidden" };

  await prisma.review.delete({ where: { id: reviewId } });
  return { ok: true };
}

// --- GET /my-reviews ---

export async function getMyReviews(userId: string) {
  return prisma.review.findMany({
    where: { userId },
    include: {
      product: { select: { id: true, name: true, imageUrl: true } },
      seller: { select: { id: true, storeName: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

// --- GET /product/:productId/stats ---

export async function getProductReviewStats(productId: number) {
  const [avgResult, total, distribution] = await Promise.all([
    prisma.review.aggregate({
      where: { productId },
      _avg: { rating: true },
    }),
    prisma.review.count({ where: { productId } }),
    prisma.review.groupBy({
      by: ["rating"],
      where: { productId },
      _count: { rating: true },
    }),
  ]);

  return {
    productId,
    averageRating: avgResult._avg.rating || 0,
    totalReviews: total,
    ratingDistribution: [1, 2, 3, 4, 5].map((r) => ({
      rating: r,
      count: distribution.find((d) => d.rating === r)?._count.rating || 0,
    })),
  };
}

// =============================================================================
// New seller-scoped read functions for Phase 11 Reviews Agent tools (Prompt 3)
// =============================================================================
//
// All of these enforce sellerId scoping at the service layer and defensively
// guard against legacy reviews where sellerId IS NULL (current production
// count: 0, but the guard is non-negotiable per CLAUDE.md). Note that
// `where: { sellerId: <number> }` already implicitly excludes NULL rows in
// Prisma, but we still add the explicit guard in the singular-fetch paths
// where a NULL row could otherwise sneak past the equality check.

export interface ListReviewsForSellerOpts {
  minRating?: number;
  maxRating?: number;
  sinceDays?: number;
  limit?: number;
}

export async function listReviewsForSeller(
  sellerId: number,
  opts?: ListReviewsForSellerOpts,
): Promise<ReviewListItem[]> {
  const limit = Math.min(opts?.limit ?? 20, 50);

  // Prisma's `sellerId: <number>` equality filter never matches NULL rows,
  // so this query implicitly excludes legacy reviews with sellerId IS NULL.
  const where: {
    sellerId: number;
    rating?: { gte?: number; lte?: number };
    createdAt?: { gte: Date };
  } = { sellerId };

  if (opts?.minRating !== undefined || opts?.maxRating !== undefined) {
    where.rating = {};
    if (opts?.minRating !== undefined) where.rating.gte = opts.minRating;
    if (opts?.maxRating !== undefined) where.rating.lte = opts.maxRating;
  }

  if (opts?.sinceDays !== undefined) {
    const since = new Date(Date.now() - opts.sinceDays * 24 * 60 * 60 * 1000);
    where.createdAt = { gte: since };
  }

  const reviews = await prisma.review.findMany({
    where,
    include: {
      product: { select: { id: true, name: true, imageUrl: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  // Defense-in-depth: drop any row whose sellerId came back NULL or
  // mismatched. Should be a no-op given the where clause, but the audit
  // (B12) requires it explicitly.
  return reviews
    .filter((r) => r.sellerId != null && r.sellerId === sellerId)
    .map((r) => ({
      id: r.id,
      userId: r.userId,
      sellerId: r.sellerId,
      productId: r.productId,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
      product: r.product,
    }));
}

export async function getReviewByIdForSeller(
  sellerId: number,
  reviewId: number,
): Promise<ReviewWithRelations | null> {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          buyerProfile: { select: { firstName: true } },
        },
      },
      product: { select: { id: true, name: true, imageUrl: true } },
      seller: { select: { id: true, storeName: true } },
    },
  });

  if (!review) return null;
  // Audit B12: explicit NULL guard. The ownership check rejects legacy
  // rows even if some caller bug ever passed sellerId === null.
  if (review.sellerId == null || review.sellerId !== sellerId) return null;

  return review as unknown as ReviewWithRelations;
}

export async function getReviewStatsForSeller(
  sellerId: number,
  sinceDays?: number,
): Promise<ReviewStats> {
  const days = Math.min(sinceDays ?? 90, 365);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const where = { sellerId, createdAt: { gte: since } };

  const [total, avgResult, distribution, needingResponseCount] =
    await Promise.all([
      prisma.review.count({ where }),
      prisma.review.aggregate({ where, _avg: { rating: true } }),
      prisma.review.groupBy({
        by: ["rating"],
        where,
        _count: { rating: true },
      }),
      prisma.review.count({ where: { ...where, rating: { lte: 3 } } }),
    ]);

  const ratingDistribution: ReviewStats["ratingDistribution"] = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };
  for (const d of distribution) {
    if (d.rating >= 1 && d.rating <= 5) {
      ratingDistribution[d.rating as 1 | 2 | 3 | 4 | 5] = d._count.rating;
    }
  }

  return {
    totalReviews: total,
    avgRating: avgResult._avg.rating ?? 0,
    ratingDistribution,
    needingResponseCount,
  };
}

export interface FindReviewsNeedingResponseOpts {
  ratingThreshold?: number;
  sinceDays?: number;
  limit?: number;
}

// Note: the reviews table currently has no `response` column, so "needing
// response" is defined as "rating <= ratingThreshold within the time window".
// When Phase 11 Prompt 4 adds the draft_response column (manual SQL migration
// 011), this function will gain an additional `draft_response IS NULL` clause.
export async function findReviewsNeedingResponse(
  sellerId: number,
  opts?: FindReviewsNeedingResponseOpts,
): Promise<ReviewListItem[]> {
  const ratingThreshold = opts?.ratingThreshold ?? 3;
  const sinceDays = opts?.sinceDays ?? 30;
  const limit = Math.min(opts?.limit ?? 20, 50);
  const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000);

  const reviews = await prisma.review.findMany({
    where: {
      sellerId,
      rating: { lte: ratingThreshold },
      createdAt: { gte: since },
    },
    include: {
      product: { select: { id: true, name: true, imageUrl: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return reviews
    .filter((r) => r.sellerId != null && r.sellerId === sellerId)
    .map((r) => ({
      id: r.id,
      userId: r.userId,
      sellerId: r.sellerId,
      productId: r.productId,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
      product: r.product,
    }));
}

export async function loadReviewForDrafting(
  sellerId: number,
  reviewId: number,
): Promise<DraftingContext | null> {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    include: {
      product: { select: { name: true } },
      user: {
        select: {
          buyerProfile: { select: { firstName: true } },
        },
      },
    },
  });

  if (!review) return null;
  if (review.sellerId == null || review.sellerId !== sellerId) return null;

  let suggestedToneNotes: string;
  if (review.rating === 5) {
    suggestedToneNotes = "warm and grateful";
  } else if (review.rating === 4) {
    suggestedToneNotes = "appreciative";
  } else if (review.rating === 3) {
    suggestedToneNotes = "constructive and curious";
  } else {
    suggestedToneNotes = "empathetic and solution-oriented";
  }

  return {
    reviewId: review.id,
    productName: review.product?.name ?? null,
    customerFirstName: review.user?.buyerProfile?.firstName ?? null,
    rating: review.rating,
    originalComment: review.comment,
    suggestedToneNotes,
  };
}
