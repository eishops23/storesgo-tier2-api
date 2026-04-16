const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== UNDOING KEYWORD MATCHING ===\n');
  
  // Find General* categories created by keyword matching
  const generalCats = await prisma.category.findMany({
    where: { 
      slug: { in: [
        'caribbean-foods-general',
        'latin-foods-general', 
        'asian-foods-general',
        'fragrances-general'
      ]}
    },
    select: { id: true, name: true, slug: true }
  });
  
  for (const cat of generalCats) {
    // Get products in this category
    const products = await prisma.product.findMany({
      where: { categoryId: cat.id },
      select: { id: true, name: true }
    });
    
    console.log(cat.name + ': ' + products.length + ' products to restore');
    
    // These products were moved from their ORIGINAL categories
    // We need to find a reasonable fallback - put in Household Essentials for now
    // Then AI will properly categorize them
    
    // Get Household Essentials
    const household = await prisma.category.findFirst({ 
      where: { slug: 'household-essentials' }
    });
    
    // Actually better - check if product name suggests original category
    // For now, mark them for AI categorization by setting categoryId to null
    // Then AI service will pick them up
    
    await prisma.product.updateMany({
      where: { categoryId: cat.id },
      data: { categoryId: null, aiEnrichmentStatus: 'pending' }
    });
    
    console.log('  Marked for AI categorization');
    
    // Delete the General category
    await prisma.category.delete({ where: { id: cat.id } });
    console.log('  Deleted ' + cat.name);
  }
  
  // Check products without category
  const uncategorized = await prisma.product.count({ where: { categoryId: null } });
  console.log('\nProducts pending AI categorization: ' + uncategorized);
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
