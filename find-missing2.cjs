const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== Investigating products with missing images ===\n');
  
  const missingProducts = await prisma.product.findMany({
    where: { sourceImageUrl: { contains: 'missing-item' } },
    select: { id: true, name: true, sku: true, externalId: true, seller: { select: { storeName: true } } }
  });
  
  console.log('Total missing:', missingProducts.length);
  
  const sellerCounts = {};
  missingProducts.forEach(p => {
    const seller = p.seller?.storeName || 'Unknown';
    sellerCounts[seller] = (sellerCounts[seller] || 0) + 1;
  });
  console.log('\n=== By Seller ===');
  Object.entries(sellerCounts).sort((a,b) => b[1] - a[1]).forEach(([s, c]) => console.log('  ' + s + ': ' + c));
  
  console.log('\n=== Checking for duplicate names with real images ===');
  let foundByName = 0;
  const nameMatches = [];
  
  for (const product of missingProducts.slice(0, 100)) {
    const match = await prisma.product.findFirst({
      where: {
        name: product.name,
        sourceImageUrl: { not: null },
        NOT: { sourceImageUrl: { contains: 'missing-item' } }
      },
      select: { id: true, name: true, sourceImageUrl: true }
    });
    if (match) {
      foundByName++;
      if (nameMatches.length < 5) {
        nameMatches.push({ missing: product, hasImage: match });
      }
    }
  }
  console.log('Found ' + foundByName + '/100 products with same name that HAVE images');
  nameMatches.forEach(m => {
    console.log('  "' + (m.missing.name || '').substring(0, 50) + '"');
    console.log('    Missing ID: ' + m.missing.id + ' -> Has Image ID: ' + m.hasImage.id);
  });
  
  const estimatedByName = Math.round(foundByName / 100 * missingProducts.length);
  console.log('\nEstimated recoverable by NAME match: ~' + estimatedByName);
  
  await prisma.$disconnect();
}

main().catch(console.error);
