const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function extractKeywords(name, slug) {
  const combined = `${name} ${slug}`.toLowerCase();
  const words = combined
    .replace(/[-_]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2)
    .filter(w => !['and', 'the', 'for', 'with', 'more', 'other', 'general'].includes(w));
  return [...new Set(words)];
}

async function main() {
  console.log("=== REASSIGNING ORPHANED PRODUCTS ===\n");
  
  // Get all parent IDs
  const childCategories = await prisma.category.findMany({
    where: { parentId: { not: null } },
    select: { parentId: true },
    distinct: ["parentId"]
  });
  
  const parentIds = [...new Set(childCategories.map(c => c.parentId).filter(Boolean))];
  
  const parents = await prisma.category.findMany({
    where: { id: { in: parentIds } },
    select: { id: true, name: true, slug: true, icon: true }
  });
  
  // Build subcategory cache
  const subcatCache = new Map();
  const allSubcats = await prisma.category.findMany({
    where: { parentId: { not: null } },
    select: { id: true, name: true, slug: true, parentId: true }
  });
  
  for (const sc of allSubcats) {
    if (!subcatCache.has(sc.parentId)) subcatCache.set(sc.parentId, []);
    const keywords = await extractKeywords(sc.name, sc.slug);
    subcatCache.get(sc.parentId).push({ id: sc.id, name: sc.name, keywords });
  }
  
  let totalMoved = 0;
  let toGeneral = 0;
  
  for (const parent of parents) {
    const products = await prisma.product.findMany({
      where: { categoryId: parent.id },
      select: { id: true, name: true, description: true }
    });
    
    if (products.length === 0) continue;
    
    console.log(`${parent.name}: ${products.length} direct products`);
    
    const subcategories = subcatCache.get(parent.id) || [];
    
    for (const product of products) {
      const searchText = `${product.name} ${product.description || ''}`.toLowerCase();
      
      let bestMatch = null;
      let bestScore = 0;
      
      for (const subcat of subcategories) {
        let score = 0;
        for (const kw of subcat.keywords) {
          if (searchText.includes(kw)) {
            score += kw.length;
            if (product.name.toLowerCase().includes(kw)) score += 5;
          }
        }
        if (score > bestScore) {
          bestScore = score;
          bestMatch = subcat;
        }
      }
      
      if (bestMatch && bestScore >= 3) {
        await prisma.product.update({
          where: { id: product.id },
          data: { categoryId: bestMatch.id }
        });
        totalMoved++;
      } else {
        // Create/get General subcategory
        const generalSlug = `${parent.slug}-general`;
        let general = await prisma.category.findUnique({ where: { slug: generalSlug } });
        if (!general) {
          general = await prisma.category.create({
            data: {
              name: `General ${parent.name}`,
              slug: generalSlug,
              icon: parent.icon,
              tagline: `More ${parent.name.toLowerCase()} products`,
              parentId: parent.id,
              sortOrder: 999
            }
          });
          console.log(`  Created: ${general.name}`);
        }
        await prisma.product.update({
          where: { id: product.id },
          data: { categoryId: general.id }
        });
        toGeneral++;
      }
    }
  }
  
  console.log("\n=== RESULTS ===");
  console.log("Reassigned to matching subcategory:", totalMoved);
  console.log("Moved to General subcategory:", toGeneral);
  
  // Verify
  console.log("\n=== VERIFICATION ===");
  for (const parent of parents) {
    const remaining = await prisma.product.count({ where: { categoryId: parent.id } });
    if (remaining > 0) {
      console.log(`❌ ${parent.name} still has ${remaining} direct products`);
    }
  }
  console.log("✅ Done");
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
