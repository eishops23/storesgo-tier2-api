// ==========================================================
// STORESGO HOMEPAGE SERVICE — TASK GROUP 3 (Homepage Dynamic System)
// Provides complete homepage data with dedicated config model
// ==========================================================

import { prisma } from "../lib/prisma.js";
import { cacheAside, CACHE_TTL, CACHE_KEYS } from "../lib/enterprise/cache.js";
import * as cmsService from "./cms.service.js";

// ---------------------------------------------------------
// Types
// ---------------------------------------------------------

export interface HomepageFeaturedProduct {
  id: number;
  name: string;
  priceCents: number;
  imageUrl: string | null;
  category: { id: number; name: string; slug: string } | null;
  seller: { id: number; storeName: string; slug: string };
}

export interface HomepageCategory {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
  image: string | null;
  tagline: string | null;
  color: string | null;
  productCount: number;
}

export interface HomepageSeller {
  id: number;
  storeName: string;
  slug: string;
  city: string | null;
  state: string | null;
  productCount: number;
}

export interface HomepageStats {
  totalProducts: number;
  totalSellers: number;
  totalCategories: number;
}

export interface HomepageDeal {
  id: number;
  title: string;
  description: string | null;
  imageUrl: string | null;
  discountPct: number | null;
  startDate: Date;
  endDate: Date;
}

export interface HomepageCmsContent {
  heroSlides: any[];
  hero: any[];
  banners: any[];
  textModules: any[];
  promotions: any[];
  allBlocks: any[];
}

export interface FooterData {
  links: Record<string, any[]>;
  content: Record<string, string>;
}

export interface HomepageFeedData {
  featuredProducts: HomepageFeaturedProduct[];
  newArrivals: HomepageFeaturedProduct[];
  categories: HomepageCategory[];
  featuredSellers: HomepageSeller[];
  stats: HomepageStats;
  deals: HomepageDeal[];
  cms: HomepageCmsContent;
  footer: FooterData;
  recentBlogs: any[];
}

// ---------------------------------------------------------
// NEW: Homepage Config Types (Task Group 3)
// ---------------------------------------------------------

export interface HomepageHero {
  title: string | null;
  subtitle: string | null;
  image: string | null;
}

export interface HomepageCta {
  title: string | null;
  subtitle: string | null;
  buttonLabel: string | null;
  buttonUrl: string | null;
}

export interface HomepageFooter {
  aboutHtml: string | null;
  links: any;
  social: any;
}

export interface HomepageDataPayload {
  hero: HomepageHero;
  featuredCategories: any[];
  featuredProducts: any[];
  blogSectionTitle: string | null;
  cta: HomepageCta | null;
  recentBlogs: any[];
  footer: HomepageFooter;
}

// ---------------------------------------------------------
// Service Functions
// ---------------------------------------------------------

/**
 * Get featured products for homepage hero section
 * Returns recently created active products with images
 */
export async function getFeaturedProducts(limit = 12): Promise<HomepageFeaturedProduct[]> {
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      imageUrl: { not: null },
    },
    take: limit,
    orderBy: { priceCents: "desc" },
    select: {
      id: true,
      name: true,
      priceCents: true,
      imageUrl: true,
      category: {
        select: { id: true, name: true, slug: true },
      },
      seller: {
        select: { id: true, storeName: true, slug: true },
      },
    },
  });

  return products as HomepageFeaturedProduct[];
}

/**
 * Get new arrivals (most recent products)
 */
export async function getNewArrivals(limit = 8): Promise<HomepageFeaturedProduct[]> {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    take: limit,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      priceCents: true,
      imageUrl: true,
      category: {
        select: { id: true, name: true, slug: true },
      },
      seller: {
        select: { id: true, storeName: true, slug: true },
      },
    },
  });

  return products as HomepageFeaturedProduct[];
}

/**
 * Get categories with product counts for homepage navigation
 */
