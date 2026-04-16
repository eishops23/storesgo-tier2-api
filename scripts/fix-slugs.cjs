const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== FIXING CATEGORY SLUGS ===\n');
  
  const fixes = [
    { id: 9, oldSlug: 'baby-snacks', newSlug: 'snacks' },
    { id: 1265, oldSlug: 'baking-cooking', newSlug: 'baking-and-cooking' },
    { id: 1267, oldSlug: 'health-wellness', newSlug: 'health-and-wellness' },
  ];
  
  for (const fix of fixes) {
    const cat = await prisma.category.findUnique({ where: { id: fix.id } });
    if (cat && cat.slug === fix.oldSlug) {
      await prisma.category.update({
        where: { id: fix.id },
        data: { slug: fix.newSlug }
      });
      console.log(`✅ Fixed: ${cat.name} (${fix.oldSlug} → ${fix.newSlug})`);
    } else if (cat) {
      console.log(`⚠️  ${cat.name} already has slug: ${cat.slug}`);
    } else {
      console.log(`❌ Category ID ${fix.id} not found`);
    }
  }
  
  // Verify
  console.log('\n=== VERIFICATION ===');
  const mainSlugs = [
    'caribbean-foods', 'latin-foods', 'asian-foods', 'fragrances',
    'snacks', 'beverages', 'baking-and-cooking', 'household-essentials',
    'personal-care', 'health-and-wellness', 'baby-products', 'pet-supplies'
  ];
  
  for (const slug of mainSlugs) {
    const cat = await prisma.category.findUnique({ where: { slug } });
    console.log(`${slug}: ${cat ? '✅ ' + cat.name : '❌ MISSING'}`);
  }
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
