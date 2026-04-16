// ==========================================================
// 🤖 STORESGO ADMIN AI ROUTES — PHASE 12
// AI Enrichment Engine admin endpoints
// ==========================================================

import type { FastifyInstance } from "fastify";
import { requireAdmin } from "../../utils/requireAdmin.js";
import {
  testAIConnectionHandler,
  enrichProductHandler,
  batchEnrichmentHandler,
  getReviewQueueHandler,
  approveAIContentHandler,
  rejectAIContentHandler,
  getEnrichmentStatsHandler,
  getProductLogsHandler,
  getProductAIContentHandler,
} from "../../controllers/aiEnrichment.controller.js";

/**
 * Admin AI Enrichment Routes
 * All routes are protected by requireAdmin guard
 *
 * Routes:
 * - GET    /test                      Test AI API connection
 * - GET    /stats                     Get enrichment statistics
 * - GET    /review                    Get products needing review
 * - POST   /batch-enrich              Run batch enrichment
 * - GET    /products/:id              Get product AI content
 * - GET    /products/:id/logs         Get product enrichment logs
 * - POST   /products/:id/enrich       Enrich single product
 * - POST   /products/:id/approve      Approve AI content
 * - POST   /products/:id/reject       Reject AI content
 */
export default async function adminAIRoutes(app: FastifyInstance) {
  // ---------------------------------------------------------
  // TEST AI CONNECTION
  // GET /api/admin/ai/test
  // ---------------------------------------------------------
  app.get(
    "/test",
    { preHandler: requireAdmin },
    testAIConnectionHandler
  );

  // ---------------------------------------------------------
  // GET ENRICHMENT STATISTICS
  // GET /api/admin/ai/stats
  // ---------------------------------------------------------
  app.get(
    "/stats",
    { preHandler: requireAdmin },
    getEnrichmentStatsHandler
  );

  // ---------------------------------------------------------
  // GET PRODUCTS NEEDING REVIEW
  // GET /api/admin/ai/review
  // ---------------------------------------------------------
  app.get(
    "/review",
    { preHandler: requireAdmin },
    getReviewQueueHandler
  );

  // ---------------------------------------------------------
  // BATCH ENRICHMENT
  // POST /api/admin/ai/batch-enrich
  // ---------------------------------------------------------
  app.post(
    "/batch-enrich",
    { preHandler: requireAdmin },
    batchEnrichmentHandler
  );

  // ---------------------------------------------------------
  // GET PRODUCT AI CONTENT
  // GET /api/admin/ai/products/:id
  // ---------------------------------------------------------
  app.get(
    "/products/:id",
    { preHandler: requireAdmin },
    getProductAIContentHandler
  );

  // ---------------------------------------------------------
  // GET PRODUCT ENRICHMENT LOGS
  // GET /api/admin/ai/products/:id/logs
  // ---------------------------------------------------------
  app.get(
    "/products/:id/logs",
    { preHandler: requireAdmin },
    getProductLogsHandler
  );

  // ---------------------------------------------------------
  // ENRICH SINGLE PRODUCT
  // POST /api/admin/ai/products/:id/enrich
  // ---------------------------------------------------------
  app.post(
    "/products/:id/enrich",
    { preHandler: requireAdmin },
    enrichProductHandler
  );

  // ---------------------------------------------------------
  // APPROVE AI CONTENT
  // POST /api/admin/ai/products/:id/approve
  // ---------------------------------------------------------
  app.post(
    "/products/:id/approve",
    { preHandler: requireAdmin },
    approveAIContentHandler
  );

  // ---------------------------------------------------------
  // REJECT AI CONTENT
  // POST /api/admin/ai/products/:id/reject
  // ---------------------------------------------------------
  app.post(
    "/products/:id/reject",
    { preHandler: requireAdmin },
    rejectAIContentHandler
  );

  app.log.info("🤖 Admin AI enrichment routes registered (Phase 12)");
}

