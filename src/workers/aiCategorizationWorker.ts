/* eslint-disable */
// ==========================================================
// 🤖 STORESGO — PHASE 14B/14C AI CATEGORIZATION WORKER (Unified Final)
// Consumes BullMQ jobs → OpenAI → Updates PostgreSQL (ESM-Safe)
// Supports Product + ImportItem • Logs AI results • Array tags
// ==========================================================

import "dotenv/config";
import { Worker } from "bullmq";
import OpenAI from "openai";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ----------------------------------------------------------
// 🧠 Job Handler
// ----------------------------------------------------------
async function handleCategorization(job: any) {
  const { type, productId, importItemId } = job.data || {};
  console.log(`🧠 AI Worker processing job: ${job.id} [${type}]`);

  let item: any = null;

  if (type === "product" && productId) {
    item = await prisma.product.findUnique({
      where: { id: Number(productId) },
      select: { id: true, name: true, description: true },
    });
  } else if (type === "import" && importItemId) {
    item = await prisma.importItem.findUnique({
      where: { id: Number(importItemId) },
      select: { id: true, parsedName: true, rawJson: true },
    });
  }

  if (!item) {
    console.warn(`⚠️ Item not found for job ${job.id}`);
    return { ok: false, error: "Item not found" };
  }

  // ----------------------------------------------------------
  // 🧩 Prompt Construction
  // ----------------------------------------------------------
  const name = item.name || item.parsedName || "Unnamed Product";
  const description =
    item.description ||
    (item.rawJson ? JSON.stringify(item.rawJson).slice(0, 300) : "No description provided.");

  const prompt = `
You are a categorization AI for StoresGo Marketplace.

Classify the following product into clear structured fields:
1️⃣ Primary Category (e.g., Beverages, Snacks, Sauces)
2️⃣ Subcategory (e.g., Juices, Chips, Hot Sauce)
3️⃣ SEO Tags (3–7 concise keywords)
4️⃣ Confidence (0.0–1.0)

Respond ONLY in JSON:
{
  "aiCategory": "string",
  "aiSubcategory": "string",
  "aiTags": ["string", "string", "string"],
  "aiConfidence": 0.0
}

Product name: ${name}
Description: ${description}
`;

  // ----------------------------------------------------------
  // 🔮 OpenAI Request
  // ----------------------------------------------------------
  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL_LIGHT || "gpt-4o-mini",
    messages: [
      { role: "system", content: "You are a concise eCommerce AI categorization assistant." },
      { role: "user", content: prompt },
    ],
    temperature: 0.3,
  });

  const text = response.choices?.[0]?.message?.content?.trim() || "{}";
  let result: any = {};
  try {
    result = JSON.parse(text);
  } catch (err) {
    console.error("⚠️ Failed to parse AI JSON response:", text);
    result = { aiCategory: "Uncategorized", aiSubcategory: null, aiTags: [], aiConfidence: 0.0 };
  }

  const { aiCategory, aiSubcategory, aiTags, aiConfidence } = result;

  // Parse tags safely to ensure array form
  const parsedTags =
    Array.isArray(aiTags)
      ? aiTags
      : String(aiTags || "")
          .split(",")
          .map((t: string) => t.trim())
          .filter(Boolean);

  // ----------------------------------------------------------
  // 💾 Persist to Database (Product or ImportItem)
  // ----------------------------------------------------------
  if (type === "product" && productId) {
    await prisma.product.update({
      where: { id: Number(productId) },
      data: {
        aiCategory: aiCategory || "Uncategorized",
        aiSubcategory: aiSubcategory || null,
        aiConfidence: typeof aiConfidence === "number" ? aiConfidence : 0.0,
        aiTags: parsedTags,
        aiLastUpdatedAt: new Date(),
      },
    });

    await prisma.aICategoryLog.create({
      data: {
        productId: Number(productId),
        resultJson: result,
        confidence: aiConfidence || 0.0,
        chosenSlug: aiCategory || "Uncategorized",
      },
    });

    console.log(`✅ AI Categorization complete for product #${productId}`);
  } else if (type === "import" && importItemId) {
    await prisma.importItem.update({
      where: { id: Number(importItemId) },
      data: {
        parsedName: aiCategory || "Uncategorized",
        status: "processed",
        updatedAt: new Date(),
      },
    });

    await prisma.aICategoryLog.create({
      data: {
        importItemId: Number(importItemId),
        resultJson: result,
        confidence: aiConfidence || 0.0,
        chosenSlug: aiCategory || "Uncategorized",
      },
    });

    console.log(`✅ AI Categorization complete for import item #${importItemId}`);
  }

  return { ok: true, type, id: item.id, result };
}

// ----------------------------------------------------------
// 🏃‍♂️ Start Worker
// ----------------------------------------------------------
const worker = new Worker(
  process.env.QUEUE_AI_CATEGORIZATION || "ai_categorization",
  handleCategorization,
  { connection: { url: redisUrl } }
);

worker.on("ready", () =>
  console.log(`✅ AI Categorization Worker connected to Redis: ${redisUrl}`)
);
worker.on("completed", (job) =>
  console.log(`🎉 Job ${job.id} completed successfully`)
);
worker.on("failed", (job, err) =>
  console.error(`❌ Job ${job?.id} failed: ${err.message}`)
);

console.log(`🚀 STORESGO AI Categorization Worker (Phase 14B/14C) running...`);
