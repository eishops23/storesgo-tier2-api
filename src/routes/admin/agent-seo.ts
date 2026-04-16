// ==========================================================
// STORESGO ADMIN AGENT — SEO ROUTE (Phase 9 Prompt 4)
// Operator-facing SEO agent endpoint. NOT wired into /api/chat
// — per audit docs/phase9-seo-audit.md B9, SEO is operator-only
// and gets a dedicated admin-namespaced route so the public
// chat widget never resolves an 'seo' keyword.
//
// Mount path after prefix chain: POST /api/admin/agent/seo
//   (src/routes/index.ts registers adminRoutes under /admin,
//    src/routes/admin/index.ts registers this module under
//    /agent/seo, and the POST handler is at the root "/")
// ==========================================================

import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
// Side-effect import: src/middleware/authAdmin.ts augments the Fastify
// module with `request.admin?: any`. requireAdmin assigns to it without
// declaring its own augmentation, so compilers that pull requireAdmin
// into scope via this file (e.g. tsconfig.agent.json through the
// seo-agent integration test) need authAdmin's augmentation loaded.
import "../../middleware/authAdmin.js";
import { requireAdmin } from "../../utils/requireAdmin.js";
import { isFeatureAllowed } from "../../agent/flags/index.js";
import { runSeo } from "../../agent/features/seo/index.js";

interface SeoAgentBody {
  userText: string;
  conversationId?: string;
}

interface AdminPayload {
  adminId: number;
  email: string;
  role: string;
}

export default async function adminAgentSeoRoutes(app: FastifyInstance) {
  app.post<{ Body: SeoAgentBody }>(
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
    async (request: FastifyRequest<{ Body: SeoAgentBody }>, reply: FastifyReply) => {
      // Feature flag gate — returns 403 if AGENT_FEATURE_FLAGS does
      // not include 'seo'. Default OFF in production per CLAUDE.md.
      if (!isFeatureAllowed("seo")) {
        return reply.code(403).send({
          ok: false,
          error: "SEO agent is not enabled in this environment",
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
        const result = await runSeo({
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
        request.log.error({ err: error }, "runSeo dispatch failed");
        return reply.code(500).send({
          ok: false,
          error: "SEO agent failed — check server logs",
        });
      }
    },
  );
}
