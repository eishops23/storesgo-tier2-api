/**
 * StoresGo — Scrape Target Scene7 Images → Upload to OCI
 * ========================================================
 * 1. For each condom product, search Target by name
 * 2. Extract scene7 GUEST_ image UUID from the product page
 * 3. Download high-res image from target.scene7.com
 * 4. Upload to OCI Object Storage
 * 5. Update products.imageUrl in DB
 *
 * Usage:
 *   node target-images-oci.cjs              # full run
 *   node target-images-oci.cjs --dry-run    # preview only
 *   node target-images-oci.cjs --retry      # retry only failures
 */

const https = require('https');
const http = require('http');
const { Client } = require('pg');

const SELLER_ID = 312;
const DRY_RUN = process.argv.includes('--dry-run');
const RETRY_ONLY = process.argv.includes('--retry');
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

let s3Client, PutObjectCommand;

function log(msg) { console.log(`[${new Date().toISOString().slice(11, 19)}] ${msg}`); }

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
    const req = proto.get(url, { headers, timeout: 20000 }, (res) => {
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

// Extract first GUEST_ image ID from Target HTML
function extractGuestId(html) {
  const matches = html.match(/GUEST_[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/g);
  if (matches && matches.length > 0) {
    // Return first unique GUEST_ ID (usually the main product image)
    return matches[0];
  }
  return null;
}

// Search Target and get the scene7 image URL
async function findTargetImage(productName, sku) {
  // Strategy 1: Search Target by simplified product name
  const simpleName = productName
    .replace(/\s*-\s*\d+ct$/i, '')   // Remove "- 10ct"
    .replace(/Lubricated\s*/i, '')     // Simplify
    .replace(/Latex\s*/i, '')
    .trim();
  
  const searchUrl = `https://www.target.com/s?searchTerm=${encodeURIComponent(simpleName)}`;
  
  try {
    const res = await httpGet(searchUrl);
    if (res.status === 200) {
      const html = res.body.toString('utf8');
      const guestId = extractGuestId(html);
      if (guestId) {
        return `https://target.scene7.com/is/image/Target/${guestId}?wid=1500&hei=1500&fmt=pjpeg`;
      }
    }
  } catch (e) { /* try next strategy */ }

  // Strategy 2: Search by UPC
  try {
    const upcUrl = `https://www.target.com/s?searchTerm=${sku}`;
    const res = await httpGet(upcUrl);
    if (res.status === 200) {
      const html = res.body.toString('utf8');
      const guestId = extractGuestId(html);
      if (guestId) {
        return `https://target.scene7.com/is/image/Target/${guestId}?wid=1500&hei=1500&fmt=pjpeg`;
      }
    }
  } catch (e) { /* try next strategy */ }

  // Strategy 3: Search by brand + key words
  const brand = productName.match(/^(Trojan|SKYN|Durex|LELO|LifeStyles)/i)?.[1] || '';
  const shortName = productName.replace(/\s*-\s*\d+ct$/i, '').substring(0, 40);
  try {
    const brandUrl = `https://www.target.com/s?searchTerm=${encodeURIComponent(shortName)}`;
    const res = await httpGet(brandUrl);
    if (res.status === 200) {
      const html = res.body.toString('utf8');
      const guestId = extractGuestId(html);
      if (guestId) {
        return `https://target.scene7.com/is/image/Target/${guestId}?wid=1500&hei=1500&fmt=pjpeg`;
      }
    }
  } catch (e) { /* give up */ }

  return null;
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ═══════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════
async function main() {
  const client = new Client(DB);
  await client.connect();
  log(`Connected (${DRY_RUN ? 'DRY RUN' : 'LIVE'})`);

  if (!DRY_RUN) await initOci();

  let whereExtra = `AND ("imageUrl" NOT LIKE '%oraclecloud.com%' OR "imageUrl" IS NULL)`;
  if (RETRY_ONLY) whereExtra = `AND ("imageUrl" NOT LIKE '%oraclecloud.com%')`;

  const { rows: products } = await client.query(`
    SELECT id, name, sku, "imageUrl"
    FROM products WHERE "sellerId" = $1 AND "isActive" = true ${whereExtra}
    ORDER BY name
  `, [SELLER_ID]);

  log(`${products.length} products need images\n`);
  if (!products.length) { await client.end(); return; }

  let ok = 0, fail = 0;
  const failures = [];

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    log(`[${i + 1}/${products.length}] ${p.name}`);

    try {
      // Find Target image
      const targetUrl = await findTargetImage(p.name, p.sku);
      if (!targetUrl) throw new Error('No image found on Target');

      if (DRY_RUN) {
        log(`  ✅ [DRY] → ${targetUrl.substring(0, 90)}`);
        ok++;
        await sleep(800);
        continue;
      }

      // Download from scene7
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

      log(`  ✅ ${(imgRes.body.length / 1024).toFixed(0)} KB → OCI`);
      ok++;

    } catch (err) {
      fail++;
      failures.push({ name: p.name, sku: p.sku, error: err.message || String(err) });
      log(`  ❌ ${err.message || err}`);
    }

    // Rate limit: 1s between Target requests
    await sleep(1000);
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

  log('\n═══════════════════════════════════════════════════════════');
  log(`  Done: ${ok} uploaded, ${fail} failed`);
  log('═══════════════════════════════════════════════════════════');
  if (failures.length) {
    log('\nFailed:');
    failures.forEach(f => log(`  ${f.name} (${f.sku}) — ${f.error}`));
  }

  await client.end();
}

main().catch(err => { console.error('FATAL:', err); process.exit(1); });
