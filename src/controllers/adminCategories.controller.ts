// ==========================================================
// STORESGO ADMIN CATEGORIES CONTROLLER — PHASE 7D
// Admin-only category management handlers
// ==========================================================

import type { FastifyReply, FastifyRequest } from "fastify";
import {
  listAdminCategories,
  getAdminCategoryById,
  createAdminCategory,
  updateAdminCategory,
  deleteAdminCategory,
} from "../services/adminCategories.service.js";
import { buildPaginationInfo } from "../utils/pagination.js";

// ---------------------------------------------------------
// TYPES
// ---------------------------------------------------------

interface ListCategoriesQuery {
  page?: string;
  pageSize?: string;
  q?: string;
}

interface CategoryIdParams {
  id: string;
}

interface CreateCategoryBody {
  name: string;
  slug: string;
  icon?: string;
  image?: string;
  tagline?: string;
  color?: string;
  sortOrder?: number;
  parentId?: number;
}

interface UpdateCategoryBody {
  name?: string;
  slug?: string;
  icon?: string;
  image?: string;
  tagline?: string;
  color?: string;
  sortOrder?: number;
  parentId?: number;
}

// ---------------------------------------------------------
// LIST CATEGORIES
// ---------------------------------------------------------

/**
 * GET /api/admin/categories
 * List all categories with filters for admin
 */
export async function listAdminCategoriesHandler(
  request: FastifyRequest<{ Querystring: ListCategoriesQuery }>,
  reply: FastifyReply
) {
  try {
    const { page, pageSize, q } = request.query;

    const result = await listAdminCategories({
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      q,
    });

    return reply.send({
      ok: true,
      data: result.items,
      pagination: buildPaginationInfo(result.page, result.pageSize, result.total),
    });
  } catch (err) {
    request.log.error(err, "Failed to list admin categories");
    return reply.status(500).send({
      ok: false,
      message: "Failed to list categories",
    });
  }
}

// ---------------------------------------------------------
// GET CATEGORY BY ID
// ---------------------------------------------------------

/**
 * GET /api/admin/categories/:id
 * Get category details for admin
 */
export async function getAdminCategoryByIdHandler(
  request: FastifyRequest<{ Params: CategoryIdParams }>,
  reply: FastifyReply
) {
  try {
    const id = Number(request.params.id);

    if (isNaN(id) || id <= 0) {
      return reply.status(400).send({
        ok: false,
        message: "Invalid category ID",
      });
    }

    const category = await getAdminCategoryById(id);

    if (!category) {
      return reply.status(404).send({
        ok: false,
        message: "Category not found",
      });
    }

    return reply.send({
      ok: true,
      data: category,
    });
  } catch (err) {
    request.log.error(err, "Failed to get admin category");
    return reply.status(500).send({
      ok: false,
      message: "Failed to get category",
    });
  }
}

// ---------------------------------------------------------
// CREATE CATEGORY
// ---------------------------------------------------------

/**
 * POST /api/admin/categories
 * Create a new category
 */
export async function createAdminCategoryHandler(
  request: FastifyRequest<{ Body: CreateCategoryBody }>,
  reply: FastifyReply
) {
  try {
    const body = request.body as CreateCategoryBody;

    // Validate required fields
    if (!body?.name || !body?.slug) {
      return reply.status(400).send({
        ok: false,
        message: "Name and slug are required",
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

    const category = await createAdminCategory({
      name: body.name,
      slug: body.slug,
      icon: body.icon,
      image: body.image,
      tagline: body.tagline,
      color: body.color,
      sortOrder: body.sortOrder,
      parentId: body.parentId,
    });

    return reply.status(201).send({
      ok: true,
      data: category,
    });
  } catch (err: any) {
    request.log.error(err, "Failed to create admin category");

    // Handle unique constraint violation
    if (err.code === "P2002") {
      return reply.status(400).send({
        ok: false,
        message: "Category slug already exists",
      });
    }

    return reply.status(400).send({
      ok: false,
      message: err.message || "Failed to create category",
    });
  }
}

// ---------------------------------------------------------
// UPDATE CATEGORY
// ---------------------------------------------------------

/**
 * PATCH /api/admin/categories/:id
 * Update category fields (admin)
 */
export async function updateAdminCategoryHandler(
  request: FastifyRequest<{ Params: CategoryIdParams; Body: UpdateCategoryBody }>,
  reply: FastifyReply
) {
  try {
    const id = Number(request.params.id);

    if (isNaN(id) || id <= 0) {
      return reply.status(400).send({
        ok: false,
        message: "Invalid category ID",
      });
    }

    // Check if category exists first
    const existing = await getAdminCategoryById(id);
    if (!existing) {
      return reply.status(404).send({
        ok: false,
        message: "Category not found",
      });
    }

    const body = request.body as UpdateCategoryBody;

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

    // Build update data
    const updateData: UpdateCategoryBody = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.slug !== undefined) updateData.slug = body.slug;
    if (body.icon !== undefined) updateData.icon = body.icon;
    if (body.image !== undefined) updateData.image = body.image;
    if (body.tagline !== undefined) updateData.tagline = body.tagline;
    if (body.color !== undefined) updateData.color = body.color;
    if (body.sortOrder !== undefined) updateData.sortOrder = body.sortOrder;
    if (body.parentId !== undefined) updateData.parentId = body.parentId;

    const category = await updateAdminCategory(id, updateData);

    return reply.send({
      ok: true,
      data: category,
    });
  } catch (err: any) {
    request.log.error(err, "Failed to update admin category");

    if (err.code === "P2002") {
      return reply.status(400).send({
        ok: false,
        message: "Category slug already exists",
      });
    }

    if (err.code === "P2025") {
      return reply.status(404).send({
        ok: false,
        message: "Category not found",
      });
    }

    return reply.status(400).send({
      ok: false,
      message: err.message || "Failed to update category",
    });
  }
}

// ---------------------------------------------------------
// DELETE CATEGORY
// ---------------------------------------------------------

/**
 * DELETE /api/admin/categories/:id
 * Delete a category (fails if products are linked)
 */
export async function deleteAdminCategoryHandler(
  request: FastifyRequest<{ Params: CategoryIdParams }>,
  reply: FastifyReply
) {
  try {
    const id = Number(request.params.id);

    if (isNaN(id) || id <= 0) {
      return reply.status(400).send({
        ok: false,
        message: "Invalid category ID",
      });
    }

    // Check if category exists first
    const existing = await getAdminCategoryById(id);
    if (!existing) {
      return reply.status(404).send({
        ok: false,
        message: "Category not found",
      });
    }

    await deleteAdminCategory(id);

    return reply.send({
      ok: true,
      message: "Category deleted successfully",
    });
  } catch (err: any) {
    request.log.error(err, "Failed to delete admin category");

    if (err.code === "P2025") {
      return reply.status(404).send({
        ok: false,
        message: "Category not found",
      });
    }

    // Handle linked products error
    if (err.message && err.message.includes("Cannot delete category")) {
      return reply.status(400).send({
        ok: false,
        message: err.message,
      });
    }

    return reply.status(400).send({
      ok: false,
      message: "Failed to delete category",
    });
  }
}

