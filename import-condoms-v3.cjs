/**
 * StoresGo — Condom Import with New "StoresGo Health & Wellness" Seller
 * =====================================================================
 * Creates: user → seller → store → categories → 55 products
 * 
 * MATCHES PRODUCTION SCHEMA:
 *   - sellers: camelCase columns (storeName, userId, isApproved, etc.)
 *   - products: mixed (sellerId, priceCents, category_id, isActive, storeId)
 *   - categories: (name, slug, parentId, sortOrder)
 *   - products.priceCents is INTEGER (price × 100)
 *   - products.status must be 'active' (default is 'pending')
 *
 * Usage:
 *   node import-condoms.cjs                  # full import
 *   node import-condoms.cjs --dry-run        # preview only (no writes)
 *   node import-condoms.cjs --rollback       # remove all products by this seller
 *
 * Safe to re-run: uses ON CONFLICT for seller/store/categories/products
 */

const { Client } = require('pg');

// ═════════════════════════════════════════════════════════════════════
// CONFIG
// ═════════════════════════════════════════════════════════════════════
const DB = 'postgresql://postgres:storesgo123@localhost:5432/storesgo';
const DRY_RUN = process.argv.includes('--dry-run');
const ROLLBACK = process.argv.includes('--rollback');

const SELLER_NAME = 'StoresGo Health & Wellness';
const SELLER_SLUG = 'storesgo-health-wellness';
const SELLER_EMAIL = 'health@storesgo.com';
const SELLER_ABOUT = 'StoresGo Health & Wellness — your source for sexual health, wellness products, and personal care. HSA/FSA eligible items. Fast delivery across South Florida.';
const SELLER_PASS = '$2b$10$xK5F3Qx5G8Kz5L5H5Q5Q5eFakeHashForSeller123456789abc'; // placeholder bcrypt

const MEILI_HOST = 'http://localhost:7700';
const MEILI_KEY = 'ff6c780c6c9cfd9156cd7831e86a49b21cbde1ece9d55dc9b2fcb11ef8b63482';

// ═════════════════════════════════════════════════════════════════════
// HELPERS
// ═════════════════════════════════════════════════════════════════════
function log(msg) { console.log(`[${new Date().toISOString().slice(11,19)}] ${msg}`); }

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

