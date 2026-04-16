/* eslint-disable */
// ==========================================================
// 🧠 STORESGO BACKEND — BullMQ Worker Initialization
// Handles AI Categorization Queue (Phase 14A Ready)
// PostgreSQL • Redis • Fastify • ESM Safe
// ==========================================================

import { Queue } from "bullmq";

// ----------------------------------------------------------
// 🔗 Redis Connection Setup
// ----------------------------------------------------------
const redisUrl: string = process.env.REDIS_URL || "redis://127.0.0.1:6379";

// ----------------------------------------------------------
// 🧪 Verify Redis Connection (Non-blocking async test)
// ----------------------------------------------------------
async function verifyRedisConnection(url: string) {
  try {
    const { createClient } = await import("redis");
    const client = createClient({ url });
    await client.connect();
    const pong = await client.ping();
    console.log(`✅ Redis connection verified at ${url} (${pong})`);
    await client.disconnect();
  } catch (err: any) {
    console.error(`⚠️ Redis not reachable at ${url}: ${err.message}`);
  }
}

// ----------------------------------------------------------
// 🧠 Queue Initialization (Global Singleton Safe)
// ----------------------------------------------------------
declare global {
  // Allow reuse across hot-reloads / multiple imports
  // eslint-disable-next-line no-var
  var __storesgo_ai_queue__: Queue | undefined;
}

let aiCategorizationQueue: Queue;

if (!globalThis.__storesgo_ai_queue__) {
  aiCategorizationQueue = new Queue(
    process.env.QUEUE_AI_CATEGORIZATION || "ai_categorization",
    {
      connection: { url: redisUrl },
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: 5000,
        attempts: 3,
        backoff: { type: "exponential", delay: 3000 },
      },
    }
  );

  globalThis.__storesgo_ai_queue__ = aiCategorizationQueue;

  console.log(
    `🧠 BullMQ Queue initialized: "${
      process.env.QUEUE_AI_CATEGORIZATION || "ai_categorization"
    }" @ ${redisUrl}`
  );

  // Verify Redis connection asynchronously
  verifyRedisConnection(redisUrl).catch(() => {});
} else {
  aiCategorizationQueue = globalThis.__storesgo_ai_queue__;
  console.log("♻️ Reusing existing BullMQ queue instance (hot reload safe).");
}

// ----------------------------------------------------------
// ✅ Export
// ----------------------------------------------------------
export { aiCategorizationQueue };
