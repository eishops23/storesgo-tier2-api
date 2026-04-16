/**
 * StoresGo — Target Product Page Image Scraper → OCI
 * =====================================================
 * Two-step approach:
 *   1. Search Target by product name → find product page URL
 *   2. Fetch product page → extract real GUEST_ image ID
 *   3. Download from target.scene7.com → upload to OCI
 *
 * Usage:
 *   node target-images-v2.cjs              # full run
 *   node target-images-v2.cjs --dry-run    # preview only
 */

const https = require('https');
const http = require('http');
const { Client } = require('pg');

const SELLER_ID = 312;
const DRY_RUN = process.argv.includes('--dry-run');
const DB = 'postgresql://postgres:storesgo123@localhost:5432/storesgo';

const OCI_REGION = 'us-ashburn-1';
const OCI_NAMESPACE = 'idfzjtd1dz5w';
const OCI_BUCKET = 'storesgo-images';
const OCI_ACCESS_KEY = '5a11ceb9e7cd6ef5e2f21dae373d302faf907fab';
const OCI_SECRET_KEY = 'XlZs+ME7rjsJC/PD+IY0P+l4FoeDsjPTRH1PCWJ1JR4=';
const OCI_ENDPOINT = `https://${OCI_NAMESPACE}.compat.objectstorage.${OCI_REGION}.oraclecloud.com`;
const OCI_PUBLIC_BASE = `https://objectstorage.${OCI_REGION}.oraclecloud.com/n/${OCI_NAMESPACE}/b/${OCI_BUCKET}/o`;

const MEILI_HOST = 'http://localhost:7700';
const MEILI_KEY = 'ff6c780c6c9cfd9156cd7831e86a49b21cbde1ece9d55dc9b2fcb11ef8b63482';

// Known generic/template GUEST_ IDs to skip (appear on all Target pages)
const SKIP_GUEST_IDS = new Set([
  'GUEST_d85877b3-84dc-45f7-b53a-e78553da8c1d', // Target nav/template
  'GUEST_af111737-788c-45e5-90b1-d37a5f23d392', // HSA/FSA badge
  'GUEST_ea95a518-40ae-4b40-acef-aecb46c90d70', // Latex-Free badge
]);

let s3Client, PutObjectCommand;

function log(msg) { console.log(`[${new Date().toISOString().slice(11, 19)}] ${msg}`); }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function makeSlug(name) {
  return name.toLowerCase()
    .replace(/['']/g, '').replace(/&/g, 'and').replace(/\./g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
    .substring(0, 120);
}

async function initOci() {
  const sdk = require('@aws-sdk/client-s3');
  s3Client = new sdk.S3Client({
    region: OCI_REGION, endpoint: OCI_ENDPOINT,
    credentials: { accessKeyId: OCI_ACCESS_KEY, secretAccessKey: OCI_SECRET_KEY },
    forcePathStyle: true,
  });
  PutObjectCommand = sdk.PutObjectCommand;
  log('OCI S3 client initialized');
}

function httpGet(url, opts = {}) {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http;
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept': opts.accept || 'text/html,application/xhtml+xml,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      ...(opts.headers || {}),
    };
    const req = proto.get(url, { headers, timeout: 25000 }, (res) => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
        let redir = res.headers.location;
        if (redir.startsWith('/')) { const u = new URL(url); redir = `${u.protocol}//${u.host}${redir}`; }
        return httpGet(redir, opts).then(resolve).catch(reject);
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(chunks), headers: res.headers }));
      res.on('error', reject);
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

async function uploadToOci(buffer, key, contentType) {
  await s3Client.send(new PutObjectCommand({
    Bucket: OCI_BUCKET, Key: key, Body: buffer,
    ContentType: contentType, ACL: 'public-read',
  }));
  return `${OCI_PUBLIC_BASE}/${encodeURIComponent(key)}`;
}

// Step 1: Search Target → find product page URL
function findProductUrl(html) {
  // Look for product page links: /p/product-name/-/A-12345678
  const matches = html.match(/\/p\/[a-z0-9-]+\/-\/A-\d+/gi);
  if (matches && matches.length > 0) {
    // Deduplicate and return the first product URL
    const unique = [...new Set(matches)];
    return `https://www.target.com${unique[0]}`;
  }
  return null;
}

