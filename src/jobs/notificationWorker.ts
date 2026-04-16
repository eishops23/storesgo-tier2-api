// =============================================================================
// 🔔 STORESGO NOTIFICATION WORKER
// BullMQ Worker for processing notification jobs asynchronously
// =============================================================================

import { Worker, Job } from "bullmq";
import Redis from "ioredis";
import { prisma } from "../lib/prisma.js";
import {
  sendEmail,
  sendSms,
  wrapHtmlTemplate,
} from "../utils/notifySender.js";
import {
  deliverNotification,
  retryFailedNotifications,
  cleanupOldNotifications,
} from "../services/notifications.service.js";

// =============================================================================
// Job Type Definitions
// =============================================================================

export interface SendNotificationJob {
  type: "send";
  notificationId: number;
}

export interface RetryFailedJob {
  type: "retry_failed";
  maxRetries?: number;
}

export interface CleanupJob {
  type: "cleanup";
  daysOld?: number;
}

export interface BulkSendJob {
  type: "bulk_send";
  notificationIds: number[];
}

export interface DirectEmailJob {
  type: "email";
  to: string;
  subject: string;
  message: string;
  htmlContent?: string;
}

export interface DirectSmsJob {
  type: "sms";
  to: string;
  message: string;
}

export type NotificationJobData =
  | SendNotificationJob
  | RetryFailedJob
  | CleanupJob
  | BulkSendJob
  | DirectEmailJob
  | DirectSmsJob;

// =============================================================================
// Worker State
// =============================================================================

let workerInstance: Worker<NotificationJobData> | null = null;
let connection: Redis | null = null;

// =============================================================================
// Worker Setup
// =============================================================================

/**
 * Create the Notification Worker
 * Returns the worker instance, throws if Redis is unavailable
 */
export function createNotificationWorker(): Worker<NotificationJobData> {
  const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";

  // Don't create duplicate workers
  if (workerInstance) {
    console.log("ℹ️ Notification worker already running");
    return workerInstance;
  }

  try {
    connection = new Redis(redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      tls: redisUrl.startsWith("rediss://") ? {} : undefined,
      connectTimeout: 5000,
      retryStrategy: (times) => {
        if (times > 3) return null;
        return Math.min(times * 500, 2000);
      },
    });
  } catch (err: any) {
    console.warn("⚠️ Notification worker: Redis connection failed:", err.message);
    throw err;
  }

  workerInstance = new Worker<NotificationJobData>(
    "notifications",
    async (job: Job<NotificationJobData>) => {
      console.log(`📬 Processing notification job: ${job.name} (${job.id})`);

      const data = job.data;

      switch (data.type) {
        case "send":
          return await processSendNotification(data);

        case "retry_failed":
          return await processRetryFailed(data);

        case "cleanup":
          return await processCleanup(data);

        case "bulk_send":
          return await processBulkSend(data);

        case "email":
          return await processDirectEmail(data);

        case "sms":
          return await processDirectSms(data);

        default:
          console.warn(`⚠️ Unknown notification job type`);
          return { success: false, error: "Unknown job type" };
      }
    },
    {
      connection,
      concurrency: 5,
      limiter: {
        max: 100,
        duration: 60000, // 100 jobs per minute
      },
    }
  );

  // Event handlers
  workerInstance.on("completed", (job, result) => {
    console.log(`✅ Notification job ${job.id} completed:`, result);
  });

  workerInstance.on("failed", (job, error) => {
    console.error(`❌ Notification job ${job?.id} failed:`, error);
  });

  workerInstance.on("error", (error) => {
    console.error("❌ Notification worker error:", error);
  });

  console.log("🔔 Notification worker started");

  return workerInstance;
}

// =============================================================================
// Job Processors
// =============================================================================

async function processSendNotification(data: SendNotificationJob) {
  const success = await deliverNotification(data.notificationId);
  return { success, notificationId: data.notificationId };
}

async function processRetryFailed(data: RetryFailedJob) {
  const retriedCount = await retryFailedNotifications(data.maxRetries || 3);
  console.log(`🔄 Retried ${retriedCount} failed notifications`);
  return { success: true, retriedCount };
}

