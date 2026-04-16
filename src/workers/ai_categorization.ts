/* eslint-disable */
// ==========================================================
// 🧠 STORESGO — AI Categorization Worker (Render Fixed ✅)
// Compatible with NodeNext (Render), Prisma, BullMQ, and OpenAI
// ==========================================================
import "dotenv/config";
import { Worker, Job } from "bullmq";
import Redis from "ioredis";
import OpenAI from "openai";
import { PrismaClient } from "@prisma/client";

// ----------------------------------------------------------
// ⚙️ INITIALIZE CLIENTS
// ----------------------------------------------------------
const prisma = new PrismaClient();
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ✅ Stable Redis connection configuration (Render safe)
const connection = new Redis(process.env.REDIS_URL || "redis://127.0.0.1:6379", {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

const queueName = process.env.QUEUE_AI_CATEGORIZATION || "ai_categorization";

// ----------------------------------------------------------
// 💾 PAYLOAD TYPE
// ----------------------------------------------------------
type Payload = {
  importItemId?: number;
  productId?: number;
  name: string;
  description?: string | null;
};

// ----------------------------------------------------------
// 🧩 JSON Parsing Utility
// ----------------------------------------------------------
function parseFirstJson(text: string): any {
  try {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start >= 0 && end >= start) {
      return JSON.parse(text.slice(start, end + 1));
    }
  } catch (err) {
    console.warn("⚠️ Failed to parse AI response as JSON:", err);
  }
  return { slug: null, confidence: 0, tags: [] };
}

// ----------------------------------------------------------
// 🧠 JOB HANDLER
// ----------------------------------------------------------
async function handle(job: Job<Payload>) {
  const { name, description, importItemId, productId } = job.data;

  console.log(`🧩 Processing job ${job.id}: ${name}`);

  const prompt = `Return JSON with keys: slug, confidence (0..1), tags (string[]) that best categorize a grocery product in a marketplace taxonomy.
Name: ${name}
Description: ${description || ""}`;

  let parsed = { slug: null, confidence: 0, tags: [] };

  try {
    const resp = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      input: prompt,
    });

    const text =
      (resp as any).output_text ||
      JSON.stringify({ slug: null, confidence: 0, tags: [] });

    parsed = parseFirstJson(text);
  } catch (err) {
    console.error(`❌ AI categorization failed for job ${job.id}:`, err);
  }

  // 🗂️ Log result in database
  const log = await prisma.aICategoryLog.create({
    data: {
      productId: productId || null,
      importItemId: importItemId || null,
      resultJson: parsed,
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0,
      chosenSlug: typeof parsed.slug === "string" ? parsed.slug : null,
    },
  });

  // 🧾 Upsert taxonomy + update product
  if (productId && parsed.slug) {
    const cat = await prisma.taxonomy.upsert({
      where: { slug: parsed.slug },
      update: {},
      create: { slug: parsed.slug, title: parsed.slug },
    });

    await prisma.product.update({
      where: { id: productId },
      data: { categoryId: cat.id },
    });
  }

  // 📨 Mark import item as processed
  if (importItemId) {
    await prisma.importItem.update({
      where: { id: importItemId },
      data: { status: "processed" },
    });
  }

  console.log(`✅ Job ${job.id} complete — slug: ${parsed.slug}`);
  return { ok: true, logId: log.id };
}

// ----------------------------------------------------------
// 🧠 WORKER SETUP (Render-Compatible)
// ----------------------------------------------------------
export const worker = new Worker<Payload>(queueName, handle, { connection });

console.log(`✅ [AI Worker] Listening on queue: ${queueName}`);

worker.on("completed", (job) =>
  console.log(`🎉 Job ${job.id} completed successfully.`)
);

worker.on("failed", (job, err) =>
  console.error(`❌ Job ${job?.id} failed:`, err)
);

worker.on("error", (err) =>
  console.error("💥 Worker encountered a connection error:", err)
);
