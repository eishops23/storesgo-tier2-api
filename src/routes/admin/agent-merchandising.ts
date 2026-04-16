// ==========================================================
// STORESGO ADMIN AGENT — MERCHANDISING ROUTE (Phase 12 Prompt 2)
// Operator-facing Merchandising agent endpoint. NOT wired into
// /api/chat — merchandising is operator-only and gets a
// dedicated admin-namespaced route so the public chat widget
// never resolves a merchandising keyword. Mirrors the Phase 9
// SEO admin route shape exactly.
//
// Mount path after prefix chain: POST /api/admin/agent/merchandising
//   (src/routes/index.ts registers adminRoutes under /admin,
//    src/routes/admin/index.ts registers this module under
//    /agent/merchandising, and the POST handler is at the root "/")
// ==========================================================

import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
// Side-effect import: src/middleware/authAdmin.ts augments the Fastify
// module with `request.admin?: any`. requireAdmin assigns to it without
// declaring its own augmentation, so compilers that pull requireAdmin
// into scope via this file (e.g. tsconfig.agent.json through the
// merchandising-agent integration test) need authAdmin's augmentation
// loaded.
import "../../middleware/authAdmin.js";
import { requireAdmin } from "../../utils/requireAdmin.js";
import { isFeatureAllowed } from "../../agent/flags/index.js";
import { runMerchandising } from "../../agent/features/merchandising/index.js";

interface MerchandisingAgentBody {
  userText: string;
  conversationId?: string;
}

interface AdminPayload {
  adminId: number;
  email: string;
  role: string;
}

export default async function adminAgentMerchandisingRoutes(app: FastifyInstance) {
  app.post<{ Body: MerchandisingAgentBody }>(
    "/",
    {
      preHandler: requireAdmin,
      schema: {
        body: {
          type: "object",
          required: ["userText"],
          properties: {
            userText: { type: "string", minLength: 1, maxLength: 4000 },
            conversationId: { type: "string" },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{ Body: MerchandisingAgentBody }>,
      reply: FastifyReply,
    ) => {
      // Feature flag gate — returns 403 if AGENT_FEATURE_FLAGS does
      // not include 'merchandising'. Default OFF in production per
      // CLAUDE.md.
      if (!isFeatureAllowed("merchandising")) {
        return reply.code(403).send({
          ok: false,
          error: "Merchandising agent is not enabled in this environment",
        });
      }

      // requireAdmin has already validated the JWT and attached the
      // admin payload. Defensive check in case the middleware was
      // reordered or the payload shape changes.
      const admin = (request as unknown as { admin?: AdminPayload }).admin;
      if (!admin || typeof admin.adminId !== "number") {
        return reply.code(401).send({
          ok: false,
          error: "Admin authentication required",
        });
      }

      try {
        const result = await runMerchandising({
          userText: request.body.userText,
          adminId: admin.adminId,
          operatorEmail: admin.email,
          userId: null,
          guestSessionId: null,
          conversationId: request.body.conversationId ?? null,
        });

        return reply.send({
          ok: result.ok,
          response: result.response,
          data: result.data ?? null,
          suggestions: result.suggestions,
          conversationId: result.conversationId,
        });
      } catch (error: unknown) {
        request.log.error({ err: error }, "runMerchandising dispatch failed");
        return reply.code(500).send({
          ok: false,
          error: "Merchandising agent failed — check server logs",
        });
      }
    },
  );
}
