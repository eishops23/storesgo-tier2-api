/* eslint-disable */
// =============================================================================
// 🏠 STORESGO BACKEND — HOMEPAGE ROUTES (Final Render-Safe)
// ✅ Dynamic categories using shared Prisma singleton
// ✅ Provides /api/homepage/data and /api/categories
// ✅ Fixed prefix handling for Render + local
// =============================================================================

import { FastifyInstance } from "fastify";

// Import shared prisma singleton
import { prisma } from "../lib/prisma.js";

export default async function homepageRoutes(app: FastifyInstance) {
  // ✅ Main Homepage Data Route
  app.get("/data", async (_req, reply) => {
    try {
      const categories = await prisma.category.findMany({
        orderBy: { id: "asc" },
      });

      return reply.send({
        ok: true,
        categories: categories.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          image: `/images/${c.slug}.jpg`,
        })),

        sellerBanners: [
          {
            id: "seller-1",
            title: "Island Delights Market",
            subtitle: "Fresh patties, spices, and more",
            image: "/images/seller-island-delights.jpg",
            cta: { label: "Shop Now", href: "/seller/island-delights" },
          },
          {
            id: "seller-2",
            title: "Casa Latina",
            subtitle: "Authentic Latin pantry staples",
            image: "/images/seller-casa-latina.jpg",
            cta: { label: "Browse Store", href: "/seller/casa-latina" },
          },
        ],

        trending: [
          { id: "p1", name: "Jerk Seasoning", price: 7.99, image: "/images/p-jerk.jpg" },
          { id: "p2", name: "Plantain Chips", price: 3.49, image: "/images/p-plantain.jpg" },
          { id: "p3", name: "Thai Curry Paste", price: 4.99, image: "/images/p-thai-curry.jpg" },
          { id: "p4", name: "Yerba Mate", price: 9.99, image: "/images/p-yerba.jpg" },
        ],

        seo: {
          highlights: [
            "Autoblogging queue healthy",
            "New category pages generated",
            "Top keywords trending: jerk seasoning, plantain chips",
          ],
        },
      });
    } catch (err) {
      console.error("❌ Homepage data fetch failed:", err);
      return reply.status(500).send({ error: "Failed to load homepage data" });
    }
  });

  // ✅ Standalone Categories Endpoint
  app.get("/categories", async (_req, reply) => {
    try {
      const categories = await prisma.category.findMany({
        orderBy: { id: "asc" },
      });
      return reply.send({ ok: true, categories });
    } catch (err) {
      console.error("❌ Categories fetch failed:", err);
      return reply.status(500).send({ error: "Failed to load categories" });
    }
  });
}
