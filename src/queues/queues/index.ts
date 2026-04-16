/* eslint-disable */
// ---------------------------------------------------------
// StoresGo Phase 10 Scaffolding (Remapped)
// Generated: 2025-10-26T05:27:03.730802
// ---------------------------------------------------------

import { Queue } from 'bullmq';
const connection = { connection: { url: process.env.REDIS_URL || 'redis://localhost:6379' } };
export const aiCategorizationQueue = new Queue(
  process.env.QUEUE_AI_CATEGORIZATION || 'ai_categorization',
  connection
);
