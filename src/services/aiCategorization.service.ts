// ==========================================================
// STORESGO AI CATEGORIZATION SERVICE — MARKETPLACE-GRADE
// Uses AI to intelligently categorize products
// ==========================================================

import OpenAI from "openai";
import { prisma } from "../plugins/prisma.js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "" });
const AI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

export interface CategorizationResult {
  productId: number;
  suggestedCategory: string | null;
  confidence: "high" | "medium" | "low";
  reasoning: string;
  ethnicOrigin?: string;
  attributes?: Record<string, string>;
}

const CATEGORY_PROMPT = `You categorize grocery products for StoresGo marketplace.

CATEGORIES:
1. caribbean-foods - Jamaican, Trinidad, Caribbean cuisine. Grace, Walkerswood, jerk, plantain, ackee.
2. latin-foods - Mexican, Central/South American. Goya, tortillas, salsa, tamales, adobo.
3. asian-foods - Chinese, Japanese, Korean, Thai, Vietnamese. Soy sauce, ramen, curry, Kikkoman.
4. fragrances - ONLY perfumes, colognes, body sprays. NOT soaps or lotions.
5. snacks - Chips, cookies, candy, nuts, popcorn.
6. beverages - Drinks, water, juice, soda, coffee, tea, beer, wine.
7. baking-and-cooking - Flour, spices, canned goods, pasta, dairy, meat, produce.
8. household-essentials - Cleaning, paper goods, kitchen supplies.
9. personal-care - Shampoo, soap, lotion, deodorant, skincare.
10. health-and-wellness - Vitamins, medicine, first aid.
11. baby-products - Baby food, diapers, baby care.
12. pet-supplies - Pet food, treats, accessories.

RULES:
- Ethnic foods take priority if product clearly belongs
- "Unscented" products are NOT fragrances
- Return null if unsure

Respond JSON only: {"category":"slug or null","confidence":"high|medium|low","reasoning":"brief","ethnicOrigin":"country or null","attributes":{"dietary":"value","brand":"value"}}`;

export async function categorizeProduct(
  productId: number,
  name: string,
  description: string | null
): Promise<CategorizationResult> {
  try {
    const response = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: "system", content: CATEGORY_PROMPT },
        { role: "user", content: `Product: ${name}\nDescription: ${description || "N/A"}` }
      ],
      temperature: 0.2,
      max_tokens: 200,
    });

    const content = response.choices[0]?.message?.content || "{}";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

    return {
      productId,
      suggestedCategory: parsed.category || null,
      confidence: parsed.confidence || "low",
      reasoning: parsed.reasoning || "",
      ethnicOrigin: parsed.ethnicOrigin,
      attributes: parsed.attributes,
    };
  } catch (error: any) {
    return {
      productId,
      suggestedCategory: null,
      confidence: "low",
      reasoning: "Error: " + error.message,
    };
  }
}

export async function batchCategorizeProducts(limit: number = 50): Promise<{
  processed: number;
  categorized: number;
  errors: number;
}> {
  const results = { processed: 0, categorized: 0, errors: 0 };

  const products = await prisma.product.findMany({
    where: { categoryId: null, isActive: true },
    take: limit,
    select: { id: true, name: true, description: true },
  });

  console.log("Processing " + products.length + " uncategorized products...");

  for (const product of products) {
    results.processed++;
    const result = await categorizeProduct(product.id, product.name, product.description);

    if (result.suggestedCategory && result.confidence !== "low") {
      const category = await prisma.category.findFirst({
        where: { slug: result.suggestedCategory },
      });

      if (category) {
        await prisma.product.update({
          where: { id: product.id },
          data: { categoryId: category.id, aiEnrichmentStatus: "categorized" },
        });

        if (result.attributes) {
          for (const [key, value] of Object.entries(result.attributes)) {
            if (value) {
              try {
                await prisma.productAttribute.create({
                  data: { productId: product.id, key, value: String(value) },
                });
              } catch (e) { /* ignore duplicates */ }
            }
          }
        }

        results.categorized++;
        console.log("  -> " + product.name.slice(0, 40) + "... => " + category.name);
      }
    } else {
      results.errors++;
    }

    await new Promise((r) => setTimeout(r, 200));
  }

  return results;
}

export default { categorizeProduct, batchCategorizeProducts };