export async function getCategoriesWithCounts(): Promise<HomepageCategory[]> {
  // Check for featured categories in config
  let config: any = null; try { config = await prisma.homepageConfig.findFirst(); } catch {}
  
  const categoryFilter = (config?.featuredCategoryIds && config.featuredCategoryIds.length > 0)
    ? { id: { in: config.featuredCategoryIds } }
    : { parentId: null };

  const parentCategories = await prisma.category.findMany({
    where: categoryFilter,
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, slug: true, icon: true, image: true, tagline: true, color: true },
  });

  const allCategories = await prisma.category.findMany({
    select: { id: true, parentId: true },
  });

  const results = await Promise.all(
    parentCategories.map(async (parent) => {
      const childIds = allCategories.filter((c) => c.parentId === parent.id).map((c) => c.id);
      const grandchildIds = allCategories.filter((c) => childIds.includes(c.parentId || 0)).map((c) => c.id);
      const allCategoryIds = [parent.id, ...childIds, ...grandchildIds];
      
      // Count from direct categoryId AND from productCategoryAssignment
      const [directCount, assignmentCount] = await Promise.all([
        prisma.product.count({
          where: { categoryId: { in: allCategoryIds }, isActive: true },
        }),
        prisma.product.count({ where: { isActive: true, OR: [{ categoryId: null }, { categoryId: { notIn: allCategoryIds } }], categoryAssignments: { some: { categoryId: { in: allCategoryIds } } } } })
      ]);
      const productCount = directCount + assignmentCount;
      
      return { ...parent, productCount };
    })
  );

  // Sort by config order if using featured categories
  if (config?.featuredCategoryIds && config.featuredCategoryIds.length > 0) {
    const orderMap = new Map(
      (config.featuredCategoryIds as number[]).map((id: number, idx: number) => [id, idx]),
    );
    results.sort((a, b) => (Number(orderMap.get(a.id) ?? 999)) - (Number(orderMap.get(b.id) ?? 999)));
  }

  return results;
}

/**
 * Get featured sellers (approved with most products)
 */
export async function getFeaturedSellers(limit = 6): Promise<HomepageSeller[]> {
  const sellers = await prisma.seller.findMany({
    where: { isApproved: true },
    take: limit,
    orderBy: {
      products: { _count: "desc" },
    },
    select: {
      id: true,
      storeName: true,
      slug: true,
      city: true,
      state: true,
      _count: {
        select: { products: true },
      },
    },
  });

  return sellers.map((s) => ({
    id: s.id,
    storeName: s.storeName,
    slug: s.slug,
    city: s.city,
    state: s.state,
    productCount: s._count.products,
  }));
}

/**
 * Get platform statistics
 */
export async function getHomepageStats(): Promise<HomepageStats> {
  const [totalProducts, totalSellers, totalCategories] = await Promise.all([
    prisma.product.count({ where: { isActive: true } }),
    prisma.seller.count({ where: { isApproved: true } }),
    prisma.category.count(),
  ]);

  return { totalProducts, totalSellers, totalCategories };
}

/**
 * Get active seasonal deals
 */
export async function getActiveDeals(): Promise<HomepageDeal[]> {
  const now = new Date();

  const deals = await prisma.seasonalDeal.findMany({
    where: {
      active: true,
      startDate: { lte: now },
      endDate: { gte: now },
    },
    orderBy: { endDate: "asc" },
    select: {
      id: true,
      title: true,
      description: true,
      imageUrl: true,
      discountPct: true,
      startDate: true,
      endDate: true,
    },
  });

  return deals;
}

/**
 * Get recent blog posts for homepage
 */
export async function getRecentBlogs(limit = 4): Promise<any[]> {
  const posts = await prisma.blogPost.findMany({
    where: { published: true },
    take: limit,
    orderBy: { publishedAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      featuredImage: true,
      category: true,
      publishedAt: true,
    },
  });

  return posts;
}

/**
 * Get complete homepage feed data (all sections + CMS + Footer)
 */
export async function getHomepageFeed(): Promise<HomepageFeedData> {
  const [
    featuredProducts,
    newArrivals,
    categories,
    featuredSellers,
    stats,
    deals,
    cms,
    footer,
    recentBlogs,
  ] = await Promise.all([
    getFeaturedProducts(12),
    getNewArrivals(8),
    getCategoriesWithCounts(),
    getFeaturedSellers(6),
    getHomepageStats(),
    getActiveDeals(),
    cmsService.getHomepageCmsContent(),
    cmsService.getFooterData(),
    getRecentBlogs(4),
  ]);

  return {
    featuredProducts,
    newArrivals,
    categories,
    featuredSellers,
    stats,
    deals,
    cms,
    footer,
    recentBlogs,
  };
}

// ---------------------------------------------------------
// Admin Functions — Homepage Config (Task Group 3)
// Uses dedicated HomepageConfig model
// ---------------------------------------------------------

