// ==========================================================
// ⭐ STORESGO REVIEW ROUTES
// Product reviews with notification integration
// Refactored in Phase 11 Prompt 2 to delegate DB work to
// src/services/reviews.service.ts. Behavior is byte-identical
// from an API consumer's perspective: same response shapes,
// same status codes, same error messages, notifyNewReview side
// effect preserved at the same call site.
// ==========================================================

import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { authenticateUser } from "../../middleware/authUser.js";
import { notifyNewReview } from "../../services/notifications.service.js";
import * as reviewsService from "../../services/reviews.service.js";

// ----------------------------------------------------------
// 📋 TYPE DEFINITIONS
// ----------------------------------------------------------

interface CreateReviewBody {
  productId: number;
  rating: number;
  comment?: string;
}

interface GetReviewsQuery {
  productId?: number;
  sellerId?: number;
  page?: number;
  limit?: number;
}

// ----------------------------------------------------------
// ⭐ REVIEW ROUTES
// ----------------------------------------------------------

export default async function reviewRoutes(app: FastifyInstance) {
  // ----------------------------------------------------------
  // ⭐ CREATE REVIEW (Buyer)
  // ----------------------------------------------------------
  app.post(
    "/",
    { preHandler: [authenticateUser] },
    async (
      request: FastifyRequest<{ Body: CreateReviewBody }>,
      reply: FastifyReply
    ) => {
      try {
        const user = request.user;
        if (!user || user.role !== "BUYER") {
          return reply.code(403).send({ ok: false, error: "Buyers only" });
        }

        const { productId, rating, comment } = request.body;

        if (!productId || !rating) {
          return reply.code(400).send({ ok: false, error: "productId and rating required" });
        }

        if (rating < 1 || rating > 5) {
          return reply.code(400).send({ ok: false, error: "Rating must be between 1 and 5" });
        }

        const result = await reviewsService.createReview(user.id, {
          productId,
          rating,
          comment,
        });

        if ("reason" in result) {
          if (result.reason === "product_not_found") {
            return reply.code(404).send({ ok: false, error: "Product not found" });
          }
          // duplicate
          return reply.code(400).send({ ok: false, error: "You already reviewed this product" });
        }

        // 🔔 Send notification to seller about the new review
        try {
          await notifyNewReview({
            sellerId: result.product.sellerId as number,
            sellerEmail: result.product.sellerEmail ?? undefined,
            productId: result.product.id,
            productName: result.product.name,
            rating,
            reviewText: comment,
            reviewId: result.review.id,
          });
          app.log.info(`📧 Review notification sent to seller for product ${result.product.name}`);
        } catch (notifyErr: any) {
          app.log.warn(`⚠️ Failed to send review notification: ${notifyErr.message}`);
        }

        return reply.send({
          ok: true,
          data: result.review,
          message: "Review submitted successfully",
        });
      } catch (err: any) {
        app.log.error({ err }, "❌ Create review failed");
        return reply.code(500).send({ ok: false, error: "Failed to create review" });
      }
    }
  );

  // ----------------------------------------------------------
  // ⭐ GET REVIEWS (Public)
  // ----------------------------------------------------------
  app.get(
    "/",
    async (request: FastifyRequest<{ Querystring: GetReviewsQuery }>, reply: FastifyReply) => {
      try {
        const { productId, sellerId, page = 1, limit = 20 } = request.query;

        const data = await reviewsService.listReviewsWithStats({
          productId: productId !== undefined ? Number(productId) : undefined,
          sellerId: sellerId !== undefined ? Number(sellerId) : undefined,
          page,
          limit,
        });

        return reply.send({ ok: true, data });
      } catch (err: any) {
        app.log.error({ err }, "❌ Get reviews failed");
        return reply.code(500).send({ ok: false, error: "Failed to fetch reviews" });
      }
    }
  );

  // ----------------------------------------------------------
  // ⭐ GET SINGLE REVIEW
  // ----------------------------------------------------------
  app.get<{ Params: { id: string } }>(
    "/:id",
    async (request, reply) => {
      try {
        const reviewId = parseInt(request.params.id, 10);
        if (isNaN(reviewId)) {
          return reply.code(400).send({ ok: false, error: "Invalid review ID" });
        }

        const review = await reviewsService.getReviewWithDetailsById(reviewId);

        if (!review) {
          return reply.code(404).send({ ok: false, error: "Review not found" });
        }

        return reply.send({ ok: true, data: review });
      } catch (err: any) {
        app.log.error({ err }, "❌ Get review failed");
        return reply.code(500).send({ ok: false, error: "Failed to fetch review" });
      }
    }
  );

  // ----------------------------------------------------------
  // ⭐ UPDATE REVIEW (Owner only)
  // ----------------------------------------------------------
  app.patch<{ Params: { id: string }; Body: { rating?: number; comment?: string } }>(
    "/:id",
    { preHandler: [authenticateUser] },
    async (request, reply) => {
      try {
        const user = request.user;
        if (!user) {
          return reply.code(401).send({ ok: false, error: "Unauthorized" });
        }

        const reviewId = parseInt(request.params.id, 10);
        if (isNaN(reviewId)) {
          return reply.code(400).send({ ok: false, error: "Invalid review ID" });
        }

        const { rating, comment } = request.body;

        if (rating !== undefined && (rating < 1 || rating > 5)) {
          return reply.code(400).send({ ok: false, error: "Rating must be between 1 and 5" });
        }

        const result = await reviewsService.updateReview(user.id, reviewId, {
          rating,
          comment,
        });

        if ("reason" in result) {
          if (result.reason === "not_found") {
            return reply.code(404).send({ ok: false, error: "Review not found" });
          }
          return reply.code(403).send({ ok: false, error: "Not authorized to edit this review" });
        }

        return reply.send({
          ok: true,
          data: result.review,
          message: "Review updated successfully",
        });
      } catch (err: any) {
        app.log.error({ err }, "❌ Update review failed");
        return reply.code(500).send({ ok: false, error: "Failed to update review" });
      }
    }
  );

  // ----------------------------------------------------------
  // ⭐ DELETE REVIEW (Owner only)
  // ----------------------------------------------------------
  app.delete<{ Params: { id: string } }>(
    "/:id",
    { preHandler: [authenticateUser] },
    async (request, reply) => {
      try {
        const user = request.user;
        if (!user) {
          return reply.code(401).send({ ok: false, error: "Unauthorized" });
        }

        const reviewId = parseInt(request.params.id, 10);
        if (isNaN(reviewId)) {
          return reply.code(400).send({ ok: false, error: "Invalid review ID" });
        }

        const result = await reviewsService.deleteReview(user.id, reviewId);

        if ("reason" in result) {
          if (result.reason === "not_found") {
            return reply.code(404).send({ ok: false, error: "Review not found" });
          }
          return reply.code(403).send({ ok: false, error: "Not authorized to delete this review" });
        }

        return reply.send({
          ok: true,
          message: "Review deleted successfully",
        });
      } catch (err: any) {
        app.log.error({ err }, "❌ Delete review failed");
        return reply.code(500).send({ ok: false, error: "Failed to delete review" });
      }
    }
  );

  // ----------------------------------------------------------
  // ⭐ GET MY REVIEWS (Authenticated user)
  // ----------------------------------------------------------
  app.get(
    "/my-reviews",
    { preHandler: [authenticateUser] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = request.user;
        if (!user) {
          return reply.code(401).send({ ok: false, error: "Unauthorized" });
        }

        const reviews = await reviewsService.getMyReviews(user.id);

        return reply.send({ ok: true, data: reviews });
      } catch (err: any) {
        app.log.error({ err }, "❌ Get my reviews failed");
        return reply.code(500).send({ ok: false, error: "Failed to fetch reviews" });
      }
    }
  );

  // ----------------------------------------------------------
  // 📊 GET PRODUCT REVIEW STATS
  // ----------------------------------------------------------
  app.get<{ Params: { productId: string } }>(
    "/product/:productId/stats",
    async (request, reply) => {
      try {
        const productId = parseInt(request.params.productId, 10);
        if (isNaN(productId)) {
          return reply.code(400).send({ ok: false, error: "Invalid product ID" });
        }

        const data = await reviewsService.getProductReviewStats(productId);

        return reply.send({ ok: true, data });
      } catch (err: any) {
        app.log.error({ err }, "❌ Get product review stats failed");
        return reply.code(500).send({ ok: false, error: "Failed to fetch review stats" });
      }
    }
  );
}
