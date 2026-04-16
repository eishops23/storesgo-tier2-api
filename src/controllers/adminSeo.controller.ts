// ==========================================================
// STORESGO ADMIN SEO CONTROLLER — PHASE 7D
// Admin-only SEO page management handlers
// ==========================================================

import type { FastifyReply, FastifyRequest } from "fastify";
import {
  listAdminSeoPages,
  getAdminSeoPageById,
  createAdminSeoPage,
  updateAdminSeoPage,
  deleteAdminSeoPage,
  type SeoPageType,
} from "../services/adminSeo.service.js";
import { buildPaginationInfo } from "../utils/pagination.js";

// ---------------------------------------------------------
// TYPES
// ---------------------------------------------------------

interface ListSeoPagesQuery {
  page?: string;
  pageSize?: string;
  type?: string;
  published?: string;
  q?: string;
}

interface SeoPageIdParams {
  id: string;
}

interface CreateSeoPageBody {
  type?: string;
  slug: string;
  title: string;
  content?: string;
  metaTitle?: string;
  metaDescription?: string;
  published?: boolean;
  publishedAt?: string;
}

interface UpdateSeoPageBody {
  type?: string;
  slug?: string;
  title?: string;
  content?: string;
  metaTitle?: string;
  metaDescription?: string;
  published?: boolean;
  publishedAt?: string | null;
}

// Valid SEO page types
const VALID_SEO_TYPES: SeoPageType[] = ["page", "blog", "guide", "deal", "landing"];

// ---------------------------------------------------------
// LIST SEO PAGES
// ---------------------------------------------------------

/**
 * GET /api/admin/seo/pages
 * List all SEO pages with filters for admin
 */
export async function listAdminSeoPagesHandler(
  request: FastifyRequest<{ Querystring: ListSeoPagesQuery }>,
  reply: FastifyReply
) {
  try {
    const { page, pageSize, type, published, q } = request.query;

    // Validate type if provided
    if (type && !VALID_SEO_TYPES.includes(type as SeoPageType)) {
      return reply.status(400).send({
        ok: false,
        message: `Invalid type. Must be one of: ${VALID_SEO_TYPES.join(", ")}`,
      });
    }

    // Parse published flag
    let publishedBool: boolean | undefined;
    if (published === "true") publishedBool = true;
    else if (published === "false") publishedBool = false;

    const result = await listAdminSeoPages({
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      type,
      published: publishedBool,
      q,
    });

    return reply.send({
      ok: true,
      data: result.items,
      pagination: buildPaginationInfo(result.page, result.pageSize, result.total),
    });
  } catch (err) {
    request.log.error(err, "Failed to list admin SEO pages");
    return reply.status(500).send({
      ok: false,
      message: "Failed to list SEO pages",
    });
  }
}

// ---------------------------------------------------------
// GET SEO PAGE BY ID
// ---------------------------------------------------------

/**
 * GET /api/admin/seo/pages/:id
 * Get SEO page details for admin
 */
export async function getAdminSeoPageByIdHandler(
  request: FastifyRequest<{ Params: SeoPageIdParams }>,
  reply: FastifyReply
) {
  try {
    const id = Number(request.params.id);

    if (isNaN(id) || id <= 0) {
      return reply.status(400).send({
        ok: false,
        message: "Invalid SEO page ID",
      });
    }

    const page = await getAdminSeoPageById(id);

    if (!page) {
      return reply.status(404).send({
        ok: false,
        message: "SEO page not found",
      });
    }

    return reply.send({
      ok: true,
      data: page,
    });
  } catch (err) {
    request.log.error(err, "Failed to get admin SEO page");
    return reply.status(500).send({
      ok: false,
      message: "Failed to get SEO page",
    });
  }
}

// ---------------------------------------------------------
// CREATE SEO PAGE
// ---------------------------------------------------------

/**
 * POST /api/admin/seo/pages
 * Create a new SEO page
 */
export async function createAdminSeoPageHandler(
  request: FastifyRequest<{ Body: CreateSeoPageBody }>,
  reply: FastifyReply
) {
  try {
    const body = request.body as CreateSeoPageBody;

    // Validate required fields
    if (!body?.title || !body?.slug) {
      return reply.status(400).send({
        ok: false,
        message: "Title and slug are required",
      });
    }

    // Validate type if provided
    if (body.type && !VALID_SEO_TYPES.includes(body.type as SeoPageType)) {
      return reply.status(400).send({
        ok: false,
        message: `Invalid type. Must be one of: ${VALID_SEO_TYPES.join(", ")}`,
      });
    }

    // Validate slug format (lowercase, alphanumeric with hyphens)
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(body.slug)) {
      return reply.status(400).send({
        ok: false,
        message: "Invalid slug format. Use lowercase letters, numbers, and hyphens only",
      });
    }

    // Parse publishedAt if provided
    let publishedAt: Date | undefined;
    if (body.publishedAt) {
      publishedAt = new Date(body.publishedAt);
      if (isNaN(publishedAt.getTime())) {
        return reply.status(400).send({
          ok: false,
          message: "Invalid publishedAt date format",
        });
      }
    }

    const page = await createAdminSeoPage({
      type: body.type,
      slug: body.slug,
      title: body.title,
      content: body.content,
      metaTitle: body.metaTitle,
      metaDescription: body.metaDescription,
      published: body.published,
      publishedAt,
    });

    return reply.status(201).send({
      ok: true,
      data: page,
    });
  } catch (err: any) {
    request.log.error(err, "Failed to create admin SEO page");

    // Handle unique constraint violation
    if (err.code === "P2002") {
      return reply.status(400).send({
        ok: false,
        message: "SEO page slug already exists",
      });
    }

    return reply.status(400).send({
      ok: false,
      message: err.message || "Failed to create SEO page",
    });
  }
}