export interface HomepageConfigUpdate {
  heroTitle?: string | null;
  heroSubtitle?: string | null;
  heroImageUrl?: string | null;
  featuredCategoryIds?: number[];
  featuredProductIds?: number[];
  blogSectionTitle?: string | null;
  ctaTitle?: string | null;
  ctaSubtitle?: string | null;
  ctaButtonLabel?: string | null;
  ctaButtonUrl?: string | null;
  footerAboutHtml?: string | null;
  footerLinksJson?: any;
  footerSocialJson?: any;
}

/**
 * Ensure homepage config row exists (singleton pattern with id=1)
 */
async function ensureHomepageConfig() {
  const existing = await prisma.homepageConfig.findUnique({
    where: { id: 1 },
  });
  
  if (!existing) {
    return prisma.homepageConfig.create({
      data: {
        id: 1,
        heroTitle: "Welcome to StoresGo",
        heroSubtitle: "Your marketplace for quality products",
        blogSectionTitle: "Latest from Our Blog",
      },
    });
  }
  
  return existing;
}

/**
 * Update homepage configuration
 * Uses the dedicated HomepageConfig model
 */
export async function updateHomepageConfig(config: HomepageConfigUpdate): Promise<any> {
  // Ensure config exists
  await ensureHomepageConfig();
  
  // Build update data - only include fields that are provided
  const updateData: any = {};
  
  if (config.heroTitle !== undefined) updateData.heroTitle = config.heroTitle;
  if (config.heroSubtitle !== undefined) updateData.heroSubtitle = config.heroSubtitle;
  if (config.heroImageUrl !== undefined) updateData.heroImageUrl = config.heroImageUrl;
  if (config.featuredCategoryIds !== undefined) updateData.featuredCategoryIds = config.featuredCategoryIds;
  if (config.featuredProductIds !== undefined) updateData.featuredProductIds = config.featuredProductIds;
  if (config.blogSectionTitle !== undefined) updateData.blogSectionTitle = config.blogSectionTitle;
  if (config.ctaTitle !== undefined) updateData.ctaTitle = config.ctaTitle;
  if (config.ctaSubtitle !== undefined) updateData.ctaSubtitle = config.ctaSubtitle;
  if (config.ctaButtonLabel !== undefined) updateData.ctaButtonLabel = config.ctaButtonLabel;
  if (config.ctaButtonUrl !== undefined) updateData.ctaButtonUrl = config.ctaButtonUrl;
  if (config.footerAboutHtml !== undefined) updateData.footerAboutHtml = config.footerAboutHtml;
  if (config.footerLinksJson !== undefined) updateData.footerLinksJson = config.footerLinksJson;
  if (config.footerSocialJson !== undefined) updateData.footerSocialJson = config.footerSocialJson;
  
  return prisma.homepageConfig.update({
    where: { id: 1 },
    data: updateData,
  });
}

/**
 * Get current homepage configuration (raw from DB)
 * Used by admin panel to see current settings
 */
export async function getHomepageConfig(): Promise<any> {
  const config = await ensureHomepageConfig();
  
  return {
    heroTitle: config.heroTitle,
    heroSubtitle: config.heroSubtitle,
    heroImageUrl: config.heroImageUrl,
    featuredCategoryIds: config.featuredCategoryIds || [],
    featuredProductIds: config.featuredProductIds || [],
    blogSectionTitle: config.blogSectionTitle,
    ctaTitle: config.ctaTitle,
    ctaSubtitle: config.ctaSubtitle,
    ctaButtonLabel: config.ctaButtonLabel,
    ctaButtonUrl: config.ctaButtonUrl,
    footerAboutHtml: config.footerAboutHtml,
    footerLinksJson: config.footerLinksJson,
    footerSocialJson: config.footerSocialJson,
    updatedAt: config.updatedAt,
  };
}

/**
 * Get homepage data for frontend consumption
 * Returns the structured payload with resolved categories and products
 */
