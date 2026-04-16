/* eslint-disable */
import { generateProductSlug } from "../utils/slug.js";
// ==========================================================
// 🛍️ STORESGO PRODUCT ROUTES — Phase 16G.3 Final (Schema-Safe)
// Compatible with Phase 15A schema — ShippingMode enum RESTORED
// ==========================================================

import type { FastifyInstance } from "fastify";
import { ShippingMode } from "@prisma/client";

// Import shared prisma singleton
import { prisma } from "../lib/prisma.js";

// Placeholder image
const PLACEHOLDER_IMG = "https://via.placeholder.com/580x580/f0f0f0/999999?text=No+Image";

// --------------------------------------------
// UTILITIES
// --------------------------------------------

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

// Resolve seller ID from ✨ ANY source
function getSellerIdFromRequest(req: any): number | null {
  if (req.seller?.id) return Number(req.seller.id);
  if (req.user?.sellerId) return Number(req.user.sellerId);

  const id = req.query?.sellerId || req.body?.sellerId;
  return id ? Number(id) : null;
}

// Validate product input
async function validateProductInput(data: any) {
  const { name, priceCents, categoryId, categorySlug } = data;

  if (!name || name.trim().length === 0) {
    return { error: "Name is required" };
  }

  if (!priceCents || priceCents <= 0) {
    return { error: "Price must be greater than 0" };
  }

  if (categoryId) return { categoryId };

  if (categorySlug) {
    const c = await prisma.category.findUnique({ where: { slug: categorySlug } });
    if (!c) return { error: `Category '${categorySlug}' not found` };
    return { categoryId: c.id };
  }

  return { error: "categoryId or categorySlug required" };
}

// Resolve category for update
async function resolveCategoryId(categoryId?: number, categorySlug?: string) {
  if (categoryId) return { categoryId };

  if (categorySlug) {
    const c = await prisma.category.findUnique({ where: { slug: categorySlug } });
    if (!c) return { error: `Category '${categorySlug}' not found` };
    return { categoryId: c.id };
  }

  return { error: "categoryId or categorySlug required" };
}

// ==========================================================
// SHIPPING VALIDATION — FULLY ENUM SAFE
// ==========================================================

function validateShipping(input: any): {
  shippingMode: ShippingMode;
  freeShipping: boolean;
  flatRateAmount: number | null;
  shippingWeightGrams: number | null;
  shippingLengthCm: number | null;
  shippingWidthCm: number | null;
  shippingHeightCm: number | null;
} {
  const {
    shippingMode,
    flatRateAmount,
    freeShipping,
    shippingWeightGrams,
    shippingLengthCm,
    shippingWidthCm,
    shippingHeightCm,
  } = input;

  const mode = (shippingMode?.toUpperCase() || "LIVE") as string;

  // FREE SHIPPING
  if (mode === "FREE") {
    return {
      shippingMode: ShippingMode.FREE,
      freeShipping: true,
      flatRateAmount: null,
      shippingWeightGrams: null,
      shippingLengthCm: null,
      shippingWidthCm: null,
      shippingHeightCm: null,
    };
  }

  // FLAT RATE SHIPPING
  if (mode === "FLAT") {
    if (!flatRateAmount || flatRateAmount <= 0) {
      throw new Error("Flat rate amount must be > 0");
    }
    return {
      shippingMode: ShippingMode.FLAT,
      freeShipping: false,
      flatRateAmount: Number(flatRateAmount),
      shippingWeightGrams: null,
      shippingLengthCm: null,
      shippingWidthCm: null,
      shippingHeightCm: null,
    };
  }

  // LIVE RATES (Carrier)
  if (mode === "LIVE") {
    if (
      !shippingWeightGrams ||
      !shippingLengthCm ||
      !shippingWidthCm ||
      !shippingHeightCm
    ) {
      throw new Error("LIVE shipping requires weight + length + width + height");
    }

    return {
      shippingMode: ShippingMode.LIVE,
      freeShipping: false,
      flatRateAmount: null,
      shippingWeightGrams: Number(shippingWeightGrams),
      shippingLengthCm: Number(shippingLengthCm),
      shippingWidthCm: Number(shippingWidthCm),
      shippingHeightCm: Number(shippingHeightCm),
    };
  }

  // LOCAL PICKUP
  if (mode === "LOCAL") {
    return {
      shippingMode: ShippingMode.LOCAL,
      freeShipping: false,
      flatRateAmount: null,
      shippingWeightGrams: null,
      shippingLengthCm: null,
      shippingWidthCm: null,
      shippingHeightCm: null,
    };
  }

  throw new Error("Invalid shippingMode — must be FREE, FLAT, LIVE, or LOCAL");
}

