const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.product.updateMany({
    where: { sourceImageUrl: { contains: 'missing-item' } },
    data: { isActive: false }
  });
  
  console.log('Hidden products:', result.count);
  
  const active = await prisma.product.count({ where: { isActive: true } });
  console.log('Active products with images:', active);
}
main().then(() => process.exit());
