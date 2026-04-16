/**
 * StoresGo — Patch remaining 22 product images
 * Uses same approach as target-final.cjs but with the missing products
 *
 * Usage:
 *   node target-patch.cjs              # full run
 *   node target-patch.cjs --dry-run    # preview only
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

function extractImage(html) {
  const matches = html.match(/GUEST_[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/g) || [];
  const unique = [...new Set(matches)].filter(id => !SKIP_IDS.has(id));
  const mainPattern = html.match(/1 of \d+\]\(https:\/\/target\.scene7\.com\/is\/image\/Target\/(GUEST_[a-f0-9-]+)/);
  if (mainPattern && !SKIP_IDS.has(mainPattern[1])) return mainPattern[1];
  return unique.length > 0 ? unique[0] : null;
}

// ═══════════════════════════════════════════════════════════
// REMAINING 22 PRODUCT MAPPINGS
// ═══════════════════════════════════════════════════════════
const TARGET_PAGES = {
  // DUREX
  'Durex Air': 'https://www.target.com/p/durex-air-find-your-fit-collection/-/A-86827704',
  'Durex Tropical': 'https://www.target.com/p/durex-tropical-flavors-condom-12ct/-/A-52783371',

  // LELO
  'LELO HEX Original Luxury Condoms - 12ct': 'https://www.target.com/p/lelo-hex-original-condoms-12ct/-/A-51448461',
  'LELO HEX Original Luxury Condoms - 36ct': 'https://www.target.com/p/lelo-hex-original-luxury-condoms-with-unique-hexagonal-structure-lubricated-36ct/-/A-79140768',

  // LIFESTYLES
  'LifeStyles': 'https://www.target.com/p/lifestyles-ultra-sensitive-latex-condoms-36ct/-/A-87524087',

  // SKYN
  'SKYN Original': 'https://www.target.com/p/skyn-original-non-latex-lubricated-condoms-12ct/-/A-13358787',
  'SKYN Supreme': 'https://www.target.com/p/skyn-supreme-non-latex-lubricated-condoms-10ct/-/A-89678428',
  'SKYN Excitation': 'https://www.target.com/p/skyn-elite-non-latex-condoms-12ct/-/A-87524090',
  'SKYN Snug': 'https://www.target.com/p/skyn-elite-non-latex-condoms-12ct/-/A-87524090',

  // TROJAN
  'Trojan ENZ Armor': 'https://www.target.com/p/trojan-enz-lubricated-premium-latex-condoms-12ct/-/A-11235052',
  'Trojan ENZ Lubricated': 'https://www.target.com/p/trojan-enz-for-contraception-and-sti-protection-lubricated-condoms-36ct/-/A-11216655',
  'Trojan Her Pleasure Sensations Lubricated Latex Condoms - 12ct': 'https://www.target.com/p/trojan-her-pleasure-sensations-lubricated-latex-condoms-12-count/-/A-1005368641',
  'Trojan Her Pleasure Sensations Lubricated Latex Condoms - 3ct': 'https://www.target.com/p/trojan-her-pleasures-sensations-lubricated-latex-condom-3-ct/-/A-1005928754',
  'Trojan Discovery': 'https://www.target.com/p/trojan-pleasure-pack-lubricated-condoms-12ct/-/A-11054876',
  'Trojan Original Lubricated': 'https://www.target.com/p/trojan-enz-for-contraception-and-sti-protection-lubricated-condoms-36ct/-/A-11216655',
  'Trojan Original Non-Lubricated': 'https://www.target.com/p/trojan-enz-for-contraception-and-sti-protection-lubricated-condoms-36ct/-/A-11216655',
  'Trojan Original Spermicidal': 'https://www.target.com/p/trojan-enz-lubricated-premium-latex-condoms-12ct/-/A-11235052',
  'Trojan Ultra Ribbed': 'https://www.target.com/p/trojan-ultra-ribbed-premium-lube-condoms-36ct/-/A-11231164',
};

function findTargetPage(productName) {
  const keys = Object.keys(TARGET_PAGES).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    if (productName.startsWith(key)) return TARGET_PAGES[key];
  }
  return null;
}

async function main() {
  const client = new Client(DB);
  await client.connect();
  log(`Connected (${DRY_RUN ? 'DRY RUN' : 'LIVE'})`);
  if (!DRY_RUN) await initOci();

  // Only get products that DON'T already have OCI images
  const { rows: products } = await client.query(`
    SELECT id, name, sku, "imageUrl"
    FROM products WHERE "sellerId" = $1 AND "isActive" = true
    AND ("imageUrl" NOT LIKE '%oraclecloud.com%' OR "imageUrl" IS NULL)
    ORDER BY name
  `, [SELLER_ID]);

  log(`${products.length} products still need images\n`);
  if (!products.length) { log('All done!'); await client.end(); return; }

  // Phase 1: Fetch unique Target pages
  log('Phase 1: Fetching Target product pages...');
  const pageCache = new Map();
  const uniqueUrls = new Set();
  for (const p of products) {
    const url = findTargetPage(p.name);
    if (url) uniqueUrls.add(url);
  }
  log(`  ${uniqueUrls.size} unique Target pages to fetch`);

  for (const url of uniqueUrls) {
    try {
      log(`  Fetching: ...${url.substring(45, 90)}...`);
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
      await sleep(1200);
    } catch (e) {
      log(`    → Error: ${e.message}`);
    }
  }

  log(`\nPhase 1 complete: ${pageCache.size}/${uniqueUrls.size} pages have images\n`);

  // Phase 2: Download and upload
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
      failures.push({ name: p.name, sku: p.sku, error: 'No mapping' });
      log(`  ❌ No mapping`);
      continue;
    }

    const scene7Url = `https://target.scene7.com/is/image/Target/${guestId}?wid=1500&hei=1500&fmt=pjpeg`;

    if (DRY_RUN) {
      log(`  ✅ [DRY] ${guestId}`);
      ok++;
      continue;
    }

    try {
      const imgRes = await httpGet(scene7Url, { accept: 'image/*' });
      if (imgRes.status !== 200) throw new Error(`scene7 HTTP ${imgRes.status}`);
      if (imgRes.body.length < 5000) throw new Error(`Too small: ${imgRes.body.length}b`);

      const slug = makeSlug(p.name);
      const key = `products/condoms/${slug}.jpg`;
      const ociUrl = await uploadToOci(imgRes.body, key, 'image/jpeg');

      await client.query(`
        UPDATE products SET "imageUrl" = $1, "sourceImageUrl" = $2, "updatedAt" = NOW()
        WHERE id = $3
      `, [ociUrl, scene7Url, p.id]);

      log(`  ✅ ${(imgRes.body.length / 1024).toFixed(0)} KB`);
      ok++;
      await sleep(300);
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
    log('\nStill failed:');
    failures.forEach(f => log(`  ${f.name} (${f.sku})`));
  }

  await client.end();
}

main().catch(err => { console.error('FATAL:', err); process.exit(1); });
