// ==========================================================
// STORESGO BLOG ROUTES — PHASE 16
// Public routes for AI-generated blog posts
// ==========================================================

import type { FastifyInstance } from "fastify";
import {
  listBlogPosts,
  getBlogPostBySlug,
  getRecentBlogPosts,
  getBlogCategories,
  getBlogTags,
  getRelatedBlogPosts,
  getBlogPostStats,
} from "../../services/blog.service.js";
import { buildPaginatedResponse } from "../../utils/pagination.js";

export default async function blogRoutes(app: FastifyInstance) {
  // ---------------------------------------------------------
  // PUBLIC BLOG ROUTES
  // ---------------------------------------------------------

  /**
   * GET /api/blog
   * List all published blog posts with pagination and filtering
   * Query params: page, pageSize, q (search), language, category, source, tag
   */
  app.get("/", async (request, reply) => {
    const query = request.query as {
      page?: number;
      pageSize?: number;
      q?: string;
      language?: string;
      category?: string;
      source?: string;
      tag?: string;
    };

    const result = await listBlogPosts(query);
    reply.send(
      buildPaginatedResponse(result.items, result.page, result.pageSize, result.total)
    );
  });

  /**
   * GET /api/blog/recent
   * Get recent blog posts (for widgets/sidebar)
   * Query params: limit (default 5), language (default 'en')
   */
  app.get("/recent", async (request, reply) => {
    const { limit = 5, language = "en" } = request.query as {
      limit?: number;
      language?: string;
    };

    const posts = await getRecentBlogPosts(Number(limit), language);
    reply.send({ data: posts });
  });

  /**
   * GET /api/blog/categories
   * Get list of blog categories with post counts
   */
  app.get("/categories", async (request, reply) => {
    const categories = await getBlogCategories();
    reply.send({ data: categories });
  });

  /**
   * GET /api/blog/tags
   * Get list of all unique blog tags
   */
  app.get("/tags", async (request, reply) => {
    const tags = await getBlogTags();
    reply.send({ data: tags });
  });

  /**
   * GET /api/blog/stats
   * Get blog post statistics (admin/dashboard use)
   */
  app.get("/stats", async (request, reply) => {
    const stats = await getBlogPostStats();
    reply.send({ data: stats });
  });

  /**
   * GET /api/blog/:slug
   * Get single blog post by slug
   */
  app.get("/:slug", async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const post = await getBlogPostBySlug(slug);

    if (!post) {
      reply.status(404).send({ error: "Blog post not found" });
      return;
    }

    reply.send({ data: post });
  });

  /**
   * GET /api/blog/:slug/related
   * Get related blog posts for a given post
   * Query params: limit (default 4)
   */
  app.get("/:slug/related", async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const { limit = 4 } = request.query as { limit?: number };

    const relatedPosts = await getRelatedBlogPosts(slug, Number(limit));
    reply.send({ data: relatedPosts });
  });

  app.log.info("📝 Blog routes registered");
}

