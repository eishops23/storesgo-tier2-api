const { Client } = require('pg');
const fs = require('fs');
const crypto = require('crypto');

const DB = 'postgresql://postgres:storesgo123@localhost:5432/storesgo';
const MEILI_HOST = 'http://localhost:7700';
const MEILI_KEY = 'ff6c780c6c9cfd9156cd7831e86a49b21cbde1ece9d55dc9b2fcb11ef8b63482';
const SELLER_ID = 236;
const STORE_ID = 5;
const MARKUP = 1.45;
const DRY_RUN = process.argv.includes('--dry-run');
const ROLLBACK = process.argv.includes('--rollback');

const CATEGORY_MAP = {
  'canned tomatoes': 2776, 'canned corn': 2783, 'canned green beans': 2783,
  'canned peas': 2783, 'canned mixed vegetables': 2783,
  'tomato soup': 2796, 'chicken noodle soup': 2796, 'cream of mushroom soup': 2796,
  'canned chili': 2796,
  'canned tuna': 2753, 'canned chicken': 2773, 'canned salmon': 2753, 'sardines canned': 2753,
  'canned peaches': 2761, 'canned pineapple': 2761, 'canned fruit cocktail': 2761,
  'spaghetti pasta': 2938, 'penne pasta': 2938, 'egg noodles': 2945, 'pasta sauce': 2799,
  'white rice': 2938, 'brown rice': 2938, 'jasmine rice': 2938,
  'black beans canned': 2743, 'pinto beans canned': 2939,
  'ketchup': 2799, 'mustard': 2799, 'mayonnaise': 2799, 'hot sauce': 2816, 'soy sauce': 2800,
  'olive oil': 3185, 'vegetable oil': 3185, 'vinegar': 3200,
  'cereal': 2714, 'oatmeal': 2714, 'pancake mix': 3303, 'maple syrup': 2647,
  'potato chips': 3317, 'tortilla chips': 3317, 'pretzels': 3317, 'crackers': 3335,
  'microwave popcorn': 3317,
  'peanut butter': 2722, 'grape jelly': 2799, 'nutella': 2722,
  'all purpose flour': 2633, 'granulated sugar': 2661, 'chocolate chips': 2604, 'vanilla extract': 3303,
  'orange juice': 2679, 'apple juice': 2679, 'coca cola soda': 2618,
  'bottled water': 2709, 'ground coffee': 2669, 'tea bags': 2705,
  'evaporated milk': 2605, 'condensed milk': 2605, 'coconut milk': 3384,
  'flour tortillas': 2799, 'salsa': 2799, 'taco seasoning': 2799,
  'ramen noodles': 2945, 'sriracha': 2816,
  'chicken broth': 2738, 'beef broth': 2736, 'gravy mix': 2735,
  'mac and cheese': 2938, 'stuffing mix': 3303, 'breadcrumbs': 3184,
  'canned spam': 2771,
  'goya beans': 2939, 'goya seasoning': 2799, 'adobo seasoning': 2799,
  'plantain chips': 3803, 'coconut water': 2678,
};
const DEFAULT_CATEGORY = 2734;

function generateSKU() { return 'GKM-' + crypto.randomBytes(4).toString('hex').toUpperCase(); }
function generateSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').substring(0, 100) + '-' + crypto.randomBytes(3).toString('hex');
}

async function meiliSync(products) {
  var http = require('http');
  var url = require('url');
  var docs = products.map(function(p) {
    return { id: p.id, name: p.name, priceCents: p.priceCents, imageUrl: p.imageUrl, sourceImageUrl: p.sourceImageUrl, slug: p.slug, sku: p.sku, sellerId: SELLER_ID, storeId: STORE_ID, categoryId: p.categoryId, isActive: true, status: 'active' };
  });
  for (var i = 0; i < docs.length; i += 500) {
    var batch = docs.slice(i, i + 500);
    var body = JSON.stringify(batch);
    var parsed = url.parse(MEILI_HOST);
    await new Promise(function(resolve, reject) {
      var req = http.request({ hostname: parsed.hostname, port: parsed.port || 7700, path: '/indexes/products/documents', method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + MEILI_KEY, 'Content-Length': Buffer.byteLength(body) } }, function(res) {
        var data = ''; res.on('data', function(c) { data += c; }); res.on('end', function() { console.log('  Meili batch ' + Math.floor(i/500+1) + ': ' + data.substring(0, 100)); resolve(); });
      });
      req.on('error', reject); req.write(body); req.end();
    });
  }
}