// ═════════════════════════════════════════════════════════════════════
// PRODUCT CATALOG — 55 PRODUCTS (36 existing + 19 new)
// All prices are 2× retail, stored in CENTS (integer)
// ═════════════════════════════════════════════════════════════════════
const PRODUCTS = [
  // ── TROJAN — NON-LATEX ──
  { name: 'Trojan G.O.A.T. Non-Latex Condoms - 10ct', brand: 'Trojan', priceCents: 2198, upc: '022600800149', material: 'Non-Latex (Ultra Flex)', size: 'Standard',
    imageUrl: 'https://www.trojanbrands.com/images/product-images/trojan-goat-non-latex-lubricated-condoms/trojan-goat-non-latex-lubricated-condoms-front.png',
    description: 'Trojan G.O.A.T. latex-free lubricated condoms. Patent-pending Ultra Flex non-latex material. Soft, strong, odorless and colorless. Protects against pregnancy and STIs. HSA/FSA eligible.' },
  { name: 'Trojan RAW Non-Latex Lubricated Condoms - 10ct', brand: 'Trojan', priceCents: 2238, upc: '022600016090', material: 'Polyurethane', size: 'Standard',
    imageUrl: 'https://www.trojanbrands.com/images/product-images/trojan-raw-non-latex-condoms/trojan-raw-non-latex-condoms-front.png',
    description: 'Trojan RAW non-latex thin condoms. America\'s thinnest non-latex condom with Pure Feel polyurethane technology. Protects against both pregnancy and STIs. HSA/FSA eligible.' },

  // ── TROJAN — BARESKIN LINE ──
  { name: 'Trojan Bareskin Lubricated Latex Condoms - 10ct', brand: 'Trojan', priceCents: 1938, upc: '022600591092', material: 'Latex', size: 'Standard',
    imageUrl: 'https://www.trojanbrands.com/images/product-images/trojan-bareskin-lubricated-condoms/trojan-bareskin-lubricated-condoms-front.png',
    description: 'Trojan BareSkin thin premium lubricated latex condoms. Ultra-thin for heightened sensitivity. Premium lubricant for comfort. HSA/FSA eligible.' },
  { name: 'Trojan Bareskin Thin Premium Lubricated Condoms - 24ct', brand: 'Trojan', priceCents: 3998, upc: '022600591108', material: 'Latex', size: 'Standard',
    imageUrl: 'https://www.trojanbrands.com/images/product-images/trojan-bareskin-lubricated-condoms/trojan-bareskin-lubricated-condoms-front.png',
    description: 'Trojan BareSkin thin premium lubricated latex condoms value pack. Ultra-thin for heightened sensitivity. Premium lubricant for comfort. HSA/FSA eligible.' },
  { name: 'Trojan Bareskin Raw Lubricated Latex Condoms - 10ct', brand: 'Trojan', priceCents: 2238, upc: '022600016069', material: 'Latex', size: 'Standard',
    imageUrl: 'https://www.trojanbrands.com/images/product-images/trojan-bareskin-raw-lubricated-condoms/trojan-bareskin-raw-lubricated-condoms-front.png',
    description: 'Trojan BareSkin Raw lubricated latex condoms. America\'s thinnest latex condom for an ultra-sensitive experience. HSA/FSA eligible.' },
  { name: 'Trojan Bareskin Raw Lubricated Latex Condoms - 24ct', brand: 'Trojan', priceCents: 4398, upc: '022600016113', material: 'Latex', size: 'Standard',
    imageUrl: 'https://www.trojanbrands.com/images/product-images/trojan-bareskin-raw-lubricated-condoms/trojan-bareskin-raw-lubricated-condoms-front.png',
    description: 'Trojan BareSkin Raw lubricated latex condoms value pack. America\'s thinnest latex condom. HSA/FSA eligible.' },
  { name: 'Trojan Sensitivity Bareskin Lubricated Latex Condoms - 3ct', brand: 'Trojan', priceCents: 1942, upc: '022600591078', material: 'Latex', size: 'Standard',
    imageUrl: 'https://www.trojanbrands.com/images/product-images/trojan-bareskin-lubricated-condoms/trojan-bareskin-lubricated-condoms-front.png',
    description: 'Trojan Sensitivity BareSkin Get Closer lubricated latex condoms. Thin design for enhanced sensitivity. Travel-friendly 3-pack. HSA/FSA eligible.' },

  // ── TROJAN — ULTRA THIN LINE ──
  { name: 'Trojan Ultra Thin Lubricated Latex Condoms - 12ct', brand: 'Trojan', priceCents: 1698, upc: '022600925217', material: 'Latex', size: 'Standard',
    imageUrl: 'https://www.trojanbrands.com/images/product-images/trojan-ultra-thin-lubricated-condoms/trojan-ultra-thin-lubricated-condoms-front.png',
    description: 'Trojan Ultra Thin condoms for ultra sensitivity. Lubricated premium latex. Protects against pregnancy and STIs. HSA/FSA eligible.' },
  { name: 'Trojan Ultra Thin Lubricated Latex Condoms - 36ct', brand: 'Trojan', priceCents: 3638, upc: '022600925224', material: 'Latex', size: 'Standard',
    imageUrl: 'https://www.trojanbrands.com/images/product-images/trojan-ultra-thin-lubricated-condoms/trojan-ultra-thin-lubricated-condoms-front.png',
    description: 'Trojan Ultra Thin condoms for ultra sensitivity value pack. Premium lubricated latex. HSA/FSA eligible.' },
  { name: 'Trojan Ultra Ribbed Lubricated Latex Condoms - 36ct', brand: 'Trojan', priceCents: 3638, upc: '022600925248', material: 'Latex', size: 'Standard',
    imageUrl: 'https://www.trojanbrands.com/images/product-images/trojan-ultra-ribbed-lubricated-condoms/trojan-ultra-ribbed-lubricated-condoms-front.png',
    description: 'Trojan Ultra Ribbed premium lubricated latex condoms value pack. Ribbed texture for extra stimulation. HSA/FSA eligible.' },
  { name: 'Trojan Armor Ultra Thin Spermicidal Lubricated Latex Condoms - 12ct', brand: 'Trojan', priceCents: 1698, upc: '022600925231', material: 'Latex', size: 'Standard',
    imageUrl: 'https://www.trojanbrands.com/images/product-images/trojan-ultra-thin-spermicidal-lubricated-condoms/trojan-ultra-thin-spermicidal-lubricated-condoms-front.png',
    description: 'Trojan Armor Ultra Thin spermicidal lubricated latex condoms. Ultra-thin with spermicidal lubricant for added protection. HSA/FSA eligible.' },

  // ── TROJAN — ENZ LINE ──
  { name: 'Trojan ENZ Lubricated Latex Condoms - 36ct', brand: 'Trojan', priceCents: 3638, upc: '022600925286', material: 'Latex', size: 'Standard',
    imageUrl: 'https://www.trojanbrands.com/images/product-images/trojan-original-lubricated-condoms/trojan-original-lubricated-condoms-front.png',
    description: 'Trojan ENZ lubricated premium latex condoms value pack. Classic trusted design for contraception and STI protection. HSA/FSA eligible.' },
  { name: 'Trojan ENZ Armor Spermicidal Lubricated Latex Condoms - 12ct', brand: 'Trojan', priceCents: 1698, upc: '022600925255', material: 'Latex', size: 'Standard',
    imageUrl: 'https://www.trojanbrands.com/images/product-images/trojan-original-condoms-with-spermicidal-lubricant/trojan-original-condoms-with-spermicidal-lubricant-front.png',
    description: 'Trojan ENZ Armor spermicidal lubricated premium latex condoms. Classic design with spermicidal lubricant. HSA/FSA eligible.' },

  // ── TROJAN — MAGNUM LINE ──
  { name: 'Trojan Magnum Large Size Lubricated Latex Condoms - 12ct', brand: 'Trojan', priceCents: 1698, upc: '022600964506', material: 'Latex', size: 'Large',
    imageUrl: 'https://www.trojanbrands.com/images/product-images/magnum-lubricated-condoms/magnum-lubricated-condoms-front.png',
    description: 'Trojan Magnum large size lubricated latex condoms. Larger than standard for a comfortable fit. Premium lubricant. HSA/FSA eligible.' },
  { name: 'Trojan Magnum Large Size Lubricated Latex Condoms - 36ct', brand: 'Trojan', priceCents: 3638, upc: '022600964537', material: 'Latex', size: 'Large',
    imageUrl: 'https://www.trojanbrands.com/images/product-images/magnum-lubricated-condoms/magnum-lubricated-condoms-front.png',
    description: 'Trojan Magnum large size lubricated latex condoms value pack. Larger than standard for a comfortable fit. HSA/FSA eligible.' },
  { name: 'Trojan Magnum Bareskin Large Size Lubricated Latex Condoms - 10ct', brand: 'Trojan', priceCents: 1938, upc: '022600591054', material: 'Latex', size: 'Large',
    imageUrl: 'https://www.trojanbrands.com/images/product-images/magnum-bareskin-lubricated-condoms/magnum-bareskin-lubricated-condoms-front.png',
    description: 'Trojan Magnum BareSkin large size ultra-thin lubricated latex condoms. Thinnest Magnum for maximum sensitivity. HSA/FSA eligible.' },
  { name: 'Trojan Magnum Raw Large Size Lubricated Latex Condoms - 10ct', brand: 'Trojan', priceCents: 2238, upc: '022600016083', material: 'Latex', size: 'Large',
    imageUrl: 'https://www.trojanbrands.com/images/product-images/magnum-raw-lubricated-condoms/magnum-raw-lubricated-condoms-front.png',
    description: 'Trojan Magnum Raw large size thin lubricated latex condoms. Ultra-thin Magnum for a raw, natural feel. HSA/FSA eligible.' },
  { name: 'Trojan Magnum Raw Large Size Lubricated Latex Condoms - 24ct', brand: 'Trojan', priceCents: 4398, upc: '022600016106', material: 'Latex', size: 'Large',
    imageUrl: 'https://www.trojanbrands.com/images/product-images/magnum-raw-lubricated-condoms/magnum-raw-lubricated-condoms-front.png',
    description: 'Trojan Magnum Raw large size thin lubricated latex condoms value pack. Ultra-thin Magnum for a raw natural feel. HSA/FSA eligible.' },
  { name: 'Trojan Magnum Thin Large Size Lubricated Condoms - 12ct', brand: 'Trojan', priceCents: 1698, upc: '022600964551', material: 'Latex', size: 'Large',
    imageUrl: 'https://www.trojanbrands.com/images/product-images/magnum-thin-lubricated-condoms/magnum-thin-lubricated-condoms-front.png',
    description: 'Trojan Magnum Thin large size lubricated latex condoms. Thin design in a larger size for comfort and sensitivity. HSA/FSA eligible.' },
  { name: 'Trojan Magnum XL Lubricated Condoms - 12ct', brand: 'Trojan', priceCents: 2960, upc: '022600964582', material: 'Latex', size: 'XL',
    imageUrl: 'https://www.trojanbrands.com/images/product-images/magnum-xl-lubricated-condoms/magnum-xl-lubricated-condoms-front.png',
    description: 'Trojan Magnum XL extra large lubricated latex condoms. Largest Trojan condom for maximum comfort. HSA/FSA eligible.' },
  { name: 'Trojan Magnum Large Size Lubricated Latex Condoms - 3ct', brand: 'Trojan', priceCents: 898, upc: '022600964490', material: 'Latex', size: 'Large',
    imageUrl: 'https://www.trojanbrands.com/images/product-images/magnum-lubricated-condoms/magnum-lubricated-condoms-front.png',
    description: 'Trojan Magnum large size lubricated latex condoms travel pack. Larger than standard for a comfortable fit. HSA/FSA eligible.' },

  // ── TROJAN — VARIETY & SPECIALTY ──
  { name: 'Trojan Pleasure Variety Pack Lubricated Latex Condoms - 12ct', brand: 'Trojan', priceCents: 1938, upc: '022600925293', material: 'Latex', size: 'Standard',
    imageUrl: 'https://www.trojanbrands.com/images/product-images/trojan-pleasure-pack-lubricated-condoms/trojan-pleasure-pack-lubricated-condoms-front.png',
    description: 'Trojan Pleasure Pack variety assortment of lubricated latex condoms. Multiple styles to explore. HSA/FSA eligible.' },
  { name: 'Trojan Pleasure Pack Assorted Lubricated Condoms - 36ct', brand: 'Trojan', priceCents: 3998, upc: '022600925309', material: 'Latex', size: 'Standard',
    imageUrl: 'https://www.trojanbrands.com/images/product-images/trojan-pleasure-pack-lubricated-condoms/trojan-pleasure-pack-lubricated-condoms-front.png',
    description: 'Trojan Pleasure Pack variety assortment of lubricated latex condoms value pack. Multiple styles in one box. HSA/FSA eligible.' },
  { name: 'Trojan Her Pleasure Sensations Lubricated Latex Condoms - 12ct', brand: 'Trojan', priceCents: 3270, upc: '022600925323', material: 'Latex', size: 'Standard',
    imageUrl: 'https://www.trojanbrands.com/images/product-images/trojan-her-pleasure-sensations-lubricated-condoms/trojan-her-pleasure-sensations-lubricated-condoms-front.png',
    description: 'Trojan Her Pleasure Sensations lubricated latex condoms. Ribbed and contoured designed for her pleasure. HSA/FSA eligible.' },
  { name: 'Trojan Her Pleasure Sensations Lubricated Latex Condoms - 3ct', brand: 'Trojan', priceCents: 1950, upc: '022600925316', material: 'Latex', size: 'Standard',
    imageUrl: 'https://www.trojanbrands.com/images/product-images/trojan-her-pleasure-sensations-lubricated-condoms/trojan-her-pleasure-sensations-lubricated-condoms-front.png',
    description: 'Trojan Her Pleasure Sensations lubricated latex condoms travel size. Ribbed and contoured for her stimulation. HSA/FSA eligible.' },
  // NEW: Trojan Discovery Pack
  { name: 'Trojan Discovery Pack Variety Lubricated Condoms - 12ct', brand: 'Trojan', priceCents: 1938, upc: '022600925361', material: 'Latex', size: 'Standard',
    imageUrl: 'https://www.trojanbrands.com/images/product-images/trojan-pleasure-pack-lubricated-condoms/trojan-pleasure-pack-lubricated-condoms-front.png',
    description: 'Trojan Discovery Pack variety lubricated condoms. Assorted styles for first-time explorers. HSA/FSA eligible.' },
  // NEW: Trojan Original Lubricated
  { name: 'Trojan Original Lubricated Latex Condoms - 12ct', brand: 'Trojan', priceCents: 1698, upc: '022600925200', material: 'Latex', size: 'Standard',
    imageUrl: 'https://www.trojanbrands.com/images/product-images/trojan-original-lubricated-condoms/trojan-original-lubricated-condoms-front.png',
    description: 'Trojan Original lubricated premium latex condoms. Classic trusted protection against pregnancy and STIs. HSA/FSA eligible.' },
  // NEW: Trojan Original with Spermicide
  { name: 'Trojan Original Spermicidal Lubricated Condoms - 12ct', brand: 'Trojan', priceCents: 1698, upc: '022600925262', material: 'Latex', size: 'Standard',
    imageUrl: 'https://www.trojanbrands.com/images/product-images/trojan-original-condoms-with-spermicidal-lubricant/trojan-original-condoms-with-spermicidal-lubricant-front.png',
    description: 'Trojan Original condoms with spermicidal lubricant for added pregnancy protection. Classic design. HSA/FSA eligible.' },
  // NEW: Trojan Original Non-Lubricated
  { name: 'Trojan Original Non-Lubricated Latex Condoms - 12ct', brand: 'Trojan', priceCents: 1698, upc: '022600925279', material: 'Latex', size: 'Standard',
    imageUrl: 'https://www.trojanbrands.com/images/product-images/trojan-original-lubricated-condoms/trojan-original-lubricated-condoms-front.png',
    description: 'Trojan Original non-lubricated premium latex condoms. Classic protection for those who prefer to add their own lubricant. HSA/FSA eligible.' },

  // ── SKYN — NON-LATEX ──
  { name: 'SKYN Elite Non-Latex Condoms - 12ct', brand: 'SKYN', priceCents: 1838, upc: '027204101066', material: 'Polyisoprene', size: 'Standard',
    imageUrl: 'https://m.media-amazon.com/images/I/71Kj6pVXZJL._SL1500_.jpg',
    description: 'SKYN Elite non-latex lubricated condoms. Ultra-thin polyisoprene for a natural skin-on-skin feel. Latex-free. HSA/FSA eligible.' },
  { name: 'SKYN Elite Non-Latex Lubricated Condoms - 36ct', brand: 'SKYN', priceCents: 3878, upc: '027204101127', material: 'Polyisoprene', size: 'Standard',
    imageUrl: 'https://m.media-amazon.com/images/I/71bSxNi6YXL._SL1500_.jpg',
    description: 'SKYN Elite non-latex lubricated condoms value pack. Ultra-thin polyisoprene for natural sensitivity. Latex-free. HSA/FSA eligible.' },
  { name: 'SKYN Original Non-Latex Lubricated Condoms - 12ct', brand: 'SKYN', priceCents: 1538, upc: '027204100038', material: 'Polyisoprene', size: 'Standard',
    imageUrl: 'https://m.media-amazon.com/images/I/71UqTfJxmEL._SL1500_.jpg',
    description: 'SKYN Original non-latex lubricated condoms. Polyisoprene material for a natural feel. Latex-free. HSA/FSA eligible.' },
  { name: 'SKYN Original Non-Latex Lubricated Condoms - 24ct', brand: 'SKYN', priceCents: 2718, upc: '027204100052', material: 'Polyisoprene', size: 'Standard',
    imageUrl: 'https://m.media-amazon.com/images/I/71UqTfJxmEL._SL1500_.jpg',
    description: 'SKYN Original non-latex lubricated condoms value pack. Polyisoprene for natural sensitivity. Latex-free. HSA/FSA eligible.' },
  { name: 'SKYN Original Non-Latex Lubricated Condoms - 3ct', brand: 'SKYN', priceCents: 998, upc: '027204100045', material: 'Polyisoprene', size: 'Standard',
    imageUrl: 'https://m.media-amazon.com/images/I/71UqTfJxmEL._SL1500_.jpg',
    description: 'SKYN Original non-latex lubricated condoms trial pack. Polyisoprene for natural feel. Latex-free.' },
  { name: 'SKYN Supreme Non-Latex Lubricated Condoms - 10ct', brand: 'SKYN', priceCents: 2118, upc: '027204101295', material: 'Polyisoprene', size: 'Standard',
    imageUrl: 'https://m.media-amazon.com/images/I/71pKlQ2TFLL._SL1500_.jpg',
    description: 'SKYN Supreme non-latex lubricated condoms. Premium feel with advanced polyisoprene material. Latex-free. HSA/FSA eligible.' },
  { name: 'SKYN Supreme Non-Latex Lubricated Condoms - 20ct', brand: 'SKYN', priceCents: 3798, upc: '027204101301', material: 'Polyisoprene', size: 'Standard',
    imageUrl: 'https://m.media-amazon.com/images/I/71pKlQ2TFLL._SL1500_.jpg',
    description: 'SKYN Supreme Feel non-latex condoms value size. Ultra-thin polyisoprene for premium sensitivity. Latex-free.' },
  { name: 'SKYN Supreme Non-Latex Lubricated Condoms - 30ct', brand: 'SKYN', priceCents: 5598, upc: '027204101318', material: 'Polyisoprene', size: 'Standard',
    imageUrl: 'https://m.media-amazon.com/images/I/71pKlQ2TFLL._SL1500_.jpg',
    description: 'SKYN Supreme non-latex lubricated condoms value pack. Premium ultra-thin polyisoprene. Latex-free. HSA/FSA eligible.' },
  { name: 'SKYN LifeStyles Selection Non-Latex Lubricated Condoms - 36ct', brand: 'SKYN', priceCents: 3878, upc: '027204101257', material: 'Polyisoprene', size: 'Standard',
    imageUrl: 'https://m.media-amazon.com/images/I/71XGl7K5qLL._SL1500_.jpg',
    description: 'SKYN LifeStyles Selection variety pack of non-latex lubricated condoms. Multiple styles. Polyisoprene. Latex-free. HSA/FSA eligible.' },
  // NEW: SKYN King Large
  { name: 'SKYN King Large Non-Latex Lubricated Condoms - 12ct', brand: 'SKYN', priceCents: 2118, upc: '027204101400', material: 'Polyisoprene', size: 'Large',
    imageUrl: 'https://m.media-amazon.com/images/I/71kJ7XqL2rL._SL1500_.jpg',
    description: 'SKYN King Large non-latex lubricated condoms. Larger fit in premium polyisoprene. Latex-free. HSA/FSA eligible.' },
  { name: 'SKYN King Large Non-Latex Lubricated Condoms - 36ct', brand: 'SKYN', priceCents: 3878, upc: '027204101417', material: 'Polyisoprene', size: 'Large',
    imageUrl: 'https://m.media-amazon.com/images/I/71kJ7XqL2rL._SL1500_.jpg',
    description: 'SKYN King Large non-latex lubricated condoms value pack. Larger fit polyisoprene. Latex-free. HSA/FSA eligible.' },
  // NEW: SKYN Excitation
  { name: 'SKYN Excitation Dotted Non-Latex Condoms - 12ct', brand: 'SKYN', priceCents: 1838, upc: '027204101202', material: 'Polyisoprene', size: 'Standard',
    imageUrl: 'https://m.media-amazon.com/images/I/71dVp8bxqZL._SL1500_.jpg',
    description: 'SKYN Excitation dotted non-latex condoms. Wave pattern dots for extra stimulation. Polyisoprene. Latex-free. HSA/FSA eligible.' },
  // NEW: SKYN Snug Fit
  { name: 'SKYN Snug Fit Non-Latex Lubricated Condoms - 12ct', brand: 'SKYN', priceCents: 1838, upc: '027204101356', material: 'Polyisoprene', size: 'Snug',
    imageUrl: 'https://m.media-amazon.com/images/I/71pKlQ2TFLL._SL1500_.jpg',
    description: 'SKYN Snug Fit non-latex lubricated condoms. Closer fit for enhanced sensation. Polyisoprene. Latex-free. HSA/FSA eligible.' },

  // ── DUREX — NON-LATEX ──
  { name: 'Durex Real Feel Non-Latex Condoms - 36ct', brand: 'Durex', priceCents: 3998, upc: '302340305361', material: 'Polyisoprene', size: 'Standard',
    imageUrl: 'https://m.media-amazon.com/images/I/71t0kFHAzKL._SL1500_.jpg',
    description: 'Durex Real Feel non-latex condoms value pack. Polyisoprene for natural skin-on-skin sensation. Latex-free. HSA/FSA eligible.' },
  { name: 'Durex Avanti Bare Real Feel Non-Latex Condoms - 3ct', brand: 'Durex', priceCents: 1098, upc: '302340305309', material: 'Polyisoprene', size: 'Standard',
    imageUrl: 'https://m.media-amazon.com/images/I/71VHN1xJQPL._SL1500_.jpg',
    description: 'Durex Avanti Bare Real Feel lubricated non-latex condoms. Polyisoprene for natural sensation. Latex-free trial size.' },
  { name: 'Durex Avanti Bare Real Feel Non-Latex Condoms - 24ct', brand: 'Durex', priceCents: 3598, upc: '302340305347', material: 'Polyisoprene', size: 'Standard',
    imageUrl: 'https://m.media-amazon.com/images/I/71VHN1xJQPL._SL1500_.jpg',
    description: 'Durex Avanti Bare Real Feel lubricated non-latex condoms value pack. Polyisoprene for natural skin-on-skin sensation. Latex-free.' },
  // NEW: Durex Intense Nitrile
  { name: 'Durex Intense Premium Non-Latex Nitrile Condoms - 10ct', brand: 'Durex', priceCents: 1638, upc: '302340995757', material: 'Nitrile', size: 'Standard',
    imageUrl: 'https://m.media-amazon.com/images/I/71TxUWPGYZL._SL1500_.jpg',
    description: 'Durex Intense nitrile condoms. World\'s first nitrile male condom with better body heat transfer. Ultra-thin and form-fitting. Latex-free. HSA/FSA eligible.' },
  { name: 'Durex Intense Premium Non-Latex Nitrile Condoms - 24ct', brand: 'Durex', priceCents: 3478, upc: '302340995764', material: 'Nitrile', size: 'Standard',
    imageUrl: 'https://m.media-amazon.com/images/I/71TxUWPGYZL._SL1500_.jpg',
    description: 'Durex Intense nitrile condoms value pack. World\'s first nitrile male condom. Better body heat transfer. Ultra-thin. Latex-free. HSA/FSA eligible.' },
  // NEW: Durex Extra Sensitive
  { name: 'Durex Extra Sensitive Ultra Thin Lubricated Condoms - 3ct', brand: 'Durex', priceCents: 1198, upc: '302340302715', material: 'Latex', size: 'Standard',
    imageUrl: 'https://m.media-amazon.com/images/I/71tKT0E6QTL._SL1500_.jpg',
    description: 'Durex Extra Sensitive ultra thin lubricated latex condoms. Thinner for intimate skin-on-skin feel. HSA/FSA eligible.' },
  { name: 'Durex Extra Sensitive Ultra Thin Lubricated Condoms - 12ct', brand: 'Durex', priceCents: 1798, upc: '302340302722', material: 'Latex', size: 'Standard',
    imageUrl: 'https://m.media-amazon.com/images/I/71tKT0E6QTL._SL1500_.jpg',
    description: 'Durex Extra Sensitive ultra thin lubricated latex condoms. Thinner design for heightened sensitivity. HSA/FSA eligible.' },
  // NEW: Durex Tropical Flavors
  { name: 'Durex Tropical Flavors Lubricated Condoms - 12ct', brand: 'Durex', priceCents: 2298, upc: '302340305002', material: 'Latex', size: 'Standard',
    imageUrl: 'https://m.media-amazon.com/images/I/71dN-gADX5L._SL1500_.jpg',
    description: 'Durex Tropical Flavors lubricated condoms. Exciting tropical flavored latex condoms. Close fit. HSA/FSA eligible.' },
  // NEW: Durex Air Ultra Thin
  { name: 'Durex Air Ultra Thin Lubricated Condoms - 10ct', brand: 'Durex', priceCents: 3298, upc: '302340305019', material: 'Latex', size: 'Standard',
    imageUrl: 'https://m.media-amazon.com/images/I/71GZJFF5JqL._SL1500_.jpg',
    description: 'Durex Air ultra thin transparent lubricated condoms. Extra thin for maximum sensitivity. HSA/FSA eligible.' },
  // NEW: Durex Prolong
  { name: 'Durex Prolong Delay Lubricated Condoms - 12ct', brand: 'Durex', priceCents: 1598, upc: '302340305040', material: 'Latex', size: 'Standard',
    imageUrl: 'https://m.media-amazon.com/images/I/71xj0Pf7vvL._SL1500_.jpg',
    description: 'Durex Prolong delay lubricated condoms. Ribbed and dotted with delay lubricant for extended pleasure. HSA/FSA eligible.' },

  // ── LELO — PREMIUM (NEW) ──
  { name: 'LELO HEX Original Luxury Condoms - 12ct', brand: 'LELO', priceCents: 2998, upc: '7350075028052', material: 'Latex', size: 'Standard',
    imageUrl: 'https://m.media-amazon.com/images/I/71Y9K5j6M0L._SL1500_.jpg',
    description: 'LELO HEX Original luxury condoms. Revolutionary hexagonal structure for strength and thinness. Ultra-thin 0.045mm latex. Premium protection.' },
  { name: 'LELO HEX Original Luxury Condoms - 36ct', brand: 'LELO', priceCents: 5998, upc: '7350075028069', material: 'Latex', size: 'Standard',
    imageUrl: 'https://m.media-amazon.com/images/I/71Y9K5j6M0L._SL1500_.jpg',
    description: 'LELO HEX Original luxury condoms value pack. Hexagonal structure for strength and thinness. Ultra-thin 0.045mm latex. Premium protection.' },

  // ── LIFESTYLES (NEW) ──
  { name: 'LifeStyles Ultra-Sensitive Latex Condoms - 36ct', brand: 'LifeStyles', priceCents: 2318, upc: '070907052369', material: 'Latex', size: 'Standard',
    imageUrl: 'https://m.media-amazon.com/images/I/71rkFpV4rPL._SL1500_.jpg',
    description: 'LifeStyles Ultra-Sensitive latex condoms value pack. Ultra-thin for natural intimacy. Lubricated. Trusted protection. HSA/FSA eligible.' },
];

