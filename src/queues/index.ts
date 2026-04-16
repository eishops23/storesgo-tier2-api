/* eslint-disable */
// ==========================================================
// 🚀 StoresGo Phase 11 — BullMQ Queue Configuration
// AI Categorization • SEO Automation • Redis Integration
// Generated: 2025-10-27
// ==========================================================

import { Queue } from "bullmq";

// ----------------------------------------------------------
// ⚙️ REDIS CONNECTION
// ----------------------------------------------------------
const connection = {
  connection: {
    url: process.env.REDIS_URL || "redis://127.0.0.1:6379",
  },
};

// ----------------------------------------------------------
// 🎯 QUEUE DEFINITIONS
// Safe initialization: Queue may fail on Redis < 5.0 (Windows dev)
// ----------------------------------------------------------
export const AI_CATEGORY_QUEUE_NAME =
  process.env.QUEUE_AI_CATEGORIZATION || "ai_categorization";

// 🧠 Main AI Categorization Queue (used by workers & routes)
// Lazy initialization to avoid crashes on module load
let _aiCategorizationQueue: Queue | null = null;

export function getAiCategorizationQueue(): Queue | null {
  if (_aiCategorizationQueue) return _aiCategorizationQueue;
  try {
    _aiCategorizationQueue = new Queue(AI_CATEGORY_QUEUE_NAME, connection);
    console.log(
      `✅ BullMQ Queues initialized:\n- AI Categorization: "${AI_CATEGORY_QUEUE_NAME}"\n- Redis: ${connection.connection.url}`
    );
  } catch (err: any) {
    console.warn(`⚠️ AI Categorization Queue unavailable (Redis < 5.0 or offline): ${err.message}`);
  }
  return _aiCategorizationQueue;
}

// Legacy export for backwards compatibility (returns null if unavailable)
export const aiCategorizationQueue = (() => {
  try {
    return new Queue(AI_CATEGORY_QUEUE_NAME, connection);
  } catch {
    return null;
  }
})();

// ----------------------------------------------------------
// 🧭 Future Queues (Optional for Expansion)
// ----------------------------------------------------------
// export const seoQueue = new Queue("seo_tasks", connection);
// export const importQueue = new Queue("import_processing", connection);
