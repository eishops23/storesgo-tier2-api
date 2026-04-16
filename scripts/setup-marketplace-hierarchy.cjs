const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const MAIN_CATEGORIES = [
  { slug: 'caribbean-foods', name: 'Caribbean Foods', icon: '🌴', tagline: 'Authentic Caribbean flavors', color: '#FF6B35', sortOrder: 1 },
  { slug: 'latin-foods', name: 'Latin Foods', icon: '🌶️', tagline: 'Traditional Latin American cuisine', color: '#E63946', sortOrder: 2 },
  { slug: 'asian-foods', name: 'Asian Foods', icon: '🥢', tagline: 'Flavors from across Asia', color: '#2A9D8F', sortOrder: 3 },
  { slug: 'fragrances', name: 'Fragrances', icon: '💐', tagline: 'Perfumes & colognes', color: '#9B59B6', sortOrder: 4 },
  { slug: 'snacks', name: 'Snacks', icon: '🍿', tagline: 'Chips, cookies & treats', color: '#F39C12', sortOrder: 5 },
  { slug: 'beverages', name: 'Beverages', icon: '🥤', tagline: 'Drinks & refreshments', color: '#3498DB', sortOrder: 6 },
  { slug: 'baking-cooking', name: 'Baking & Cooking', icon: '🍳', tagline: 'Ingredients & essentials', color: '#E74C3C', sortOrder: 7 },
  { slug: 'household-essentials', name: 'Household Essentials', icon: '🧹', tagline: 'Home & cleaning supplies', color: '#1ABC9C', sortOrder: 8 },
  { slug: 'personal-care', name: 'Personal Care', icon: '🧴', tagline: 'Health & beauty', color: '#9B59B6', sortOrder: 9 },
  { slug: 'health-wellness', name: 'Health & Wellness', icon: '💊', tagline: 'Vitamins & health products', color: '#E91E63', sortOrder: 10 },
  { slug: 'baby-products', name: 'Baby Products', icon: '🍼', tagline: 'Baby food, diapers & more', color: '#FF69B4', sortOrder: 11 },
  { slug: 'pet-supplies', name: 'Pet Supplies', icon: '🐾', tagline: 'Pet food & supplies', color: '#795548', sortOrder: 12 }
];

