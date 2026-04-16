// ==========================================================
// 🧠 STORESGO QUEUE WORKER (BullMQ)
// Handles AI Categorization + Autoblog Jobs
// ==========================================================

import { Queue, Worker, QueueScheduler } from "bullmq";
import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

// ----------------------------------------------------------
// Redis Connection
// ----------------------------------------------------------
const connection = new Redis(process.env.REDIS_URL || "redis://127.0.0.1:6379");

// ----------------------------------------------------------
// Queue Setup
// ----------------------------------------------------------
export const aiCategorizationQueue = new Queue("ai_categorization", { connection });

// Optional: Job Scheduler (ensures stalled jobs are retried)
new QueueScheduler("ai_categorization", { connection });

// ----------------------------------------------------------
// Worker Logic
// ----------------------------------------------------------
export const aiCategorizationWorker = new Worker(
  "ai_categorization",
  async (job) => {
    const { productId, name, description } = job.data;
    console.log(`🧩 Processing AI categorization for product: ${name} (ID: ${productId})`);
    // Simulated AI logic — you can connect this to OpenAI later
    await new Promise((r) => setTimeout(r, 1500));
    console.log("✅ Categorization complete for:", name);
  },
  { connection }
);

aiCategorizationWorker.on("completed", (job) => {
  console.log(`✅ Job ${job.id} completed successfully`);
});

aiCategorizationWorker.on("failed", (job, err) => {
  console.error(`❌ Job ${job?.id} failed:`, err.message);
});

console.log("🚀 AI Categorization Queue Worker ready");
