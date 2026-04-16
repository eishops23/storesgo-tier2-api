const { Pool } = require('pg');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const pool = new Pool({ connectionString: 'postgresql://postgres:storesgo123@localhost:5432/storesgo' });
const MEILI_KEY = 'ff6c780c6c9cfd9156cd7831e86a49b21cbde1ece9d55dc9b2fcb11ef8b63482';
const SELLER_ID = 181;
const CONCURRENCY = 10;

const s3 = new S3Client({
  region: 'us-ashburn-1',
  endpoint: 'https://idfzjtd1dz5w.compat.objectstorage.us-ashburn-1.oraclecloud.com',
  credentials: {
    accessKeyId: '5a11ceb9e7cd6ef5e2f21dae373d302faf907fab',
    secretAccessKey: 'XlZs+ME7rjsJC/PD+IY0P+l4FoeDsjPTRH1PCWJ1JR4='
  },
  forcePathStyle: true
});

let stats = { ok: 0, fail: 0, skip: 0, total: 0 };

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function sanitize(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 60).replace(/-+$/, '');
}

async function processImage(row) {
  const { id, name, amazonUrl } = row;
  const rand = crypto.randomBytes(4).toString('hex');
  const filename = `storesgo-products-${sanitize(name)}-${id}-${rand}.jpg`;
  const key = `products/${filename}`;

  try {
    // Download from Amazon
    const res = await fetch(amazonUrl, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) { stats.fail++; return; }
    const buffer = Buffer.from(await res.arrayBuffer());

    // Upload to OCI
    await s3.send(new PutObjectCommand({
      Bucket: 'storesgo-images',
      Key: key,
      Body: buffer,
      ContentType: 'image/jpeg',
      ACL: 'public-read'
    }));

    // Update DB with Cloudflare CDN URL
    const cdnUrl = `https://images.storesgo.com/${encodeURIComponent(key.replace('/', '%2F'))}`;
    // Actually the URL should match what the worker expects
    const finalUrl = `https://images.storesgo.com/products%2F${filename}`;
    
    await pool.query(
      'UPDATE products SET "imageUrl" = $1, "updatedAt" = NOW() WHERE id = $2',
      [finalUrl, id]
    );
    stats.ok++;
  } catch (err) {
    stats.fail++;
  }
}

async function main() {
  // Read CSV
  const csv = fs.readFileSync('/tmp/recovered-images.csv', 'utf-8').trim().split('\n');
  const header = csv[0]; // externalId,imageUrl
  const rows = csv.slice(1);

  console.log(`Loaded ${rows.length} image records from CSV\n`);

  // Build mapping: staging externalId -> amazon URL
  const imageMap = {};
  for (const line of rows) {
    const firstComma = line.indexOf(',');
    const extId = line.substring(0, firstComma);
    const url = line.substring(firstComma + 1);
    imageMap[extId] = url;
  }

  // Find matching products on production (WEF- prefix)
  const { rows: products } = await pool.query(
    `SELECT id, name, "externalId", "imageUrl" FROM products 
     WHERE "sellerId" = $1 
     AND ("imageUrl" IS NULL OR "imageUrl" = '' OR "imageUrl" LIKE '%media-amazon%')
     ORDER BY id`,
    [SELLER_ID]
  );

  console.log(`Found ${products.length} products needing images on production\n`);

  // Match products to amazon URLs
  const toProcess = [];
  for (const p of products) {
    // Production externalId is WEF-{staging externalId}
    const stagingExtId = p.externalId.replace(/^WEF-/, '');
    if (imageMap[stagingExtId]) {
      toProcess.push({ id: p.id, name: p.name, amazonUrl: imageMap[stagingExtId] });
    }
  }

  console.log(`Matched ${toProcess.length} products with Amazon images\n`);
  stats.total = toProcess.length;

  // Process in batches
  for (let i = 0; i < toProcess.length; i += CONCURRENCY) {
    const batch = toProcess.slice(i, i + CONCURRENCY);
    await Promise.all(batch.map(r => processImage(r)));

    const done = Math.min(i + CONCURRENCY, toProcess.length);
    if (done % 100 === 0 || done === toProcess.length) {
      console.log(`Progress: ${done}/${toProcess.length} | OK: ${stats.ok} | Fail: ${stats.fail}`);
    }

    if (i + CONCURRENCY < toProcess.length) {
      await sleep(200);
    }
  }

  console.log('\n--- Upload Complete ---');
  console.log(`OK: ${stats.ok} | Fail: ${stats.fail} | Total: ${stats.total}`);

  // Update Meilisearch
  console.log('\nUpdating Meilisearch...');
  const { rows: updated } = await pool.query(
    `SELECT id, "imageUrl" FROM products WHERE "sellerId" = $1 AND "imageUrl" LIKE '%images.storesgo.com%'`,
    [SELLER_ID]
  );
  
  for (let i = 0; i < updated.length; i += 1000) {
    const batch = updated.slice(i, i + 1000).map(r => ({ id: r.id, imageUrl: r.imageUrl }));
    await fetch('http://localhost:7700/indexes/products/documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${MEILI_KEY}` },
      body: JSON.stringify(batch)
    });
    console.log(`  Meilisearch batch ${Math.floor(i / 1000) + 1}`);
  }

  // Final count
  const { rows: remaining } = await pool.query(
    `SELECT COUNT(*) as cnt FROM products WHERE "sellerId" = $1 AND ("imageUrl" IS NULL OR "imageUrl" = '')`,
    [SELLER_ID]
  );
  console.log(`\nStill missing images: ${remaining[0].cnt}`);

  await pool.end();
  console.log('Done!');
}

main().catch(console.error);
