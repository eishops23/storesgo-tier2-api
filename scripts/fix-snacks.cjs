const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== FIXING SNACKS CATEGORY ===\n');
  
  const snacks = await prisma.category.findUnique({ where: { slug: 'snacks' } });
  const bakingCooking = await prisma.category.findUnique({ where: { slug: 'baking-and-cooking' } });
  
  // 1. Move Deli and Prepared to Baking & Cooking
  const deli = await prisma.category.findUnique({ where: { slug: 'snacks-deli' } });
  const prepared = await prisma.category.findUnique({ where: { slug: 'snacks-prepared' } });
  
  if (deli) {
    await prisma.category.update({
      where: { id: deli.id },
      data: { parentId: bakingCooking.id, slug: 'baking-and-cooking-deli' }
    });
    console.log('Moved Deli to Baking & Cooking');
  }
  
  if (prepared) {
    await prisma.category.update({
      where: { id: prepared.id },
      data: { parentId: bakingCooking.id, slug: 'baking-and-cooking-prepared' }
    });
    console.log('Moved Prepared to Baking & Cooking');
  }
  
  // 2. Get snacks-snacks and flatten its grandchildren
  const snacksSnacks = await prisma.category.findUnique({ where: { slug: 'snacks-snacks' } });
  
  if (snacksSnacks) {
    // Move grandchildren to be direct children of main Snacks
    const grandchildren = await prisma.category.findMany({
      where: { parentId: snacksSnacks.id },
      select: { id: true, name: true, slug: true }
    });
    
    console.log('\nMoving ' + grandchildren.length + ' subcategories from snacks-snacks to Snacks');
    
    await prisma.category.updateMany({
      where: { parentId: snacksSnacks.id },
      data: { parentId: snacks.id }
    });
    
    // Delete snacks-snacks if empty
    const remaining = await prisma.category.count({ where: { parentId: snacksSnacks.id } });
    const products = await prisma.product.count({ where: { categoryId: snacksSnacks.id } });
    
    if (remaining === 0 && products === 0) {
      await prisma.category.delete({ where: { id: snacksSnacks.id } });
      console.log('Deleted empty snacks-snacks category');
    }
  }
  
  // 3. Check for empty original categories and merge if needed
  const emptyOnes = ['chips', 'chocolate-candy', 'cookies-sweet-treats', 'nuts-trail-mix', 'popcorn-pretzels'];
  
  for (const slug of emptyOnes) {
    const cat = await prisma.category.findUnique({ where: { slug } });
    if (!cat) continue;
    
    const products = await prisma.product.count({ where: { categoryId: cat.id } });
    const children = await prisma.category.count({ where: { parentId: cat.id } });
    
    if (products <= 2 && children === 0) {
      // Try to find matching category from snacks-snacks children
      console.log('Empty category to handle: ' + cat.name + ' (' + products + ' products)');
    }
  }
  
  console.log('\n✅ Done!');
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
