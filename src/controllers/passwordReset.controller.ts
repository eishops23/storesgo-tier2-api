// ==========================================================
// 🔐 STORESGO PASSWORD RESET CONTROLLER — PHASE 15
// HTTP handlers for password reset endpoints
// ==========================================================

import type { FastifyRequest, FastifyReply } from "fastify";
import * as passwordResetService from "../services/passwordReset.service.js";

// ----------------------------------------------------------
// 📋 TYPE DEFINITIONS
// ----------------------------------------------------------

interface ForgotPasswordBody {
  email?: string;
  userType?: "buyer" | "seller" | "admin";
}

interface ResetPasswordBody {
  token?: string;
  newPassword?: string;
  email?: string;
}

interface ValidateTokenQuery {
  token?: string;
}

// ----------------------------------------------------------
// 📧 FORGOT PASSWORD
// POST /api/auth/forgot-password
// ----------------------------------------------------------

/**
 * Handle forgot password request
 * Creates reset token and sends email
 */
export async function forgotPasswordController(
  request: FastifyRequest<{ Body: ForgotPasswordBody }>,
  reply: FastifyReply
) {
  const { email, userType } = request.body;

  // Validate email
  if (!email || !isValidEmail(email)) {
    return reply.status(400).send({
      ok: false,
      message: "Please provide a valid email address",
    });
  }

  // Validate userType if provided
  if (userType && !["buyer", "seller", "admin"].includes(userType)) {
    return reply.status(400).send({
      ok: false,
      message: "Invalid user type. Must be buyer, seller, or admin.",
    });
  }

  // Get client info for audit
  const ipAddress = request.ip || 
    (request.headers["x-forwarded-for"] as string)?.split(",")[0] || 
    undefined;
  const userAgent = request.headers["user-agent"] || undefined;

  // Process request
  const result = await passwordResetService.forgotPassword({
    email,
    userType: userType as passwordResetService.UserType | undefined,
    ipAddress,
    userAgent,
  });

  // Always return 200 with generic message (prevents email enumeration)
  return reply.send({
    ok: true,
    message: result.message,
  });
}

// ----------------------------------------------------------
// 🔐 RESET PASSWORD
// POST /api/auth/reset-password
// ----------------------------------------------------------

/**
 * Handle password reset with token
 * Validates token and updates password
 */
export async function resetPasswordController(
  request: FastifyRequest<{ Body: ResetPasswordBody }>,
  reply: FastifyReply
) {
  const { token, newPassword, email } = request.body;

  // Validate required fields
  if (!token) {
    return reply.status(400).send({
      ok: false,
      message: "Reset token is required",
      error: "MISSING_TOKEN",
    });
  }

  if (!newPassword) {
    return reply.status(400).send({
      ok: false,
      message: "New password is required",
      error: "MISSING_PASSWORD",
    });
  }

  // Validate password strength
  const passwordValidation = validatePassword(newPassword);
  if (!passwordValidation.valid) {
    return reply.status(400).send({
      ok: false,
      message: passwordValidation.message,
      error: "WEAK_PASSWORD",
    });
  }

  // Process reset
  const result = await passwordResetService.resetPassword({
    token,
    newPassword,
    email,
  });

  if (!result.success) {
    // Determine appropriate status code
    const statusCode = result.error === "INVALID_TOKEN" ? 400 : 
                       result.error === "USER_NOT_FOUND" ? 404 : 500;

    return reply.status(statusCode).send({
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

// ----------------------------------------------------------
// ✅ VALIDATE TOKEN
// GET /api/auth/validate-reset-token
// ----------------------------------------------------------

/**
 * Validate reset token without using it
 * Used by frontend to check if link is valid before showing form
 */
export async function validateResetTokenController(
  request: FastifyRequest<{ Querystring: ValidateTokenQuery }>,
  reply: FastifyReply
) {
  const { token } = request.query;

  if (!token) {
    return reply.status(400).send({
      ok: false,
      valid: false,
      message: "Token is required",
    });
  }

  const result = await passwordResetService.validateResetToken(token);

  if (!result.valid) {
    return reply.status(400).send({
      ok: false,
      valid: false,
      message: "Invalid or expired reset link",
    });
  }

  return reply.send({
    ok: true,
    valid: true,
    userType: result.userType,
    // Don't expose full email, just hint
    emailHint: maskEmail(result.email || ""),
    expiresAt: result.expiresAt,
  });
}

// ----------------------------------------------------------
// 🔧 HELPER FUNCTIONS
// ----------------------------------------------------------

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 */
function validatePassword(password: string): { valid: boolean; message: string } {
  if (password.length < 8) {
    return {
      valid: false,
      message: "Password must be at least 8 characters long",
    };
  }

  // Optional: Add more password requirements
  // const hasUppercase = /[A-Z]/.test(password);
  // const hasLowercase = /[a-z]/.test(password);
  // const hasNumber = /[0-9]/.test(password);
  // const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  // if (!hasUppercase || !hasLowercase || !hasNumber) {
  //   return {
  //     valid: false,
  //     message: "Password must contain uppercase, lowercase, and numbers",
  //   };
  // }

  return { valid: true, message: "" };
}

/**
 * Mask email for privacy (e.g., j***@example.com)
 */
function maskEmail(email: string): string {
  if (!email || !email.includes("@")) {
    return "***@***.***";
  }

  const [local, domain] = email.split("@");
  
  if (local.length <= 2) {
    return `${local[0]}***@${domain}`;
  }

  return `${local[0]}***${local[local.length - 1]}@${domain}`;
}

