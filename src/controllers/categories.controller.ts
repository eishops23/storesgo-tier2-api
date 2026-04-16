// ==========================================================
// STORESGO CATEGORIES CONTROLLER — PHASE 18 ENHANCED
// Handles category listing, detail, and products by slug
// ==========================================================

import type { FastifyRequest, FastifyReply } from "fastify";
import {
  getAllCategories,
  getAllCategoriesWithCounts,
  getCategoryBySlug,
  getProductsByCategorySlug,
} from "../services/categories.service.js";
import { buildPaginatedResponse } from "../utils/pagination.js";

/**
 * GET /api/categories
 * Returns all parent categories with their children (subcategories)
 */
export async function listCategoriesHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const categories = await getAllCategoriesWithCounts();
  reply.send({ ok: true, data: categories });
}

/**
 * GET /api/categories/:slug
 * Returns category detail with children and breadcrumb
 */
export async function getCategoryDetailHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { slug } = request.params as { slug: string };
  const result = await getCategoryBySlug(slug);

  if (!result) {
    reply.status(404).send({ ok: false, error: "Category not found" });
    return;
  }

  reply.send({
    ok: true,
    data: {
      category: result.category,
      children: result.children,
      parentsBreadcrumb: result.parentsBreadcrumb,
    },
  });
}

/**
 * GET /api/categories/:slug/products
 * Returns paginated products for a category (by slug)
 * Includes: images, seller, taxonomy (category)
 */
export async function getCategoryProductsHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { slug } = request.params as { slug: string };
  const query = request.query as {
    page?: string;
    pageSize?: string;
    sort?: string;
    minPrice?: string;
    maxPrice?: string;
  };

  const result = await getProductsByCategorySlug(slug, {
    page: query.page ? parseInt(query.page, 10) : undefined,
    pageSize: query.pageSize ? parseInt(query.pageSize, 10) : undefined,
    sort: query.sort,
    minPrice: query.minPrice ? parseFloat(query.minPrice) : undefined,
    maxPrice: query.maxPrice ? parseFloat(query.maxPrice) : undefined,
  });

  if (!result) {
    reply.status(404).send({ ok: false, error: "Category not found" });
    return;
  }

  reply.send(
    buildPaginatedResponse(result.products, result.page, result.pageSize, result.total)
  );
}
