// ============================================================
// Phase 9 — Embeddings utility
// Added 2026-04-10 for the SEO Agent's similarity tools.
//
// The blog_posts.embedding column is `Float[]` (Postgres float[]),
// NOT a pgvector `vector` column. That means the pgvector `<=>`
// cosine operator does NOT work directly against this column even
// if the extension is installed — it would need a column-type
// migration first. So the working primary path here is JS-based
// cosine similarity over the Float[] arrays returned by Prisma.
//
// `hasPgvector()` exists for future-proofing: when (if ever) the
// schema migrates to a real `vector` column type, callers can
// detect support and switch to the optimized SQL path. Until
// then it always returns false in production and the in-process
// cosine path is the only mode used.
// ============================================================

import { prisma } from "../plugins/prisma.js";

let _pgvectorCache: boolean | null = null;

/**
 * Detects whether the `vector` Postgres extension is installed.
 * Result is cached for the lifetime of the process. Always returns
 * false on any error (e.g. permissions, missing pg_extension table).
 */
export async function hasPgvector(): Promise<boolean> {
  if (_pgvectorCache !== null) return _pgvectorCache;
  try {
    const result = await prisma.$queryRawUnsafe<{ exists: boolean }[]>(
      `SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') as exists;`
    );
    _pgvectorCache = result[0]?.exists ?? false;
  } catch {
    _pgvectorCache = false;
  }
  return _pgvectorCache;
}

/** Test-only: clear the pgvector cache so unit tests can re-mock the call. */
export function _resetPgvectorCache(): void {
  _pgvectorCache = null;
}

/**
 * Cosine similarity between two embedding vectors. Returns a value
 * in [-1, 1] where 1 is identical, 0 is orthogonal, -1 is opposite.
 *
 * Defensive: returns 0 for any of the following degenerate cases:
 *   - Either vector is null/undefined/empty
 *   - Vectors have different dimensions
 *   - Either vector has zero magnitude
 *
 * Returning 0 (rather than throwing) keeps the calling agent tools
 * safe in the face of legacy rows that have NULL or empty embeddings.
 */
export function cosineSimilarity(
  a: number[] | null | undefined,
  b: number[] | null | undefined,
): number {
  if (!a || !b) return 0;
  if (a.length === 0 || b.length === 0) return 0;
  if (a.length !== b.length) return 0;

  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }

  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

/**
 * Strip a Postgres `Float[]` returned by Prisma into a plain
 * `number[]` that the cosineSimilarity helper can consume. Returns
 * null for any input that does not look like a populated array.
 */
export function normalizeEmbedding(value: unknown): number[] | null {
  if (!Array.isArray(value)) return null;
  if (value.length === 0) return null;
  // Some Prisma drivers return Decimal-like objects; coerce to number.
  const out: number[] = [];
  for (const v of value) {
    const n = typeof v === "number" ? v : Number(v);
    if (!Number.isFinite(n)) return null;
    out.push(n);
  }
  return out;
}
