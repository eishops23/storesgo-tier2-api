// Phase 18 Tier A — recommendations.service.ts unit tests
// Mirrors the Phase 11 reviews.service.test.ts pattern. Mocks
// prisma, the static recipes-data module, and the Meilisearch
// wrapper aiSmartSearch.

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../lib/prisma.js", () => {
  const mockPrisma = {
    product: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    order: {
      findMany: vi.fn(),
    },
  };
  return { prisma: mockPrisma };
});

vi.mock("../../data/recipes-data.js", () => ({
  getRecipesByIngredient: vi.fn(),
}));

vi.mock("../aiSearch.service.js", () => ({
  aiSmartSearch: vi.fn(),
}));

import {
  isLikelyAlcohol,
  getProductDetailsForAgent,
  findSimilarProductsForAgent,
  findComplementaryProductsForAgent,
  findRecipesForProductsForAgent,
  recommendFromCartForAgent,
  recommendFromHistoryForAgent,
} from "../recommendations.service.js";
import { prisma } from "../../lib/prisma.js";
import { getRecipesByIngredient } from "../../data/recipes-data.js";
import { aiSmartSearch } from "../aiSearch.service.js";

const mockPrisma = vi.mocked(prisma);
const mockGetRecipesByIngredient = vi.mocked(getRecipesByIngredient);
const mockAiSmartSearch = vi.mocked(aiSmartSearch);

beforeEach(() => {
  vi.clearAllMocks();
});

// =============================================================================
// isLikelyAlcohol
// =============================================================================

describe("isLikelyAlcohol", () => {
  it("returns false for Canada Dry Ginger Ale", () => {
    expect(isLikelyAlcohol({ name: "Canada Dry Ginger Ale" })).toBe(false);
  });

  it("returns false for Bundaberg Ginger Beer", () => {
    expect(isLikelyAlcohol({ name: "Bundaberg Ginger Beer" })).toBe(false);
  });

  it("returns false for McCormick Rum Extract", () => {
    // "rum" is not in the narrow filter at all, so it passes
    expect(isLikelyAlcohol({ name: "McCormick Rum Extract" })).toBe(false);
  });

  it("returns false for Goya Cooking Wine", () => {
    expect(isLikelyAlcohol({ name: "Goya Cooking Wine" })).toBe(false);
  });

  it("returns false for Non-Alcoholic Beer", () => {
    expect(isLikelyAlcohol({ name: "Heineken Non-Alcoholic Beer" })).toBe(false);
  });

  it("returns false for Bourbon BBQ Seasoning", () => {
    expect(isLikelyAlcohol({ name: "McCormick Bourbon BBQ Seasoning" })).toBe(false);
  });

  it("returns false for Champagne Vinaigrette", () => {
    expect(isLikelyAlcohol({ name: "Girard Champagne Vinaigrette Dressing" })).toBe(false);
  });

  it("returns false for Root Beer", () => {
    expect(isLikelyAlcohol({ name: "A&W Root Beer" })).toBe(false);
  });

  it("returns false for Wine Vinegar", () => {
    expect(isLikelyAlcohol({ name: "Heinz Red Wine Vinegar" })).toBe(false);
  });

  it("returns true for Absolut Vodka 750ml", () => {
    expect(isLikelyAlcohol({ name: "Absolut Vodka 750ml" })).toBe(true);
  });

  it("returns true for Jack Daniels Tennessee Whiskey", () => {
    expect(isLikelyAlcohol({ name: "Jack Daniels Tennessee Whiskey" })).toBe(true);
  });

  it("returns true for Heineken Lager Beer 12 Pack", () => {
    expect(isLikelyAlcohol({ name: "Heineken Lager Beer 12 Pack" })).toBe(true);
  });

  it("returns true for Moet Champagne", () => {
    expect(isLikelyAlcohol({ name: "Moet Imperial Champagne 750ml" })).toBe(true);
  });

  it("returns false for Fruit Cocktail", () => {
    // "cocktail" is not in the regex at all — pure safe passthrough
    expect(isLikelyAlcohol({ name: "Del Monte Fruit Cocktail" })).toBe(false);
  });
});

// =============================================================================
// getProductDetailsForAgent
// =============================================================================

