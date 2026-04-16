const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== MAIN CATEGORIES STATUS ===\n');
  
  const mainSlugs = [
    'caribbean-foods', 'latin-foods', 'asian-foods', 'fragrances',
    'snacks', 'beverages', 'baking-and-cooking', 'household-essentials',
    'personal-care', 'health-and-wellness', 'baby-products', 'pet-supplies'
  ];
  
  let totalProducts = 0;
  
  for (const slug of mainSlugs) {
    const cat = await prisma.category.findUnique({ where: { slug } });
    if (cat) {
      // Count children
      const childCount = await prisma.category.count({ where: { parentId: cat.id } });
      
      // Get recursive product count (all descendants)
      const descendants = [cat.id];
      let queue = [cat.id];
      while (queue.length > 0) {
        const children = await prisma.category.findMany({
          where: { parentId: { in: queue } },
          select: { id: true }
        });
        queue = children.map(c => c.id);
        descendants.push(...queue);
      }
      
      const prodCount = await prisma.product.count({ 
        where: { categoryId: { in: descendants }, isActive: true } 
      });
      
      totalProducts += prodCount;
      console.log(`✅ ${cat.name.padEnd(22)} | ${childCount.toString().padStart(3)} children | ${prodCount.toString().padStart(5)} products`);
    } else {
      console.log(`❌ ${slug}: MISSING`);
    }
  }
  
  console.log('\n' + '='.repeat(55));
  console.log(`TOTAL: ${totalProducts} products across 12 main categories`);
  
  // Check total products in system
  const allProducts = await prisma.product.count({ where: { isActive: true } });
  const uncategorized = allProducts - totalProducts;
  console.log(`Total active products: ${allProducts}`);
  if (uncategorized > 0) {
    console.log(`⚠️  Uncategorized products: ${uncategorized}`);
  }
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
