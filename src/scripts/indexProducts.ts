/**
 * STORESGO MEILISEARCH PRODUCT INDEXER
 * Indexes all products for enterprise-grade search
 */

import { PrismaClient } from "@prisma/client";
import { MeiliSearch } from "meilisearch";

const prisma = new PrismaClient();

const meili = new MeiliSearch({
  host: "http://127.0.0.1:7700",
  apiKey: process.env.MEILI_MASTER_KEY || "ff6c780c6c9cfd9156cd7831e86a49b21cbde1ece9d55dc9b2fcb11ef8b63482",
});

async function configureIndex() {
  console.log("⚙️  Configuring Meilisearch index...");
  
  const index = meili.index("products");

  // Configure searchable attributes (order matters for relevance)
  await index.updateSearchableAttributes([
    "categoryName",
    "categorySlug",
    "tags",
    "name",
    "brand",
    "description",
    "seoKeywords",
  ]);

  // Configure filterable attributes
  await index.updateFilterableAttributes([
    "categoryId",
    "categorySlug",
    "sellerId",
    "priceCents",
    "isActive",
    "inStock",
    "isOrganic",
    "isVegan",
    "isGlutenFree",
    "isKosher",
    "isHalal",
    "categoryPriority",
  ]);

  // Configure sortable attributes
  await index.updateSortableAttributes([
    "priceCents",
    "name",
    "createdAt",
    "popularity",
    "categoryPriority",
  ]);

  // Configure ranking rules
  await index.updateRankingRules([
    "words",
    "typo",
    "proximity",
    "attribute",
    "exactness",
    "categoryPriority:desc",
    "sort",
  ]);

  // Configure typo tolerance
  await index.updateTypoTolerance({
    enabled: true,
    minWordSizeForTypos: {
      oneTypo: 4,
      twoTypos: 8,
    },
  });

  // Configure synonyms (multi-language support)
  await index.updateSynonyms({
    // Spanish
    "leche": ["milk"],
    "milk": ["leche", "lait", "lèt", "leite"],
    "queso": ["cheese"],
    "cheese": ["queso", "fromage", "queijo"],
    "pollo": ["chicken"],
    "chicken": ["pollo", "poulet", "poul", "frango"],
    "carne": ["meat", "beef"],
    "meat": ["carne", "viande", "vyann"],
    "arroz": ["rice"],
    "rice": ["arroz", "diri", "riz"],
    "pan": ["bread"],
    "bread": ["pan", "pain", "pen", "pao"],
    "huevos": ["eggs"],
    "eggs": ["huevos", "oeuf", "ze", "ovos"],
    "frijoles": ["beans"],
    "beans": ["frijoles", "pwa", "feijao", "haricots"],
    "pescado": ["fish"],
    "fish": ["pescado", "poisson", "pwason", "peixe"],
    "mantequilla": ["butter"],
    "butter": ["mantequilla", "beurre", "butr"],
    "azucar": ["sugar"],
    "sugar": ["azucar", "sucre", "sik"],
    "sal": ["salt"],
    "salt": ["sal", "sel"],
    "aceite": ["oil"],
    "oil": ["aceite", "huile", "lwil"],
    "agua": ["water"],
    "water": ["agua", "eau", "dlo"],
    "cafe": ["coffee"],
    "coffee": ["cafe", "café", "kafe"],
    "jugo": ["juice"],
    "juice": ["jugo", "jus", "ji"],
    "cerveza": ["beer"],
    "beer": ["cerveza", "bière", "byè"],
    "vino": ["wine"],
    "wine": ["vino", "vin", "diven"],
    "frutas": ["fruits", "fruit"],
    "fruit": ["frutas", "fruits", "fwi"],
    "verduras": ["vegetables"],
    "vegetables": ["verduras", "légumes", "legim"],
    "platano": ["plantain", "banana"],
    "plantain": ["platano", "bannann"],
    "yuca": ["cassava", "yucca"],
    "aguacate": ["avocado"],
    "avocado": ["aguacate", "zaboka"],
    "cebolla": ["onion"],
    "onion": ["cebolla", "oignon", "zonyon"],
    "ajo": ["garlic"],
    "garlic": ["ajo", "ail", "lay"],
    "tomate": ["tomato"],
    "tomato": ["tomate", "tomat"],
    // Common misspellings
    "yougurt": ["yogurt"],
    "yogart": ["yogurt"],
    "chese": ["cheese"],
    "milke": ["milk"],
    "cofee": ["coffee"],
    "chiken": ["chicken"],
    "beaf": ["beef"],
    // Product types
    "soda": ["soft drink", "cola", "pop"],
    "chips": ["crisps", "snacks"],
    "candy": ["sweets", "dulces"],
  });

  console.log("✅ Index configuration complete");
}

