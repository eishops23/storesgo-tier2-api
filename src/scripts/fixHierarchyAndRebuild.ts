import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixHierarchyAndRebuild() {
  console.log("=== FIXING CATEGORY HIERARCHY ===\n");
  
  const categories = await prisma.category.findMany({
    select: { id: true, name: true, slug: true, parentId: true }
  });
  
  const slugMap = new Map(categories.map(c => [c.slug, c]));
  const fixes: any[] = [];
  
  for (const cat of categories) {
    if (cat.parentId === null) continue;
    
    const slugParts = cat.slug.split("-");
    if (slugParts.length >= 3) {
      const expectedParentSlug = slugParts.slice(0, -1).join("-");
      const expectedParent = slugMap.get(expectedParentSlug);
      
      if (expectedParent && expectedParent.id !== cat.parentId) {
        fixes.push({
          id: cat.id,
          name: cat.name,
          oldParentId: cat.parentId,
          newParentId: expectedParent.id,
          newParentName: expectedParent.name
        });
      }
    }
  }
  
  console.log("Hierarchy fixes needed:", fixes.length);
  
  for (const fix of fixes) {
    await prisma.category.update({
      where: { id: fix.id },
      data: { parentId: fix.newParentId }
    });
  }
  console.log("Fixed", fixes.length, "parent relationships");
  
  console.log("\n=== REBUILDING ASSIGNMENTS ===\n");
  
  const fixedCategories = await prisma.category.findMany({
    select: { id: true, parentId: true, name: true }
  });
  const categoryMap = new Map(fixedCategories.map(c => [c.id, c]));
  
  function getCategoryChain(categoryId: number): number[] {
    const chain: number[] = [categoryId];
    let current = categoryMap.get(categoryId);
    while (current && current.parentId) {
      chain.push(current.parentId);
      current = categoryMap.get(current.parentId);
    }
    return chain;
  }
  
  const products = await prisma.product.findMany({
    where: { isActive: true, categoryId: { not: null } },
    select: { id: true, categoryId: true }
  });
  
  console.log("Products to assign:", products.length);
  
  const newAssignments: { productId: number; categoryId: number }[] = [];
  const seen = new Set<string>();
  
  for (const product of products) {
    if (product.categoryId === null) continue;
    const chain = getCategoryChain(product.categoryId);
    for (const catId of chain) {
      const key = product.id + "-" + catId;
      if (seen.has(key) === false) {
        seen.add(key);
        newAssignments.push({ productId: product.id, categoryId: catId });
      }
    }
  }
  
  console.log("Assignments to create:", newAssignments.length);
  
  await prisma.productCategoryAssignment.deleteMany({});
  console.log("Cleared old assignments");
  
  const BATCH = 5000;
  for (let i = 0; i < newAssignments.length; i += BATCH) {
    await prisma.productCategoryAssignment.createMany({
      data: newAssignments.slice(i, i + BATCH),
      skipDuplicates: true
    });
    console.log("  Inserted", Math.min(i + BATCH, newAssignments.length), "/", newAssignments.length);
  }
  
  console.log("\nCOMPLETE!\n");
  
  const coffeeCount = await prisma.productCategoryAssignment.count({ where: { categoryId: 2665 } });
  console.log("Coffee (2665) now has:", coffeeCount, "products");
  
  const topLevel = await prisma.$queryRaw<any[]>`
    SELECT c.name, COUNT(DISTINCT pca."productId") as products, COUNT(DISTINCT p."sellerId") as sellers
    FROM product_category_assignments pca
    JOIN categories c ON pca."categoryId" = c.id
    JOIN products p ON pca."productId" = p.id
    WHERE c."parentId" IS NULL
    GROUP BY c.id, c.name
    ORDER BY products DESC
  `;
  console.log("\nTop-level categories:");
  topLevel.forEach(r => console.log("  " + r.name + ": " + r.products + " products, " + r.sellers + " sellers"));
}

fixHierarchyAndRebuild().catch(console.error).finally(() => prisma.$disconnect());
