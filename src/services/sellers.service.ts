// ==========================================================
// STORESGO SELLERS SERVICE — PHASE 6
// Provides seller listing and detail data for storefront
// ==========================================================

import { prisma } from "../plugins/prisma.js";
import { getPagination } from "../utils/pagination.js";

export interface SellerListQuery {
  page?: number;
  pageSize?: number;
  q?: string;
  city?: string;
  state?: string;
  country?: string;
}

export interface SellerListItem {
  id: number;
  storeName: string;
  slug: string;
  city: string | null;
  state: string | null;
  country: string | null;
  about: string | null;
  productCount: number;
  createdAt: Date;
}

export interface SellerDetail extends SellerListItem {
  products: {
    id: number;
    name: string;
    priceCents: number;
    imageUrl: string | null;
  }[];
}

interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * List all approved sellers with pagination
 */
export async function listSellers(
  query: SellerListQuery
): Promise<PaginatedResult<SellerListItem>> {
  const { page, pageSize, skip, take } = getPagination({
    page: query.page,
    pageSize: query.pageSize,
  });

  const where: any = { isApproved: true };

  // Search by store name
  if (query.q) {
    where.OR = [
      { storeName: { contains: query.q, mode: "insensitive" } },
      { about: { contains: query.q, mode: "insensitive" } },
    ];
  }

  // Filter by location
  if (query.city) {
    where.city = { contains: query.city, mode: "insensitive" };
  }
  if (query.state) {
    where.state = { contains: query.state, mode: "insensitive" };
  }
  if (query.country) {
    where.country = { contains: query.country, mode: "insensitive" };
  }

  const [sellers, total] = await Promise.all([
    prisma.seller.findMany({
      where,
      skip,
      take,
      orderBy: { storeName: "asc" },
      select: {
        id: true,
        storeName: true,
        slug: true,
        city: true,
        state: true,
        country: true,
        zipCode: true,
        about: true,
        createdAt: true,
        _count: {
          select: { products: true },
        },
      },
    }),
    prisma.seller.count({ where }),
  ]);

  const items = sellers.map((s) => ({
    id: s.id,
    storeName: s.storeName,
    slug: s.slug,
    city: s.city,
    state: s.state,
    country: s.country,
    about: s.about,
    productCount: s._count.products,
    createdAt: s.createdAt,
  }));

  return { items, total, page, pageSize };
}

/**
 * Get seller by slug with recent products
 */
export async function getSellerBySlug(slug: string): Promise<SellerDetail | null> {
  const seller = await prisma.seller.findUnique({
    where: { slug },
    select: {
      id: true,
      storeName: true,
      slug: true,
      city: true,
      state: true,
      country: true,
        zipCode: true,
      about: true,
      createdAt: true,
      _count: {
        select: { products: true },
      },
      products: {
        where: { isActive: true },
        take: 12,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          priceCents: true,
          imageUrl: true,
        },
      },
    },
  });

  if (!seller) return null;

  return {
    id: seller.id,
    storeName: seller.storeName,
    slug: seller.slug,
    city: seller.city,
    state: seller.state,
    country: seller.country,
    about: seller.about,
    productCount: seller._count.products,
    createdAt: seller.createdAt,
    products: seller.products,
  };
}

/**
 * Get seller by ID with recent products
 */
export async function getSellerById(id: number): Promise<SellerDetail | null> {
  const seller = await prisma.seller.findUnique({
    where: { id },
    select: {
      id: true,
      storeName: true,
      slug: true,
      city: true,
      state: true,
      country: true,
        zipCode: true,
      about: true,
      createdAt: true,
      _count: {
        select: { products: true },
      },
      products: {
        where: { isActive: true },
        take: 12,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          priceCents: true,
          imageUrl: true,
        },
      },
    },
  });

  if (!seller) return null;

  return {
    id: seller.id,
    storeName: seller.storeName,
    slug: seller.slug,
    city: seller.city,
    state: seller.state,
    country: seller.country,
    about: seller.about,
    productCount: seller._count.products,
    createdAt: seller.createdAt,
    products: seller.products,
  };
}

/**
 * Get products by seller ID (for PDP - other products by seller)
 * Returns up to 8 products with category info
 */
export interface SellerProductItem {
  id: number;
  name: string;
  priceCents: number;
  price: number; // Computed: priceCents / 100
  currency: string;
  imageUrl: string | null;
  category: {
    id: number;
    name: string;
    slug: string;
  } | null;
}

export async function getSellerProducts(
  sellerId: number,
  limit: number = 8,
  excludeProductId?: number
): Promise<SellerProductItem[]> {
  const where: any = {
    sellerId,
    isActive: true,
  };

  // Optionally exclude a specific product (e.g., the current product on PDP)
  if (excludeProductId) {
    where.id = { not: excludeProductId };
  }

  const products = await prisma.product.findMany({
    where,
    take: Math.min(limit, 8),
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      priceCents: true,
      currency: true,
      imageUrl: true,
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  });

  // Add computed price field (dollars)
  return products.map((p) => ({
    ...p,
    price: p.priceCents / 100,
  }));
}

