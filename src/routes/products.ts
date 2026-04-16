// =============================================================================
// STORESGO PRODUCTS ROUTES — Performance-Optimized
// =============================================================================
// Location: src/routes/products.ts
// Changes:
// 1. Homepage sections (/popular, /deals, /new, /featured) cached via Redis
// 2. COUNT(*) cached — no more full table scan per request
// 3. Column-scoped selects for card endpoints (no SELECT *)
// 4. /deals uses deterministic cheap-products query (no random skip)
// =============================================================================

import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import {
  listProductsHandler,
  getProductByIdHandler,
  listProductsBySellerHandler,
  listProductsByCategoryHandler,
  searchProductsHandler,
  recommendProductsHandler,
  getRelatedProductsHandler,
} from "../controllers/products.controller.js";
import {
  listProductsWithCursor,
  searchProductsWithCursor,
  getProductsCount,
} from "../services/products.service.js";
import { prisma } from "../lib/prisma.js";
import { cached, TTL, initCache } from "../lib/cache.js";

// Lightweight select for homepage product cards
const CARD_SELECT = {
  id: true,
  name: true,
  slug: true,
  priceCents: true,
  currency: true,
  imageUrl: true,
  updatedAt: true,
  createdAt: true,
  seller: { select: { id: true, storeName: true, slug: true } },
  category: { select: { id: true, name: true, slug: true } },
};

// Cached active product count (shared across all homepage sections)
async function getActiveCount(): Promise<number> {
  return cached("products:active_count", TTL.SHORT, () =>
    prisma.product.count({ where: { isActive: true } })
  );
}

export default async function productRoutes(app: FastifyInstance) {
  // Initialize Redis on route registration
  await initCache();

  // Standard routes
  app.get("/", listProductsHandler);
  app.get("/search", searchProductsHandler);
  app.get("/seller/:sellerId", listProductsBySellerHandler);
  app.get("/category/:categoryId", listProductsByCategoryHandler);

  // ==========================================================
  // HOMEPAGE PRODUCT SECTIONS — CACHED
  // ==========================================================

  // GET /api/products/popular - Trending products (cached 30s)
  app.get("/popular", async (request: FastifyRequest, reply: FastifyReply) => {
    const { limit = "12" } = request.query as { limit?: string };
    const take = Math.min(parseInt(limit), 24);

    const data = await cached(`products:popular:${take}`, TTL.SHORT, async () => {
      const count = await getActiveCount();
      const randomSkip = Math.max(0, Math.floor(Math.random() * Math.max(1, count - take)));
      return prisma.product.findMany({
        where: { isActive: true },
        take,
        skip: randomSkip,
        orderBy: { updatedAt: "desc" },
        select: CARD_SELECT,
      });
    });

    return reply.send({ ok: true, data });
  });

  // GET /api/products/deals - Low price products (cached 30s)
  app.get("/deals", async (request: FastifyRequest, reply: FastifyReply) => {
    const { limit = "12" } = request.query as { limit?: string };
    const take = Math.min(parseInt(limit), 24);

    const data = await cached(`products:deals:${take}`, TTL.SHORT, async () => {
      return prisma.product.findMany({
        where: { isActive: true, priceCents: { gt: 0 } },
        take,
        orderBy: { priceCents: "asc" },
        select: CARD_SELECT,
      });
    });

    return reply.send({ ok: true, data });
  });

  // GET /api/products/new - New arrivals (cached 30s)
  app.get("/new", async (request: FastifyRequest, reply: FastifyReply) => {
    const { limit = "12" } = request.query as { limit?: string };
    const take = Math.min(parseInt(limit), 24);

    const data = await cached(`products:new:${take}`, TTL.SHORT, async () => {
      return prisma.product.findMany({
        where: { isActive: true },
        take,
        orderBy: { createdAt: "desc" },
        select: CARD_SELECT,
      });
    });

    return reply.send({ ok: true, data });
  });

  // GET /api/products/featured - Featured products (cached 30s)
  app.get("/featured", async (request: FastifyRequest, reply: FastifyReply) => {
    const { limit = "12" } = request.query as { limit?: string };
    const take = Math.min(parseInt(limit), 24);

    const data = await cached(`products:featured:${take}`, TTL.SHORT, async () => {
      const count = await getActiveCount();
      const randomSkip = Math.max(0, Math.floor(Math.random() * Math.max(1, count - take)));
      return prisma.product.findMany({
        where: { isActive: true },
        take,
        skip: randomSkip,
        orderBy: { updatedAt: "desc" },
        select: CARD_SELECT,
      });
    });

    return reply.send({ ok: true, data });
  });

  // ==========================================================
  // DYNAMIC ID ROUTES - MUST BE AFTER SPECIFIC ROUTES!
  // ==========================================================
  app.get("/:id", getProductByIdHandler);
  app.get("/:id/recommend", recommendProductsHandler);
  app.get("/:id/related", getRelatedProductsHandler);
}
