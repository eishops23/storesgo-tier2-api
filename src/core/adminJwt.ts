/* eslint-disable */
// ==========================================================
// 🔐 STORESGO ADMIN JWT PLUGIN — FINAL TYPED & DEBUG VERSION
// Validates Bearer tokens for /api/admin routes
// Type-safe + detailed console logging
// ==========================================================

import fp from "fastify-plugin";
import jwt, { JwtPayload } from "jsonwebtoken";
import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-change-me";

async function adminJwtPlugin(app: FastifyInstance) {
  app.addHook("onRequest", async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const url = req.url || "";

      // Protect all /api/admin routes except login
      if (
        url.startsWith("/api/admin") &&
        !url.startsWith("/api/admin/auth/login")
      ) {
        const auth = req.headers["authorization"] || "";
        const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;

        if (!token) {
          console.log("❌ No token received");
          return reply.code(401).send({ ok: false, error: "Missing token" });
        }

        // 🪪 Log first part of token for debugging
        console.log("🪪 Received token:", token.substring(0, 30) + "...");

        // ✅ Verify and decode JWT
        const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload | string;
        console.log("✅ Decoded payload:", decoded);

        if (typeof decoded === "string" || decoded.type !== "admin") {
          console.log("🚫 Invalid token type:", (decoded as any)?.type);
          return reply.code(401).send({ ok: false, error: "Invalid token" });
        }

        // Attach admin payload to request
        (req as any).admin = decoded;
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error("❌ JWT validation failed:", err.message);
      } else {
        console.error("❌ Unknown JWT error");
      }
      return reply.code(401).send({ ok: false, error: "Unauthorized" });
    }
  });
}

export default fp(adminJwtPlugin);
