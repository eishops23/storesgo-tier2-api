const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Get Baby Products
  const babyProducts = await prisma.category.findFirst({
    where: { slug: 'baby-products' }
  });
  
  if (!babyProducts) {
    console.log('Baby Products not found');
    return;
  }
  
  // Get subcategories
  const subcats = await prisma.category.findMany({
    where: { parentId: babyProducts.id }
  });
  
  console.log('=== Baby Products Subcategories ===\n');
  
  for (const sub of subcats) {
    // Direct products
    const directCount = await prisma.product.count({
      where: { categoryId: sub.id, isActive: true }
    });
    
    // Check for children (sub-subcategories)
    const children = await prisma.category.findMany({
      where: { parentId: sub.id }
    });
    
    let childProductCount = 0;
    if (children.length > 0) {
      const childIds = children.map(c => c.id);
      childProductCount = await prisma.product.count({
        where: { categoryId: { in: childIds }, isActive: true }
      });
    }
    
    console.log(sub.name + ':');
    console.log('  Direct products: ' + directCount);
    console.log('  Children: ' + children.length);
    console.log('  Products in children: ' + childProductCount);
    console.log('  Icon: ' + sub.icon);
    if (children.length > 0) {
      console.log('  Child categories: ' + children.map(c => c.name).join(', '));
    }
    console.log('');
  }
  
  await prisma.$disconnect();
}
main();
