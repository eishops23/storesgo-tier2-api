// ==========================================================
// STORESGO ADMIN PRODUCTS SERVICE — PHASE 7B
// Admin-only product moderation services
// ==========================================================

import { prisma } from "../plugins/prisma.js";
import { getPagination } from "../utils/pagination.js";

// ---------------------------------------------------------
// TYPES
// ---------------------------------------------------------

export interface AdminProductListQuery {
  page?: number;
  pageSize?: number;
  status?: string;
  sellerId?: number;
  q?: string;
}

export interface AdminProductUpdateData {
  name?: string;
  description?: string;
  priceCents?: number;
  imageUrl?: string;
  status?: string;
  isActive?: boolean;
  categoryId?: number;
}

interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

// ---------------------------------------------------------
// LIST PRODUCTS (ADMIN)
// ---------------------------------------------------------

/**
 * List all products for admin with filtering and pagination
 * Includes pending/rejected products unlike public endpoints
 */
export async function listAdminProducts(
  query: AdminProductListQuery
): Promise<PaginatedResult<any>> {
  const { page, pageSize, skip, take } = getPagination({
    page: query.page,
    pageSize: query.pageSize,
  });

  const where: any = {};

  // Filter by status
  if (query.status) {
    where.status = query.status;
  }

  // Filter by seller
  if (query.sellerId) {
    where.sellerId = Number(query.sellerId);
  }

  // Search by name or SKU
  if (query.q) {
    where.OR = [
      { name: { contains: query.q, mode: "insensitive" } },
      { sku: { contains: query.q, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        seller: { select: { id: true, storeName: true, slug: true } },
      },
    }),
    prisma.product.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

// ---------------------------------------------------------
// GET PRODUCT BY ID (ADMIN)
// ---------------------------------------------------------

/**
 * Get product by ID with related seller and category
 */
export async function getAdminProductById(id: number) {
  return prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      seller: {
        select: {
          id: true,
          storeName: true,
          slug: true,
          city: true,
          state: true,
          country: true,
          isApproved: true,
        },
      },
      store: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  });
}

// ---------------------------------------------------------
// UPDATE PRODUCT (ADMIN)
// ---------------------------------------------------------

/**
 * Allowed fields for admin product updates
 */
const ALLOWED_UPDATE_FIELDS = [
  "name",
  "description",
  "priceCents",
  "imageUrl",
  "status",
  "isActive",
  "categoryId",
];

/**
 * Update product with safe field validation
 * Only allows updating specific fields
 */
export async function updateAdminProduct(
  id: number,
  data: AdminProductUpdateData
) {
  // Filter to only allowed fields
  const safeData: Record<string, any> = {};

  for (const field of ALLOWED_UPDATE_FIELDS) {
    if (data[field as keyof AdminProductUpdateData] !== undefined) {
      safeData[field] = data[field as keyof AdminProductUpdateData];
    }
  }

  // Validate priceCents is positive if provided
  if (safeData.priceCents !== undefined && safeData.priceCents < 0) {
    throw new Error("Price must be a positive value");
  }

  return prisma.product.update({
    where: { id },
    data: safeData,
    include: {
      category: { select: { id: true, name: true, slug: true } },
      seller: { select: { id: true, storeName: true, slug: true } },
    },
  });
}

// ---------------------------------------------------------
// APPROVE PRODUCT (ADMIN)
// ---------------------------------------------------------

/**
 * Approve a product
 * Sets status to APPROVED and isActive to true
 */
export async function approveAdminProduct(id: number) {
  return prisma.product.update({
    where: { id },
    data: {
      status: "APPROVED",
      isActive: true,
    },
  });
}

// ---------------------------------------------------------
// REJECT PRODUCT (ADMIN)
// ---------------------------------------------------------

/**
 * Reject a product
 * Sets status to REJECTED and isActive to false
 */
export async function rejectAdminProduct(id: number) {
  return prisma.product.update({
    where: { id },
    data: {
      status: "REJECTED",
      isActive: false,
    },
  });
}

