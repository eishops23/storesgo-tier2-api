// ==========================================================
// 🤖 STORESGO AI ENRICHMENT SERVICE — PHASE 12
// AI-powered product content enrichment engine
// Generates descriptions, tags, SEO keywords, and more
// ==========================================================

import OpenAI from "openai";

// Import shared prisma singleton
import { prisma } from "../lib/prisma.js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "" });

// Configuration
const AI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const AI_MODEL_HEAVY = process.env.OPENAI_MODEL_HEAVY || "gpt-4o";
const MAX_RETRIES = 3;

// ---------------------------------------------------------
// TYPES
// ---------------------------------------------------------

export type EnrichmentType = 
  | "description" 
  | "tags" 
  | "seo_keywords" 
  | "bullet_points" 
  | "target_audience" 
  | "full";

export interface EnrichmentResult {
  success: boolean;
  productId: number;
  enrichmentType: EnrichmentType;
  data?: {
    description?: string;
    tags?: string[];
    seoKeywords?: string;
    bulletPoints?: string[];
    targetAudience?: string;
  };
  moderationFlags?: string[];
  error?: string;
  logId?: number;
}

export interface ProductForEnrichment {
  id: number;
  name: string;
  description: string | null;
  priceCents: number;
  category?: { name: string; slug: string } | null;
  seller?: { storeName: string } | null;
  imageUrl?: string | null;
}

export interface BatchEnrichmentResult {
  total: number;
  successful: number;
  failed: number;
  results: EnrichmentResult[];
}

// ---------------------------------------------------------
// MODERATION - Content Safety Check
// ---------------------------------------------------------

/**
 * Check content for safety issues using OpenAI Moderation API
 */
async function moderateContent(content: string): Promise<{
  flagged: boolean;
  flags: string[];
  score: number;
}> {
  try {
    const response = await openai.moderations.create({
      input: content,
    });

    const result = response.results[0];
    const flags: string[] = [];
    let maxScore = 0;

    if (result.flagged) {
      // Extract which categories were flagged
      const categories = result.categories as unknown as Record<string, boolean>;
      const scores = result.category_scores as unknown as Record<string, number>;

      for (const [category, flagged] of Object.entries(categories)) {
        if (flagged) {
          flags.push(category);
        }
        const score = scores[category] || 0;
        if (score > maxScore) maxScore = score;
      }
    }

    return {
      flagged: result.flagged,
      flags,
      score: maxScore,
    };
  } catch (error: any) {
    console.error("❌ Moderation API error:", error.message);
    return { flagged: false, flags: [], score: 0 };
  }
}

// ---------------------------------------------------------
// GENERATE PRODUCT DESCRIPTION
// ---------------------------------------------------------

/**
 * Generate an AI-enhanced product description
 */
