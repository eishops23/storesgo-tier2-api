/**
 * StoresGo — Migrate Walmart images to OCI Object Storage
 * Runs independently after product import.
 * Downloads from Walmart CDN → uploads to OCI → updates DB + product_images table
 *
 * Usage:
 *   node migrate-images-oci.cjs              # migrate all
 *   node migrate-images-oci.cjs --batch=500  # limit batch size
 */

const https = require('https');
const http = require('http');
const { Client } = require('pg');

const SELLER_ID = 236;
const CONCURRENCY = 15;
const BATCH_LIMIT = parseInt((process.argv.find(a => a.startsWith('--batch=')) || '').split('=')[1]) || 999999;

const PG = { host: 'localhost', user: 'postgres', password: 'storesgo123', database: 'storesgo' };

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

function makeSlug(name) {
  return name.toLowerCase()
    .replace(/['']/g, '')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 120);
}

async function initOci() {
  const sdk = require('@aws-sdk/client-s3');
  s3Client = new sdk.S3Client({
    region: OCI_REGION,
    endpoint: OCI_ENDPOINT,
    credentials: { accessKeyId: OCI_ACCESS_KEY, secretAccessKey: OCI_SECRET_KEY },
    forcePathStyle: true,
  });
  PutObjectCommand = sdk.PutObjectCommand;
  console.log('✅ OCI S3 client initialized');
}

function downloadImage(url) {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http;
    const req = proto.get(url, { timeout: 20000 }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        downloadImage(res.headers.location).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) { reject(new Error('HTTP ' + res.statusCode)); return; }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  });
}

async function uploadToOci(buffer, objectKey, contentType) {
  await s3Client.send(new PutObjectCommand({
    Bucket: OCI_BUCKET, Key: objectKey, Body: buffer,
    ContentType: contentType || 'image/jpeg',
  }));
  return `${OCI_PUBLIC_BASE}/${encodeURIComponent(objectKey)}`;
}

function httpPost(url, data, headers) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const body = JSON.stringify(data);
    const opts = {
      hostname: parsed.hostname, port: parsed.port, path: parsed.pathname,
      method: 'POST', headers: Object.assign({ 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }, headers),
    };
    const req = http.request(opts, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => { try { resolve(JSON.parse(Buffer.concat(chunks).toString())); } catch(e) { resolve({}); } });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  console.log('=== OCI Image Migration ===');
  console.log('Concurrency:', CONCURRENCY);
  console.log('');

  await initOci();

  const db = new Client(PG);
  await db.connect();

  // Find all seller 236 products still using Walmart CDN
  const result = await db.query(
    `SELECT id, name, "imageUrl" FROM products 
     WHERE "sellerId"=$1 AND "imageUrl" LIKE '%walmartimages.com%'
     ORDER BY id
     LIMIT $2`,
    [SELLER_ID, BATCH_LIMIT]
  );

  const products = result.rows;
  console.log('Products to migrate: ' + products.length);

  if (products.length === 0) {
    console.log('Nothing to migrate — all images already on OCI.');
    await db.end();
    return;
  }

  let migrated = 0;
  let failed = 0;
  let failedIds = [];
  const startTime = Date.now();

  for (let b = 0; b < products.length; b += CONCURRENCY) {
    const batch = products.slice(b, b + CONCURRENCY);
    const results = await Promise.allSettled(
      batch.map(async (p) => {
        try {
          const buffer = await downloadImage(p.imageUrl);
          const slug = makeSlug(p.name);
          let ext = '.jpg';
          if (p.imageUrl.includes('.png')) ext = '.png';
          else if (p.imageUrl.includes('.webp')) ext = '.webp';
          const objectKey = `products/storesgo-${slug}-${p.id}${ext}`;
          const contentType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
          const ociUrl = await uploadToOci(buffer, objectKey, contentType);

          // Update product imageUrl
          await db.query('UPDATE products SET "imageUrl"=$1 WHERE id=$2', [ociUrl, p.id]);

          // Insert into product_images (check if exists first)
          const existing = await db.query('SELECT id FROM product_images WHERE "productId"=$1', [p.id]);
          if (existing.rows.length === 0) {
            await db.query(
              `INSERT INTO product_images ("productId", url, "altText", "sortOrder", "isPrimary", "createdAt")
               VALUES ($1, $2, $3, 0, true, NOW())`,
              [p.id, ociUrl, p.name]
            );
          } else {
            await db.query('UPDATE product_images SET url=$1 WHERE "productId"=$2', [ociUrl, p.id]);
          }

          return true;
        } catch (e) {
          failedIds.push(p.id);
          return false;
        }
      })
    );

    results.forEach(r => {
      if (r.status === 'fulfilled' && r.value) migrated++;
      else failed++;
    });

    // Progress every 300 or at end
    if ((b + CONCURRENCY) % 300 < CONCURRENCY || b + CONCURRENCY >= products.length) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
      const pct = Math.round(((b + batch.length) / products.length) * 100);
      const rate = (migrated / (elapsed || 1)).toFixed(1);
      console.log(`  [${pct}%] ${migrated} migrated, ${failed} failed | ${elapsed}s elapsed | ${rate} img/s`);
    }
  }

  // Sync updated imageUrls to Meilisearch
  console.log('\n--- Syncing updated images to Meilisearch ---');
  const meiliQuery = await db.query(
    `SELECT id, name, slug, "priceCents", "imageUrl", "sellerId", "storeId",
     category_id AS "categoryId", "isActive", status, description
     FROM products WHERE "sellerId"=$1 AND "imageUrl" LIKE '%oraclecloud.com%'`,
    [SELLER_ID]
  );
  const meiliBatch = 500;
  for (let m = 0; m < meiliQuery.rows.length; m += meiliBatch) {
    const slice = meiliQuery.rows.slice(m, m + meiliBatch);
    try {
      const mRes = await httpPost(
        MEILI_HOST + '/indexes/products/documents',
        slice,
        { 'Authorization': 'Bearer ' + MEILI_KEY }
      );
      console.log('  Meili batch ' + (Math.floor(m / meiliBatch) + 1) + ': task ' + (mRes.taskUid || '?'));
    } catch (e) {
      console.log('  Meili error: ' + e.message);
    }
  }

  await db.end();

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(0);
  console.log('\n=== MIGRATION COMPLETE ===');
  console.log('Migrated: ' + migrated);
  console.log('Failed: ' + failed);
  console.log('Time: ' + totalTime + 's');
  if (failedIds.length > 0 && failedIds.length <= 20) {
    console.log('Failed IDs: ' + failedIds.join(', '));
  }
}

main().catch(e => { console.error(e); process.exit(1); });
