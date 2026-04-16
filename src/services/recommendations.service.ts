// ============================================================
// Phase 18 Tier A — Recommendations service
// Added 2026-04-10 — audit: docs/phase18a-recommendations-audit.md
//
// Net-new service file. Existing src/services/products.service.ts
// functions (getRecommendedProducts, getRelatedProducts) and the
// stub src/routes/recommendations.ts route are intentionally
// UNTOUCHED per CLAUDE.md additive rule and audit B1.
//
// Strategy (audit B4): layered content-based scoring.
//   - Taxonomy match via Product.categoryId
//   - aiTag overlap via Product.aiTags (78.6% populated in prod)
//   - Price proximity (within ±50% of source price)
//   - Rating bonus (optional; no persistent rating column, so v1
//     leaves this at 0 and relies on the other three signals)
// Semantic similarity over Product.embedding is DEFERRED because
// product_embeddings has 0/78838 populated rows in prod.
// Collaborative filtering is a WEAK signal (only 358 orders total)
// so recommendFromHistoryForAgent falls back to category-frequency
// matching with an honest caveat.
//
// The recipe-driven primary path for findComplementaryProducts
// dynamically imports src/data/recipes-data.ts and resolves
// free-text ingredient strings to products via the Meilisearch
// wrapper aiSmartSearch (same pattern as Phase 1's
// search_products_meili tool).
//
// PROHIBITED-CATEGORY TECH DEBT (Phase 19.5):
// The alcohol filter below is a CONSERVATIVE regex safeguard that
// errs strongly on the side of not blocking legitimate products.
// Catalog sampling showed a loose regex produced ~95% false
// positives (ginger ale, cooking wine, rum extract, bourbon
// seasoning, non-alcoholic beverages). The narrow filter here
// catches only high-confidence matches and is NOT a production
// compliance system. A proper sitewide LLM-based prohibited-
// category classifier is scoped as Phase 19.5 and will add:
//   (a) product_category_classifications table
//   (b) LLM batch classifier for all active products
//   (c) isProductAllowed() service as single source of truth
//   (d) incremental classification on product create/update
//   (e) enforcement at every customer-facing surface
// Phase 18's regex filter becomes a fallback layer once Phase 19.5
// ships.
// ============================================================

import { prisma } from "../lib/prisma.js";

// =============================================================================
// Types
// =============================================================================

export interface RecommendedProduct {
  id: number;
  name: string;
  slug: string;
  price: number;
  imageUrl: string | null;
  sellerId: number;
  rating: number | null;
  aiTags: string[];
  categoryId: number | null;
  score: number;
  reasons: string[];
}

export interface RecommendationContext {
  userId?: string;
  limit?: number;
  excludeProductIds?: number[];
}

export interface RecipeMatch {
  recipeId: string;
  title: string;
  cuisine: string | null;
  matchedIngredients: string[];
  missingIngredients: string[];
  totalIngredients: number;
}

// =============================================================================
// Prohibited-category filter (alcohol, conservative)
// =============================================================================

// Note: "scotch" alone is too broad — Scotch Bonnet peppers are a
// Caribbean ingredient, not alcohol. The regex requires "scotch"
// followed by "whisky"/"whiskey" to match a real alcohol product.
const ALCOHOL_INCLUDE =
  /\b(vodka|whiskey|scotch\s+whisk(?:e)?y|tequila|cognac|brandy|absinthe|mezcal|liquor|liquor store|bourbon\s+(?:bottle|whiskey|spirit))\b/i;
const ALCOHOL_SOFT =
  /\b(beer|ale|wine|champagne|moscato|merlot|cabernet|chardonnay|prosecco|pinot\s+(?:noir|grigio|gris))\b/i;
const ALCOHOL_EXCLUDE =
  /\b(ginger\s*ale|ginger\s*beer|root\s*beer|non.?alcoholic|alcohol.?free|0\.0%|vinegar|vinaigrette|dressing|marinade|sauce|cooking\s*wine|seasoning|flavor|extract|bbq|pretzel|sea\s*salt|mix(?:er)?|cherries|cooked|pulled\s*pork|raisin)\b/i;
const NON_ALCOHOLIC_NAME = /\b(non.?alcoholic|alcohol.?free|0\.0%)\b/i;

