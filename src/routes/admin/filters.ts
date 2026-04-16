// ==========================================================
// STORESGO ADMIN FILTER ROUTES — Filter Config Management
// ==========================================================

import type { FastifyInstance } from "fastify";
import * as filterService from "../../services/filter.service.js";
import { requireAdmin } from "../../utils/requireAdmin.js";

export default async function adminFilterRoutes(app: FastifyInstance) {
  // Protect all routes
  app.addHook("preHandler", requireAdmin);

  /**
   * GET /api/admin/filters/configs
   * List all filter configs
   */
  app.get("/configs", async () => {
    const configs = await filterService.getFilterConfigsAdmin();
    return { ok: true, data: configs };
  });

  /**
   * POST /api/admin/filters/configs
   * Create filter config
   */
  app.post("/configs", async (request) => {
    const data = request.body as any;
    const config = await filterService.createFilterConfig(data);
    return { ok: true, data: config };
  });

  /**
   * PATCH /api/admin/filters/configs/:id
   * Update filter config
   */
  app.patch("/configs/:id", async (request) => {
    const { id } = request.params as any;
    const data = request.body as any;
    const config = await filterService.updateFilterConfig(Number(id), data);
    return { ok: true, data: config };
  });

  /**
   * DELETE /api/admin/filters/configs/:id
   * Delete filter config
   */
  app.delete("/configs/:id", async (request) => {
    const { id } = request.params as any;
    await filterService.deleteFilterConfig(Number(id));
    return { ok: true };
  });

  /**
   * GET /api/admin/filters/stats
   * Attribute statistics
   */
  app.get("/stats", async () => {
    const stats = await filterService.getAttributeStats();
    return { ok: true, data: stats };
  });

  /**
   * POST /api/admin/filters/extract
   * Trigger attribute extraction
   */
  app.post("/extract", async (request) => {
    const { batchSize } = (request.body as any) || {};
    const result = await filterService.extractAllProductAttributes({ batchSize: batchSize || 1000 });
    return { ok: true, data: result };
  });

  /**
   * POST /api/admin/filters/extract-product/:id
   * Extract attributes for single product
   */
  app.post("/extract-product/:id", async (request) => {
    const { id } = request.params as any;
    const count = await filterService.extractProductAttributes(Number(id));
    return { ok: true, data: { productId: Number(id), attributesCreated: count } };
  });
}
