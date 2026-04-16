/* eslint-disable */
// ==========================================================
// 🔍 STORESGO AI SEO CORE ENGINE — PHASE 11D (Unified Final)
// PostgreSQL • Prisma • OpenAI • Cron • JSON-safe SEO Tasks
// ==========================================================

import { PrismaClient } from "@prisma/client";
import OpenAI from "openai";
import slugify from "slugify";

const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

// ----------------------------------------------------------
// 🧩 ENQUEUE SEO TASKS
// ----------------------------------------------------------
export async function enqueueSeoForProduct(productId: number) {
  try {
    return await prisma.seoTask.upsert({
      where: {
        entityType_entityId: {
          entityType: "product",
          entityId: productId,
        } as any,
      },
      update: {
        status: "pending",
        attempts: { increment: 1 },
        updatedAt: new Date(),
      },
      create: {
        entityType: "product",
        entityId: productId,
        status: "pending",
        priority: 5,
        createdAt: new Date(),
      },
    });
  } catch (err: any) {
    console.error(`❌ enqueueSeoForProduct(${productId}) failed:`, err.message);
  }
}

export async function enqueueSeoForSeller(sellerId: number) {
  try {
    const seller = await prisma.seller.findUnique({ where: { id: sellerId } });
    if (!seller) return console.warn(`⚠️ Seller ${sellerId} not found.`);

    await prisma.seoTask.upsert({
      where: {
        entityType_entityId: {
          entityType: "seller",
          entityId: sellerId,
        } as any,
      },
      update: { status: "pending", attempts: { increment: 1 } },
      create: {
        entityType: "seller",
        entityId: sellerId,
        status: "pending",
        priority: 6,
      },
    });

    console.log(`🧩 SEO Task enqueued for Seller ID ${sellerId}`);
  } catch (err: any) {
    console.error(`❌ enqueueSeoForSeller(${sellerId}) failed:`, err.message);
  }
}

// ----------------------------------------------------------
// 🧠 GENERATE SEO PAGE FOR A PRODUCT
// ----------------------------------------------------------
export async function generateSeoPageForProduct(productId: number) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { seller: true, category: true },
  });

  if (!product) {
    console.warn(`⚠️ Product ${productId} not found. Skipping SEO generation.`);
    return null;
  }

  const sys = `You are an SEO copywriter.
Given a product, write short metadata optimized for multicultural e-commerce.
Respond ONLY in valid JSON:
{
  "title": "...",
  "metaTitle": "...",
  "metaDescription": "...",
  "slug": "kebab-case"
}
metaDescription must be under 150 characters.`;

  const user = `
Product: ${product.name}
Seller: ${product.seller?.storeName || "Unknown Seller"}
Category: ${product.category?.name || "Uncategorized"}
Description: ${product.description || "N/A"}
`;

  try {
    const res = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL_LIGHT || "gpt-4o-mini",
      temperature: 0.4,
      messages: [
        { role: "system", content: sys },
        { role: "user", content: user },
      ],
    });

    const text = res.choices[0]?.message?.content?.trim() || "{}";
    let data: any = {};
    try {
      data = JSON.parse(text);
    } catch {
      console.warn("⚠️ Could not parse AI SEO JSON:", text);
    }

    const slug = slugify(data.slug || product.name || `p-${productId}`, {
      lower: true,
      strict: true,
    });
    const title = data.title?.trim() || product.name;
    const metaTitle = data.metaTitle?.trim() || title;
    const metaDescription =
      data.metaDescription?.trim()?.slice(0, 150) ||
      product.description?.slice(0, 150) ||
      title;

    const contentHtml = `<h1>${title}</h1><p>${metaDescription}</p>`;

    // Upsert SEO Page
    const page = await prisma.seoPage.upsert({
      where: { slug },
      update: {
        title,
        metaTitle,
        metaDescription,
        contentHtml,
        published: false,
        updatedAt: new Date(),
      },
      create: {
        slug,
        title,
        metaTitle,
        metaDescription,
        contentHtml,
        published: false,
        createdAt: new Date(),
      },
    });

    // Update SEO Task
    await prisma.seoTask.updateMany({
      where: { entityType: "product", entityId: productId },
      data: { status: "done", updatedAt: new Date() },
    });

    console.log(`✅ SEO Page generated for Product ${productId}: /${slug}`);
    return page;
  } catch (err: any) {
    console.error(`❌ generateSeoPageForProduct(${productId}) failed:`, err.message);
    await prisma.seoTask.updateMany({
      where: { entityType: "product", entityId: productId },
      data: { status: "error", lastError: err.message },
    });
    return null;
  }
}

// ----------------------------------------------------------
// 🧮 AI SEO ENRICHMENT ENGINE (Batch Mode)
// ----------------------------------------------------------
export async function enrichProductSEO(productId: number) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { category: true, seller: true },
  });
  if (!product) return;

  if (product.metaTitle && product.metaDescription && product.imageAlt) return;

  const prompt = `
You are an SEO expert. Improve the following product for ecommerce SEO.
Return JSON: metaTitle (<=60 chars), metaDescription (<=155 chars),
imageAlt (<=110 chars), keywords (<=8 comma-separated).

Product:
- Name: ${product.name}
- Category: ${product.category?.name}
- Seller: ${product.seller?.storeName}
- Description: ${product.description ?? "N/A"}
`;

  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL_LIGHT || "gpt-4o-mini",
    temperature: 0.3,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  let data: any = {};
  try {
    data = JSON.parse(raw);
  } catch {}

  await prisma.product.update({
    where: { id: productId },
    data: {
      metaTitle: data.metaTitle ?? product.name,
      metaDescription:
        data.metaDescription ?? product.description?.slice(0, 155),
      imageAlt: data.imageAlt ?? product.name,
      metaKeywords: data.keywords ?? "",
      seoScore: Math.min(
        100,
        (data.metaTitle ? 40 : 20) +
          (data.metaDescription ? 40 : 20) +
          (data.imageAlt ? 20 : 10)
      ),
    },
  });
}

export async function runAISEOBatch() {
  const batch = Number(process.env.AI_SEO_BATCH ?? 25);
  const items = await prisma.product.findMany({
    where: {
      OR: [
        { metaTitle: null },
        { metaDescription: null },
        { imageAlt: null },
      ],
      isActive: true,
    },
    select: { id: true },
    take: batch,
  });

  for (const it of items) {
    try {
      await enrichProductSEO(it.id);
      await generateSeoPageForProduct(it.id);
    } catch (err: any) {
      console.error("⚠️ SEO batch error:", err.message);
    }
  }
  console.log(`🧠 SEO batch completed — enriched ${items.length} products.`);
  return { enriched: items.length };
}
