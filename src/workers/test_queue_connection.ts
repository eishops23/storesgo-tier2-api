import { Queue, Worker } from "bullmq";
import Redis from "ioredis";

// ✅ Correct Redis connection configuration
const connection = new Redis(process.env.REDIS_URL || "redis://127.0.0.1:6379", {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

const queueName = "ai_categorization";
const queue = new Queue(queueName, { connection });

console.log(`✅ Queue '${queueName}' is connected and ready.`);

// ✅ Create a worker to confirm the connection and process jobs
const worker = new Worker(
  queueName,
  async (job) => {
    console.log(`🧠 Worker received job: ${job.name}`, job.data);

    // Simulate AI categorization work
    await new Promise((resolve) => setTimeout(resolve, 1000));

    console.log(`✅ Job ${job.id} completed successfully.`);
    return { status: "done", timestamp: new Date().toISOString() };
  },
  { connection }
);

// ✅ Event listeners for reliability
worker.on("completed", (job) => console.log(`🎉 Worker finished job ${job.id}`));
worker.on("failed", (job, err) =>
  console.error(`❌ Job ${job?.id} failed:`, err?.message || err)
);
worker.on("error", (err) => console.error("💥 Worker error:", err));

// ✅ Enqueue a test job to verify the queue
(async () => {
  try {
    const job = await queue.add("test_job", { sample: "hello world" });
    console.log(`📩 Enqueued job with ID: ${job.id}`);
  } catch (err) {
    console.error("❌ Failed to enqueue job:", err);
  }
})();
