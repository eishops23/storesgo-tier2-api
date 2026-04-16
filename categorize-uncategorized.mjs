#!/usr/bin/env node
import pg from "pg";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, ".env") });

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const flagVal = (name, fallback) => {
  const a = args.find((a) => a.startsWith(`--${name}=`));
  return a ? a.split("=")[1] : fallback;
};

const DRY_RUN = flag("dry-run");
const BATCH_SIZE = Math.min(parseInt(flagVal("batch-size", "50")), 75);
const LIMIT = flagVal("limit", null);
const SELLER_FILTER = flagVal("seller", null);
const ALL_SELLERS = flag("all-sellers");
const CONCURRENCY = Math.min(parseInt(flagVal("concurrency", "2")), 5);

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) { console.error("GEMINI_API_KEY not found in .env"); process.exit(1); }

const GEMINI_MODEL = "gemini-2.0-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function callGemini(systemPrompt, userContent, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(GEMINI_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            { role: "user", parts: [{ text: userContent }] }
          ],
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig: {
            temperature: 0.15,
            maxOutputTokens: 8192,
            responseMimeType: "application/json",
          },
        }),
      });

      if (res.status === 429) {
        const wait = attempt * 15;
        console.warn(`  Rate limited, waiting ${wait}s (attempt ${attempt}/${retries})`);
        await sleep(wait * 1000);
        continue;
      }

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Gemini ${res.status}: ${err.slice(0, 300)}`);
      }

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "{}";
      const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      return JSON.parse(cleaned);
    } catch (err) {
      if (attempt === retries) throw err;
      console.warn(`  Attempt ${attempt} failed: ${err.message}. Retrying in ${attempt * 3}s...`);
      await sleep(attempt * 3000);
    }
  }
}

function buildCategoryTree(categories) {
  const parents = categories.filter((c) => !c.parentId);
  const children = categories.filter((c) => c.parentId);
  const childMap = {};
  children.forEach((c) => {
    if (!childMap[c.parentId]) childMap[c.parentId] = [];
    childMap[c.parentId].push(c);
  });
  const lines = [];
  for (const parent of parents.sort((a, b) => a.name.localeCompare(b.name))) {
    const kids = childMap[parent.id] || [];
    if (kids.length > 0) {
      const kidList = kids.sort((a, b) => a.name.localeCompare(b.name)).map((k) => `${k.id}:${k.slug}`).join(", ");
      lines.push(`${parent.id}:${parent.slug} (${parent.name}) -> subs: [${kidList}]`);
    } else {
      lines.push(`${parent.id}:${parent.slug} (${parent.name})`);
    }
  }
  return lines.join("\n");
}

async function main() {
  console.log("StoresGo Bulk AI Product Categorizer");
  console.log("====================================");
  console.log(`Mode:        ${DRY_RUN ? "DRY RUN" : "LIVE"}`);
  console.log(`Batch size:  ${BATCH_SIZE}`);
  console.log(`Concurrency: ${CONCURRENCY}`);
  console.log(`Model:       ${GEMINI_MODEL}`);
  if (LIMIT) console.log(`Limit:       ${LIMIT}`);
  console.log("");

  const { rows: categories } = await pool.query(
    `SELECT id, name, slug, "parentId" FROM categories ORDER BY "parentId" NULLS FIRST, name`
  );
  if (!categories.length) { console.error("No categories found"); process.exit(1); }

  const catById = {};
  categories.forEach((c) => { catById[c.id] = c; });

  const categoryTree = buildCategoryTree(categories);
  const parentCount = categories.filter((c) => !c.parentId).length;
  const childCount = categories.filter((c) => c.parentId).length;
  console.log(`Loaded ${categories.length} categories (${parentCount} parents, ${childCount} subcategories)`);

  let sellerClause = "";
  let sellerValues = [];
  if (!ALL_SELLERS) {
    const sellerName = SELLER_FILTER || "Mega Groceries";
    const { rows: sellers } = await pool.query(
      `SELECT id, "storeName" FROM sellers WHERE "storeName" ILIKE $1 LIMIT 1`,
      [`%${sellerName}%`]
    );
    if (sellers.length) {
      sellerClause = `AND p."sellerId" = $1`;
      sellerValues = [sellers[0].id];
      console.log(`Targeting seller: ${sellers[0].storeName} (ID: ${sellers[0].id})`);
    } else {
      console.warn(`Seller "${sellerName}" not found, processing all sellers`);
    }
  } else {
    console.log("Targeting ALL sellers");
  }

  const limitClause = LIMIT ? `LIMIT ${parseInt(LIMIT)}` : "";
  const { rows: products } = await pool.query(
    `SELECT id, name, description FROM products p WHERE status = 'approved' AND category_id IS NULL ${sellerClause} ORDER BY id ${limitClause}`,
    sellerValues
  );
  console.log(`Found ${products.length.toLocaleString()} uncategorized products\n`);
  if (!products.length) { console.log("Nothing to do!"); await pool.end(); return; }

  const systemPrompt = `You are a grocery product categorizer for StoresGo, a multi-vendor ethnic grocery marketplace.

