// ==========================================================
// STORESGO SEARCH SERVICE — PHASE 18
// Provides product search functionality
// ==========================================================

import { prisma } from "../plugins/prisma.js";
import { getPagination } from "../utils/pagination.js";

// ---------------------------------------------------------
// Types
// ---------------------------------------------------------

export interface SearchProductsQuery {
  q: string;
  page?: number;
  limit?: number;
  categoryId?: number;
  minPrice?: number;
  maxPrice?: number;
}

export interface SearchProductResult {
  id: number;
  name: string;
  description: string | null;
  priceCents: number;
  currency: string;
  imageUrl: string | null;
  category: { id: number; name: string; slug: string } | null;
  seller: { id: number; storeName: string; slug: string };
}

export interface SearchProductsResult {
  products: SearchProductResult[];
  page: number;
  limit: number;
  total: number;
}

// ---------------------------------------------------------
// Service Functions
// ---------------------------------------------------------

/**
 * Search products by query
 * Case-insensitive search on name, description, brand (via aiTags)
 */
export async function searchProducts(
  query: SearchProductsQuery
): Promise<SearchProductsResult> {
  const searchTerm = query.q.trim();
  const page = Number(query.page) || 1;
  const limit = Math.min(Number(query.limit) || 20, 100);
  const skip = (page - 1) * limit;

  // Build where clause for case-insensitive search
  const where: any = {
    isActive: true,
    OR: [
      { name: { contains: searchTerm, mode: "insensitive" } },
      { description: { contains: searchTerm, mode: "insensitive" } },
      { sku: { contains: searchTerm, mode: "insensitive" } },
      // Search in AI-generated tags (includes brand info)
      { aiTags: { has: searchTerm.toLowerCase() } },
      // Search in AI-generated SEO keywords
      { aiSeoKeywords: { has: searchTerm.toLowerCase() } },
    ],
  };

  // Category filter
  if (query.categoryId) {
    where.categoryId = Number(query.categoryId);
  }

  // Price filter
  if (query.minPrice || query.maxPrice) {
    where.priceCents = {};
    if (query.minPrice) {
      where.priceCents.gte = Math.round(query.minPrice * 100);
    }
    if (query.maxPrice) {
      where.priceCents.lte = Math.round(query.maxPrice * 100);
    }
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: [
        { createdAt: "desc" },
      ],
      select: {
        id: true,
        name: true,
        description: true,
        priceCents: true,
        currency: true,
        imageUrl: true,
        category: {
          select: { id: true, name: true, slug: true },
        },
        seller: {
          select: { id: true, storeName: true, slug: true },
        },
      },
    }),
    prisma.product.count({ where }),
  ]);

  return {
    products,
    page,
    limit,
    total,
  };
}

/**
 * Get search suggestions (autocomplete)
 */
export async function getSearchSuggestions(
  query: string,
  limit: number = 10
): Promise<string[]> {
  const searchTerm = query.trim();

  if (searchTerm.length < 2) {
    return [];
  }

  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      name: { contains: searchTerm, mode: "insensitive" },
    },
    take: limit,
    select: { name: true },
    distinct: ["name"],
  });

  return products.map((p) => p.name);
}

