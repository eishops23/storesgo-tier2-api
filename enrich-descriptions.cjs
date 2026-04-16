/**
 * StoresGo — Enrich Condom Product Descriptions via Gemini
 * ==========================================================
 * Generates SEO-rich 300+ word descriptions for all 55 condom products.
 *
 * Usage:
 *   GEMINI_API_KEY=xxx node enrich-descriptions.cjs
 *   GEMINI_API_KEY=xxx node enrich-descriptions.cjs --dry-run
 *   GEMINI_API_KEY=xxx node enrich-descriptions.cjs --start 10   # resume from product #10
 */

const https = require('https');
const http = require('http');
const { Client } = require('pg');

const SELLER_ID = 312;
const DRY_RUN = process.argv.includes('--dry-run');
const START_AT = parseInt(process.argv.find((a, i) => process.argv[i - 1] === '--start') || '0');
const DB = 'postgresql://postgres:storesgo123@localhost:5432/storesgo';
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-2.0-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`;

const MEILI_HOST = 'http://localhost:7700';
const MEILI_KEY = 'ff6c780c6c9cfd9156cd7831e86a49b21cbde1ece9d55dc9b2fcb11ef8b63482';

const MIN_WORDS = 300;

function log(msg) { console.log(`[${new Date().toISOString().slice(11, 19)}] ${msg}`); }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function wordCount(s) { return s ? s.trim().split(/\s+/).length : 0; }

function buildPrompt(product) {
  return `You are an expert e-commerce copywriter for StoresGo, a premium online marketplace. Write a detailed, SEO-optimized product description for:

Product: ${product.name}
Brand: ${product.brand || product.name.split(' ')[0]}
UPC: ${product.sku}
Price: $${(product.priceCents / 100).toFixed(2)}
Category: Condoms > Sexual Wellness > Health & Wellness

Requirements:
- Write EXACTLY in plain text (no markdown, no bullet points, no headers, no HTML)
- Minimum 300 words, maximum 400 words
- Write in third person ("This product..." not "you")  
- First paragraph: Product overview, what makes it unique, key selling points
- Second paragraph: Materials, technology, and construction details (latex vs non-latex, thickness, lubricant type, etc.)
- Third paragraph: Who this product is ideal for, use cases, size/fit information
- Fourth paragraph: Safety, testing standards, STI/pregnancy protection, HSA/FSA eligibility
- Fifth paragraph: Brand trust, heritage, and why customers choose this product on StoresGo
- Naturally include these SEO keywords where appropriate: condoms, protection, lubricated, safe sex, sensitivity, pleasure, latex-free (if applicable), STI prevention
- Do NOT include the product name as the first words
- Do NOT use marketing fluff like "game-changer" or "revolutionary" 
- Do NOT include any disclaimers, warnings, or legal text
- Write factually and professionally
- Mention that this product is available for fast delivery through StoresGo in South Florida

