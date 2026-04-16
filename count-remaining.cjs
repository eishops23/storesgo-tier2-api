const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Count remaining missing
  const stillMissing = await prisma.product.count({
    where: { sourceImageUrl: { contains: 'missing-item' } }
  });
  
  console.log('Still missing images:', stillMissing);
  console.log('Total products:', await prisma.product.count());
  console.log('Coverage:', ((38397 - stillMissing) / 38397 * 100).toFixed(1) + '%');
  
  await prisma.$disconnect();
}

main();