// ==========================================================
// ROUTES
// ==========================================================

export default async function productRoutes(app: FastifyInstance) {
  // ----------------------------------------------------------
  // CREATE PRODUCT
  // ----------------------------------------------------------
  app.post("/products", async (req, reply) => {
    try {
      const body: any = req.body;

      // Validate required fields
      if (!body.name) return reply.status(400).send({ error: "Name required" });
      if (!body.priceCents || body.priceCents <= 0)
        return reply.status(400).send({ error: "Price must be > 0" });

      if (!body.sellerId)
        return reply.status(400).send({ error: "sellerId required" });

      const validation = await validateProductInput(body);
      if (validation.error) {
        return reply.status(400).send({ error: validation.error });
      }

      // Shipping
      let shippingData;
      try {
        shippingData = validateShipping(body);
      } catch (e: any) {
        return reply.status(400).send({ error: e.message });
      }

      const product = await prisma.product.create({
        data: {
          name: body.name.trim(),
          description: body.description?.trim() || null,
          priceCents: body.priceCents,
          currency: "USD",
          sellerId: body.sellerId,
          storeId: body.storeId || null,
          categoryId: validation.categoryId!,
          status: "pending",
          isActive: body.isActive ?? true,
          ...shippingData,
        },
        include: {
          seller: { select: { slug: true, storeName: true } },
          store: { select: { name: true, image: true } },
          category: { select: { name: true, slug: true, image: true } },
        },
      });

      // Generate slug
      const updatedProduct = await prisma.product.update({
        where: { id: product.id },
        data: { slug: generateProductSlug(product.name, product.id) },
        include: {
          seller: { select: { slug: true, storeName: true } },
          store: { select: { name: true, image: true } },
          category: { select: { name: true, slug: true, image: true } },
        },
      });
      reply.status(201).send({ ok: true, product: updatedProduct });
    } catch (err) {
      console.error("❌ Error creating product:", err);
      reply.status(500).send({ error: "Failed to create product" });
    }
  });

  // ----------------------------------------------------------
  // GET ALL PRODUCTS (filtering + pagination)
  // ----------------------------------------------------------
  app.get("/products", async (req, reply) => {
    try {
      const q = req.query as any;

      const where: any = {};

      if (q.categoryId) where.categoryId = Number(q.categoryId);
      if (q.sellerId) where.sellerId = Number(q.sellerId);
      if (q.storeId) where.storeId = Number(q.storeId);
      if (q.isActive !== undefined) where.isActive = q.isActive === "true";

      if (q.categorySlug) {
        const c = await prisma.category.findUnique({ where: { slug: q.categorySlug } });
        if (c) where.categoryId = c.id;
      }

      if (q.search) {
        where.name = { contains: q.search, mode: "insensitive" };
      }

      const page = Number(q.page || 1);
      const pageSize = Number(q.pageSize || 20);
      const skip = (page - 1) * pageSize;

      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: { createdAt: "desc" },
          include: {
            seller: true,
            store: true,
            category: true,
          },
        }),
        prisma.product.count({ where }),
      ]);

      reply.send({
        ok: true,
        products,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      });
    } catch (err: any) {
      console.error("❌ GET /products error:", err);
      reply.status(500).send({ error: err.message });
    }
  });

  // ----------------------------------------------------------
  // GET SINGLE PRODUCT
  // ----------------------------------------------------------
  app.get("/products/:id", async (req, reply) => {
    const id = Number((req.params as any).id);
    if (isNaN(id)) return reply.status(400).send({ error: "Invalid ID" });

    try {
      const product = await prisma.product.findUnique({
        where: { id },
        include: {
          seller: true,
          store: true,
          category: true,
        },
      });

      if (!product) return reply.status(404).send({ error: "Product not found" });

      reply.send({ ok: true, product });
    } catch (err) {
      console.error("❌ Error fetching product:", err);
      reply.status(500).send({ error: "Failed to fetch product" });
    }
  });

  // ----------------------------------------------------------
  // UPDATE PRODUCT
  // ----------------------------------------------------------
  app.put("/products/:id", async (req, reply) => {
    const id = Number((req.params as any).id);
    if (isNaN(id)) return reply.status(400).send({ error: "Invalid ID" });

    try {
      const body: any = req.body;

      const existing = await prisma.product.findUnique({ where: { id } });
      if (!existing) return reply.status(404).send({ error: "Not found" });

      const updateData: any = {};

      if (body.name) updateData.name = body.name.trim();
      if (body.description !== undefined)
        updateData.description = body.description?.trim() || null;
      if (body.priceCents !== undefined) {
        if (body.priceCents <= 0)
          return reply.status(400).send({ error: "Price > 0 required" });
        updateData.priceCents = body.priceCents;
      }

      if (body.sellerId !== undefined) updateData.sellerId = body.sellerId;
      if (body.storeId !== undefined) updateData.storeId = body.storeId;
      if (body.isActive !== undefined) updateData.isActive = body.isActive;

      // Category
      if (body.categoryId || body.categorySlug) {
        const resolved = await resolveCategoryId(body.categoryId, body.categorySlug);
        if (resolved.error) return reply.status(400).send({ error: resolved.error });
        updateData.categoryId = resolved.categoryId;
      }

      // Shipping updates
      if (
        body.shippingMode ||
        body.flatRateAmount !== undefined ||
        body.freeShipping !== undefined ||
        body.shippingWeightGrams !== undefined ||
        body.shippingLengthCm !== undefined ||
        body.shippingWidthCm !== undefined ||
        body.shippingHeightCm !== undefined
      ) {
        try {
          const shippingData = validateShipping(body);
          Object.assign(updateData, shippingData);
        } catch (err: any) {
          return reply.status(400).send({ error: err.message });
        }
      }

      const updated = await prisma.product.update({
        where: { id },
        data: updateData,
        include: {
          seller: true,
          store: true,
          category: true,
        },
      });

      reply.send({ ok: true, product: updated });
    } catch (err) {
      console.error("❌ Error updating:", err);
      reply.status(500).send({ error: "Failed to update product" });
    }
  });

  // ----------------------------------------------------------
  // DELETE (SOFT DELETE)
  // ----------------------------------------------------------
  app.delete("/products/:id", async (req, reply) => {
    const id = Number((req.params as any).id);
    if (isNaN(id)) return reply.status(400).send({ error: "Invalid ID" });

    try {
      const existing = await prisma.product.findUnique({ where: { id } });
      if (!existing) return reply.status(404).send({ error: "Not found" });

      await prisma.product.update({
        where: { id },
        data: { status: "archived", isActive: false },
      });

      reply.send({ ok: true, message: "Product archived" });
    } catch (err) {
      console.error("❌ Error archiving product:", err);
      reply.status(500).send({ error: "Failed to archive" });
    }
  });

  // ----------------------------------------------------------
  // TRENDING
  // ----------------------------------------------------------
  app.get("/api/products/trending", async (_req, reply) => {
    try {
      let trending: any[] = [];

      try {
        trending = await prisma.product.findMany({
          take: 10,
          orderBy: { createdAt: "desc" },
          include: {
            store: { select: { image: true } },
            category: { select: { image: true } },
          },
        });
      } catch {
        console.warn("⚠ Fallback trending used");
      }

      if (!trending.length) {
        trending = [
          {
            id: 1,
            name: "Jerk Seasoning",
            priceCents: 499,
            currency: "USD",
            image: "https://cdn.storesgo.com/fallback-products/jerk-seasoning.png",
          },
          {
            id: 2,
            name: "Coconut Oil",
            priceCents: 799,
            currency: "USD",
            image: "https://cdn.storesgo.com/fallback-products/coconut-oil.png",
          },
        ];
      } else {
        trending = trending.map((p: any) => ({
          id: p.id,
          name: p.name,
          priceCents: p.priceCents,
          currency: p.currency,
          image: p.store?.image || p.category?.image || PLACEHOLDER_IMG,
        }));
      }

      reply.send({ ok: true, products: trending });
    } catch (err) {
      console.error("❌ Trending error:", err);
      reply.send({
        ok: true,
        products: [
          {
            id: 999,
            name: "Sample Product (Offline Mode)",
            priceCents: 999,
            currency: "USD",
            image: PLACEHOLDER_IMG,
          },
        ],
      });
    }
  });
}
