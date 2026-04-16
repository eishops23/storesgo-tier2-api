const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Map old categories to new main category slugs
const PARENT_MAP = {
  // Snacks
  'Snacks & Candy': 'snacks',
  
  // Beverages
  'Beer': 'beverages',
  'Wine': 'beverages',
  'Hard Beverages': 'beverages',
  
  // Baking & Cooking
  'Bakery': 'baking-cooking',
  'Baking Essentials': 'baking-cooking',
  'Breakfast': 'baking-cooking',
  'Canned Goods & Soups': 'baking-cooking',
  'Condiments & Sauces': 'baking-cooking',
  'Dairy & Eggs': 'baking-cooking',
  'Deli': 'baking-cooking',
  'Dry Goods & Pasta': 'baking-cooking',
  'Frozen': 'baking-cooking',
  'Meat & Seafood': 'baking-cooking',
  'Oils, Vinegars, & Spices': 'baking-cooking',
  'Prepared Foods': 'baking-cooking',
  'Produce': 'baking-cooking',
  'Catering': 'baking-cooking',
  
  // Household Essentials
  'Household': 'household-essentials',
  'Kitchen Supplies': 'household-essentials',
  'Paper Goods & Laundry': 'household-essentials',
  'Office & Craft': 'household-essentials',
  'Floral': 'household-essentials',
  'Party & Gift Supplies': 'household-essentials',
  'Miscellaneous': 'household-essentials',
  'Sales': 'household-essentials',
  
  // Health & Wellness
  'Health Care': 'health-wellness',
  
  // Baby
  'Baby': 'baby-products',
  
  // Pets
  'Pets': 'pet-supplies',
};

// Our 12 main category slugs (these stay as parentId = null)
const MAIN_SLUGS = [
  'caribbean-foods', 'latin-foods', 'asian-foods', 'fragrances',
  'snacks', 'beverages', 'baking-cooking', 'household-essentials',
  'personal-care', 'health-wellness', 'baby-products', 'pet-supplies'
];

async function main() {
  console.log('=== ORGANIZING CATEGORY HIERARCHY ===\n');

  // Get main category IDs
  const mainCats = await prisma.category.findMany({
    where: { slug: { in: MAIN_SLUGS } }
  });
  const mainMap = {};
  mainCats.forEach(c => { mainMap[c.slug] = c.id; });
  console.log('Main categories loaded:', Object.keys(mainMap).length);

  // Get all categories with parentId = null that are NOT main categories
  const orphans = await prisma.category.findMany({
    where: {
      parentId: null,
      slug: { notIn: MAIN_SLUGS }
    }
  });
  console.log('Categories to reparent:', orphans.length);

  // Reparent each one
  let updated = 0, skipped = 0;
  for (const cat of orphans) {
    const targetSlug = PARENT_MAP[cat.name];
    if (targetSlug && mainMap[targetSlug]) {
      await prisma.category.update({
        where: { id: cat.id },
        data: { parentId: mainMap[targetSlug] }
      });
      updated++;
    } else {
      // Default to baking-cooking for food items, household for others
      const defaultParent = mainMap['baking-cooking'];
      await prisma.category.update({
        where: { id: cat.id },
        data: { parentId: defaultParent }
      });
      console.log('   ⚠ Defaulted:', cat.name, '→ Baking & Cooking');
      updated++;
    }
  }

  console.log('\n✓ Updated:', updated, 'categories');

  // Verify hierarchy
  console.log('\n=== FINAL HIERARCHY ===');
  const hierarchy = await prisma.category.findMany({
    where: { parentId: null },
    include: { children: { select: { name: true }, take: 5 } },
    orderBy: { sortOrder: 'asc' }
  });

  for (const cat of hierarchy) {
    const childCount = await prisma.category.count({ where: { parentId: cat.id } });
    const productCount = await prisma.product.count({ where: { category: { parentId: cat.id } } });
    console.log(`${cat.icon} ${cat.name}: ${childCount} subcategories, ${productCount} products`);
    if (cat.children.length > 0) {
      console.log('   └─', cat.children.map(c => c.name).join(', '), childCount > 5 ? '...' : '');
    }
  }

  await prisma.$disconnect();
  console.log('\n✅ Done!');
}

main().catch(e => { console.error(e); process.exit(1); });
