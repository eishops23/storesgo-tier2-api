/* eslint-disable */
// ==========================================================
// 🧠 BullMQ Queue Configuration — AI Categorization Queue
// StoresGo Phase 13 — Stable Integration
// ==========================================================

import { Queue } from "bullmq";

// ----------------------------------------------------------
// 🔧 Redis Connection Setup
// ----------------------------------------------------------
const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";

if (!redisUrl) {
  console.warn("⚠️  No REDIS_URL found — using default redis://127.0.0.1:6379");
}

// ----------------------------------------------------------
// 🧠 AI Categorization Queue (Main)
// ----------------------------------------------------------
export const aiCategorizationQueue = new Queue(
  process.env.QUEUE_AI_CATEGORIZATION || "ai_categorization",
  {
    connection: { url: redisUrl },
    defaultJobOptions: {
      removeOnComplete: true,
      removeOnFail: false,
      attempts: 3,
    },
  }
);

// ----------------------------------------------------------
// 🩺 Queue Status Log
// ----------------------------------------------------------
console.log(`✅ BullMQ Queue Initialized at ${redisUrl}`);
console.log(
  `🧩 Queue Name: ${process.env.QUEUE_AI_CATEGORIZATION || "ai_categorization"}`
);

// ----------------------------------------------------------
// 🚀 Future-Ready: Export Queue Map
// (Allows adding more queues later without refactoring imports)
// ----------------------------------------------------------
export const queues = {
  aiCategorization: aiCategorizationQueue,
};

export type QueueMap = typeof queues;