async function main() {
  var client = new Client(DB);
  await client.connect();
  if (ROLLBACK) {
    console.log('Rolling back...');
    var del = await client.query('DELETE FROM products WHERE "sellerId"=$1', [SELLER_ID]);
    console.log('Deleted ' + del.rowCount + ' products');
    await client.end(); return;
  }
  var existing = await client.query('SELECT COUNT(*) FROM products WHERE "sellerId"=$1', [SELLER_ID]);
  if (parseInt(existing.rows[0].count) > 0) {
    console.log('WARNING: Seller ' + SELLER_ID + ' already has ' + existing.rows[0].count + ' products. Run --rollback first.');
    await client.end(); return;
  }
  var rawData = JSON.parse(fs.readFileSync('walmart-products.json', 'utf8'));
  console.log('Loaded ' + rawData.length + ' products');
  var filtered = rawData.filter(function(p) { return p.imageUrl && p.price && p.price > 0 && p.inStock; });
  console.log('After filtering: ' + filtered.length);
  var inserted = []; var skipped = 0; var now = new Date().toISOString();
  for (var i = 0; i < filtered.length; i++) {
    var p = filtered[i];
    var categoryId = CATEGORY_MAP[p.category] || DEFAULT_CATEGORY;
    var markedUpPrice = Math.round(p.price * MARKUP * 100) / 100;
    var priceCents = Math.round(markedUpPrice * 100);
    var sku = generateSKU(); var slug = generateSlug(p.name);
    if (DRY_RUN) {
      if (i < 10) console.log('  [DRY] ' + p.name + ' | $' + p.price + ' -> ' + priceCents + 'c | Cat: ' + categoryId);
      inserted.push({ name: p.name, priceCents: priceCents }); continue;
    }
    try {
      var result = await client.query(
        'INSERT INTO products (name, slug, sku, "externalId", "priceCents", "imageUrl", "sourceImageUrl", "sellerId", "storeId", category_id, "isActive", status, description, "createdAt", "updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING id',
        [p.name, slug, sku, p.walmartId || '', priceCents, p.imageUrl, p.imageUrl, SELLER_ID, STORE_ID, categoryId, true, 'active', p.name + '. Available for pickup and delivery.', now, now]
      );
      inserted.push({ id: result.rows[0].id, name: p.name, priceCents: priceCents, imageUrl: p.imageUrl, sourceImageUrl: p.imageUrl, slug: slug, sku: sku, categoryId: categoryId });
    } catch (e) {
      skipped++;
      if (skipped <= 5) console.log('  Skip: ' + p.name + ' - ' + e.message);
    }
    if ((i + 1) % 500 === 0) console.log('  Inserted ' + inserted.length + '/' + (i+1) + ' (skipped: ' + skipped + ')');
  }
  if (DRY_RUN) {
    console.log('\n[DRY RUN] Would insert ' + inserted.length + ' products');
    await client.end(); return;
  }
  console.log('\nInserted ' + inserted.length + ' (skipped: ' + skipped + ')');
  fs.writeFileSync('walmart-import-rollback.json', JSON.stringify({ sellerId: SELLER_ID, count: inserted.length, ids: inserted.map(function(p){return p.id}), ts: now }, null, 2));
  console.log('Syncing to Meilisearch...');
  await meiliSync(inserted);
  console.log('\n=== IMPORT COMPLETE ===');
  console.log('Products: ' + inserted.length + ' | Seller: ' + SELLER_ID + ' | Store: ' + STORE_ID + ' | Markup: 45%');
  await client.end();
}
main().catch(function(e) { console.error(e); process.exit(1); });
