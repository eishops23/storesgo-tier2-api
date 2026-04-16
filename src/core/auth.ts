/* eslint-disable */
// =============================================================================
// 🔑 STORESGO ADMIN AUTH ROUTE — FIXED (Type-Safe + Shared Prisma)
// =============================================================================

import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// Import shared prisma singleton
import { prisma } from "../lib/prisma.js";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-change-me";

export default async function adminAuthRoutes(app: FastifyInstance) {
  app.post(
    "/api/admin/auth/login",
    async (req: FastifyRequest, reply: FastifyReply) => {
      try {
        const body = req.body as { email: string; password: string };

        // 🔍 Find admin user
        const admin = await prisma.adminUser.findUnique({
          where: { email: body.email },
        });

        if (!admin)
          return reply.code(401).send({ ok: false, error: "Invalid credentials" });

        // 🔐 Compare password hash
        const valid = await bcrypt.compare(body.password, admin.password);
        if (!valid)
          return reply.code(401).send({ ok: false, error: "Invalid credentials" });

        // ✅ Generate JWT with proper expiresIn option
        const token = jwt.sign(
          { id: admin.id, type: "admin" },
          JWT_SECRET,
          { expiresIn: "7d" } // Correct placement for expiration config
        );

        // 🎯 Success response
        reply.send({
          ok: true,
          token,
          admin: { id: admin.id, email: admin.email, role: admin.role },
        });
      } catch (err) {
        console.error("❌ Admin login failed:", err);
        reply.code(500).send({ ok: false, error: "Server error" });
      }
    }
  );
}