// Step 2: Extract GUEST_ product image from product page
function extractProductImage(html) {
  // Find ALL GUEST_ UUIDs
  const allMatches = html.match(/GUEST_[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/g) || [];
  
  // Deduplicate
  const unique = [...new Set(allMatches)];
  
  // Filter out known generic/template IDs
  const productImages = unique.filter(id => !SKIP_GUEST_IDS.has(id));
  
  if (productImages.length > 0) {
    // The first non-generic GUEST_ ID is typically the main product image
    return `https://target.scene7.com/is/image/Target/${productImages[0]}?wid=1500&hei=1500&fmt=pjpeg`;
  }
  return null;
}

// Complete flow: search Target → find page → extract image
async function getTargetImage(productName, sku) {
  // Try multiple search strategies
  const searches = [
    // Strategy 1: Full product name without count
    productName.replace(/\s*-\s*\d+ct$/i, ''),
    // Strategy 2: UPC
    sku,
    // Strategy 3: Shorter name
    productName.replace(/\s*-\s*\d+ct$/i, '').substring(0, 35),
  ];

  for (const query of searches) {
    try {
      // Search Target
      const searchUrl = `https://www.target.com/s?searchTerm=${encodeURIComponent(query)}`;
      const searchRes = await httpGet(searchUrl);
      if (searchRes.status !== 200) continue;
      
      const searchHtml = searchRes.body.toString('utf8');
      
      // Find product page URL
      const productUrl = findProductUrl(searchHtml);
      if (!productUrl) continue;
      
      log(`    Found page: ${productUrl.substring(0, 70)}...`);
      await sleep(500); // Rate limit
      
      // Fetch product page
      const pageRes = await httpGet(productUrl);
      if (pageRes.status !== 200) continue;
      
      const pageHtml = pageRes.body.toString('utf8');
      
      // Extract image
      const imageUrl = extractProductImage(pageHtml);
      if (imageUrl) return imageUrl;
      
    } catch (e) {
      // Try next strategy
      continue;
    }
  }
  
  return null;
}

// ═══════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════
async function main() {
  const client = new Client(DB);
  await client.connect();
  log(`Connected (${DRY_RUN ? 'DRY RUN' : 'LIVE'})`);

  if (!DRY_RUN) await initOci();

  const { rows: products } = await client.query(`
    SELECT id, name, sku, "imageUrl"
    FROM products WHERE "sellerId" = $1 AND "isActive" = true
    AND ("imageUrl" NOT LIKE '%oraclecloud.com%' OR "imageUrl" IS NULL)
    ORDER BY name
  `, [SELLER_ID]);

  log(`${products.length} products need images\n`);
  if (!products.length) { log('All done!'); await client.end(); return; }

  let ok = 0, fail = 0;
  const failures = [];
  const imageMap = new Map(); // Track which GUEST_ IDs we've found per product

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    log(`[${i + 1}/${products.length}] ${p.name}`);

    try {
      const targetUrl = await getTargetImage(p.name, p.sku);
      if (!targetUrl) throw new Error('No product image found on Target');

      // Log the unique GUEST_ ID for verification
      const guestId = targetUrl.match(/GUEST_[a-f0-9-]+/)?.[0] || 'unknown';
      imageMap.set(p.name, guestId);

      if (DRY_RUN) {
        log(`  ✅ [DRY] ${guestId}`);
        ok++;
        await sleep(1500);
        continue;
      }

      // Download
      const imgRes = await httpGet(targetUrl, { accept: 'image/*' });
      if (imgRes.status !== 200) throw new Error(`scene7 HTTP ${imgRes.status}`);
      if (imgRes.body.length < 5000) throw new Error(`Too small: ${imgRes.body.length}b`);

      // Upload to OCI
      const slug = makeSlug(p.name);
      const key = `products/condoms/${slug}.jpg`;
      const ociUrl = await uploadToOci(imgRes.body, key, 'image/jpeg');

      // Update DB
      await client.query(`
        UPDATE products SET "imageUrl" = $1, "sourceImageUrl" = $2, "updatedAt" = NOW()
        WHERE id = $3
      `, [ociUrl, targetUrl, p.id]);

      log(`  ✅ ${guestId} (${(imgRes.body.length / 1024).toFixed(0)} KB)`);
      ok++;

    } catch (err) {
      fail++;
      failures.push({ name: p.name, sku: p.sku, error: err.message || String(err) });
      log(`  ❌ ${err.message || err}`);
    }

    await sleep(1500); // Rate limit between products
  }

  // Meilisearch sync
  if (!DRY_RUN && ok > 0) {
    log('\nSyncing to Meilisearch...');
    try {
      const { rows } = await client.query(`
        SELECT id, name, slug, description, "priceCents", "imageUrl", sku, status, "isActive"
        FROM products WHERE "sellerId" = $1
      `, [SELLER_ID]);
      const body = JSON.stringify(rows.map(p => ({
        id: p.id, name: p.name, slug: p.slug, description: p.description || '',
        priceCents: p.priceCents, imageUrl: p.imageUrl || '', sku: p.sku || '',
        status: p.status, isActive: p.isActive, sellerId: SELLER_ID,
      })));
      const req = http.request(`${MEILI_HOST}/indexes/products/documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${MEILI_KEY}`,
          'Content-Length': Buffer.byteLength(body),
        },
      }, res => { let d = ''; res.on('data', c => d += c); res.on('end', () => log(`  Meilisearch: ${res.statusCode}`)); });
      req.on('error', e => log(`  Meilisearch error: ${e.message}`));
      req.write(body); req.end();
      await sleep(2000);
    } catch (e) { log(`  Meilisearch failed: ${e.message}`); }
  }

  // Summary
  log('\n═══════════════════════════════════════════════════════════');
  log(`  Done: ${ok} uploaded, ${fail} failed`);
  log('═══════════════════════════════════════════════════════════');

  // Show unique image IDs found
  const uniqueImages = new Set([...imageMap.values()]);
  log(`\nUnique images found: ${uniqueImages.size} (for ${imageMap.size} products)`);

  if (failures.length) {
    log('\nFailed:');
    failures.forEach(f => log(`  ${f.name} (${f.sku}) — ${f.error}`));
  }

  await client.end();
}

main().catch(err => { console.error('FATAL:', err); process.exit(1); });
