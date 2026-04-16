// ==========================================================
// STORESGO ADMIN GUARD UTILITY — PHASE 7A
// Middleware helper for admin-only routes
// ==========================================================

import type { FastifyRequest, FastifyReply } from "fastify";
import jwt from "jsonwebtoken";

const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || "superadminsecret";

// ---------------------------------------------------------
// TYPES
// ---------------------------------------------------------

interface AdminPayload {
  adminId: number;
  email: string;
  role: string;
}

// Note: FastifyRequest.admin is already declared in src/middleware/authAdmin.ts

// ---------------------------------------------------------
// GUARD FUNCTION
// ---------------------------------------------------------

/**
 * Admin guard utility for protecting admin-only routes.
 * 
 * Usage:
 * ```
 * app.get("/protected", { preHandler: requireAdmin }, handler);
 * ```
 * 
 * - Verifies Bearer token from Authorization header
 * - Validates role is 'admin' or 'superadmin'
 * - Attaches admin payload to request.admin
 * - Returns 401 if unauthorized
 */
export async function requireAdmin(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return reply.status(401).send({
        ok: false,
        message: "Unauthorized",
      });
    }

    const token = authHeader.replace("Bearer ", "").trim();

    if (!token) {
      return reply.status(401).send({
        ok: false,
        message: "Unauthorized",
      });
    }

    const decoded = jwt.verify(token, ADMIN_JWT_SECRET) as AdminPayload;

    // Validate role
    const validRoles = ["admin", "superadmin", "ADMIN", "SUPER_ADMIN"];
    if (!decoded.role || !validRoles.includes(decoded.role)) {
      return reply.status(401).send({
        ok: false,
        message: "Unauthorized",
      });
    }

    // Attach admin payload to request for downstream handlers
    // (request.admin is typed as `any` in src/middleware/authAdmin.ts)
    request.admin = decoded as any;

    // Allow handler to proceed
    return;
  } catch (err) {
    return reply.status(401).send({
      ok: false,
      message: "Unauthorized",
    });
  }
}

export default requireAdmin;

