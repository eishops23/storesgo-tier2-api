const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Our 12 main marketplace categories
const MAIN_CATEGORIES = {
  'caribbean-foods': { name: 'Caribbean Foods', icon: '🌴', tagline: 'Authentic Caribbean flavors', color: '#FF6B35' },
  'latin-foods': { name: 'Latin Foods', icon: '🌶️', tagline: 'Traditional Latin American cuisine', color: '#E63946' },
  'asian-foods': { name: 'Asian Foods', icon: '🥢', tagline: 'Flavors from across Asia', color: '#2A9D8F' },
  'fragrances': { name: 'Fragrances', icon: '💐', tagline: 'Perfumes & colognes', color: '#9B59B6' },
  'snacks': { name: 'Snacks', icon: '🍿', tagline: 'Chips, cookies & treats', color: '#F39C12' },
  'beverages': { name: 'Beverages', icon: '🥤', tagline: 'Drinks & refreshments', color: '#3498DB' },
  'baking-and-cooking': { name: 'Baking & Cooking', icon: '🍳', tagline: 'Ingredients & essentials', color: '#E74C3C' },
  'household-essentials': { name: 'Household Essentials', icon: '🧹', tagline: 'Home & cleaning supplies', color: '#1ABC9C' },
  'personal-care': { name: 'Personal Care', icon: '🧴', tagline: 'Health & beauty', color: '#9B59B6' },
  'health-and-wellness': { name: 'Health & Wellness', icon: '💊', tagline: 'Vitamins & health products', color: '#E91E63' },
  'baby-products': { name: 'Baby Products', icon: '🍼', tagline: 'Baby food, diapers & more', color: '#FF69B4' },
  'pet-supplies': { name: 'Pet Supplies', icon: '🐾', tagline: 'Pet food & supplies', color: '#795548' }
};

// Mapping of existing categories to main categories
const CATEGORY_MAPPING = {
  // Snacks
  'Snacks & Candy': 'snacks',
  
  // Beverages
  'Beverages': 'beverages',
  'Beer': 'beverages',
  'Wine': 'beverages',
  'Hard Beverages': 'beverages',
  
  // Baking & Cooking
  'Bakery': 'baking-and-cooking',
  'Baking Essentials': 'baking-and-cooking',
  'Breakfast': 'baking-and-cooking',
  'Canned Goods & Soups': 'baking-and-cooking',
  'Condiments & Sauces': 'baking-and-cooking',
  'Dairy & Eggs': 'baking-and-cooking',
  'Deli': 'baking-and-cooking',
  'Dry Goods & Pasta': 'baking-and-cooking',
  'Frozen': 'baking-and-cooking',
  'Meat & Seafood': 'baking-and-cooking',
  'Oils, Vinegars, & Spices': 'baking-and-cooking',
  'Prepared Foods': 'baking-and-cooking',
  'Produce': 'baking-and-cooking',
  'Catering': 'baking-and-cooking',
  
  // Household
  'Household': 'household-essentials',
  'Kitchen Supplies': 'household-essentials',
  'Paper Goods & Laundry': 'household-essentials',
  'Office & Craft': 'household-essentials',
  'Floral': 'household-essentials',
  'Party & Gift Supplies': 'household-essentials',
  'Miscellaneous': 'household-essentials',
  'Sales': 'household-essentials',
  
  // Personal Care
  'Personal Care': 'personal-care',
  
  // Health
  'Health Care': 'health-and-wellness',
  
  // Baby
  'Baby': 'baby-products',
  
  // Pets
  'Pets': 'pet-supplies',
  
  // Skip BOGO - will handle separately
  'BOGO': null
};

async function main() {
  console.log('=== BUILDING MARKETPLACE HIERARCHY ===\n');
  
  // Step 1: Create main categories
  console.log('1. Creating main categories...');
  const mainCats = {};
  
  for (const [slug, data] of Object.entries(MAIN_CATEGORIES)) {
    let cat = await prisma.category.findFirst({ where: { slug } });
    if (!cat) {
      cat = await prisma.category.create({
        data: { 
          name: data.name, 
          slug, 
          icon: data.icon, 
          tagline: data.tagline, 
          color: data.color,
          parentId: null,
          sortOrder: Object.keys(mainCats).length
        }
      });
      console.log('  Created: ' + data.name);
    }
    mainCats[slug] = cat;
  }
  
  // Step 2: Reparent existing categories
  console.log('\n2. Reparenting existing categories...');
  
  const existingCats = await prisma.category.findMany({
    where: { parentId: null }
  });
  
  for (const cat of existingCats) {
    const targetSlug = CATEGORY_MAPPING[cat.name];
    
    if (targetSlug === undefined) {
      console.log('  ⚠️ Unmapped: ' + cat.name);
      continue;
    }
    
    if (targetSlug === null) {
      // Delete BOGO and reassign products
      const products = await prisma.product.count({ where: { categoryId: cat.id } });
      if (products > 0) {
        // Move to household essentials
        await prisma.product.updateMany({
          where: { categoryId: cat.id },
          data: { categoryId: mainCats['household-essentials'].id }
        });
        console.log('  Moved ' + products + ' BOGO products to Household');
      }
      // Delete BOGO category and its children
      await prisma.category.deleteMany({ where: { parentId: cat.id } });
      await prisma.category.delete({ where: { id: cat.id } });
      console.log('  Deleted: ' + cat.name);
      continue;
    }
    
    const target = mainCats[targetSlug];
    if (target && cat.id !== target.id) {
      await prisma.category.update({
        where: { id: cat.id },
        data: { parentId: target.id }
      });
      console.log('  ' + cat.name + ' → ' + target.name);
    }
  }
  
  // Step 3: Count verification
  console.log('\n3. Verifying...');
  for (const [slug, cat] of Object.entries(mainCats)) {
    const children = await prisma.category.count({ where: { parentId: cat.id } });
    console.log('  ' + cat.name + ': ' + children + ' subcategories');
  }
  
  console.log('\n✅ Done!');
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
