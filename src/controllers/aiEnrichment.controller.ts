// ==========================================================
// 🤖 STORESGO AI ENRICHMENT CONTROLLER — PHASE 12
// Handlers for AI enrichment admin endpoints
// ==========================================================

import type { FastifyReply, FastifyRequest } from "fastify";
import {
  enrichProductFull,
  generateProductDescription,
  generateProductTags,
  generateSeoKeywords,
  generateBulletPoints,
  generateTargetAudience,
  runBatchEnrichment,
  getProductsNeedingReview,
  approveAIContent,
  rejectAIContent,
  getEnrichmentStats,
  getProductEnrichmentLogs,
  testAIConnection,
  EnrichmentType,
  ProductForEnrichment,
} from "../services/aiEnrichment.service.js";
import { prisma } from "../plugins/prisma.js";
import { buildPaginationInfo } from "../utils/pagination.js";

// ---------------------------------------------------------
// TYPES
// ---------------------------------------------------------

interface EnrichProductParams {
  id: string;
}

interface EnrichProductBody {
  enrichmentType?: EnrichmentType;
}

interface BatchEnrichmentBody {
  limit?: number;
  enrichmentType?: EnrichmentType;
  forceReenrich?: boolean;
}

interface ReviewQuery {
  page?: string;
  pageSize?: string;
}

interface ReviewActionBody {
  notes?: string;
}

// ---------------------------------------------------------
// TEST AI CONNECTION
// ---------------------------------------------------------

/**
 * GET /api/admin/ai/test
 * Test OpenAI API connection
 */
export async function testAIConnectionHandler(
  _request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const result = await testAIConnection();
    
    return reply.send({
      ok: result.success,
      data: {
        connected: result.success,
        message: result.message,
        model: result.model,
      },
    });
  } catch (err: any) {
    return reply.status(500).send({
      ok: false,
      message: "Failed to test AI connection",
      error: err.message,
    });
  }
}

// ---------------------------------------------------------
// ENRICH SINGLE PRODUCT
// ---------------------------------------------------------

/**
 * POST /api/admin/ai/products/:id/enrich
 * Trigger AI enrichment for a specific product
 */
export async function enrichProductHandler(
  request: FastifyRequest<{ Params: EnrichProductParams; Body: EnrichProductBody }>,
  reply: FastifyReply
) {
  try {
    const productId = Number(request.params.id);
    const { enrichmentType = "full" } = request.body || {};

    if (isNaN(productId) || productId <= 0) {
      return reply.status(400).send({
        ok: false,
        message: "Invalid product ID",
      });
    }

    // Fetch product with relations
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: { select: { name: true, slug: true } },
        seller: { select: { storeName: true } },
      },
    });

    if (!product) {
      return reply.status(404).send({
        ok: false,
        message: "Product not found",
      });
    }

    const productData: ProductForEnrichment = {
      id: product.id,
      name: product.name,
      description: product.description,
      priceCents: product.priceCents,
      category: product.category,
      seller: product.seller,
      imageUrl: product.imageUrl,
    };

    let result;

    switch (enrichmentType) {
      case "description":
        result = await generateProductDescription(productData);
        break;
      case "tags":
        result = await generateProductTags(productData);
        break;
      case "seo_keywords":
        result = await generateSeoKeywords(productData);
        break;
      case "bullet_points":
        result = await generateBulletPoints(productData);
        break;
      case "target_audience":
        result = await generateTargetAudience(productData);
        break;
      case "full":
      default:
        result = await enrichProductFull(productId);
        break;
    }

    return reply.send({
      ok: result.success,
      data: result,
      message: result.success
        ? `Product ${productId} enrichment (${enrichmentType}) completed`
        : `Product ${productId} enrichment failed`,
    });
  } catch (err: any) {
    request.log.error(err, "Failed to enrich product");
    return reply.status(500).send({
      ok: false,
      message: "Failed to enrich product",
      error: err.message,
    });
  }
}

// ---------------------------------------------------------
// BATCH ENRICHMENT
// ---------------------------------------------------------

/**
 * POST /api/admin/ai/batch-enrich
 * Run batch enrichment for products missing AI content
 */
