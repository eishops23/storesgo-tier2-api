/* eslint-disable */
// ==========================================================
// 🧩 STORESGO ADMIN JWT VERIFY — FINAL MERGED VERSION (STABLE)
// Handles JWT from /api/admin/auth/login (Fastify + Next.js Admin UI)
// ✅ Supports "Bearer" header and cookies
// ✅ Recognizes payloads containing role/type/isAdmin
// ✅ Production-safe with clear dev logs
// ==========================================================

import type { FastifyRequest, FastifyReply } from "fastify";
import jwt from "jsonwebtoken";

export async function verifyAdmin(req: FastifyRequest, reply: FastifyReply) {
  try {
    // ---------------------------------------------------------
    // 1️⃣ Extract token (Bearer or Cookie)
    // ---------------------------------------------------------
    let token: string | undefined;
    const authHeader = req.headers.authorization;

    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if ((req as any).cookies?.admin_token) {
      token = (req as any).cookies.admin_token;
    }

    if (!token) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("🚫 Missing admin token in request headers.");
      }
      return reply.code(401).send({ ok: false, error: "Missing token" });
    }

    // ---------------------------------------------------------
    // 2️⃣ Verify JWT Secret
    // ---------------------------------------------------------
    const JWT_SECRET = process.env.JWT_SECRET?.trim();
    if (!JWT_SECRET) {
      console.error("❌ JWT_SECRET missing in environment.");
      return reply.code(500).send({
        ok: false,
        error: "Server misconfiguration: JWT secret missing",
      });
    }

    // ---------------------------------------------------------
    // 3️⃣ Decode & verify token
    // ---------------------------------------------------------
    const payload = jwt.verify(token, JWT_SECRET) as any;

    if (process.env.NODE_ENV !== "production") {
      console.log("🪪 Verified Admin Token:", {
        sub: payload.sub,
        email: payload.email,
        role: payload.role,
        type: payload.type,
        isAdmin: payload.isAdmin,
      });
    }

    // ---------------------------------------------------------
    // 4️⃣ Role Validation — must be admin or superadmin
    // ---------------------------------------------------------
    const isAuthorized =
      payload &&
      (payload.isAdmin === true ||
        payload.type === "admin" ||
        ["admin", "superadmin"].includes(payload.role));

    if (!isAuthorized) {
      console.warn("🚫 Forbidden admin access attempt:", payload?.email || "unknown");
      return reply.code(403).send({ ok: false, error: "Forbidden: Admin access only" });
    }

    // ---------------------------------------------------------
    // 5️⃣ Attach admin payload to request (for route handlers)
    // ---------------------------------------------------------
    (req as any).admin = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      type: payload.type || "admin",
      isAdmin: payload.isAdmin ?? true,
    };

    // ✅ Let Fastify continue
    return;
  } catch (error: any) {
    console.error("❌ verifyAdmin:", error.name, error.message);
    return reply.code(401).send({
      ok: false,
      error: "Unauthorized or invalid token",
    });
  }
}
