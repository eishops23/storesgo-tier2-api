const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("=== CATEGORY PRODUCT DISTRIBUTION ===\n");
  
  const mainSlugs = [
    'caribbean-foods', 'latin-foods', 'asian-foods', 'fragrances',
    'snacks', 'beverages', 'baking-and-cooking', 'household-essentials',
    'personal-care', 'health-and-wellness', 'baby-products', 'pet-supplies'
  ];
  
  for (const slug of mainSlugs) {
    const cat = await prisma.category.findUnique({ where: { slug } });
    if (!cat) continue;
    
    // Direct products (in parent, not subcategories)
    const directProducts = await prisma.product.count({
      where: { categoryId: cat.id, isActive: true }
    });
    
    // Get all children
    const children = await prisma.category.findMany({
      where: { parentId: cat.id },
      select: { id: true, name: true }
    });
    
    // Count products in all descendants
    let descendantTotal = 0;
    let queue = children.map(c => c.id);
    while (queue.length > 0) {
      const count = await prisma.product.count({
        where: { categoryId: { in: queue }, isActive: true }
      });
      descendantTotal += count;
      
      const nextLevel = await prisma.category.findMany({
        where: { parentId: { in: queue } },
        select: { id: true }
      });
      queue = nextLevel.map(c => c.id);
    }
    
    const total = directProducts + descendantTotal;
    
    if (directProducts > 0) {
      console.log(`⚠️  ${cat.name}`);
      console.log(`   Direct in parent: ${directProducts}`);
      console.log(`   In subcategories: ${descendantTotal}`);
      console.log(`   Total: ${total}`);
      console.log("");
    }
  }
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
