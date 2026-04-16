// ==========================================================
// 🔐 STORESGO PASSWORD RESET SERVICE — PHASE 15
// Secure password reset functionality for all user types
// ==========================================================

import { prisma } from "../lib/prisma.js";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { sendEmail, wrapHtmlTemplate } from "../utils/notifySender.js";

// ----------------------------------------------------------
// 📋 CONFIGURATION
// ----------------------------------------------------------

const RESET_TOKEN_EXPIRY_MINUTES = 30; // Token expires in 30 minutes
const BCRYPT_ROUNDS = 10;
const FRONTEND_URL = process.env.FRONTEND_URL || "https://storesgo.com";

// ----------------------------------------------------------
// 📋 TYPE DEFINITIONS
// ----------------------------------------------------------

export type UserType = "buyer" | "seller" | "admin";

export interface ForgotPasswordInput {
  email: string;
  userType?: UserType; // Optional - will search all types if not specified
  ipAddress?: string;
  userAgent?: string;
}

export interface ResetPasswordInput {
  token: string;
  newPassword: string;
  email?: string; // Optional for additional verification
}

export interface ForgotPasswordResult {
  success: boolean;
  message: string;
}

export interface ResetPasswordResult {
  success: boolean;
  message: string;
  error?: string;
}

// ----------------------------------------------------------
// 🔧 HELPER FUNCTIONS
// ----------------------------------------------------------

/**
 * Generate a cryptographically secure random token
 */
function generateSecureToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Hash a token for secure storage
 */
async function hashToken(token: string): Promise<string> {
  return bcrypt.hash(token, BCRYPT_ROUNDS);
}

/**
 * Verify a token against its hash
 */
async function verifyTokenHash(token: string, hash: string): Promise<boolean> {
  return bcrypt.compare(token, hash);
}

/**
 * Calculate token expiration date
 */
function getExpirationDate(): Date {
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + RESET_TOKEN_EXPIRY_MINUTES);
  return expiry;
}

/**
 * Build the password reset URL
 */
function buildResetUrl(token: string, userType: UserType): string {
  // Different paths for different user types
  let basePath = "/reset-password";
  
  if (userType === "admin") {
    basePath = "/admin/reset-password";
  } else if (userType === "seller") {
    basePath = "/seller/reset-password";
  }
  
  return `${FRONTEND_URL}${basePath}?token=${encodeURIComponent(token)}`;
}

// ----------------------------------------------------------
// 👤 USER LOOKUP FUNCTIONS
// ----------------------------------------------------------

/**
 * Find user by email and type
 * Returns user info if found, null otherwise
 */
async function findUserByEmail(
  email: string,
  userType?: UserType
): Promise<{
  userId: string | null;
  adminId: number | null;
  userType: UserType;
  email: string;
} | null> {
  const normalizedEmail = email.toLowerCase().trim();

  // If specific type requested, search only that type
  if (userType) {
    return findUserByType(normalizedEmail, userType);
  }

  // Search all user types (prioritize: buyer > seller > admin)
  // First check buyers
  const buyer = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, email: true, role: true },
  });

  if (buyer && buyer.role === "BUYER") {
    return {
      userId: buyer.id,
      adminId: null,
      userType: "buyer",
      email: buyer.email,
    };
  }

  // Check sellers (also in User table)
  if (buyer && buyer.role === "SELLER") {
    return {
      userId: buyer.id,
      adminId: null,
      userType: "seller",
      email: buyer.email,
    };
  }

  // Check admins (separate table)
  const admin = await prisma.adminUser.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, email: true },
  });

  if (admin) {
    return {
      userId: null,
      adminId: admin.id,
      userType: "admin",
      email: admin.email,
    };
  }

  return null;
}

/**
 * Find user by specific type
 */
async function findUserByType(
  email: string,
  userType: UserType
): Promise<{
  userId: string | null;
  adminId: number | null;
  userType: UserType;
  email: string;
} | null> {
  if (userType === "admin") {
    const admin = await prisma.adminUser.findUnique({
      where: { email },
      select: { id: true, email: true },
    });

    if (admin) {
      return {
        userId: null,
        adminId: admin.id,
        userType: "admin",
        email: admin.email,
      };
    }
  } else {
    // Buyer or Seller (both in User table)
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, role: true },
    });

    if (user) {
      const role = user.role === "SELLER" ? "seller" : "buyer";
      
      // Verify requested type matches actual role
      if (userType === "buyer" && user.role !== "BUYER") {
        return null;
      }
      if (userType === "seller" && user.role !== "SELLER") {
        return null;
      }

      return {
        userId: user.id,
        adminId: null,
        userType: role,
        email: user.email,
      };
    }
  }

  return null;
}

// ----------------------------------------------------------
// 📧 EMAIL FUNCTIONS
// ----------------------------------------------------------

/**
 * Send password reset email
 */
