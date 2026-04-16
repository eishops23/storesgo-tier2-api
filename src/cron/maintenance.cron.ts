// ==========================================================
// 🧹 STORESGO MAINTENANCE CRON — PHASE 15
// Periodic cleanup tasks for database hygiene
// ==========================================================

import cron from "node-cron";
import { cleanupExpiredTokens } from "../services/passwordReset.service.js";
import { prisma } from "../lib/prisma.js";

// ----------------------------------------------------------
// 📋 CONFIGURATION
// ----------------------------------------------------------

// Cleanup expired password reset tokens every hour
const TOKEN_CLEANUP_SCHEDULE = process.env.TOKEN_CLEANUP_SCHEDULE || "0 * * * *";

// Cleanup old notifications every day at 4 AM
const NOTIFICATION_CLEANUP_SCHEDULE = process.env.NOTIFICATION_CLEANUP_SCHEDULE || "0 4 * * *";

// Days to keep read notifications
const NOTIFICATION_RETENTION_DAYS = Number(process.env.NOTIFICATION_RETENTION_DAYS || 90);

// ----------------------------------------------------------
// 🚀 START MAINTENANCE CRON JOBS
// ----------------------------------------------------------

export async function startMaintenanceCron() {
  console.log("🧹 Initializing Maintenance Cron Jobs...");

  // -------------------------------------------------------------------
  // 1️⃣ Password Reset Token Cleanup — every hour
  // -------------------------------------------------------------------
  cron.schedule(TOKEN_CLEANUP_SCHEDULE, async () => {
    console.log("🔐 Running password reset token cleanup...");
    try {
      const deletedCount = await cleanupExpiredTokens();
      if (deletedCount > 0) {
        console.log(`✅ Cleaned up ${deletedCount} expired/used password reset tokens`);
      }
    } catch (err: any) {
      console.error("❌ Token cleanup error:", err.message);
    }
  });

  // -------------------------------------------------------------------
  // 2️⃣ Old Notification Cleanup — daily at 4 AM
  // -------------------------------------------------------------------
  cron.schedule(NOTIFICATION_CLEANUP_SCHEDULE, async () => {
    console.log("🔔 Running old notification cleanup...");
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - NOTIFICATION_RETENTION_DAYS);

      const result = await prisma.notification.deleteMany({
        where: {
          createdAt: { lt: cutoffDate },
          status: "READ",
        },
      });

      if (result.count > 0) {
        console.log(`✅ Cleaned up ${result.count} old read notifications`);
      }
    } catch (err: any) {
      console.error("❌ Notification cleanup error:", err.message);
    }
  });

  console.log("✅ Maintenance Cron Jobs active (Token + Notification cleanup)");
  console.log(`   📋 Token cleanup: ${TOKEN_CLEANUP_SCHEDULE}`);
  console.log(`   📋 Notification cleanup: ${NOTIFICATION_CLEANUP_SCHEDULE}`);
}

// ----------------------------------------------------------
// 🔧 MANUAL CLEANUP FUNCTIONS (for testing/admin use)
// ----------------------------------------------------------

/**
 * Run all cleanup tasks manually
 */
export async function runAllCleanupTasks(): Promise<{
  tokensDeleted: number;
  notificationsDeleted: number;
}> {
  console.log("🧹 Running all cleanup tasks manually...");

  // Cleanup tokens
  const tokensDeleted = await cleanupExpiredTokens();

  // Cleanup notifications
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - NOTIFICATION_RETENTION_DAYS);

  const notificationResult = await prisma.notification.deleteMany({
    where: {
      createdAt: { lt: cutoffDate },
      status: "READ",
    },
  });

  const result = {
    tokensDeleted,
    notificationsDeleted: notificationResult.count,
  };

  console.log(`✅ Manual cleanup complete:`, result);
  return result;
}

