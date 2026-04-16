/* eslint-disable */
// ==========================================================
// 🔐 STORESGO SELLER AUTH MIDDLEWARE
// ==========================================================
import { FastifyReply, FastifyRequest } from "fastify";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";
import type { UserJwtPayload } from "../types/fastify-jwt.js";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-change-me";

export async function authenticateSeller(
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
    if (!payload || payload.role !== "SELLER") {
      return reply.code(403).send({ ok: false, error: "Forbidden" });
    }
    
    // Look up the seller record from the database using userId
    const seller = await prisma.seller.findFirst({
      where: { userId: payload.id },
      select: { id: true, userId: true, storeName: true }
    });
    
    if (!seller) {
      return reply.code(403).send({ ok: false, error: "Seller account not found" });
    }
    
    // Attach both user and seller to request for downstream handlers
    request.user = payload;
    (request as any).seller = seller;
    return;
  } catch (err: any) {
    console.error("❌ Seller auth failed:", err.message || err);
    return reply.code(401).send({ ok: false, error: "Invalid or expired token" });
  }
}
