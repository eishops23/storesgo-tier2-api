const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:storesgo123@localhost:5432/storesgo' });
const MEILI_URL = 'http://localhost:7700';
const MEILI_KEY = 'ff6c780c6c9cfd9156cd7831e86a49b21cbde1ece9d55dc9b2fcb11ef8b63482';
const SELLER_ID = 181;

async function main() {
  const { rows } = await pool.query(`
    SELECT p.id, p.name, p.slug, p.description, p."priceCents", p."imageUrl",
           p."sellerId", p.category_id, p."aiDescription", p."isActive",
           s."storeName" as "sellerName", s.slug as "sellerSlug",
           c.name as "categoryName", c.slug as "categorySlug", c."sortOrder" as "categoryPriority"
    FROM products p
    JOIN sellers s ON p."sellerId" = s.id
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p."sellerId" = $1 AND p."isActive" = true
  `, [SELLER_ID]);

  console.log(rows.length + ' products to sync\n');

  const docs = rows.map(r => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    description: r.aiDescription || r.description || '',
    priceCents: r.priceCents,
    imageUrl: r.imageUrl || '',
    sellerId: r.sellerId,
    sellerName: r.sellerName,
    sellerSlug: r.sellerSlug,
    categoryId: r.category_id || 0,
    categoryName: r.categoryName || 'Uncategorized',
    categorySlug: r.categorySlug || 'uncategorized',
    categoryPriority: r.categoryPriority || 0,
    currency: 'USD',
    inStock: true,
    brand: ''
  }));

  const BATCH = 1000;
  for (let i = 0; i < docs.length; i += BATCH) {
    const batch = docs.slice(i, i + BATCH);
    const res = await fetch(MEILI_URL + '/indexes/products/documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + MEILI_KEY },
      body: JSON.stringify(batch)
    });
    const data = await res.json();
    console.log(`Batch ${Math.floor(i/BATCH)+1}/${Math.ceil(docs.length/BATCH)}: ${data.taskUid}`);
  }

  // Wait for indexing
  await new Promise(r => setTimeout(r, 5000));
  const stats = await fetch(MEILI_URL + '/indexes/products/stats', {
    headers: { 'Authorization': 'Bearer ' + MEILI_KEY }
  }).then(r => r.json());
  
  console.log('\nMeilisearch total: ' + stats.numberOfDocuments + ' products');
  await pool.end();
}
main().catch(console.error);
