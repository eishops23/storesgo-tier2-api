import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../lib/prisma.js";
import jwt from "jsonwebtoken";
import * as referralsService from "../services/referrals.service.js";

const JWT_SECRET = process.env.JWT_SECRET || "storesgo-secret";

function getUserIdFromToken(request: FastifyRequest): string | null {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  try {
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return decoded.id || null;
  } catch { return null; }
}

export default async function referralsRoutes(app: FastifyInstance) {
  // GET /api/referrals/stats - Get user's referral stats and code
  app.get("/stats", async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = getUserIdFromToken(request);
    if (!userId) return reply.code(401).send({ ok: false, error: "Unauthorized" });

    try {
      const data = await referralsService.getReferralStats(userId);
      return { ok: true, data };
    } catch (error: any) {
      console.error("Get referral stats error:", error);
      return reply.code(500).send({ ok: false, error: "Failed to fetch referral stats" });
    }
  });

  // GET /api/referrals/history - Get referral history
  app.get("/history", async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = getUserIdFromToken(request);
    if (!userId) return reply.code(401).send({ ok: false, error: "Unauthorized" });

    try {
      const history = await referralsService.getReferralHistory(userId);
      return { ok: true, data: history };
    } catch (error: any) {
      console.error("Get referral history error:", error);
      return reply.code(500).send({ ok: false, error: "Failed to fetch referral history" });
    }
  });

  // POST /api/referrals/validate - Validate a referral code
  app.post("/validate", async (request: FastifyRequest, reply: FastifyReply) => {
    const { code } = request.body as { code: string };
    if (!code) return reply.code(400).send({ ok: false, error: "Referral code required" });

    try {
      const result = await referralsService.validateReferralCode(code);
      if (!result.valid) {
        return { ok: false, valid: false, error: result.error };
      }
      return { ok: true, valid: true, referredRewardCents: result.referredRewardCents };
    } catch (error: any) {
      return reply.code(500).send({ ok: false, error: "Failed to validate code" });
    }
  });

  // POST /api/referrals/apply - Apply referral code during registration
  app.post("/apply", async (request: FastifyRequest, reply: FastifyReply) => {
    const { code, referredUserId, referredEmail, referredName } = request.body as {
      code: string;
      referredUserId: string;
      referredEmail?: string;
      referredName?: string;
    };

    if (!code || !referredUserId) {
      return reply.code(400).send({ ok: false, error: "Code and user ID required" });
    }

    try {
      // Find the referrer's code holder record
      const codeHolder = await prisma.referral.findFirst({
        where: { referralCode: code.toUpperCase(), status: "code_holder" }
      });

      if (!codeHolder) {
        return reply.code(400).send({ ok: false, error: "Invalid referral code" });
      }

      // Prevent self-referral
      if (codeHolder.referrerId === referredUserId) {
        return reply.code(400).send({ ok: false, error: "Cannot use your own referral code" });
      }

      // Check if user was already referred
      const existingReferral = await prisma.referral.findFirst({
        where: { referredId: referredUserId }
      });

      if (existingReferral) {
        return reply.code(400).send({ ok: false, error: "User already has a referral" });
      }

      // Create the referral record
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + referralsService.REFERRAL_EXPIRY_DAYS);

      const referral = await prisma.referral.create({
        data: {
          referrerId: codeHolder.referrerId,
          referredId: referredUserId,
          referralCode: code.toUpperCase() + "_" + Date.now(),
          referredEmail,
          referredName,
          status: "pending",
          referrerRewardCents: referralsService.REFERRER_REWARD_CENTS,
          referredRewardCents: referralsService.REFERRED_REWARD_CENTS,
          expiresAt,
        }
      });

      return { ok: true, data: referral };
    } catch (error: any) {
      console.error("Apply referral error:", error);
      return reply.code(500).send({ ok: false, error: "Failed to apply referral" });
    }
  });

  // POST /api/referrals/complete - Complete referral after qualifying purchase
  app.post("/complete", async (request: FastifyRequest, reply: FastifyReply) => {
    const { referredUserId, orderId } = request.body as {
      referredUserId: string;
      orderId: number;
    };

    try {
      const referral = await prisma.referral.findFirst({
        where: { referredId: referredUserId, status: "pending" }
      });

      if (!referral) {
        return { ok: false, error: "No pending referral found" };
      }

      // Check if expired
      if (referral.expiresAt && new Date() > referral.expiresAt) {
        await prisma.referral.update({
          where: { id: referral.id },
          data: { status: "expired" }
        });
        return { ok: false, error: "Referral expired" };
      }

      // Mark as completed
      const updated = await prisma.referral.update({
        where: { id: referral.id },
        data: {
          status: "completed",
          completedAt: new Date(),
          qualifyingOrderId: orderId,
        }
      });

      return { ok: true, data: updated };
    } catch (error: any) {
      console.error("Complete referral error:", error);
      return reply.code(500).send({ ok: false, error: "Failed to complete referral" });
    }
  });

  // GET /api/referrals/leaderboard - Get top referrers (public)
  app.get("/leaderboard", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const leaderboard = await referralsService.getReferralLeaderboard();
      return { ok: true, data: leaderboard };
    } catch (error: any) {
      return reply.code(500).send({ ok: false, error: "Failed to fetch leaderboard" });
    }
  });
}
