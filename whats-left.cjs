const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const missing = await prisma.product.findMany({
    where: { sourceImageUrl: { contains: 'missing-item' } },
    select: { id: true, name: true }
  });
  
  console.log('=== Remaining ' + missing.length + ' products without images ===\n');
  
  // Show all names to find patterns
  const words = {};
  missing.forEach(p => {
    const name = (p.name || '').toLowerCase();
    name.split(/\s+/).forEach(w => {
      if (w.length > 3) words[w] = (words[w] || 0) + 1;
    });
  });
  
  // Sort by frequency
  const sorted = Object.entries(words).sort((a,b) => b[1] - a[1]).slice(0, 50);
  console.log('Most common words in missing products:');
  sorted.forEach(([word, count]) => console.log('  ' + word + ': ' + count));
  
  console.log('\n=== Sample of 80 remaining ===');
  missing.slice(0, 80).forEach(p => console.log(p.name));
  
  await prisma.$disconnect();
}

main();
