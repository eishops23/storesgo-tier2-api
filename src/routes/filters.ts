// ==========================================================
// STORESGO FILTER ROUTES — Dynamic Faceted Filtering
// ==========================================================

import type { FastifyInstance } from "fastify";
import * as filterService from "../services/filter.service.js";

export default async function filterRoutes(app: FastifyInstance) {
  
  /**
   * GET /api/filters
   * Get available filters for a category or search
   */
  app.get("/", async (request) => {
    const { categorySlug, categoryId, q } = request.query as any;
    
    const filters = await filterService.getFiltersWithCounts({
      categorySlug,
      categoryId: categoryId ? Number(categoryId) : undefined,
      searchQuery: q
    });
    
    return { ok: true, data: filters };
  });

  /**
   * GET /api/filters/products
   * Get filtered products with facets
   */
  app.get("/products", async (request) => {
    const query = request.query as any;
    
    const result = await filterService.getFilteredProducts({
      categorySlug: query.categorySlug,
      categoryId: query.categoryId ? Number(query.categoryId) : undefined,
      sellerId: query.sellerId ? Number(query.sellerId) : undefined,
      searchQuery: query.q,
      page: Number(query.page) || 1,
      pageSize: Number(query.pageSize) || 24,
      sort: query.sort || 'relevance',
      filters: {
        brands: query.brands ? query.brands.split(',') : undefined,
        dietary: query.dietary ? query.dietary.split(',') : undefined,
        origin: query.origin ? query.origin.split(',') : undefined,
        priceMin: query.priceMin ? Number(query.priceMin) : undefined,
        priceMax: query.priceMax ? Number(query.priceMax) : undefined,
        storeIds: query.storeIds ? query.storeIds.split(',').map(Number) : undefined
      }
    });
    
    return { ok: true, data: result };
  });

  /**
   * GET /api/filters/search
   * Smart search with filters (unified endpoint)
   */
  app.get("/search", async (request) => {
    const query = request.query as any;
    
    if (!query.q) {
      return { ok: false, error: "Search query required" };
    }
    
    const result = await filterService.smartSearch({
      query: query.q,
      page: Number(query.page) || 1,
      pageSize: Number(query.pageSize) || 24,
      sort: query.sort || 'relevance',
      filters: {
        brands: query.brands ? query.brands.split(',') : undefined,
        dietary: query.dietary ? query.dietary.split(',') : undefined,
        origin: query.origin ? query.origin.split(',') : undefined,
        priceMin: query.priceMin ? Number(query.priceMin) : undefined,
        priceMax: query.priceMax ? Number(query.priceMax) : undefined,
        storeIds: query.storeIds ? query.storeIds.split(',').map(Number) : undefined
      }
    });
    
    return { ok: true, data: result };
  });

  /**
   * GET /api/filters/stats
   * Attribute statistics
   */
  app.get("/stats", async () => {
    const stats = await filterService.getAttributeStats();
    return { ok: true, data: stats };
  });
}
