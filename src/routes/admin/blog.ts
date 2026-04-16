// ==========================================================
// STORESGO ADMIN BLOG ROUTES — PHASE 16
// Admin endpoints for blog post management and autoblog control
// ==========================================================

import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../../plugins/prisma.js";
import { buildPaginatedResponse } from "../../utils/pagination.js";
import { getPagination } from "../../utils/pagination.js";
import { runAutoblogOnce } from "../../jobs/autoblog.js";
import { getBlogPostStats } from "../../services/blog.service.js";

export default async function adminBlogRoutes(app: FastifyInstance) {
  // All routes require admin authentication
  app.addHook("preHandler", app.authenticateAdmin);

  // ---------------------------------------------------------
  // BLOG POST MANAGEMENT
  // ---------------------------------------------------------

  /**
   * GET /api/admin/blog
   * List all blog posts (including unpublished) with pagination
   */
  app.get("/", async (request: FastifyRequest, reply: FastifyReply) => {
    const query = request.query as {
      page?: number;
      pageSize?: number;
      q?: string;
      source?: string;
      published?: string;
    };

    const { page, pageSize, skip, take } = getPagination({
      page: query.page,
      pageSize: query.pageSize,
    });

    const where: any = {};

    if (query.q) {
      where.OR = [
        { title: { contains: query.q, mode: "insensitive" } },
        { slug: { contains: query.q, mode: "insensitive" } },
      ];
    }

    if (query.source) {
      where.source = query.source;
    }

    if (query.published !== undefined) {
      where.published = query.published === "true";
    }

    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          source: true,
          category: true,
          published: true,
          publishedAt: true,
          createdAt: true,
          updatedAt: true,
          sellerId: true,
          productId: true,
        },
      }),
      prisma.blogPost.count({ where }),
    ]);

    reply.send(buildPaginatedResponse(posts, page, pageSize, total));
  });

  /**
   * GET /api/admin/blog/stats
   * Get blog post statistics
   */
  app.get("/stats", async (request: FastifyRequest, reply: FastifyReply) => {
    const stats = await getBlogPostStats();
    reply.send({ ok: true, data: stats });
  });

  /**
   * GET /api/admin/blog/:id
   * Get single blog post by ID (including unpublished)
   */
  app.get("/:id", async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    const post = await prisma.blogPost.findUnique({
      where: { id: Number(id) },
    });

    if (!post) {
      return reply.status(404).send({ ok: false, error: "Blog post not found" });
    }

    reply.send({ ok: true, data: post });
  });

  /**
   * PUT /api/admin/blog/:id
   * Update a blog post
   */
  app.put("/:id", async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const body = request.body as {
      title?: string;
      contentHtml?: string;
      excerpt?: string;
      metaTitle?: string;
      metaDescription?: string;
      keywords?: string[];
      category?: string;
      tags?: string[];
      published?: boolean;
    };

    try {
      const post = await prisma.blogPost.update({
        where: { id: Number(id) },
        data: {
          ...body, keywords: body.keywords ? (Array.isArray(body.keywords) ? body.keywords : [body.keywords]) : undefined,
          publishedAt: body.published ? new Date() : undefined,
          updatedAt: new Date(),
        },
      });

      reply.send({ ok: true, data: post, message: "Blog post updated" });
    } catch (err: any) {
      reply.status(400).send({ ok: false, error: err.message });
    }
  });

  /**
   * DELETE /api/admin/blog/:id
   * Delete a blog post
   */
  app.delete("/:id", async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    try {
      await prisma.blogPost.delete({
        where: { id: Number(id) },
      });

      reply.send({ ok: true, message: "Blog post deleted" });
    } catch (err: any) {
      reply.status(400).send({ ok: false, error: err.message });
    }
  });

  /**
   * PUT /api/admin/blog/:id/publish
   * Publish a blog post
   */
  app.put("/:id/publish", async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    try {
      const post = await prisma.blogPost.update({
        where: { id: Number(id) },
        data: {
          published: true,
          publishedAt: new Date(),
        },
      });

      reply.send({ ok: true, data: post, message: "Blog post published" });
    } catch (err: any) {
      reply.status(400).send({ ok: false, error: err.message });
    }
  });

  /**
   * PUT /api/admin/blog/:id/unpublish
   * Unpublish a blog post
   */
  app.put("/:id/unpublish", async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    try {
      const post = await prisma.blogPost.update({
        where: { id: Number(id) },
        data: {
          published: false,
        },
      });

      reply.send({ ok: true, data: post, message: "Blog post unpublished" });
    } catch (err: any) {
      reply.status(400).send({ ok: false, error: err.message });
    }
  });

  // ---------------------------------------------------------
  // AUTOBLOG CONTROL
  // ---------------------------------------------------------

  /**
   * POST /api/admin/blog/autoblog/trigger
   * Manually trigger autoblog generation
   */
  app.post("/autoblog/trigger", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      app.log.info("📝 Manual autoblog trigger initiated by admin");

      const result = await runAutoblogOnce();

      if (result.created) {
        reply.send({
          ok: true,
          data: result,
          message: `Blog post created: ${result.slug}`,
        });
      } else {
        reply.send({
          ok: false,
          data: result,
          message: `Autoblog skipped: ${result.reason}`,
        });
      }
    } catch (err: any) {
      app.log.error({ err }, "❌ Autoblog trigger failed");
      reply.status(500).send({
        ok: false,
        error: err.message,
        message: "Autoblog generation failed",
      });
    }
  });

  /**
   * GET /api/admin/blog/autoblog/status
   * Check autoblog status (last generated, count today, etc.)
   */
  app.get("/autoblog/status", async (request: FastifyRequest, reply: FastifyReply) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [todayCount, lastPost, totalAutoblog] = await Promise.all([
      prisma.blogPost.count({
        where: {
          source: "autoblog",
          createdAt: { gte: today, lt: tomorrow },
        },
      }),
      prisma.blogPost.findFirst({
        where: { source: "autoblog" },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          slug: true,
          createdAt: true,
          published: true,
        },
      }),
      prisma.blogPost.count({ where: { source: "autoblog" } }),
    ]);

    reply.send({
      ok: true,
      data: {
        enabled: process.env.AUTOBLOG_ENABLED !== "false",
        schedule: process.env.AUTOBLOG_CRON_SCHEDULE || "0 0 * * *",
        postsToday: todayCount,
        totalAutoblogPosts: totalAutoblog,
        lastPost,
      },
    });
  });

  app.log.info("📝 Admin Blog routes registered");
}

