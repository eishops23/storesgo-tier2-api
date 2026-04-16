// ==========================================================
// STORESGO SEARCH ROUTES — PHASE 18
// Product search API endpoints
// ==========================================================

import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import {
  searchProducts,
  getSearchSuggestions,
} from "../../services/search.service.js";

export default async function searchRoutes(app: FastifyInstance) {
  /**
   * GET /api/search-products
   * Search products by query
   * 
   * Query params:
   *   - q: Search query (required)
   *   - page: Page number (default 1)
   *   - limit: Items per page (default 20, max 100)
   *   - categoryId: Filter by category
   *   - minPrice: Minimum price in dollars
   *   - maxPrice: Maximum price in dollars
   * 
   * Returns:
   *   {
   *     products: Array of products with images, seller, and category
   *     page: Current page
   *     limit: Items per page
   *     total: Total matching products
   *   }
   */
  app.get(
    "/",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const query = request.query as {
        q?: string;
        page?: string;
        limit?: string;
        categoryId?: string;
        minPrice?: string;
        maxPrice?: string;
      };

      // Validate search query
      if (!query.q || query.q.trim().length === 0) {
        return reply.status(400).send({
          ok: false,
          error: "Search query (q) is required",
        });
      }

      const result = await searchProducts({
        q: query.q,
        page: query.page ? parseInt(query.page, 10) : undefined,
        limit: query.limit ? parseInt(query.limit, 10) : undefined,
        categoryId: query.categoryId ? parseInt(query.categoryId, 10) : undefined,
        minPrice: query.minPrice ? parseFloat(query.minPrice) : undefined,
        maxPrice: query.maxPrice ? parseFloat(query.maxPrice) : undefined,
      });

      return reply.send({
        ok: true,
        products: result.products,
        page: result.page,
        limit: result.limit,
        total: result.total,
      });
    }
  );

  /**
   * GET /api/search-products/suggestions
   * Get search suggestions (autocomplete)
   * 
   * Query params:
   *   - q: Search query (min 2 characters)
   *   - limit: Max suggestions (default 10)
   */
  app.get(
    "/suggestions",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const query = request.query as {
        q?: string;
        limit?: string;
      };

      if (!query.q || query.q.trim().length < 2) {
        return reply.send({ ok: true, suggestions: [] });
      }

      const limit = query.limit ? parseInt(query.limit, 10) : 10;
      const suggestions = await getSearchSuggestions(query.q, limit);

      return reply.send({ ok: true, suggestions });
    }
  );

  app.log.info("🔍 Search routes registered");
}

