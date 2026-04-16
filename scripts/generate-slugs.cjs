const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function generateSlug(name, id) {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/['']/g, '')                    // Remove apostrophes
    .replace(/[^a-z0-9\s-]/g, '')            // Remove special chars
    .replace(/\s+/g, '-')                     // Spaces to hyphens
    .replace(/-+/g, '-')                      // Collapse multiple hyphens
    .replace(/^-|-$/g, '')                    // Trim leading/trailing hyphens
    .substring(0, 80);                        // Limit length for URLs
  
  return `${base}-${id}`;
}

async function main() {
  console.log('Generating slugs for all products...\n');
  
  // Get total count
  const total = await prisma.product.count();
  console.log(`Total products: ${total.toLocaleString()}`);
  
  // Process in batches of 1000 for performance
  const BATCH_SIZE = 1000;
  let processed = 0;
  let offset = 0;
  
  while (offset < total) {
    const products = await prisma.product.findMany({
      select: { id: true, name: true },
      skip: offset,
      take: BATCH_SIZE,
      orderBy: { id: 'asc' }
    });
    
    if (products.length === 0) break;
    
    // Build batch update
    const updates = products.map(p => 
      prisma.product.update({
        where: { id: p.id },
        data: { slug: generateSlug(p.name, p.id) }
      })
    );
    
    await prisma.$transaction(updates);
    
    processed += products.length;
    const pct = ((processed / total) * 100).toFixed(1);
    process.stdout.write(`\rProgress: ${processed.toLocaleString()} / ${total.toLocaleString()} (${pct}%)`);
    
    offset += BATCH_SIZE;
  }
  
  console.log('\n\n✅ Slug generation complete!');
  
  // Verify
  const sample = await prisma.product.findMany({
    select: { id: true, name: true, slug: true },
    take: 5
  });
  console.log('\nSample slugs:');
  sample.forEach(p => console.log(`  ${p.id}: ${p.slug}`));
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
