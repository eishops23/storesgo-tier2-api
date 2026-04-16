const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const ETHNIC_KEYWORDS = {
  'caribbean-foods': [
    'jamaican', 'caribbean', 'jerk', 'plantain', 'ackee', 'callaloo', 
    'scotch bonnet', 'grace', 'walkerswood', 'island', 'tropical',
    'goya', 'la fe', 'badia', 'iberia', 'conchita'
  ],
  'latin-foods': [
    'mexican', 'latino', 'latina', 'hispanic', 'taco', 'tortilla', 
    'salsa', 'chile', 'jalapeno', 'tamale', 'enchilada', 'burrito',
    'goya', 'la costena', 'jumex', 'bimbo', 'maseca', 'adobo'
  ],
  'asian-foods': [
    'asian', 'chinese', 'japanese', 'korean', 'thai', 'vietnamese',
    'soy sauce', 'teriyaki', 'sriracha', 'ramen', 'noodle', 'rice paper',
    'kikkoman', 'lee kum kee', 'huy fong', 'nongshim'
  ],
  'fragrances': [
    'perfume', 'cologne', 'fragrance', 'eau de', 'parfum', 'body spray',
    'body mist', 'scented oil'
  ]
};

async function main() {
  console.log('=== POPULATING ETHNIC CATEGORIES ===\n');
  
  for (const [slug, keywords] of Object.entries(ETHNIC_KEYWORDS)) {
    const category = await prisma.category.findFirst({ where: { slug } });
    if (!category) {
      console.log('Category not found: ' + slug);
      continue;
    }
    
    console.log('\n' + category.name + ':');
    
    // Build OR conditions for keywords
    const orConditions = keywords.map(kw => ({
      OR: [
        { name: { contains: kw, mode: 'insensitive' } },
        { description: { contains: kw, mode: 'insensitive' } }
      ]
    }));
    
    // Find matching products
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        OR: orConditions.map(c => c.OR).flat()
      },
      select: { id: true, name: true, categoryId: true }
    });
    
    console.log('  Found ' + products.length + ' matching products');
    
    if (products.length > 0) {
      // Get or create subcategory for these products
      let subcat = await prisma.category.findFirst({
        where: { slug: slug + '-general' }
      });
      
      if (!subcat) {
        subcat = await prisma.category.create({
          data: {
            name: 'General ' + category.name,
            slug: slug + '-general',
            icon: category.icon,
            parentId: category.id,
            sortOrder: 999
          }
        });
      }
      
      // Move products
      const updated = await prisma.product.updateMany({
        where: { id: { in: products.map(p => p.id) } },
        data: { categoryId: subcat.id }
      });
      
      console.log('  Moved ' + updated.count + ' products to ' + subcat.name);
    }
  }
  
  console.log('\n✅ Done!');
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
