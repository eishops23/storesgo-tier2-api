const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function flattenSingleChildGroups(parentSlug) {
  const parent = await prisma.category.findUnique({ where: { slug: parentSlug } });
  if (!parent) return;
  
  const children = await prisma.category.findMany({
    where: { parentId: parent.id },
    select: { id: true, name: true, slug: true }
  });
  
  console.log(parent.name + ': ' + children.length + ' direct children');
  
  // If only 1-2 children, flatten them
  if (children.length <= 2) {
    for (const child of children) {
      // Move grandchildren up
      const moved = await prisma.category.updateMany({
        where: { parentId: child.id },
        data: { parentId: parent.id }
      });
      
      if (moved.count > 0) {
        console.log('  Flattened: ' + child.name + ' (' + moved.count + ' items moved up)');
        // Delete the now-empty intermediate
        const remaining = await prisma.category.count({ where: { parentId: child.id } });
        const products = await prisma.product.count({ where: { categoryId: child.id } });
        if (remaining === 0 && products === 0) {
          await prisma.category.delete({ where: { id: child.id } });
          console.log('  Deleted empty: ' + child.name);
        }
      }
    }
  }
}

async function main() {
  console.log('=== FIXING BAD GROUPINGS ===\n');
  
  await flattenSingleChildGroups('personal-care');
  await flattenSingleChildGroups('health-and-wellness');
  await flattenSingleChildGroups('baby-products');
  
  console.log('\n✅ Done!');
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
