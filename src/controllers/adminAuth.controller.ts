// ==========================================================
// STORESGO ADMIN AUTH CONTROLLER — PHASE 7A
// HTTP handlers for admin authentication
// ==========================================================

import type { FastifyRequest, FastifyReply } from "fastify";
import * as adminAuthService from "../services/adminAuth.service.js";

// ---------------------------------------------------------
// TYPES
// ---------------------------------------------------------

interface LoginBody {
  email?: string;
  password?: string;
}

// ---------------------------------------------------------
// CONTROLLERS
// ---------------------------------------------------------

/**
 * POST /api/admin/auth/login
 * Authenticate admin and return JWT token
 */
export async function loginController(
  request: FastifyRequest<{ Body: LoginBody }>,
  reply: FastifyReply
) {
  const { email, password } = request.body;

  // Validate required fields
  if (!email || !password) {
    return reply.status(400).send({
      ok: false,
      message: "Email and password are required",
    });
  }

  // Attempt login
  const result = await adminAuthService.loginAdmin({ email, password });

  if (!result) {
    return reply.status(401).send({
      ok: false,
      message: "Invalid credentials",
    });
  }

  return reply.send({
    ok: true,
    token: result.token,
    admin: result.admin,
  });
}

/**
 * GET /api/admin/auth/me
 * Get current admin info from token
 * (Requires authenticateAdmin preHandler)
 */
export async function meController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const token = request.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return reply.status(401).send({
      ok: false,
      message: "No token provided",
    });
  }

  const payload = adminAuthService.verifyAdminToken(token);

  if (!payload) {
    return reply.status(401).send({
      ok: false,
      message: "Invalid token",
    });
  }

  const admin = await adminAuthService.getAdminById(payload.adminId);

  if (!admin) {
    return reply.status(401).send({
      ok: false,
      message: "Admin not found",
    });
  }

  return reply.send({
    ok: true,
    admin,
  });
}