/**
 * Conservative alcohol detection. Returns true only for
 * HIGH-CONFIDENCE alcohol products. Errs on the side of returning
 * false so legitimate products are never blocked. See the Phase
 * 19.5 tech debt note at the top of this file.
 */
export function isLikelyAlcohol(product: { name: string }): boolean {
  const name = product.name.toLowerCase();
  // Explicit non-alcoholic declarations always pass through
  if (NON_ALCOHOLIC_NAME.test(name)) return false;
  // High-confidence alcohol terms — block unless explicitly excluded
  if (ALCOHOL_INCLUDE.test(name)) {
    return !ALCOHOL_EXCLUDE.test(name);
  }
  // Soft alcohol terms — only block if NO exclusion term is present
  if (ALCOHOL_SOFT.test(name)) {
    return !ALCOHOL_EXCLUDE.test(name);
  }
  return false;
}

function filterProhibited<T extends { name: string }>(products: T[]): T[] {
  return products.filter((p) => !isLikelyAlcohol(p));
}

// =============================================================================
// Internal scoring helpers
// =============================================================================

function jaccardOverlap(a: string[], b: string[]): number {
  if (!a || !b || a.length === 0 || b.length === 0) return 0;
  const setA = new Set(a.map((t) => t.toLowerCase()));
  const setB = new Set(b.map((t) => t.toLowerCase()));
  let intersection = 0;
  for (const tag of setA) {
    if (setB.has(tag)) intersection++;
  }
  const unionSize = setA.size + setB.size - intersection;
  if (unionSize === 0) return 0;
  return intersection / unionSize;
}

function priceProximityScore(
  candidatePriceCents: number,
  sourcePriceCents: number,
): number {
  if (sourcePriceCents <= 0) return 0;
  const diff = Math.abs(candidatePriceCents - sourcePriceCents);
  const ratio = diff / sourcePriceCents;
  return 1 - Math.min(1, ratio);
}

function buildRecommendedProduct(
  p: {
    id: number;
    name: string;
    slug: string | null;
    priceCents: number;
    imageUrl: string | null;
    sellerId: number;
    categoryId: number | null;
    aiTags: string[];
  },
  score: number,
  reasons: string[],
  rating: number | null = null,
): RecommendedProduct {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug ?? String(p.id),
    price: p.priceCents / 100,
    imageUrl: p.imageUrl,
    sellerId: p.sellerId,
    rating,
    aiTags: p.aiTags ?? [],
    categoryId: p.categoryId,
    score,
    reasons,
  };
}

// =============================================================================
// Function 1: getProductDetailsForAgent
// =============================================================================

/**
 * Fetch full details for a product by numeric ID. Wrapped by the
 * Phase 18 get_product_details agent tool. Returns null when the
 * product does not exist, is inactive, or matches the conservative
 * prohibited-category filter.
 *
 * See audit B7 tool #1.
 */
export async function getProductDetailsForAgent(
  productId: number,
): Promise<RecommendedProduct | null> {
  const p = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      name: true,
      slug: true,
      priceCents: true,
      imageUrl: true,
      sellerId: true,
      categoryId: true,
      aiTags: true,
      isActive: true,
    },
  });

  if (!p || !p.isActive) return null;
  if (isLikelyAlcohol({ name: p.name })) return null;

  return buildRecommendedProduct(p, 1.0, ["Direct lookup"]);
}

// =============================================================================
// Function 2: findSimilarProductsForAgent
// =============================================================================

/**
 * Find products similar to a source product via layered content-
 * based scoring: aiTag overlap (40%) + same category (30%) + price
 * proximity (20%) + rating bonus (10%, currently unused in v1 since
 * Product has no persistent rating column).
 *
 * Oversamples 50 candidates from Prisma, scores in-process, filters
 * prohibited categories, and returns the top ctx.limit ?? 10.
 *
 * See audit B4 primary strategy and B7 tool #2.
 */