TASK: Given a numbered list of products, assign each to the BEST matching category ID from the taxonomy below. Always prefer the most SPECIFIC subcategory over a broad parent.

CATEGORY TAXONOMY (format: ID:slug (Display Name)):
${categoryTree}

RULES:
- Use the category ID (integer) as the value, NOT the slug
- Pick the most specific subcategory that fits
- For ethnic/cultural foods, prefer the ethnic category over generic ones
- If NO category is a reasonable fit, use null
- Pet food goes to Pet Supplies, not Food categories
- Fragrances means perfumes/colognes ONLY, not scented soap or lotion

Respond with ONLY a JSON object. Keys are product IDs as strings, values are category IDs as integers or null.
Example: {"12345": 3321, "12346": 2664, "12347": null}`;

  const totalBatches = Math.ceil(products.length / BATCH_SIZE);
  let totalCategorized = 0;
  let totalSkipped = 0;
  let totalErrors = 0;
  const startTime = Date.now();

  for (let i = 0; i < products.length; i += BATCH_SIZE * CONCURRENCY) {
    const batchGroup = [];
    for (let j = 0; j < CONCURRENCY && i + j * BATCH_SIZE < products.length; j++) {
      const start = i + j * BATCH_SIZE;
      const batch = products.slice(start, start + BATCH_SIZE);
      const batchNum = Math.floor(start / BATCH_SIZE) + 1;
      batchGroup.push({ batch, batchNum });
    }

    const results = await Promise.allSettled(
      batchGroup.map(async ({ batch, batchNum }) => {
        const productLines = batch.map((p) => `${p.id}: ${p.name}`).join("\n");
        console.log(`Batch ${batchNum}/${totalBatches} (${batch.length} products)...`);
        const result = await callGemini(systemPrompt, productLines);
        const updates = [];
        let skipped = 0;
        for (const product of batch) {
          const catId = result[String(product.id)];
          if (catId === null || catId === undefined) { skipped++; continue; }
          if (!catById[catId]) {
            console.warn(`  Product ${product.id}: invalid category ID ${catId}`);
            skipped++;
            continue;
          }
          updates.push({
            productId: product.id,
            categoryId: catId,
            categoryName: catById[catId].name,
            productName: product.name,
          });
        }
        if (!DRY_RUN && updates.length > 0) {
          const cases = updates.map((u) => `WHEN ${u.productId} THEN ${u.categoryId}`).join(" ");
          const ids = updates.map((u) => u.productId).join(",");
          await pool.query(
            `UPDATE products SET category_id = CASE id ${cases} END, "updatedAt" = NOW() WHERE id IN (${ids})`
          );
        }
        const samples = updates.slice(0, 3);
        for (const s of samples) {
          const shortName = s.productName.length > 45 ? s.productName.slice(0, 45) + "..." : s.productName;
          console.log(`  -> ${shortName} => ${s.categoryName}`);
        }
        if (updates.length > 3) console.log(`  ... +${updates.length - 3} more`);
        console.log(`  Result: ${updates.length} categorized, ${skipped} skipped`);
        return { categorized: updates.length, skipped };
      })
    );

    for (const r of results) {
      if (r.status === "fulfilled") {
        totalCategorized += r.value.categorized;
        totalSkipped += r.value.skipped;
      } else {
        totalErrors += BATCH_SIZE;
        console.error(`  Batch failed: ${r.reason?.message}`);
      }
    }

    const processed = Math.min(i + BATCH_SIZE * CONCURRENCY, products.length);
    const pct = ((processed / products.length) * 100).toFixed(1);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
    const rate = (processed / (elapsed || 1)).toFixed(1);
    console.log(`  Progress: ${pct}% (${processed}/${products.length}) ${elapsed}s elapsed ${rate} products/s\n`);

    if (i + BATCH_SIZE * CONCURRENCY < products.length) await sleep(1000);
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log("=".repeat(58));
  console.log("FINAL SUMMARY");
  console.log("=".repeat(58));
  console.log(`Total processed:    ${products.length.toLocaleString()}`);
  console.log(`Categorized:        ${totalCategorized.toLocaleString()}`);
  console.log(`Skipped:            ${totalSkipped.toLocaleString()}`);
  console.log(`Errors:             ${totalErrors.toLocaleString()}`);
  console.log(`Time:               ${elapsed}s`);
  console.log(`Mode:               ${DRY_RUN ? "DRY RUN" : "LIVE"}`);
  if (DRY_RUN) console.log("\nRun without --dry-run to apply changes.");

  if (!DRY_RUN) {
    const { rows: [{ count }] } = await pool.query(
      `SELECT COUNT(*) FROM products WHERE status='approved' AND category_id IS NULL ${sellerClause}`,
      sellerValues
    );
    console.log(`\nRemaining uncategorized: ${parseInt(count).toLocaleString()}`);
  }

  await pool.end();
  console.log("Done\n");
}

main().catch((err) => { console.error("Fatal:", err); process.exit(1); });
