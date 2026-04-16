const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analyzeAndRegroup(parentSlug) {
  const parent = await prisma.category.findUnique({ where: { slug: parentSlug } });
  if (!parent) return;
  
  const children = await prisma.category.findMany({
    where: { parentId: parent.id },
    select: { id: true, name: true, slug: true }
  });
  
  if (children.length <= 20) {
    console.log(parent.name + ': ' + children.length + ' subcategories (OK)');
    return;
  }
  
  console.log('\n' + parent.name + ': ' + children.length + ' subcategories - REGROUPING');
  
  // Group by first word of slug
  const groups = {};
  for (const child of children) {
    const prefix = child.slug.split('-')[0];
    if (!groups[prefix]) groups[prefix] = [];
    groups[prefix].push(child);
  }
  
  // Create intermediate categories for groups with 2+ items
  for (const [prefix, items] of Object.entries(groups)) {
    if (items.length < 2) continue;
    
    const groupName = prefix.charAt(0).toUpperCase() + prefix.slice(1);
    const groupSlug = parentSlug + '-' + prefix;
    
    let group = await prisma.category.findUnique({ where: { slug: groupSlug } });
    
    if (!group) {
      group = await prisma.category.create({
        data: {
          name: groupName,
          slug: groupSlug,
          icon: parent.icon,
          parentId: parent.id,
          sortOrder: 0
        }
      });
      console.log('  Created: ' + groupName + ' (' + items.length + ' items)');
    }
    
    await prisma.category.updateMany({
      where: { id: { in: items.map(i => i.id) } },
      data: { parentId: group.id }
    });
  }
}

async function main() {
  console.log('=== REGROUPING ALL FLAT CATEGORIES ===\n');
  
  await analyzeAndRegroup('snacks');
  await analyzeAndRegroup('beverages');
  await analyzeAndRegroup('household-essentials');
  await analyzeAndRegroup('personal-care');
  await analyzeAndRegroup('health-and-wellness');
  await analyzeAndRegroup('baby-products');
  await analyzeAndRegroup('pet-supplies');
  
  console.log('\n✅ Done!');
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