describe("getProductDetailsForAgent", () => {
  it("returns details for a valid active product", async () => {
    mockPrisma.product.findUnique.mockResolvedValue({
      id: 1,
      name: "Scotch Bonnet Pepper",
      slug: "scotch-bonnet-pepper",
      priceCents: 299,
      imageUrl: "img.jpg",
      sellerId: 5,
      categoryId: 10,
      aiTags: ["caribbean", "spicy"],
      isActive: true,
    } as any);

    const result = await getProductDetailsForAgent(1);
    expect(result).not.toBeNull();
    expect(result!.id).toBe(1);
    expect(result!.price).toBe(2.99);
    expect(result!.score).toBe(1.0);
    expect(result!.reasons).toEqual(["Direct lookup"]);
  });

  it("returns null when product does not exist", async () => {
    mockPrisma.product.findUnique.mockResolvedValue(null);
    const result = await getProductDetailsForAgent(999);
    expect(result).toBeNull();
  });

  it("returns null when product is inactive", async () => {
    mockPrisma.product.findUnique.mockResolvedValue({
      id: 1,
      name: "Retired Product",
      slug: "x",
      priceCents: 100,
      imageUrl: null,
      sellerId: 5,
      categoryId: 10,
      aiTags: [],
      isActive: false,
    } as any);
    const result = await getProductDetailsForAgent(1);
    expect(result).toBeNull();
  });

  it("returns null when product is likely alcohol", async () => {
    mockPrisma.product.findUnique.mockResolvedValue({
      id: 1,
      name: "Absolut Vodka 750ml",
      slug: "absolut-vodka",
      priceCents: 2500,
      imageUrl: null,
      sellerId: 5,
      categoryId: 10,
      aiTags: [],
      isActive: true,
    } as any);
    const result = await getProductDetailsForAgent(1);
    expect(result).toBeNull();
  });
});

// =============================================================================
// findSimilarProductsForAgent
// =============================================================================

describe("findSimilarProductsForAgent", () => {
  const sourceProduct = {
    id: 1,
    name: "Scotch Bonnet Pepper",
    aiTags: ["caribbean", "spicy", "fresh"],
    categoryId: 10,
    priceCents: 300,
    isActive: true,
  };

  it("returns empty array for unknown source product", async () => {
    mockPrisma.product.findUnique.mockResolvedValue(null);
    const result = await findSimilarProductsForAgent(999);
    expect(result).toEqual([]);
  });

  it("returns empty array when source is alcohol", async () => {
    mockPrisma.product.findUnique.mockResolvedValue({
      ...sourceProduct,
      name: "Absolut Vodka 750ml",
    } as any);
    const result = await findSimilarProductsForAgent(1);
    expect(result).toEqual([]);
  });

  it("scores same-category products higher", async () => {
    mockPrisma.product.findUnique.mockResolvedValue(sourceProduct as any);
    mockPrisma.product.findMany.mockResolvedValue([
      {
        id: 2,
        name: "Habanero Pepper",
        slug: "habanero",
        priceCents: 320,
        imageUrl: null,
        sellerId: 5,
        categoryId: 10, // same category
        aiTags: ["caribbean", "spicy"],
      },
      {
        id: 3,
        name: "Black Beans",
        slug: "black-beans",
        priceCents: 200,
        imageUrl: null,
        sellerId: 5,
        categoryId: 99, // different category
        aiTags: ["caribbean"],
      },
    ] as any);

    const result = await findSimilarProductsForAgent(1);
    expect(result.length).toBe(2);
    expect(result[0].id).toBe(2); // same category should score higher
    expect(result[0].score).toBeGreaterThan(result[1].score);
    expect(result[0].reasons).toContain("Same category");
  });

  it("scores high-tag-overlap products higher", async () => {
    mockPrisma.product.findUnique.mockResolvedValue(sourceProduct as any);
    mockPrisma.product.findMany.mockResolvedValue([
      {
        id: 2,
        name: "Habanero Pepper",
        slug: "habanero",
        priceCents: 300,
        imageUrl: null,
        sellerId: 5,
        categoryId: 10,
        aiTags: ["caribbean", "spicy", "fresh"], // all 3 tags overlap
      },
      {
        id: 3,
        name: "Another Pepper",
        slug: "another",
        priceCents: 300,
        imageUrl: null,
        sellerId: 5,
        categoryId: 10,
        aiTags: ["different"], // no tag overlap
      },
    ] as any);

    const result = await findSimilarProductsForAgent(1);
    expect(result[0].id).toBe(2);
    expect(result[0].score).toBeGreaterThan(result[1].score);
  });

  it("filters alcohol from results", async () => {
    mockPrisma.product.findUnique.mockResolvedValue(sourceProduct as any);
    mockPrisma.product.findMany.mockResolvedValue([
      {
        id: 2,
        name: "Habanero Pepper",
        slug: "habanero",
        priceCents: 300,
        imageUrl: null,
        sellerId: 5,
        categoryId: 10,
        aiTags: ["caribbean"],
      },
      {
        id: 3,
        name: "Absolut Vodka 750ml", // alcohol — should be filtered
        slug: "absolut",
        priceCents: 2500,
        imageUrl: null,
        sellerId: 5,
        categoryId: 10,
        aiTags: ["caribbean"],
      },
    ] as any);

    const result = await findSimilarProductsForAgent(1);
    expect(result.find((p) => p.id === 3)).toBeUndefined();
    expect(result.length).toBe(1);
  });

  it("respects limit parameter", async () => {
    mockPrisma.product.findUnique.mockResolvedValue(sourceProduct as any);
    const manyProducts = Array.from({ length: 20 }, (_, i) => ({
      id: i + 2,
      name: `Product ${i}`,
      slug: `p-${i}`,
      priceCents: 300,
      imageUrl: null,
      sellerId: 5,
      categoryId: 10,
      aiTags: ["caribbean"],
    }));
    mockPrisma.product.findMany.mockResolvedValue(manyProducts as any);

    const result = await findSimilarProductsForAgent(1, { limit: 5 });
    expect(result.length).toBe(5);
  });

  it("excludes the source product and extra exclude list", async () => {
    mockPrisma.product.findUnique.mockResolvedValue(sourceProduct as any);
    mockPrisma.product.findMany.mockResolvedValue([]);

    await findSimilarProductsForAgent(1, { excludeProductIds: [42, 99] });
    const call = mockPrisma.product.findMany.mock.calls[0][0] as any;
    expect(call.where.id.notIn).toEqual(expect.arrayContaining([1, 42, 99]));
  });
});