export async function generateProductDescription(
  product: ProductForEnrichment
): Promise<EnrichmentResult> {
  const startTime = Date.now();
  
  // Create enrichment log
  const log = await prisma.aIEnrichmentLog.create({
    data: {
      productId: product.id,
      enrichmentType: "description",
      status: "processing",
    },
  });

  try {
    const systemPrompt = `You are an expert e-commerce copywriter specializing in multicultural grocery and food products.
Write compelling, SEO-friendly product descriptions that:
- Highlight key features and benefits
- Appeal to the target audience
- Include sensory language where appropriate
- Are 2-3 paragraphs long (150-250 words)
- Sound natural and engaging, not robotic

Respond with ONLY the description text, no JSON or formatting.`;

    const userPrompt = `Write an enhanced product description for:

Product: ${product.name}
Current Description: ${product.description || "No description provided"}
Category: ${product.category?.name || "Uncategorized"}
Seller: ${product.seller?.storeName || "Unknown"}
Price: $${(product.priceCents / 100).toFixed(2)}`;

    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      temperature: 0.7,
      max_tokens: 500,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const description = completion.choices[0]?.message?.content?.trim() || "";
    const latencyMs = Date.now() - startTime;
    const tokensUsed = completion.usage?.total_tokens || 0;

    // Moderate the generated content
    const moderation = await moderateContent(description);

    // Update the log
    await prisma.aIEnrichmentLog.update({
      where: { id: log.id },
      data: {
        status: moderation.flagged ? "moderated" : "completed",
        inputPrompt: userPrompt,
        outputRaw: description,
        outputParsed: { description },
        modelUsed: AI_MODEL,
        tokensUsed,
        latencyMs,
        moderationScore: moderation.score,
        moderationFlags: moderation.flags,
        moderatedAt: moderation.flagged ? new Date() : null,
      },
    });

    // Update product if content passed moderation
    if (!moderation.flagged) {
      await prisma.product.update({
        where: { id: product.id },
        data: {
          aiDescription: description,
          aiEnrichedAt: new Date(),
          aiEnrichmentStatus: "completed",
        },
      });
    } else {
      await prisma.product.update({
        where: { id: product.id },
        data: {
          aiEnrichmentStatus: "needs_review",
          aiModerationFlags: moderation.flags,
        },
      });
    }

    return {
      success: true,
      productId: product.id,
      enrichmentType: "description",
      data: { description },
      moderationFlags: moderation.flags,
      logId: log.id,
    };
  } catch (error: any) {
    console.error(`❌ Description generation failed for product ${product.id}:`, error.message);
    
    await prisma.aIEnrichmentLog.update({
      where: { id: log.id },
      data: {
        status: "failed",
        errorMessage: error.message,
      },
    });

    await prisma.product.update({
      where: { id: product.id },
      data: { aiEnrichmentStatus: "failed" },
    });

    return {
      success: false,
      productId: product.id,
      enrichmentType: "description",
      error: error.message,
      logId: log.id,
    };
  }
}

// ---------------------------------------------------------
// GENERATE PRODUCT TAGS
// ---------------------------------------------------------

/**
 * Generate AI-suggested product tags for search and discovery
 */
