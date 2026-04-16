// ==========================================================
import { getIconWithInheritance, assignIconsToAllCategories } from "./icon.service.js";
// STORESGO ADMIN SERVICE — PHASE 7
// Admin authentication and management services
// ==========================================================

import { prisma } from "../plugins/prisma.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getPagination } from "../utils/pagination.js";

const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || "superadminsecret";

// ---------------------------------------------------------
// TYPES
// ---------------------------------------------------------

export interface AdminLoginInput {
  email: string;
  password: string;
}

export interface AdminTokenPayload {
  adminId: number;
  email: string;
  role: string;
}

interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

// ---------------------------------------------------------
// AUTH SERVICES
// ---------------------------------------------------------

/**
 * Authenticate admin and return JWT token
 */
export async function loginAdmin(input: AdminLoginInput): Promise<{
  token: string;
  admin: { id: number; email: string; role: string };
} | null> {
  const admin = await prisma.adminUser.findUnique({
    where: { email: input.email },
  });

  if (!admin) return null;

  const isValid = await bcrypt.compare(input.password, admin.password);
  if (!isValid) return null;

  const token = jwt.sign(
    {
      adminId: admin.id,
      email: admin.email,
      role: admin.role,
    } as AdminTokenPayload,
    ADMIN_JWT_SECRET,
    { expiresIn: "24h" }
  );

  return {
    token,
    admin: {
      id: admin.id,
      email: admin.email,
      role: admin.role,
    },
  };
}

/**
 * Verify admin token and return payload
 */