export async function getHomepageDataPayload(): Promise<HomepageDataPayload> {
  // Get the config
  const config = await ensureHomepageConfig();
  
  // Resolve featured categories with RECURSIVE counts
  let featuredCategories: any[] = [];
  const allCategoriesWithCounts = await getCategoriesWithCounts();
  if (config.featuredCategoryIds && config.featuredCategoryIds.length > 0) {
    const idSet = new Set(config.featuredCategoryIds);
    featuredCategories = allCategoriesWithCounts.filter((c) => idSet.has(c.id));
    const orderMap = new Map(config.featuredCategoryIds.map((id, idx) => [id, idx]));
    featuredCategories.sort((a, b) => (orderMap.get(a.id) ?? 999) - (orderMap.get(b.id) ?? 999));
  } else {
    featuredCategories = allCategoriesWithCounts;
  }
  
  // Resolve featured products
  let featuredProducts: any[] = [];
  if (config.featuredProductIds && config.featuredProductIds.length > 0) {
    featuredProducts = await prisma.product.findMany({
      where: {
        id: { in: config.featuredProductIds },
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        priceCents: true,
        imageUrl: true,
        category: {
          select: { id: true, name: true, slug: true },
        },
        seller: {
          select: { id: true, storeName: true, slug: true },
        },
      },
    });
    
    // Maintain order from config
    const orderMap = new Map(config.featuredProductIds.map((id, idx) => [id, idx]));
    featuredProducts.sort((a, b) => (orderMap.get(a.id) ?? 999) - (orderMap.get(b.id) ?? 999));
  } else {
    // FALLBACK: Use recent products with images
    featuredProducts = await getFeaturedProducts(12);
  }
  
  // Get recent published blog posts
  const recentBlogs = await prisma.blogPost.findMany({
    where: { published: true },
    take: 6,
    orderBy: { publishedAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      featuredImage: true,
      category: true,
      publishedAt: true,
    },
  });
  
  // Build CTA object (only if at least one CTA field is set)
  const hasCta = config.ctaTitle || config.ctaSubtitle || config.ctaButtonLabel || config.ctaButtonUrl;
  const cta: HomepageCta | null = hasCta
    ? {
        title: config.ctaTitle,
        subtitle: config.ctaSubtitle,
        buttonLabel: config.ctaButtonLabel,
        buttonUrl: config.ctaButtonUrl,
      }
    : null;
  
  return {
    hero: {
      title: config.heroTitle,
      subtitle: config.heroSubtitle,
      image: config.heroImageUrl,
    },
    featuredCategories,
    featuredProducts,
    blogSectionTitle: config.blogSectionTitle,
    cta,
    recentBlogs,
    footer: {
      aboutHtml: config.footerAboutHtml,
      links: config.footerLinksJson,
      social: config.footerSocialJson,
    },
  };
}

// ---------------------------------------------------------
// Phase 12 — Merchandising Snapshot (Prompt 1)
// Operator-facing aggregation for the Merchandising Agent.
// Read-only. Uses existing prisma client. No raw SQL.
// ---------------------------------------------------------

export type MerchandisingStockStatus = 'ok' | 'low_stock' | 'out_of_stock' | 'untracked';

export interface MerchandisingSnapshotProduct {
  id: number;
  name: string;
  priceCents: number;
  /**
   * Proxy: HomepageConfig.updatedAt. There is no per-product "added to
   * featured" timestamp in the schema — every featured product shares
   * the same value, equal to the last time the config row was touched.
   */
  addedToFeatured: Date;
  orders7d: number;
  /** Orders in the last 30 days (fixed). windowDays option does NOT resize this field. */
  orders30d: number;
  /** Always null — schema has no product-view tracking surface. Use favoriteAdds7d as a proxy. */
  views7d: null;
  /** Favorite rows created in last 7 days. Weak interest proxy in lieu of view tracking. */
  favoriteAdds7d: number;
  stockStatus: MerchandisingStockStatus;
}

export interface MerchandisingSnapshotCategory {
  id: number;
  name: string;
  productCount: number;
  orders7d: number;
}

export interface MerchandisingSnapshotCmsBlock {
  id: number;
  key: string;
  type: string | null;
  order: number | null;
  isActive: boolean;
  startDate: Date | null;
  endDate: Date | null;
}

export interface MerchandisingSnapshotHomepage {
  heroTitle: string;
  heroSubtitle: string;
  showNewArrivals: boolean;
  showDeals: boolean;
  showPopular: boolean;
  updatedAt: Date;
}

export interface MerchandisingSnapshotCoverageGaps {
  /** Category names with >=1 active product that are NOT in HomepageConfig.featuredCategoryIds. */
  categoriesWithoutFeatured: string[];
  /**
   * Featured product IDs with zero non-cancelled orders in the last `windowDays` days
   * (default 30). Use this as the "dead inventory in the hero slot" signal.
   */
  featuredProductsWithZeroOrders: number[];
}

