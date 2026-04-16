// ==========================================================
// STORESGO ADMIN PRODUCTS ROUTES — PHASE 7B
// Admin-only product moderation API endpoints
// ==========================================================

import type { FastifyInstance } from "fastify";
import { requireAdmin } from "../../utils/requireAdmin.js";
import {
  listAdminProductsHandler,
  getAdminProductByIdHandler,
  updateAdminProductHandler,
  approveAdminProductHandler,
  rejectAdminProductHandler,
} from "../../controllers/adminProducts.controller.js";

/**
 * Admin Products Routes
 * All routes are protected by requireAdmin guard
 * 
 * Routes:
 * - GET    /                  List all products (with filters)
 * - GET    /:id               Get product by ID
 * - PATCH  /:id               Update product fields
 * - POST   /:id/approve       Approve a product
 * - POST   /:id/reject        Reject a product
 */
export default async function adminProductsRoutes(app: FastifyInstance) {
  // ---------------------------------------------------------
  // LIST PRODUCTS
  // GET /api/admin/products
  // ---------------------------------------------------------
  app.get(
    "/",
    { preHandler: requireAdmin },
    listAdminProductsHandler
  );

  // ---------------------------------------------------------
  // GET PRODUCT BY ID
  // GET /api/admin/products/:id
  // ---------------------------------------------------------
  app.get(
    "/:id",
    { preHandler: requireAdmin },
    getAdminProductByIdHandler
  );

  // ---------------------------------------------------------
  // UPDATE PRODUCT
  // PATCH /api/admin/products/:id
  // ---------------------------------------------------------
  app.patch(
    "/:id",
    { preHandler: requireAdmin },
    updateAdminProductHandler
  );

  // ---------------------------------------------------------
  // APPROVE PRODUCT
  // POST /api/admin/products/:id/approve
  // ---------------------------------------------------------
  app.post(
    "/:id/approve",
    { preHandler: requireAdmin },
    approveAdminProductHandler
  );

  // ---------------------------------------------------------
  // REJECT PRODUCT
  // POST /api/admin/products/:id/reject
  // ---------------------------------------------------------
  app.post(
    "/:id/reject",
    { preHandler: requireAdmin },
    rejectAdminProductHandler
  );

  app.log.info("📦 Admin products routes registered (Phase 7B)");
}