// =============================================================================
// findComplementaryProductsForAgent
// =============================================================================

describe("findComplementaryProductsForAgent", () => {
  const porkProduct = {
    id: 1,
    name: "Pork Shoulder",
    slug: "pork-shoulder",
    categoryId: 20,
    aiTags: ["meat"],
    priceCents: 1500,
  };

  it("recipe path: returns matched recipes and missing-ingredient products", async () => {
    mockPrisma.product.findMany.mockResolvedValue([porkProduct] as any);
    mockGetRecipesByIngredient.mockReturnValue([
      {
        slug: "haitian-griot",
        name: "Haitian Griot",
        cuisine: "haitian",
        category: "meat",
        difficulty: "medium",
        prepTime: 30,
        cookTime: 120,
        servings: 4,
        description: "Classic Haitian fried pork",
        ingredients: ["pork shoulder", "scotch bonnet pepper", "sour orange", "epis"],
        instructions: [],
        tags: [],
      },
    ] as any);
    mockAiSmartSearch.mockResolvedValue({
      products: [
        {
          id: 50,
          name: "Scotch Bonnet Pepper",
          slug: "scotch-bonnet",
          priceCents: 299,
          currency: "USD",
          imageUrl: "sb.jpg",
          category: { id: 10, name: "Peppers", slug: "peppers" },
          seller: { id: 5, storeName: "X", slug: "x" },
        },
      ],
      total: 1,
      page: 1,
      pageSize: 4,
      filters: [],
    } as any);

    const result = await findComplementaryProductsForAgent([1]);
    expect(result.matchedRecipes.length).toBeGreaterThan(0);
    expect(result.matchedRecipes[0].title).toBe("Haitian Griot");
    expect(result.matchedRecipes[0].cuisine).toBe("haitian");
    expect(result.products.length).toBeGreaterThan(0);
    expect(result.products[0].reasons[0]).toContain("Griot");
  });

  it("fallback path: returns taxonomy matches when no recipes hit", async () => {
    mockPrisma.product.findMany.mockResolvedValueOnce([porkProduct] as any);
    mockGetRecipesByIngredient.mockReturnValue([]);
    // Taxonomy fallback query
    mockPrisma.product.findMany.mockResolvedValueOnce([
      {
        id: 100,
        name: "Beef Brisket",
        slug: "beef-brisket",
        priceCents: 2000,
        imageUrl: null,
        sellerId: 5,
        categoryId: 20,
        aiTags: ["meat"],
      },
    ] as any);

    const result = await findComplementaryProductsForAgent([1]);
    expect(result.matchedRecipes).toEqual([]);
    expect(result.products.length).toBe(1);
    expect(result.products[0].id).toBe(100);
    expect(result.products[0].reasons[0]).toContain("category");
  });

  it("filters alcohol from recipe path results", async () => {
    mockPrisma.product.findMany.mockResolvedValue([porkProduct] as any);
    mockGetRecipesByIngredient.mockReturnValue([
      {
        slug: "haitian-griot",
        name: "Haitian Griot",
        cuisine: "haitian",
        category: "meat",
        difficulty: "medium",
        prepTime: 30,
        cookTime: 120,
        servings: 4,
        description: "",
        ingredients: ["pork shoulder", "wine"],
        instructions: [],
        tags: [],
      },
    ] as any);
    mockAiSmartSearch.mockResolvedValue({
      products: [
        {
          id: 50,
          name: "Absolut Vodka 750ml", // should be filtered
          slug: "absolut",
          priceCents: 2500,
          currency: "USD",
          imageUrl: null,
          category: { id: 10, name: "X", slug: "x" },
          seller: { id: 5, storeName: "X", slug: "x" },
        },
        {
          id: 51,
          name: "Organic Epis",
          slug: "epis",
          priceCents: 500,
          currency: "USD",
          imageUrl: null,
          category: { id: 10, name: "X", slug: "x" },
          seller: { id: 5, storeName: "X", slug: "x" },
        },
      ],
      total: 2,
      page: 1,
      pageSize: 4,
      filters: [],
    } as any);

    // Second call (the fallback taxonomy query) should also be stubbed
    // because the recipe path will only return 1 safe product (epis)
    // and the orchestration may reach into the fallback.
    mockPrisma.product.findMany.mockResolvedValueOnce([porkProduct] as any);
    mockPrisma.product.findMany.mockResolvedValueOnce([]);

    const result = await findComplementaryProductsForAgent([1]);
    expect(result.products.find((p) => p.id === 50)).toBeUndefined();
  });

  it("filters alcohol from source set and returns empty when all sources are alcohol", async () => {
    mockPrisma.product.findMany.mockResolvedValue([
      { ...porkProduct, name: "Absolut Vodka 750ml" },
    ] as any);
    const result = await findComplementaryProductsForAgent([1]);
    expect(result.products).toEqual([]);
    expect(result.matchedRecipes).toEqual([]);
  });

  it("returns empty for empty productIds", async () => {
    const result = await findComplementaryProductsForAgent([]);
    expect(result.products).toEqual([]);
    expect(result.matchedRecipes).toEqual([]);
  });
});

