// ==========================================================
// STORESGO PRODUCTS SERVICE — ENHANCED FOR LARGE DATASETS
// Supports both offset and cursor-based pagination
// FIXED: Now includes child category products
// FIXED: Multi-image support added
// ==========================================================

import { prisma } from "../plugins/prisma.js";
import { MeiliSearch } from "meilisearch";

// Meilisearch client for relevance-ranked search
const meili = new MeiliSearch({ host: "http://localhost:7700", apiKey: process.env.MEILI_MASTER_KEY || "" });
const productsIndex = meili.index("products");

// Unit ID to abbreviation mapping
const UNIT_ABBR: Record<number, string> = {
  1: "oz", 2: "lb", 3: "g", 4: "kg", 5: "fl oz", 6: "cup", 7: "pt", 8: "qt", 9: "gal", 10: "L",
  11: "mL", 12: "ea", 13: "pk", 14: "dz", 15: "case", 16: "box", 17: "bag", 18: "bundle", 19: "roll", 20: "sheet",
  21: "pc", 22: "mg", 23: "1/2 lb", 24: "1/4 lb", 25: "1/2 gal", 26: "500mL", 27: "12oz can", 28: "16oz btl", 29: "20oz btl", 30: "2L btl",
  31: "in", 32: "ft", 33: "cm", 34: "bunch", 35: "head", 36: "stalk", 37: "clove", 38: "ear", 39: "slice", 40: "serving",
  41: "portion", 42: "container", 43: "jar", 44: "can", 45: "btl", 46: "pouch", 47: "packet", 48: "sachet", 49: "tray", 50: "carton",
  51: "set", 52: "pair", 53: "1/2 dz", 54: "loaf", 55: "bar", 56: "stick", 57: "cube", 58: "tablet", 59: "capsule", 60: "scoop", 61: "squeeze"
};
import type {
  ProductListQuery,
  ProductSearchQuery,
  ProductSortOption,
} from "../schemas/products.schema.js";
import {
  buildCursorPaginatedResponse,
  buildCursorWhereClause,
  type CursorPaginatedResponse,
} from "../utils/pagination.js";

const BASE_URL = (process.env.PUBLIC_BASE_URL || "https://storesgo.com").replace(/\/+$/, "");
const PLACEHOLDER_IMG = "https://via.placeholder.com/580x580/f0f0f0/999999?text=No+Image";

function generateSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim();
}

function resolveImageUrl(imageUrl: string | null | undefined): string {
  if (!imageUrl) return PLACEHOLDER_IMG;
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) return imageUrl;
  const cleanPath = imageUrl.startsWith("/") ? imageUrl : "/" + imageUrl;
  return BASE_URL + cleanPath;
}

interface PaginatedResult<T> { items: T[]; total: number; page: number; pageSize: number; }
interface CursorResult<T> { items: T[]; hasMore: boolean; nextCursor?: string; }

export interface ProductDetailSeller { id: number; storeName: string; slug: string; city: string | null; state: string | null; country: string | null; about: string | null; }
export interface ProductDetailCategory { id: number; name: string; slug: string; icon: string | null; image: string | null; parentId: number | null; }
export interface ProductDetailReview { id: number; rating: number; comment: string | null; createdAt: Date; user: { id: string; email: string; }; }
export interface ProductImage { id: number; url: string; altText: string | null; sortOrder: number; isPrimary: boolean; }

export interface ProductDetail {
  id: number; name: string; slug: string; description: string | null; sku: string | null;
  priceCents: number; price: number; currency: string; unit: string; unitId: number | null; unitQuantity: number | null; pricePerUnitCents: number | null; unitAbbreviation: string | null; imageUrl: string;
  images: ProductImage[]; status: string; isActive: boolean; createdAt: Date; updatedAt: Date;
  seller: ProductDetailSeller; category: ProductDetailCategory | null; taxonomy: ProductDetailCategory | null;
  reviews: ProductDetailReview[]; averageRating: number; reviewCount: number; canonicalProductId: number | null; isPrimaryProduct: boolean | null; aiDescription: string | null; aiTags: string[]; aiBulletPoints: string[]; aiTargetAudience: string | null; aiBrand: string | null; aiSeoTitle: string | null; aiSeoDescription: string | null; aiSeoKeywords: string[];
}

function buildOrderBy(sort?: ProductSortOption): Record<string, "asc" | "desc"> {
  switch (sort) {
    case "price_asc": return { priceCents: "asc" };
    case "price_desc": return { priceCents: "desc" };
    case "name_asc": return { name: "asc" };
    case "name_desc": return { name: "desc" };
    case "newest": default: return { id: "asc" };
  }
}

