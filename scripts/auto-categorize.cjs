const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Keyword to category mapping
const CATEGORY_RULES = [
  { keywords: ['baby food', 'baby yogurt', 'baby pouch', 'serenity kids'], slug: 'baby-products' },
  { keywords: ['diaper', 'wipes', 'huggies', 'pampers'], slug: 'baby-products' },
  { keywords: ['coffee', 'creamer', 'coffee mate'], slug: 'beverages' },
  { keywords: ['bread', 'buns', 'bagel', 'muffin', 'croissant'], slug: 'baking-and-cooking' },
  { keywords: ['chips', 'snack', 'crackers', 'popcorn', 'pretzels'], slug: 'snacks' },
  { keywords: ['soap', 'shampoo', 'lotion', 'deodorant'], slug: 'personal-care' },
  { keywords: ['vitamin', 'supplement', 'medicine'], slug: 'health-and-wellness' },
  { keywords: ['dog', 'cat', 'pet food', 'pet treat'], slug: 'pet-supplies' },
  { keywords: ['cleaner', 'detergent', 'paper towel', 'trash bag'], slug: 'household-essentials' },
];

async function main() {
  console.log('=== AUTO-CATEGORIZING NULL PRODUCTS ===\n');
  
  // Get category IDs
  const categoryMap = {};
  for (const rule of CATEGORY_RULES) {
    const cat = await prisma.category.findUnique({ where: { slug: rule.slug } });
    if (cat) categoryMap[rule.slug] = cat.id;
  }
  
  // Get all NULL category products
  const nullProducts = await prisma.product.findMany({
    where: { categoryId: null, isActive: true },
    select: { id: true, name: true }
  });
  
  console.log('Products to categorize:', nullProducts.length);
  
  let categorized = 0;
  let uncategorized = 0;
  const uncategorizedList = [];
  
  for (const product of nullProducts) {
    const nameLower = product.name.toLowerCase();
    let matched = false;
    
    for (const rule of CATEGORY_RULES) {
      for (const keyword of rule.keywords) {
        if (nameLower.includes(keyword)) {
          await prisma.product.update({
            where: { id: product.id },
            data: { categoryId: categoryMap[rule.slug] }
          });
          categorized++;
          matched = true;
          break;
        }
      }
      if (matched) break;
    }
    
    if (!matched) {
      uncategorized++;
      if (uncategorizedList.length < 20) {
        uncategorizedList.push({ id: product.id, name: product.name });
      }
    }
  }
  
  console.log('\n✅ Categorized:', categorized);
  console.log('⚠️  Still uncategorized:', uncategorized);
  
  if (uncategorizedList.length > 0) {
    console.log('\nSample uncategorized products:');
    console.table(uncategorizedList);
  }
  
  // Assign remaining to a general category (Household Essentials as fallback)
  if (uncategorized > 0) {
    const fallbackCat = await prisma.category.findUnique({ where: { slug: 'household-essentials' } });
    if (fallbackCat) {
      const updated = await prisma.product.updateMany({
        where: { categoryId: null, isActive: true },
        data: { categoryId: fallbackCat.id }
      });
      console.log('\n✅ Assigned remaining ' + updated.count + ' products to Household Essentials (for admin review)');
    }
  }
  
  // Final check
  const stillNull = await prisma.product.count({ where: { categoryId: null, isActive: true } });
  console.log('\n=== FINAL CHECK ===');
  console.log('Products still without category:', stillNull);
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
