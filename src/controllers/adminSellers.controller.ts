// ==========================================================
// STORESGO ADMIN SELLERS CONTROLLER — PHASE 7C
// Admin-only seller management handlers
// ==========================================================

import type { FastifyReply, FastifyRequest } from "fastify";
import {
  listAdminSellers,
  getAdminSellerById,
  updateAdminSeller,
  approveAdminSeller,
  banAdminSeller,
  type SellerStatus,
} from "../services/adminSellers.service.js";
import { buildPaginationInfo } from "../utils/pagination.js";
import { notifySellerApproved, notifySellerBanned } from "../services/notifications.service.js";

// ---------------------------------------------------------
// TYPES
// ---------------------------------------------------------

interface ListSellersQuery {
  page?: string;
  pageSize?: string;
  status?: SellerStatus;
  q?: string;
}

interface SellerIdParams {
  id: string;
}

interface UpdateSellerBody {
  storeName?: string;
  about?: string;
  city?: string;
  state?: string;
  country?: string;
}

// ---------------------------------------------------------
// LIST SELLERS
// ---------------------------------------------------------

/**
 * GET /api/admin/sellers
 * List all sellers with filters for admin
 */
export async function listAdminSellersHandler(
  request: FastifyRequest<{ Querystring: ListSellersQuery }>,
  reply: FastifyReply
) {
  try {
    const { page, pageSize, status, q } = request.query;

    // Validate status if provided
    const validStatuses: SellerStatus[] = ["approved", "pending", "banned"];
    if (status && !validStatuses.includes(status)) {
      return reply.status(400).send({
        ok: false,
        message: "Invalid status. Must be one of: approved, pending, banned",
      });
    }

    const result = await listAdminSellers({
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      status,
      q,
    });

    return reply.send({
      ok: true,
      data: result.items,
      pagination: buildPaginationInfo(result.page, result.pageSize, result.total),
    });
  } catch (err) {
    request.log.error(err, "Failed to list admin sellers");
    return reply.status(500).send({
      ok: false,
      message: "Failed to list sellers",
    });
  }
}

// ---------------------------------------------------------
// GET SELLER BY ID
// ---------------------------------------------------------

/**
 * GET /api/admin/sellers/:id
 * Get seller details for admin
 */
export async function getAdminSellerByIdHandler(
  request: FastifyRequest<{ Params: SellerIdParams }>,
  reply: FastifyReply
) {
  try {
    const id = Number(request.params.id);

    if (isNaN(id) || id <= 0) {
      return reply.status(400).send({
        ok: false,
        message: "Invalid seller ID",
      });
    }

    const seller = await getAdminSellerById(id);

    if (!seller) {
      return reply.status(404).send({
        ok: false,
        message: "Seller not found",
      });
    }

    return reply.send({
      ok: true,
      data: seller,
    });
  } catch (err) {
    request.log.error(err, "Failed to get admin seller");
    return reply.status(500).send({
      ok: false,
      message: "Failed to get seller",
    });
  }
}

// ---------------------------------------------------------
// UPDATE SELLER
// ---------------------------------------------------------

/**
 * PATCH /api/admin/sellers/:id
 * Update seller profile fields (admin)
 */
export async function updateAdminSellerHandler(
  request: FastifyRequest<{ Params: SellerIdParams; Body: UpdateSellerBody }>,
  reply: FastifyReply
) {
  try {
    const id = Number(request.params.id);

    if (isNaN(id) || id <= 0) {
      return reply.status(400).send({
        ok: false,
        message: "Invalid seller ID",
      });
    }

    // Check if seller exists first
    const existing = await getAdminSellerById(id);
    if (!existing) {
      return reply.status(404).send({
        ok: false,
        message: "Seller not found",
      });
    }

    const body = request.body || {};

    // Validate incoming payload - only allow safe fields
    const { storeName, about, city, state, country } = body;

    const updateData: UpdateSellerBody = {};
    if (storeName !== undefined) updateData.storeName = storeName;
    if (about !== undefined) updateData.about = about;
    if (city !== undefined) updateData.city = city;
    if (state !== undefined) updateData.state = state;
    if (country !== undefined) updateData.country = country;

    const seller = await updateAdminSeller(id, updateData);

    return reply.send({
      ok: true,
      data: seller,
    });
  } catch (err: any) {
    request.log.error(err, "Failed to update admin seller");

    if (err.code === "P2025") {
      return reply.status(404).send({
        ok: false,
        message: "Seller not found",
      });
    }

    return reply.status(400).send({
      ok: false,
      message: err.message || "Failed to update seller",
    });
  }
}