async function processCleanup(data: CleanupJob) {
  const deletedCount = await cleanupOldNotifications(data.daysOld || 90);
  console.log(`🧹 Cleaned up ${deletedCount} old notifications`);
  return { success: true, deletedCount };
}

async function processBulkSend(data: BulkSendJob) {
  const results = await Promise.allSettled(
    data.notificationIds.map((id) => deliverNotification(id))
  );

  const successCount = results.filter(
    (r) => r.status === "fulfilled" && r.value
  ).length;

  console.log(
    `📤 Bulk send: ${successCount}/${data.notificationIds.length} successful`
  );

  return {
    success: true,
    total: data.notificationIds.length,
    successCount,
    failedCount: data.notificationIds.length - successCount,
  };
}

async function processDirectEmail(data: DirectEmailJob) {
  const result = await sendEmail({
    to: data.to,
    subject: data.subject,
    text: data.message,
    html: data.htmlContent || wrapHtmlTemplate(`<p>${data.message}</p>`, data.subject),
  });

  return result;
}

async function processDirectSms(data: DirectSmsJob) {
  const result = await sendSms({
    to: data.to,
    message: data.message,
  });

  return result;
}

// =============================================================================
// Scheduled Jobs Setup
// =============================================================================

export async function scheduleRecurringJobs(notificationsQueue: any) {
  if (!notificationsQueue) {
    console.warn("⚠️ Cannot schedule recurring jobs — queue not available");
    return;
  }

  // Retry failed notifications every 15 minutes
  await notificationsQueue.add(
    "retry-failed",
    { type: "retry_failed", maxRetries: 3 },
    {
      repeat: {
        pattern: "*/15 * * * *", // Every 15 minutes
      },
      removeOnComplete: true,
    }
  );

  // Cleanup old notifications daily at 3 AM
  await notificationsQueue.add(
    "cleanup-old",
    { type: "cleanup", daysOld: 90 },
    {
      repeat: {
        pattern: "0 3 * * *", // 3:00 AM daily
      },
      removeOnComplete: true,
    }
  );

  console.log("📅 Scheduled recurring notification jobs");
}

// =============================================================================
// Helper Functions: Add Jobs to Queue
// =============================================================================

export async function queueNotificationDelivery(
  queue: any,
  notificationId: number,
  options?: {
    delay?: number;
    priority?: number;
  }
) {
  if (!queue) {
    console.warn("⚠️ Cannot queue notification — queue not available");
    return null;
  }

  return queue.add(
    "send-notification",
    { type: "send", notificationId },
    {
      delay: options?.delay,
      priority: options?.priority,
      removeOnComplete: true,
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 5000,
      },
    }
  );
}

export async function queueBulkNotifications(
  queue: any,
  notificationIds: number[]
) {
  if (!queue) {
    console.warn("⚠️ Cannot queue bulk notifications — queue not available");
    return null;
  }

  return queue.add(
    "bulk-send",
    { type: "bulk_send", notificationIds },
    {
      removeOnComplete: true,
      attempts: 1,
    }
  );
}

export async function queueDirectEmail(
  queue: any,
  data: Omit<DirectEmailJob, "type">
) {
  if (!queue) {
    console.warn("⚠️ Cannot queue email — queue not available");
    return null;
  }

  return queue.add(
    "direct-email",
    { type: "email", ...data },
    {
      removeOnComplete: true,
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 5000,
      },
    }
  );
}

export async function queueDirectSms(
  queue: any,
  data: Omit<DirectSmsJob, "type">
) {
  if (!queue) {
    console.warn("⚠️ Cannot queue SMS — queue not available");
    return null;
  }

  return queue.add(
    "direct-sms",
    { type: "sms", ...data },
    {
      removeOnComplete: true,
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 5000,
      },
    }
  );
}

// =============================================================================
// Stop Worker
// =============================================================================

export async function stopNotificationWorker(): Promise<void> {
  if (workerInstance) {
    await workerInstance.close();
    workerInstance = null;
    console.log("✅ Notification worker stopped");
  }
  if (connection) {
    connection.disconnect();
    connection = null;
  }
}