async function getCategoryIdsWithChildren(categoryId: number): Promise<number[]> {
  const ids = [categoryId];
  const children = await prisma.category.findMany({ where: { parentId: categoryId }, select: { id: true } });
  for (const child of children) {
    ids.push(child.id);
    const grandchildren = await prisma.category.findMany({ where: { parentId: child.id }, select: { id: true } });
    ids.push(...grandchildren.map(g => g.id));
  }
  return ids;
}

export async function listProducts(query: ProductListQuery): Promise<PaginatedResult<any>> {
  const page = Number(query.page) || 1;
  const pageSize = Number(query.pageSize) || 20;
  
  // Use Meilisearch for search queries without seller/category filters
  if (query.q && !query.sellerId && !query.categoryId && !query.taxonomyId) {
    try {
      const searchResult = await productsIndex.search(query.q.trim(), {
        limit: pageSize,
        offset: (page - 1) * pageSize,
        attributesToRetrieve: ["id", "name", "description", "priceCents", "currency", "imageUrl", "categoryId", "categoryName", "categorySlug", "sellerId", "sellerName", "sellerSlug", "slug"],
      });
      const items = searchResult.hits.map((hit: any) => ({
        id: hit.id, name: hit.name, description: hit.description, priceCents: hit.priceCents,
        currency: hit.currency, imageUrl: hit.imageUrl, slug: hit.slug,
        category: hit.categoryId ? { id: hit.categoryId, name: hit.categoryName, slug: hit.categorySlug } : null,
        seller: { id: hit.sellerId, storeName: hit.sellerName, slug: hit.sellerSlug },
      }));
      return { items, total: searchResult.estimatedTotalHits || items.length, page, pageSize };
    } catch (err) {
      console.error("Meilisearch error in listProducts:", err);
    }
  }
  
  const where: any = { isActive: true };
  if (query.sellerId) where.sellerId = Number(query.sellerId);
  const categoryIdValue = query.categoryId || query.taxonomyId;
  if (categoryIdValue) {
    const categoryIds = await getCategoryIdsWithChildren(Number(categoryIdValue));
    where.categoryId = { in: categoryIds };
  }
  if (query.q) {
    where.OR = [
      { name: { contains: query.q, mode: "insensitive" } },
      { description: { contains: query.q, mode: "insensitive" } },
    ];
  }
  if (query.sellerId) {
    const skip = (page - 1) * pageSize;
    const [items, total] = await Promise.all([
      prisma.product.findMany({ where, skip, take: pageSize, orderBy: buildOrderBy(query.sort),
        include: { category: true, seller: { select: { id: true, storeName: true, slug: true } } } }),
      prisma.product.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }
  const sellers = await prisma.product.groupBy({ by: ['sellerId'], where, _count: true });
  if (sellers.length === 0) return { items: [], total: 0, page, pageSize };
  const sellerIds = sellers.map(s => s.sellerId);
  const totalCount = sellers.reduce((sum, s) => sum + s._count, 0);
  const perSeller = Math.ceil(pageSize / sellerIds.length);
  const offset = (page - 1) * perSeller;
  const sellerProducts = await Promise.all(sellerIds.map(sid =>
    prisma.product.findMany({ where: { ...where, sellerId: sid }, orderBy: buildOrderBy(query.sort),
      skip: offset, take: perSeller + 1,
      include: { category: true, seller: { select: { id: true, storeName: true, slug: true } } } })
  ));
  const items: any[] = [];
  const maxLen = Math.max(...sellerProducts.map(a => a.length));
  for (let i = 0; i < maxLen && items.length < pageSize; i++) {
    for (const prods of sellerProducts) {
      if (prods[i] && items.length < pageSize) items.push(prods[i]);
    }
  }
  return { items, total: totalCount, page, pageSize };
}

export async function getProductById(id: number): Promise<ProductDetail | null> {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: { select: { id: true, name: true, slug: true, icon: true, image: true, parentId: true } },
      seller: { select: { id: true, storeName: true, slug: true, city: true, state: true, country: true, about: true } },
      reviews: { take: 10, orderBy: { createdAt: "desc" }, include: { user: { select: { id: true, email: true } } } },
      images: { orderBy: { sortOrder: "asc" }, select: { id: true, url: true, altText: true, sortOrder: true, isPrimary: true } },
    },
  });
  if (!product) return null;
  return formatProductDetail(product);
}

