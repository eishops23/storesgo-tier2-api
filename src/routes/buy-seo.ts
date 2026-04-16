// =============================================================================
// STORESGO BUY-SEO ROUTES — Performance-Optimized
// =============================================================================
// Location: src/routes/buy-seo.ts
// Changes:
// 1. Full response cached 2 min (bot crawls = same URL repeated)
// 2. All DB queries run in PARALLEL (was: 6 sequential)
// 3. ORDER BY RANDOM() replaced with deterministic OFFSET
// 4. Buyable products cached separately (shared across all pages)
// 5. Graceful degradation: failed sub-queries return empty, not crash
// =============================================================================

import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../lib/prisma.js";
import { cached, TTL, initCache } from "../lib/cache.js";

function slugToSearchTerms(slug: string): string[] {
  return slug.split('-').filter(t => t.length > 2);
}

// Deterministic offset from slug — same slug always gets same products,
// different slugs get different sets. Replaces ORDER BY RANDOM().
function hashOffset(str: string, max: number): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % Math.max(1, max);
}

export default async function buySeoRoutes(app: FastifyInstance) {
  await initCache();

  app.get("/:product/:city", async (request: FastifyRequest, reply: FastifyReply) => {
    const { product, city } = request.params as { product: string; city: string };

    // Cache entire buy-seo response for 2 minutes.
    // Bot crawls hitting the same URL get cached data instantly.
    const cacheKey = `buyseo:${product}:${city}`;
    const response = await cached(cacheKey, TTL.MEDIUM, () =>
      computeBuySeoResponse(product, city)
    );

    return reply.send(response);
  });

  app.post("/waitlist", async (request: FastifyRequest, reply: FastifyReply) => {
    const { productSlug, email, city } = request.body as { productSlug: string; email: string; city?: string };
    if (!productSlug || !email) {
      return reply.code(400).send({ ok: false, error: 'Product slug and email required' });
    }
    try {
      const existing: any[] = await prisma.$queryRawUnsafe(
        `SELECT id FROM product_universe WHERE slug = $1 LIMIT 1`, productSlug
      );
      let productId: number;
      if (existing.length === 0) {
        const created: any[] = await prisma.$queryRawUnsafe(
          `INSERT INTO product_universe (name, slug, walmart_available) VALUES ($1, $2, false) RETURNING id`,
          productSlug.replace(/-/g, ' '), productSlug
        );
        productId = created[0].id;
      } else {
        productId = existing[0].id;
      }
      await prisma.$queryRawUnsafe(
        `INSERT INTO product_waitlist (product_universe_id, email, city) VALUES ($1, $2, $3)`,
        productId, email, city || null
      );
      await prisma.$queryRawUnsafe(
        `UPDATE product_universe SET waitlist_count = waitlist_count + 1 WHERE id = $1`, productId
      );
      return { ok: true, message: 'Added to waitlist' };
    } catch (error: any) {
      console.error('Waitlist error:', error);
      return reply.code(500).send({ ok: false, error: 'Failed to join waitlist' });
    }
  });

  app.get("/universe/stats", async (request: FastifyRequest, reply: FastifyReply) => {
    const data = await cached("buyseo:universe_stats", TTL.LONG, async () => {
      const stats: any[] = await prisma.$queryRawUnsafe(`
        SELECT
          (SELECT COUNT(*) FROM product_universe) as universe_count,
          (SELECT COUNT(*) FROM product_universe WHERE walmart_available = true) as walmart_count,
          (SELECT COUNT(*) FROM product_waitlist) as waitlist_count
      `);
      return stats[0];
    });
    return { ok: true, data };
  });
}

