/* eslint-disable */
// =============================================================================
// 🔐 STORESGO SELLER JWT PLUGIN
// - Verifies seller JWT
// - Ensures role === "SELLER"
// - Attaches seller + token payload to request
// =============================================================================

import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import fp from "fastify-plugin";
import jwt from "jsonwebtoken";
import type { UserJwtPayload } from "../types/fastify-jwt.js";

// Import shared prisma singleton
import { prisma } from "../lib/prisma.js";

const JWT_SECRET = process.env.JWT_SECRET || "storesgo_super_secret_key_2025";

declare module "fastify" {
  interface FastifyInstance {
    authenticateSeller: (
      request: FastifyRequest,
      reply: FastifyReply
    ) => Promise<void>;
  }
}

async function sellerJwtPlugin(app: FastifyInstance) {
  app.decorate(
    "authenticateSeller",
    async function authenticateSeller(request: FastifyRequest, reply: FastifyReply) {
      try {
        const authHeader =
          request.headers["authorization"] || request.headers["Authorization"];

        if (!authHeader || !authHeader.toString().startsWith("Bearer ")) {
          return reply
            .code(401)
            .send({ ok: false, error: "Missing or invalid Authorization header" });
        }

        const token = authHeader.toString().replace("Bearer ", "").trim();
        if (!token) {
          return reply
            .code(401)
            .send({ ok: false, error: "Missing token" });
        }

        const payload = jwt.verify(token, JWT_SECRET) as UserJwtPayload;

        // We expect seller auth tokens to have role === "SELLER"
        if (!payload || payload.role !== "SELLER") {
          return reply
            .code(403)
            .send({ ok: false, error: "Forbidden — seller access only" });
        }

        // If token includes sellerId, resolve seller
        let seller = null;
        if (payload.sellerId) {
          seller = await prisma.seller.findUnique({
            where: { id: Number(payload.sellerId) },
          });

          if (!seller) {
            return reply
              .code(403)
              .send({ ok: false, error: "Seller not found" });
          }
        }

        // Attach to request for downstream handlers
        request.authUser = payload;
        request.seller = seller;
        request.user = payload;

        // if all good, just return and let the route handler proceed
        return;
      } catch (err: any) {
        console.error("❌ authenticateSeller error:", err.message || err);
        return reply
          .code(401)
          .send({ ok: false, error: "Invalid or expired token" });
      }
    }
  );

  app.log.info("✅ Seller JWT plugin registered (authenticateSeller ready)");
}

export default fp(sellerJwtPlugin, {
  name: "sellerJwt",
  dependencies: ["prisma"],
  fastify: "5.x",
});