// ---------------------------------------------------------
// APPROVE SELLER
// ---------------------------------------------------------

/**
 * POST /api/admin/sellers/:id/approve
 * Approve a seller (set isApproved=true, isBanned=false)
 */
export async function approveAdminSellerHandler(
  request: FastifyRequest<{ Params: SellerIdParams }>,
  reply: FastifyReply
) {
  try {
    const id = Number(request.params.id);

    if (isNaN(id) || id <= 0) {
      return reply.status(400).send({
        ok: false,
        message: "Invalid seller ID",
      });
    }

    // Check if seller exists first
    const existing = await getAdminSellerById(id);
    if (!existing) {
      return reply.status(404).send({
        ok: false,
        message: "Seller not found",
      });
    }

    const seller = await approveAdminSeller(id);

    // 🔔 Send approval notification to seller
    if (seller && existing.user?.email) {
      try {
        await notifySellerApproved({
          sellerId: id,
          sellerEmail: existing.user.email,
          storeName: seller.storeName,
        });
        request.log.info(`📧 Approval notification sent to seller ${existing.user.email}`);
      } catch (notifyErr: any) {
        request.log.warn(`⚠️ Failed to send approval notification: ${notifyErr.message}`);
      }
    }

    return reply.send({
      ok: true,
      data: seller,
      message: "Seller approved successfully",
    });
  } catch (err: any) {
    request.log.error(err, "Failed to approve seller");

    if (err.code === "P2025") {
      return reply.status(404).send({
        ok: false,
        message: "Seller not found",
      });
    }

    return reply.status(400).send({
      ok: false,
      message: "Failed to approve seller",
    });
  }
}

// ---------------------------------------------------------
// BAN SELLER
// ---------------------------------------------------------

/**
 * POST /api/admin/sellers/:id/ban
 * Ban a seller (set isBanned=true, isApproved=false)
 */
export async function banAdminSellerHandler(
  request: FastifyRequest<{ Params: SellerIdParams }>,
  reply: FastifyReply
) {
  try {
    const id = Number(request.params.id);

    if (isNaN(id) || id <= 0) {
      return reply.status(400).send({
        ok: false,
        message: "Invalid seller ID",
      });
    }

    // Check if seller exists first
    const existing = await getAdminSellerById(id);
    if (!existing) {
      return reply.status(404).send({
        ok: false,
        message: "Seller not found",
      });
    }

    const seller = await banAdminSeller(id);

    // 🔔 Send ban notification to seller
    if (seller && existing.user?.email) {
      try {
        await notifySellerBanned({
          sellerId: id,
          sellerEmail: existing.user.email,
          storeName: seller.storeName,
        });
        request.log.info(`📧 Ban notification sent to seller ${existing.user.email}`);
      } catch (notifyErr: any) {
        request.log.warn(`⚠️ Failed to send ban notification: ${notifyErr.message}`);
      }
    }

    return reply.send({
      ok: true,
      data: seller,
      message: "Seller banned successfully",
    });
  } catch (err: any) {
    request.log.error(err, "Failed to ban seller");

    if (err.code === "P2025") {
      return reply.status(404).send({
        ok: false,
        message: "Seller not found",
      });
    }

    return reply.status(400).send({
      ok: false,
      message: "Failed to ban seller",
    });
  }
}

