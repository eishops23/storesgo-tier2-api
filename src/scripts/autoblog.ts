/* eslint-disable */
/**
 * ======================================================
 * 🤖 STORESGO AI AUTOBLOGGER — FIXED (PHASE 13 + PRISMA PATCH)
 * Fully functional daily SEO blog generator using OpenAI + Prisma
 * Compatible with product/category models in your existing schema
 * ======================================================
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import OpenAI from "openai";
import axios from "axios";
import slugify from "slugify";
import crypto from "crypto";

const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

/* ------------------------------------------------------
   🌍 CONFIGURATION
------------------------------------------------------ */
const BASE_URL = process.env.PUBLIC_BASE_URL || "https://storesgo.com";
const INDEXNOW_KEY = process.env.INDEXNOW_API_KEY || "";
const INDEXNOW_ENABLED = process.env.INDEXNOW_ENABLED === "true";
const PING_SEARCH_ENGINES = process.env.PING_SEARCH_ENGINES === "true";
const AUTOBLOG_MAX_POSTS = parseInt(process.env.AUTOBLOG_MAX_POSTS || "3", 10);
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o";
const OPENAI_MODEL_LIGHT = process.env.OPENAI_MODEL_LIGHT || "gpt-4o-mini";
const EMBED_MODEL = process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-large";

