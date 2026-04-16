/**
 * StoresGo — Target Images → OCI (Hardcoded URL Map)
 * =====================================================
 * Fetches actual Target product pages to extract scene7 image IDs,
 * downloads high-res images, uploads to OCI Object Storage.
 *
 * Usage:
 *   node target-final.cjs              # full run
 *   node target-final.cjs --dry-run    # preview only
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

// Known generic GUEST_ IDs that appear on EVERY Target page (skip these)
const SKIP_IDS = new Set([
  'GUEST_d85877b3-84dc-45f7-b53a-e78553da8c1d',
  'GUEST_af111737-788c-45e5-90b1-d37a5f23d392',
  'GUEST_ea95a518-40ae-4b40-acef-aecb46c90d70',
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
    };
    const req = proto.get(url, { headers, timeout: 25000 }, (res) => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
        let redir = res.headers.location;
        if (redir.startsWith('/')) { const u = new URL(url); redir = `${u.protocol}//${u.host}${redir}`; }
        return httpGet(redir, opts).then(resolve).catch(reject);
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(chunks) }));
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

// Extract product image GUEST_ ID from Target product page HTML
function extractImage(html) {
  const matches = html.match(/GUEST_[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/g) || [];
  const unique = [...new Set(matches)].filter(id => !SKIP_IDS.has(id));
  // Look for "1 of N" image pattern — that's always the main product image
  const mainPattern = html.match(/1 of \d+\]\(https:\/\/target\.scene7\.com\/is\/image\/Target\/(GUEST_[a-f0-9-]+)/);
  if (mainPattern && !SKIP_IDS.has(mainPattern[1])) {
    return mainPattern[1];
  }
  return unique.length > 0 ? unique[0] : null;
}

// ═══════════════════════════════════════════════════════════
// TARGET PRODUCT PAGE URL MAP
// Maps product name patterns to Target product page URLs
// Products with same base product share the same Target page
// ═══════════════════════════════════════════════════════════
const TARGET_PAGES = {
  // TROJAN
  'Trojan G.O.A.T.': 'https://www.target.com/p/trojan-goat-non-latex-condoms-10ct/-/A-94762787',
  'Trojan RAW': 'https://www.target.com/p/trojan-raw-non-latex-lubricated-condoms-10ct/-/A-87548533',
  'Trojan Bareskin Lubricated': 'https://www.target.com/p/trojan-bareskin-lubricated-condoms-10ct/-/A-14790989',
  'Trojan Bareskin Thin': 'https://www.target.com/p/trojan-bareskin-thin-premium-lubricated-condoms-24ct/-/A-14790987',
  'Trojan Bareskin Raw': 'https://www.target.com/p/trojan-bareskin-raw-condoms-10ct/-/A-84794727',
  'Trojan Sensitivity Bareskin': 'https://www.target.com/p/trojan-bareskin-premium-lube-condoms/-/A-16594811',
  'Trojan Ultra Thin Lubricated': 'https://www.target.com/p/trojan-ultra-thin-for-ultra-sensitivity-premium-fragrance-free-lubricated-latex-condoms-12ct/-/A-75665005',
  'Trojan Armor': 'https://www.target.com/p/trojan-sensitivity-ultra-thin-spermicidal-lube-condoms-12ct/-/A-11235054',
  'Trojan Magnum Bareskin': 'https://www.target.com/p/trojan-magnum-bareskin-lubricated-condoms-10ct/-/A-16836583',
  'Trojan Magnum Raw': 'https://www.target.com/p/trojan-magnum-raw-24ct/-/A-89619171',
  'Trojan Magnum Thin': 'https://www.target.com/p/trojan-magnum-thin-lubricated-condoms-12ct/-/A-11206982',
  'Trojan Magnum XL': 'https://www.target.com/p/trojan-magnum-xl-lubricated-condoms-12ct/-/A-1005368638',
  'Trojan Magnum Large': 'https://www.target.com/p/trojan-magnum-large-size-lubricated-condoms-12ct/-/A-11219933',
  'Trojan Pleasure Variety': 'https://www.target.com/p/trojan-pleasure-pack-lubricated-condoms-12ct/-/A-11054876',
  'Trojan Pleasure Pack': 'https://www.target.com/p/trojan-pleasure-pack-lubricated-condoms-12ct/-/A-11054876',

  // SKYN
  'SKYN Elite Non-Latex Condoms': 'https://www.target.com/p/skyn-elite-non-latex-condoms-12ct/-/A-87524090',
  'SKYN Elite Non-Latex Lubricated': 'https://www.target.com/p/skyn-elite-non-latex-lubricated-condoms-36ct/-/A-75663448',
  'SKYN LifeStyles': 'https://www.target.com/p/skyn-lifestyles-selection-non-latex-lubricated-condoms-36ct/-/A-85037408',
  'SKYN King': 'https://www.target.com/p/skyn-king-non-latex-condoms-36ct/-/A-93772905',

  // DUREX
  'Durex Real Feel': 'https://www.target.com/p/durex-real-feel-value-pack-36ct/-/A-78853433',
  'Durex Avanti Bare': 'https://www.target.com/p/durex-real-feel-condoms-24ct/-/A-93275540',
  'Durex Intense': 'https://www.target.com/p/durex-intense-nitrile-condoms-24ct/-/A-93275543',
  'Durex Extra Sensitive': 'https://www.target.com/p/durex-extra-sensitive-condoms/-/A-80394577',
  'Durex Prolong': 'https://www.target.com/p/durex-prolong-latex-condoms-12ct/-/A-51667023',
};

// Match product name to a Target page URL
function findTargetPage(productName) {
  // Try longest match first (most specific)
  const keys = Object.keys(TARGET_PAGES).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    if (productName.startsWith(key)) {
      return TARGET_PAGES[key];
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

  // PHASE 1: Fetch all unique Target pages and extract GUEST_ IDs
  log('Phase 1: Fetching Target product pages...');
  const pageCache = new Map(); // URL → GUEST_ ID

  const uniqueUrls = new Set();
  for (const p of products) {
    const url = findTargetPage(p.name);
    if (url) uniqueUrls.add(url);
  }

  log(`  ${uniqueUrls.size} unique Target pages to fetch`);

  for (const url of uniqueUrls) {
    try {
      log(`  Fetching: ${url.substring(30, 80)}...`);
      const res = await httpGet(url);
      if (res.status === 200) {
        const html = res.body.toString('utf8');
        const guestId = extractImage(html);
        if (guestId) {
          pageCache.set(url, guestId);
          log(`    → ${guestId}`);
        } else {
          log(`    → No product image found`);
        }
      } else {
        log(`    → HTTP ${res.status}`);
      }
      await sleep(1200); // Rate limit
    } catch (e) {
      log(`    → Error: ${e.message}`);
    }
  }

  log(`\nPhase 1 complete: ${pageCache.size}/${uniqueUrls.size} pages have images\n`);

  // PHASE 2: Download images and upload to OCI
  log('Phase 2: Downloading and uploading images...');
  let ok = 0, fail = 0;
  const failures = [];

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const targetUrl = findTargetPage(p.name);
    const guestId = targetUrl ? pageCache.get(targetUrl) : null;

    log(`[${i + 1}/${products.length}] ${p.name}`);

    if (!guestId) {
      fail++;
      failures.push({ name: p.name, sku: p.sku, error: 'No Target page or image found' });
      log(`  ❌ No image`);
      continue;
    }

    const scene7Url = `https://target.scene7.com/is/image/Target/${guestId}?wid=1500&hei=1500&fmt=pjpeg`;

    if (DRY_RUN) {
      log(`  ✅ [DRY] ${guestId}`);
      ok++;
      continue;
    }

    try {
      // Download from scene7
      const imgRes = await httpGet(scene7Url, { accept: 'image/*' });
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
      `, [ociUrl, scene7Url, p.id]);

      log(`  ✅ ${(imgRes.body.length / 1024).toFixed(0)} KB`);
      ok++;
      await sleep(300); // Light rate limit for scene7
    } catch (err) {
      fail++;
      failures.push({ name: p.name, sku: p.sku, error: err.message });
      log(`  ❌ ${err.message}`);
    }
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
  log(`  Done: ${ok} uploaded, ${fail} failed`);
  log('═══════════════════════════════════════════════════════════');
  if (failures.length) {
    log('\nFailed:');
    failures.forEach(f => log(`  ${f.name} (${f.sku})`));
  }

  await client.end();
}

main().catch(err => { console.error('FATAL:', err); process.exit(1); });
