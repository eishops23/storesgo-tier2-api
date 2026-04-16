// ==========================================================
// STORESGO RECOMMENDATIONS WIDGET ROUTE (Phase 18A Prompt 4)
// Stateless, LLM-free cart-completion recommendations.
//
// POST /api/recommend/cart is a widget-facing companion to the
// conversational /api/chat recommendations branch. It bypasses
// the LLM entirely and calls recommendFromCartForAgent directly
// for fast (<1s) product-page sidebar and checkout cart-complete
// card responses.
//
// Both surfaces share src/services/recommendations.service.ts
// including the conservative alcohol filter (Phase 19.5 tech
// debt for a proper prohibited-category classifier). No ownership
// check — the cart is passed explicitly in the request body, and
// there is no server-side Cart table.
//
// Does NOT collide with the existing stub at /api/recommendations
// (different path, different method).
// ==========================================================

import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { recommendFromCartForAgent } from "../services/recommendations.service.js";
import { isFeatureAllowed } from "../agent/flags/index.js";

interface RecommendCartBody {
  productIds: number[];
  limit?: number;
}

export default async function recommendWidgetRoutes(app: FastifyInstance) {
  app.post<{ Body: RecommendCartBody }>(
    "/cart",
    {
      schema: {
        body: {
          type: "object",
          required: ["productIds"],
          properties: {
            productIds: {
              type: "array",
              items: { type: "integer", minimum: 1 },
              minItems: 1,
              maxItems: 20,
            },
            limit: { type: "integer", minimum: 1, maximum: 20 },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{ Body: RecommendCartBody }>,
      reply: FastifyReply,
    ) => {
      if (!isFeatureAllowed("recommendations")) {
        return reply.code(403).send({
          ok: false,
          error: "Recommendations feature is not enabled",
        });
      }

      try {
        const result = await recommendFromCartForAgent(request.body.productIds, {
          limit: request.body.limit,
        });

        return reply.send({
          ok: true,
          strategy: result.strategy,
          products: result.products,
        });
      } catch (error: unknown) {
        request.log.error({ err: error }, "recommend widget failed");
        return reply.code(500).send({
          ok: false,
          error: "Failed to generate recommendations",
        });
      }
    },
  );
}
