/* eslint-disable */
import { generateProductSlug } from "../utils/slug.js";
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";

// Import shared prisma singleton
import { prisma } from "../lib/prisma.js";

export default async function sellerRoutes(app: FastifyInstance) {
  // ----------------------------------------------------------
  // 💚 Health Check
  // ----------------------------------------------------------
  app.get("/seller/health", async () => ({
    ok: true,
    message: "Seller routes active (ESM-safe)",
    timestamp: new Date().toISOString(),
  }));

  // ----------------------------------------------------------
  // 👤 Get Seller Profile
  // ----------------------------------------------------------
  app.get(
    "/seller/:id",
    async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const seller = await prisma.seller.findUnique({
          where: { id: Number(req.params.id) },
          include: { products: true, orders: true },
        });

        if (!seller)
          return reply.code(404).send({ ok: false, error: "Seller not found" });

        return reply.send({ ok: true, seller });
      } catch (err: any) {
        console.error("❌ Seller profile error:", err.message);
        return reply.code(500).send({ ok: false, error: err.message });
      }
    }
  );

  // ----------------------------------------------------------
  // ✏️ Update Seller Info
  // ----------------------------------------------------------
  app.put(
    "/seller/:id",
    async (
      req: FastifyRequest<{ Params: { id: string }; Body: Record<string, any> }>,
      reply: FastifyReply
    ) => {
      try {
        const data = req.body || {};

        const seller = await prisma.seller.update({
          where: { id: Number(req.params.id) },
          data: {
            storeName: data.storeName,
            city: data.city,
            state: data.state,
            country: data.country,
            about: data.about,
          },
        });

        return reply.send({ ok: true, seller });
      } catch (err: any) {
        console.error("❌ Seller update error:", err.message);
        return reply.code(500).send({ ok: false, error: err.message });
      }
    }
  );

  // ----------------------------------------------------------
  // ➕ Add Product
  // ----------------------------------------------------------
  app.post(
    "/seller/:id/products",
    async (
      req: FastifyRequest<{ Params: { id: string }; Body: Record<string, any> }>,
      reply: FastifyReply
    ) => {
      try {
        const body = req.body || {};

        const product = await prisma.product.create({
          data: {
            sellerId: Number(req.params.id),
            name: body.name,
            description: body.description || "",
            priceCents: Math.round(Number(body.price || 0) * 100),
            sku: body.sku || null,
            status: "pending",
          },
        });

        // Generate slug
        const updatedProduct = await prisma.product.update({
          where: { id: product.id },
          data: { slug: generateProductSlug(product.name, product.id) },
        });
        return reply.send({ ok: true, product: updatedProduct });
      } catch (err: any) {
        console.error("❌ Product add error:", err.message);
        return reply.code(500).send({ ok: false, error: err.message });
      }
    }
  );

  // ----------------------------------------------------------
  // 📦 Seller Products
  // ----------------------------------------------------------
  app.get(
    "/seller/:id/products",
    async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const products = await prisma.product.findMany({
          where: { sellerId: Number(req.params.id) },
          orderBy: { createdAt: "desc" },
        });

        return reply.send({ ok: true, products });
      } catch (err: any) {
        console.error("❌ Seller products error:", err.message);
        return reply.code(500).send({ ok: false, error: err.message });
      }
    }
  );

  // ----------------------------------------------------------
  // 💰 Seller Earnings
  // ----------------------------------------------------------
  app.get(
    "/seller/:id/earnings",
    async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const orders = await prisma.order.findMany({
          where: { sellerId: Number(req.params.id), status: "completed" },
          select: { totalAmountCents: true },
        });

        const totalEarned = orders.reduce(
          (acc, o) => acc + (o.totalAmountCents || 0),
          0
        );

        return reply.send({
          ok: true,
          earnings: totalEarned / 100,
          orders: orders.length,
        });
      } catch (err: any) {
        console.error("❌ Seller earnings error:", err.message);
        return reply.code(500).send({ ok: false, error: err.message });
      }
    }
  );

  console.log("🛍️ Seller routes registered (final schema aligned)");
}
