const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== CATEGORY HIERARCHY FIX ===\n');
  
  // 1. Find and fix orphans (all point to parent 1028 which was deleted)
  const orphans = await prisma.category.findMany({
    where: { parentId: 1028 }
  });
  console.log('Orphaned BOGO categories found:', orphans.length);
  
  if (orphans.length > 0) {
    // These are promotional categories - delete them as they're not useful
    const deleted = await prisma.category.deleteMany({
      where: { parentId: 1028 }
    });
    console.log('Deleted orphaned BOGO categories:', deleted.count);
  }
  
  // 2. Check for any other orphans
  const allCats = await prisma.category.findMany({ 
    select: { id: true, name: true, parentId: true } 
  });
  const catIds = new Set(allCats.map(c => c.id));
  
  const remainingOrphans = allCats.filter(c => {
    return c.parentId !== null && catIds.has(c.parentId) === false;
  });
  
  console.log('\nRemaining orphans after fix:', remainingOrphans.length);
  if (remainingOrphans.length > 0) {
    console.table(remainingOrphans);
  }
  
  // 3. Summary
  const total = await prisma.category.count();
  const topLevel = await prisma.category.count({ where: { parentId: null } });
  
  console.log('\n=== FINAL STATE ===');
  console.log('Total categories:', total);
  console.log('Top-level categories:', topLevel);
  
  // 4. Verify main categories
  console.log('\n=== MAIN CATEGORIES CHECK ===');
  const mainSlugs = [
    'caribbean-foods', 'latin-foods', 'asian-foods', 'fragrances',
    'snacks', 'beverages', 'baking-and-cooking', 'household-essentials',
    'personal-care', 'health-and-wellness', 'baby-products', 'pet-supplies'
  ];
  
  for (const slug of mainSlugs) {
    const cat = await prisma.category.findUnique({ 
      where: { slug },
      include: { _count: { select: { children: true } } }
    });
    if (cat) {
      const prodCount = await prisma.product.count({ 
        where: { categoryId: cat.id, isActive: true } 
      });
      console.log(`  ${cat.name}: ${cat._count.children} children, ${prodCount} direct products`);
    } else {
      console.log(`  ${slug}: MISSING`);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch(e => { console.error(e); process.exit(1); });
