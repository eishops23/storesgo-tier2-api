// ==========================================================
// STORESGO HOMEPAGE ROUTES — TASK GROUP 3 (Homepage Dynamic System)
// Provides complete data for storefront homepage
// ==========================================================

import type { FastifyInstance } from "fastify";
import {
  getHomepageFeed,
  getFeaturedProducts,
  getNewArrivals,
  getCategoriesWithCounts,
  getFeaturedSellers,
  getHomepageStats,
  getActiveDeals,
  getRecentBlogs,
  getHomepageConfig,
  getHomepageDataPayload,
} from "../services/homepage.service.js";
import * as cmsService from "../services/cms.service.js";

export default async function homepageRoutes(app: FastifyInstance) {
  /**
   * GET /api/homepage
   * Complete homepage data with structured payload
   * Returns: hero, featuredCategories, featuredProducts, blogSectionTitle, cta, footer
   */
  app.get("/", async () => {
    const data = await getHomepageDataPayload();
    return { ok: true, data };
  });

  /**
   * GET /api/homepage/feed
   * Complete homepage feed with all sections
   */
  app.get("/feed", async () => {
    const feed = await getHomepageFeed();
    return { ok: true, data: feed };
  });

  /**
   * GET /api/homepage/data
   * Alias for /feed (backward compatibility)
   */
  app.get("/data", async () => {
    const feed = await getHomepageFeed();
    return { ok: true, data: feed };
  });

  /**
   * GET /api/homepage/featured
   * Featured products for hero section
   */
  app.get("/featured", async (request) => {
    const limit = Number((request.query as any).limit) || 12;
    const products = await getFeaturedProducts(limit);
    return { ok: true, data: products };
  });

  /**
   * GET /api/homepage/new-arrivals
   * Recently added products
   */
  app.get("/new-arrivals", async (request) => {
    const limit = Number((request.query as any).limit) || 8;
    const products = await getNewArrivals(limit);
    return { ok: true, data: products };
  });

  /**
   * GET /api/homepage/new
   * Alias for new-arrivals (for frontend compatibility)
   */
  app.get("/new", async (request) => {
    const limit = Number((request.query as any).limit) || 8;
    const products = await getNewArrivals(limit);
    return { ok: true, data: products };
  });

  /**
   * GET /api/homepage/popular
   * Popular products (most viewed/best sellers)
   * For now, returns featured products as a proxy for popularity
   */
  app.get("/popular", async (request) => {
    const limit = Number((request.query as any).limit) || 12;
    const products = await getFeaturedProducts(limit);
    return { ok: true, data: products };
  });

  /**
   * GET /api/homepage/categories
   * Categories with product counts
   */
  app.get("/categories", async () => {
    const categories = await getCategoriesWithCounts();
    return { ok: true, data: categories };
  });

  /**
   * GET /api/homepage/sellers
   * Featured sellers
   */
  app.get("/sellers", async (request) => {
    const limit = Number((request.query as any).limit) || 6;
    const sellers = await getFeaturedSellers(limit);
    return { ok: true, data: sellers };
  });

  /**
   * GET /api/homepage/stats
   * Platform statistics
   */
  app.get("/stats", async () => {
    const stats = await getHomepageStats();
    return { ok: true, data: stats };
  });

  /**
   * GET /api/homepage/deals
   * Active seasonal deals
   */
  app.get("/deals", async () => {
    const deals = await getActiveDeals();
    return { ok: true, data: deals };
  });

  /**
   * GET /api/homepage/blogs
   * Recent blog posts for homepage
   */
  app.get("/blogs", async (request) => {
    const limit = Number((request.query as any).limit) || 4;
    const blogs = await getRecentBlogs(limit);
    return { ok: true, data: blogs };
  });

  /**
   * GET /api/homepage/cms
   * CMS content for homepage (hero, banners, etc.)
   */
  app.get("/cms", async () => {
    const content = await cmsService.getHomepageCmsContent();
    return { ok: true, data: content };
  });

  /**
   * GET /api/homepage/footer
   * Footer data (links and content)
   */
  app.get("/footer", async () => {
    const footer = await cmsService.getFooterData();
    return { ok: true, data: footer };
  });

  /**
   * GET /api/homepage/config
   * Get current homepage configuration (for admin)
   */
  app.get("/config", async () => {
    const config = await getHomepageConfig();
    return { ok: true, data: config };
  });

  app.log.info("📄 Homepage routes registered");
}