async function indexProducts() {
  console.log("📦 Starting product indexing...");

  // Get total count
  const totalCount = await prisma.product.count({ where: { isActive: true } });
  console.log(`Found ${totalCount} active products to index`);

  const batchSize = 1000;
  let indexed = 0;

  // Process in batches
  for (let skip = 0; skip < totalCount; skip += batchSize) {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      skip,
      take: batchSize,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        seller: { select: { id: true, storeName: true, slug: true } },
        categoryAssignments: { 
          where: { isPrimary: true },
          take: 1,
          include: { category: { select: { id: true, name: true, slug: true } } }
        },
      },
    });

    // Transform for Meilisearch
    const documents = products.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description || "",
      priceCents: p.priceCents,
      currency: p.currency,
      imageUrl: p.imageUrl,
      sku: p.sku,
      // Category
      categoryId: p.categoryId || p.categoryAssignments?.[0]?.categoryId || null,
      categoryName: p.category?.name || p.categoryAssignments?.[0]?.category?.name || "",
      categorySlug: p.category?.slug || p.categoryAssignments?.[0]?.category?.slug || "",
      // Seller
      sellerId: p.sellerId,
      sellerName: p.seller?.storeName || "",
      sellerSlug: p.seller?.slug || "",
      // AI-generated fields
      brand: p.aiBrand || "",
      tags: p.aiTags || [],
      seoKeywords: p.aiSeoKeywords || "",
      // Dietary flags (parse from tags if available)
      isOrganic: (p.aiTags || []).some((t: string) => t.toLowerCase().includes("organic")),
      isVegan: (p.aiTags || []).some((t: string) => t.toLowerCase().includes("vegan")),
      isGlutenFree: (p.aiTags || []).some((t: string) => t.toLowerCase().includes("gluten")),
      isKosher: (p.aiTags || []).some((t: string) => t.toLowerCase().includes("kosher")),
      isHalal: (p.aiTags || []).some((t: string) => t.toLowerCase().includes("halal")),
      // Unit data
      unitId: p.unitId,
      unitQuantity: p.unitQuantity ? Number(p.unitQuantity) : null,
      displayUnit: p.displayUnit,
      // Stock status
      inStock: true,
      stockQty: p.stockQty,
      // Category priority boost (food items rank higher than condiments/sauces)
      categoryPriority: (() => {
        const slug = p.category?.slug || p.categoryAssignments?.[0]?.category?.slug || "";
        if (slug.startsWith("meat-seafood")) return 100;
        if (slug.startsWith("produce")) return 95;
        if (slug.startsWith("dairy")) return 90;
        if (slug.startsWith("deli")) return 85;
        if (slug.startsWith("frozen")) return 80;
        if (slug.startsWith("bakery")) return 75;
        if (slug.startsWith("beverages")) return 70;
        if (slug.startsWith("dry-goods")) return 72;
        if (slug.startsWith("snacks")) return 65;
        if (slug.startsWith("condiments")) return 30;  // Lower priority
        if (slug.startsWith("household")) return 20;
        return 50;  // Default
      })(),
      // Timestamps
      createdAt: p.createdAt.getTime(),
      // Popularity (can be updated based on sales/views)
      popularity: 0,
    }));

    // Index batch
    await meili.index("products").addDocuments(documents);
    indexed += documents.length;
    console.log(`Indexed ${indexed}/${totalCount} products`);
  }

  console.log("✅ Product indexing complete!");
}

async function main() {
  try {
    // Check Meilisearch health
    const health = await meili.health();
    console.log("Meilisearch status:", health.status);

    // Configure index
    await configureIndex();

    // Index all products
    await indexProducts();

    // Get index stats
    const stats = await meili.index("products").getStats();
    console.log("\n📊 Index Stats:");
    console.log(`   Documents: ${stats.numberOfDocuments}`);
    console.log(`   Indexing: ${stats.isIndexing}`);

  } catch (error) {
    console.error("❌ Indexing failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
