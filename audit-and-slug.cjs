const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function createSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').substring(0, 80).replace(/^-|-$/g, '');
}

async function main() {
  // AUDIT
  const products = await prisma.product.findMany({
    where: { isActive: true, imageUrl: { not: null } },
    select: { id: true, name: true, sourceImageUrl: true }
  });
  
  const urlCounts = {};
  products.forEach(p => { urlCounts[p.sourceImageUrl] = (urlCounts[p.sourceImageUrl] || 0) + 1; });
  const shared = Object.entries(urlCounts).filter(([url, count]) => count > 1);
  const totalBorrowed = shared.reduce((sum, [url, count]) => sum + count - 1, 0);
  
  console.log('=== Image Audit ===');
  console.log('Total active:', products.length);
  console.log('Original images:', products.length - totalBorrowed);
  console.log('Borrowed images:', totalBorrowed);
  console.log('Accuracy:', ((products.length - totalBorrowed) / products.length * 100).toFixed(1) + '%');
  
  // ADD SLUGS
  console.log('\n=== Adding Slugs ===');
  let updated = 0;
  for (const p of products) {
    const slug = createSlug(p.name || 'product-' + p.id);
    await prisma.product.update({ where: { id: p.id }, data: { sku: slug } });
    updated++;
    if (updated % 5000 === 0) console.log('Updated', updated);
  }
  
  console.log('Slugs added to', updated, 'products');
  
  const samples = await prisma.product.findMany({ where: { isActive: true }, take: 5, select: { id: true, name: true, sku: true } });
  console.log('\nSample URLs:');
  samples.forEach(p => console.log('  /products/' + p.sku + '-' + p.id));
  
  await prisma.$disconnect();
}
main();
