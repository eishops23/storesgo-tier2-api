const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== ANALYZING CATEGORIES FOR REGROUPING ===\n');
  
  const bc = await prisma.category.findUnique({ where: { slug: 'baking-and-cooking' } });
  
  const children = await prisma.category.findMany({
    where: { parentId: bc.id },
    select: { id: true, name: true, slug: true }
  });
  
  console.log('Total subcategories:', children.length);
  
  // Group by slug prefix
  const groups = {};
  for (const child of children) {
    const parts = child.slug.split('-');
    const group = parts[0];
    
    if (!groups[group]) groups[group] = [];
    groups[group].push({ id: child.id, name: child.name, slug: child.slug });
  }
  
  console.log('\nDetected groups (sorted by size):');
  const sorted = Object.entries(groups).sort((a, b) => b[1].length - a[1].length);
  
  for (const [name, items] of sorted.slice(0, 20)) {
    console.log('  ' + name + ': ' + items.length + ' categories');
  }
  
  console.log('\nTotal unique prefixes:', Object.keys(groups).length);
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
