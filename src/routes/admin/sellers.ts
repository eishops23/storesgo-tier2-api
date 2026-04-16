// ==========================================================
// STORESGO ADMIN SELLERS ROUTES — PHASE 7C
// Admin-only seller management API endpoints
// ==========================================================

import type { FastifyInstance } from "fastify";
import { requireAdmin } from "../../utils/requireAdmin.js";
import {
  listAdminSellersHandler,
  getAdminSellerByIdHandler,
  updateAdminSellerHandler,
  approveAdminSellerHandler,
  banAdminSellerHandler,
} from "../../controllers/adminSellers.controller.js";

/**
 * Admin Sellers Routes
 * All routes are protected by requireAdmin guard
 * 
 * Routes:
 * - GET    /                  List all sellers (with filters)
 * - GET    /:id               Get seller by ID
 * - PATCH  /:id               Update seller profile fields
 * - POST   /:id/approve       Approve a seller
 * - POST   /:id/ban           Ban a seller
 */
export default async function adminSellersRoutes(app: FastifyInstance) {
  // ---------------------------------------------------------
  // LIST SELLERS
  // GET /api/admin/sellers
  // Query: page, pageSize, status (approved|pending|banned), q
  // ---------------------------------------------------------
  app.get(
    "/",
    { preHandler: requireAdmin },
    listAdminSellersHandler
  );

  // ---------------------------------------------------------
  // GET SELLER BY ID
  // GET /api/admin/sellers/:id
  // ---------------------------------------------------------
  app.get(
    "/:id",
    { preHandler: requireAdmin },
    getAdminSellerByIdHandler
  );

  // ---------------------------------------------------------
  // UPDATE SELLER
  // PATCH /api/admin/sellers/:id
  // Body: storeName, about, city, state, country
  // ---------------------------------------------------------
  app.patch(
    "/:id",
    { preHandler: requireAdmin },
    updateAdminSellerHandler
  );

  // ---------------------------------------------------------
  // APPROVE SELLER
  // POST /api/admin/sellers/:id/approve
  // ---------------------------------------------------------
  app.post(
    "/:id/approve",
    { preHandler: requireAdmin },
    approveAdminSellerHandler
  );

  // ---------------------------------------------------------
  // BAN SELLER
  // POST /api/admin/sellers/:id/ban
  // ---------------------------------------------------------
  app.post(
    "/:id/ban",
    { preHandler: requireAdmin },
    banAdminSellerHandler
  );

  app.log.info("👥 Admin sellers routes registered (Phase 7C)");
}

