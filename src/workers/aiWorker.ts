/* eslint-disable */
// ==========================================================
// 🧠 StoresGo AI Worker — Phase 11C (Merged Final Version)
// BullMQ • PostgreSQL • OpenAI Categorization + SEO Task Creation
// ==========================================================

import "dotenv/config";
import { Worker, Job } from "bullmq";
import { PrismaClient } from "@prisma/client";
import {
  categorizeProductAI,
  persistAICategoryLog,
  assignProductCategory,
} from "../ai/categorizer";
import { enqueueSeoForProduct } from "../ai/seo";

const prisma = new PrismaClient();
const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";
const queueName = process.env.QUEUE_AI_CATEGORIZATION || "ai_categorization";

type JobPayload =
  | { type: "product"; productId: number }
  | { type: "import"; importItemId: number };

// ----------------------------------------------------------
// ⚙️ Worker Initialization
// ----------------------------------------------------------
console.log(`✅ BullMQ Worker listening on "${queueName}" → ${redisUrl}`);

const worker = new Worker<JobPayload>(
  queueName,
  async (job: Job<JobPayload>) => {
    console.log(`🔄 Processing job [${job.id}] type=${job.data.type}`);

    try {
      // =====================================================
      // 🛍 PRODUCT JOBS
      // =====================================================
      if (job.data.type === "product") {
        const product = await prisma.product.findUnique({
          where: { id: job.data.productId },
        });
        if (!product) {
          console.warn(`⚠️ Product not found: ${job.data.productId}`);
          return;
        }

        // 🧠 Run categorization model
        const { chosenSlug, confidence, modelRaw } = await categorizeProductAI({
          productId: product.id,
          name: product.name,
          description: product.description,
        });

        // 🗃 Persist AI categorization log
        await persistAICategoryLog({
          productId: product.id,
          chosenSlug,
          confidence,
          modelRaw,
        });

        // 🏷 Assign category in taxonomy if valid
        if (chosenSlug) {
          await assignProductCategory(product.id, chosenSlug);
          console.log(`🏷 Category assigned: ${chosenSlug}`);
        }

        // 🔁 Create SEO optimization task
        await enqueueSeoForProduct(product.id);
        console.log(`🧠 SEO Task queued for Product ID ${product.id}`);
      }

      // =====================================================
      // 📦 IMPORT ITEM JOBS
      // =====================================================
      else if (job.data.type === "import") {
        const item = await prisma.importItem.findUnique({
          where: { id: job.data.importItemId },
        });
        if (!item) {
          console.warn(`⚠️ Import Item not found: ${job.data.importItemId}`);
          return;
        }

        const { chosenSlug, confidence, modelRaw } = await categorizeProductAI({
          importItemId: item.id,
          name: item.parsedName || "Imported Product",
          description: JSON.stringify(item.rawJson),
        });

        await persistAICategoryLog({
          importItemId: item.id,
          chosenSlug,
          confidence,
          modelRaw,
        });

        console.log(`📦 Import Item categorized → ${chosenSlug || "N/A"}`);
        // (Optional) Create Product & assign category from import
      }
    } catch (err) {
      console.error(`❌ Error processing job ${job.id}:`, err);
    }
  },
  { connection: { url: redisUrl } }
);

// ----------------------------------------------------------
// 🧩 Worker Events
// ----------------------------------------------------------
worker.on("ready", () =>
  console.log(`🟢 AI Worker ready and connected to Redis: ${redisUrl}`)
);
worker.on("completed", (job) =>
  console.log(`✅ Job ${job.id} completed successfully`)
);
worker.on("failed", (job, err) =>
  console.error(`❌ Job ${job?.id} failed:`, err.message)
);