export async function findSimilarProductsForAgent(
  productId: number,
  ctx?: RecommendationContext,
): Promise<RecommendedProduct[]> {
  const limit = Math.min(ctx?.limit ?? 10, 20);
  const excludeIds = new Set([productId, ...(ctx?.excludeProductIds ?? [])]);

  const source = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      name: true,
      aiTags: true,
      categoryId: true,
      priceCents: true,
      isActive: true,
    },
  });

  if (!source || !source.isActive) return [];
  if (isLikelyAlcohol({ name: source.name })) return [];

  const where: {
    isActive: boolean;
    id: { notIn: number[] };
    OR: Array<
      | { categoryId: number | null }
      | { aiTags: { hasSome: string[] } }
    >;
  } = {
    isActive: true,
    id: { notIn: Array.from(excludeIds) },
    OR: [],
  };

  if (source.categoryId !== null) {
    where.OR.push({ categoryId: source.categoryId });
  }
  if (source.aiTags && source.aiTags.length > 0) {
    where.OR.push({ aiTags: { hasSome: source.aiTags } });
  }

  // If neither category nor tags produce a filter, bail — no sensible
  // "similar" set can be computed.
  if (where.OR.length === 0) return [];

  const candidates = await prisma.product.findMany({
    where,
    select: {
      id: true,
      name: true,
      slug: true,
      priceCents: true,
      imageUrl: true,
      sellerId: true,
      categoryId: true,
      aiTags: true,
    },
    take: 50,
    orderBy: { createdAt: "desc" },
  });

  const scored = candidates.map((p) => {
    const tagOverlap = jaccardOverlap(source.aiTags, p.aiTags);
    const sameCategory = p.categoryId === source.categoryId ? 1 : 0;
    const priceScore = priceProximityScore(p.priceCents, source.priceCents);
    const ratingScore = 0; // v1: no persistent rating column

    const score =
      0.4 * tagOverlap +
      0.3 * sameCategory +
      0.2 * priceScore +
      0.1 * ratingScore;

    const reasons: string[] = [];
    if (sameCategory) reasons.push("Same category");
    if (tagOverlap > 0) {
      const shared = new Set(p.aiTags.map((t) => t.toLowerCase())).size;
      reasons.push(`Shares ${Math.max(1, Math.round(tagOverlap * shared))} tag${tagOverlap === 1 ? "" : "s"}`);
    }
    if (priceScore > 0.5) reasons.push("Similar price");

    return buildRecommendedProduct(p, score, reasons);
  });

  // Sort by score DESC, filter prohibited, take top N
  scored.sort((a, b) => b.score - a.score);
  const filtered = filterProhibited(scored);
  return filtered.slice(0, limit);
}

// =============================================================================
// Function 3: findComplementaryProductsForAgent
// =============================================================================

/**
 * Given a set of source products (typically a cart), find products
 * that complement them. Primary path is recipe-driven via the
 * static src/data/recipes-data.ts file — if any source product
 * name matches ingredients in a known recipe, the agent surfaces
 * the other ingredients from that recipe as products via
 * Meilisearch. Fallback path is taxonomy-based: query products in
 * the same categories as the source set, excluding the source set
 * itself.
 *
 * See audit B4 secondary strategy and B7 tool #3.
 */