export async function batchEnrichmentHandler(
  request: FastifyRequest<{ Body: BatchEnrichmentBody }>,
  reply: FastifyReply
) {
  try {
    const { limit = 10, enrichmentType = "full", forceReenrich = false } = request.body || {};

    // Validate limit
    const safeLimit = Math.min(Math.max(1, limit), 100); // Cap at 100

    const result = await runBatchEnrichment({
      limit: safeLimit,
      enrichmentType,
      forceReenrich,
    });

    return reply.send({
      ok: true,
      data: {
        total: result.total,
        successful: result.successful,
        failed: result.failed,
        results: result.results.map((r) => ({
          productId: r.productId,
          success: r.success,
          enrichmentType: r.enrichmentType,
          error: r.error,
          moderationFlags: r.moderationFlags,
        })),
      },
      message: `Batch enrichment completed: ${result.successful}/${result.total} successful`,
    });
  } catch (err: any) {
    request.log.error(err, "Failed to run batch enrichment");
    return reply.status(500).send({
      ok: false,
      message: "Failed to run batch enrichment",
      error: err.message,
    });
  }
}

// ---------------------------------------------------------
// GET PRODUCTS NEEDING REVIEW
// ---------------------------------------------------------

/**
 * GET /api/admin/ai/review
 * Get products with AI content needing admin review
 */
export async function getReviewQueueHandler(
  request: FastifyRequest<{ Querystring: ReviewQuery }>,
  reply: FastifyReply
) {
  try {
    const { page = "1", pageSize = "20" } = request.query;

    const result = await getProductsNeedingReview({
      page: Number(page),
      pageSize: Number(pageSize),
    });

    return reply.send({
      ok: true,
      data: result.items,
      pagination: buildPaginationInfo(result.page, result.pageSize, result.total),
    });
  } catch (err: any) {
    request.log.error(err, "Failed to get review queue");
    return reply.status(500).send({
      ok: false,
      message: "Failed to get review queue",
      error: err.message,
    });
  }
}

// ---------------------------------------------------------
// APPROVE AI CONTENT
// ---------------------------------------------------------

/**
 * POST /api/admin/ai/products/:id/approve
 * Approve AI-generated content for a product
 */
export async function approveAIContentHandler(
  request: FastifyRequest<{ Params: EnrichProductParams; Body: ReviewActionBody }>,
  reply: FastifyReply
) {
  try {
    const productId = Number(request.params.id);
    const { notes } = request.body || {};
    const adminId = (request as any).admin?.adminId || 0;

    if (isNaN(productId) || productId <= 0) {
      return reply.status(400).send({
        ok: false,
        message: "Invalid product ID",
      });
    }

    // Check product exists and needs review
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, aiEnrichmentStatus: true },
    });

    if (!product) {
      return reply.status(404).send({
        ok: false,
        message: "Product not found",
      });
    }

    if (product.aiEnrichmentStatus !== "needs_review") {
      return reply.status(400).send({
        ok: false,
        message: "Product does not require review",
      });
    }

    await approveAIContent(productId, adminId, notes);

    return reply.send({
      ok: true,
      message: `AI content approved for product ${productId}`,
    });
  } catch (err: any) {
    request.log.error(err, "Failed to approve AI content");
    return reply.status(500).send({
      ok: false,
      message: "Failed to approve AI content",
      error: err.message,
    });
  }
}

// ---------------------------------------------------------
// REJECT AI CONTENT
// ---------------------------------------------------------

/**
 * POST /api/admin/ai/products/:id/reject
 * Reject AI-generated content and reset for re-enrichment
 */
export async function rejectAIContentHandler(
  request: FastifyRequest<{ Params: EnrichProductParams; Body: ReviewActionBody }>,
  reply: FastifyReply
) {
  try {
    const productId = Number(request.params.id);
    const { notes } = request.body || {};
    const adminId = (request as any).admin?.adminId || 0;

    if (isNaN(productId) || productId <= 0) {
      return reply.status(400).send({
        ok: false,
        message: "Invalid product ID",
      });
    }

    // Check product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });

    if (!product) {
      return reply.status(404).send({
        ok: false,
        message: "Product not found",
      });
    }

    await rejectAIContent(productId, adminId, notes);

    return reply.send({
      ok: true,
      message: `AI content rejected for product ${productId}. Product reset for re-enrichment.`,
    });
  } catch (err: any) {
    request.log.error(err, "Failed to reject AI content");
    return reply.status(500).send({
      ok: false,
      message: "Failed to reject AI content",
      error: err.message,
    });
  }
}