// =============================================================================
// findRecipesForProductsForAgent
// =============================================================================

describe("findRecipesForProductsForAgent", () => {
  it("returns recipes matching ingredient substring", async () => {
    mockPrisma.product.findMany.mockResolvedValue([
      { id: 1, name: "Plantain" },
    ] as any);
    mockGetRecipesByIngredient.mockReturnValue([
      {
        slug: "mofongo",
        name: "Mofongo",
        cuisine: "puerto-rican",
        category: "meat",
        difficulty: "medium",
        prepTime: 20,
        cookTime: 30,
        servings: 4,
        description: "",
        ingredients: ["plantain", "garlic", "pork rinds"],
        instructions: [],
        tags: [],
      },
    ] as any);

    const result = await findRecipesForProductsForAgent([1]);
    expect(result.length).toBe(1);
    expect(result[0].title).toBe("Mofongo");
    expect(result[0].matchedIngredients.length).toBeGreaterThan(0);
  });

  it("deduplicates recipes when multiple source products match the same recipe", async () => {
    mockPrisma.product.findMany.mockResolvedValue([
      { id: 1, name: "Plantain" },
      { id: 2, name: "Garlic" },
    ] as any);
    mockGetRecipesByIngredient.mockReturnValue([
      {
        slug: "mofongo",
        name: "Mofongo",
        cuisine: "puerto-rican",
        category: "meat",
        difficulty: "medium",
        prepTime: 20,
        cookTime: 30,
        servings: 4,
        description: "",
        ingredients: ["plantain", "garlic", "pork rinds"],
        instructions: [],
        tags: [],
      },
    ] as any);

    const result = await findRecipesForProductsForAgent([1, 2]);
    expect(result.length).toBe(1);
    expect(result[0].matchedIngredients.length).toBeGreaterThanOrEqual(2);
  });

  it("sorts by matched ingredient count descending", async () => {
    mockPrisma.product.findMany.mockResolvedValue([
      { id: 1, name: "Plantain" },
    ] as any);
    mockGetRecipesByIngredient.mockReturnValueOnce([
      {
        slug: "mofongo",
        name: "Mofongo",
        cuisine: "pr",
        category: "m",
        difficulty: "medium",
        prepTime: 0,
        cookTime: 0,
        servings: 1,
        description: "",
        ingredients: ["plantain", "garlic"],
        instructions: [],
        tags: [],
      },
      {
        slug: "tostones",
        name: "Tostones",
        cuisine: "pr",
        category: "m",
        difficulty: "easy",
        prepTime: 0,
        cookTime: 0,
        servings: 1,
        description: "",
        ingredients: ["plantain"],
        instructions: [],
        tags: [],
      },
    ] as any);

    const result = await findRecipesForProductsForAgent([1]);
    expect(result[0].matchedIngredients.length).toBeGreaterThanOrEqual(
      result[1].matchedIngredients.length,
    );
  });

  it("limits to 5 recipes", async () => {
    mockPrisma.product.findMany.mockResolvedValue([
      { id: 1, name: "Plantain" },
    ] as any);
    const manyRecipes = Array.from({ length: 10 }, (_, i) => ({
      slug: `recipe-${i}`,
      name: `Recipe ${i}`,
      cuisine: "test",
      category: "m",
      difficulty: "easy",
      prepTime: 0,
      cookTime: 0,
      servings: 1,
      description: "",
      ingredients: ["plantain"],
      instructions: [],
      tags: [],
    }));
    mockGetRecipesByIngredient.mockReturnValue(manyRecipes as any);

    const result = await findRecipesForProductsForAgent([1]);
    expect(result.length).toBe(5);
  });

  it("returns empty for empty productIds", async () => {
    const result = await findRecipesForProductsForAgent([]);
    expect(result).toEqual([]);
  });
});