export async function findComplementaryProductsForAgent(
  productIds: number[],
  ctx?: RecommendationContext,
): Promise<{
  products: RecommendedProduct[];
  matchedRecipes: RecipeMatch[];
}> {
  if (!productIds || productIds.length === 0) {
    return { products: [], matchedRecipes: [] };
  }
  const capped = productIds.slice(0, 10);
  const limit = Math.min(ctx?.limit ?? 8, 15);
  const excludeIds = new Set([...capped, ...(ctx?.excludeProductIds ?? [])]);

  const sources = await prisma.product.findMany({
    where: { id: { in: capped }, isActive: true },
    select: {
      id: true,
      name: true,
      slug: true,
      categoryId: true,
      aiTags: true,
      priceCents: true,
    },
  });

  const safeSources = sources.filter((s) => !isLikelyAlcohol({ name: s.name }));
  if (safeSources.length === 0) {
    return { products: [], matchedRecipes: [] };
  }

  // === PRIMARY PATH: recipe-driven ===
  const { getRecipesByIngredient } = await import("../data/recipes-data.js");

  // Collect candidate recipes across all source product names
  const recipeBySlug = new Map<
    string,
    {
      slug: string;
      name: string;
      cuisine: string;
      ingredients: string[];
      matchedFromSource: Set<string>;
    }
  >();

  for (const src of safeSources) {
    const hits = getRecipesByIngredient(src.name);
    for (const r of hits) {
      const existing = recipeBySlug.get(r.slug);
      if (existing) {
        existing.matchedFromSource.add(src.name.toLowerCase());
      } else {
        recipeBySlug.set(r.slug, {
          slug: r.slug,
          name: r.name,
          cuisine: r.cuisine,
          ingredients: r.ingredients,
          matchedFromSource: new Set([src.name.toLowerCase()]),
        });
      }
    }
  }

  // Rank recipes by number of source ingredients they matched
  const topRecipes = Array.from(recipeBySlug.values()).sort(
    (a, b) => b.matchedFromSource.size - a.matchedFromSource.size,
  );

  const matchedRecipes: RecipeMatch[] = [];
  const recipeProducts: RecommendedProduct[] = [];
  const seenProductIds = new Set<number>(excludeIds);

  if (topRecipes.length > 0) {
    const { aiSmartSearch } = await import("./aiSearch.service.js");

    // Collect distinct "missing ingredient" strings from the top recipes
    const missingIngredientQueue: string[] = [];
    for (const rec of topRecipes.slice(0, 3)) {
      const matched: string[] = [];
      const missing: string[] = [];
      for (const ing of rec.ingredients) {
        const ingLower = ing.toLowerCase();
        const alreadyInSource = Array.from(rec.matchedFromSource).some((s) =>
          ingLower.includes(s) || s.includes(ingLower),
        );
        if (alreadyInSource) {
          matched.push(ing);
        } else {
          missing.push(ing);
          if (!missingIngredientQueue.includes(ing)) {
            missingIngredientQueue.push(ing);
          }
        }
      }

      matchedRecipes.push({
        recipeId: rec.slug,
        title: rec.name,
        cuisine: rec.cuisine,
        matchedIngredients: matched,
        missingIngredients: missing,
        totalIngredients: rec.ingredients.length,
      });
    }

    // Resolve up to 3 missing ingredients to products via Meilisearch
    for (const ingredient of missingIngredientQueue.slice(0, 3)) {
      try {
        const searchResult = await aiSmartSearch({
          query: ingredient,
          page: 1,
          pageSize: 4,
        });
        for (const hit of searchResult.products ?? []) {
          if (seenProductIds.has(hit.id)) continue;
          if (isLikelyAlcohol({ name: hit.name })) continue;
          seenProductIds.add(hit.id);
          recipeProducts.push({
            id: hit.id,
            name: hit.name,
            slug: hit.slug ?? String(hit.id),
            price: (hit.priceCents ?? 0) / 100,
            imageUrl: hit.imageUrl ?? null,
            sellerId: hit.seller?.id ?? 0,
            rating: null,
            aiTags: [],
            categoryId: hit.category?.id ?? null,
            score: 0.85,
            reasons: [
              `Needed for ${matchedRecipes[0]?.title ?? "your recipe"} (ingredient: "${ingredient}")`,
            ],
          });
          if (recipeProducts.length >= limit) break;
        }
        if (recipeProducts.length >= limit) break;
      } catch (err) {
        // Meilisearch hiccup — continue to the next ingredient. The
        // outer tool timeout will catch a complete outage.
        console.error("[recommendations] aiSmartSearch failed:", err);
      }
    }
  }

  // === FALLBACK PATH: taxonomy ===
  if (recipeProducts.length < 3) {
    const sourceCategoryIds = Array.from(
      new Set(
        safeSources
          .map((s) => s.categoryId)
          .filter((id): id is number => id !== null),
      ),
    );

    if (sourceCategoryIds.length > 0) {
      const taxonomyCandidates = await prisma.product.findMany({
        where: {
          isActive: true,
          id: { notIn: Array.from(seenProductIds) },
          categoryId: { in: sourceCategoryIds },
        },
        select: {
          id: true,
          name: true,
          slug: true,
          priceCents: true,
          imageUrl: true,
          sellerId: true,
          categoryId: true,
          aiTags: true,
        },
        take: 30,
        orderBy: { createdAt: "desc" },
      });

      for (const p of taxonomyCandidates) {
        if (isLikelyAlcohol({ name: p.name })) continue;
        if (seenProductIds.has(p.id)) continue;
        seenProductIds.add(p.id);
        recipeProducts.push(
          buildRecommendedProduct(p, 0.5, ["Same category as your cart"]),
        );
        if (recipeProducts.length >= limit) break;
      }
    }
  }

  return {
    products: recipeProducts.slice(0, limit),
    matchedRecipes: matchedRecipes.slice(0, 3),
  };
}