// =====================================================================
// Core computation — runs on cache miss only
// =====================================================================
async function computeBuySeoResponse(product: string, city: string) {
  const searchTerms = slugToSearchTerms(product);
  const searchPattern = searchTerms[0] ? `%${searchTerms[0]}%` : '%';

  const searchConditions = searchTerms.map(term => ({
    OR: [
      { name: { contains: term, mode: 'insensitive' as const } },
      { slug: { contains: term, mode: 'insensitive' as const } },
    ]
  }));

  // =====================================================================
  // ALL queries in PARALLEL. Original: 6 sequential, each blocking the next.
  // Now: all fire at once, total time = max(individual times).
  // =====================================================================
  const [inventoryResult, walmartResult, universeResult, buyableResult] =
    await Promise.allSettled([

      // 1. Inventory search (findMany + count in parallel)
      (async () => {
        const [dbProducts, productCount] = await Promise.all([
          prisma.product.findMany({
            where: { isActive: true, AND: searchConditions },
            select: {
              id: true, name: true, slug: true, priceCents: true, imageUrl: true,
              seller: { select: { id: true, storeName: true, slug: true } },
              category: { select: { id: true, name: true, slug: true } },
            },
            take: 20,
            orderBy: { updatedAt: 'desc' },
          }),
          prisma.product.count({
            where: { isActive: true, AND: searchConditions },
          }),
        ]);
        return { dbProducts, productCount };
      })(),

      // 2. Walmart products
      prisma.$queryRawUnsafe(
        `SELECT id, name, slug, brand, category, cuisine, image_url,
                walmart_price_cents, storesgo_price_cents
         FROM product_universe
         WHERE walmart_available = true
         AND (name ILIKE $1 OR slug ILIKE $1 OR brand ILIKE $1)
         LIMIT 10`,
        searchPattern
      ).catch(() => [] as any[]),

      // 3. Universe product + related (combined for fewer round trips)
      (async () => {
        const universeResults: any[] = await prisma.$queryRawUnsafe<any[]>(
          `SELECT id, name, slug, brand, description, image_url, category, subcategory,
                  cuisine, tags, meta_title, meta_description
           FROM product_universe WHERE slug = $1 LIMIT 1`,
          product
        ).catch(() => [] as any[]);

        const universeProduct = universeResults.length > 0 ? universeResults[0] : null;
        let relatedProducts: any[] = [];

        if (universeProduct?.category) {
          const offset = hashOffset(product, 100);
          relatedProducts = await prisma.$queryRawUnsafe<any[]>(
            `SELECT name, slug, image_url, brand, category
             FROM product_universe
             WHERE category = $1 AND slug != $2
             OFFSET $3 LIMIT 6`,
            universeProduct.category, product, offset
          ).catch(() => [] as any[]);
        }

        if (relatedProducts.length < 4) {
          const cuisineFilter = universeProduct?.cuisine || 'Caribbean';
          const offset2 = hashOffset(product + city, 50);
          const fill: any[] = await prisma.$queryRawUnsafe<any[]>(
            `SELECT name, slug, image_url, brand, category
             FROM product_universe
             WHERE cuisine ILIKE $1 AND slug != $2
             OFFSET $3 LIMIT $4`,
            `%${cuisineFilter}%`, product, offset2, 6 - relatedProducts.length
          ).catch(() => [] as any[]);
          relatedProducts = [...relatedProducts, ...fill];
        }

        return { universeProduct, relatedProducts };
      })(),

      // 4. Buyable products (cached separately — shared across ALL buy-seo pages)
      cached("buyseo:buyable_products", TTL.SHORT, () =>
        prisma.product.findMany({
          where: { isActive: true, priceCents: { gt: 0 } },
          select: { id: true, name: true, slug: true, imageUrl: true, priceCents: true },
          take: 6,
          orderBy: { updatedAt: 'desc' },
        })
      ),
    ]);

  // =====================================================================
  // Extract results with graceful fallbacks
  // =====================================================================
  const inventory = inventoryResult.status === 'fulfilled'
    ? inventoryResult.value : { dbProducts: [], productCount: 0 };
  const walmartRaw: any[] = walmartResult.status === 'fulfilled'
    ? (walmartResult.value as any[]) : [];
  const universe = universeResult.status === 'fulfilled'
    ? universeResult.value : { universeProduct: null, relatedProducts: [] };
  const buyableRaw: any[] = buyableResult.status === 'fulfilled'
    ? (buyableResult.value as any[]) : [];

  // Format inventory
  const realProducts = inventory.dbProducts.map((p: any) => ({
    id: p.id, name: p.name, slug: p.slug,
    price: (p.priceCents / 100).toFixed(2), priceCents: p.priceCents,
    imageUrl: p.imageUrl, source: 'inventory',
    seller: p.seller ? { id: p.seller.id, name: p.seller.storeName, slug: p.seller.slug } : null,
    category: p.category ? { id: p.category.id, name: p.category.name, slug: p.category.slug } : null,
  }));

  const priceRange = (() => {
    const prices = inventory.dbProducts.map((p: any) => p.priceCents).filter((p: number) => p > 0);
    return prices.length > 0
      ? { min: Math.min(...prices) / 100, max: Math.max(...prices) / 100 }
      : { min: 0, max: 0 };
  })();

  // Format walmart
  const walmartProducts = walmartRaw.map((p: any) => ({
    id: p.id, name: p.name, slug: p.slug, brand: p.brand,
    price: (p.storesgo_price_cents / 100).toFixed(2),
    priceCents: p.storesgo_price_cents,
    walmartPrice: (p.walmart_price_cents / 100).toFixed(2),
    imageUrl: p.image_url, source: 'walmart_express',
    fulfillmentNote: 'Available via StoresGo Express',
  }));

  // Format related
  const relatedUniverseProducts = universe.relatedProducts.map((p: any) => ({
    name: p.name, slug: p.slug, imageUrl: p.image_url,
    brand: p.brand, category: p.category,
  }));

  // Status
  let availabilityStatus = 'none';
  if (realProducts.length > 0) availabilityStatus = 'in_stock';
  else if (walmartProducts.length > 0) availabilityStatus = 'walmart_available';

  const universeProduct = universe.universeProduct;
  const productName = universeProduct?.name
    || searchTerms.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(' ');
  const cityName = city.split('-').map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(' ');

  const metaTitle = universeProduct?.meta_title
    ? `${universeProduct.meta_title} in ${cityName}`
    : `Buy ${productName} in ${cityName} | StoresGo`;
  const metaDescription = universeProduct?.meta_description
    ? `${universeProduct.meta_description} Available in ${cityName}, FL. Order online for delivery.`
    : `Find ${productName} near you in ${cityName}. Order online for delivery.`;

  const buyableProducts = buyableRaw.map((p: any) => ({
    name: p.name, slug: p.slug, imageUrl: p.imageUrl,
    price: (p.priceCents / 100).toFixed(2),
    source: 'inventory', productPageSlug: p.slug,
  }));

  const mergedRelated = realProducts.length > 0
    ? realProducts.slice(0, 4).map((p: any) => ({
        name: p.name, slug: p.slug, imageUrl: p.imageUrl,
        price: p.price, source: 'inventory', productPageSlug: p.slug
      }))
    : buyableProducts.slice(0, 4);

  const universeRelated = relatedUniverseProducts
    .filter((p: any) => !mergedRelated.find((m: any) => m.slug === p.slug))
    .slice(0, 6 - mergedRelated.length)
    .map((p: any) => ({ name: p.name, slug: p.slug, imageUrl: p.imageUrl, source: 'universe' }));

  return {
    ok: true,
    data: {
      product: {
        slug: product, name: productName,
        description: universeProduct?.description || '',
        imageUrl: universeProduct?.image_url || '',
        brand: universeProduct?.brand || '',
        category: universeProduct?.category || 'Ethnic Groceries',
        subcategory: universeProduct?.subcategory || '',
        cuisine: universeProduct?.cuisine
          ? (typeof universeProduct.cuisine === 'string'
              ? universeProduct.cuisine.split(',').map((c: string) => c.trim()).filter(Boolean)
              : [universeProduct.cuisine])
          : ['Caribbean', 'Latin', 'African', 'Asian'],
        tags: universeProduct?.tags || [],
      },
      city: { slug: city, name: cityName, state: 'FL', metro: 'South Florida' },
      metaTitle, metaDescription,
      heroTitle: `Buy ${productName} in ${cityName}`,
      heroSubtitle: `Get authentic ${productName} delivered to your door.`,
      availabilityStatus, realProducts,
      productCount: inventory.productCount, priceRange,
      hasRealData: realProducts.length > 0,
      walmartProducts, hasWalmartData: walmartProducts.length > 0,
      showWaitlist: availabilityStatus === 'none',
      benefits: [
        'Same-day delivery available', 'Authentic ethnic products',
        'Support local stores', 'Fresh quality guaranteed'
      ],
      relatedProducts: [...mergedRelated, ...universeRelated],
      nearbyCities: [
        { slug: 'miami', name: 'Miami', state: 'FL' },
        { slug: 'fort-lauderdale', name: 'Fort Lauderdale', state: 'FL' },
        { slug: 'west-palm-beach', name: 'West Palm Beach', state: 'FL' },
        { slug: 'hollywood', name: 'Hollywood', state: 'FL' }
      ]
    }
  };
}
