// ==========================================================
import { getIconWithInheritance } from "./icon.service.js";
// STORESGO ADMIN CATEGORIES SERVICE — PHASE 7D
// Admin-only category management services
// ==========================================================

import { prisma } from "../plugins/prisma.js";
import { getPagination } from "../utils/pagination.js";

// ---------------------------------------------------------
// TYPES
// ---------------------------------------------------------

export interface AdminCategoryListQuery {
  page?: number;
  pageSize?: number;
  q?: string;
}

export interface AdminCategoryCreateData {
  name: string;
  slug: string;
  icon?: string;
  image?: string;
  tagline?: string;
  color?: string;
  sortOrder?: number;
  parentId?: number;
}

export interface AdminCategoryUpdateData {
  name?: string;
  slug?: string;
  icon?: string;
  image?: string;
  tagline?: string;
  color?: string;
  sortOrder?: number;
  parentId?: number;
}

interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

// ---------------------------------------------------------
// LIST CATEGORIES (ADMIN)
// ---------------------------------------------------------

/**
 * List all categories for admin with filtering and pagination
 */
export async function listAdminCategories(
  query: AdminCategoryListQuery
): Promise<PaginatedResult<any>> {
  const { page, pageSize, skip, take } = getPagination({
    page: query.page,
    pageSize: query.pageSize,
  });

  const where: any = {};

  // Search by name or slug
  if (query.q) {
    where.OR = [
      { name: { contains: query.q, mode: "insensitive" } },
      { slug: { contains: query.q, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.category.findMany({
      where,
      skip,
      take,
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: {
        _count: { select: { products: true } },
      },
    }),
    prisma.category.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

// ---------------------------------------------------------
// GET CATEGORY BY ID (ADMIN)
// ---------------------------------------------------------

/**
 * Get category by ID with product count
 */
export async function getAdminCategoryById(id: number) {
  return prisma.category.findUnique({
    where: { id },
    include: {
      _count: { select: { products: true } },
    },
  });
}

// ---------------------------------------------------------
// CREATE CATEGORY (ADMIN)
// ---------------------------------------------------------

/**
 * Create a new category
 */
export async function createAdminCategory(data: AdminCategoryCreateData) {
  // Auto-assign icon if not provided
  let icon = data.icon;
  if (!icon || icon === "📦" || icon === "🛒") {
    icon = await getIconWithInheritance(data.name, data.slug, data.parentId || null);
  }
  
  return prisma.category.create({
    data: {
      name: data.name,
      slug: data.slug,
      icon: icon,
      image: data.image,
      tagline: data.tagline,
      color: data.color,
      sortOrder: data.sortOrder ?? 0,
      parentId: data.parentId,
    },
    include: {
      _count: { select: { products: true } },
    },
  });
}

// ---------------------------------------------------------
// UPDATE CATEGORY (ADMIN)
// ---------------------------------------------------------
/**
 * Update a category
 */
export async function updateAdminCategory(id: number, data: AdminCategoryUpdateData) {
  return prisma.category.update({
    where: { id },
    data: {
      name: data.name,
      slug: data.slug,
      icon: data.icon,
      image: data.image,
      tagline: data.tagline,
      color: data.color,
      sortOrder: data.sortOrder,
      parentId: data.parentId,
    },
    include: {
      _count: { select: { products: true } },
    },
  });
}

// ---------------------------------------------------------
// DELETE CATEGORY (ADMIN)
// ---------------------------------------------------------
/**
 * Delete a category
 */
export async function deleteAdminCategory(id: number) {
  // Check if category has products
  const count = await prisma.product.count({ where: { categoryId: id } });
  if (count > 0) {
    throw new Error(`Cannot delete category with ${count} products`);
  }
  
  // Check if category has children
  const childCount = await prisma.category.count({ where: { parentId: id } });
  if (childCount > 0) {
    throw new Error(`Cannot delete category with ${childCount} subcategories`);
  }
  
  return prisma.category.delete({ where: { id } });
}