export interface MerchandisingSnapshot {
  windowDays: number;
  generatedAt: Date;
  featuredProducts: MerchandisingSnapshotProduct[];
  featuredCategories: MerchandisingSnapshotCategory[];
  cmsBlocks: MerchandisingSnapshotCmsBlock[];
  homepage: MerchandisingSnapshotHomepage;
  coverageGaps: MerchandisingSnapshotCoverageGaps;
}

export interface GetMerchandisingSnapshotOptions {
  windowDays?: number;
}

/**
 * Aggregate the current state of the homepage merchandising surface for the
 * operator-facing Phase 12 Merchandising Agent. Returns featured products
 * with recent order/favorite signals, featured categories with order counts,
 * active CMS blocks, homepage config flags, and coverage-gap indicators.
 *
 * Order counts exclude status IN ('cancelled', 'refunded'), matching the
 * convention in sellerDashboard.service.ts.
 */
export async function getMerchandisingSnapshot(
  options: GetMerchandisingSnapshotOptions = {},
): Promise<MerchandisingSnapshot> {
  const windowDays = options.windowDays ?? 30;
  const now = new Date();
  const coverageWindowStart = new Date(now);
  coverageWindowStart.setDate(now.getDate() - windowDays);
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 30);
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);
  const EXCLUDED_ORDER_STATUSES = ['cancelled', 'refunded'];

  const config = await ensureHomepageConfig();
  const featuredProductIds = config.featuredProductIds ?? [];
  const featuredCategoryIds = config.featuredCategoryIds ?? [];

  // --- Featured products + inventory ---
  const featuredProductRows = featuredProductIds.length > 0
    ? await prisma.product.findMany({
        where: { id: { in: featuredProductIds } },
        select: {
          id: true,
          name: true,
          priceCents: true,
          inventory: {
            select: {
              stockQuantity: true,
              lowStockThreshold: true,
              trackInventory: true,
            },
          },
        },
      })
    : [];

  // --- Order aggregation for featured products (7d + 30d + windowDays) ---
  // One query over the widest window needed, grouped in JS to avoid 3 round trips.
  const widestStart = coverageWindowStart < thirtyDaysAgo ? coverageWindowStart : thirtyDaysAgo;
  const featuredOrderItems = featuredProductIds.length > 0
    ? await prisma.orderItem.findMany({
        where: {
          productId: { in: featuredProductIds },
          order: {
            createdAt: { gte: widestStart },
            status: { notIn: EXCLUDED_ORDER_STATUSES },
          },
        },
        select: {
          productId: true,
          order: { select: { createdAt: true } },
        },
      })
    : [];

  const orders7dMap = new Map<number, number>();
  const orders30dMap = new Map<number, number>();
  const ordersWindowMap = new Map<number, number>();
  for (const item of featuredOrderItems) {
    const ts = item.order.createdAt;
    if (ts >= sevenDaysAgo) {
      orders7dMap.set(item.productId, (orders7dMap.get(item.productId) ?? 0) + 1);
    }
    if (ts >= thirtyDaysAgo) {
      orders30dMap.set(item.productId, (orders30dMap.get(item.productId) ?? 0) + 1);
    }
    if (ts >= coverageWindowStart) {
      ordersWindowMap.set(item.productId, (ordersWindowMap.get(item.productId) ?? 0) + 1);
    }
  }

  // --- Favorite adds for featured products (7d) ---
  const favoriteRows = featuredProductIds.length > 0
    ? await prisma.favorite.groupBy({
        by: ['productId'],
        where: {
          productId: { in: featuredProductIds },
          createdAt: { gte: sevenDaysAgo },
        },
        _count: { _all: true },
      })
    : [];
  const favoriteAdds7d = new Map<number, number>(
    favoriteRows.map((r) => [r.productId, r._count._all]),
  );

  const featuredProducts: MerchandisingSnapshotProduct[] = featuredProductRows.map((p) => {
    let stockStatus: MerchandisingStockStatus;
    if (!p.inventory || !p.inventory.trackInventory) {
      stockStatus = 'untracked';
    } else if (p.inventory.stockQuantity <= 0) {
      stockStatus = 'out_of_stock';
    } else if (p.inventory.stockQuantity <= p.inventory.lowStockThreshold) {
      stockStatus = 'low_stock';
    } else {
      stockStatus = 'ok';
    }
    return {
      id: p.id,
      name: p.name,
      priceCents: p.priceCents,
      addedToFeatured: config.updatedAt,
      orders7d: orders7dMap.get(p.id) ?? 0,
      orders30d: orders30dMap.get(p.id) ?? 0,
      views7d: null,
      favoriteAdds7d: favoriteAdds7d.get(p.id) ?? 0,
      stockStatus,
    };
  });

  // --- Featured categories: names, product counts, and orders in 7d ---
  const featuredCategoryRows = featuredCategoryIds.length > 0
    ? await prisma.category.findMany({
        where: { id: { in: featuredCategoryIds } },
        select: { id: true, name: true },
      })
    : [];

  const categoryProductCounts = new Map<number, number>();
  if (featuredCategoryIds.length > 0) {
    const counts = await prisma.product.groupBy({
      by: ['categoryId'],
      where: {
        isActive: true,
        categoryId: { in: featuredCategoryIds },
      },
      _count: { _all: true },
    });
    for (const c of counts) {
      if (c.categoryId != null) {
        categoryProductCounts.set(c.categoryId, c._count._all);
      }
    }
  }

  const categoryOrders7d = new Map<number, number>();
  if (featuredCategoryIds.length > 0) {
    const catOrderItems = await prisma.orderItem.findMany({
      where: {
        order: {
          createdAt: { gte: sevenDaysAgo },
          status: { notIn: EXCLUDED_ORDER_STATUSES },
        },
        product: { categoryId: { in: featuredCategoryIds } },
      },
      select: { product: { select: { categoryId: true } } },
    });
    for (const item of catOrderItems) {
      const cid = item.product?.categoryId;
      if (cid != null) {
        categoryOrders7d.set(cid, (categoryOrders7d.get(cid) ?? 0) + 1);
      }
    }
  }

  const featuredCategories: MerchandisingSnapshotCategory[] = featuredCategoryRows.map((c) => ({
    id: c.id,
    name: c.name,
    productCount: categoryProductCounts.get(c.id) ?? 0,
    orders7d: categoryOrders7d.get(c.id) ?? 0,
  }));

  // --- CMS blocks (all, including inactive — agent decides what to surface) ---
  const cmsBlockRows = await prisma.cmsBlock.findMany({
    orderBy: [{ order: 'asc' }, { id: 'asc' }],
    select: {
      id: true,
      key: true,
      type: true,
      order: true,
      isActive: true,
      startDate: true,
      endDate: true,
    },
  });
  const cmsBlocks: MerchandisingSnapshotCmsBlock[] = cmsBlockRows.map((b) => ({
    id: b.id,
    key: b.key,
    type: b.type,
    order: b.order,
    isActive: b.isActive,
    startDate: b.startDate,
    endDate: b.endDate,
  }));

  // --- Coverage gaps ---
  // categoriesWithoutFeatured: categories with active products that are NOT featured
  const featuredCatIdSet = new Set(featuredCategoryIds);
  const categoriesWithProducts = await prisma.product.groupBy({
    by: ['categoryId'],
    where: { isActive: true, categoryId: { not: null } },
    _count: { _all: true },
  });
  const nonFeaturedCatIds = categoriesWithProducts
    .map((c) => c.categoryId)
    .filter((id): id is number => id != null && !featuredCatIdSet.has(id));
  let categoriesWithoutFeatured: string[] = [];
  if (nonFeaturedCatIds.length > 0) {
    const rows = await prisma.category.findMany({
      where: { id: { in: nonFeaturedCatIds } },
      orderBy: { name: 'asc' },
      select: { name: true },
    });
    categoriesWithoutFeatured = rows.map((r) => r.name);
  }

  // featuredProductsWithZeroOrders: featured product IDs with zero orders in windowDays window
  const featuredProductsWithZeroOrders = featuredProductIds.filter(
    (id) => (ordersWindowMap.get(id) ?? 0) === 0,
  );

  return {
    windowDays,
    generatedAt: now,
    featuredProducts,
    featuredCategories,
    cmsBlocks,
    homepage: {
      heroTitle: config.heroTitle,
      heroSubtitle: config.heroSubtitle,
      showNewArrivals: config.showNewArrivals,
      showDeals: config.showDeals,
      showPopular: config.showPopular,
      updatedAt: config.updatedAt,
    },
    coverageGaps: {
      categoriesWithoutFeatured,
      featuredProductsWithZeroOrders,
    },
  };
}
