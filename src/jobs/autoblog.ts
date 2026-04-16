// =============================================================================
// STORESGO AUTOBLOG SYSTEM — ENTERPRISE EDITION v2.1 (GEMINI)
// =============================================================================

import { GoogleGenerativeAI } from "@google/generative-ai";
import slugifyLib from "slugify";
import crypto from "crypto";
import { prisma } from "../lib/prisma.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const gemini = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// =============================================================================
// CONFIGURATION
// =============================================================================
const CONFIG = {
  BASE_URL: (process.env.PUBLIC_BASE_URL || "https://storesgo.com").replace(/\/+$/, ""),
  AI_MODEL: "gemini-2.0-flash",
  POSTS_PER_DAY: Number(process.env.AUTOBLOG_POSTS_PER_DAY || 6),
  MIN_WORD_COUNT: 1500,
  TARGET_WORD_COUNT: 2000,
  DEDUP_DAYS: 60,
  DELAY_BETWEEN_POSTS_MS: 8000,
  MAX_RETRIES: 3,
  // Circuit breaker: stop retrying after consecutive failures
  MAX_CONSECUTIVE_FAILURES: 3,
};

// Track consecutive failures to avoid burning CPU
let consecutiveFailures = 0;

// =============================================================================
// CONTENT TYPES — 8 diverse formats
// =============================================================================
const CONTENT_TYPES = [
  {
    type: "recipe", category: "recipes", priority: 2,
    titlePatterns: [
      (p: string, c: string) => `${c} Recipe: How to Cook with ${p}`,
      (p: string, c: string) => `Authentic ${p} Recipe: Traditional Cooking Guide`,
      (p: string, c: string) => `5 Delicious Ways to Use ${p} in Your Kitchen`,
    ],
    promptFocus: `Write a comprehensive recipe article featuring this product as a key ingredient.
MUST INCLUDE: Brief introduction, detailed recipe with exact measurements, step-by-step cooking instructions with timing, chef's tips, variations for different dietary needs, serving suggestions, storage instructions, FAQ section with 5-7 common questions.`,
  },
  {
    type: "guide", category: "guides", priority: 2,
    titlePatterns: [
      (p: string, c: string) => `Complete Buyer's Guide to ${p}: Everything You Need to Know`,
      (p: string, c: string) => `${p} 101: The Ultimate Shopping Guide`,
      (p: string, c: string) => `How to Choose the Best ${p}: Expert Tips`,
    ],
    promptFocus: `Write a comprehensive buyer's guide about this product.
MUST INCLUDE: What makes it special, quality indicators, storage tips, shelf life, nutritional profile, common uses, price considerations, FAQ section with 5-7 common questions.`,
  },
  {
    type: "spotlight", category: "products", priority: 2,
    titlePatterns: [
      (p: string, s: string) => `Product Spotlight: ${p} from ${s}`,
      (p: string, s: string) => `Discover ${p}: Featured at ${s}`,
      (p: string, s: string) => `Why ${p} is a Must-Have from ${s}`,
    ],
    promptFocus: `Write a detailed product spotlight article.
MUST INCLUDE: Product overview, quality story, why customers love it, best uses, pairing suggestions, value proposition, similar products, FAQ section with 5-7 common questions.`,
  },
  {
    type: "culture", category: "culture", priority: 1,
    titlePatterns: [
      (p: string, c: string) => `The Cultural Story Behind ${p}: History & Traditions`,
      (p: string, c: string) => `${p}: A Culinary Journey Through Culture`,
      (p: string, c: string) => `Exploring the Heritage of ${p}`,
    ],
    promptFocus: `Write about the cultural significance and history of this product.
MUST INCLUDE: Historical origins, cultural significance, traditional preparation, role in celebrations, modern interpretations, interesting facts, FAQ section with 5-7 common questions.`,
  },
  {
    type: "health", category: "health", priority: 1,
    titlePatterns: [
      (p: string, c: string) => `${p}: Nutritional Benefits & Healthy Ways to Enjoy`,
      (p: string, c: string) => `Health Benefits of ${p} You Didn't Know`,
      (p: string, c: string) => `${p} in Your Healthy Diet: A Nutritional Guide`,
    ],
    promptFocus: `Write about the nutritional aspects and healthy ways to use this product.
MUST INCLUDE: Nutritional breakdown, key vitamins/minerals, health benefits (general, not medical claims), diet compatibility, healthy preparation, portion sizes, meal prep ideas, FAQ section with 5-7 common questions.
IMPORTANT: Avoid specific medical claims.`,
  },
  {
    type: "seasonal", category: "seasonal", priority: 1,
    titlePatterns: [
      (p: string, c: string) => `Seasonal Cooking: Best Ways to Enjoy ${p} This Season`,
      (p: string, c: string) => `${p} for the Holidays: Festive Ideas`,
      (p: string, c: string) => `Seasonal Guide: ${p} for Every Occasion`,
    ],
    promptFocus: `Write about seasonal uses for this product.
MUST INCLUDE: Why it's perfect for the current season, holiday recipes, seasonal pairings, party ideas, gift suggestions, seasonal availability, traditional preparations, FAQ section with 5-7 common questions.`,
  },
  {
    type: "comparison", category: "guides", priority: 1,
    titlePatterns: [
      (p: string, c: string) => `${p} vs. Alternatives: Which Should You Choose?`,
      (p: string, c: string) => `Comparing ${p}: Find Your Perfect Match`,
      (p: string, c: string) => `The Ultimate ${p} Comparison Guide`,
    ],
    promptFocus: `Write a comparison guide about this product and its alternatives.
MUST INCLUDE: Product overview, common alternatives, detailed comparison (taste, texture, nutrition, price), when to use each, pros and cons, budget options, FAQ section with 5-7 common questions.`,
  },
  {
    type: "tips", category: "tips", priority: 1,
    titlePatterns: [
      (p: string, c: string) => `10 Pro Tips for Using ${p} Like a Chef`,
      (p: string, c: string) => `Expert Tips: Get the Most from ${p}`,
      (p: string, c: string) => `${p} Hacks: Kitchen Tips You Need to Know`,
    ],
    promptFocus: `Write a tips and tricks article about this product.
MUST INCLUDE: Why it's special, 10 numbered detailed tips, storage hacks, preparation shortcuts, flavor techniques, common mistakes, creative uses, FAQ section with 5-7 common questions.`,
  },
];

