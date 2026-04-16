// ---------------------------------------------------------
// 🧠 AI SEO Worker — BullMQ + Prisma + OpenAI
// Phase 9.7 — Unified with Queues.ts (colon-safe)
// ---------------------------------------------------------

import { Worker, Queue } from "bullmq";
import Redis from "ioredis";
import { PrismaClient, SeoEntityType } from "@prisma/client";
import OpenAI from "openai";

// 🔧 Redis connection (TLS/Upstash safe)
const connection = new Redis(process.env.REDIS_URL || "redis://127.0.0.1:6379", {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  tls: process.env.REDIS_URL?.startsWith("rediss://") ? {} : undefined,
});

// ✅ Colon-safe queue name
export const seoQueue = new Queue("seo_tasks", {
  connection,
  defaultJobOptions: { removeOnComplete: true, attempts: 3 },
});

const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ---------------------------------------------------------
// 🧠 OpenAI Helper
// ---------------------------------------------------------
async function callOpenAI(system: string, user: string) {
  if (!process.env.OPENAI_API_KEY) return null;
  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature: 0.7,
  });
  return res.choices?.[0]?.message?.content || null;
}

function fallbackMeta(name: string, desc?: string) {
  return {
    metaTitle: `${name} | StoresGo`,
    metaDescription: desc?.slice(0, 155) || `Shop ${name} on StoresGo.`,
    metaKeywords: `${name}, ethnic grocery, StoresGo`,
    imageAlt: `${name} product photo`,
    seoScore: 60,
  };
}

// ---------------------------------------------------------
// 🛍️ Product Handler
// ---------------------------------------------------------
async function handleProduct(id: number) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: { seller: true },
  });
  if (!product) throw new Error("Product not found");

  const system = `Return concise JSON {metaTitle,metaDescription,metaKeywords,imageAlt,seoScore(0-100)} for product SEO.`;
  const user = `Product: ${product.name}. Description: ${product.description}. Seller: ${product.seller?.storeName ?? ""}.`;

  let meta;
  try {
    const ai = await callOpenAI(system, user);
    meta = ai ? JSON.parse(ai) : fallbackMeta(product.name, product.description ?? undefined);
  } catch {
    meta = fallbackMeta(product.name, product.description ?? undefined);
  }

  await prisma.product.update({
    where: { id },
    data: meta,
  });
}

// ---------------------------------------------------------
// 🏪 Seller Handler
// ---------------------------------------------------------
async function handleSeller(id: number) {
  const seller = await prisma.seller.findUnique({
    where: { id },
    include: { products: true },
  });
  if (!seller) throw new Error("Seller not found");

  const system = `Return concise JSON {metaTitle,metaDescription,metaKeywords,seoScore(0-100)} for seller SEO.`;
  const user = `Seller: ${seller.storeName ?? seller.name}. Description: ${seller.description}. Products: ${(seller.products ?? [])
    .map((p) => p.name)
    .join(", ")}.`;

  let meta;
  try {
    const ai = await callOpenAI(system, user);
    meta = ai ? JSON.parse(ai) : fallbackMeta(seller.name, seller.description ?? undefined);
  } catch {
    meta = fallbackMeta(seller.name, seller.description ?? undefined);
  }

  await prisma.seller.update({
    where: { id },
    data: meta,
  });
}

// ---------------------------------------------------------
// 🚀 Start Worker
// ---------------------------------------------------------
export function startSeoWorker() {
  const worker = new Worker(
    "seo_tasks", // ✅ same queue name as queues.ts
    async (job) => {
      const { entityType, entityId } = job.data as {
        entityType: SeoEntityType;
        entityId: number;
      };
      if (entityType === "product") await handleProduct(entityId);
      else if (entityType === "seller") await handleSeller(entityId);
    },
    { connection }
  );

  console.log("🧠 SEO Worker active — listening to seo_tasks queue");
  return worker;
}