// =============================================================================
// recommendFromCartForAgent
// =============================================================================

describe("recommendFromCartForAgent", () => {
  const porkProduct = {
    id: 1,
    name: "Pork Shoulder",
    slug: "pork-shoulder",
    categoryId: 20,
    aiTags: ["meat"],
    priceCents: 1500,
  };

  it("strategy 'recipe' when complementary returns >= 3 products via recipes", async () => {
    mockPrisma.product.findMany.mockResolvedValue([porkProduct] as any);
    mockGetRecipesByIngredient.mockReturnValue([
      {
        slug: "griot",
        name: "Griot",
        cuisine: "haitian",
        category: "meat",
        difficulty: "medium",
        prepTime: 0,
        cookTime: 0,
        servings: 4,
        description: "",
        ingredients: ["pork shoulder", "epis", "sour orange", "scotch bonnet"],
        instructions: [],
        tags: [],
      },
    ] as any);
    mockAiSmartSearch.mockResolvedValue({
      products: [
        { id: 10, name: "Epis", slug: "epis", priceCents: 500, currency: "USD", imageUrl: null, category: null, seller: { id: 1, storeName: "x", slug: "x" } },
        { id: 11, name: "Sour Orange", slug: "so", priceCents: 300, currency: "USD", imageUrl: null, category: null, seller: { id: 1, storeName: "x", slug: "x" } },
        { id: 12, name: "Scotch Bonnet", slug: "sb", priceCents: 299, currency: "USD", imageUrl: null, category: null, seller: { id: 1, storeName: "x", slug: "x" } },
      ],
      total: 3, page: 1, pageSize: 4, filters: [],
    } as any);

    const result = await recommendFromCartForAgent([1]);
    expect(result.products.length).toBeGreaterThanOrEqual(3);
    expect(result.strategy).toBe("recipe");
  });

  it("strategy 'taxonomy' when no recipe match and fallback kicks in", async () => {
    mockPrisma.product.findMany.mockResolvedValueOnce([porkProduct] as any);
    mockGetRecipesByIngredient.mockReturnValue([]);
    // Taxonomy fallback query
    mockPrisma.product.findMany.mockResolvedValueOnce([
      {
        id: 100,
        name: "Beef Brisket",
        slug: "brisket",
        priceCents: 2000,
        imageUrl: null,
        sellerId: 5,
        categoryId: 20,
        aiTags: ["meat"],
      },
      {
        id: 101,
        name: "Lamb Chops",
        slug: "lamb",
        priceCents: 2500,
        imageUrl: null,
        sellerId: 5,
        categoryId: 20,
        aiTags: ["meat"],
      },
      {
        id: 102,
        name: "Chicken Thighs",
        slug: "chicken",
        priceCents: 800,
        imageUrl: null,
        sellerId: 5,
        categoryId: 20,
        aiTags: ["meat"],
      },
    ] as any);

    const result = await recommendFromCartForAgent([1]);
    expect(result.strategy).toBe("taxonomy");
    expect(result.products.length).toBeGreaterThanOrEqual(3);
  });

  it("returns empty for empty productIds", async () => {
    const result = await recommendFromCartForAgent([]);
    expect(result.products).toEqual([]);
    expect(result.strategy).toBe("taxonomy");
  });
});

