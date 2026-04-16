// ==========================================================
// 🔐 STORESGO USER AUTH MIDDLEWARE
// Generic authentication for any user type (buyer, seller, admin)
// ==========================================================

import { FastifyReply, FastifyRequest } from "fastify";
import jwt from "jsonwebtoken";
import type { UserJwtPayload } from "../types/fastify-jwt.js";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-change-me";

/**
 * Authenticate any user type (buyer, seller)
 * Attaches user payload to request.user
 */
export async function authenticateUser(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const authHeader = request.headers["authorization"];

    if (!authHeader) {
      return reply.code(401).send({ ok: false, error: "Missing Authorization header" });
    }

    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) {
      return reply.code(401).send({ ok: false, error: "Missing token" });
    }

    const payload = jwt.verify(token, JWT_SECRET) as UserJwtPayload;

    if (!payload || !payload.id) {
      return reply.code(403).send({ ok: false, error: "Invalid token payload" });
    }

    // Attach to request for downstream handlers
    request.user = {
      id: payload.id,
      email: payload.email,
      role: payload.role,
      sellerId: payload.sellerId,
    };

    return;
  } catch (err: any) {
    console.error("❌ User auth failed:", err.message || err);
    return reply.code(401).send({ ok: false, error: "Invalid or expired token" });
  }
}

/**
 * Authenticate only buyers
 */
export async function authenticateBuyer(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const authHeader = request.headers["authorization"];

    if (!authHeader) {
      return reply.code(401).send({ ok: false, error: "Missing Authorization header" });
    }

    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) {
      return reply.code(401).send({ ok: false, error: "Missing token" });
    }

    const payload = jwt.verify(token, JWT_SECRET) as UserJwtPayload;

    if (!payload || payload.role !== "BUYER") {
      return reply.code(403).send({ ok: false, error: "Buyers only" });
    }

    request.user = {
      id: payload.id,
      email: payload.email,
      role: payload.role,
    };

    return;
  } catch (err: any) {
    console.error("❌ Buyer auth failed:", err.message || err);
    return reply.code(401).send({ ok: false, error: "Invalid or expired token" });
  }
}

/**
 * Optional authentication - doesn't fail if no token
 * Useful for routes that work for both authenticated and anonymous users
 */
export async function optionalAuth(
  request: FastifyRequest,
  _reply: FastifyReply
) {
  try {
    const authHeader = request.headers["authorization"];
    if (!authHeader) return;

    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) return;

    const payload = jwt.verify(token, JWT_SECRET) as UserJwtPayload;
    if (payload && payload.id) {
      request.user = {
        id: payload.id,
        email: payload.email,
        role: payload.role,
        sellerId: payload.sellerId,
      };
    }
  } catch {
    // Silently fail - optional auth
  }
}
