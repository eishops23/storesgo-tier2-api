const { Pool } = require('pg');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const crypto = require('crypto');

const pool = new Pool({ connectionString: 'postgresql://postgres:storesgo123@localhost:5432/storesgo' });
const SELLER_ID = 181;
const CONCURRENCY = 10;

const s3 = new S3Client({
  region: 'us-ashburn-1',
  endpoint: 'https://idfzjtd1dz5w.compat.objectstorage.us-ashburn-1.oraclecloud.com',
  credentials: {
    accessKeyId: '5a11ceb9e7cd6ef5e2f21dae373d302faf907fab',
    secretAccessKey: 'XlZs+ME7rjsJC/PD+IY0P+l4FoeDsjPTRH1PCWJ1JR4=',
  },
  forcePathStyle: true,
});

const BUCKET = 'storesgo-images';
const PUBLIC_BASE = 'https://objectstorage.us-ashburn-1.oraclecloud.com/n/idfzjtd1dz5w/b/storesgo-images/o';

let stats = { success: 0, failed: 0, skipped: 0, total: 0 };

async function migrateImage(product) {
  const { id, imageUrl, name } = product;

  if (!imageUrl || imageUrl.includes('oraclecloud.com')) {
    stats.skipped++;
    return;
  }

  try {
    const res = await fetch(imageUrl, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) { stats.failed++; return; }

    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length < 100) { stats.failed++; return; }

    const contentType = res.headers.get('content-type') || 'image/jpeg';
    const ext = contentType.includes('png') ? '.png' : contentType.includes('webp') ? '.webp' : '.jpg';

    const safeName = (name || 'product').toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').substring(0, 50);
    const random = crypto.randomBytes(4).toString('hex');
    const filename = `storesgo-products-${safeName}-${id}-${random}${ext}`;
    const objectKey = `products/${filename}`;

    await s3.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: objectKey,
      Body: buffer,
      ContentType: contentType,
    }));

    const newUrl = `${PUBLIC_BASE}/${encodeURIComponent(objectKey)}`;
    await pool.query('UPDATE products SET "imageUrl" = $1, "updatedAt" = NOW() WHERE id = $2', [newUrl, id]);

    stats.success++;
  } catch (err) {
    stats.failed++;
  }
}

async function main() {
  const { rows } = await pool.query(
    'SELECT id, "imageUrl", name FROM products WHERE "sellerId" = $1 AND "imageUrl" IS NOT NULL AND "imageUrl" != \'\' AND "imageUrl" NOT LIKE \'%oraclecloud.com%\'',
    [SELLER_ID]
  );

  stats.total = rows.length;
  console.log('Migrating ' + rows.length + ' images to OCI...\n');

  for (let i = 0; i < rows.length; i += CONCURRENCY) {
    const batch = rows.slice(i, i + CONCURRENCY);
    await Promise.all(batch.map(p => migrateImage(p)));

    const done = Math.min(i + CONCURRENCY, rows.length);
    if (done % 100 === 0 || done === rows.length) {
      console.log('Progress: ' + done + '/' + rows.length + ' | OK: ' + stats.success + ' | Fail: ' + stats.failed + ' | Skip: ' + stats.skipped);
    }
  }

  console.log('\nDone! OK: ' + stats.success + ' migrated | Fail: ' + stats.failed + ' | Skip: ' + stats.skipped);

  const { rows: updated } = await pool.query(
    'SELECT id, "imageUrl" FROM products WHERE "sellerId" = $1 AND "imageUrl" LIKE \'%oraclecloud.com%\'',
    [SELLER_ID]
  );

  console.log('\nUpdating ' + updated.length + ' images in Meilisearch...');
  const MEILI_KEY = 'ff6c780c6c9cfd9156cd7831e86a49b21cbde1ece9d55dc9b2fcb11ef8b63482';

  for (let i = 0; i < updated.length; i += 1000) {
    const batch = updated.slice(i, i + 1000).map(r => ({ id: r.id, imageUrl: r.imageUrl }));
    await fetch('http://localhost:7700/indexes/products/documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + MEILI_KEY },
      body: JSON.stringify(batch)
    });
    console.log('  Meilisearch batch ' + (Math.floor(i / 1000) + 1));
  }

  console.log('Meilisearch updated!');
  await pool.end();
}

main().catch(console.error);
