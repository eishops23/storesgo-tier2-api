/* eslint-disable */
// ==========================================================
// 🧠 StoresGo AI Categorizer — Phase 11C (Final Polished)
// PostgreSQL • Prisma • OpenAI (GPT-4o-mini)
// ==========================================================

import { PrismaClient } from "@prisma/client";
import OpenAI from "openai";
import crypto from "crypto";

const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

// ----------------------------------------------------------
// 🔹 Type Definition
// ----------------------------------------------------------
type CategorizeInput = {
  productId?: number;        // existing product
  importItemId?: number;     // import item
  name: string;
  description?: string | null;
};

// ----------------------------------------------------------
// 🔹 Categorize Product via GPT-4o-mini
// ----------------------------------------------------------
export async function categorizeProductAI(input: CategorizeInput) {
  const { name, description } = input;

  // Fetch available taxonomy categories
  const taxonomies = await prisma.taxonomy.findMany({
    select: { slug: true, title: true },
    orderBy: { id: "asc" },
  });

  const options = taxonomies.map(t => `${t.slug} — ${t.title}`).join("\n");

  const systemPrompt = `
You are a product taxonomy classifier for a multicultural grocery marketplace.
Choose ONE valid slug from the provided list. If uncertain, choose the closest parent category.
Return JSON only in this format:
{
  "slug": "<one-of-these-slugs>",
  "confidence": 0.0-1.0
}`;

  const userPrompt = `
Product name: ${name}
Description: ${description ?? "N/A"}

Valid slugs (choose one):
${options}
`;

  try {
    const res = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
    });

    const text = res.choices[0]?.message?.content?.trim() || "{}";

    let parsed: { slug?: string; confidence?: number } = {};
    try { parsed = JSON.parse(text); } catch {
      console.warn("⚠️ Failed to parse AI response:", text);
    }

    const chosenSlug = parsed.slug?.trim() || null;
    const confidence = isFinite(parsed.confidence ?? 0)
      ? Math.max(0, Math.min(1, Number(parsed.confidence)))
      : 0;

    // Validate category exists
    const match = chosenSlug
      ? await prisma.taxonomy.findUnique({ where: { slug: chosenSlug } })
      : null;

    const finalSlug = match?.slug || null;

    return {
      chosenSlug: finalSlug,
      confidence,
      promptHash: crypto.createHash("md5").update(name + (description ?? "")).digest("hex"),
      modelRaw: text,
    };
  } catch (err: any) {
    console.error("❌ categorizeProductAI error:", err.message);
    return {
      chosenSlug: null,
      confidence: 0,
      promptHash: crypto.randomBytes(8).toString("hex"),
      modelRaw: JSON.stringify({ error: err.message }),
    };
  }
}

// ----------------------------------------------------------
// 🔹 Persist AI Category Log
// ----------------------------------------------------------
export async function persistAICategoryLog(payload: {
  productId?: number;
  importItemId?: number;
  chosenSlug: string | null;
  confidence: number;
  modelRaw: string;
}) {
  const { productId, importItemId, chosenSlug, confidence, modelRaw } = payload;

  try {
    await prisma.aICategoryLog.create({
      data: {
        productId: productId ?? null,
        importItemId: importItemId ?? null,
        chosenSlug: chosenSlug ?? undefined,
        confidence,
        promptHash: crypto.randomBytes(6).toString("hex"),
        resultJson: modelRaw as unknown as any, // JSON column
      },
    });
  } catch (err: any) {
    console.error("❌ Failed to persist AI log:", err.message);
  }
}

// ----------------------------------------------------------
// 🔹 Assign Product Category
// ----------------------------------------------------------
export async function assignProductCategory(productId: number, slug: string) {
  const taxonomy = await prisma.taxonomy.findUnique({ where: { slug } });
  if (!taxonomy) {
    console.warn(`⚠️ Taxonomy slug '${slug}' not found. Skipping assignment.`);
    return;
  }

  await prisma.product.update({
    where: { id: productId },
    data: { categoryId: taxonomy.id, status: "approved" },
  });

  console.log(`🏷 Assigned category '${slug}' to product ${productId}`);
}
