// src/queues/aiQueue.ts
import { Queue, Worker, QueueScheduler, JobsOptions } from "bullmq";
import Redis from "ioredis";
import { runAutoblogOnce } from "../jobs/autoblog";

const connection = new Redis(process.env.REDIS_URL || "redis://127.0.0.1:6379", {
  maxRetriesPerRequest: null,
});

export const AI_QUEUE_NAME = "autoblog";

export const aiQueue = new Queue(AI_QUEUE_NAME, { connection });
new QueueScheduler(AI_QUEUE_NAME, { connection }); // ensures delayed jobs run

// Worker that executes one post creation
export const aiWorker = new Worker(
  AI_QUEUE_NAME,
  async () => {
    const res = await runAutoblogOnce();
    return res;
  },
  { connection, concurrency: 1 }
);

// Optional logging
aiWorker.on("completed", (_job, result) => {
  console.log("✅ Autoblog job completed:", result);
});
aiWorker.on("failed", (_job, err) => {
  console.error("❌ Autoblog job failed:", err?.message);
});

// Helper to enqueue a single job
export async function enqueueAutoblogJob(opts: JobsOptions = {}) {
  return aiQueue.add("run", {}, { removeOnComplete: true, removeOnFail: true, ...opts });
}
