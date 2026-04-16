import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function rebuildCategoryAssignments(dryRun: boolean) {
  console.log("\n" + "=".repeat(60));
  console.log("REBUILD PRODUCT_CATEGORY_ASSIGNMENTS");
  console.log("Mode: " + (dryRun ? "DRY RUN" : "LIVE EXECUTION"));
  console.log("=".repeat(60) + "\n");

  const totalProducts = await prisma.product.count({ where: { isActive: true } });
  const productsWithCategoryId = await prisma.product.count({ 
    where: { isActive: true, categoryId: { not: null } } 
  });
  const currentAssignments = await prisma.productCategoryAssignment.count();
  
  console.log("Total active products: " + totalProducts.toLocaleString());
  console.log("Products with category_id: " + productsWithCategoryId.toLocaleString());
  console.log("Current assignments in table: " + currentAssignments.toLocaleString());
  
  const garbageSample = await prisma.$queryRaw<any[]>`
    SELECT c.name as assigned_category, p.name as product_name, c2.name as actual_category
    FROM product_category_assignments pca
    JOIN products p ON pca."productId" = p.id
    JOIN categories c ON pca."categoryId" = c.id
    JOIN categories c2 ON p."category_id" = c2.id
    WHERE c.id != p."category_id" LIMIT 10
  `;
  
  console.log("\nProducts assigned to WRONG categories:");
  for (const row of garbageSample) {
    console.log("  X " + row.product_name.substring(0, 40) + "... in " + row.assigned_category + " (should be " + row.actual_category + ")");
  }
  
  const products = await prisma.product.findMany({
    where: { isActive: true, categoryId: { not: null } },
    select: { id: true, categoryId: true }
  });
  
  console.log("\nFound " + products.length.toLocaleString() + " products to assign");
  
  const categories = await prisma.category.findMany({
    select: { id: true, parentId: true, name: true }
  });
  
  const categoryMap = new Map(categories.map(c => [c.id, c]));
  
  function getCategoryChain(categoryId: number): number[] {
    const chain: number[] = [categoryId];
    let current = categoryMap.get(categoryId);
    while (current?.parentId) {
      chain.push(current.parentId);
      current = categoryMap.get(current.parentId);
    }
    return chain;
  }
  
  const newAssignments: { productId: number; categoryId: number }[] = [];
  const assignmentSet = new Set<string>();
  
  for (const product of products) {
    if (!product.categoryId) continue;
    const categoryChain = getCategoryChain(product.categoryId);
    for (const catId of categoryChain) {
      const key = product.id + "-" + catId;
      if (!assignmentSet.has(key)) {
        assignmentSet.add(key);
        newAssignments.push({ productId: product.id, categoryId: catId });
      }
    }
  }
  
  console.log("New assignments to create: " + newAssignments.length.toLocaleString());
  
  const distribution: { [key: string]: number } = {};
  for (const assignment of newAssignments) {
    const cat = categoryMap.get(assignment.categoryId);
    if (cat && !cat.parentId) {
      distribution[cat.name] = (distribution[cat.name] || 0) + 1;
    }
  }
  
  console.log("\nDistribution by top category:");
  for (const [name, count] of Object.entries(distribution).sort((a, b) => b[1] - a[1])) {
    console.log("  " + name + ": " + count.toLocaleString() + " products");
  }
  
  if (dryRun) {
    console.log("\n--- DRY RUN COMPLETE ---");
    console.log("To execute: npx tsx src/scripts/rebuildCategoryAssignments.ts --run\n");
  } else {
    console.log("\n--- EXECUTING REBUILD ---\n");
    
    await prisma.productCategoryAssignment.deleteMany({});
    console.log("Cleared existing assignments");
    
    const BATCH_SIZE = 5000;
    for (let i = 0; i < newAssignments.length; i += BATCH_SIZE) {
      const batch = newAssignments.slice(i, i + BATCH_SIZE);
      await prisma.productCategoryAssignment.createMany({ data: batch, skipDuplicates: true });
      console.log("  Inserted " + Math.min(i + BATCH_SIZE, newAssignments.length).toLocaleString() + " / " + newAssignments.length.toLocaleString());
    }
    
    console.log("\nREBUILD COMPLETE!\n");
    
    const verifySample = await prisma.$queryRaw<any[]>`
      SELECT c.name as category, COUNT(DISTINCT pca."productId") as product_count,
             COUNT(DISTINCT p."sellerId") as seller_count
      FROM product_category_assignments pca
      JOIN categories c ON pca."categoryId" = c.id
      JOIN products p ON pca."productId" = p.id
      WHERE c."parentId" IS NULL
      GROUP BY c.id, c.name ORDER BY product_count DESC
    `;
    
    console.log("Verification - products per top category:");
    for (const row of verifySample) {
      console.log("  " + row.category + ": " + Number(row.product_count).toLocaleString() + " products from " + row.seller_count + " sellers");
    }
  }
  
  await prisma.$disconnect();
}

const dryRun = process.argv.includes("--dry-run");
const run = process.argv.includes("--run");

if (!dryRun && !run) {
  console.log("Usage:");
  console.log("  npx tsx src/scripts/rebuildCategoryAssignments.ts --dry-run");
  console.log("  npx tsx src/scripts/rebuildCategoryAssignments.ts --run");
  process.exit(1);
}

rebuildCategoryAssignments(dryRun).catch(e => { console.error("Error:", e); process.exit(1); });
