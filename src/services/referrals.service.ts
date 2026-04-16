import { prisma } from "../lib/prisma.js";
import crypto from "crypto";

// --- Constants (moved from src/routes/referrals.ts) ---

export const REFERRER_REWARD_CENTS = 2500; // $25
export const REFERRED_REWARD_CENTS = 1000; // $10
export const REFERRAL_EXPIRY_DAYS = 30;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://storesgo.com";

// --- Types ---

export interface ReferralStats {
  referralCode: string;
  referralLink: string;
  totalReferrals: number;
  activeReferrals: number;
  pendingReferrals: number;
  pendingRewardsCents: number;
  totalEarningsCents: number;
  referrerRewardCents: number;
  referredRewardCents: number;
}

export interface ReferralHistoryItem {
  id: number;
  referredName: string;
  referredEmail: string;
  status: string;
  rewardCents: number;
  paidOut: boolean;
  createdAt: string;
  completedAt: string | null;
}

export interface ReferralValidation {
  valid: boolean;
  referredRewardCents?: number;
  error?: string;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  referralCount: number;
}

export interface ReferralProgramInfo {
  referrerRewardCents: number;
  referredRewardCents: number;
  expiryDays: number;
  linkTemplate: string;
  codeFormat: string;
}

// --- Functions ---

export function generateReferralCode(userId: string): string {
  const hash = crypto.createHash("sha256").update(userId + Date.now()).digest("hex");
  return "STGO" + hash.substring(0, 8).toUpperCase();
}

export async function getReferralStats(userId: string): Promise<ReferralStats> {
  // Get or create referral code for user
  let userReferral = await prisma.referral.findFirst({
    where: { referrerId: userId, referredId: null }
  });

  if (!userReferral) {
    try {
      userReferral = await prisma.referral.create({
        data: {
          referrerId: userId,
          referralCode: generateReferralCode(userId),
          status: "code_holder",
          referrerRewardCents: REFERRER_REWARD_CENTS,
          referredRewardCents: REFERRED_REWARD_CENTS,
        }
      });
    } catch (error: any) {
      // P2002 = unique constraint violation (race condition on referralCode)
      if (error?.code === 'P2002') {
        userReferral = await prisma.referral.findFirst({
          where: { referrerId: userId, referredId: null }
        });
        if (!userReferral) throw error; // still not found — rethrow
      } else {
        throw error;
      }
    }
  }

  // Get all referrals made by this user
  const referrals = await prisma.referral.findMany({
    where: { referrerId: userId, referredId: { not: null } },
    orderBy: { createdAt: "desc" }
  });

  const totalReferrals = referrals.length;
  const activeReferrals = referrals.filter(r => r.status === "completed").length;
  const pendingReferrals = referrals.filter(r => r.status === "pending").length;
  const totalEarningsCents = referrals
    .filter(r => r.status === "completed" && r.paidOut)
    .reduce((sum, r) => sum + r.referrerRewardCents, 0);
  const pendingRewardsCents = referrals
    .filter(r => r.status === "completed" && !r.paidOut)
    .reduce((sum, r) => sum + r.referrerRewardCents, 0);

  return {
    referralCode: userReferral.referralCode,
    referralLink: `${SITE_URL}/register?ref=${userReferral.referralCode}`,
    totalReferrals,
    activeReferrals,
    pendingReferrals,
    pendingRewardsCents,
    totalEarningsCents,
    referrerRewardCents: REFERRER_REWARD_CENTS,
    referredRewardCents: REFERRED_REWARD_CENTS,
  };
}

export async function getReferralHistory(userId: string, limit?: number): Promise<ReferralHistoryItem[]> {
  const effectiveLimit = Math.min(limit ?? 20, 50);

  const referrals = await prisma.referral.findMany({
    where: { referrerId: userId, referredId: { not: null } },
    include: {
      referred: {
        select: { email: true, createdAt: true }
      }
    },
    orderBy: { createdAt: "desc" },
    take: effectiveLimit,
  });

  return referrals.map(r => ({
    id: r.id,
    referredName: r.referredName || "New User",
    referredEmail: r.referred?.email || r.referredEmail || "***@***.com",
    status: r.status,
    rewardCents: r.referrerRewardCents,
    paidOut: r.paidOut,
    createdAt: r.createdAt.toISOString(),
    completedAt: r.completedAt?.toISOString() || null,
  }));
}

export async function validateReferralCode(code: string): Promise<ReferralValidation> {
  const referral = await prisma.referral.findFirst({
    where: { referralCode: code.toUpperCase(), status: "code_holder" }
  });

  if (!referral) {
    return { valid: false, error: "Invalid referral code" };
  }

  return {
    valid: true,
    referredRewardCents: REFERRED_REWARD_CENTS,
  };
}

export async function getReferralLeaderboard(limit?: number): Promise<LeaderboardEntry[]> {
  const effectiveLimit = Math.min(limit ?? 10, 20);

  const topReferrers = await prisma.referral.groupBy({
    by: ["referrerId"],
    where: { status: "completed" },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: effectiveLimit,
  });

  const leaderboard = await Promise.all(
    topReferrers.map(async (r, index) => {
      const user = await prisma.user.findUnique({
        where: { id: r.referrerId },
        select: { email: true, buyerProfile: { select: { firstName: true } } }
      });
      return {
        rank: index + 1,
        name: user?.buyerProfile?.firstName || "User",
        referralCount: r._count.id,
      };
    })
  );

  return leaderboard;
}

export function getReferralProgramInfo(): ReferralProgramInfo {
  return {
    referrerRewardCents: REFERRER_REWARD_CENTS,
    referredRewardCents: REFERRED_REWARD_CENTS,
    expiryDays: REFERRAL_EXPIRY_DAYS,
    linkTemplate: "https://storesgo.com/register?ref={code}",
    codeFormat: "STGO + 8 uppercase hex characters",
  };
}
