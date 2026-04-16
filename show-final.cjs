const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const missing = await prisma.product.findMany({ where: { sourceImageUrl: { contains: 'missing-item' } }, select: { name: true }, take: 100 });
  console.log('=== Final 489 products without images (sample of 100) ===\n');
  missing.forEach(p => console.log(p.name));
  await prisma.$disconnect();
}
main();
