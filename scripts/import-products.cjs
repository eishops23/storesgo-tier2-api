const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// ============================================================
// 🏪 STORE CONFIGURATIONS
// ============================================================
const STORES = [
  { 
    file: 'bravo.json', 
    storeName: 'Bravo Supermarkets', 
    slug: 'bravo',
    city: 'Miami',
    state: 'FL',
    country: 'USA',
    about: 'Bravo Supermarkets offers authentic Hispanic and Caribbean groceries with the freshest produce, meats, and specialty items.'
  },
  { 
    file: 'gala_fresh.json', 
    storeName: 'Gala Fresh Farms', 
    slug: 'gala-fresh',
    city: 'New York',
    state: 'NY',
    country: 'USA',
    about: 'Gala Fresh Farms brings you farm-fresh produce and international groceries at affordable prices.'
  },
  { 
    file: 'key_food.json', 
    storeName: 'Key Food', 
    slug: 'key-food',
    city: 'Brooklyn',
    state: 'NY',
    country: 'USA',
    about: 'Key Food is your neighborhood supermarket with quality groceries, fresh meats, and everyday essentials.'
  },
  { 
    file: 'publix.json', 
    storeName: 'Publix Super Markets', 
    slug: 'publix',
    city: 'Lakeland',
    state: 'FL',
    country: 'USA',
    about: 'Publix is committed to being the premier quality food retailer in the world.'
  },
];

// ============================================================
// 💰 PRICING - 20% Markup
// ============================================================
const MARKUP_PERCENT = 25;

function priceToCents(price) {
  if (!price || isNaN(price)) return 99; // Min $0.99
  const priceWithMarkup = parseFloat(price) * (1 + MARKUP_PERCENT / 100);
  let cents = Math.round(priceWithMarkup * 100);
  return Math.max(cents, 99); // Minimum $0.99
}

// ============================================================
// 🏷️ CATEGORY CONFIG - Icons & Colors for Frontend Display
// ============================================================
const CATEGORY_CONFIG = {
  'Baby': { icon: '🍼', color: '#FFB6C1', tagline: 'Baby food, diapers & more' },
  'Baby Bath': { icon: '🛁', color: '#FFB6C1', tagline: 'Baby bath essentials' },
  'Baby Food': { icon: '🍼', color: '#FFB6C1', tagline: 'Nutritious baby food' },
  'Beverages': { icon: '🥤', color: '#87CEEB', tagline: 'Drinks & refreshments' },
  'Snacks': { icon: '🍿', color: '#FFD700', tagline: 'Chips, cookies & treats' },
  'Dairy': { icon: '🥛', color: '#FFFACD', tagline: 'Milk, cheese & eggs' },
  'Frozen': { icon: '🧊', color: '#E0FFFF', tagline: 'Frozen meals & treats' },
  'Meat & Seafood': { icon: '🥩', color: '#FFA07A', tagline: 'Fresh meats & fish' },
  'Produce': { icon: '🥬', color: '#90EE90', tagline: 'Fresh fruits & vegetables' },
  'Bakery': { icon: '🍞', color: '#DEB887', tagline: 'Fresh baked goods' },
  'Canned Goods': { icon: '🥫', color: '#CD853F', tagline: 'Canned & jarred foods' },
  'Condiments': { icon: '🧂', color: '#F5DEB3', tagline: 'Sauces & seasonings' },
  'Cleaning': { icon: '🧹', color: '#98FB98', tagline: 'Household cleaning' },
  'Personal Care': { icon: '🧴', color: '#DDA0DD', tagline: 'Health & beauty' },
  'Health & Wellness': { icon: '💊', color: '#87CEFA', tagline: 'Vitamins & supplements' },
  'Pet Supplies': { icon: '🐶', color: '#F0E68C', tagline: 'Pet food & supplies' },
  'Household': { icon: '🏠', color: '#B0C4DE', tagline: 'Home essentials' },
  'International': { icon: '🌍', color: '#98D8C8', tagline: 'World foods' },
  'Deli': { icon: '🥪', color: '#F4A460', tagline: 'Deli & prepared foods' },
  'Pantry': { icon: '🫙', color: '#D2B48C', tagline: 'Pantry staples' },
};

// ============================================================
// 🔧 HELPER FUNCTIONS
// ============================================================

