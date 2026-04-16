const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Mapping of prefix to display name
const GROUP_NAMES = {
  'frozen': 'Frozen',
  'canned': 'Canned Goods & Soups',
  'condiments': 'Condiments & Sauces',
  'baking': 'Baking Essentials',
  'meat': 'Meat & Seafood',
  'bakery': 'Bakery',
  'produce': 'Produce',
  'dairy': 'Dairy & Eggs',
  'dry': 'Dry Goods & Pasta',
  'breakfast': 'Breakfast',
  'oils': 'Oils, Vinegars & Spices',
  'catering': 'Catering'
};

async function regroupCategory(parentSlug, groupNames) {
  const parent = await prisma.category.findUnique({ where: { slug: parentSlug } });
  if (!parent) return;
  
  console.log('\nRegrouping: ' + parent.name);
  
  const children = await prisma.category.findMany({
    where: { parentId: parent.id },
    select: { id: true, name: true, slug: true }
  });
  
  // Group by prefix
  const groups = {};
  for (const child of children) {
    const prefix = child.slug.split('-')[0];
    if (!groups[prefix]) groups[prefix] = [];
    groups[prefix].push(child);
  }
  
  // Create intermediate categories and move children
  for (const [prefix, items] of Object.entries(groups)) {
    if (items.length < 2) continue; // Skip if only 1 item
    
    const groupName = groupNames[prefix] || prefix.charAt(0).toUpperCase() + prefix.slice(1);
    const groupSlug = parentSlug + '-' + prefix;
    
    // Check if group already exists
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
    
    // Move children under this group
    await prisma.category.updateMany({
      where: { id: { in: items.map(i => i.id) } },
      data: { parentId: group.id }
    });
  }
}

async function main() {
  console.log('=== REGROUPING FLAT CATEGORIES ===');
  
  // Baking & Cooking
  await regroupCategory('baking-and-cooking', GROUP_NAMES);
  
  console.log('\n✅ Done!');
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
