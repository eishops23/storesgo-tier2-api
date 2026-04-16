/**
 * StoresGo — Migrate Condom Images to OCI Object Storage
 * ========================================================
 * Downloads product images from external URLs → uploads to OCI → updates DB
 * Matches the pattern from migrate-images-oci.cjs (Walmart import)
 *
 * Usage:
 *   node migrate-condom-images.cjs              # migrate all
 *   node migrate-condom-images.cjs --dry-run    # preview only
 *   node migrate-condom-images.cjs --retry      # retry only failed ones
 */

const https = require('https');
const http = require('http');
const { Client } = require('pg');
const crypto = require('crypto');

// ═══════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════
const SELLER_ID = 312;
const CONCURRENCY = 10;
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

// ═══════════════════════════════════════════════════════════
// OCI S3 INIT
// ═══════════════════════════════════════════════════════════
async function initOci() {
  const sdk = require('@aws-sdk/client-s3');
  s3Client = new sdk.S3Client({
    region: OCI_REGION,
    endpoint: OCI_ENDPOINT,
    credentials: { accessKeyId: OCI_ACCESS_KEY, secretAccessKey: OCI_SECRET_KEY },
    forcePathStyle: true,
  });
  PutObjectCommand = sdk.PutObjectCommand;
  log('OCI S3 client initialized');
}

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════
function log(msg) { console.log(`[${new Date().toISOString().slice(11, 19)}] ${msg}`); }

function makeSlug(name) {
  return name.toLowerCase()
    .replace(/['']/g, '')
    .replace(/&/g, 'and')
    .replace(/\./g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 120);
}

function downloadImage(url, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    if (maxRedirects <= 0) return reject(new Error('Too many redirects'));
    
    const proto = url.startsWith('https') ? https : http;
    const req = proto.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.google.com/',
      },
      timeout: 15000,
    }, (res) => {
      // Follow redirects
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
        let redirect = res.headers.location;
        if (redirect.startsWith('/')) {
          const u = new URL(url);
          redirect = `${u.protocol}//${u.host}${redirect}`;
        }
        return downloadImage(redirect, maxRedirects - 1).then(resolve).catch(reject);
      }
      
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      
      const contentType = res.headers['content-type'] || '';
      if (!contentType.includes('image') && !contentType.includes('octet-stream')) {
        return reject(new Error(`Not an image: ${contentType}`));
      }
      
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        if (buffer.length < 1000) {
          return reject(new Error(`Image too small: ${buffer.length} bytes`));
        }
        resolve({ buffer, contentType: contentType.split(';')[0] || 'image/jpeg' });
      });
      res.on('error', reject);
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

async function uploadToOci(buffer, key, contentType) {
  await s3Client.send(new PutObjectCommand({
    Bucket: OCI_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    ACL: 'public-read',
  }));
  return `${OCI_PUBLIC_BASE}/${encodeURIComponent(key)}`;
}

// ═══════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════
async function main() {
  const client = new Client(DB);
  await client.connect();
  log(`Connected to PostgreSQL (${DRY_RUN ? 'DRY RUN' : 'LIVE'})`);
  
  if (!DRY_RUN) {
    await initOci();
  }
  
  // Get products that still have external image URLs
  let query = `
    SELECT id, name, "imageUrl", "sourceImageUrl"
    FROM products 
    WHERE "sellerId" = $1 AND "isActive" = true
  `;
  
  if (RETRY_ONLY) {
    // Only retry products where imageUrl is NOT already on OCI
    query += ` AND ("imageUrl" NOT LIKE '%oraclecloud.com%' OR "imageUrl" IS NULL OR "imageUrl" = '')`;
  } else {
    query += ` AND "imageUrl" NOT LIKE '%oraclecloud.com%'`;
  }
  
  const { rows: products } = await client.query(query, [SELLER_ID]);
  log(`Found ${products.length} products needing image migration`);
  
  if (products.length === 0) {
    log('Nothing to migrate!');
    await client.end();
    return;
  }
  
  if (DRY_RUN) {
    products.forEach(p => {
      log(`  Would migrate: ${p.name} → ${p.imageUrl?.substring(0, 60)}...`);
    });
    await client.end();
    return;
  }
  
  let success = 0, failed = 0;
  const failures = [];
  
  // Process in batches for concurrency
  for (let i = 0; i < products.length; i += CONCURRENCY) {
    const batch = products.slice(i, i + CONCURRENCY);
    
    const results = await Promise.allSettled(batch.map(async (p) => {
      const sourceUrl = p.imageUrl || p.sourceImageUrl;
      if (!sourceUrl) throw new Error('No source URL');
      
      try {
        // Download image
        const { buffer, contentType } = await downloadImage(sourceUrl);
        
        // Generate OCI key
        const slug = makeSlug(p.name);
        const ext = contentType.includes('png') ? 'png' : 'jpg';
        const key = `products/condoms/${slug}.${ext}`;
        
        // Upload to OCI
        const ociUrl = await uploadToOci(buffer, key, contentType);
        
        // Update DB
        await client.query(`
          UPDATE products 
          SET "imageUrl" = $1, "sourceImageUrl" = $2, "updatedAt" = NOW()
          WHERE id = $3
        `, [ociUrl, sourceUrl, p.id]);
        
        return { id: p.id, name: p.name, url: ociUrl, size: buffer.length };
      } catch (err) {
        throw { id: p.id, name: p.name, sourceUrl, error: err.message || err };
      }
    }));
    
    for (const r of results) {
      if (r.status === 'fulfilled') {
        success++;
        log(`  ✅ ${r.value.name} (${(r.value.size / 1024).toFixed(0)} KB)`);
      } else {
        failed++;
        failures.push(r.reason);
        log(`  ❌ ${r.reason.name} — ${r.reason.error}`);
      }
    }
    
    log(`  Progress: ${i + batch.length}/${products.length} (${success} ok, ${failed} failed)`);
  }
  
  // Sync updated products to Meilisearch
  log('Syncing to Meilisearch...');
  try {
    const { rows: meiliProducts } = await client.query(`
      SELECT id, name, slug, description, "priceCents", "imageUrl", sku, status, "isActive"
      FROM products WHERE "sellerId" = $1
    `, [SELLER_ID]);
    
    const body = JSON.stringify(meiliProducts.map(p => ({
      id: p.id, name: p.name, slug: p.slug,
      description: p.description || '', priceCents: p.priceCents,
      imageUrl: p.imageUrl || '', sku: p.sku || '',
      status: p.status, isActive: p.isActive,
      sellerId: SELLER_ID,
    })));
    
    const req = http.request(`${MEILI_HOST}/indexes/products/documents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MEILI_KEY}`,
        'Content-Length': Buffer.byteLength(body),
      },
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => log(`  Meilisearch: ${res.statusCode}`));
    });
    req.on('error', (e) => log(`  Meilisearch error: ${e.message}`));
    req.write(body);
    req.end();
    await new Promise(resolve => setTimeout(resolve, 2000));
  } catch (err) {
    log(`  Meilisearch sync failed: ${err.message}`);
  }
  
  // Summary
  log('');
  log('═══════════════════════════════════════════════════════════');
  log(`  Migration complete: ${success} uploaded, ${failed} failed`);
  log('═══════════════════════════════════════════════════════════');
  
  if (failures.length > 0) {
    log('\nFailed products (need manual image URLs):');
    failures.forEach(f => log(`  ${f.name}: ${f.error}`));
  }
  
  await client.end();
}

main().catch(err => { console.error('FATAL:', err); process.exit(1); });
