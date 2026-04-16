import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { batchCategorizeProducts } from "../../services/aiCategorization.service.js";

export default async function aiCategorizationRoutes(app: FastifyInstance) {
  /**
   * POST /api/admin/ai-categorize
   * Run batch AI categorization on uncategorized products
   */
  app.post(
    "/ai-categorize",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const query = request.query as { limit?: string };
      const limit = Math.min(parseInt(query.limit || "50"), 200);

      const result = await batchCategorizeProducts(limit);

      return reply.send({
        ok: true,
        ...result,
      });
    }
  );

  app.log.info("🤖 AI Categorization routes registered");
}