// =============================================================================
// Function 4: findRecipesForProductsForAgent
// =============================================================================

/**
 * Given a set of products, return the top 5 recipes from the
 * static recipe library that use them as ingredients. Does NOT
 * return products — returns recipes only. The agent can chain to
 * findComplementaryProductsForAgent to get the missing-ingredient
 * products for any recipe the customer picks.
 *
 * See audit B7 tool #4.
 */
export async function findRecipesForProductsForAgent(
  productIds: number[],
): Promise<RecipeMatch[]> {
  if (!productIds || productIds.length === 0) return [];
  const capped = productIds.slice(0, 10);

  const sources = await prisma.product.findMany({
    where: { id: { in: capped }, isActive: true },
    select: { id: true, name: true },
  });

  const safeSources = sources.filter((s) => !isLikelyAlcohol({ name: s.name }));
  if (safeSources.length === 0) return [];

  const { getRecipesByIngredient } = await import("../data/recipes-data.js");

  const recipeBySlug = new Map<
    string,
    {
      slug: string;
      name: string;
      cuisine: string;
      ingredients: string[];
      matched: Set<string>;
    }
  >();

  for (const src of safeSources) {
    const hits = getRecipesByIngredient(src.name);
    const srcLower = src.name.toLowerCase();
    for (const r of hits) {
      const existing = recipeBySlug.get(r.slug);
      if (existing) {
        existing.matched.add(srcLower);
      } else {
        recipeBySlug.set(r.slug, {
          slug: r.slug,
          name: r.name,
          cuisine: r.cuisine,
          ingredients: r.ingredients,
          matched: new Set([srcLower]),
        });
      }
    }
  }

  const results: RecipeMatch[] = Array.from(recipeBySlug.values())
    .map((rec) => {
      const matched: string[] = [];
      const missing: string[] = [];
      for (const ing of rec.ingredients) {
        const ingLower = ing.toLowerCase();
        const hasMatch = Array.from(rec.matched).some(
          (s) => ingLower.includes(s) || s.includes(ingLower),
        );
        if (hasMatch) {
          matched.push(ing);
        } else {
          missing.push(ing);
        }
      }
      return {
        recipeId: rec.slug,
        title: rec.name,
        cuisine: rec.cuisine,
        matchedIngredients: matched,
        missingIngredients: missing,
        totalIngredients: rec.ingredients.length,
      };
    })
    .sort((a, b) => b.matchedIngredients.length - a.matchedIngredients.length)
    .slice(0, 5);

  return results;
}

// =============================================================================
// Function 5: recommendFromCartForAgent
// =============================================================================

/**
 * Cart-completion orchestration. Tries findComplementaryProducts
 * first (recipe-driven or taxonomy fallback). If the complementary
 * result has fewer than 3 products, augments with
 * findSimilarProducts for each cart item to reach the limit.
 * Deduplicates across all sources and reports which strategy
 * contributed so the agent can explain its reasoning.
 *
 * See audit B7 tool #5.
 */