export async function getProductsBySeller(sellerId: number, query: ProductListQuery): Promise<PaginatedResult<any>> {
  const page = Number(query.page) || 1;
  const pageSize = Number(query.pageSize) || 20;
  const skip = (page - 1) * pageSize;
  const where = { sellerId, isActive: true };
  const [items, total] = await Promise.all([
    prisma.product.findMany({ where, skip, take: pageSize, orderBy: buildOrderBy(query.sort), include: { category: true } }),
    prisma.product.count({ where }),
  ]);
  return { items, total, page, pageSize };
}

export async function getProductsByCategory(categoryId: number, query: ProductListQuery): Promise<PaginatedResult<any>> {
  const page = Number(query.page) || 1;
  const pageSize = Number(query.pageSize) || 20;
  const skip = (page - 1) * pageSize;
  const categoryIds = await getCategoryIdsWithChildren(categoryId);
  
  // Query through both direct categoryId AND categoryAssignments table
  const where = {
    isActive: true,
    OR: [
      { categoryId: { in: categoryIds } },
      { categoryAssignments: { some: { categoryId: { in: categoryIds } } } }
    ]
  };
  
  const [items, total] = await Promise.all([
    prisma.product.findMany({ 
      where, 
      skip, 
      take: pageSize, 
      orderBy: buildOrderBy(query.sort), 
      include: { seller: true, category: true } 
    }),
    prisma.product.count({ where }),
  ]);
  return { items, total, page, pageSize };
}