async function sendPasswordResetEmail(
  email: string,
  resetUrl: string,
  userType: UserType
): Promise<boolean> {
  const userTypeLabel = userType === "admin" ? "Administrator" : 
                       userType === "seller" ? "Seller" : "Customer";

  const htmlContent = wrapHtmlTemplate(`
    <h2>Password Reset Request 🔐</h2>
    <p>We received a request to reset the password for your ${userTypeLabel} account.</p>
    <p>Click the button below to reset your password. This link will expire in ${RESET_TOKEN_EXPIRY_MINUTES} minutes.</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetUrl}" class="btn" style="display: inline-block; background: #00875A; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 500;">
        Reset Password
      </a>
    </div>
    
    <p style="color: #666; font-size: 14px;">
      If you didn't request this password reset, you can safely ignore this email. 
      Your password will not be changed unless you click the link above.
    </p>
    
    <p style="color: #666; font-size: 14px;">
      If you're having trouble clicking the button, copy and paste this URL into your browser:<br>
      <a href="${resetUrl}" style="color: #00875A; word-break: break-all;">${resetUrl}</a>
    </p>
    
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #999;">
      <p><strong>Security Tips:</strong></p>
      <ul>
        <li>Never share this link with anyone</li>
        <li>StoresGo will never ask for your password via email</li>
        <li>If you didn't request this reset, consider changing your password anyway</li>
      </ul>
    </div>
  `, "Password Reset - StoresGo");

  const result = await sendEmail({
    to: email,
    subject: "Reset Your Password - StoresGo",
    text: `You requested a password reset for your StoresGo ${userTypeLabel} account. Visit this link to reset your password: ${resetUrl}. This link expires in ${RESET_TOKEN_EXPIRY_MINUTES} minutes. If you didn't request this, you can ignore this email.`,
    html: htmlContent,
    from: process.env.MAIL_FROM || "StoresGo <no-reply@storesgo.com>",
  });

  return result.success;
}

/**
 * Send password changed confirmation email
 */
async function sendPasswordChangedEmail(
  email: string,
  userType: UserType
): Promise<boolean> {
  const userTypeLabel = userType === "admin" ? "Administrator" : 
                       userType === "seller" ? "Seller" : "Customer";

  const htmlContent = wrapHtmlTemplate(`
    <h2>Password Changed Successfully ✅</h2>
    <p>Your ${userTypeLabel} account password has been successfully changed.</p>
    
    <div class="highlight" style="background: #e8f5e9; padding: 15px; border-radius: 8px; margin: 15px 0;">
      <p><strong>When:</strong> ${new Date().toLocaleString()}</p>
      <p><strong>Account Type:</strong> ${userTypeLabel}</p>
    </div>
    
    <p style="color: #d32f2f; font-weight: 500;">
      If you didn't make this change, please contact our support team immediately and secure your account.
    </p>
    
    <div style="text-align: center; margin: 20px 0;">
      <a href="${FRONTEND_URL}/support" class="btn" style="display: inline-block; background: #d32f2f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
        Contact Support
      </a>
    </div>
  `, "Password Changed - StoresGo");

  const result = await sendEmail({
    to: email,
    subject: "Your Password Has Been Changed - StoresGo",
    text: `Your StoresGo ${userTypeLabel} account password was changed on ${new Date().toLocaleString()}. If you didn't make this change, please contact support immediately.`,
    html: htmlContent,
    from: process.env.MAIL_FROM || "StoresGo <no-reply@storesgo.com>",
  });

  return result.success;
}

// ----------------------------------------------------------
// 🔐 MAIN SERVICE FUNCTIONS
// ----------------------------------------------------------

/**
 * Handle forgot password request
 * Creates a secure token and sends reset email
 * 
 * IMPORTANT: Always returns success to prevent email enumeration
 */
export async function forgotPassword(
  input: ForgotPasswordInput
): Promise<ForgotPasswordResult> {
  const { email, userType, ipAddress, userAgent } = input;
  const normalizedEmail = email.toLowerCase().trim();

  // Generic success message (returned regardless of whether email exists)
  const genericSuccessMessage = 
    "If an account with that email exists, you will receive a password reset link shortly.";

  try {
    // 1. Find user
    const user = await findUserByEmail(normalizedEmail, userType);

    if (!user) {
      // Log for monitoring but return success (prevents enumeration)
      console.log(`🔐 Password reset requested for non-existent email: ${normalizedEmail}`);
      return { success: true, message: genericSuccessMessage };
    }

    // 2. Delete any existing tokens for this user (prevent reuse)
    await prisma.passwordResetToken.deleteMany({
      where: {
        email: user.email,
        userType: user.userType,
      },
    });

    // 3. Generate and hash new token
    const rawToken = generateSecureToken();
    const tokenHash = await hashToken(rawToken);

    // 4. Store token in database
    await prisma.passwordResetToken.create({
      data: {
        tokenHash,
        userId: user.userId,
        adminId: user.adminId,
        userType: user.userType,
        email: user.email,
        expiresAt: getExpirationDate(),
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      },
    });

    // 5. Build reset URL and send email
    const resetUrl = buildResetUrl(rawToken, user.userType);
    const emailSent = await sendPasswordResetEmail(user.email, resetUrl, user.userType);

    if (!emailSent) {
      console.error(`❌ Failed to send password reset email to ${user.email}`);
      // Still return success to prevent enumeration
    } else {
      console.log(`✅ Password reset email sent to ${user.email} (${user.userType})`);
    }

    return { success: true, message: genericSuccessMessage };
  } catch (error: any) {
    console.error("❌ Error in forgotPassword:", error.message);
    // Return success even on error to prevent enumeration
    return { success: true, message: genericSuccessMessage };
  }
}

