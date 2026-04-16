import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const products = await prisma.$queryRaw`SELECT id, category FROM Product_backup`; // if you saved a copy

  for (const p of products) {
    if (!p.category) continue;

    // create or find matching category
    const category = await prisma.category.upsert({
      where: { slug: p.category.toLowerCase().replace(/\s+/g, '-') },
      update: {},
      create: {
        slug: p.category.toLowerCase().replace(/\s+/g, '-'),
        name: p.category,
      },
    });

    // update product with the new categoryId
    await prisma.product.update({
      where: { id: p.id },
      data: { categoryId: category.id },
    });
  }

  console.log('✅ Backfill complete.');
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
