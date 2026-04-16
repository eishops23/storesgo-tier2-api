const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const missingProducts = await prisma.product.findMany({
    where: { sourceImageUrl: { contains: 'missing-item' } },
    select: { id: true, name: true, sku: true, externalId: true }
  });
  
  console.log('=== Sample of 50 products missing images ===\n');
  missingProducts.slice(0, 50).forEach(p => {
    console.log('ID ' + p.id + ': ' + (p.name || 'NO NAME'));
  });
  
  // Categorize by type
  console.log('\n=== Analyzing product types ===');
  const categories = {
    produce: 0,
    meat: 0,
    deli: 0,
    bakery: 0,
    prepared: 0,
    generic: 0,
    other: 0
  };
  
  missingProducts.forEach(p => {
    const name = (p.name || '').toLowerCase();
    if (name.includes('grape') || name.includes('apple') || name.includes('banana') || name.includes('lettuce') || name.includes('tomato') || name.includes('onion') || name.includes('pepper') || name.includes('fruit') || name.includes('vegetable')) {
      categories.produce++;
    } else if (name.includes('beef') || name.includes('chicken') || name.includes('pork') || name.includes('meat') || name.includes('steak') || name.includes('ground')) {
      categories.meat++;
    } else if (name.includes('deli') || name.includes('cheese') || name.includes('ham') || name.includes('turkey') || name.includes('salami')) {
      categories.deli++;
    } else if (name.includes('bread') || name.includes('cake') || name.includes('cookie') || name.includes('bakery') || name.includes('roll')) {
      categories.bakery++;
    } else if (name.includes('prepared') || name.includes('sushi') || name.includes('salad') || name.includes('soup')) {
      categories.prepared++;
    } else if (name.includes('store') || name.includes('generic') || name.includes('misc')) {
      categories.generic++;
    } else {
      categories.other++;
    }
  });
  
  console.log('Produce (fruits/vegetables):', categories.produce);
  console.log('Meat:', categories.meat);
  console.log('Deli:', categories.deli);
  console.log('Bakery:', categories.bakery);
  console.log('Prepared foods:', categories.prepared);
  console.log('Generic/Store items:', categories.generic);
  console.log('Other:', categories.other);
  
  await prisma.$disconnect();
}

main().catch(console.error);
