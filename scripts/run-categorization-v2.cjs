const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function categorize() {
  const AUTO = 0.8, REVIEW = 0.5;
  
  // Load all categories with parent relationships
  const allCats = await prisma.category.findMany();
  const catById = {};
  allCats.forEach(c => { catById[c.id] = c; });
  
  // Build function to get category chain (child -> parent -> grandparent)
  function getCategoryChain(catId) {
    const chain = [];
    let current = catById[catId];
    while (current) {
      chain.push(current.name.toLowerCase());
      current = current.parentId ? catById[current.parentId] : null;
    }
    return chain;
  }

  const rules = await prisma.categoryMapping.findMany({ where: { isActive: true }, orderBy: { priority: 'desc' } });
  console.log('Loaded', rules.length, 'rules');
  
  const mainCats = await prisma.category.findMany({ where: { parentId: null } });
  const catMap = {};
  mainCats.forEach(c => { catMap[c.slug] = c.id; });
  console.log('Loaded', mainCats.length, 'main categories');

  const products = await prisma.product.findMany({
    select: { id: true, name: true, description: true, categoryId: true }
  });
  console.log('Processing', products.length, 'products...\n');

  let stats = { processed: 0, assigned: 0, pending: 0, skipped: 0 };

  for (const p of products) {
    stats.processed++;
    const text = (p.name + ' ' + (p.description || '')).toLowerCase();
    const catChain = p.categoryId ? getCategoryChain(p.categoryId) : [];
    
    let bestMatch = null;
    for (const rule of rules) {
      const val = rule.matchValue.toLowerCase();
      let matched = false;
      
      if (rule.matchType === 'keyword') matched = text.includes(val);
      else if (rule.matchType === 'brand') matched = text.includes(val);
      else if (rule.matchType === 'category_name') {
        // Check if ANY category in the chain matches
        matched = catChain.includes(val);
      }
      
      if (matched && catMap[rule.targetCategory]) {
        const conf = rule.priority / 100;
        if (bestMatch === null || conf > bestMatch.conf) {
          bestMatch = { catId: catMap[rule.targetCategory], conf, slug: rule.targetCategory };
        }
      }
    }

    if (bestMatch === null) { stats.skipped++; continue; }

    const status = bestMatch.conf >= AUTO ? 'auto' : bestMatch.conf >= REVIEW ? 'pending_review' : null;
    if (status === null) { stats.skipped++; continue; }

    try {
      await prisma.productCategoryAssignment.upsert({
        where: { productId_categoryId: { productId: p.id, categoryId: bestMatch.catId } },
        create: { productId: p.id, categoryId: bestMatch.catId, confidence: bestMatch.conf, isPrimary: true, assignedBy: 'system', reviewStatus: status },
        update: { confidence: bestMatch.conf, reviewStatus: status }
      });
      if (status === 'auto') stats.assigned++; else stats.pending++;
    } catch (e) {}
    
    if (stats.processed % 5000 === 0) console.log('Processed:', stats.processed);
  }

  console.log('\n=== CATEGORIZATION RESULTS ===');
  console.log('Processed:', stats.processed);
  console.log('Auto-assigned:', stats.assigned);
  console.log('Pending review:', stats.pending);
  console.log('Skipped:', stats.skipped);

  const byCategory = await prisma.productCategoryAssignment.groupBy({
    by: ['categoryId'], _count: true
  });
  const cats = await prisma.category.findMany({ where: { id: { in: byCategory.map(b => b.categoryId) } } });
  console.log('\n=== BY CATEGORY ===');
  byCategory.sort((a, b) => b._count - a._count).forEach(b => {
    const c = cats.find(x => x.id === b.categoryId);
    console.log(c?.icon, c?.name + ':', b._count);
  });

  await prisma.$disconnect();
}

categorize().catch(e => { console.error(e); process.exit(1); });