// =============================================================================
// recommendFromHistoryForAgent
// =============================================================================

describe("recommendFromHistoryForAgent", () => {
  it("returns empty for empty userId", async () => {
    const result = await recommendFromHistoryForAgent("");
    expect(result).toEqual([]);
  });

  it("returns empty for user with no orders", async () => {
    mockPrisma.order.findMany.mockResolvedValue([]);
    const result = await recommendFromHistoryForAgent("user-1");
    expect(result).toEqual([]);
  });

  it("excludes already-purchased products from results", async () => {
    mockPrisma.order.findMany.mockResolvedValue([
      {
        id: 1,
        orderItems: [
          { productId: 10, product: { id: 10, name: "Rice", categoryId: 30, isActive: true } },
          { productId: 11, product: { id: 11, name: "Beans", categoryId: 30, isActive: true } },
        ],
      },
    ] as any);
    mockPrisma.product.findMany.mockResolvedValue([
      {
        id: 20,
        name: "Sazon",
        slug: "sazon",
        priceCents: 300,
        imageUrl: null,
        sellerId: 5,
        categoryId: 30,
        aiTags: [],
      },
    ] as any);

    await recommendFromHistoryForAgent("user-1");
    const call = mockPrisma.product.findMany.mock.calls[0][0] as any;
    expect(call.where.id.notIn).toEqual(expect.arrayContaining([10, 11]));
  });

  it("filters alcohol from results", async () => {
    mockPrisma.order.findMany.mockResolvedValue([
      {
        id: 1,
        orderItems: [
          { productId: 10, product: { id: 10, name: "Rice", categoryId: 30, isActive: true } },
        ],
      },
    ] as any);
    mockPrisma.product.findMany.mockResolvedValue([
      {
        id: 20,
        name: "Absolut Vodka 750ml",
        slug: "absolut",
        priceCents: 2500,
        imageUrl: null,
        sellerId: 5,
        categoryId: 30,
        aiTags: [],
      },
      {
        id: 21,
        name: "Sazon Goya",
        slug: "sazon",
        priceCents: 300,
        imageUrl: null,
        sellerId: 5,
        categoryId: 30,
        aiTags: [],
      },
    ] as any);

    const result = await recommendFromHistoryForAgent("user-1");
    expect(result.find((p) => p.id === 20)).toBeUndefined();
    expect(result.find((p) => p.id === 21)).toBeDefined();
  });

  it("respects limit parameter", async () => {
    mockPrisma.order.findMany.mockResolvedValue([
      {
        id: 1,
        orderItems: [
          { productId: 10, product: { id: 10, name: "Rice", categoryId: 30, isActive: true } },
        ],
      },
    ] as any);
    const many = Array.from({ length: 15 }, (_, i) => ({
      id: 100 + i,
      name: `Product ${i}`,
      slug: `p-${i}`,
      priceCents: 300,
      imageUrl: null,
      sellerId: 5,
      categoryId: 30,
      aiTags: [],
    }));
    mockPrisma.product.findMany.mockResolvedValue(many as any);

    const result = await recommendFromHistoryForAgent("user-1", { limit: 5 });
    expect(result.length).toBe(5);
  });

  it("scopes order query to the caller's userId only (privacy)", async () => {
    mockPrisma.order.findMany.mockResolvedValue([]);
    await recommendFromHistoryForAgent("user-alice");
    const call = mockPrisma.order.findMany.mock.calls[0][0] as any;
    expect(call.where.buyerId).toBe("user-alice");
  });
});
