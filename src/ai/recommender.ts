/* eslint-disable */
// ==========================================================
// 💡 STORESGO AI RECOMMENDER — PHASE 15C
// "You may also like" engine using pgvector + OpenAI embeddings
// PostgreSQL • Prisma • OpenAI • ESM-Safe
// ==========================================================

import { PrismaClient } from "@prisma/client";
import { embed } from "./embeddings.ts";

const prisma = new PrismaClient();

// ----------------------------------------------------------
// 🎯 getSimilarProducts — Hybrid Recommendation
// ----------------------------------------------------------
//
// Combines 3 signals:
//  1️⃣ Vector similarity (pgvector)
//  2️⃣ Same category relevance
//  3️⃣ Keyword overlap in names
//
// Automatically excludes the current product.
//
export async function getSimilarProducts(productId: number, limit = 8) {
  try {
    // Step 1 — Fetch product + category
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { category: true },
    });

    if (!product) {
      console.warn(`⚠️ Product ${productId} not found for recommendations.`);
      return [];
    }

    // Step 2 — Fetch vector from embeddings
    const embedding = await prisma.productEmbedding.findUnique({
      where: { productId },
      select: { vector: true },
    });

    let similar: any[] = [];

    if (embedding?.vector) {
      // ✅ Vector-based similarity (pgvector)
      similar = await prisma.$queryRawUnsafe<any[]>(`
        SELECT p.id, p.name, p.priceCents, p.image, c.name AS category, 
               1 - (pe.vector <=> cube(array[${embedding.vector.join(",")}])) AS similarity
        FROM "Product" p
        JOIN "ProductEmbedding" pe ON pe."productId" = p.id
        LEFT JOIN "Category" c ON c.id = p."categoryId"
        WHERE p.id != ${productId} AND p."isActive" = true
        ORDER BY similarity DESC
        LIMIT ${limit};
      `);
    }

    // Step 3 — Fallback keyword/category similarity if no embeddings
    if (similar.length === 0) {
      similar = await prisma.product.findMany({
        where: {
          isActive: true,
          id: { not: productId },
          OR: [
            { name: { contains: product.name.split(" ")[0], mode: "insensitive" } },
            { categoryId: product.categoryId ?? undefined },
          ],
        },
        take: limit,
        select: { id: true, name: true, priceCents: true, image: true },
      });
    }

    console.log(`💡 Found ${similar.length} related items for product #${productId}`);
    return similar;
  } catch (err: any) {
    console.error("❌ getSimilarProducts() failed:", err.message);
    return [];
  }
}

// ----------------------------------------------------------
// 🧠 generateOnTheFlyRecommendations
// ----------------------------------------------------------
//
// For new / unembedded products — generate embedding first,
// then find the most semantically similar active listings.
//
export async function generateOnTheFlyRecommendations(
  productName: string,
  productDescription: string,
  limit = 6
) {
  try {
    const text = `${productName} ${productDescription}`.trim();
    const vector = await embed(text);

    const results = await prisma.$queryRawUnsafe<any[]>(`
      SELECT p.id, p.name, p.priceCents, p.image,
             1 - (pe.vector <=> cube(array[${vector.join(",")}])) AS similarity
      FROM "Product" p
      JOIN "ProductEmbedding" pe ON pe."productId" = p.id
      WHERE p."isActive" = true
      ORDER BY similarity DESC
      LIMIT ${limit};
    `);

    return results;
  } catch (err: any) {
    console.error("❌ generateOnTheFlyRecommendations() failed:", err.message);
    return [];
  }
}
