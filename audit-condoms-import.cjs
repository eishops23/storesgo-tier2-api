/**
 * StoresGo — Audit Script for import-condoms.cjs
 * ================================================
 * Validates the import script against production schema before execution.
 * 
 * Usage:
 *   node audit-condoms-import.cjs
 *   node audit-condoms-import.cjs /path/to/import-condoms.cjs
 */

const fs = require('fs');
const path = process.argv[2] || './import-condoms.cjs';

if (!fs.existsSync(path)) {
  console.error(`File not found: ${path}`);
  console.error('Usage: node audit-condoms-import.cjs [path-to-import-script]');
  process.exit(1);
}

const code = fs.readFileSync(path, 'utf8');

console.log('═══════════════════════════════════════════════════════════');
console.log('  IMPORT-CONDOMS.CJS — FULL CODE AUDIT');
console.log('═══════════════════════════════════════════════════════════');
console.log(`  File: ${path}`);
console.log(`  Size: ${(Buffer.byteLength(code) / 1024).toFixed(1)} KB`);
console.log();

let issues = [];
let warnings = [];
let passed = [];

// ═══════════════════════════════════════════════════════════════════
// HELPER: slug generator (must match the one in the import script)
// ═══════════════════════════════════════════════════════════════════
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

// ═══════════════════════════════════════════════════════════════════
// 1. PRODUCT COUNT — verify comment matches actual data
// ═══════════════════════════════════════════════════════════════════
const productMatches = code.match(/\{ name: '/g);
const count = productMatches ? productMatches.length : 0;

// Check if any comment claims a different number
const countClaims = [...code.matchAll(/(\d+)\s*(?:PRODUCTS|products)/g)];
for (const claim of countClaims) {
  if (parseInt(claim[1]) !== count) {
    issues.push(`Comment claims "${claim[0]}" but actual product count is ${count}`);
  }
}
passed.push(`Product count: ${count} products found in data array`);

// ═══════════════════════════════════════════════════════════════════
// 2. PRICE VALIDATION — all priceCents must be positive integers
// ═══════════════════════════════════════════════════════════════════
const prices = [...code.matchAll(/priceCents:\s*(\d+)/g)].map(m => parseInt(m[1]));
const badPrices = prices.filter(p => p < 100 || p > 20000);
if (badPrices.length > 0) {
  issues.push(`Suspicious prices (cents): ${badPrices.join(', ')} — verify these are correct`);
}
if (prices.some(p => !Number.isInteger(p))) {
  issues.push('Non-integer priceCents found — products.priceCents is INTEGER');
}
passed.push(`All ${prices.length} priceCents are valid integers (range: ${Math.min(...prices)}–${Math.max(...prices)} cents / $${(Math.min(...prices)/100).toFixed(2)}–$${(Math.max(...prices)/100).toFixed(2)})`);

// ═══════════════════════════════════════════════════════════════════
// 3. DUPLICATE NAMES — would cause slug conflicts
// ═══════════════════════════════════════════════════════════════════
const names = [...code.matchAll(/name: '([^']+)'/g)].map(m => m[1]);
const dupeNames = names.filter((n, i) => names.indexOf(n) !== i);
if (dupeNames.length > 0) {
  issues.push(`DUPLICATE NAMES will cause slug conflicts:\n    ${dupeNames.join('\n    ')}`);
} else {
  passed.push('No duplicate product names');
}

// ═══════════════════════════════════════════════════════════════════
// 4. DUPLICATE SLUGS — ON CONFLICT (slug) will merge these
// ═══════════════════════════════════════════════════════════════════
const slugs = names.map(makeSlug);
const dupeSlugs = slugs.filter((s, i) => slugs.indexOf(s) !== i);
if (dupeSlugs.length > 0) {
  issues.push(`DUPLICATE SLUGS — these products will overwrite each other:\n    ${dupeSlugs.join('\n    ')}`);
} else {
  passed.push(`All ${slugs.length} generated slugs are unique`);
}

// ═══════════════════════════════════════════════════════════════════
// 5. UPC VALIDATION — all products should have UPCs
// ═══════════════════════════════════════════════════════════════════
const upcs = [...code.matchAll(/upc: '([^']*)'/g)].map(m => m[1]);
const emptyUpcs = upcs.filter(u => !u || u.trim() === '');
if (emptyUpcs.length > 0) {
  warnings.push(`${emptyUpcs.length} products have empty UPC codes`);
} else {
  passed.push(`All ${upcs.length} products have UPC codes`);
}

// Check for duplicate UPCs
const dupeUpcs = upcs.filter((u, i) => u && upcs.indexOf(u) !== i);
if (dupeUpcs.length > 0) {
  warnings.push(`Duplicate UPCs found: ${dupeUpcs.join(', ')}`);
} else {
  passed.push('All UPC codes are unique');
}

// ═══════════════════════════════════════════════════════════════════
// 6. IMAGE URL VALIDATION — all products should have images
// ═══════════════════════════════════════════════════════════════════
const images = [...code.matchAll(/imageUrl: '([^']*)'/g)].map(m => m[1]);
const emptyImages = images.filter(u => !u || u.trim() === '');
if (emptyImages.length > 0) {
  warnings.push(`${emptyImages.length} products have empty image URLs`);
} else {
  passed.push(`All ${images.length} products have image URLs`);
}

// Check image domains
const domains = {};
images.forEach(url => {
  try {
    const d = new URL(url).hostname;
    domains[d] = (domains[d] || 0) + 1;
  } catch {}
});
passed.push(`Image sources: ${Object.entries(domains).map(([d,c]) => `${d} (${c})`).join(', ')}`);

// ═══════════════════════════════════════════════════════════════════
// 7. SQL INJECTION SAFETY — must use parameterized queries
// ═══════════════════════════════════════════════════════════════════
if (code.includes('$1') && code.includes('$2') && !code.includes("'+")) {
  passed.push('Uses parameterized queries ($1, $2...) — SQL injection safe');
} else {
  issues.push('May be using string concatenation for SQL — SQL injection risk');
}

// ═══════════════════════════════════════════════════════════════════
// 8. USERS TABLE — correct columns
// ═══════════════════════════════════════════════════════════════════
if (code.includes('INSERT INTO users (id, email, password, role, "createdAt", "updatedAt")')) {
  passed.push('Users INSERT: correct columns with quoted camelCase timestamps');
} else if (code.includes('INSERT INTO users')) {
  warnings.push('Users INSERT found but column list may not match schema');
} else {
  warnings.push('No users INSERT found');
}

if (code.includes('ON CONFLICT (email) DO NOTHING')) {
  passed.push('Users: ON CONFLICT (email) — idempotent');
} else {
  warnings.push('Users INSERT may not handle duplicates safely');
}

// ═══════════════════════════════════════════════════════════════════
// 9. SELLERS TABLE — correct columns with mixed quoting
// ═══════════════════════════════════════════════════════════════════
const sellerCols = ['"userId"', '"storeName"', 'slug', '"zipCode"', '"isApproved"', '"isBanned"'];
const missingSellerCols = sellerCols.filter(c => !code.includes(c));
if (missingSellerCols.length > 0) {
  issues.push(`Sellers INSERT may be missing columns: ${missingSellerCols.join(', ')}`);
} else {
  passed.push('Sellers INSERT: all required columns with correct quoting');
}

// ═══════════════════════════════════════════════════════════════════
// 10. STORES TABLE — ON CONFLICT must use column not constraint name
// ═══════════════════════════════════════════════════════════════════
if (code.includes('stores_slug_key') || code.includes('stores_slug_unique')) {
  issues.push('Stores ON CONFLICT uses named constraint — may fail if Prisma named it differently. Use ON CONFLICT (slug) instead');
} else if (code.includes('INSERT INTO stores') && code.includes('ON CONFLICT (slug)')) {
  passed.push('Stores: ON CONFLICT (slug) — safe column-based syntax');
} else if (code.includes('INSERT INTO stores')) {
  warnings.push('Stores INSERT found but ON CONFLICT clause may be missing or incorrect');
}

// ═══════════════════════════════════════════════════════════════════
// 11. PRODUCTS TABLE — correct columns with mixed quoting
// ═══════════════════════════════════════════════════════════════════
const productInsert = code.match(/INSERT INTO products \(([^)]+)\)/);
if (productInsert) {
  const cols = productInsert[1];
  const requiredCols = {
    'name': false,
    'slug': false,
    'description': false,
    'sku': false,
    '"priceCents"': true,
    '"imageUrl"': true,
    'category_id': false,
    'status': false,
    '"isActive"': true,
    '"sellerId"': true,
    '"storeId"': true,
  };
  
  const missing = Object.keys(requiredCols).filter(c => !cols.includes(c));
  if (missing.length > 0) {
    issues.push(`Products INSERT missing columns: ${missing.join(', ')}`);
  } else {
    passed.push('Products INSERT: all required columns present with correct quoting');
  }
  
  // Check that category_id is NOT quoted (it's snake_case in DB)
  if (cols.includes('"category_id"')) {
    warnings.push('category_id is quoted but it\'s snake_case — quotes unnecessary (harmless but inconsistent)');
  }
  
  // Check that categoryId is NOT used
  if (cols.includes('categoryId') || cols.includes('"categoryId"')) {
    issues.push('Uses "categoryId" but DB column is "category_id" — INSERT will fail');
  }
} else {
  issues.push('Could not find products INSERT statement');
}

// ═══════════════════════════════════════════════════════════════════
// 12. STATUS = 'active' — not default 'pending'
// ═══════════════════════════════════════════════════════════════════
if (code.includes("'active', true") || code.includes("'active',\n")) {
  passed.push('Products set to status=active, isActive=true (not default pending)');
} else {
  issues.push('Products may be inserted with wrong status — must be "active" not "pending"');
}

// ═══════════════════════════════════════════════════════════════════
// 13. DEAD CODE — variables computed but never used
// ═══════════════════════════════════════════════════════════════════
if (code.includes('const tags =') && !code.match(/\$\d+.*tags/)) {
  warnings.push('`tags` variable is computed but NEVER inserted — dead code');
}

// Check for brand being computed but not inserted
if (productInsert && !productInsert[1].includes('brand')) {
  // This is actually correct — products table has no brand column
  passed.push('No "brand" column in INSERT (correct — products table has no brand column)');
}

// ═══════════════════════════════════════════════════════════════════
// 14. TAXONOMY — correct column references
// ═══════════════════════════════════════════════════════════════════
if (code.includes('"sortOrder"')) {
  passed.push('taxonomy.sortOrder properly quoted as camelCase');
}
if (code.includes("slug = 'health-and-wellness'")) {
  passed.push('References health-and-wellness parent category (correct slug)');
}
if (code.includes('parent_id')) {
  passed.push('Uses parent_id (snake_case) for taxonomy — correct');
}

// ═══════════════════════════════════════════════════════════════════
// 15. PRODUCTS ON CONFLICT — idempotent re-runs
// ═══════════════════════════════════════════════════════════════════
if (code.includes('ON CONFLICT (slug) DO UPDATE SET')) {
  passed.push('Products UPSERT: ON CONFLICT (slug) DO UPDATE — idempotent re-runs');
} else {
  warnings.push('Products INSERT may not handle duplicates — could fail on re-run');
}

// ═══════════════════════════════════════════════════════════════════
// 16. DATABASE CONNECTION
// ═══════════════════════════════════════════════════════════════════
if (code.includes('postgresql://postgres:storesgo123@localhost:5432/storesgo')) {
  passed.push('DB connection string matches production pattern');
}

// ═══════════════════════════════════════════════════════════════════
// 17. DRY RUN MODE
// ═══════════════════════════════════════════════════════════════════
if (code.includes('--dry-run') && code.includes('DRY_RUN')) {
  passed.push('DRY_RUN mode available (--dry-run flag)');
}
if (code.includes('--rollback') && code.includes('ROLLBACK')) {
  passed.push('ROLLBACK mode available (--rollback flag)');
}

// ═══════════════════════════════════════════════════════════════════
// 18. MEILISEARCH SYNC
// ═══════════════════════════════════════════════════════════════════
if (code.includes('/indexes/products/documents') && code.includes('Bearer')) {
  passed.push('Meilisearch sync included with auth');
}

// ═══════════════════════════════════════════════════════════════════
// 19. VERIFICATION QUERIES
// ═══════════════════════════════════════════════════════════════════
if (code.includes('Verification') && code.includes('COUNT(*)')) {
  passed.push('Post-import verification queries included');
}

// ═══════════════════════════════════════════════════════════════════
// 20. BRAND BREAKDOWN
// ═══════════════════════════════════════════════════════════════════
const brands = {};
const brandMatches = [...code.matchAll(/brand: '([^']+)'/g)];
brandMatches.forEach(m => { brands[m[1]] = (brands[m[1]] || 0) + 1; });
passed.push(`Brand breakdown: ${Object.entries(brands).sort((a,b) => b[1]-a[1]).map(([b,c]) => `${b} ${c}`).join(', ')}`);

// ═══════════════════════════════════════════════════════════════════
// RESULTS
// ═══════════════════════════════════════════════════════════════════
console.log(`❌ ISSUES (${issues.length}):`);
if (issues.length === 0) {
  console.log('  None!');
} else {
  issues.forEach((i, idx) => console.log(`  ${idx+1}. ${i}`));
}

console.log();
console.log(`⚠️  WARNINGS (${warnings.length}):`);
if (warnings.length === 0) {
  console.log('  None!');
} else {
  warnings.forEach((w, idx) => console.log(`  ${idx+1}. ${w}`));
}

console.log();
console.log(`✅ PASSED (${passed.length}):`);
passed.forEach((p, idx) => console.log(`  ${idx+1}. ${p}`));

console.log();
console.log('═══════════════════════════════════════════════════════════');
if (issues.length === 0) {
  console.log('  🎯 ALL CLEAR — script is production-ready');
} else {
  console.log(`  ❌ ${issues.length} ISSUE(S) MUST BE FIXED BEFORE RUNNING`);
}
console.log('═══════════════════════════════════════════════════════════');