/**
 * Reset password using token
 */
export async function resetPassword(
  input: ResetPasswordInput
): Promise<ResetPasswordResult> {
  const { token, newPassword, email } = input;

  try {
    // 1. Validate new password
    if (!newPassword || newPassword.length < 8) {
      return {
        success: false,
        message: "Password must be at least 8 characters long",
        error: "INVALID_PASSWORD",
      };
    }

    // 2. Find all non-expired, unused tokens
    const potentialTokens = await prisma.passwordResetToken.findMany({
      where: {
        expiresAt: { gt: new Date() },
        usedAt: null,
        ...(email ? { email: email.toLowerCase().trim() } : {}),
      },
    });

    // 3. Find the matching token by comparing hashes
    let matchedToken = null;
    for (const tokenRecord of potentialTokens) {
      const isMatch = await verifyTokenHash(token, tokenRecord.tokenHash);
      if (isMatch) {
        matchedToken = tokenRecord;
        break;
      }
    }

    if (!matchedToken) {
      return {
        success: false,
        message: "Invalid or expired reset link. Please request a new password reset.",
        error: "INVALID_TOKEN",
      };
    }

    // 4. Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

    // 5. Update password based on user type
    if (matchedToken.userType === "admin" && matchedToken.adminId) {
      await prisma.adminUser.update({
        where: { id: matchedToken.adminId },
        data: { password: hashedPassword },
      });
    } else if (matchedToken.userId) {
      await prisma.user.update({
        where: { id: matchedToken.userId },
        data: { password: hashedPassword },
      });
    } else {
      return {
        success: false,
        message: "Unable to find associated user account.",
        error: "USER_NOT_FOUND",
      };
    }

    // 6. Mark token as used
    await prisma.passwordResetToken.update({
      where: { id: matchedToken.id },
      data: { usedAt: new Date() },
    });

    // 7. Delete all other tokens for this user (cleanup)
    await prisma.passwordResetToken.deleteMany({
      where: {
        email: matchedToken.email,
        id: { not: matchedToken.id },
      },
    });

    // 8. Send confirmation email
    await sendPasswordChangedEmail(
      matchedToken.email,
      matchedToken.userType as UserType
    );

    console.log(`✅ Password reset successful for ${matchedToken.email} (${matchedToken.userType})`);

    return {
      success: true,
      message: "Your password has been successfully reset. You can now log in with your new password.",
    };
  } catch (error: any) {
    console.error("❌ Error in resetPassword:", error.message);
    return {
      success: false,
      message: "An error occurred while resetting your password. Please try again.",
      error: "INTERNAL_ERROR",
    };
  }
}

/**
 * Validate token without using it (for frontend to check if link is valid)
 */
export async function validateResetToken(token: string): Promise<{
  valid: boolean;
  userType?: UserType;
  email?: string;
  expiresAt?: Date;
}> {
  try {
    const potentialTokens = await prisma.passwordResetToken.findMany({
      where: {
        expiresAt: { gt: new Date() },
        usedAt: null,
      },
    });

    for (const tokenRecord of potentialTokens) {
      const isMatch = await verifyTokenHash(token, tokenRecord.tokenHash);
      if (isMatch) {
        return {
          valid: true,
          userType: tokenRecord.userType as UserType,
          email: tokenRecord.email,
          expiresAt: tokenRecord.expiresAt,
        };
      }
    }

    return { valid: false };
  } catch (error: any) {
    console.error("❌ Error validating reset token:", error.message);
    return { valid: false };
  }
}

/**
 * Cleanup expired tokens (call periodically via cron)
 */
export async function cleanupExpiredTokens(): Promise<number> {
  try {
    const result = await prisma.passwordResetToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { usedAt: { not: null } },
        ],
      },
    });

    console.log(`🧹 Cleaned up ${result.count} expired/used password reset tokens`);
    return result.count;
  } catch (error: any) {
    console.error("❌ Error cleaning up tokens:", error.message);
    return 0;
  }
}