export function verifyAdminToken(token: string): AdminTokenPayload | null {
  try {
    const decoded = jwt.verify(token, ADMIN_JWT_SECRET) as AdminTokenPayload;
    // Accept both 'admin' and 'superadmin' roles
    const validRoles = ["admin", "superadmin"];
    if (!decoded.role || !validRoles.includes(decoded.role)) return null;
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Get admin by ID
 */
export async function getAdminById(id: number) {
  return prisma.adminUser.findUnique({
    where: { id },
    select: { id: true, email: true, role: true, createdAt: true },
  });
}

// ---------------------------------------------------------
// DASHBOARD STATS
// ---------------------------------------------------------

export interface DashboardStats {
  totalProducts: number;
  totalSellers: number;
  totalOrders: number;
  totalCategories: number;
  totalUsers: number;
  totalRevenueCents: number;
  pendingProducts: number;
  pendingSellers: number;
  pendingOrders: number;
  recentOrders: any[];
  recentProducts: any[];
}

/**
 * Get comprehensive admin dashboard statistics
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const [
    totalProducts,
    totalSellers,
    totalOrders,
    totalCategories,
    totalUsers,
    pendingProducts,
    pendingSellers,
    pendingOrders,
    revenueResult,
    recentOrders,
    recentProducts,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.seller.count(),
    prisma.order.count(),
    prisma.category.count(),
    prisma.user.count(),
    prisma.product.count({ where: { status: "pending" } }),
    prisma.seller.count({ where: { isApproved: false } }),
    prisma.order.count({ where: { status: "pending" } }),
    prisma.order.aggregate({ _sum: { totalAmountCents: true } }),
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        buyer: { select: { email: true } },
        seller: { select: { storeName: true } },
      },
    }),
    prisma.product.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        priceCents: true,
        status: true,
        createdAt: true,
        seller: { select: { storeName: true } },
      },
    }),
  ]);

  return {
    totalProducts,
    totalSellers,
    totalOrders,
    totalCategories,
    totalUsers,
    totalRevenueCents: revenueResult._sum.totalAmountCents || 0,
    pendingProducts,
    pendingSellers,
    pendingOrders,
    recentOrders,
    recentProducts,
  };
}

// ---------------------------------------------------------
// PRODUCT MANAGEMENT
// ---------------------------------------------------------

export interface AdminProductListQuery {
  page?: number;
  pageSize?: number;
  status?: string;
  sellerId?: number;
  categoryId?: number;
  q?: string;
}

/**
 * List all products for admin (includes pending)
 */
export async function listProductsAdmin(
  query: AdminProductListQuery
): Promise<PaginatedResult<any>> {
  const { page, pageSize, skip, take } = getPagination({
    page: query.page,
    pageSize: query.pageSize,
  });

  const where: any = {};

  if (query.status) where.status = query.status;
  if (query.sellerId) where.sellerId = Number(query.sellerId);
  if (query.categoryId) where.categoryId = Number(query.categoryId);
  if (query.q) {
    where.OR = [
      { name: { contains: query.q, mode: "insensitive" } },
      { description: { contains: query.q, mode: "insensitive" } },
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

/**
 * Get product by ID for admin
 */
export async function getProductAdmin(id: number) {
  return prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      seller: { select: { id: true, storeName: true, slug: true } },
      reviews: { take: 5, orderBy: { createdAt: "desc" } },
    },
  });
}

/**
 * Update product (admin)
 */
export async function updateProductAdmin(
  id: number,
  data: {
    name?: string;
    description?: string;
    priceCents?: number;
    status?: string;
    isActive?: boolean;
    categoryId?: number;
  }
) {
  return prisma.product.update({
    where: { id },
    data,
  });
}

/**
 * Approve product
 */
export async function approveProduct(id: number) {
  return prisma.product.update({
    where: { id },
    data: { status: "active", isActive: true },
  });
}

/**
 * Reject product
 */
export async function rejectProduct(id: number, reason?: string) {
  return prisma.product.update({
    where: { id },
    data: { status: "rejected", isActive: false },
  });
}

// ---------------------------------------------------------
// SELLER MANAGEMENT
// ---------------------------------------------------------

export interface AdminSellerListQuery {
  page?: number;
  pageSize?: number;
  isApproved?: boolean;
  q?: string;
}

/**
 * List all sellers for admin
 */
export async function listSellersAdmin(
  query: AdminSellerListQuery
): Promise<PaginatedResult<any>> {
  const { page, pageSize, skip, take } = getPagination({
    page: query.page,
    pageSize: query.pageSize,
  });

  const where: any = {};

  if (query.isApproved !== undefined) {
    where.isApproved = query.isApproved;
  }
  if (query.q) {
    where.OR = [
      { storeName: { contains: query.q, mode: "insensitive" } },
      { about: { contains: query.q, mode: "insensitive" } },
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
        createdAt: true,
        updatedAt: true,
        _count: { select: { products: true, orders: true } },
      },
    }),
    prisma.seller.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

/**
 * Get seller by ID for admin
 */
export async function getSellerAdmin(id: number) {
  return prisma.seller.findUnique({
    where: { id },
    include: {
      _count: { select: { products: true, orders: true, reviews: true } },
      wallet: true,
      user: { select: { email: true } },
    },
  });
}

/**
 * Update seller (admin)
 */
export async function updateSellerAdmin(
  id: number,
  data: {
    storeName?: string;
    about?: string;
    city?: string;
    state?: string;
    country?: string;
    isApproved?: boolean;
  }
) {
  return prisma.seller.update({
    where: { id },
    data,
  });
}

/**
 * Approve seller
 */
export async function approveSeller(id: number) {
  return prisma.seller.update({
    where: { id },
    data: { isApproved: true },
  });
}

/**
 * Ban/Reject seller
 */
export async function banSeller(id: number) {
  return prisma.seller.update({
    where: { id },
    data: { isApproved: false },
  });
}

// ---------------------------------------------------------
// CATEGORY MANAGEMENT
// ---------------------------------------------------------

/**
 * List all categories for admin
 */
export async function listCategoriesAdmin(): Promise<any[]> {
  return prisma.category.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { products: true } },
    },
  });
}

/**
 * Get category by ID
 */
export async function getCategoryAdmin(id: number) {
  return prisma.category.findUnique({
    where: { id },
    include: {
      _count: { select: { products: true } },
    },
  });
}

/**
 * Create category
 */
export async function createCategory(data: {
  name: string;
  slug: string;
  icon?: string;
  image?: string;
  tagline?: string;
  color?: string;
}) {
  const icon = data.icon || await getIconWithInheritance(data.name, data.slug, null);
  return prisma.category.create({ data: { ...data, icon } });
}

/**
 * Update category
 */
