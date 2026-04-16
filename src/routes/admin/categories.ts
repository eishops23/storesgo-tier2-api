// ==========================================================
// STORESGO ADMIN CATEGORIES ROUTES — PHASE 7D
// Admin-only category management API endpoints
// ==========================================================

import type { FastifyInstance } from "fastify";
import { requireAdmin } from "../../utils/requireAdmin.js";
import {
  listAdminCategoriesHandler,
  getAdminCategoryByIdHandler,
  createAdminCategoryHandler,
  updateAdminCategoryHandler,
  deleteAdminCategoryHandler,
} from "../../controllers/adminCategories.controller.js";

/**
 * Admin Categories Routes
 * All routes are protected by requireAdmin guard
 * 
 * Routes:
 * - GET    /                  List all categories (paginated, searchable)
 * - GET    /:id               Get category by ID
 * - POST   /                  Create a new category
 * - PATCH  /:id               Update category fields
 * - DELETE /:id               Delete category (fails if products linked)
 */
export default async function adminCategoriesRoutes(app: FastifyInstance) {
  // ---------------------------------------------------------
  // LIST CATEGORIES
  // GET /api/admin/categories
  // Query: page, pageSize, q (search by name/slug)
  // ---------------------------------------------------------
  app.get(
    "/",
    { preHandler: requireAdmin },
    listAdminCategoriesHandler
  );

  // ---------------------------------------------------------
  // GET CATEGORY BY ID
  // GET /api/admin/categories/:id
  // ---------------------------------------------------------
  app.get(
    "/:id",
    { preHandler: requireAdmin },
    getAdminCategoryByIdHandler
  );

  // ---------------------------------------------------------
  // CREATE CATEGORY
  // POST /api/admin/categories
  // Body: name, slug, icon?, image?, tagline?, color?, sortOrder?, parentId?
  // ---------------------------------------------------------
  app.post(
    "/",
    { preHandler: requireAdmin },
    createAdminCategoryHandler
  );

  // ---------------------------------------------------------
  // UPDATE CATEGORY
  // PATCH /api/admin/categories/:id
  // Body: name?, slug?, icon?, image?, tagline?, color?, sortOrder?, parentId?
  // ---------------------------------------------------------
  app.patch(
    "/:id",
    { preHandler: requireAdmin },
    updateAdminCategoryHandler
  );

  // ---------------------------------------------------------
  // DELETE CATEGORY
  // DELETE /api/admin/categories/:id
  // Returns 400 if products are linked to this category
  // ---------------------------------------------------------
  app.delete(
    "/:id",
    { preHandler: requireAdmin },
    deleteAdminCategoryHandler
  );

  app.log.info("📁 Admin categories routes registered (Phase 7D)");
}