export async function generateProductTags(
  product: ProductForEnrichment
): Promise<EnrichmentResult> {
  const startTime = Date.now();

  const log = await prisma.aIEnrichmentLog.create({
    data: {
      productId: product.id,
      enrichmentType: "tags",
      status: "processing",
    },
  });

  try {
    const systemPrompt = `You are a product taxonomy and tagging expert for an e-commerce marketplace.
Generate relevant, searchable tags for products that help with:
- Product discovery and search
- Category cross-referencing
- Customer intent matching

Return a JSON array of 8-15 tags. Tags should be:
- Lowercase
- Single words or short phrases (2-3 words max)
- Include product type, ingredients, use cases, occasions, dietary info
- Relevant to multicultural grocery/food products

Example response: ["organic", "gluten-free", "snack", "healthy", "vegan-friendly"]`;

    const userPrompt = `Generate tags for:

Product: ${product.name}
Description: ${product.description || "N/A"}
Category: ${product.category?.name || "Uncategorized"}`;

    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      temperature: 0.5,
      max_tokens: 200,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const responseText = completion.choices[0]?.message?.content?.trim() || "[]";
    const latencyMs = Date.now() - startTime;
    const tokensUsed = completion.usage?.total_tokens || 0;

    // Parse the JSON array
    let tags: string[] = [];
    try {
      const parsed = JSON.parse(responseText);
      if (Array.isArray(parsed)) {
        tags = parsed.map((t: any) => String(t).toLowerCase().trim()).filter(Boolean);
      }
    } catch {
      // Try to extract tags from comma-separated text
      tags = responseText
        .replace(/[\[\]"]/g, "")
        .split(",")
        .map((t) => t.toLowerCase().trim())
        .filter(Boolean);
    }

    // Moderate the tags
    const moderation = await moderateContent(tags.join(", "));

    await prisma.aIEnrichmentLog.update({
      where: { id: log.id },
      data: {
        status: moderation.flagged ? "moderated" : "completed",
        inputPrompt: userPrompt,
        outputRaw: responseText,
        outputParsed: { tags },
        modelUsed: AI_MODEL,
        tokensUsed,
        latencyMs,
        moderationScore: moderation.score,
        moderationFlags: moderation.flags,
        moderatedAt: moderation.flagged ? new Date() : null,
      },
    });

    if (!moderation.flagged) {
      await prisma.product.update({
        where: { id: product.id },
        data: {
          aiTags: tags,
          aiEnrichedAt: new Date(),
          aiEnrichmentStatus: "completed",
        },
      });
    } else {
      await prisma.product.update({
        where: { id: product.id },
        data: {
          aiEnrichmentStatus: "needs_review",
          aiModerationFlags: moderation.flags,
        },
      });
    }

    return {
      success: true,
      productId: product.id,
      enrichmentType: "tags",
      data: { tags },
      moderationFlags: moderation.flags,
      logId: log.id,
    };
  } catch (error: any) {
    console.error(`❌ Tag generation failed for product ${product.id}:`, error.message);
    
    await prisma.aIEnrichmentLog.update({
      where: { id: log.id },
      data: { status: "failed", errorMessage: error.message },
    });

    await prisma.product.update({
      where: { id: product.id },
      data: { aiEnrichmentStatus: "failed" },
    });

    return {
      success: false,
      productId: product.id,
      enrichmentType: "tags",
      error: error.message,
      logId: log.id,
    };
  }
}

// ---------------------------------------------------------
// GENERATE SEO KEYWORDS
// ---------------------------------------------------------

/**
 * Generate SEO-optimized keywords for product
 */
export async function generateSeoKeywords(
  product: ProductForEnrichment
): Promise<EnrichmentResult> {
  const startTime = Date.now();

  const log = await prisma.aIEnrichmentLog.create({
    data: {
      productId: product.id,
      enrichmentType: "seo_keywords",
      status: "processing",
    },
  });

  try {
    const systemPrompt = `You are an SEO expert for e-commerce.
Generate a comma-separated list of 10-15 SEO keywords for product pages.
Keywords should:
- Include primary and secondary keywords
- Mix short-tail and long-tail keywords
- Target buyer intent (informational, commercial, transactional)
- Be relevant to the product category

Respond with ONLY the comma-separated keywords, no other text.`;

    const userPrompt = `Generate SEO keywords for:

Product: ${product.name}
Description: ${product.description || "N/A"}
Category: ${product.category?.name || "Uncategorized"}
Store: ${product.seller?.storeName || "Unknown"}`;

    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      temperature: 0.4,
      max_tokens: 150,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const seoKeywords = completion.choices[0]?.message?.content?.trim() || "";
    const latencyMs = Date.now() - startTime;
    const tokensUsed = completion.usage?.total_tokens || 0;

    // Moderate
    const moderation = await moderateContent(seoKeywords);

    await prisma.aIEnrichmentLog.update({
      where: { id: log.id },
      data: {
        status: moderation.flagged ? "moderated" : "completed",
        inputPrompt: userPrompt,
        outputRaw: seoKeywords,
        outputParsed: { seoKeywords },
        modelUsed: AI_MODEL,
        tokensUsed,
        latencyMs,
        moderationScore: moderation.score,
        moderationFlags: moderation.flags,
        moderatedAt: moderation.flagged ? new Date() : null,
      },
    });

    if (!moderation.flagged) {
      await prisma.product.update({
        where: { id: product.id },
        data: {
          aiSeoKeywords: Array.isArray(seoKeywords) ? seoKeywords : [seoKeywords],
          aiEnrichedAt: new Date(),
          aiEnrichmentStatus: "completed",
        },
      });
    } else {
      await prisma.product.update({
        where: { id: product.id },
        data: {
          aiEnrichmentStatus: "needs_review",
          aiModerationFlags: moderation.flags,
        },
      });
    }

    return {
      success: true,
      productId: product.id,
      enrichmentType: "seo_keywords",
      data: { seoKeywords },
      moderationFlags: moderation.flags,
      logId: log.id,
    };
  } catch (error: any) {
    console.error(`❌ SEO keyword generation failed for product ${product.id}:`, error.message);
    
    await prisma.aIEnrichmentLog.update({
      where: { id: log.id },
      data: { status: "failed", errorMessage: error.message },
    });

    await prisma.product.update({
      where: { id: product.id },
      data: { aiEnrichmentStatus: "failed" },
    });

    return {
      success: false,
      productId: product.id,
      enrichmentType: "seo_keywords",
      error: error.message,
      logId: log.id,
    };
  }
}

// ---------------------------------------------------------
// GENERATE BULLET POINTS
// ---------------------------------------------------------

/**
 * Generate feature bullet points for product listing
 */
export async function generateBulletPoints(
  product: ProductForEnrichment
): Promise<EnrichmentResult> {
  const startTime = Date.now();

  const log = await prisma.aIEnrichmentLog.create({
    data: {
      productId: product.id,
      enrichmentType: "bullet_points",
      status: "processing",
    },
  });

  try {
    const systemPrompt = `You are an e-commerce product listing expert.
Generate 5-7 compelling bullet points highlighting product features and benefits.
Each bullet point should:
- Start with a benefit or key feature
- Be concise (under 100 characters)
- Focus on what matters to customers
- Include relevant details (size, quantity, origin, etc.)

Return a JSON array of bullet point strings.
Example: ["100% organic ingredients", "Family-size 24oz package", "Imported from Italy"]`;

    const userPrompt = `Generate bullet points for:

Product: ${product.name}
Description: ${product.description || "N/A"}
Category: ${product.category?.name || "Uncategorized"}
Price: $${(product.priceCents / 100).toFixed(2)}`;

    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      temperature: 0.6,
      max_tokens: 300,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const responseText = completion.choices[0]?.message?.content?.trim() || "[]";
    const latencyMs = Date.now() - startTime;
    const tokensUsed = completion.usage?.total_tokens || 0;

    // Parse bullet points
    let bulletPoints: string[] = [];
    try {
      const parsed = JSON.parse(responseText);
      if (Array.isArray(parsed)) {
        bulletPoints = parsed.map((b: any) => String(b).trim()).filter(Boolean);
      }
    } catch {
      // Try line-by-line parsing
      bulletPoints = responseText
        .split("\n")
        .map((line) => line.replace(/^[-•*]\s*/, "").trim())
        .filter(Boolean);
    }

    // Moderate
    const moderation = await moderateContent(bulletPoints.join(" "));

    await prisma.aIEnrichmentLog.update({
      where: { id: log.id },
      data: {
        status: moderation.flagged ? "moderated" : "completed",
        inputPrompt: userPrompt,
        outputRaw: responseText,
        outputParsed: { bulletPoints },
        modelUsed: AI_MODEL,
        tokensUsed,
        latencyMs,
        moderationScore: moderation.score,
        moderationFlags: moderation.flags,
        moderatedAt: moderation.flagged ? new Date() : null,
      },
    });

    if (!moderation.flagged) {
      await prisma.product.update({
        where: { id: product.id },
        data: {
          aiBulletPoints: bulletPoints,
          aiEnrichedAt: new Date(),
          aiEnrichmentStatus: "completed",
        },
      });
    } else {
      await prisma.product.update({
        where: { id: product.id },
        data: {
          aiEnrichmentStatus: "needs_review",
          aiModerationFlags: moderation.flags,
        },
      });
    }

    return {
      success: true,
      productId: product.id,
      enrichmentType: "bullet_points",
      data: { bulletPoints },
      moderationFlags: moderation.flags,
      logId: log.id,
    };
  } catch (error: any) {
    console.error(`❌ Bullet points generation failed for product ${product.id}:`, error.message);
    
    await prisma.aIEnrichmentLog.update({
      where: { id: log.id },
      data: { status: "failed", errorMessage: error.message },
    });

    await prisma.product.update({
      where: { id: product.id },
      data: { aiEnrichmentStatus: "failed" },
    });

    return {
      success: false,
      productId: product.id,
      enrichmentType: "bullet_points",
      error: error.message,
      logId: log.id,
    };
  }
}

// ---------------------------------------------------------
// GENERATE TARGET AUDIENCE
// ---------------------------------------------------------

/**
 * Identify target audience for the product
 */
export async function generateTargetAudience(
  product: ProductForEnrichment
): Promise<EnrichmentResult> {
  const startTime = Date.now();

  const log = await prisma.aIEnrichmentLog.create({
    data: {
      productId: product.id,
      enrichmentType: "target_audience",
      status: "processing",
    },
  });

  try {
    const systemPrompt = `You are a marketing expert specializing in multicultural e-commerce.
Identify the target audience for products based on their attributes.
Consider demographics, interests, dietary preferences, cultural background, and buying occasions.

Respond with a brief 2-3 sentence description of the ideal customer.`;

    const userPrompt = `Identify target audience for:

Product: ${product.name}
Description: ${product.description || "N/A"}
Category: ${product.category?.name || "Uncategorized"}
Price Point: $${(product.priceCents / 100).toFixed(2)}`;

    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      temperature: 0.5,
      max_tokens: 150,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const targetAudience = completion.choices[0]?.message?.content?.trim() || "";
    const latencyMs = Date.now() - startTime;
    const tokensUsed = completion.usage?.total_tokens || 0;

    // Moderate
    const moderation = await moderateContent(targetAudience);

    await prisma.aIEnrichmentLog.update({
      where: { id: log.id },
      data: {
        status: moderation.flagged ? "moderated" : "completed",
        inputPrompt: userPrompt,
        outputRaw: targetAudience,
        outputParsed: { targetAudience },
        modelUsed: AI_MODEL,
        tokensUsed,
        latencyMs,
        moderationScore: moderation.score,
        moderationFlags: moderation.flags,
        moderatedAt: moderation.flagged ? new Date() : null,
      },
    });

    if (!moderation.flagged) {
      await prisma.product.update({
        where: { id: product.id },
        data: {
          aiTargetAudience: targetAudience,
          aiEnrichedAt: new Date(),
          aiEnrichmentStatus: "completed",
        },
      });
    } else {
      await prisma.product.update({
        where: { id: product.id },
        data: {
          aiEnrichmentStatus: "needs_review",
          aiModerationFlags: moderation.flags,
        },
      });
    }

    return {
      success: true,
      productId: product.id,
      enrichmentType: "target_audience",
      data: { targetAudience },
      moderationFlags: moderation.flags,
      logId: log.id,
    };
  } catch (error: any) {
    console.error(`❌ Target audience generation failed for product ${product.id}:`, error.message);
    
    await prisma.aIEnrichmentLog.update({
      where: { id: log.id },
      data: { status: "failed", errorMessage: error.message },
    });

    await prisma.product.update({
      where: { id: product.id },
      data: { aiEnrichmentStatus: "failed" },
    });

    return {
      success: false,
      productId: product.id,
      enrichmentType: "target_audience",
      error: error.message,
      logId: log.id,
    };
  }
}

// ---------------------------------------------------------
// FULL ENRICHMENT - Run All Enrichments
// ---------------------------------------------------------

/**
 * Run all AI enrichment processes for a product
 */
export async function enrichProductFull(
  productId: number
): Promise<EnrichmentResult> {
  // Fetch product with relations
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      category: { select: { name: true, slug: true } },
      seller: { select: { storeName: true } },
    },
  });

  if (!product) {
    return {
      success: false,
      productId,
      enrichmentType: "full",
      error: "Product not found",
    };
  }

  // Mark as processing
  await prisma.product.update({
    where: { id: productId },
    data: { aiEnrichmentStatus: "processing" },
  });

  const productData: ProductForEnrichment = {
    id: product.id,
    name: product.name,
    description: product.description,
    priceCents: product.priceCents,
    category: product.category,
    seller: product.seller,
    imageUrl: product.imageUrl,
  };

  // Run all enrichments
  const results = await Promise.allSettled([
    generateProductDescription(productData),
    generateProductTags(productData),
    generateSeoKeywords(productData),
    generateBulletPoints(productData),
    generateTargetAudience(productData),
  ]);

  // Aggregate results
  const allData: EnrichmentResult["data"] = {};
  const allFlags: string[] = [];
  let hasErrors = false;
  let errorMessages: string[] = [];

  for (const result of results) {
    if (result.status === "fulfilled" && result.value.success) {
      Object.assign(allData, result.value.data);
      if (result.value.moderationFlags) {
        allFlags.push(...result.value.moderationFlags);
      }
    } else if (result.status === "fulfilled" && !result.value.success) {
      hasErrors = true;
      if (result.value.error) errorMessages.push(result.value.error);
    } else if (result.status === "rejected") {
      hasErrors = true;
      errorMessages.push(result.reason?.message || "Unknown error");
    }
  }

  // Update final status
  const finalStatus = allFlags.length > 0 
    ? "needs_review" 
    : hasErrors 
      ? "failed" 
      : "completed";

  await prisma.product.update({
    where: { id: productId },
    data: {
      aiEnrichmentStatus: finalStatus,
      aiEnrichedAt: new Date(),
      aiModerationFlags: [...new Set(allFlags)],
    },
  });

  return {
    success: !hasErrors,
    productId,
    enrichmentType: "full",
    data: allData,
    moderationFlags: [...new Set(allFlags)],
    error: errorMessages.length > 0 ? errorMessages.join("; ") : undefined,
  };
}