Output ONLY the description text, nothing else.`;
}

async function callGemini(prompt) {
  const body = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1024,
    },
  });

  return new Promise((resolve, reject) => {
    const url = new URL(GEMINI_URL);
    const req = https.request({
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
      timeout: 30000,
    }, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        try {
          const data = JSON.parse(Buffer.concat(chunks).toString());
          if (data.error) {
            reject(new Error(data.error.message || JSON.stringify(data.error)));
            return;
          }
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (!text) reject(new Error('No text in response'));
          else resolve(text.trim());
        } catch (e) { reject(e); }
      });
      res.on('error', reject);
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    req.write(body);
    req.end();
  });
}

async function main() {
  if (!GEMINI_KEY) {
    console.error('ERROR: Set GEMINI_API_KEY environment variable');
    console.error('  GEMINI_API_KEY=your-key-here node enrich-descriptions.cjs');
    process.exit(1);
  }

  const client = new Client(DB);
  await client.connect();
  log(`Connected (${DRY_RUN ? 'DRY RUN' : 'LIVE'})`);

  const { rows: products } = await client.query(`
    SELECT id, name, sku, description, "priceCents"
    FROM products WHERE "sellerId" = $1 AND "isActive" = true
    ORDER BY name
  `, [SELLER_ID]);

  // Filter to only thin descriptions (under 300 words)
  const thin = products.filter(p => wordCount(p.description) < MIN_WORDS);

  log(`${products.length} total products, ${thin.length} have thin descriptions (< ${MIN_WORDS} words)`);
  if (!thin.length) { log('All descriptions are already 300+ words!'); await client.end(); return; }

  let ok = 0, fail = 0, skipped = 0;
  const failures = [];

  for (let i = 0; i < thin.length; i++) {
    if (i < START_AT) { skipped++; continue; }

    const p = thin[i];
    const currentWords = wordCount(p.description);
    log(`[${i + 1}/${thin.length}] ${p.name} (${currentWords} words)`);

    try {
      const prompt = buildPrompt(p);
      const description = await callGemini(prompt);
      const newWords = wordCount(description);

      if (newWords < 200) {
        throw new Error(`Generated only ${newWords} words — too short, retrying`);
      }

      if (DRY_RUN) {
        log(`  ✅ [DRY] ${newWords} words`);
        log(`  Preview: ${description.substring(0, 120)}...`);
        ok++;
        await sleep(500);
        continue;
      }

      // Update DB
      await client.query(`
        UPDATE products SET description = $1, "updatedAt" = NOW() WHERE id = $2
      `, [description, p.id]);

      log(`  ✅ ${currentWords} → ${newWords} words`);
      ok++;

    } catch (err) {
      // Retry once
      try {
        log(`  ⚠️ Retrying: ${err.message}`);
        await sleep(2000);
        const description = await callGemini(buildPrompt(p));
        const newWords = wordCount(description);

        if (!DRY_RUN && newWords >= 200) {
          await client.query(`UPDATE products SET description = $1, "updatedAt" = NOW() WHERE id = $2`, [description, p.id]);
          log(`  ✅ (retry) ${currentWords} → ${newWords} words`);
          ok++;
        } else if (DRY_RUN) {
          log(`  ✅ [DRY retry] ${newWords} words`);
          ok++;
        } else {
          throw new Error(`Retry got ${newWords} words`);
        }
      } catch (retryErr) {
        fail++;
        failures.push({ name: p.name, error: retryErr.message });
        log(`  ❌ ${retryErr.message}`);
      }
    }

    // Rate limit: Gemini free tier is 15 RPM, so ~4s between calls
    await sleep(4200);
  }

  // Meilisearch sync
  if (!DRY_RUN && ok > 0) {
    log('\nSyncing to Meilisearch...');
    try {
      const { rows } = await client.query(`
        SELECT id, name, slug, description, "priceCents", "imageUrl", sku, status, "isActive"
        FROM products WHERE "sellerId" = $1
      `, [SELLER_ID]);
      const body = JSON.stringify(rows.map(r => ({
        id: r.id, name: r.name, slug: r.slug, description: r.description || '',
        priceCents: r.priceCents, imageUrl: r.imageUrl || '', sku: r.sku || '',
        status: r.status, isActive: r.isActive, sellerId: SELLER_ID,
      })));
      const req = http.request(`${MEILI_HOST}/indexes/products/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${MEILI_KEY}`, 'Content-Length': Buffer.byteLength(body) },
      }, res => { let d = ''; res.on('data', c => d += c); res.on('end', () => log(`  Meilisearch: ${res.statusCode}`)); });
      req.on('error', e => log(`  Meilisearch: ${e.message}`));
      req.write(body); req.end();
      await sleep(2000);
    } catch (e) { log(`  Meilisearch failed: ${e.message}`); }
  }

  log('\n═══════════════════════════════════════════════════════════');
  log(`  Done: ${ok} enriched, ${fail} failed, ${skipped} skipped`);
  log('═══════════════════════════════════════════════════════════');
  if (failures.length) {
    log('\nFailed:');
    failures.forEach(f => log(`  ${f.name} — ${f.error}`));
  }

  await client.end();
}

main().catch(err => { console.error('FATAL:', err); process.exit(1); });
