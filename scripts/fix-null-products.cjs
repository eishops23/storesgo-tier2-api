const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== PRODUCTS WITH NULL CATEGORY ===\n');
  
  const nullProducts = await prisma.product.findMany({
    where: { categoryId: null, isActive: true },
    select: { id: true, name: true, sellerId: true },
    take: 20
  });
  
  console.log('Sample products with no category:');
  console.table(nullProducts);
  
  const bySeller = await prisma.product.groupBy({
    by: ['sellerId'],
    where: { categoryId: null, isActive: true },
    _count: true
  });
  
  console.log('\nNULL category products by seller:');
  for (const s of bySeller) {
    const seller = await prisma.seller.findUnique({ 
      where: { id: s.sellerId },
      select: { storeName: true }
    });
    console.log('  ' + (seller?.storeName || 'Unknown') + ': ' + s._count + ' products');
  }
  
  const total = await prisma.product.count({ where: { categoryId: null, isActive: true } });
  console.log('\nTotal NULL category products: ' + total);
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
