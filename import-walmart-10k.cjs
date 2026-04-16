/**
 * StoresGo Walmart 10K Import — Production
 * - Deduplicates against existing products (by walmartId/externalId)
 * - Enriched template-based SEO descriptions
 * - Downloads images from Walmart CDN → uploads to OCI Object Storage
 * - Proper slug format: name-{id}
 * - status='approved', isActive=true
 * - Inserts into product_images table
 * - Syncs to Meilisearch
 *
 * Usage:
 *   node import-walmart-10k.cjs                   # full import with images
 *   node import-walmart-10k.cjs --dry-run          # preview only
 *   node import-walmart-10k.cjs --skip-images      # import without OCI migration
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { Client } = require('pg');
const crypto = require('crypto');

// =============================================================================
// CONFIG
// =============================================================================
const SELLER_ID = 236;
const STORE_ID = 5;
const MARKUP = 1.45;
const INPUT_FILE = 'walmart-products-10k.json';

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

const DRY_RUN = process.argv.includes('--dry-run');
const SKIP_IMAGES = process.argv.includes('--skip-images');
const IMAGE_CONCURRENCY = 15;

// =============================================================================
// CATEGORY MAPPING (search query → DB category_id)
// =============================================================================
const CATEGORY_MAP = {
  // Canned vegetables
  'canned tomatoes':2783,'canned diced tomatoes':2783,'canned crushed tomatoes':2783,'tomato paste':2783,
  'canned corn':2783,'canned green beans':2783,'canned peas':2783,'canned mixed vegetables':2783,
  'canned carrots':2783,'canned beets':2783,'canned spinach':2783,'canned artichoke hearts':2783,
  'canned mushrooms':2783,'canned olives':2783,'canned rotel':2783,
  // Soups
  'tomato soup':2784,'chicken noodle soup':2784,'cream of mushroom soup':2784,'cream of chicken soup':2784,
  'vegetable soup':2784,'beef stew canned':2784,'clam chowder':2784,'minestrone soup':2784,
  'canned chili':2784,'canned chili beans':2784,
  // Canned protein
  'canned tuna':2781,'canned chicken':2781,'canned salmon':2781,'sardines canned':2781,
  'canned spam':2781,'canned corned beef':2781,'vienna sausages canned':2781,'canned crab meat':2781,
  // Canned fruit
  'canned peaches':2783,'canned pineapple':2783,'canned fruit cocktail':2783,'canned mandarin oranges':2783,
  'canned pears':2783,'applesauce cups':2783,'canned cherries':2783,
  // Pasta & noodles
  'spaghetti pasta':2785,'penne pasta':2785,'rigatoni pasta':2785,'linguine pasta':2785,
  'angel hair pasta':2785,'elbow macaroni':2785,'egg noodles':2785,'lasagna noodles':2785,
  'ramen noodles':2785,'rice noodles':2785,'lo mein noodles':2785,
  // Pasta sauce
  'pasta sauce':2785,'marinara sauce':2785,'alfredo sauce':2785,'pesto sauce':2785,
  // Rice & grains
  'white rice':2786,'brown rice':2786,'jasmine rice':2786,'basmati rice':2786,
  'instant rice':2786,'yellow rice mix':2786,'wild rice':2786,
  'quinoa':2786,'couscous':2786,'grits':2786,
  // Beans & legumes
  'black beans canned':2783,'pinto beans canned':2783,'kidney beans canned':2783,
  'garbanzo beans canned':2783,'navy beans canned':2783,'refried beans':2783,
  'lentils dry':2786,'split peas dry':2786,
  // Condiments
  'ketchup':2787,'mustard':2787,'yellow mustard':2787,'dijon mustard':2787,
  'mayonnaise':2787,'relish':2787,'hot sauce':2787,'sriracha':2787,
  'soy sauce':2787,'teriyaki sauce':2787,'worcestershire sauce':2787,
  'steak sauce':2787,'barbecue sauce':2787,'buffalo sauce':2787,
  // Cooking oils
  'olive oil':2788,'extra virgin olive oil':2788,'vegetable oil':2788,'canola oil':2788,
  'coconut oil':2788,'avocado oil':2788,'sesame oil':2788,'cooking spray':2788,
  // Vinegar
  'vinegar':2788,'apple cider vinegar':2788,'balsamic vinegar':2788,'rice vinegar':2788,
  // Salad dressing
  'ranch dressing':2787,'italian dressing':2787,'caesar dressing':2787,'balsamic dressing':2787,
  'thousand island dressing':2787,'honey mustard dressing':2787,
  // Breakfast cereal
  'cereal':2789,'cheerios':2789,'frosted flakes':2789,'granola':2789,
  'oatmeal':2789,'instant oatmeal':2789,'cream of wheat':2789,
  // Breakfast
  'pancake mix':2789,'waffle mix':2789,'maple syrup':2789,'pancake syrup':2789,
  // Snacks - chips
  'potato chips':2790,'tortilla chips':2790,'pretzels':2790,'cheese puffs':2790,
  'pork rinds':2790,'veggie chips':2790,'kettle chips':2790,
  // Snacks - crackers
  'crackers':2790,'saltine crackers':2790,'graham crackers':2790,'rice cakes':2790,
  'animal crackers':2790,'cheese crackers':2790,
  // Snacks - popcorn & nuts
  'microwave popcorn':2790,'mixed nuts':2790,'peanuts':2790,'almonds':2790,
  'cashews':2790,'trail mix':2790,'sunflower seeds':2790,
  // Spreads
  'peanut butter':2789,'almond butter':2789,'grape jelly':2789,'strawberry jam':2789,
  'nutella':2789,'honey':2789,'marshmallow fluff':2789,
  // Baking
  'all purpose flour':2791,'bread flour':2791,'cake flour':2791,
  'granulated sugar':2791,'brown sugar':2791,'powdered sugar':2791,
  'chocolate chips':2791,'baking soda':2791,'baking powder':2791,
  'vanilla extract':2791,'cocoa powder':2791,'cornstarch':2791,
  'evaporated milk':2791,'condensed milk':2791,'cream of tartar':2791,
  'cake mix':2791,'brownie mix':2791,'muffin mix':2791,
  'pie crust':2791,'frosting':2791,'food coloring':2791,
  // Beverages
  'orange juice':2792,'apple juice':2792,'grape juice':2792,'cranberry juice':2792,
  'lemonade':2792,'fruit punch':2792,
  'coca cola soda':2792,'pepsi soda':2792,'ginger ale':2792,'sprite soda':2792,
  'bottled water':2792,'sparkling water':2792,'coconut water':2792,
  'ground coffee':2793,'instant coffee':2793,'coffee pods keurig':2793,
  'tea bags':2793,'green tea bags':2793,'herbal tea':2793,
  // Milk alternatives
  'coconut milk':2792,'almond milk shelf stable':2792,'oat milk shelf stable':2792,
  // Mexican food
  'flour tortillas':2794,'corn tortillas':2794,'taco shells':2794,
  'salsa':2794,'enchilada sauce':2794,'taco seasoning':2794,
  'canned green chilies':2794,'canned jalapenos':2794,'queso dip':2794,
  // Asian food
  'hoisin sauce':2795,'fish sauce':2795,'oyster sauce':2795,
  'curry paste':2795,'thai curry sauce':2795,'chili garlic sauce':2795,
  'mirin':2795,'stir fry sauce':2795,
  // Broth & stock
  'chicken broth':2784,'beef broth':2784,'vegetable broth':2784,
  'bone broth':2784,'chicken stock':2784,
  // Gravy
  'gravy mix':2787,'brown gravy':2787,'turkey gravy':2787,
  // Convenience
  'mac and cheese':2785,'hamburger helper':2785,'stuffing mix':2785,
  'breadcrumbs':2791,'panko breadcrumbs':2791,'croutons':2791,
  'instant mashed potatoes':2785,'rice a roni':2786,
  // Spices & seasonings
  'black pepper':2796,'garlic powder':2796,'onion powder':2796,
  'paprika':2796,'cumin':2796,'chili powder':2796,'italian seasoning':2796,
  'cinnamon':2796,'nutmeg':2796,'bay leaves':2796,
  'salt':2796,'sea salt':2796,'seasoned salt':2796,
  'adobo seasoning':2796,'cajun seasoning':2796,'everything bagel seasoning':2796,
  'goya seasoning':2796,'lemon pepper seasoning':2796,
  // Caribbean & Latin
  'goya black beans':2797,'goya yellow rice':2797,'goya adobo':2797,
  'plantain chips':2797,'badia complete seasoning':2797,
  'sofrito':2797,'mojo sauce':2797,'sazon seasoning':2797,
  'achiote paste':2797,'malta drink':2797,
  // Dried goods
  'dried pasta':2785,'dried lentils':2786,'dried black beans':2786,
  'cornmeal':2791,'masa harina':2791,'semolina flour':2791,
  // Canned ready meals
  'canned ravioli':2785,'canned spaghetti':2785,'baked beans canned':2783,
  'pork and beans':2783,'canned tamales':2794,
};

const DEFAULT_CATEGORY = 2783;

// =============================================================================
// CATEGORY GROUP for SEO descriptions
// =============================================================================
const CATEGORY_GROUPS = {
  2781: { name: 'Canned Protein', uses: ['sandwiches', 'salads', 'pasta dishes', 'quick meals', 'meal prep'], kw: 'canned protein' },
  2783: { name: 'Canned Goods', uses: ['soups', 'stews', 'casseroles', 'side dishes', 'quick weeknight meals', 'recipes'], kw: 'canned goods' },
  2784: { name: 'Soups & Broths', uses: ['quick lunches', 'cold weather comfort meals', 'recipe bases', 'easy dinners'], kw: 'soups and broths' },
  2785: { name: 'Pasta & Noodles', uses: ['family dinners', 'weeknight meals', 'Italian recipes', 'casseroles', 'meal prep'], kw: 'pasta and noodles' },
  2786: { name: 'Rice & Grains', uses: ['side dishes', 'grain bowls', 'stir-fry', 'meal prep', 'international recipes'], kw: 'rice and grains' },
  2787: { name: 'Condiments & Sauces', uses: ['grilling', 'dipping', 'sandwiches', 'marinades', 'dressings', 'everyday cooking'], kw: 'condiments and sauces' },
  2788: { name: 'Cooking Oils & Vinegars', uses: ['sautéing', 'baking', 'salad dressings', 'marinades', 'everyday cooking'], kw: 'cooking oils' },
  2789: { name: 'Breakfast & Cereals', uses: ['quick breakfasts', 'on-the-go mornings', 'family breakfast', 'snacking', 'baking'], kw: 'breakfast foods' },
  2790: { name: 'Snacks', uses: ['after-school snacking', 'game day', 'lunch boxes', 'parties', 'on-the-go nibbling'], kw: 'snacks' },
  2791: { name: 'Baking Essentials', uses: ['cakes', 'cookies', 'breads', 'holiday baking', 'pastries', 'homemade desserts'], kw: 'baking supplies' },
  2792: { name: 'Beverages', uses: ['family meals', 'parties', 'everyday hydration', 'entertaining', 'packed lunches'], kw: 'beverages' },
  2793: { name: 'Coffee & Tea', uses: ['morning routines', 'afternoon pick-me-ups', 'relaxing evenings', 'entertaining guests'], kw: 'coffee and tea' },
  2794: { name: 'Mexican & Latin Foods', uses: ['taco night', 'enchiladas', 'burritos', 'Latin recipes', 'family fiestas'], kw: 'Mexican and Latin foods' },
  2795: { name: 'Asian Foods', uses: ['stir-fry', 'noodle bowls', 'curry nights', 'Asian-inspired recipes', 'dipping sauces'], kw: 'Asian foods' },
  2796: { name: 'Spices & Seasonings', uses: ['everyday cooking', 'grilling', 'marinades', 'soups', 'international cuisine'], kw: 'spices and seasonings' },
  2797: { name: 'Caribbean & Latin Specialties', uses: ['Caribbean recipes', 'Latin cooking', 'island-inspired meals', 'traditional dishes'], kw: 'Caribbean and Latin groceries' },
};

// =============================================================================
// SEO DESCRIPTION GENERATOR
// =============================================================================
function extractSize(name) {
  var m = name.match(/(\d+\.?\d*)\s*(oz|lb|fl\s*oz|ml|l|g|kg|ct|count|pack|qt|gal|liter)/i);
  return m ? (m[1] + ' ' + m[2].replace(/\s+/g, ' ')) : '';
}

const BRAND_INTROS = [
  '{brand} delivers trusted quality you can count on.',
  'From {brand}, a name families have relied on for generations.',
  '{brand} brings you everyday essentials at great value.',
  'Trust {brand} for consistent flavor and quality.',
  '{brand} — quality ingredients your family deserves.',
];

const USE_TEMPLATES = [
  'Perfect for {use1}, {use2}, and {use3}.',
  'Ideal for {use1} and {use2}, or enjoy as part of {use3}.',
  'A versatile pantry pick for {use1}, {use2}, or {use3}.',
  'Great for {use1} and equally delicious in {use2} or {use3}.',
  'Whether you\'re making {use1}, {use2}, or {use3}, this is a must-have.',
];

const CLOSINGS = [
  'Shop {kw} at StoresGo with same-day grocery delivery across South Florida.',
  'Order {kw} online at StoresGo — fast delivery to Miami-Dade, Broward, and Palm Beach.',
  'Buy {kw} at StoresGo. South Florida\'s marketplace for authentic grocery delivery.',
  'Available now at StoresGo with convenient delivery across the South Florida tri-county area.',
  'Get {kw} delivered to your door from StoresGo, South Florida\'s premier grocery marketplace.',
];

function pick(arr, seed) {
  return arr[Math.abs(seed) % arr.length];
}

function hashStr(s) {
  var h = 0;
  for (var i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h |= 0; }
  return h;
}

function generateDescription(product, catId) {
  var group = CATEGORY_GROUPS[catId] || CATEGORY_GROUPS[2783];
  var brand = product.brand || 'This product';
  var name = product.name;
  var size = extractSize(name);
  var seed = hashStr(name);

  // Line 1: Product intro with size
  var intro = size
    ? `${name} (${size}) — a quality ${group.name.toLowerCase()} selection for your pantry.`
    : `${name} — a quality ${group.name.toLowerCase()} selection for your pantry.`;

  // Line 2: Brand trust line
  var brandLine = pick(BRAND_INTROS, seed).replace(/{brand}/g, brand);

  // Line 3: Use cases
  var uses = group.uses.slice();
  // Shuffle based on product name for variety
  uses.sort(function(a, b) { return hashStr(a + name) - hashStr(b + name); });
  var useLine = pick(USE_TEMPLATES, seed + 1)
    .replace('{use1}', uses[0])
    .replace('{use2}', uses[1])
    .replace('{use3}', uses[2]);

  // Line 4: Rating line (if available)
  var ratingLine = '';
  if (product.rating && product.rating >= 4.0) {
    ratingLine = `Rated ${product.rating} out of 5 stars by shoppers. `;
  }

  // Line 5: Closing CTA
  var closing = pick(CLOSINGS, seed + 2).replace(/{kw}/g, group.kw);

  return `${intro} ${brandLine} ${useLine} ${ratingLine}${closing}`;
}

// =============================================================================
// SLUG GENERATOR
// =============================================================================
function makeSlug(name) {
  return name.toLowerCase()
    .replace(/['']/g, '')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 120);
}

// =============================================================================
// OCI IMAGE UPLOAD
// =============================================================================
let s3Client = null;
let PutObjectCommand = null;

async function initOci() {
  try {
    var sdk = require('@aws-sdk/client-s3');
    s3Client = new sdk.S3Client({
      region: OCI_REGION,
      endpoint: OCI_ENDPOINT,
      credentials: { accessKeyId: OCI_ACCESS_KEY, secretAccessKey: OCI_SECRET_KEY },
      forcePathStyle: true,
    });
    PutObjectCommand = sdk.PutObjectCommand;
    console.log('✅ OCI S3 client initialized');
    return true;
  } catch (e) {
    console.log('⚠️  AWS SDK not available: ' + e.message);
    return false;
  }
}

function downloadImage(url) {
  return new Promise(function(resolve, reject) {
    var proto = url.startsWith('https') ? https : http;
    var req = proto.get(url, { timeout: 15000 }, function(res) {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        downloadImage(res.headers.location).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) { reject(new Error('HTTP ' + res.statusCode)); return; }
      var chunks = [];
      res.on('data', function(c) { chunks.push(c); });
      res.on('end', function() { resolve(Buffer.concat(chunks)); });
      res.on('error', reject);
    });
    req.on('error', reject);
    req.on('timeout', function() { req.destroy(); reject(new Error('timeout')); });
  });
}

async function uploadToOci(buffer, objectKey, contentType) {
  if (!s3Client) return null;
  try {
    await s3Client.send(new PutObjectCommand({
      Bucket: OCI_BUCKET,
      Key: objectKey,
      Body: buffer,
      ContentType: contentType || 'image/jpeg',
    }));
    return `${OCI_PUBLIC_BASE}/${encodeURIComponent(objectKey)}`;
  } catch (e) {
    return null;
  }
}

async function migrateImage(product, dbId) {
  if (!product.imageUrl) return null;
  try {
    var buffer = await downloadImage(product.imageUrl);
    var slug = makeSlug(product.name);
    var ext = '.jpg';
    if (product.imageUrl.includes('.png')) ext = '.png';
    else if (product.imageUrl.includes('.webp')) ext = '.webp';
    var objectKey = `products/storesgo-${slug}-${dbId}${ext}`;
    var ociUrl = await uploadToOci(buffer, objectKey, ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg');
    return ociUrl;
  } catch (e) {
    return null;
  }
}

// =============================================================================
// HTTP helper for Meilisearch
// =============================================================================
function httpPost(url, data, headers) {
  return new Promise(function(resolve, reject) {
    var parsed = new URL(url);
    var body = JSON.stringify(data);
    var opts = {
      hostname: parsed.hostname, port: parsed.port, path: parsed.pathname,
      method: 'POST', headers: Object.assign({ 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }, headers),
    };
    var req = http.request(opts, function(res) {
      var chunks = [];
      res.on('data', function(c) { chunks.push(c); });
      res.on('end', function() { try { resolve(JSON.parse(Buffer.concat(chunks).toString())); } catch(e) { resolve({}); } });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// =============================================================================
// MAIN
// =============================================================================
async function main() {
  console.log('=== StoresGo Walmart 10K Import ===');
  console.log('Mode:', DRY_RUN ? 'DRY RUN' : 'LIVE');
  console.log('Images:', SKIP_IMAGES ? 'SKIP' : 'OCI Upload');
  console.log('');

  // Load scraped data
  var raw = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf8'));
  console.log('Loaded ' + raw.length + ' products from ' + INPUT_FILE);

  // Filter valid products
  var valid = raw.filter(function(p) {
    return p.inStock && p.imageUrl && p.price && p.price > 0 && p.name;
  });
  console.log('After filtering (in-stock + image + price): ' + valid.length);

  // Connect to DB and get existing externalIds for this seller
  var db = new Client(PG);
  await db.connect();

  var existing = await db.query('SELECT "externalId" FROM products WHERE "sellerId"=$1 AND "externalId" IS NOT NULL', [SELLER_ID]);
  var existingIds = {};
  existing.rows.forEach(function(r) { existingIds[r.externalId] = true; });
  console.log('Existing products for seller ' + SELLER_ID + ': ' + existing.rows.length);

  // Deduplicate
  var newProducts = valid.filter(function(p) { return !existingIds['walmart-' + p.walmartId]; });
  console.log('New products after dedup: ' + newProducts.length);

  if (newProducts.length === 0) {
    console.log('Nothing new to import.');
    await db.end();
    return;
  }

  // Stats
  var prices = newProducts.map(function(p) { return p.price; });
  console.log('\nPrice range: $' + Math.min.apply(null, prices).toFixed(2) + ' - $' + Math.max.apply(null, prices).toFixed(2));
  console.log('After 45% markup: $' + (Math.min.apply(null, prices) * MARKUP).toFixed(2) + ' - $' + (Math.max.apply(null, prices) * MARKUP).toFixed(2));

  // Category distribution
  var catDist = {};
  newProducts.forEach(function(p) {
    var catId = CATEGORY_MAP[p.category] || DEFAULT_CATEGORY;
    var group = CATEGORY_GROUPS[catId] || { name: 'Other' };
    catDist[group.name] = (catDist[group.name] || 0) + 1;
  });
  console.log('\nCategory distribution:');
  Object.keys(catDist).sort(function(a,b){return catDist[b]-catDist[a];}).forEach(function(k) {
    console.log('  ' + k + ': ' + catDist[k]);
  });

  // Sample descriptions
  console.log('\n--- Sample SEO Descriptions ---');
  for (var s = 0; s < Math.min(3, newProducts.length); s++) {
    var sp = newProducts[s];
    var scatId = CATEGORY_MAP[sp.category] || DEFAULT_CATEGORY;
    console.log('\n[' + sp.name + ']');
    console.log(generateDescription(sp, scatId).substring(0, 300) + '...');
  }

  if (DRY_RUN) {
    console.log('\n=== DRY RUN COMPLETE ===');
    console.log('Would insert: ' + newProducts.length + ' products');
    await db.end();
    return;
  }

  // =========================================================================
  // PHASE 1: INSERT PRODUCTS
  // =========================================================================
  console.log('\n--- Phase 1: Inserting products ---');
  var insertedIds = []; // { dbId, product, catId }
  var skipped = 0;
  var batchSize = 500;

  for (var i = 0; i < newProducts.length; i++) {
    var p = newProducts[i];
    var catId = CATEGORY_MAP[p.category] || DEFAULT_CATEGORY;
    var priceCents = Math.round(p.price * 100 * MARKUP);
    var sku = 'GKM-' + crypto.randomBytes(4).toString('hex').toUpperCase();
    var slug = makeSlug(p.name) + '-PLACEHOLDER'; // will update with real ID
    var description = generateDescription(p, catId);

    try {
      var res = await db.query(
        `INSERT INTO products (
          name, slug, description, "priceCents", "imageUrl", "sellerId", "storeId",
          category_id, sku, "isActive", status, "externalId", "sourceImageUrl",
          "createdAt", "updatedAt"
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,NOW(),NOW()) RETURNING id`,
        [
          p.name, slug, description, priceCents, p.imageUrl, SELLER_ID, STORE_ID,
          catId, sku, true, 'approved', 'walmart-' + p.walmartId, p.imageUrl,
        ]
      );
      var dbId = res.rows[0].id;
      insertedIds.push({ dbId: dbId, product: p, catId: catId });
    } catch (e) {
      skipped++;
      if (skipped <= 3) console.log('  Skip: ' + p.name.substring(0, 50) + ' — ' + e.message.substring(0, 80));
    }

    if ((i + 1) % batchSize === 0) {
      console.log('  Inserted ' + insertedIds.length + '/' + (i + 1) + ' (skipped: ' + skipped + ')');
    }
  }
  console.log('  Inserted ' + insertedIds.length + ' (skipped: ' + skipped + ')');

  // =========================================================================
  // PHASE 2: FIX SLUGS (name-{id} format)
  // =========================================================================
  console.log('\n--- Phase 2: Fixing slugs ---');
  var ids = insertedIds.map(function(x) { return x.dbId; });
  if (ids.length > 0) {
    await db.query(
      `UPDATE products SET slug = regexp_replace(slug, '-PLACEHOLDER$', '') || '-' || id
       WHERE id = ANY($1::int[])`, [ids]
    );
    console.log('  Updated ' + ids.length + ' slugs');
  }

  // =========================================================================
  // PHASE 3: IMAGE MIGRATION TO OCI
  // =========================================================================
  if (!SKIP_IMAGES) {
    console.log('\n--- Phase 3: Migrating images to OCI ---');
    var ociOk = await initOci();
    if (ociOk) {
      var migrated = 0;
      var imgFailed = 0;
      var total = insertedIds.length;

      // Process in concurrent batches
      for (var b = 0; b < total; b += IMAGE_CONCURRENCY) {
        var batch = insertedIds.slice(b, b + IMAGE_CONCURRENCY);
        var results = await Promise.allSettled(
          batch.map(async function(item) {
            var ociUrl = await migrateImage(item.product, item.dbId);
            if (ociUrl) {
              await db.query('UPDATE products SET "imageUrl"=$1 WHERE id=$2', [ociUrl, item.dbId]);
              // Insert into product_images table
              await db.query(
                `INSERT INTO product_images ("productId", url, "altText", "sortOrder", "isPrimary", "createdAt")
                 VALUES ($1, $2, $3, 0, true, NOW())`,
                [item.dbId, ociUrl, item.product.name]
              );
              return true;
            }
            return false;
          })
        );

        results.forEach(function(r) {
          if (r.status === 'fulfilled' && r.value) migrated++;
          else imgFailed++;
        });

        if ((b + IMAGE_CONCURRENCY) % 300 < IMAGE_CONCURRENCY || b + IMAGE_CONCURRENCY >= total) {
          var pct = Math.round(((b + batch.length) / total) * 100);
          console.log('  Images: ' + migrated + ' migrated, ' + imgFailed + ' failed (' + pct + '%)');
        }
      }
      console.log('  Final: ' + migrated + ' on OCI, ' + imgFailed + ' kept Walmart CDN');
    } else {
      console.log('  ⚠️  Skipping — AWS SDK not available. Products use Walmart image URLs.');
    }
  } else {
    console.log('\n--- Phase 3: SKIPPED (--skip-images) ---');
  }

  // =========================================================================
  // PHASE 4: MEILISEARCH SYNC
  // =========================================================================
  console.log('\n--- Phase 4: Syncing to Meilisearch ---');
  var meiliQuery = await db.query(
    `SELECT id, name, slug, "priceCents", "imageUrl", "sellerId", "storeId",
     category_id AS "categoryId", "isActive", status, description
     FROM products WHERE id = ANY($1::int[])`, [ids]
  );
  var meiliBatch = 500;
  for (var m = 0; m < meiliQuery.rows.length; m += meiliBatch) {
    var slice = meiliQuery.rows.slice(m, m + meiliBatch);
    try {
      var mRes = await httpPost(
        MEILI_HOST + '/indexes/products/documents',
        slice,
        { 'Authorization': 'Bearer ' + MEILI_KEY }
      );
      console.log('  Meili batch ' + (Math.floor(m / meiliBatch) + 1) + ': task ' + (mRes.taskUid || '?'));
    } catch (e) {
      console.log('  Meili error: ' + e.message);
    }
  }

  // =========================================================================
  // PHASE 5: SAVE ROLLBACK
  // =========================================================================
  var rollback = { seller: SELLER_ID, store: STORE_ID, ids: ids, count: ids.length, date: new Date().toISOString() };
  fs.writeFileSync('walmart-10k-rollback.json', JSON.stringify(rollback, null, 2));
  console.log('\nRollback saved: walmart-10k-rollback.json');

  // =========================================================================
  // SUMMARY
  // =========================================================================
  var totalForSeller = await db.query('SELECT COUNT(*) FROM products WHERE "sellerId"=$1', [SELLER_ID]);
  await db.end();

  console.log('\n=== IMPORT COMPLETE ===');
  console.log('New products inserted: ' + insertedIds.length);
  console.log('Skipped (errors/dupes): ' + skipped);
  console.log('Total products for seller ' + SELLER_ID + ': ' + totalForSeller.rows[0].count);
  console.log('Seller: ' + SELLER_ID + ' | Store: ' + STORE_ID + ' | Markup: 45%');
}

main().catch(function(e) { console.error(e); process.exit(1); });
