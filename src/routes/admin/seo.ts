// ==========================================================
// STORESGO ADMIN SEO ROUTES — PHASE 7D
// Admin-only SEO page management API endpoints
// ==========================================================

import type { FastifyInstance } from "fastify";
import { requireAdmin } from "../../utils/requireAdmin.js";
import {
  listAdminSeoPagesHandler,
  getAdminSeoPageByIdHandler,
  createAdminSeoPageHandler,
  updateAdminSeoPageHandler,
  deleteAdminSeoPageHandler,
} from "../../controllers/adminSeo.controller.js";

/**
 * Admin SEO Routes
 * All routes are protected by requireAdmin guard
 * 
 * Routes:
 * - GET    /pages              List all SEO pages (paginated, filterable by type)
 * - GET    /pages/:id          Get SEO page by ID
 * - POST   /pages              Create a new SEO page
 * - PATCH  /pages/:id          Update SEO page fields
 * - DELETE /pages/:id          Delete SEO page
 */
export default async function adminSeoRoutes(app: FastifyInstance) {
  // ---------------------------------------------------------
  // LIST SEO PAGES
  // GET /api/admin/seo/pages
  // Query: page, pageSize, type (blog|guide|deal|landing|page), published, q
  // ---------------------------------------------------------
  app.get(
    "/pages",
    { preHandler: requireAdmin },
    listAdminSeoPagesHandler
  );

  // ---------------------------------------------------------
  // GET SEO PAGE BY ID
  // GET /api/admin/seo/pages/:id
  // ---------------------------------------------------------
  app.get(
    "/pages/:id",
    { preHandler: requireAdmin },
    getAdminSeoPageByIdHandler
  );

  // ---------------------------------------------------------
  // CREATE SEO PAGE
  // POST /api/admin/seo/pages
  // Body: type?, slug, title, content?, metaTitle?, metaDescription?, published?, publishedAt?
  // ---------------------------------------------------------
  app.post(
    "/pages",
    { preHandler: requireAdmin },
    createAdminSeoPageHandler
  );

  // ---------------------------------------------------------
  // UPDATE SEO PAGE
  // PATCH /api/admin/seo/pages/:id
  // Body: type?, slug?, title?, content?, metaTitle?, metaDescription?, published?, publishedAt?
  // ---------------------------------------------------------
  app.patch(
    "/pages/:id",
    { preHandler: requireAdmin },
    updateAdminSeoPageHandler
  );

  // ---------------------------------------------------------
  // DELETE SEO PAGE
  // DELETE /api/admin/seo/pages/:id
  // ---------------------------------------------------------
  app.delete(
    "/pages/:id",
    { preHandler: requireAdmin },
    deleteAdminSeoPageHandler
  );

  app.log.info("📝 Admin SEO routes registered (Phase 7D)");
}

