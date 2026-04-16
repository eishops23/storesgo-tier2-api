// ==========================================================
// 🔐 STORESGO PASSWORD RESET ROUTES — PHASE 15
// Forgot Password & Reset Password endpoints
// ==========================================================

import type { FastifyInstance } from "fastify";
import * as passwordResetController from "../../controllers/passwordReset.controller.js";

export default async function passwordResetRoutes(app: FastifyInstance) {
  /**
   * POST /api/auth/forgot-password
   * 
   * Request a password reset link.
   * Sends an email with reset token if email exists.
   * Always returns success to prevent email enumeration.
   * 
   * @body {string} email - User's email address
   * @body {string} [userType] - Optional: "buyer", "seller", or "admin"
   * 
   * @returns {object} { ok: true, message: string }
   */
  app.post(
    "/forgot-password",
    {
      schema: {
        body: {
          type: "object",
          required: ["email"],
          properties: {
            email: {
              type: "string",
              format: "email",
              description: "Email address associated with the account",
            },
            userType: {
              type: "string",
              enum: ["buyer", "seller", "admin"],
              description: "Type of user account (optional)",
            },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              ok: { type: "boolean" },
              message: { type: "string" },
            },
          },
          400: {
            type: "object",
            properties: {
              ok: { type: "boolean" },
              message: { type: "string" },
            },
          },
        },
      },
    },
    passwordResetController.forgotPasswordController
  );

  /**
   * POST /api/auth/reset-password
   * 
   * Reset password using the token from email.
   * Validates token and updates password.
   * 
   * @body {string} token - Reset token from email link
   * @body {string} newPassword - New password (min 8 chars)
   * @body {string} [email] - Optional email for extra verification
   * 
   * @returns {object} { ok: boolean, message: string }
   */
  app.post(
    "/reset-password",
    {
      schema: {
        body: {
          type: "object",
          required: ["token", "newPassword"],
          properties: {
            token: {
              type: "string",
              description: "Password reset token from email",
            },
            newPassword: {
              type: "string",
              minLength: 8,
              description: "New password (minimum 8 characters)",
            },
            email: {
              type: "string",
              format: "email",
              description: "Email for additional verification (optional)",
            },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              ok: { type: "boolean" },
              message: { type: "string" },
            },
          },
          400: {
            type: "object",
            properties: {
              ok: { type: "boolean" },
              message: { type: "string" },
              error: { type: "string" },
            },
          },
        },
      },
    },
    passwordResetController.resetPasswordController
  );

  /**
   * GET /api/auth/validate-reset-token
   * 
   * Validate reset token without using it.
   * Used by frontend to check if link is valid before showing form.
   * 
   * @query {string} token - Reset token to validate
   * 
   * @returns {object} { ok: boolean, valid: boolean, userType?: string, emailHint?: string }
   */
  app.get(
    "/validate-reset-token",
    {
      schema: {
        querystring: {
          type: "object",
          required: ["token"],
          properties: {
            token: {
              type: "string",
              description: "Reset token to validate",
            },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              ok: { type: "boolean" },
              valid: { type: "boolean" },
              userType: { type: "string" },
              emailHint: { type: "string" },
              expiresAt: { type: "string", format: "date-time" },
            },
          },
          400: {
            type: "object",
            properties: {
              ok: { type: "boolean" },
              valid: { type: "boolean" },
              message: { type: "string" },
            },
          },
        },
      },
    },
    passwordResetController.validateResetTokenController
  );

  app.log.info("🔐 Password reset routes registered");
}

