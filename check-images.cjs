const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Get sample of products and their imageUrls
  const products = await prisma.product.findMany({
    take: 10,
    select: { id: true, imageUrl: true, name: true }
  });
  
  console.log('Sample products and their imageUrls:\n');
  products.forEach(p => {
    console.log('ID:', p.id);
    console.log('Name:', p.name?.substring(0, 50));
    console.log('ImageUrl:', p.imageUrl);
    console.log('---');
  });
  
  // Count by imageUrl pattern
  const total = await prisma.product.count();
  const withInstacart = await prisma.product.count({ where: { imageUrl: { contains: 'instacart' } } });
  const withStoresgo = await prisma.product.count({ where: { imageUrl: { contains: 'storesgo' } } });
  const withNull = await prisma.product.count({ where: { imageUrl: null } });
  
  console.log('\nCounts:');
  console.log('Total products:', total);
  console.log('With instacart URL:', withInstacart);
  console.log('With storesgo URL:', withStoresgo);
  console.log('With null imageUrl:', withNull);
}

main().catch(console.error).finally(() => prisma.$disconnect());
