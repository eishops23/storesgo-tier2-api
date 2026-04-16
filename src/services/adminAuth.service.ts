// ==========================================================
// STORESGO ADMIN AUTH SERVICE — PHASE 7A
// Clean, minimal admin authentication layer
// ==========================================================

import { prisma } from "../plugins/prisma.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || "superadminsecret";
const ADMIN_JWT_EXPIRES_IN = "24h";

// ---------------------------------------------------------
// TYPES
// ---------------------------------------------------------

export interface AdminLoginInput {
  email: string;
  password: string;
}

export interface AdminTokenPayload {
  adminId: number;
  email: string;
  role: string;
}

export interface AdminLoginResult {
  token: string;
  admin: {
    id: number;
    email: string;
  };
}

// ---------------------------------------------------------
// AUTH SERVICES
// ---------------------------------------------------------

/**
 * Authenticate admin by email and password.
 * Returns token + admin info on success, null on failure.
 */
export async function loginAdmin(
  input: AdminLoginInput
): Promise<AdminLoginResult | null> {
  const { email, password } = input;

  // Find admin by email
  const admin = await prisma.adminUser.findUnique({
    where: { email },
  });

  if (!admin) {
    return null;
  }

  // Verify password
  const isValid = await bcrypt.compare(password, admin.password);
  if (!isValid) {
    return null;
  }

  // Sign JWT with admin payload
  const token = jwt.sign(
    {
      adminId: admin.id,
      email: admin.email,
      role: admin.role,
    } as AdminTokenPayload,
    ADMIN_JWT_SECRET,
    { expiresIn: ADMIN_JWT_EXPIRES_IN }
  );

  return {
    token,
    admin: {
      id: admin.id,
      email: admin.email,
    },
  };
}

/**
 * Verify admin JWT token and return payload.
 * Returns null if token is invalid or role is not admin/superadmin.
 */
export function verifyAdminToken(token: string): AdminTokenPayload | null {
  try {
    const decoded = jwt.verify(token, ADMIN_JWT_SECRET) as AdminTokenPayload;

    // Accept both 'admin' and 'superadmin' roles
    const validRoles = ["admin", "superadmin"];
    if (!decoded.role || !validRoles.includes(decoded.role)) {
      return null;
    }

    return decoded;
  } catch {
    return null;
  }
}

/**
 * Get admin by ID.
 */
export async function getAdminById(id: number) {
  return prisma.adminUser.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });
}