const MAPPING_RULES = [
  // Caribbean
  { targetCategory: 'caribbean-foods', matchType: 'brand', matchValue: 'Grace', priority: 100 },
  { targetCategory: 'caribbean-foods', matchType: 'brand', matchValue: 'Walkerswood', priority: 100 },
  { targetCategory: 'caribbean-foods', matchType: 'brand', matchValue: 'Ting', priority: 100 },
  { targetCategory: 'caribbean-foods', matchType: 'keyword', matchValue: 'jerk', priority: 90 },
  { targetCategory: 'caribbean-foods', matchType: 'keyword', matchValue: 'jamaican', priority: 90 },
  { targetCategory: 'caribbean-foods', matchType: 'keyword', matchValue: 'plantain', priority: 90 },
  { targetCategory: 'caribbean-foods', matchType: 'keyword', matchValue: 'caribbean', priority: 90 },
  { targetCategory: 'caribbean-foods', matchType: 'keyword', matchValue: 'island', priority: 70 },
  // Latin
  { targetCategory: 'latin-foods', matchType: 'brand', matchValue: 'Goya', priority: 100 },
  { targetCategory: 'latin-foods', matchType: 'brand', matchValue: 'Badia', priority: 100 },
  { targetCategory: 'latin-foods', matchType: 'brand', matchValue: 'La Fe', priority: 100 },
  { targetCategory: 'latin-foods', matchType: 'brand', matchValue: 'Iberia', priority: 100 },
  { targetCategory: 'latin-foods', matchType: 'brand', matchValue: 'Jarritos', priority: 100 },
  { targetCategory: 'latin-foods', matchType: 'brand', matchValue: 'Jumex', priority: 100 },
  { targetCategory: 'latin-foods', matchType: 'keyword', matchValue: 'mexican', priority: 90 },
  { targetCategory: 'latin-foods', matchType: 'keyword', matchValue: 'hispanic', priority: 90 },
  { targetCategory: 'latin-foods', matchType: 'keyword', matchValue: 'latino', priority: 90 },
  { targetCategory: 'latin-foods', matchType: 'keyword', matchValue: 'adobo', priority: 80 },
  { targetCategory: 'latin-foods', matchType: 'keyword', matchValue: 'sofrito', priority: 90 },
  { targetCategory: 'latin-foods', matchType: 'keyword', matchValue: 'empanada', priority: 90 },
  { targetCategory: 'latin-foods', matchType: 'keyword', matchValue: 'tortilla', priority: 70 },
  // Asian
  { targetCategory: 'asian-foods', matchType: 'brand', matchValue: 'Kikkoman', priority: 100 },
  { targetCategory: 'asian-foods', matchType: 'brand', matchValue: 'Lee Kum Kee', priority: 100 },
  { targetCategory: 'asian-foods', matchType: 'brand', matchValue: 'Thai Kitchen', priority: 100 },
  { targetCategory: 'asian-foods', matchType: 'brand', matchValue: 'Nissin', priority: 100 },
  { targetCategory: 'asian-foods', matchType: 'brand', matchValue: 'Nongshim', priority: 100 },
  { targetCategory: 'asian-foods', matchType: 'keyword', matchValue: 'asian', priority: 90 },
  { targetCategory: 'asian-foods', matchType: 'keyword', matchValue: 'chinese', priority: 90 },
  { targetCategory: 'asian-foods', matchType: 'keyword', matchValue: 'japanese', priority: 90 },
  { targetCategory: 'asian-foods', matchType: 'keyword', matchValue: 'korean', priority: 90 },
  { targetCategory: 'asian-foods', matchType: 'keyword', matchValue: 'thai', priority: 90 },
  { targetCategory: 'asian-foods', matchType: 'keyword', matchValue: 'soy sauce', priority: 80 },
  { targetCategory: 'asian-foods', matchType: 'keyword', matchValue: 'kimchi', priority: 90 },
  { targetCategory: 'asian-foods', matchType: 'keyword', matchValue: 'ramen', priority: 80 },
  { targetCategory: 'asian-foods', matchType: 'keyword', matchValue: 'teriyaki', priority: 80 },
  // Category mappings
  { targetCategory: 'snacks', matchType: 'category_name', matchValue: 'Snacks & Candy', priority: 100 },
  { targetCategory: 'beverages', matchType: 'category_name', matchValue: 'Beverages', priority: 100 },
  { targetCategory: 'beverages', matchType: 'category_name', matchValue: 'Beer', priority: 100 },
  { targetCategory: 'beverages', matchType: 'category_name', matchValue: 'Wine', priority: 100 },
  { targetCategory: 'baking-cooking', matchType: 'category_name', matchValue: 'Bakery', priority: 100 },
  { targetCategory: 'baking-cooking', matchType: 'category_name', matchValue: 'Baking Essentials', priority: 100 },
  { targetCategory: 'baking-cooking', matchType: 'category_name', matchValue: 'Breakfast', priority: 100 },
  { targetCategory: 'baking-cooking', matchType: 'category_name', matchValue: 'Canned Goods & Soups', priority: 100 },
  { targetCategory: 'baking-cooking', matchType: 'category_name', matchValue: 'Condiments & Sauces', priority: 100 },
  { targetCategory: 'baking-cooking', matchType: 'category_name', matchValue: 'Dairy & Eggs', priority: 100 },
  { targetCategory: 'baking-cooking', matchType: 'category_name', matchValue: 'Deli', priority: 100 },
  { targetCategory: 'baking-cooking', matchType: 'category_name', matchValue: 'Dry Goods & Pasta', priority: 100 },
  { targetCategory: 'baking-cooking', matchType: 'category_name', matchValue: 'Frozen', priority: 100 },
  { targetCategory: 'baking-cooking', matchType: 'category_name', matchValue: 'Meat & Seafood', priority: 100 },
  { targetCategory: 'baking-cooking', matchType: 'category_name', matchValue: 'Oils, Vinegars, & Spices', priority: 100 },
  { targetCategory: 'baking-cooking', matchType: 'category_name', matchValue: 'Prepared Foods', priority: 100 },
  { targetCategory: 'baking-cooking', matchType: 'category_name', matchValue: 'Produce', priority: 100 },
  { targetCategory: 'household-essentials', matchType: 'category_name', matchValue: 'Household', priority: 100 },
  { targetCategory: 'household-essentials', matchType: 'category_name', matchValue: 'Kitchen Supplies', priority: 100 },
  { targetCategory: 'household-essentials', matchType: 'category_name', matchValue: 'Paper Goods & Laundry', priority: 100 },
  { targetCategory: 'household-essentials', matchType: 'category_name', matchValue: 'Office & Craft', priority: 100 },
  { targetCategory: 'household-essentials', matchType: 'category_name', matchValue: 'Floral', priority: 100 },
  { targetCategory: 'personal-care', matchType: 'category_name', matchValue: 'Personal Care', priority: 100 },
  { targetCategory: 'health-wellness', matchType: 'category_name', matchValue: 'Health Care', priority: 100 },
  { targetCategory: 'baby-products', matchType: 'category_name', matchValue: 'Baby', priority: 100 },
  { targetCategory: 'pet-supplies', matchType: 'category_name', matchValue: 'Pets', priority: 100 },
];

async function main() {
  console.log('=== SETTING UP MARKETPLACE HIERARCHY ===\n');

  // Step 1: Create main categories
  console.log('1. Creating 12 main categories...');
  for (const cat of MAIN_CATEGORIES) {
    const existing = await prisma.category.findUnique({ where: { slug: cat.slug } });
    if (!existing) {
      await prisma.category.create({ data: { ...cat, parentId: null } });
      console.log('   ✓ Created:', cat.name);
    } else {
      await prisma.category.update({ where: { slug: cat.slug }, data: { ...cat, parentId: null } });
      console.log('   ↻ Updated:', cat.name);
    }
  }

  // Step 2: Seed mapping rules
  console.log('\n2. Seeding category mapping rules...');
  let created = 0, skipped = 0;
  for (const rule of MAPPING_RULES) {
    try {
      await prisma.categoryMapping.create({ data: rule });
      created++;
    } catch (e) {
      if (e.code === 'P2002') skipped++;
      else throw e;
    }
  }
  console.log('   ✓ Created:', created, 'rules');
  console.log('   ⊘ Skipped:', skipped, 'existing');

  // Step 3: Summary
  console.log('\n3. Summary:');
  const mainCats = await prisma.category.findMany({ where: { parentId: null }, orderBy: { sortOrder: 'asc' } });
  console.log('   Main categories:', mainCats.length);
  mainCats.forEach(c => console.log('    ', c.icon, c.name));

  const mappings = await prisma.categoryMapping.count();
  console.log('\n   Mapping rules:', mappings);

  await prisma.$disconnect();
  console.log('\n✅ Done!');
}

main().catch(e => { console.error(e); process.exit(1); });
