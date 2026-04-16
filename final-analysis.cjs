const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const missing = await prisma.product.findMany({
    where: { sourceImageUrl: { contains: 'missing-item' } },
    select: { id: true, name: true },
    take: 100
  });
  
  console.log('=== Sample of 100 remaining products without images ===\n');
  missing.forEach(p => console.log(p.name));
  
  // Categorize
  const cats = { storePrepared: 0, produce: 0, meat: 0, bakery: 0, branded: 0, other: 0 };
  
  const allMissing = await prisma.product.findMany({
    where: { sourceImageUrl: { contains: 'missing-item' } },
    select: { name: true }
  });
  
  allMissing.forEach(p => {
    const n = (p.name || '').toUpperCase();
    if (n.includes('STORE') || n.includes('PREPARED') || n.includes('DELI')) cats.storePrepared++;
    else if (n.includes('FRESH') || n.includes('ORGANIC') && (n.includes('APPLE') || n.includes('GRAPE') || n.includes('TOMATO'))) cats.produce++;
    else if (n.includes('CHICKEN') || n.includes('BEEF') || n.includes('PORK')) cats.meat++;
    else if (n.includes('BREAD') || n.includes('CAKE') || n.includes('MUFFIN') || n.includes('BAGEL')) cats.bakery++;
    else if (n.match(/^[A-Z][a-z]+\s/)) cats.branded++;
    else cats.other++;
  });
  
  console.log('\n=== Categories of missing ===');
  Object.entries(cats).forEach(([k,v]) => console.log(k + ': ' + v));
  
  await prisma.$disconnect();
}

main();