/* ------------------------------------------------------
   🚀 MAIN ENTRY — DAILY AI BLOG GENERATOR
------------------------------------------------------ */
export async function runAutoblog() {
  console.log("🧠 Starting StoresGo Daily Autoblog...");

  /* ✅ SAFELY FETCH DATA (handles missing models gracefully) */
  let categories: any[] = [];
  let products: any[] = [];

  try {
    if ((prisma as any).taxonomy?.findMany) {
      categories = await (prisma as any).taxonomy.findMany({
        orderBy: { updatedAt: "desc" },
        take: 5,
      });
    } else {
      console.warn("⚠️ No taxonomy model found — skipping categories.");
    }
  } catch (err) {
    console.warn("⚠️ Category fetch failed:", err);
  }

  try {
    // use the correct model name based on your schema
    const modelName =
      (prisma as any).product
        ? "product"
        : (prisma as any).products
        ? "products"
        : null;

    if (!modelName) throw new Error("No Product model found in Prisma Client.");

    products = await (prisma as any)[modelName].findMany({
      where: { isActive: true },
      orderBy: { updatedAt: "desc" },
      take: 10,
      include: { seller: true },
    });
  } catch (err) {
    console.warn("⚠️ Product fetch failed:", err);
  }

  if (!categories.length && !products.length) {
    console.log("⚠️ No categories or products found. Exiting autoblog run.");
    return;
  }

  /* 🧩 CREATE CONTEXT FOR OPENAI */
  const context = `
You are an expert SEO content writer for an online ethnic marketplace called StoresGo.
Write engaging, long-form, human-like blog posts about ethnic food, groceries, and lifestyle.
Keep the tone conversational, rich, and authentic.

Trending Categories: ${categories.map((c) => c.title || c.name).join(", ")}
Popular Products: ${products.map((p) => p.name).join(", ")}
`;

  /* 🧠 GENERATE TOPIC IDEAS */
  const topicResp = await openai.chat.completions.create({
    model: OPENAI_MODEL_LIGHT,
    messages: [
      {
        role: "system",
        content:
          "Generate 3 catchy, SEO-optimized blog titles for an ethnic grocery marketplace.",
      },
      { role: "user", content: context },
    ],
  });

  const titles = topicResp.choices[0].message.content
    ?.split("\n")
    .map((t) => t.replace(/^[-*\d.]+\s*/, "").trim())
    .filter(Boolean)
    .slice(0, AUTOBLOG_MAX_POSTS);

  if (!titles?.length) {
    console.log("⚠️ No blog titles returned by OpenAI.");
    return;
  }

  /* 🪶 CREATE EACH POST */
  for (const title of titles) {
    const slug = slugify(title, { lower: true, strict: true, trim: true });
    const existing = await prisma.blogPost.findUnique({ where: { slug } });
    if (existing) {
      console.log(`⏩ Skipping existing slug: ${slug}`);
      continue;
    }

    console.log(`📝 Generating blog: ${title}`);

    // ✍️ Generate article
    const articleResp = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are an SEO writer for a multicultural grocery marketplace.",
        },
        {
          role: "user",
          content: `Write a 1000–1200 word article titled "${title}".
Include H2/H3 sections, product mentions, cultural context, and end with a strong call-to-action.`,
        },
      ],
      temperature: 0.8,
    });

    const contentHtml =
      articleResp.choices[0]?.message?.content?.trim() ||
      "<p>Content unavailable.</p>";

    // 🏷️ Meta tags
    const metaResp = await openai.chat.completions.create({
      model: OPENAI_MODEL_LIGHT,
      messages: [
        {
          role: "system",
          content:
            "Generate meta_title (≤60 chars) and meta_description (≤160 chars).",
        },
        { role: "user", content: contentHtml },
      ],
    });

    const metaLines =
      metaResp.choices[0].message.content
        ?.split("\n")
        .map((l) => l.replace(/^[-*]/, "").trim()) || [];
    const metaTitle = metaLines[0] || title;
    const metaDescription = metaLines[1] || contentHtml.slice(0, 150);

    // 🧩 Store SEO + Blog
    await prisma.seoPage.upsert({
      where: { slug },
      update: {
        title,
        metaTitle,
        metaDescription,
        contentHtml,
        published: true,
        updatedAt: new Date(),
      },
      create: {
        title,
        slug,
        metaTitle,
        metaDescription,
        contentHtml,
        published: true,
      },
    });

    const post = await prisma.blogPost.create({
      data: {
        title,
        slug,
        contentHtml,
        metaTitle,
        metaDescription,
        published: true,
        publishedAt: new Date(),
        source: "autoblog",
      },
    });

    // 🔢 Embeddings
    const textForEmbedding = `${title}\n${metaDescription}\n${contentHtml}`;
    const embedResp = await openai.embeddings.create({
      model: EMBED_MODEL,
      input: textForEmbedding,
    });
    const vector = embedResp.data[0].embedding;

    // ✅ Fixed Prisma v6+ compatible AI Log
    try {
      await prisma.aICategoryLog.create({
        data: {
          product: undefined, // explicitly skip relation
          promptHash: crypto.createHash("sha256").update(slug).digest("hex"),
          resultJson: { title, metaDescription },
          confidence: 1.0,
          chosenSlug: slug,
        },
      });
    } catch (err: any) {
      console.warn("⚠️ Skipping AI log creation:", err.message);
    }

    try {
      await prisma.$executeRawUnsafe(`
        UPDATE "SeoPage" SET embedding = '${JSON.stringify(
          vector
        )}'::vector WHERE slug = '${slug}';
      `);
    } catch {
      console.warn("⚠️ Skipping pgvector storage (not active).");
    }

    // 🔗 Ping + IndexNow
    if (PING_SEARCH_ENGINES) {
      await pingSearchEngines(`${BASE_URL}/blog/${slug}`);
    }
    if (INDEXNOW_ENABLED && INDEXNOW_KEY) {
      await submitIndexNow(`${BASE_URL}/blog/${slug}`);
    }

    console.log(`✅ Created blog & SEO page: ${slug}`);
  }

  console.log("🎯 Autoblog run complete!");
}

/* ------------------------------------------------------
   🔗 UTILITIES
------------------------------------------------------ */
async function pingSearchEngines(url: string) {
  const list = (process.env.SEARCH_ENGINES || "")
    .split(",")
    .filter(Boolean);
  for (const engine of list) {
    const endpoint = `${engine}${encodeURIComponent(url)}`;
    try {
      await axios.get(endpoint);
      console.log(`🔗 Pinged: ${endpoint}`);
    } catch {
      console.warn(`⚠️ Failed ping: ${endpoint}`);
    }
  }
}

async function submitIndexNow(url: string) {
  try {
    await axios.post(
      process.env.INDEXNOW_ENDPOINT || "https://api.indexnow.org/indexnow",
      {
        host: BASE_URL.replace(/^https?:\/\//, ""),
        key: INDEXNOW_KEY,
        urlList: [url],
      }
    );
    console.log(`📤 Submitted IndexNow for ${url}`);
  } catch {
    console.warn("⚠️ IndexNow submission failed.");
  }
}

/* ------------------------------------------------------
   🏁 EXECUTION
------------------------------------------------------ */
if (process.argv[1]?.includes("autoblog")) {
  runAutoblog()
    .catch((err) => {
      console.error("❌ Autoblog failed:", err);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
