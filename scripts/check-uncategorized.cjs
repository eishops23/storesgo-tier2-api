const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== INVESTIGATING UNCATEGORIZED PRODUCTS ===\n');
  
  // Get all main category IDs and their descendants
  const mainSlugs = [
    'caribbean-foods', 'latin-foods', 'asian-foods', 'fragrances',
    'snacks', 'beverages', 'baking-and-cooking', 'household-essentials',
    'personal-care', 'health-and-wellness', 'baby-products', 'pet-supplies'
  ];
  
  const allMainIds = new Set();
  
  for (const slug of mainSlugs) {
    const cat = await prisma.category.findUnique({ where: { slug } });
    if (cat) {
      allMainIds.add(cat.id);
      // Get all descendants
      let queue = [cat.id];
      while (queue.length > 0) {
        const children = await prisma.category.findMany({
          where: { parentId: { in: queue } },
          select: { id: true }
        });
        queue = children.map(c => c.id);
        queue.forEach(id => allMainIds.add(id));
      }
    }
  }
  
  console.log('Total category IDs under main categories:', allMainIds.size);
  
  // Find products NOT in these categories
  const idsArray = Array.from(allMainIds);
  const uncategorizedCount = await prisma.product.count({
    where: {
      isActive: true,
      OR: [
        { categoryId: null },
        { categoryId: { notIn: idsArray } }
      ]
    }
  });
  
  console.log('Products not under main categories:', uncategorizedCount);
  
  // What categories do these products belong to?
  const orphanProducts = await prisma.product.findMany({
    where: {
      isActive: true,
      OR: [
        { categoryId: null },
        { categoryId: { notIn: idsArray } }
      ]
    },
    select: { categoryId: true },
    take: 1000
  });
  
  // Group by categoryId
  const catCounts = {};
  orphanProducts.forEach(p => {
    const key = p.categoryId || 'NULL';
    catCounts[key] = (catCounts[key] || 0) + 1;
  });
  
  console.log('\nTop categories with orphan products:');
  const sorted = Object.entries(catCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);
  
  for (const [catId, count] of sorted) {
    if (catId === 'NULL') {
      console.log(`  NULL (no category): ${count} products`);
    } else {
      const cat = await prisma.category.findUnique({ 
        where: { id: parseInt(catId) },
        select: { id: true, name: true, slug: true, parentId: true }
      });
      if (cat) {
        // Find root parent
        let root = cat;
        while (root.parentId) {
          root = await prisma.category.findUnique({ 
            where: { id: root.parentId },
            select: { id: true, name: true, slug: true, parentId: true }
          });
        }
        console.log(`  ${cat.name} (id:${cat.id}) → root: ${root.name} (${root.slug}): ${count} products`);
      } else {
        console.log(`  Unknown category ID ${catId}: ${count} products`);
      }
    }
  }
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
