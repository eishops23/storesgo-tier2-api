import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function generateProductSlug(name: string, id: number): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 80);
  return `${base}-${id}`;
}

async function migrateProductSlugs() {
  const total = await prisma.product.count({ where: { slug: null } });
  console.log(`Found ${total} products without slugs`);
  
  let processed = 0;
  const batchSize = 1000;

  while (processed < total) {
    const products = await prisma.product.findMany({
      where: { slug: null },
      select: { id: true, name: true },
      take: batchSize
    });

    if (products.length === 0) break;

    await prisma.$transaction(
      products.map(p =>
        prisma.product.update({
          where: { id: p.id },
          data: { slug: generateProductSlug(p.name, p.id) }
        })
      )
    );

    processed += products.length;
    console.log(`Migrated ${processed}/${total} products`);
  }

  console.log('Migration complete!');
  await prisma.$disconnect();
}

migrateProductSlugs().catch(console.error);