// =============================================================================
// SEASONAL CALENDAR
// =============================================================================
const SEASONAL_CALENDAR: Record<number, { themes: string[]; boost: string[] }> = {
  1: { themes: ["New Year", "healthy eating", "meal prep"], boost: ["health", "tips"] },
  2: { themes: ["Valentine's Day", "romantic dinners", "comfort food"], boost: ["recipe", "culture"] },
  3: { themes: ["Spring", "fresh vegetables", "Easter prep"], boost: ["seasonal", "guide"] },
  4: { themes: ["Easter", "Passover", "spring produce"], boost: ["seasonal", "recipe"] },
  5: { themes: ["Mother's Day", "brunch", "graduation"], boost: ["recipe", "tips"] },
  6: { themes: ["Summer", "grilling", "Father's Day"], boost: ["seasonal", "recipe"] },
  7: { themes: ["July 4th", "BBQ", "picnics"], boost: ["seasonal", "tips"] },
  8: { themes: ["back to school", "meal prep", "late summer"], boost: ["tips", "health"] },
  9: { themes: ["Labor Day", "fall preview", "comfort food"], boost: ["seasonal", "recipe"] },
  10: { themes: ["Halloween", "fall harvest", "autumn flavors"], boost: ["seasonal", "culture"] },
  11: { themes: ["Thanksgiving", "holiday prep", "family meals"], boost: ["recipe", "seasonal"] },
  12: { themes: ["Christmas", "Hanukkah", "holiday baking"], boost: ["seasonal", "recipe"] },
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================
function slugify(s: string): string {
  const slugFn = (slugifyLib as any).default || slugifyLib;
  return slugFn(s, { lower: true, strict: true, trim: true }).slice(0, 100);
}

function generatePromptHash(prompt: string): string {
  return crypto.createHash("sha256").update(prompt).digest("hex").slice(0, 24);
}

function calculateReadingTime(html: string): number {
  const text = html.replace(/<[^>]*>/g, " ");
  const words = text.trim().split(/\s+/).length;
  return Math.ceil(words / 200);
}

function pick<T>(arr: T[]): T | null {
  if (!arr.length) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

function weightedPick<T extends { priority: number }>(arr: T[]): T | null {
  if (!arr.length) return null;
  const totalWeight = arr.reduce((sum, item) => sum + item.priority, 0);
  let random = Math.random() * totalWeight;
  for (const item of arr) {
    random -= item.priority;
    if (random <= 0) return item;
  }
  return arr[arr.length - 1];
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function pingIndexers(url: string): Promise<void> {
  const targets = [
    `https://www.google.com/ping?sitemap=${encodeURIComponent(url)}`,
    `https://www.bing.com/ping?sitemap=${encodeURIComponent(url)}`,
  ];
  await Promise.allSettled(targets.map((u) => fetch(u, { method: "GET" }).catch(() => {})));
}

// =============================================================================
// DATABASE QUERIES
// =============================================================================
async function getTodayPostCount(): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return prisma.blogPost.count({ where: { source: "autoblog", createdAt: { gte: today } } });
}

async function getRecentProductIds(days: number = CONFIG.DEDUP_DAYS): Promise<number[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const recentPosts = await prisma.blogPost.findMany({
    where: { source: "autoblog", productId: { not: null }, createdAt: { gte: since } },
    select: { productId: true },
  });
  return recentPosts.map(p => p.productId).filter(Boolean) as number[];
}

async function getRecentContentTypes(days: number = 7): Promise<string[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const recentPosts = await prisma.blogPost.findMany({
    where: { source: "autoblog", createdAt: { gte: since } },
    select: { category: true },
  });
  return recentPosts.map(p => p.category).filter(Boolean) as string[];
}

async function selectUniqueProduct() {
  const recentProductIds = await getRecentProductIds();
  const sellers = await prisma.seller.findMany({
    where: { isApproved: true, isBanned: false, products: { some: { isActive: true } } },
    include: {
      products: {
        where: { isActive: true, id: { notIn: recentProductIds.length > 0 ? recentProductIds : [-1] } },
        take: 100, orderBy: { createdAt: "desc" },
        include: { category: true },
      },
    },
    take: 30,
  });

  const sellersWithProducts = sellers.filter(s => s.products.length > 0);
  if (sellersWithProducts.length === 0) {
    const fallbackSellers = await prisma.seller.findMany({
      where: { isApproved: true, isBanned: false, products: { some: { isActive: true } } },
      include: { products: { where: { isActive: true }, take: 50, include: { category: true } } },
      take: 20,
    });
    const seller = pick(fallbackSellers);
    if (!seller) return null;
    const product = pick(seller.products);
    return product ? { seller, product } : null;
  }

  const seller = pick(sellersWithProducts);
  if (!seller) return null;
  const product = pick(seller.products);
  return product ? { seller, product } : null;
}

async function selectContentType(): Promise<typeof CONTENT_TYPES[0]> {
  const month = new Date().getMonth() + 1;
  const seasonalData = SEASONAL_CALENDAR[month];
  const recentTypes = await getRecentContentTypes(3);
  const boostedTypes = CONTENT_TYPES.map(ct => ({
    ...ct, priority: ct.priority + (seasonalData.boost.includes(ct.type) ? 2 : 0),
  }));
  const adjustedTypes = boostedTypes.map(ct => ({
    ...ct, priority: Math.max(0.5, ct.priority - recentTypes.filter(t => t === ct.category).length * 0.5),
  }));
  return weightedPick(adjustedTypes) || CONTENT_TYPES[0];
}

// =============================================================================
// GEMINI GENERATION HELPER
// =============================================================================
async function generateWithGemini(prompt: string): Promise<string> {
  const result = await gemini.generateContent(prompt);
  const response = result.response;
  return response.text();
}

// =============================================================================
// MAIN GENERATION FUNCTION
// =============================================================================
export type AutoblogOutcome = {
  sellerId: number;
  productId?: number;
  slug: string;
  created: boolean;
  reason?: string;
  contentType?: string;
  wordCount?: number;
  readingTime?: number;
};

export async function runAutoblogOnce(): Promise<AutoblogOutcome> {
  console.log("📝 Starting autoblog generation (Gemini)...");

  // Circuit breaker check
  if (consecutiveFailures >= CONFIG.MAX_CONSECUTIVE_FAILURES) {
    console.log(`🔴 Circuit breaker OPEN: ${consecutiveFailures} consecutive failures. Skipping until next cron cycle.`);
    consecutiveFailures = 0; // Reset for next cycle
    return { sellerId: 0, slug: "", created: false, reason: "circuit_breaker_open" };
  }

  // 1) Check daily limit
  const todayCount = await getTodayPostCount();
  if (todayCount >= CONFIG.POSTS_PER_DAY) {
    console.log(`⏭️ Daily limit reached: ${todayCount}/${CONFIG.POSTS_PER_DAY}`);
    return { sellerId: 0, slug: "", created: false, reason: `daily_limit_${todayCount}` };
  }

  // 2) Select unique product
  const selection = await selectUniqueProduct();
  if (!selection) {
    console.log("⚠️ No unique product found");
    return { sellerId: 0, slug: "", created: false, reason: "no_product" };
  }

  const { seller, product } = selection;

  // 3) Select content type
  const contentType = await selectContentType();

  // 4) Get seasonal context
  const month = new Date().getMonth() + 1;
  const seasonalData = SEASONAL_CALENDAR[month];

  // 5) Build title
  const categoryName = product.category?.name || "Groceries";
  const titleTemplate = pick(contentType.titlePatterns);
  const baseTitle = contentType.type === "spotlight"
    ? titleTemplate!(product.name, seller.storeName)
    : titleTemplate!(product.name, categoryName);

  // 6) Build slug
  const slug = slugify(`${baseTitle}-storesgo-${Date.now().toString(36)}`);

  // 7) Get product image
  const productImage = product.imageUrl || (product as any).images?.[0] || null;

  // 8) Build prompt
  const prompt = `You are an expert content writer for StoresGo, a premium online marketplace for ethnic and specialty groceries. Write a comprehensive, SEO-optimized article.

PRODUCT DETAILS:
- Product: ${product.name}
- Category: ${categoryName}
- Seller: ${seller.storeName}
- Price: ${(product as any).price ? `$${(product as any).price}` : "Available on StoresGo"}
- Description: ${product.description || "Premium quality product"}

ARTICLE TYPE: ${contentType.type.toUpperCase()}
TITLE: ${baseTitle}

SEASONAL CONTEXT (incorporate naturally):
- Current themes: ${seasonalData.themes.join(", ")}

${contentType.promptFocus}

CRITICAL SEO REQUIREMENTS:
1. MINIMUM ${CONFIG.MIN_WORD_COUNT} words (target ${CONFIG.TARGET_WORD_COUNT}+)
2. Use H1 for title (once), H2 for main sections (4-6), H3 for subsections
3. Mention "${product.name}" naturally 6-10 times throughout
4. Include "StoresGo" 3-5 times
5. Use short paragraphs (2-3 sentences max)
6. Include bullet points and numbered lists
7. Bold important keywords and product names
8. Create compelling hook in first paragraph
9. Include a "Quick Facts" summary box early in the article
10. End with strong call-to-action to shop at StoresGo

INTERNAL LINKING (include these placeholders):
- [LINK: ${CONFIG.BASE_URL}/products/${product.id}] - Link to the product
- [LINK: ${CONFIG.BASE_URL}/sellers/${seller.slug}] - Link to the seller
- [LINK: ${CONFIG.BASE_URL}/blog] - Link to more articles

STRUCTURE YOUR ARTICLE WITH:
1. Engaging title (H1)
2. Hook paragraph with interesting fact or question
3. "Quick Facts" summary box
4. Main content sections (H2s with H3 subsections)
5. Detailed FAQ section (5-7 questions with thorough answers)
6. Conclusion with call-to-action

After the article, provide this metadata:

---META DATA---
META_TITLE: (max 60 chars, include "${product.name}")
META_DESC: (max 155 chars, compelling with CTA)
KEYWORDS: (10-12 comma-separated, include long-tail keywords)
EXCERPT: (120-150 words, engaging summary for previews)
TAGS: (6-8 relevant tags)
CATEGORY: ${contentType.category}`;

  console.log(`📝 Generating ${contentType.type} for: ${product.name}`);
  console.log(`   Post #${todayCount + 1} today | Season: ${seasonalData.themes[0]} | Model: ${CONFIG.AI_MODEL}`);

  const promptHash = generatePromptHash(prompt);

  // 9) Generate content with Gemini + retry + circuit breaker
  let text = "";
  for (let attempt = 1; attempt <= CONFIG.MAX_RETRIES; attempt++) {
    try {
      text = await generateWithGemini(prompt);
      if (text.length > 1000) {
        consecutiveFailures = 0; // Reset on success
        break;
      }
      console.log(`⚠️ Short response (${text.length} chars), retrying...`);
    } catch (err: any) {
      console.log(`⚠️ Attempt ${attempt}/${CONFIG.MAX_RETRIES} failed: ${err.message}`);
      consecutiveFailures++;
      if (attempt === CONFIG.MAX_RETRIES) throw err;
      await sleep(3000 * attempt);
    }
  }

  // 10) Parse response
  const [articleRaw, metaRaw] = text.split(/---META DATA---/i);

  // 11) Convert to HTML
  let articleHtml = articleRaw
    .trim()
    .replace(/^### (.*)/gm, "<h3>$1</h3>")
    .replace(/^## (.*)/gm, "<h2>$1</h2>")
    .replace(/^# (.*)/gm, "<h1>$1</h1>")
    .replace(/^\* (.*)/gm, "<li>$1</li>")
    .replace(/^- (.*)/gm, "<li>$1</li>")
    .replace(/^\d+\. (.*)/gm, "<li>$1</li>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/\[LINK: ([^\]]+)\]/g, '<a href="$1" class="text-green-600 hover:underline font-medium">Learn more</a>')
    .replace(/\n{2,}/g, "</p><p>")
    .replace(/(<li>.*<\/li>)\n?(<li>)/g, "$1$2");

  if (!articleHtml.startsWith("<")) articleHtml = `<p>${articleHtml}</p>`;

  articleHtml = articleHtml.replace(/(<li>.*?<\/li>)+/gs, (match) =>
    `<ul class="list-disc pl-6 my-4 space-y-2">${match}</ul>`
  );

  // Add product image
  if (productImage && !articleHtml.includes(productImage)) {
    const imageHtml = `
      <figure class="my-8">
        <img src="${productImage}" alt="${product.name} - Available at ${seller.storeName} on StoresGo"
             class="w-full max-w-2xl mx-auto rounded-xl shadow-lg" loading="lazy" />
        <figcaption class="text-center text-sm text-gray-500 mt-3 italic">
          ${product.name} - Available at ${seller.storeName} on StoresGo
        </figcaption>
      </figure>`;
    const firstHeading = articleHtml.match(/<\/h[12]>/);
    if (firstHeading) {
      const pos = articleHtml.indexOf(firstHeading[0]) + firstHeading[0].length;
      articleHtml = articleHtml.slice(0, pos) + imageHtml + articleHtml.slice(pos);
    } else {
      articleHtml = imageHtml + articleHtml;
    }
  }

  // 12) Parse metadata
  const metaTitle = (metaRaw?.match(/META_TITLE:\s*(.*)/i)?.[1] || baseTitle).trim().slice(0, 60);
  const metaDesc = (metaRaw?.match(/META_DESC:\s*(.*)/i)?.[1] ||
    `Discover ${product.name} at ${seller.storeName}. Shop authentic ${categoryName} on StoresGo.`
  ).trim().slice(0, 155);

  const keywordsRaw = (metaRaw?.match(/KEYWORDS:\s*(.*)/i)?.[1] ||
    `${product.name}, ${seller.storeName}, ${categoryName}, StoresGo, ethnic groceries`).trim();
  const keywords = keywordsRaw.split(",").map(k => k.trim()).filter(Boolean);

  const excerpt = (metaRaw?.match(/EXCERPT:\s*([\s\S]*?)(?=TAGS:|$)/i)?.[1] ||
    `Discover ${product.name} at ${seller.storeName}. Shop quality ${categoryName} on StoresGo.`
  ).trim().slice(0, 400);

  const tagsRaw = metaRaw?.match(/TAGS:\s*(.*)/i)?.[1] || `${categoryName}, ${contentType.category}`;
  const tags = tagsRaw.split(",").map(t => t.trim().toLowerCase()).filter(Boolean);

  const category = (metaRaw?.match(/CATEGORY:\s*(.*)/i)?.[1] || contentType.category).trim().toLowerCase();

  // 13) Calculate reading time
  const readingTime = calculateReadingTime(articleHtml);
  const wordCount = articleHtml.replace(/<[^>]*>/g, " ").trim().split(/\s+/).length;

  // 14) Create BlogPost
  const blogPost = await prisma.blogPost.create({
    data: {
      title: baseTitle, slug, contentHtml: articleHtml, excerpt,
      featuredImage: productImage, imageUrl: productImage,
      metaTitle, metaDescription: metaDesc, keywords,
      language: "en", source: "autoblog", category, tags,
      published: true, publishedAt: new Date(),
      aiModel: CONFIG.AI_MODEL, aiPromptHash: promptHash,
      sellerId: seller.id, productId: product.id,
    },
  });

  console.log(`✅ BlogPost created: ${blogPost.slug} (ID: ${blogPost.id})`);
  console.log(`   Type: ${contentType.type} | Words: ~${wordCount} | Reading: ${readingTime} min`);

  // 15) Create SeoPage
  try {
    await prisma.seoPage.upsert({
      where: { slug },
      create: { type: "blog", title: metaTitle, slug, contentHtml: `<p>${excerpt}</p>`, metaTitle, metaDescription: metaDesc, published: true, publishedAt: new Date() },
      update: { metaTitle, metaDescription: metaDesc, updatedAt: new Date() },
    });
  } catch (err) { console.log("⚠️ SeoPage creation skipped"); }

  // 16) Create internal links
  try {
    await prisma.internalLink.createMany({
      data: [
        { fromSlug: `/blog/${slug}`, toSlug: `/sellers/${seller.slug}`, anchorText: seller.storeName, linkType: "contextual" },
        { fromSlug: `/blog/${slug}`, toSlug: `/products/${product.id}`, anchorText: product.name, linkType: "contextual" },
      ],
      skipDuplicates: true,
    });
  } catch (err) { console.log("⚠️ Some internal links may exist"); }

  // 17) Ping indexers
  await pingIndexers(`${CONFIG.BASE_URL}/sitemap.xml`);
  console.log("🔔 Search engines pinged");

  return { sellerId: seller.id, productId: product.id, slug, created: true, contentType: contentType.type, wordCount };
}

// =============================================================================
// BATCH GENERATION
// =============================================================================
export async function runAutoblogBatch(count: number = CONFIG.POSTS_PER_DAY): Promise<AutoblogOutcome[]> {
  console.log(`📝 Starting batch: ${count} posts (Gemini)...`);
  const results: AutoblogOutcome[] = [];
  for (let i = 0; i < count; i++) {
    try {
      if (i > 0) await sleep(CONFIG.DELAY_BETWEEN_POSTS_MS);
      const result = await runAutoblogOnce();
      results.push(result);
      if (!result.created && result.reason?.includes("daily_limit")) break;
    } catch (err: any) {
      console.error(`❌ Error on post ${i + 1}:`, err.message);
      results.push({ sellerId: 0, slug: "", created: false, reason: err.message });
    }
  }
  const created = results.filter(r => r.created).length;
  console.log(`✅ Batch complete: ${created}/${count} posts`);
  return results;
}

// =============================================================================
// HEALTH CHECK
// =============================================================================
export async function autoblogHealthCheck() {
  const details: Record<string, any> = {};
  try {
    details.geminiKey = !!process.env.GEMINI_API_KEY;
    details.model = CONFIG.AI_MODEL;
    details.totalPosts = await prisma.blogPost.count();
    const todayCount = await getTodayPostCount();
    details.todayPosts = todayCount;
    details.dailyLimit = CONFIG.POSTS_PER_DAY;
    details.canGenerate = todayCount < CONFIG.POSTS_PER_DAY;
    const recentIds = await getRecentProductIds();
    details.availableProducts = await prisma.product.count({
      where: { isActive: true, id: { notIn: recentIds.length > 0 ? recentIds : [-1] } },
    });
    if (!details.geminiKey) return { status: "unhealthy" as const, details };
    if (details.availableProducts < 10 || !details.canGenerate) return { status: "degraded" as const, details };
    return { status: "healthy" as const, details };
  } catch (err: any) {
    details.error = err.message;
    return { status: "unhealthy" as const, details };
  }
}

export { CONFIG as AUTOBLOG_CONFIG };
