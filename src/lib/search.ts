/* eslint-disable */
// ======================================================
// 🔍 STORESGO BACKEND — Unified Search Utility (Phase 14A)
// Combines:
//  - Standard product search (Phase 11B+)
//  - Multilingual AI search (Phase 12 Prototype)
// PostgreSQL • Prisma • ESM Safe
// ======================================================

// Import shared prisma singleton
import { prisma } from "./prisma.js";

// ======================================================
// 🔎 Standard Product Search
// Supports partial name/description/category matching
// ======================================================
export async function runProductSearch(query: string) {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const q = query.trim().toLowerCase();

  try {
    const results = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
          {
            category: {
              name: { contains: q, mode: "insensitive" },
            },
          },
        ],
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        sellerId: true,
        priceCents: true,
        currency: true,
        description: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 25,
    });

    return { ok: true, count: results.length, results };
  } catch (err: any) {
    console.error("❌ Product search failed:", err.message);
    return { ok: false, error: err.message };
  }
}

// ======================================================
// 🔎 Multilingual AI Search (Phase 12 Prototype)
// Supports: English, Spanish, Haitian Creole
// ======================================================
export async function performMultilingualSearch(query: string, lang: string) {
  const titleField = `title_${lang}`;        // e.g. title_en / title_es / title_ht
  const descField  = `description_${lang}`;  // e.g. description_en / description_es / description_ht

  try {
    const results = await prisma.product.findMany({
      where: {
        OR: [
          { [titleField]: { contains: query, mode: "insensitive" } },
          { [descField]: { contains: query, mode: "insensitive" } },
        ],
        isActive: true,
      },
      select: {
        id: true,
        sellerId: true,
        name: true,
        priceCents: true,
        currency: true,
        [titleField]: true,
        [descField]: true,
      },
      take: 25,
    });

    return { ok: true, count: results.length, results };
  } catch (err: any) {
    console.error("❌ Multilingual search failed:", err.message);
    return { ok: false, error: err.message };
  }
}

// ------------------------------------------------------
// 🧩 Helper Export (Optional Default)
// ------------------------------------------------------
export default {
  runProductSearch,
  performMultilingualSearch,
};
