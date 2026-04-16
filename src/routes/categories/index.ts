// ==========================================================
// STORESGO CATEGORY ROUTES — PHASE 18 ENHANCED
// Public routes for category listing, detail, and products
// ==========================================================

import type { FastifyInstance } from "fastify";
import {
  listCategoriesHandler,
  getCategoryDetailHandler,
  getCategoryProductsHandler,
} from "../../controllers/categories.controller.js";

export default async function categoryRoutes(app: FastifyInstance) {
  /**
   * GET /api/categories
   * Returns all parent categories with their children (subcategories)
   */
  app.get("/", listCategoriesHandler);

  /**
   * GET /api/categories/:slug
   * Returns category detail with:
   * - category: the category object
   * - children: subcategories
   * - parentsBreadcrumb: ancestor categories for breadcrumb navigation
   */
  app.get("/:slug", getCategoryDetailHandler);

  /**
   * GET /api/categories/:slug/products
   * Returns paginated products for a category
   * Query params: page, pageSize, sort, minPrice, maxPrice
   * Includes: images, seller, taxonomy (category)
   */
  app.get("/:slug/products", getCategoryProductsHandler);

  app.log.info("📂 Category routes registered");
}