export async function searchProducts(query: ProductSearchQuery): Promise<PaginatedResult<any>> {
  const page = Number(query.page) || 1;
  const pageSize = Number(query.pageSize) || 20;
  const searchTerm = (query.q || "").trim();
  if (!searchTerm) return { items: [], total: 0, page, pageSize };
  
  // Use Meilisearch for relevance-ranked search
  try {
    const searchResult = await productsIndex.search(searchTerm, {
      limit: pageSize,
      offset: (page - 1) * pageSize,
      attributesToRetrieve: ["id", "name", "description", "priceCents", "currency", "imageUrl", "categoryId", "categoryName", "categorySlug", "sellerId", "sellerName", "sellerSlug", "slug"],
    });
    const items = searchResult.hits.map((hit: any) => ({
      id: hit.id, name: hit.name, description: hit.description, priceCents: hit.priceCents,
      currency: hit.currency, imageUrl: hit.imageUrl, slug: hit.slug,
      category: hit.categoryId ? { id: hit.categoryId, name: hit.categoryName, slug: hit.categorySlug } : null,
      seller: { id: hit.sellerId, storeName: hit.sellerName, slug: hit.sellerSlug },
    }));
    return { items, total: searchResult.estimatedTotalHits || items.length, page, pageSize };
  } catch (err) {
    console.error("Meilisearch error, falling back to Prisma:", err);
    const skip = (page - 1) * pageSize;
    const where: any = { isActive: true, OR: [{ name: { contains: searchTerm, mode: "insensitive" } }] };
    const [items, total] = await Promise.all([
      prisma.product.findMany({ where, skip, take: pageSize, orderBy: { name: "asc" }, include: { category: true, seller: { select: { id: true, storeName: true, slug: true } } } }),
      prisma.product.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }
}

export async function getRecommendedProducts(productId: number, limit: number = 12) {
  const base = await prisma.product.findUnique({ where: { id: productId }, select: { categoryId: true, sellerId: true } });
  if (!base) return [];
  return prisma.product.findMany({
    where: { isActive: true, id: { not: productId }, OR: [{ categoryId: base.categoryId }, { sellerId: base.sellerId }] },
    take: limit, orderBy: { createdAt: "desc" },
  });
}

interface CursorListQuery { cursor?: string; limit?: number; sellerId?: number; categoryId?: number; taxonomyId?: number; q?: string; sort?: ProductSortOption; minPrice?: number; maxPrice?: number; status?: string; }

export async function listProductsWithCursor(query: CursorListQuery): Promise<CursorResult<any>> {
  const limit = Math.min(Math.max(1, Number(query.limit) || 20), 100);
  const where: any = { isActive: true };
  if (query.cursor) { const cursorId = parseInt(query.cursor, 10); if (!isNaN(cursorId)) where.id = { gt: cursorId }; }
  if (query.sellerId) where.sellerId = Number(query.sellerId);
  const categoryIdValue = query.categoryId || query.taxonomyId;
  if (categoryIdValue) { const categoryIds = await getCategoryIdsWithChildren(Number(categoryIdValue)); where.categoryId = { in: categoryIds }; }
  if (query.status) where.status = query.status;
  if (query.minPrice || query.maxPrice) { where.priceCents = {}; if (query.minPrice) where.priceCents.gte = Math.round(query.minPrice * 100); if (query.maxPrice) where.priceCents.lte = Math.round(query.maxPrice * 100); }
  if (query.q) { where.OR = [{ name: { contains: query.q, mode: "insensitive" } }, { description: { contains: query.q, mode: "insensitive" } }, { sku: { contains: query.q, mode: "insensitive" } }]; }
  const items = await prisma.product.findMany({ where, take: limit + 1, orderBy: [buildOrderBy(query.sort), { id: "asc" }], include: { category: { select: { id: true, name: true, slug: true } }, seller: { select: { id: true, storeName: true, slug: true } } } });
  const hasMore = items.length > limit;
  const returnItems = hasMore ? items.slice(0, limit) : items;
  return { items: returnItems, hasMore, nextCursor: hasMore && returnItems.length > 0 ? String(returnItems[returnItems.length - 1].id) : undefined };
}

export async function* streamAllProducts(batchSize: number = 500, where: any = { isActive: true }): AsyncGenerator<any[], void, unknown> {
  let cursor: number | undefined;
  while (true) {
    const items = await prisma.product.findMany({ where: cursor ? { ...where, id: { gt: cursor } } : where, take: batchSize, orderBy: { id: "asc" }, include: { category: { select: { id: true, name: true, slug: true } }, seller: { select: { id: true, storeName: true, slug: true } } } });
    if (items.length === 0) break;
    yield items;
    cursor = items[items.length - 1].id;
  }
}

let cachedProductCount: { count: number; cachedAt: number } | null = null;
const COUNT_CACHE_TTL = 60000;

export async function getProductsCount(where?: any): Promise<number> {
  if (!where || Object.keys(where).length === 0) {
    const now = Date.now();
    if (cachedProductCount && (now - cachedProductCount.cachedAt) < COUNT_CACHE_TTL) return cachedProductCount.count;
    const count = await prisma.product.count();
    cachedProductCount = { count, cachedAt: now };
    return count;
  }
  return prisma.product.count({ where });
}

export async function getProductsByIds(ids: number[]): Promise<any[]> {
  if (ids.length === 0) return [];
  return prisma.product.findMany({ where: { id: { in: ids }, isActive: true }, include: { category: { select: { id: true, name: true, slug: true } }, seller: { select: { id: true, storeName: true, slug: true } } } });
}

export interface RelatedProductItem { id: number; name: string; slug: string; priceCents: number; price: number; currency: string; imageUrl: string; category: { id: number; name: string; slug: string } | null; seller: { id: number; storeName: string; slug: string }; }

export async function getRelatedProducts(productId: number, limit: number = 8): Promise<RelatedProductItem[]> {
  const base = await prisma.product.findUnique({ where: { id: productId }, select: { categoryId: true } });
  if (!base || !base.categoryId) return [];
  const products = await prisma.product.findMany({ where: { isActive: true, id: { not: productId }, categoryId: base.categoryId }, take: Math.max(4, Math.min(limit, 8)), orderBy: { createdAt: "desc" }, select: { id: true, name: true, priceCents: true, currency: true, imageUrl: true, category: { select: { id: true, name: true, slug: true } }, seller: { select: { id: true, storeName: true, slug: true } } } });
  return products.map((p) => ({ ...p, slug: generateSlug(p.name), price: p.priceCents / 100, imageUrl: resolveImageUrl(p.imageUrl) }));
}

export async function searchProductsWithCursor(searchTerm: string, options: { cursor?: string; limit?: number; categoryId?: number; minPrice?: number; maxPrice?: number } = {}): Promise<CursorResult<any>> {
  const limit = Math.min(Math.max(1, Number(options.limit) || 20), 100);
  const where: any = { isActive: true, OR: [{ name: { contains: searchTerm, mode: "insensitive" } }, { description: { contains: searchTerm, mode: "insensitive" } }, { sku: { contains: searchTerm, mode: "insensitive" } }, { aiTags: { has: searchTerm.toLowerCase() } }] };
  if (options.cursor) { const cursorId = parseInt(options.cursor, 10); if (!isNaN(cursorId)) where.id = { gt: cursorId }; }
  if (options.categoryId) where.categoryId = options.categoryId;
  if (options.minPrice || options.maxPrice) { where.priceCents = {}; if (options.minPrice) where.priceCents.gte = Math.round(options.minPrice * 100); if (options.maxPrice) where.priceCents.lte = Math.round(options.maxPrice * 100); }
  const items = await prisma.product.findMany({ where, take: limit + 1, orderBy: [{ id: "asc" }], include: { category: { select: { id: true, name: true, slug: true } }, seller: { select: { id: true, storeName: true, slug: true } } } });
  const hasMore = items.length > limit;
  const returnItems = hasMore ? items.slice(0, limit) : items;
  return { items: returnItems, hasMore, nextCursor: hasMore && returnItems.length > 0 ? String(returnItems[returnItems.length - 1].id) : undefined };
}

export async function getProductByIdOrSlug(identifier: string): Promise<{ product: ProductDetail | null; shouldRedirect: boolean; canonicalSlug: string | null; }> {
  const isNumeric = /^\d+$/.test(identifier);
  let product;
  if (isNumeric) {
    product = await prisma.product.findUnique({
      where: { id: parseInt(identifier, 10) },
      include: {
        category: { select: { id: true, name: true, slug: true, icon: true, image: true, parentId: true } },
        seller: { select: { id: true, storeName: true, slug: true, city: true, state: true, country: true, about: true } },
        reviews: { take: 10, orderBy: { createdAt: "desc" }, include: { user: { select: { id: true, email: true } } } },
        images: { orderBy: { sortOrder: "asc" }, select: { id: true, url: true, altText: true, sortOrder: true, isPrimary: true } },
      },
    });
    if (!product) return { product: null, shouldRedirect: false, canonicalSlug: null };
    return { product: formatProductDetail(product), shouldRedirect: !!product.slug, canonicalSlug: product.slug };
  }
  product = await prisma.product.findUnique({
    where: { slug: identifier },
    include: {
      category: { select: { id: true, name: true, slug: true, icon: true, image: true, parentId: true } },
      seller: { select: { id: true, storeName: true, slug: true, city: true, state: true, country: true, about: true } },
      reviews: { take: 10, orderBy: { createdAt: "desc" }, include: { user: { select: { id: true, email: true } } } },
      images: { orderBy: { sortOrder: "asc" }, select: { id: true, url: true, altText: true, sortOrder: true, isPrimary: true } },
    },
  });
  if (!product) {
    const idMatch = identifier.match(/-(\d+)$/);
    if (idMatch) {
      const fallbackId = parseInt(idMatch[1], 10);
      product = await prisma.product.findUnique({
        where: { id: fallbackId },
        include: {
          category: { select: { id: true, name: true, slug: true, icon: true, image: true, parentId: true } },
          seller: { select: { id: true, storeName: true, slug: true, city: true, state: true, country: true, about: true } },
          reviews: { take: 10, orderBy: { createdAt: "desc" }, include: { user: { select: { id: true, email: true } } } },
          images: { orderBy: { sortOrder: "asc" }, select: { id: true, url: true, altText: true, sortOrder: true, isPrimary: true } },
        },
      });
    }
  }
  if (!product) return { product: null, shouldRedirect: false, canonicalSlug: null };
  return { product: formatProductDetail(product), shouldRedirect: false, canonicalSlug: product.slug };
}

function formatProductDetail(product: any): ProductDetail {
  const resolvedImageUrl = resolveImageUrl(product.imageUrl);
  const images: ProductImage[] = product.images?.length > 0 ? product.images : [{ id: 0, url: resolvedImageUrl, altText: null, sortOrder: 0, isPrimary: true }];
  const avgRating = product.reviews.length > 0 ? product.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / product.reviews.length : 0;
  return {
    id: product.id, name: product.name,
    slug: product.slug || product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + product.id,
    description: product.description, sku: product.sku, priceCents: product.priceCents, price: product.priceCents / 100,
    currency: product.currency, unit: product.displayUnit || "each", unitId: product.unitId, unitQuantity: product.unitQuantity ? Number(product.unitQuantity) : null, pricePerUnitCents: product.pricePerUnitCents, unitAbbreviation: product.unitId ? UNIT_ABBR[product.unitId] || null : null, imageUrl: resolvedImageUrl, images, status: product.status,
    isActive: product.isActive, createdAt: product.createdAt, updatedAt: product.updatedAt,
    seller: product.seller, category: product.category, taxonomy: product.category,
    canonicalProductId: product.canonicalProductId || null, isPrimaryProduct: product.isPrimary || null, aiDescription: product.aiDescription || null, aiTags: product.aiTags || [], aiBulletPoints: product.aiBulletPoints || [], aiTargetAudience: product.aiTargetAudience || null, aiBrand: product.aiBrand || null, aiSeoTitle: product.aiSeoTitle || null, aiSeoDescription: product.aiSeoDescription || null, aiSeoKeywords: product.aiSeoKeywords || [], reviews: product.reviews, averageRating: Math.round(avgRating * 10) / 10, reviewCount: product.reviews.length,
  };
}
