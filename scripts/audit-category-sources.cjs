const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== CATEGORY SOURCE AUDIT ===\n');
  
  // Get main categories
  const mainCats = await prisma.category.findMany({
    where: { parentId: null },
    select: { id: true, name: true, slug: true }
  });
  
  console.log('12 Main Categories:');
  for (const cat of mainCats) {
    // Get children
    const children = await prisma.category.findMany({
      where: { parentId: cat.id },
      select: { id: true, name: true }
    });
    
    // Get recursive product count
    let totalProducts = await prisma.product.count({ where: { categoryId: cat.id } });
    for (const child of children) {
      totalProducts += await prisma.product.count({ where: { categoryId: child.id } });
      // Get grandchildren too
      const grandchildren = await prisma.category.findMany({ where: { parentId: child.id } });
      for (const gc of grandchildren) {
        totalProducts += await prisma.product.count({ where: { categoryId: gc.id } });
      }
    }
    
    console.log('\n' + cat.name + ': ' + totalProducts + ' products, ' + children.length + ' children');
    children.slice(0, 3).forEach(c => console.log('  - ' + c.name));
    if (children.length > 3) console.log('  ... and ' + (children.length - 3) + ' more');
  }
  
  // Check "General" categories
  const generalCats = await prisma.category.findMany({
    where: { slug: { contains: 'general' } },
    select: { id: true, name: true, slug: true }
  });
  
  console.log('\n\n=== KEYWORD-CREATED GENERAL CATEGORIES ===');
  for (const c of generalCats) {
    const count = await prisma.product.count({ where: { categoryId: c.id } });
    console.log(c.name + ': ' + count + ' products');
  }
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
