const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function createSlug(name, id) {
  const base = name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').substring(0, 60).replace(/^-|-$/g, '');
  return base + '-' + id;
}

async function main() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: { id: true, name: true }
  });
  
  console.log('Adding unique slugs to', products.length, 'products...');
  
  let updated = 0;
  for (const p of products) {
    const slug = createSlug(p.name || 'product', p.id);
    await prisma.product.update({ where: { id: p.id }, data: { sku: slug } });
    updated++;
    if (updated % 5000 === 0) console.log('Updated', updated);
  }
  
  console.log('Done! Slugs added to', updated, 'products');
  
  const samples = await prisma.product.findMany({ where: { isActive: true }, take: 5, select: { id: true, name: true, sku: true } });
  console.log('\nSample SEO URLs:');
  samples.forEach(p => console.log('  /products/' + p.sku));
  
  await prisma.$disconnect();
}
main();
