const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanupUnassigned(parentSlug, generalName) {
  const parent = await prisma.category.findUnique({ where: { slug: parentSlug } });
  if (!parent) return;
  
  // Get direct children that are leaf categories (no grandchildren)
  const children = await prisma.category.findMany({
    where: { parentId: parent.id },
    select: { id: true, name: true, slug: true }
  });
  
  const leafChildren = [];
  for (const child of children) {
    const grandchildren = await prisma.category.count({ where: { parentId: child.id } });
    if (grandchildren === 0) {
      leafChildren.push(child);
    }
  }
  
  if (leafChildren.length === 0) {
    console.log(parent.name + ': No unassigned leaves');
    return;
  }
  
  if (leafChildren.length <= 5) {
    console.log(parent.name + ': Only ' + leafChildren.length + ' unassigned (keeping)');
    return;
  }
  
  console.log(parent.name + ': Moving ' + leafChildren.length + ' to ' + generalName);
  
  const groupSlug = parentSlug + '-general';
  let group = await prisma.category.findUnique({ where: { slug: groupSlug } });
  
  if (!group) {
    group = await prisma.category.create({
      data: {
        name: generalName,
        slug: groupSlug,
        icon: parent.icon,
        parentId: parent.id,
        sortOrder: 999
      }
    });
  }
  
  await prisma.category.updateMany({
    where: { id: { in: leafChildren.map(c => c.id) } },
    data: { parentId: group.id }
  });
}

async function main() {
  console.log('=== CLEANUP UNASSIGNED ===\n');
  
  await cleanupUnassigned('health-and-wellness', 'Other Health');
  await cleanupUnassigned('personal-care', 'Other Personal Care');
  await cleanupUnassigned('baby-products', 'Other Baby Products');
  
  console.log('\n✅ Done!');
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
