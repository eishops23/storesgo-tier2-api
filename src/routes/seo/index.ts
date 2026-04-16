// ==========================================================
// STORESGO SEO ROUTES — PHASE 6
// Public routes for SEO pages, blog content, and deals
// ==========================================================

import type { FastifyInstance } from "fastify";
import {
  listSeoPages,
  getSeoPageBySlug,
  listSeasonalDeals,
  getSeasonalDealById,
} from "../../services/seo.service.js";
import { buildPaginatedResponse } from "../../utils/pagination.js";

export default async function seoRoutes(app: FastifyInstance) {
  // ---------------------------------------------------------
  // SEO PAGES / BLOG / GUIDES
  // ---------------------------------------------------------

  /**
   * GET /api/seo/pages
   * List all published SEO pages with pagination
   * Query params: page, pageSize, q (search)
   */
  app.get("/pages", async (request, reply) => {
    const result = await listSeoPages(request.query as any);
    reply.send(
      buildPaginatedResponse(result.items, result.page, result.pageSize, result.total)
    );
  });

  /**
   * GET /api/seo/pages/:slug
   * Get SEO page by slug
   */
  app.get("/pages/:slug", async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const page = await getSeoPageBySlug(slug);

    if (!page) {
      reply.status(404).send({ error: "Page not found" });
      return;
    }

    reply.send({ data: page });
  });

  // ---------------------------------------------------------
  // BLOG ALIAS (same as pages, for convenience)
  // ---------------------------------------------------------

  /**
   * GET /api/seo/blog
   * Alias for /pages - list all blog posts
   */
  app.get("/blog", async (request, reply) => {
    const result = await listSeoPages(request.query as any);
    reply.send(
      buildPaginatedResponse(result.items, result.page, result.pageSize, result.total)
    );
  });

  /**
   * GET /api/seo/blog/:slug
   * Alias for /pages/:slug
   */
  app.get("/blog/:slug", async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const page = await getSeoPageBySlug(slug);

    if (!page) {
      reply.status(404).send({ error: "Blog post not found" });
      return;
    }

    reply.send({ data: page });
  });

  // ---------------------------------------------------------
  // GUIDES ALIAS (same as pages, for convenience)
  // ---------------------------------------------------------

  /**
   * GET /api/seo/guides
   * Alias for /pages - list all guides
   */
  app.get("/guides", async (request, reply) => {
    const result = await listSeoPages(request.query as any);
    reply.send(
      buildPaginatedResponse(result.items, result.page, result.pageSize, result.total)
    );
  });

  /**
   * GET /api/seo/guides/:slug
   * Alias for /pages/:slug
   */
  app.get("/guides/:slug", async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const page = await getSeoPageBySlug(slug);

    if (!page) {
      reply.status(404).send({ error: "Guide not found" });
      return;
    }

    reply.send({ data: page });
  });

  // ---------------------------------------------------------
  // SEASONAL DEALS
  // ---------------------------------------------------------

  /**
   * GET /api/seo/deals
   * List active seasonal deals with pagination
   * Query params: page, pageSize
   */
  app.get("/deals", async (request, reply) => {
    const result = await listSeasonalDeals(request.query as any);
    reply.send(
      buildPaginatedResponse(result.items, result.page, result.pageSize, result.total)
    );
  });

  /**
   * GET /api/seo/deals/:id
   * Get seasonal deal by ID
   */
  app.get("/deals/:id", async (request, reply) => {
    const id = Number((request.params as any).id);
    const deal = await getSeasonalDealById(id);

    if (!deal) {
      reply.status(404).send({ error: "Deal not found" });
      return;
    }

    reply.send({ data: deal });
  });

  app.log.info("📄 SEO routes registered");
}

