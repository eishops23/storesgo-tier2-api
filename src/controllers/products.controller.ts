// ==========================================================
// STORESGO PRODUCTS CONTROLLER — PHASE 18 ENHANCED
// Consistent response format with proper error handling
// ==========================================================

import type { FastifyReply, FastifyRequest } from "fastify";
import {
  listProducts,
  getProductById,
  getProductByIdOrSlug,
  getProductsBySeller,
  getProductsByCategory,
  searchProducts,
  getRecommendedProducts,
  getRelatedProducts,
} from "../services/products.service.js";
import { buildPaginatedResponse } from "../utils/pagination.js";

/**
 * GET /api/products
 * List all products with pagination
 */
export async function listProductsHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const result = await listProducts(request.query as any);
  reply.send(
    buildPaginatedResponse(result.items, result.page, result.pageSize, result.total)
  );
}

/**
 * GET /api/products/:id
 * Get single product by ID
 * Returns: product + images + seller + taxonomy
 * 404 if not found
 */
/**
 * GET /api/products/:identifier
 * Get single product by ID or slug
 * - Supports: /products/123 and /products/product-name-123
 * - If accessed by ID and product has slug: includes redirect hint
 * - Returns: product + images + seller + category
 * - 404 if not found
 */
export async function getProductByIdHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const identifier = String((request.params as any).id);

  if (!identifier) {
    reply.status(400).send({ ok: false, error: "Invalid product identifier" });
    return;
  }

  const { product, shouldRedirect, canonicalSlug } = await getProductByIdOrSlug(identifier);

  if (!product) {
    reply.status(404).send({ ok: false, error: "Product not found" });
    return;
  }

  // Include canonical URL for SEO - frontend can use for redirects/meta tags
  reply.send({ 
    ok: true, 
    data: product,
    canonical: canonicalSlug ? `/products/${canonicalSlug}` : null
  });
}

/**
 * GET /api/products/seller/:sellerId
 * List products by seller
 */
export async function listProductsBySellerHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const sellerId = Number((request.params as any).sellerId);

  if (isNaN(sellerId) || sellerId <= 0) {
    reply.status(400).send({ ok: false, error: "Invalid seller ID" });
    return;
  }

  const result = await getProductsBySeller(sellerId, request.query as any);
  reply.send(
    buildPaginatedResponse(result.items, result.page, result.pageSize, result.total)
  );
}

/**
 * GET /api/products/category/:categoryId
 * List products by category ID
 */
export async function listProductsByCategoryHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const categoryId = Number((request.params as any).categoryId);

  if (isNaN(categoryId) || categoryId <= 0) {
    reply.status(400).send({ ok: false, error: "Invalid category ID" });
    return;
  }

  const result = await getProductsByCategory(categoryId, request.query as any);
  reply.send(
    buildPaginatedResponse(result.items, result.page, result.pageSize, result.total)
  );
}

/**
 * GET /api/products/search
 * Search products (legacy endpoint)
 */
export async function searchProductsHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const result = await searchProducts(request.query as any);
  reply.send(
    buildPaginatedResponse(result.items, result.page, result.pageSize, result.total)
  );
}

/**
 * GET /api/products/:id/recommend
 * Get recommended products for a product
 */
export async function recommendProductsHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const id = Number((request.params as any).id);

  if (isNaN(id) || id <= 0) {
    reply.status(400).send({ ok: false, error: "Invalid product ID" });
    return;
  }

  const limit = Number((request.query as any).limit) || 8;
  const items = await getRecommendedProducts(id, limit);
  reply.send({ ok: true, data: items });
}

// Alias for routes that use getRecommendedProductsHandler
export const getRecommendedProductsHandler = recommendProductsHandler;

/**
 * GET /api/products/:id/related
 * Get related products from the same taxonomy/category (4-8 items)
 */
export async function getRelatedProductsHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const id = Number((request.params as any).id);

  if (isNaN(id) || id <= 0) {
    reply.status(400).send({ ok: false, error: "Invalid product ID" });
    return;
  }

  const limit = Math.min(Math.max(4, Number((request.query as any).limit) || 8), 8);
  const items = await getRelatedProducts(id, limit);
  reply.send({ ok: true, data: items });
}