// ---------------------------------------------------------
// BATCH ENRICHMENT
// ---------------------------------------------------------

/**
 * Enrich multiple products that haven't been enriched yet
 */
export async function runBatchEnrichment(
  options: {
    limit?: number;
    enrichmentType?: EnrichmentType;
    forceReenrich?: boolean;
  } = {}
): Promise<BatchEnrichmentResult> {
  const { limit = 10, enrichmentType = "full", forceReenrich = false } = options;

  // Find products needing enrichment
  const whereClause: any = {
    isActive: true,
  };

  if (!forceReenrich) {
    whereClause.OR = [
      { aiEnrichmentStatus: null },
      { aiEnrichmentStatus: "pending" },
      { aiEnrichmentStatus: "failed" },
    ];
  }

  const products = await prisma.product.findMany({
    where: whereClause,
    include: {
      category: { select: { name: true, slug: true } },
      seller: { select: { storeName: true } },
    },
    take: limit,
    orderBy: { createdAt: "desc" },
  });

  console.log(`🤖 Starting batch enrichment for ${products.length} products...`);

  const results: EnrichmentResult[] = [];
  let successful = 0;
  let failed = 0;

  for (const product of products) {
    try {
      const productData: ProductForEnrichment = {
        id: product.id,
        name: product.name,
        description: product.description,
        priceCents: product.priceCents,
        category: product.category,
        seller: product.seller,
        imageUrl: product.imageUrl,
      };

      let result: EnrichmentResult;

      switch (enrichmentType) {
        case "description":
          result = await generateProductDescription(productData);
          break;
        case "tags":
          result = await generateProductTags(productData);
          break;
        case "seo_keywords":
          result = await generateSeoKeywords(productData);
          break;
        case "bullet_points":
          result = await generateBulletPoints(productData);
          break;
        case "target_audience":
          result = await generateTargetAudience(productData);
          break;
        case "full":
        default:
          result = await enrichProductFull(product.id);
          break;
      }

      results.push(result);
      if (result.success) {
        successful++;
        console.log(`✅ Enriched product ${product.id}: ${product.name}`);
      } else {
        failed++;
        console.log(`❌ Failed product ${product.id}: ${result.error}`);
      }

      // Rate limiting - wait between API calls
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error: any) {
      failed++;
      console.error(`❌ Batch enrichment error for product ${product.id}:`, error.message);
      results.push({
        success: false,
        productId: product.id,
        enrichmentType,
        error: error.message,
      });
    }
  }

  console.log(`🤖 Batch enrichment complete: ${successful} successful, ${failed} failed`);

  return {
    total: products.length,
    successful,
    failed,
    results,
  };
}

