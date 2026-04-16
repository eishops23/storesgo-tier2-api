/* eslint-disable */
// ==========================================================
// 🚀 STORESGO BACKEND — CORE BOOT (Render-safe Minimal)
// ✅ No duplicate /api/health
// ✅ Compatible with Render & Next.js frontend
// ==========================================================

/* Correct Fastify v5 ESM import — Fastify does NOT ship index.mjs */
import Fastify from "fastify";
/* Correct @fastify/cors import — plugin root resolves automatically */
import cors from "@fastify/cors";

// ✅ Core routes only
import adminJwt from "./adminJwt.js";
import productRoutes from "./products.js";
import sellerRoutes from "./seller.js";
import searchRoutes from "./search.js";
import authRoutes from "./auth.js";
import shippingRoutes from "./shipping.js";

async function main() {
  const app = Fastify({
    logger: process.env.NODE_ENV !== "production",
  });

  // 🌍 Enable CORS globally
  await app.register(cors, { origin: "*" });

  // 🔐 JWT + Core Routes
  await app.register(adminJwt);
  await app.register(productRoutes, { prefix: "/api/products" });
  await app.register(sellerRoutes, { prefix: "/api/sellers" });
  await app.register(searchRoutes, { prefix: "/api/search" });
  await app.register(authRoutes, { prefix: "/api/auth" });
  await app.register(shippingRoutes, { prefix: "/api" });

  // ✅ Inline Health Route only in main backend, not here
  app.get("/api/health", async () => ({
    ok: true,
    message: "Health route active — Render-safe inline route",
  }));

  const port = process.env.PORT ? Number(process.env.PORT) : 5000;
  try {
    await app.listen({ port, host: "0.0.0.0" });
    console.log(`✅ Server running on port ${port}`);
  } catch (err) {
    app.log.error({ err }, "Failed to start server");
    process.exit(1);
  }
}

main();