export async function updateCategory(
  id: number,
  data: {
    name?: string;
    slug?: string;
    icon?: string;
    image?: string;
    tagline?: string;
    color?: string;
  }
) {
  return prisma.category.update({
    where: { id },
    data,
  });
}

/**
 * Delete category
 */
export async function deleteCategory(id: number) {
  return prisma.category.delete({ where: { id } });
}

// ---------------------------------------------------------
// SEO PAGE MANAGEMENT
// ---------------------------------------------------------

export interface AdminSeoPageListQuery {
  page?: number;
  pageSize?: number;
  published?: boolean;
  q?: string;
}

/**
 * List all SEO pages for admin (includes unpublished)
 */
export async function listSeoPagesAdmin(
  query: AdminSeoPageListQuery
): Promise<PaginatedResult<any>> {
  const { page, pageSize, skip, take } = getPagination({
    page: query.page,
    pageSize: query.pageSize,
  });

  const where: any = {};

  if (query.published !== undefined) {
    where.published = query.published;
  }
  if (query.q) {
    where.OR = [
      { title: { contains: query.q, mode: "insensitive" } },
      { metaDescription: { contains: query.q, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.seoPage.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        metaTitle: true,
        metaDescription: true,
        published: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.seoPage.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

/**
 * Get SEO page by ID for admin
 */
export async function getSeoPageAdmin(id: number) {
  return prisma.seoPage.findUnique({
    where: { id },
  });
}

/**
 * Create SEO page
 */
export async function createSeoPage(data: {
  title: string;
  slug: string;
  metaTitle?: string;
  metaDescription?: string;
  contentHtml?: string;
  published?: boolean;
}) {
  return prisma.seoPage.create({
    data: {
      ...data,
      embedding: [], // Required field
    },
  });
}

/**
 * Update SEO page
 */
export async function updateSeoPage(
  id: number,
  data: {
    title?: string;
    slug?: string;
    metaTitle?: string;
    metaDescription?: string;
    contentHtml?: string;
    published?: boolean;
  }
) {
  return prisma.seoPage.update({
    where: { id },
    data,
  });
}

/**
 * Delete SEO page
 */
export async function deleteSeoPage(id: number) {
  return prisma.seoPage.delete({ where: { id } });
}

// ---------------------------------------------------------
// ORDER MANAGEMENT
// ---------------------------------------------------------

export interface AdminOrderListQuery {
  page?: number;
  pageSize?: number;
  status?: string;
  sellerId?: number;
  buyerId?: string;
  search?: string;
}

/**
 * List all orders for admin
 */
export async function listOrdersAdmin(
  query: AdminOrderListQuery
): Promise<PaginatedResult<any>> {
  const { page, pageSize, skip, take } = getPagination({
    page: query.page,
    pageSize: query.pageSize,
  });

  const where: any = {};

  // Search by order ID or buyer email
  if (query.search) {
    const searchNum = parseInt(query.search, 10);
    if (!isNaN(searchNum)) {
      where.id = searchNum;
    } else {
      where.buyer = { email: { contains: query.search, mode: "insensitive" } };
    }
  }
  if (query.status) where.status = query.status;
  if (query.sellerId) where.sellerId = Number(query.sellerId);
  if (query.buyerId) where.buyerId = query.buyerId;

  const [items, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: {
        buyer: { select: { id: true, email: true, buyerProfile: { select: { firstName: true, lastName: true } } } },
        seller: { select: { id: true, storeName: true, slug: true } },
        orderItems: {
          include: {
            product: { select: { id: true, name: true, imageUrl: true } },
          },
        },
      },
    }),
    prisma.order.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

/**
 * Get order by ID for admin
 */
export async function getOrderAdmin(id: number) {
  return prisma.order.findUnique({
    where: { id },
    include: {
      buyer: { select: { id: true, email: true, buyerProfile: { select: { firstName: true, lastName: true } } } },
      seller: { select: { id: true, storeName: true, slug: true } },
      orderItems: {
        include: {
          product: { select: { id: true, name: true, imageUrl: true, priceCents: true } },
        },
      },
      transactions: true,
    },
  });
}

/**
 * Update order status
 */
export async function updateOrderStatus(id: number, status: string) {
  return prisma.order.update({
    where: { id },
    data: { status },
  });
}

