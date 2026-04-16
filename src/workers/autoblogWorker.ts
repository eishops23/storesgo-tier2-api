// =============================================================================
// STORESGO AUTOBLOG WORKER — PHASE 16
// BullMQ worker for processing daily AI blog post generation
// =============================================================================

import { Worker, Job } from "bullmq";
import Redis from "ioredis";
import { runAutoblogOnce, AutoblogOutcome } from "../jobs/autoblog.js";

// Redis connection state
let connection: Redis | null = null;
let workerInstance: Worker | null = null;

/**
 * Initialize Redis connection for BullMQ worker
 */
function initRedisConnection(): Redis | null {
  const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

  try {
    const conn = new Redis(redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      tls: redisUrl.startsWith("rediss://") ? {} : undefined,
      connectTimeout: 5000,
      retryStrategy: (times) => {
        if (times > 3) return null;
        return Math.min(times * 500, 2000);
      },
    });
    return conn;
  } catch (err: any) {
    console.warn("⚠️ Autoblog worker: Redis connection failed:", err.message);
    return null;
  }
}

/**
 * Create the Autoblog Worker
 * Returns null if Redis is not available
 */
export function createAutoblogWorker(): Worker | null {
  // Initialize connection if not already done
  if (!connection) {
    connection = initRedisConnection();
  }

  if (!connection) {
    console.warn("⚠️ Autoblog worker: No Redis connection, worker not started");
    return null;
  }

  // Don't create duplicate workers
  if (workerInstance) {
    console.log("ℹ️ Autoblog worker already running");
    return workerInstance;
  }

  try {
    workerInstance = new Worker(
      "autoblog-tasks",
      async (job: Job) => {
        console.log(`📝 Processing autoblog job ${job.id}...`);
        console.log(`   Triggered at: ${job.data.triggeredAt}`);
        console.log(`   Source: ${job.data.source}`);

        try {
          const result: AutoblogOutcome = await runAutoblogOnce();

          if (result.created) {
            console.log(`✅ Autoblog post created successfully!`);
            console.log(`   Seller ID: ${result.sellerId}`);
            console.log(`   Slug: ${result.slug}`);
            return { success: true, ...result };
          } else {
            console.log(`⚠️ Autoblog skipped: ${result.reason}`);
            return { success: false, ...result };
          }
        } catch (err: any) {
          console.error(`❌ Autoblog job failed:`, err.message);
          throw err; // Re-throw to trigger retry
        }
      },
      {
        connection,
        concurrency: 1, // Only process one blog at a time
        limiter: {
          max: 1,
          duration: 60000, // Max 1 job per minute
        },
      }
    );

    // Event handlers for logging
    workerInstance.on("completed", (job, result) => {
      console.log(`✅ Autoblog job ${job.id} completed:`, result);
    });

    workerInstance.on("failed", (job, err) => {
      console.error(`❌ Autoblog job ${job?.id} failed:`, err.message);
    });

    workerInstance.on("error", (err) => {
      console.error("❌ Autoblog worker error:", err.message);
    });

    console.log("📝 Autoblog worker started and listening for jobs...");
    return workerInstance;
  } catch (err: any) {
    console.warn("⚠️ Autoblog worker creation failed:", err.message);
    return null;
  }
}

/**
 * Manual Trigger Function (for testing/admin use)
 */
export async function triggerAutoblogManually(): Promise<AutoblogOutcome> {
  console.log("📝 Manual autoblog trigger...");
  return await runAutoblogOnce();
}

/**
 * Stop the Autoblog Worker
 */
export async function stopAutoblogWorker(): Promise<void> {
  if (workerInstance) {
    await workerInstance.close();
    workerInstance = null;
    console.log("✅ Autoblog worker stopped");
  }
  if (connection) {
    connection.disconnect();
    connection = null;
  }
}

// Standalone execution (if running this file directly)
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🚀 Starting Autoblog Worker in standalone mode...");
  createAutoblogWorker();
}