// ---------------------------------------------------------
// ADMIN REVIEW FUNCTIONS
// ---------------------------------------------------------

/**
 * Get products needing AI content review
 */
export async function getProductsNeedingReview(options: {
  page?: number;
  pageSize?: number;
} = {}) {
  const { page = 1, pageSize = 20 } = options;
  const skip = (page - 1) * pageSize;

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where: {
        aiEnrichmentStatus: "needs_review",
      },
      include: {
        category: { select: { name: true } },
        seller: { select: { storeName: true } },
        enrichmentLogs: {
          where: { status: "moderated" },
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
      skip,
      take: pageSize,
      orderBy: { aiEnrichedAt: "desc" },
    }),
    prisma.product.count({
      where: { aiEnrichmentStatus: "needs_review" },
    }),
  ]);

  return { items, total, page, pageSize };
}

/**
 * Approve AI-generated content for a product
 */
export async function approveAIContent(
  productId: number,
  adminId: number,
  notes?: string
) {
  // Update product status
  await prisma.product.update({
    where: { id: productId },
    data: {
      aiEnrichmentStatus: "completed",
      aiReviewedAt: new Date(),
      aiReviewedBy: adminId,
      aiModerationFlags: [], // Clear flags
    },
  });

  // Update enrichment logs
  await prisma.aIEnrichmentLog.updateMany({
    where: {
      productId,
      status: "moderated",
    },
    data: {
      reviewedBy: adminId,
      reviewedAt: new Date(),
      reviewAction: "approved",
      reviewNotes: notes,
      status: "completed",
    },
  });

  return { success: true };
}

