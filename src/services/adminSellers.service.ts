// ==========================================================
// STORESGO ADMIN SELLERS SERVICE — PHASE 7C
// Admin-only seller management services
// ==========================================================

import { prisma } from "../plugins/prisma.js";
import { getPagination } from "../utils/pagination.js";

// ---------------------------------------------------------
// TYPES
// ---------------------------------------------------------

export type SellerStatus = "approved" | "pending" | "banned";

export interface AdminSellerListQuery {
  page?: number;
  pageSize?: number;
  status?: SellerStatus;
  q?: string;
}

export interface AdminSellerUpdateData {
  storeName?: string;
  about?: string;
  city?: string;
  state?: string;
  country?: string;
}

interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

// ---------------------------------------------------------
// STATUS MAPPING
// ---------------------------------------------------------

/**
 * Maps status query param to Prisma where clause
 * - "approved": isApproved = true AND isBanned = false
 * - "pending": isApproved = false AND isBanned = false
 * - "banned": isBanned = true
 */
function getStatusWhere(status: SellerStatus): Record<string, any> {
  switch (status) {
    case "approved":
      return { isApproved: true, isBanned: false };
    case "pending":
      return { isApproved: false, isBanned: false };
    case "banned":
      return { isBanned: true };
    default:
      return {};
  }
}

// ---------------------------------------------------------
// LIST SELLERS (ADMIN)
// ---------------------------------------------------------

/**
 * List all sellers for admin with filtering and pagination
 * Includes pending/banned sellers unlike public endpoints
 */
export async function listAdminSellers(
  query: AdminSellerListQuery
): Promise<PaginatedResult<any>> {
  const { page, pageSize, skip, take } = getPagination({
    page: query.page,
    pageSize: query.pageSize,
  });

  const where: any = {};

  // Filter by status (maps to isApproved/isBanned)
  if (query.status) {
    const statusWhere = getStatusWhere(query.status);
    Object.assign(where, statusWhere);
  }

  // Search by storeName or user email
  if (query.q) {
    where.OR = [
      { storeName: { contains: query.q, mode: "insensitive" } },
      { about: { contains: query.q, mode: "insensitive" } },
      { user: { email: { contains: query.q, mode: "insensitive" } } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.seller.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        storeName: true,
        slug: true,
        city: true,
        state: true,
        country: true,
        about: true,
        isApproved: true,
        isBanned: true,
        createdAt: true,
        updatedAt: true,
        user: { select: { email: true } },
        _count: { select: { products: true, orders: true } },
      },
    }),
    prisma.seller.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

// ---------------------------------------------------------
// GET SELLER BY ID (ADMIN)
// ---------------------------------------------------------

/**
 * Get seller by ID with counts and related user info
 */
export async function getAdminSellerById(id: number) {
  return prisma.seller.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, email: true, createdAt: true } },
      wallet: { select: { balanceCents: true, currency: true } },
      _count: {
        select: {
          products: true,
          orders: true,
          reviews: true,
        },
      },
    },
  });
}

// ---------------------------------------------------------
// UPDATE SELLER (ADMIN)
// ---------------------------------------------------------

/**
 * Allowed fields for admin seller profile updates
 */
const ALLOWED_UPDATE_FIELDS = [
  "storeName",
  "about",
  "city",
  "state",
  "country",
];

/**
 * Update seller profile with safe field validation
 * Only allows updating specific profile fields
 */
export async function updateAdminSeller(
  id: number,
  data: AdminSellerUpdateData
) {
  // Filter to only allowed fields
  const safeData: Record<string, any> = {};

  for (const field of ALLOWED_UPDATE_FIELDS) {
    if (data[field as keyof AdminSellerUpdateData] !== undefined) {
      safeData[field] = data[field as keyof AdminSellerUpdateData];
    }
  }

  return prisma.seller.update({
    where: { id },
    data: safeData,
    include: {
      user: { select: { email: true } },
      _count: { select: { products: true, orders: true } },
    },
  });
}

// ---------------------------------------------------------
// APPROVE SELLER (ADMIN)
// ---------------------------------------------------------

/**
 * Approve a seller
 * Sets isApproved to true and isBanned to false
 */
export async function approveAdminSeller(id: number) {
  return prisma.seller.update({
    where: { id },
    data: {
      isApproved: true,
      isBanned: false,
    },
  });
}

// ---------------------------------------------------------
// BAN SELLER (ADMIN)
// ---------------------------------------------------------

/**
 * Ban a seller
 * Sets isBanned to true and isApproved to false
 */
export async function banAdminSeller(id: number) {
  return prisma.seller.update({
    where: { id },
    data: {
      isBanned: true,
      isApproved: false,
    },
  });
}

