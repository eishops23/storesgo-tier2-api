// ==========================================================
// STORESGO ADMIN AUTH ROUTES — PHASE 7A + PHASE 15 + CAPTCHA
// Admin authentication endpoints (including password reset)
// ==========================================================

import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import * as adminAuthController from "../../controllers/adminAuth.controller.js";
import * as passwordResetService from "../../services/passwordReset.service.js";
import { optionalCaptchaMiddleware } from "../../middleware/captcha.js";
import { rateLimiters } from "../../plugins/rateLimit.js";

export default async function adminAuthRoutes(app: FastifyInstance) {
  /**
   * POST /api/admin/auth/login
   * Admin login endpoint — no auth required
   * With rate limiting and optional CAPTCHA verification
   */
  app.post("/login", { preHandler: [rateLimiters.login, optionalCaptchaMiddleware] }, adminAuthController.loginController);

  /**
   * GET /api/admin/auth/me
   * Get current admin info — requires auth
   */
  app.get(
    "/me",
    { preHandler: app.authenticateAdmin },
    adminAuthController.meController
  );

  // ---------------------------------------------------------
  // PASSWORD RESET ENDPOINTS (Phase 15)
  // ---------------------------------------------------------

  /**
   * POST /api/admin/auth/forgot-password
   * Request admin password reset with rate limiting
   */
  app.post(
    "/forgot-password",
    { preHandler: rateLimiters.passwordReset },
    async (
      request: FastifyRequest<{ Body: { email?: string } }>,
      reply: FastifyReply
    ) => {
      const { email } = request.body;

      if (!email) {
        return reply.status(400).send({
          ok: false,
          message: "Email is required",
        });
      }

      // Get client info for audit
      const ipAddress = request.ip || 
        (request.headers["x-forwarded-for"] as string)?.split(",")[0] || 
        undefined;
      const userAgent = request.headers["user-agent"] || undefined;

      const result = await passwordResetService.forgotPassword({
        email,
        userType: "admin", // Force admin type
        ipAddress,
        userAgent,
      });

      return reply.send({
        ok: true,
        message: result.message,
      });
    }
  );

  /**
   * POST /api/admin/auth/reset-password
   * Reset admin password with token
   */
  app.post(
    "/reset-password",
    async (
      request: FastifyRequest<{ Body: { token?: string; newPassword?: string } }>,
      reply: FastifyReply
    ) => {
      const { token, newPassword } = request.body;

      if (!token || !newPassword) {
        return reply.status(400).send({
          ok: false,
          message: "Token and new password are required",
        });
      }

      if (newPassword.length < 8) {
        return reply.status(400).send({
          ok: false,
          message: "Password must be at least 8 characters",
        });
      }

      const result = await passwordResetService.resetPassword({
        token,
        newPassword,
      });

      if (!result.success) {
        return reply.status(400).send({
          ok: false,
          message: result.message,
          error: result.error,
        });
      }

      return reply.send({
        ok: true,
        message: result.message,
      });
    }
  );

  app.log.info("📄 Admin auth routes registered (with password reset)");
}

