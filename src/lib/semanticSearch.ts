/* eslint-disable */
// ==========================================================
// 🤖 STORESGO BACKEND — AI Semantic Search Engine (Phase 14A)
// Combines:
//  - Meaning-based vector search (pgvector + embeddings)
//  - Fallback Prisma keyword match if pgvector not configured
// PostgreSQL • Prisma • OpenAI • ESM Safe
// ==========================================================

import { PrismaClient } from "@prisma/client";
import OpenAI from "openai";

const prisma = new PrismaClient();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// ==========================================================
// 🧠 performSemanticSearch()
// ----------------------------------------------------------
// Finds semantically similar products using OpenAI embeddings
// If pgvector not available, falls back to standard text search
// ==========================================================
export async function performSemanticSearch(query: string, limit = 20) {
  try {
    if (!query || query.trim().length < 2) {
      return { ok: false, error: "Empty search query" };
    }

    const cleanQuery = query.trim();

    // 🧩 Step 1 — Generate OpenAI embedding
    const embedding = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: cleanQuery,
    });
    const vector = embedding.data[0].embedding;

    // 🧠 Step 2 — Try pgvector similarity query
    try {
      const results = await prisma.$queryRawUnsafe<any[]>(`
        SELECT id, name, description, price_cents AS "priceCents",
               category_id AS "categoryId",
               1 - (embedding <=> cube(array[${vector.join(",")}])) AS similarity
        FROM "Product"
        ORDER BY similarity DESC
        LIMIT ${limit};
      `);

      return {
        ok: true,
        count: results.length,
        results,
        method: "pgvector",
      };
    } catch {
      // ⚙️ Step 3 — Fallback to basic text search if pgvector not configured
      const results = await prisma.product.findMany({
        where: {
          OR: [
            { name: { contains: cleanQuery, mode: "insensitive" } },
            { description: { contains: cleanQuery, mode: "insensitive" } },
          ],
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          description: true,
          priceCents: true,
          categoryId: true,
        },
        take: limit,
      });

      return {
        ok: true,
        count: results.length,
        results,
        method: "fallback",
      };
    }
  } catch (err: any) {
    console.error("❌ Semantic search failed:", err.message);
    return { ok: false, error: err.message };
  }
}