/**
 * Reject AI-generated content and reset for re-enrichment
 */
export async function rejectAIContent(
  productId: number,
  adminId: number,
  notes?: string
) {
  // Clear AI content and reset status
  await prisma.product.update({
    where: { id: productId },
    data: {
      aiDescription: null,
      aiTags: [],
      aiSeoKeywords: null,
      aiBulletPoints: [],
      aiTargetAudience: null,
      aiEnrichmentStatus: "pending",
      aiReviewedAt: new Date(),
      aiReviewedBy: adminId,
      aiModerationFlags: [],
    },
  });

  // Update enrichment logs
  await prisma.aIEnrichmentLog.updateMany({
    where: {
      productId,
      status: "moderated",
    },
    data: {
      reviewedBy: adminId,
      reviewedAt: new Date(),
      reviewAction: "rejected",
      reviewNotes: notes,
    },
  });

  return { success: true };
}

/**
 * Get enrichment statistics
 */
export async function getEnrichmentStats() {
  const [
    totalProducts,
    enrichedCount,
    pendingCount,
    needsReviewCount,
    failedCount,
    logsToday,
    avgLatency,
  ] = await Promise.all([
    prisma.product.count({ where: { isActive: true } }),
    prisma.product.count({ where: { aiEnrichmentStatus: "completed" } }),
    prisma.product.count({ where: { OR: [{ aiEnrichmentStatus: null }, { aiEnrichmentStatus: "pending" }] } }),
    prisma.product.count({ where: { aiEnrichmentStatus: "needs_review" } }),
    prisma.product.count({ where: { aiEnrichmentStatus: "failed" } }),
    prisma.aIEnrichmentLog.count({
      where: {
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    }),
    prisma.aIEnrichmentLog.aggregate({
      _avg: { latencyMs: true },
      where: { status: "completed" },
    }),
  ]);

  return {
    totalProducts,
    enrichedCount,
    pendingCount,
    needsReviewCount,
    failedCount,
    enrichmentRate: totalProducts > 0 ? ((enrichedCount / totalProducts) * 100).toFixed(1) : "0",
    logsToday,
    avgLatencyMs: avgLatency._avg.latencyMs?.toFixed(0) || "N/A",
  };
}

/**
 * Get enrichment logs for a product
 */
export async function getProductEnrichmentLogs(productId: number) {
  return prisma.aIEnrichmentLog.findMany({
    where: { productId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

// ---------------------------------------------------------
// TEST CONNECTION
// ---------------------------------------------------------

/**
 * Test the OpenAI API connection
 */
export async function testAIConnection(): Promise<{
  success: boolean;
  message: string;
  model?: string;
}> {
  try {
    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      max_tokens: 10,
      messages: [{ role: "user", content: "Say 'AI connection successful'" }],
    });

    const response = completion.choices[0]?.message?.content || "";
    
    return {
      success: true,
      message: response,
      model: AI_MODEL,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message,
    };
  }
}

