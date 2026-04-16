// ==========================================================
// STORESGO SELLERS ROUTES — PHASE 6 + PDP SUPPORT
// Public seller listing and detail routes for storefront
// ==========================================================

import type { FastifyInstance } from "fastify";
import {
  listSellers,
  getSellerBySlug,
  getSellerById,
  getSellerProducts,
} from "../../services/sellers.service.js";
import { buildPaginatedResponse } from "../../utils/pagination.js";

export default async function sellerRoutes(app: FastifyInstance) {
  /**
   * GET /api/sellers
   * List all approved sellers with pagination
   * Query params: page, pageSize, q (search), city, state, country
   */
  app.get("/", async (request, reply) => {
    const result = await listSellers(request.query as any);
    reply.send(
      buildPaginatedResponse(result.items, result.page, result.pageSize, result.total)
    );
  });

  /**
   * GET /api/sellers/:id/products
   * Get products by seller ID (for PDP - other products by this seller)
   * Query params: limit (default 8, max 8), excludeProductId (optional)
   */
  app.get("/:id/products", async (request, reply) => {
    const { id } = request.params as { id: string };
    const query = request.query as { limit?: string; excludeProductId?: string };

    const sellerId = Number(id);
    if (isNaN(sellerId) || sellerId <= 0) {
      reply.status(400).send({ ok: false, error: "Invalid seller ID" });
      return;
    }

    const limit = Math.min(Math.max(1, Number(query.limit) || 8), 8);
    const excludeProductId = query.excludeProductId 
      ? Number(query.excludeProductId) 
      : undefined;

    const products = await getSellerProducts(sellerId, limit, excludeProductId);
    reply.send({ ok: true, data: products });
  });

  /**
   * GET /api/sellers/:identifier
   * Get seller by slug or ID
   */
  app.get("/:identifier", async (request, reply) => {
    const { identifier } = request.params as { identifier: string };

    // Check if identifier is a number (ID) or string (slug)
    const isNumeric = /^\d+$/.test(identifier);
    
    const seller = isNumeric
      ? await getSellerById(Number(identifier))
      : await getSellerBySlug(identifier);

    if (!seller) {
      reply.status(404).send({ ok: false, error: "Seller not found" });
      return;
    }

    reply.send({ ok: true, data: seller });
  });

  app.log.info("📄 Sellers routes registered");
}
