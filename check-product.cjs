const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const product = await prisma.product.findUnique({
    where: { id: 1700 },
    select: { id: true, name: true, sourceImageUrl: true, imageUrl: true }
  });
  console.log(product);
}

main().finally(() => prisma.$disconnect());
