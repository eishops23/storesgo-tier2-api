const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== CLEANING UP SNACKS ===\n');
  
  const snacks = await prisma.category.findUnique({ where: { slug: 'snacks' } });
  
  const emptyOnes = ['chips', 'chocolate-candy', 'cookies-sweet-treats', 'nuts-trail-mix', 'popcorn-pretzels'];
  
  for (const slug of emptyOnes) {
    const cat = await prisma.category.findUnique({ where: { slug } });
    if (!cat) continue;
    
    const products = await prisma.product.count({ where: { categoryId: cat.id } });
    
    if (products <= 2) {
      if (products > 0) {
        let general = await prisma.category.findUnique({ where: { slug: 'snacks-general' } });
        if (!general) {
          general = await prisma.category.create({
            data: { name: 'General Snacks', slug: 'snacks-general', icon: '🍿', parentId: snacks.id, sortOrder: 999 }
          });
        }
        await prisma.product.updateMany({
          where: { categoryId: cat.id },
          data: { categoryId: general.id }
        });
        console.log('Moved ' + products + ' products from ' + cat.name);
      }
      
      await prisma.category.delete({ where: { id: cat.id } });
      console.log('Deleted empty: ' + cat.name);
    }
  }
  
  const children = await prisma.category.findMany({
    where: { parentId: snacks.id },
    select: { id: true, name: true }
  });
  
  console.log('\nSnacks now has ' + children.length + ' subcategories');
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
