// ==========================================================
// STORESGO ADMIN PRODUCTS CONTROLLER — PHASE 7B
// Admin-only product moderation handlers
// ==========================================================

import type { FastifyReply, FastifyRequest } from "fastify";
import {
  listAdminProducts,
  getAdminProductById,
  updateAdminProduct,
  approveAdminProduct,
  rejectAdminProduct,
} from "../services/adminProducts.service.js";
import { buildPaginationInfo } from "../utils/pagination.js";

// ---------------------------------------------------------
// TYPES
// ---------------------------------------------------------

interface ListProductsQuery {
  page?: string;
  pageSize?: string;
  status?: string;
  sellerId?: string;
  q?: string;
}

interface ProductIdParams {
  id: string;
}

interface UpdateProductBody {
  name?: string;
  description?: string;
  priceCents?: number;
  imageUrl?: string;
  status?: string;
  isActive?: boolean;
  categoryId?: number;
}

// ---------------------------------------------------------
// LIST PRODUCTS
// ---------------------------------------------------------

/**
 * GET /api/admin/products
 * List all products with filters for admin
 */
export async function listAdminProductsHandler(
  request: FastifyRequest<{ Querystring: ListProductsQuery }>,
  reply: FastifyReply
) {
  try {
    const { page, pageSize, status, sellerId, q } = request.query;

    const result = await listAdminProducts({
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      status,
      sellerId: sellerId ? Number(sellerId) : undefined,
      q,
    });

    return reply.send({
      ok: true,
      data: result.items,
      pagination: buildPaginationInfo(result.page, result.pageSize, result.total),
    });
  } catch (err) {
    request.log.error(err, "Failed to list admin products");
    return reply.status(500).send({
      ok: false,
      message: "Failed to list products",
    });
  }
}

// ---------------------------------------------------------
// GET PRODUCT BY ID
// ---------------------------------------------------------

/**
 * GET /api/admin/products/:id
 * Get product details for admin
 */
export async function getAdminProductByIdHandler(
  request: FastifyRequest<{ Params: ProductIdParams }>,
  reply: FastifyReply
) {
  try {
    const id = Number(request.params.id);

    if (isNaN(id) || id <= 0) {
      return reply.status(400).send({
        ok: false,
        message: "Invalid product ID",
      });
    }

    const product = await getAdminProductById(id);

    if (!product) {
      return reply.status(404).send({
        ok: false,
        message: "Product not found",
      });
    }

    return reply.send({
      ok: true,
      data: product,
    });
  } catch (err) {
    request.log.error(err, "Failed to get admin product");
    return reply.status(500).send({
      ok: false,
      message: "Failed to get product",
    });
  }
}

// ---------------------------------------------------------
// UPDATE PRODUCT
// ---------------------------------------------------------

/**
 * PATCH /api/admin/products/:id
 * Update product fields (admin)
 */
export async function updateAdminProductHandler(
  request: FastifyRequest<{ Params: ProductIdParams; Body: UpdateProductBody }>,
  reply: FastifyReply
) {
  try {
    const id = Number(request.params.id);

    if (isNaN(id) || id <= 0) {
      return reply.status(400).send({
        ok: false,
        message: "Invalid product ID",
      });
    }

    // Check if product exists first
    const existing = await getAdminProductById(id);
    if (!existing) {
      return reply.status(404).send({
        ok: false,
        message: "Product not found",
      });
    }

    const body = request.body || {};

    // Validate incoming payload - only allow safe fields
    const {
      name,
      description,
      priceCents,
      imageUrl,
      status,
      isActive,
      categoryId,
    } = body;

    const updateData: UpdateProductBody = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (priceCents !== undefined) updateData.priceCents = priceCents;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (status !== undefined) updateData.status = status;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (categoryId !== undefined) updateData.categoryId = categoryId;

    const product = await updateAdminProduct(id, updateData);

    return reply.send({
      ok: true,
      product,
    });
  } catch (err: any) {
    request.log.error(err, "Failed to update admin product");

    if (err.code === "P2025") {
      return reply.status(404).send({
        ok: false,
        message: "Product not found",
      });
    }

    return reply.status(400).send({
      ok: false,
      message: err.message || "Failed to update product",
    });
  }
}

// ---------------------------------------------------------
// APPROVE PRODUCT
// ---------------------------------------------------------

/**
 * POST /api/admin/products/:id/approve
 * Approve a product (set status to APPROVED)
 */
export async function approveAdminProductHandler(
  request: FastifyRequest<{ Params: ProductIdParams }>,
  reply: FastifyReply
) {
  try {
    const id = Number(request.params.id);

    if (isNaN(id) || id <= 0) {
      return reply.status(400).send({
        ok: false,
        message: "Invalid product ID",
      });
    }

    // Check if product exists first
    const existing = await getAdminProductById(id);
    if (!existing) {
      return reply.status(404).send({
        ok: false,
        message: "Product not found",
      });
    }

    await approveAdminProduct(id);

    return reply.send({
      ok: true,
    });
  } catch (err: any) {
    request.log.error(err, "Failed to approve product");

    if (err.code === "P2025") {
      return reply.status(404).send({
        ok: false,
        message: "Product not found",
      });
    }

    return reply.status(400).send({
      ok: false,
      message: "Failed to approve product",
    });
  }
}

// ---------------------------------------------------------
// REJECT PRODUCT
// ---------------------------------------------------------

/**
 * POST /api/admin/products/:id/reject
 * Reject a product (set status to REJECTED)
 */
export async function rejectAdminProductHandler(
  request: FastifyRequest<{ Params: ProductIdParams }>,
  reply: FastifyReply
) {
  try {
    const id = Number(request.params.id);

    if (isNaN(id) || id <= 0) {
      return reply.status(400).send({
        ok: false,
        message: "Invalid product ID",
      });
    }

    // Check if product exists first
    const existing = await getAdminProductById(id);
    if (!existing) {
      return reply.status(404).send({
        ok: false,
        message: "Product not found",
      });
    }

    await rejectAdminProduct(id);

    return reply.send({
      ok: true,
    });
  } catch (err: any) {
    request.log.error(err, "Failed to reject product");

    if (err.code === "P2025") {
      return reply.status(404).send({
        ok: false,
        message: "Product not found",
      });
    }

    return reply.status(400).send({
      ok: false,
      message: "Failed to reject product",
    });
  }
}