// ═════════════════════════════════════════════════════════════════════
// MAIN
// ═════════════════════════════════════════════════════════════════════
async function main() {
  const client = new Client(DB);
  await client.connect();
  log(`Connected to PostgreSQL (${DRY_RUN ? 'DRY RUN' : 'LIVE'})`);

  // ── ROLLBACK MODE ──
  if (ROLLBACK) {
    const seller = await client.query(`SELECT id FROM sellers WHERE slug = $1`, [SELLER_SLUG]);
    if (seller.rows.length === 0) { log('Seller not found, nothing to rollback'); await client.end(); return; }
    const sellerId = seller.rows[0].id;
    const { rowCount } = await client.query(`DELETE FROM products WHERE "sellerId" = $1`, [sellerId]);
    log(`Rolled back ${rowCount} products for seller ${sellerId}`);
    await client.end();
    return;
  }

  // ── STEP 1: Create user ──
  log('Step 1: Creating user...');
  const userId = `seller_health_${Date.now()}`;
  if (!DRY_RUN) {
    await client.query(`
      INSERT INTO users (id, email, password, role, "createdAt", "updatedAt")
      VALUES ($1, $2, $3, 'SELLER', NOW(), NOW())
      ON CONFLICT (email) DO NOTHING
    `, [userId, SELLER_EMAIL, SELLER_PASS]);
  }
  // Get the actual userId (might already exist)
  const userRow = await client.query(`SELECT id FROM users WHERE email = $1`, [SELLER_EMAIL]);
  const finalUserId = userRow.rows.length > 0 ? userRow.rows[0].id : userId;
  log(`  User: ${finalUserId}`);

  // ── STEP 2: Create seller ──
  log('Step 2: Creating seller...');
  if (!DRY_RUN) {
    await client.query(`
      INSERT INTO sellers ("userId", "storeName", slug, about, city, state, country, "zipCode", "isApproved", "isBanned", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, 'Lake Worth', 'FL', 'US', '33460', true, false, NOW(), NOW())
      ON CONFLICT (slug) DO UPDATE SET "isApproved" = true, "updatedAt" = NOW()
    `, [finalUserId, SELLER_NAME, SELLER_SLUG, SELLER_ABOUT]);
  }
  const sellerRow = await client.query(`SELECT id FROM sellers WHERE slug = $1`, [SELLER_SLUG]);
  const sellerId = sellerRow.rows.length > 0 ? sellerRow.rows[0].id : 0;
  log(`  Seller: ID ${sellerId}`);

  // ── STEP 3: Create store ──
  log('Step 3: Creating store...');
  if (!DRY_RUN) {
    await client.query(`
      INSERT INTO stores (name, slug, "sellerId", "isActive", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, true, NOW(), NOW())
      ON CONFLICT (slug) DO UPDATE SET "isActive" = true, "updatedAt" = NOW()
    `, [SELLER_NAME, SELLER_SLUG, sellerId]);
  }
  const storeRow = await client.query(`SELECT id FROM stores WHERE slug = $1`, [SELLER_SLUG]);
  const storeId = storeRow.rows.length > 0 ? storeRow.rows[0].id : 0;
  log(`  Store: ID ${storeId}`);

  // ── STEP 4: Create categories ──
  log('Step 4: Creating categories...');

  // Get Health & Wellness parent ID
  const hwRow = await client.query(`SELECT id FROM categories WHERE slug = 'health-wellness'`);
  if (hwRow.rows.length === 0) {
    log('  ERROR: health-wellness category not found! Aborting.');
    await client.end();
    return;
  }
  const hwId = hwRow.rows[0].id;
  log(`  Parent: Health & Wellness (ID ${hwId})`);

  // Create Sexual Wellness
  if (!DRY_RUN) {
    await client.query(`
      INSERT INTO categories (name, slug, "parentId", "sortOrder", "createdAt", "updatedAt")
      VALUES ('Sexual Wellness', 'sexual-wellness', $1, 0, NOW(), NOW())
      ON CONFLICT (slug) DO NOTHING
    `, [hwId]);
  }
  const swRow = await client.query(`SELECT id FROM categories WHERE slug = 'sexual-wellness'`);
  let swId;
  if (swRow.rows.length > 0) {
    swId = swRow.rows[0].id;
  } else if (DRY_RUN) {
    swId = 99999;
    log('  [DRY RUN] Would create Sexual Wellness category');
  }
  log(`  Sexual Wellness: ID ${swId}`);

  // Create Condoms
  if (!DRY_RUN) {
    await client.query(`
      INSERT INTO categories (name, slug, "parentId", "sortOrder", "createdAt", "updatedAt")
      VALUES ('Condoms', 'condoms', $1, 0, NOW(), NOW())
      ON CONFLICT (slug) DO NOTHING
    `, [swId]);
  }
  const cRow = await client.query(`SELECT id FROM categories WHERE slug = 'condoms'`);
  let categoryId;
  if (cRow.rows.length > 0) {
    categoryId = cRow.rows[0].id;
  } else if (DRY_RUN) {
    categoryId = 99998;
    log('  [DRY RUN] Would create Condoms category');
  }
  log(`  Condoms: ID ${categoryId}`);

  // ── STEP 5: Insert products ──
  log(`Step 5: Inserting ${PRODUCTS.length} products...`);

  if (DRY_RUN) {
    log('=== DRY RUN — No products will be inserted ===');
    log(`Would insert ${PRODUCTS.length} products`);
    log(`Sample: ${PRODUCTS[0].name} — ${PRODUCTS[0].priceCents}¢ ($${(PRODUCTS[0].priceCents / 100).toFixed(2)})`);

    // Validate all products
    let issues = 0;
    for (const p of PRODUCTS) {
      if (!Number.isInteger(p.priceCents) || p.priceCents <= 0) { log(`  ❌ BAD PRICE: ${p.name} — ${p.priceCents}`); issues++; }
      if (!p.upc) { log(`  ⚠️  MISSING UPC: ${p.name}`); issues++; }
      if (!p.imageUrl) { log(`  ⚠️  MISSING IMAGE: ${p.name}`); issues++; }
      if (!p.description) { log(`  ⚠️  MISSING DESC: ${p.name}`); issues++; }
    }
    if (issues === 0) log('  ✅ All products validated — zero issues');
    else log(`  ⚠️  ${issues} issues found`);

    // Brand breakdown
    const brands = {};
    PRODUCTS.forEach(p => { brands[p.brand] = (brands[p.brand] || 0) + 1; });
    log('\nBrand breakdown:');
    Object.entries(brands).sort((a, b) => b[1] - a[1]).forEach(([b, c]) => log(`  ${b}: ${c} SKUs`));

    await client.end();
    return;
  }

  let inserted = 0, skipped = 0, failed = 0;

  for (const p of PRODUCTS) {
    try {
      const slug = makeSlug(p.name);

      const result = await client.query(`
        INSERT INTO products (
          name, slug, description, sku, "externalId",
          "priceCents", "imageUrl", currency,
          category_id, status, "isActive",
          "sellerId", "storeId",
          "createdAt", "updatedAt"
        ) VALUES (
          $1, $2, $3, $4, NULL,
          $5, $6, 'USD',
          $7, 'active', true,
          $8, $9,
          NOW(), NOW()
        )
        ON CONFLICT (slug) DO UPDATE SET
          "priceCents" = EXCLUDED."priceCents",
          description = EXCLUDED.description,
          "imageUrl" = EXCLUDED."imageUrl",
          "sourceImageUrl" = EXCLUDED."sourceImageUrl",
          category_id = EXCLUDED.category_id,
          status = 'active',
          "isActive" = true,
          "updatedAt" = NOW()
        RETURNING id
      `, [
        p.name,             // $1
        slug,               // $2
        p.description,      // $3
        p.upc || '',        // $4 (sku = UPC)
        p.priceCents,       // $5 (INTEGER)
        p.imageUrl || '',   // $6
        categoryId,         // $7
        sellerId,           // $8
        storeId,            // $9
      ]);

      if (result.rows.length > 0) {
        inserted++;
      } else {
        skipped++;
      }
    } catch (err) {
      failed++;
      log(`  ❌ FAILED: ${p.name} — ${err.message}`);
    }
  }

  log(`\n✅ Import complete: ${inserted} inserted/updated, ${skipped} skipped, ${failed} failed`);

  // ── STEP 6: Sync to Meilisearch ──
  log('Step 6: Syncing to Meilisearch...');
  try {
    const { rows: products } = await client.query(`
      SELECT id, name, slug, description, "priceCents", "imageUrl", sku, status, "isActive"
      FROM products WHERE "sellerId" = $1
    `, [sellerId]);

    const meiliDocs = products.map(p => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description || '',
      priceCents: p.priceCents,
      imageUrl: p.imageUrl || '',
      sku: p.sku || '',
      status: p.status,
      isActive: p.isActive,
      sellerId: sellerId,
      storeId: storeId,
    }));

    const http = require('http');
    const body = JSON.stringify(meiliDocs);
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
      res.on('end', () => log(`  Meilisearch: ${res.statusCode} — ${data.slice(0, 100)}`));
    });
    req.on('error', (e) => log(`  Meilisearch error: ${e.message}`));
    req.write(body);
    req.end();

    // Wait a moment for the request to complete
    await new Promise(resolve => setTimeout(resolve, 2000));
  } catch (err) {
    log(`  Meilisearch sync failed: ${err.message} (non-fatal)`);
  }

  // ── STEP 7: Verification ──
  log('\nStep 7: Verification...');
  const { rows: [counts] } = await client.query(`
    SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status = 'active' AND "isActive" = true) as active,
      COUNT(*) FILTER (WHERE category_id IS NOT NULL) as categorized,
      COUNT(*) FILTER (WHERE "imageUrl" IS NOT NULL AND "imageUrl" != '') as with_images,
      COUNT(*) FILTER (WHERE sku IS NOT NULL AND sku != '') as with_upc,
      MIN("priceCents") as min_price,
      MAX("priceCents") as max_price
    FROM products WHERE "sellerId" = $1
  `, [sellerId]);

  log(`  Total products: ${counts.total}`);
  log(`  Active: ${counts.active}`);
  log(`  Categorized: ${counts.categorized}`);
  log(`  With images: ${counts.with_images}`);
  log(`  With UPC: ${counts.with_upc}`);
  log(`  Price range: $${(counts.min_price / 100).toFixed(2)} — $${(counts.max_price / 100).toFixed(2)}`);

  if (parseInt(counts.total) === PRODUCTS.length &&
      parseInt(counts.active) === PRODUCTS.length &&
      parseInt(counts.categorized) === PRODUCTS.length) {
    log('\n🎯 PERFECT: All products imported, active, and categorized');
  } else {
    log('\n⚠️  Some products may need attention');
  }

  await client.end();
  log('Done.');
}

main().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