function slugify(text) {
  return text.toString().toLowerCase().trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

function extractDescription(details) {
  if (!Array.isArray(details)) return null;
  // Convert HTML blocks into description (same as existing importJakScrape.ts)
  return details
    .map((d) => `<h3>${d.title || ''}</h3>${d.html || ''}`)
    .join('<br/><br/>');
}

function generateSKU(storeSlug, productId) {
  const prefix = storeSlug.substring(0, 3).toUpperCase();
  const timestamp = Date.now().toString(36).toUpperCase();
  return `${prefix}-${timestamp}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
}

// ============================================================
// 📁 DATABASE OPERATIONS
// ============================================================

async function createOrGetCategory(categoryPath) {
  if (!categoryPath || categoryPath.length === 0) return null;

  let parentCategory = null;
  let finalCategory = null;

  for (let i = 0; i < categoryPath.length; i++) {
    const categoryName = categoryPath[i];
    const isSubcategory = i > 0;
    
    const slug = isSubcategory 
      ? `${slugify(categoryPath[0])}-${slugify(categoryName)}`
      : slugify(categoryName);
    
    const config = CATEGORY_CONFIG[categoryName] || {};

    let category = await prisma.category.findUnique({ where: { slug } });

    if (!category) {
      category = await prisma.category.create({
        data: {
          name: categoryName,
          slug: slug,
          parentId: parentCategory?.id || null,
          icon: config.icon || (isSubcategory ? '📂' : '📦'),
          color: config.color || '#6B7280',
          tagline: config.tagline || `Shop ${categoryName}`,
          sortOrder: i * 10,
        },
      });
      
      const indent = isSubcategory ? '    └─' : '  ✅';
      console.log(`${indent} Created ${isSubcategory ? 'subcategory' : 'category'}: ${categoryName} ${config.icon || ''}`);
    }

    if (i === 0) parentCategory = category;
    finalCategory = category;
  }

  return finalCategory;
}

async function createOrGetSeller(storeConfig) {
  let seller = await prisma.seller.findUnique({ where: { slug: storeConfig.slug } });

  if (!seller) {
    seller = await prisma.seller.create({
      data: {
        storeName: storeConfig.storeName,
        slug: storeConfig.slug,
        city: storeConfig.city,
        state: storeConfig.state,
        country: storeConfig.country,
        about: storeConfig.about,
        isApproved: true,
        isBanned: false,
      },
    });
    console.log(`✅ Created seller: ${storeConfig.storeName}`);
  }

  return seller;
}

async function createOrGetStore(seller, storeConfig) {
  let store = await prisma.store.findUnique({ where: { slug: storeConfig.slug } });

  if (!store) {
    store = await prisma.store.create({
      data: {
        sellerId: seller.id,
        name: storeConfig.storeName,
        slug: storeConfig.slug,
        description: storeConfig.about,
        city: storeConfig.city,
        state: storeConfig.state,
        country: storeConfig.country,
        isActive: true,
      },
    });
    console.log(`✅ Created store: ${storeConfig.storeName}`);
  }

  return store;
}

// ============================================================
// 🚀 MAIN IMPORT FUNCTION
// ============================================================

async function importProducts(dataDir) {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🚀 STORESGO PRODUCT IMPORT');
  console.log('   Using existing backend features:');
  console.log('   ✅ AI Enrichment (aiEnrichment.service.ts)');
  console.log('   ✅ Dynamic Shipping (shipping.ts)');
  console.log('   ✅ Auto-categorization (categorizer.ts)');
  console.log('   ✅ SEO optimization (seo.service.ts)');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`📁 Data directory: ${dataDir}`);
  console.log(`💰 Price markup: ${MARKUP_PERCENT}%`);
  console.log('═══════════════════════════════════════════════════════════\n');

  let totalImported = 0;
  let totalSkipped = 0;
  let totalErrors = 0;
  const categoriesCreated = new Set();

  for (const storeConfig of STORES) {
    const filePath = path.join(dataDir, storeConfig.file);

    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${filePath}, skipping...`);
      continue;
    }

    console.log(`\n📦 Processing ${storeConfig.storeName}...`);
    console.log('─'.repeat(50));

    const rawData = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(rawData);
    const products = data.products || data;

    if (!Array.isArray(products)) {
      console.log(`⚠️  No products array found in ${storeConfig.file}`);
      continue;
    }

    console.log(`   📊 Found ${products.length.toLocaleString()} products`);

    const seller = await createOrGetSeller(storeConfig);
    const store = await createOrGetStore(seller, storeConfig);

    const batchSize = 50;
    const startTime = Date.now();

    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);

      for (const product of batch) {
        try {
          const externalId = product.id || `${storeConfig.slug}-${slugify(product.name)}-${Date.now()}`;

          // Skip duplicates (same as existing importJakScrape.ts)
          const existing = await prisma.product.findUnique({ where: { externalId } });
          if (existing) {
            totalSkipped++;
            continue;
          }

          // Skip BOGO category products
          if (product.category_path && product.category_path.some(c => c.toUpperCase().includes("BOGO"))) {
            totalSkipped++;
            continue;
          }

          // Skip products without valid images (no placeholders)
          if (!product.image || product.image.includes('placeholder') || product.image.length < 10) {
            totalSkipped++;
            continue;
          }

          // Get or create category hierarchy
          const category = await createOrGetCategory(product.category_path);
          if (category) categoriesCreated.add(category.name);

          // Build HTML description (same format as existing script)
          const description = extractDescription(product.details);

          // Calculate price with 20% markup
          const price = product.pricing?.currentPrice || product.price || 0;
          const priceCents = priceToCents(price);

          // Generate SKU
          const sku = generateSKU(storeConfig.slug, product.id);

          // Create product - AI enrichment will be triggered separately
          await prisma.product.create({
            data: {
              // Core fields
              sellerId: seller.id,
              storeId: store.id,
              categoryId: category?.id || null,
              name: product.name,
              description: description,
              externalId: externalId,
              sku: sku,
              
              // Pricing (with 20% markup)
              priceCents: priceCents,
              currency: 'USD',
              
              // Image
              imageUrl: product.image || null,
              
              // Status - approved and active for immediate sale
              status: 'approved',
              isActive: true,
              
              // Shipping - LIVE mode lets backend calculate dynamically
              shippingMode: 'LIVE',
              
              // AI Enrichment - set to pending so batch enrichment picks it up
              aiEnrichmentStatus: 'pending',
              
              // Store category path as initial tags for AI to enhance
              aiTags: product.category_path || [],
            },
          });

          totalImported++;
        } catch (error) {
          totalErrors++;
          if (totalErrors <= 20) {
            console.error(`\n   ❌ Error: ${product.name?.substring(0, 40)}... - ${error.message}`);
          }
        }
      }

      const progress = Math.min(i + batchSize, products.length);
      const percent = Math.round(progress / products.length * 100);
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      process.stdout.write(`\r   ⏳ Progress: ${progress.toLocaleString()}/${products.length.toLocaleString()} (${percent}%) - ${elapsed}s`);
    }

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n   ✅ Completed ${storeConfig.storeName} in ${totalTime}s`);
  }

  // Final summary
  console.log('\n');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📊 IMPORT SUMMARY');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`   ✅ Products imported:  ${totalImported.toLocaleString()}`);
  console.log(`   ⏭️  Duplicates skipped: ${totalSkipped.toLocaleString()}`);
  console.log(`   ❌ Errors:             ${totalErrors.toLocaleString()}`);
  console.log(`   📁 Categories created: ${categoriesCreated.size}`);
  console.log(`   🏪 Stores configured:  ${STORES.length}`);
  console.log('═══════════════════════════════════════════════════════════');
  
  console.log('\n🤖 TRIGGER AI ENRICHMENT:');
  console.log('   Products are imported with aiEnrichmentStatus: "pending"');
  console.log('   Run AI batch enrichment to enhance all products:');
  console.log('');
  console.log('   Option 1 - Via Admin API:');
  console.log('   curl -X POST http://localhost:5000/api/admin/ai/batch-enrich?limit=100');
  console.log('');
  console.log('   Option 2 - Via script:');
  console.log('   node -e "require(\'./src/services/aiEnrichment.service.js\').runBatchEnrichment({limit:100})"');
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📦 SHIPPING: Using LIVE mode - backend calculates dynamically');
  console.log('🏷️ CATEGORIES: Auto-assigned based on scraped category_path');
  console.log('🔍 SEO: Will be generated during AI enrichment');
  console.log('═══════════════════════════════════════════════════════════\n');
}

// ============================================================
// 🎯 EXECUTION
// ============================================================

const dataDir = process.argv[2] || './data';

importProducts(dataDir)
  .then(() => {
    console.log('✅ Import complete! Products ready for AI enrichment.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Import failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });