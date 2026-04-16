const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== CATEGORY HIERARCHY AUDIT ===\n');
  
  const allCats = await prisma.category.findMany({ 
    select: { id: true, name: true, parentId: true, slug: true } 
  });
  const catIds = new Set(allCats.map(c => c.id));
  
  // 1. Orphaned categories
  const orphans = allCats.filter(c => c.parentId !== null && !catIds.has(c.parentId));
  console.log('1. Orphaned categories (parentId points to non-existent):', orphans.length);
  if (orphans.length > 0) console.table(orphans.slice(0, 10));
  
  // 2. Empty leaf categories
  console.log('\n2. Checking empty leaf categories...');
  const emptyLeaves = [];
  for (const cat of allCats) {
    const childCount = await prisma.category.count({ where: { parentId: cat.id } });
    if (childCount === 0) {
      const prodCount = await prisma.product.count({ where: { categoryId: cat.id, isActive: true } });
      if (prodCount === 0) {
        emptyLeaves.push({ id: cat.id, name: cat.name, parentId: cat.parentId });
      }
    }
  }
  console.log('Empty leaf categories (no products, no children):', emptyLeaves.length);
  if (emptyLeaves.length > 0 && emptyLeaves.length <= 20) {
    console.table(emptyLeaves);
  } else if (emptyLeaves.length > 20) {
    console.table(emptyLeaves.slice(0, 20));
    console.log('... and', emptyLeaves.length - 20, 'more');
  }
  
  // 3. Top-level structure
  const topLevel = await prisma.category.findMany({ 
    where: { parentId: null }, 
    select: { id: true, name: true, slug: true },
    orderBy: { name: 'asc' }
  });
  console.log('\n3. Top-level categories:', topLevel.length);
  console.table(topLevel);
  
  // 4. Depth analysis
  console.log('\n4. Category depth distribution:');
  const depths = { 1: 0, 2: 0, 3: 0, 4: 0 };
  for (const cat of allCats) {
    let depth = 1;
    let currentParentId = cat.parentId;
    while (currentParentId !== null) {
      depth++;
      const parent = allCats.find(c => c.id === currentParentId);
      currentParentId = parent ? parent.parentId : null;
    }
    depths[depth] = (depths[depth] || 0) + 1;
  }
  console.table(depths);
  
  // 5. Categories with duplicate slugs
  console.log('\n5. Duplicate slugs:');
  const slugCounts = {};
  allCats.forEach(c => { slugCounts[c.slug] = (slugCounts[c.slug] || 0) + 1; });
  const dupes = Object.entries(slugCounts).filter(([slug, count]) => count > 1);
  console.log('Categories with duplicate slugs:', dupes.length);
  if (dupes.length > 0) console.table(dupes.slice(0, 10));
  
  // 6. Check if all 12 main categories exist
  console.log('\n6. Main storefront categories check:');
  const mainSlugs = [
    'caribbean-foods', 'latin-foods', 'asian-foods', 'fragrances',
    'snacks', 'beverages', 'baking-and-cooking', 'household-essentials',
    'personal-care', 'health-and-wellness', 'baby-products', 'pet-supplies'
  ];
  for (const slug of mainSlugs) {
    const exists = await prisma.category.findUnique({ where: { slug } });
    console.log(`  ${slug}: ${exists ? '✅ exists (id: ' + exists.id + ')' : '❌ MISSING'}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch(e => { console.error(e); process.exit(1); });