// ---------------------------------------------------------
// UPDATE SEO PAGE
// ---------------------------------------------------------

/**
 * PATCH /api/admin/seo/pages/:id
 * Update SEO page fields (admin)
 */
export async function updateAdminSeoPageHandler(
  request: FastifyRequest<{ Params: SeoPageIdParams; Body: UpdateSeoPageBody }>,
  reply: FastifyReply
) {
  try {
    const id = Number(request.params.id);

    if (isNaN(id) || id <= 0) {
      return reply.status(400).send({
        ok: false,
        message: "Invalid SEO page ID",
      });
    }

    // Check if SEO page exists first
    const existing = await getAdminSeoPageById(id);
    if (!existing) {
      return reply.status(404).send({
        ok: false,
        message: "SEO page not found",
      });
    }

    const body = request.body as UpdateSeoPageBody;

    // Validate type if provided
    if (body.type && !VALID_SEO_TYPES.includes(body.type as SeoPageType)) {
      return reply.status(400).send({
        ok: false,
        message: `Invalid type. Must be one of: ${VALID_SEO_TYPES.join(", ")}`,
      });
    }

    // Validate slug format if provided
    if (body.slug) {
      const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
      if (!slugRegex.test(body.slug)) {
        return reply.status(400).send({
          ok: false,
          message: "Invalid slug format. Use lowercase letters, numbers, and hyphens only",
        });
      }
    }

    // Parse publishedAt if provided
    let publishedAt: Date | null | undefined;
    if (body.publishedAt !== undefined) {
      if (body.publishedAt === null) {
        publishedAt = null;
      } else {
        publishedAt = new Date(body.publishedAt);
        if (isNaN(publishedAt.getTime())) {
          return reply.status(400).send({
            ok: false,
            message: "Invalid publishedAt date format",
          });
        }
      }
    }

    // Build update data
    const updateData: any = {};
    if (body.type !== undefined) updateData.type = body.type;
    if (body.slug !== undefined) updateData.slug = body.slug;
    if (body.title !== undefined) updateData.title = body.title;
    if (body.content !== undefined) updateData.content = body.content;
    if (body.metaTitle !== undefined) updateData.metaTitle = body.metaTitle;
    if (body.metaDescription !== undefined) updateData.metaDescription = body.metaDescription;
    if (body.published !== undefined) updateData.published = body.published;
    if (publishedAt !== undefined) updateData.publishedAt = publishedAt;

    const page = await updateAdminSeoPage(id, updateData);

    return reply.send({
      ok: true,
      data: page,
    });
  } catch (err: any) {
    request.log.error(err, "Failed to update admin SEO page");

    if (err.code === "P2002") {
      return reply.status(400).send({
        ok: false,
        message: "SEO page slug already exists",
      });
    }

    if (err.code === "P2025") {
      return reply.status(404).send({
        ok: false,
        message: "SEO page not found",
      });
    }

    return reply.status(400).send({
      ok: false,
      message: err.message || "Failed to update SEO page",
    });
  }
}

// ---------------------------------------------------------
// DELETE SEO PAGE
// ---------------------------------------------------------

/**
 * DELETE /api/admin/seo/pages/:id
 * Delete an SEO page
 */
export async function deleteAdminSeoPageHandler(
  request: FastifyRequest<{ Params: SeoPageIdParams }>,
  reply: FastifyReply
) {
  try {
    const id = Number(request.params.id);

    if (isNaN(id) || id <= 0) {
      return reply.status(400).send({
        ok: false,
        message: "Invalid SEO page ID",
      });
    }

    // Check if SEO page exists first
    const existing = await getAdminSeoPageById(id);
    if (!existing) {
      return reply.status(404).send({
        ok: false,
        message: "SEO page not found",
      });
    }

    await deleteAdminSeoPage(id);

    return reply.send({
      ok: true,
      message: "SEO page deleted successfully",
    });
  } catch (err: any) {
    request.log.error(err, "Failed to delete admin SEO page");

    if (err.code === "P2025") {
      return reply.status(404).send({
        ok: false,
        message: "SEO page not found",
      });
    }

    return reply.status(400).send({
      ok: false,
      message: "Failed to delete SEO page",
    });
  }
}