export async function recommendFromCartForAgent(
  productIds: number[],
  ctx?: RecommendationContext,
): Promise<{
  products: RecommendedProduct[];
  strategy: "recipe" | "taxonomy" | "mixed";
}> {
  if (!productIds || productIds.length === 0) {
    return { products: [], strategy: "taxonomy" };
  }
  const limit = Math.min(ctx?.limit ?? 10, 15);
  const capped = productIds.slice(0, 30);

  const complementary = await findComplementaryProductsForAgent(capped, {
    ...ctx,
    limit,
  });

  const hadRecipeMatch = complementary.matchedRecipes.length > 0;

  if (complementary.products.length >= 3) {
    return {
      products: complementary.products.slice(0, limit),
      strategy: hadRecipeMatch ? "recipe" : "taxonomy",
    };
  }

  // Augment with similar products for each cart item
  const seen = new Set<number>([
    ...capped,
    ...complementary.products.map((p) => p.id),
    ...(ctx?.excludeProductIds ?? []),
  ]);
  const augmented: RecommendedProduct[] = [...complementary.products];

  for (const sourceId of capped) {
    if (augmented.length >= limit) break;
    const similar = await findSimilarProductsForAgent(sourceId, {
      ...ctx,
      excludeProductIds: Array.from(seen),
      limit: Math.max(3, limit - augmented.length),
    });
    for (const p of similar) {
      if (seen.has(p.id)) continue;
      seen.add(p.id);
      augmented.push(p);
      if (augmented.length >= limit) break;
    }
  }

  const strategy: "recipe" | "taxonomy" | "mixed" = hadRecipeMatch
    ? "mixed"
    : "taxonomy";

  return {
    products: augmented.slice(0, limit),
    strategy,
  };
}

// =============================================================================
// Function 6: recommendFromHistoryForAgent
// =============================================================================

/**
 * Personalized recommendations based on the authenticated customer's
 * own past orders. Ownership-scoped by userId at every query — no
 * order or product is read for any other user. Returns [] for
 * guests (userId not provided) as defense-in-depth; the agent tool
 * should already short-circuit at ctx.userId === undefined.
 *
 * Signal caveat: prod has 358 orders total, well below the 1000-
 * order threshold for strong collaborative filtering. This function
 * falls back to category-frequency matching rather than true
 * co-occurrence. Most users will have a thin order history and the
 * result set will lean heavily on the top categories the user has
 * purchased from.
 *
 * See audit B7 tool #6 and B12 risk #4 (privacy).
 */
export async function recommendFromHistoryForAgent(
  userId: string,
  ctx?: RecommendationContext,
): Promise<RecommendedProduct[]> {
  if (!userId) return [];
  const limit = Math.min(ctx?.limit ?? 10, 20);

  const orders = await prisma.order.findMany({
    where: {
      buyerId: userId,
      status: { in: ["delivered", "completed"] },
    },
    include: {
      orderItems: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              categoryId: true,
              isActive: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  if (orders.length === 0) return [];

  // Build a frequency map of categoryIds and a set of purchased product IDs
  const categoryFrequency = new Map<number, number>();
  const purchasedProductIds = new Set<number>();

  for (const order of orders) {
    for (const item of order.orderItems) {
      if (item.product) {
        purchasedProductIds.add(item.productId);
        if (item.product.categoryId !== null) {
          categoryFrequency.set(
            item.product.categoryId,
            (categoryFrequency.get(item.product.categoryId) ?? 0) + 1,
          );
        }
      }
    }
  }

  const topCategories = Array.from(categoryFrequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => id);

  if (topCategories.length === 0) return [];

  const excludeIds = Array.from(
    new Set([
      ...purchasedProductIds,
      ...(ctx?.excludeProductIds ?? []),
    ]),
  );

  const candidates = await prisma.product.findMany({
    where: {
      isActive: true,
      categoryId: { in: topCategories },
      id: { notIn: excludeIds },
    },
    select: {
      id: true,
      name: true,
      slug: true,
      priceCents: true,
      imageUrl: true,
      sellerId: true,
      categoryId: true,
      aiTags: true,
    },
    take: 50,
    orderBy: { createdAt: "desc" },
  });

  const totalPurchases = Array.from(categoryFrequency.values()).reduce(
    (a, b) => a + b,
    0,
  );

  const scored = candidates.map((p) => {
    const categoryWeight =
      p.categoryId !== null
        ? (categoryFrequency.get(p.categoryId) ?? 0) / Math.max(1, totalPurchases)
        : 0;
    // Taxonomy match weight + small novelty bonus for newer products
    const score = 0.7 * categoryWeight + 0.3;
    return buildRecommendedProduct(p, score, [
      "Based on your order history",
    ]);
  });

  scored.sort((a, b) => b.score - a.score);
  const filtered = filterProhibited(scored);
  return filtered.slice(0, limit);
}
