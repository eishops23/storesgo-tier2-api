const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:storesgo123@localhost:5432/storesgo' });
const MEILI_KEY = 'ff6c780c6c9cfd9156cd7831e86a49b21cbde1ece9d55dc9b2fcb11ef8b63482';
const placeholderUrl = 'https://images.storesgo.com/products%2Fplaceholder-product.svg';

(async () => {
  const res = await pool.query(
    `UPDATE products SET "imageUrl" = $1, "updatedAt" = NOW() 
     WHERE "sellerId" = 181 AND ("imageUrl" IS NULL OR "imageUrl" = '') RETURNING id`,
    [placeholderUrl]
  );
  console.log('Updated ' + res.rowCount + ' products');

  const docs = res.rows.map(r => ({ id: r.id, imageUrl: placeholderUrl }));
  await fetch('http://localhost:7700/indexes/products/documents', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + MEILI_KEY },
    body: JSON.stringify(docs)
  });
  console.log('Meilisearch updated');

  const { rows } = await pool.query(
    `SELECT COUNT(*) as cnt FROM products WHERE "sellerId" = 181 AND ("imageUrl" IS NULL OR "imageUrl" = '')`
  );
  console.log('Still missing: ' + rows[0].cnt);
  await pool.end();
})();