// ---------------------------------------------------------
// GET ENRICHMENT STATS
// ---------------------------------------------------------

/**
 * GET /api/admin/ai/stats
 * Get AI enrichment statistics
 */
export async function getEnrichmentStatsHandler(
  _request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const stats = await getEnrichmentStats();

    return reply.send({
      ok: true,
      data: stats,
    });
  } catch (err: any) {
    _request.log.error(err, "Failed to get enrichment stats");
    return reply.status(500).send({
      ok: false,
      message: "Failed to get enrichment stats",
      error: err.message,
    });
  }
}

// ---------------------------------------------------------
// GET PRODUCT ENRICHMENT LOGS
// ---------------------------------------------------------

/**
 * GET /api/admin/ai/products/:id/logs
 * Get AI enrichment logs for a specific product
 */
export async function getProductLogsHandler(
  request: FastifyRequest<{ Params: EnrichProductParams }>,
  reply: FastifyReply
) {
  try {
    const productId = Number(request.params.id);

    if (isNaN(productId) || productId <= 0) {
      return reply.status(400).send({
        ok: false,
        message: "Invalid product ID",
      });
    }

    // Check product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        aiDescription: true,
        aiTags: true,
        aiSeoKeywords: true,
        aiBulletPoints: true,
        aiTargetAudience: true,
        aiEnrichmentStatus: true,
        aiEnrichedAt: true,
        aiReviewedAt: true,
        aiModerationFlags: true,
      },
    });

    if (!product) {
      return reply.status(404).send({
        ok: false,
        message: "Product not found",
      });
    }

    const logs = await getProductEnrichmentLogs(productId);

    return reply.send({
      ok: true,
      data: {
        product: {
          id: product.id,
          name: product.name,
          aiContent: {
            description: product.aiDescription,
            tags: product.aiTags,
            seoKeywords: product.aiSeoKeywords,
            bulletPoints: product.aiBulletPoints,
            targetAudience: product.aiTargetAudience,
          },
          status: product.aiEnrichmentStatus,
          enrichedAt: product.aiEnrichedAt,
          reviewedAt: product.aiReviewedAt,
          moderationFlags: product.aiModerationFlags,
        },
        logs,
      },
    });
  } catch (err: any) {
    request.log.error(err, "Failed to get product logs");
    return reply.status(500).send({
      ok: false,
      message: "Failed to get product logs",
      error: err.message,
    });
  }
}

// ---------------------------------------------------------
// GET PRODUCT AI CONTENT (for frontend display)
// ---------------------------------------------------------

/**
 * GET /api/admin/ai/products/:id
 * Get AI-enriched content for a product
 */
export async function getProductAIContentHandler(
  request: FastifyRequest<{ Params: EnrichProductParams }>,
  reply: FastifyReply
) {
  try {
    const productId = Number(request.params.id);

    if (isNaN(productId) || productId <= 0) {
      return reply.status(400).send({
        ok: false,
        message: "Invalid product ID",
      });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        description: true,
        aiDescription: true,
        aiTags: true,
        aiSeoKeywords: true,
        aiBulletPoints: true,
        aiTargetAudience: true,
        aiEnrichmentStatus: true,
        aiEnrichedAt: true,
        aiReviewedAt: true,
        aiModerationFlags: true,
        category: { select: { name: true } },
        seller: { select: { storeName: true } },
      },
    });

    if (!product) {
      return reply.status(404).send({
        ok: false,
        message: "Product not found",
      });
    }

    return reply.send({
      ok: true,
      data: {
        id: product.id,
        name: product.name,
        originalDescription: product.description,
        category: product.category?.name,
        seller: product.seller?.storeName,
        ai: {
          description: product.aiDescription,
          tags: product.aiTags,
          seoKeywords: product.aiSeoKeywords,
          bulletPoints: product.aiBulletPoints,
          targetAudience: product.aiTargetAudience,
          status: product.aiEnrichmentStatus,
          enrichedAt: product.aiEnrichedAt,
          reviewedAt: product.aiReviewedAt,
          moderationFlags: product.aiModerationFlags,
        },
      },
    });
  } catch (err: any) {
    request.log.error(err, "Failed to get product AI content");
    return reply.status(500).send({
      ok: false,
      message: "Failed to get product AI content",
      error: err.message,
    });
  }
}

