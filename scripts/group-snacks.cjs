const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const SNACK_GROUPS = {
  'Chips & Crisps': ['chip', 'crisp', 'tortilla', 'pita'],
  'Cookies & Crackers': ['cookie', 'cracker', 'biscuit', 'wafer'],
  'Candy & Chocolate': ['candy', 'chocolate', 'gum', 'mint', 'gummi', 'lollipop', 'licorice'],
  'Nuts & Seeds': ['nut', 'seed', 'almond', 'peanut', 'cashew', 'pistachio', 'trail'],
  'Popcorn & Pretzels': ['popcorn', 'pretzel', 'corn'],
  'Dried Fruit & Fruit Snacks': ['fruit', 'dried', 'raisin'],
  'Granola & Snack Bars': ['bar', 'granola', 'protein'],
  'Jerky & Meat Snacks': ['jerky', 'meat', 'beef', 'pork'],
  'International Snacks': ['asian', 'mexican', 'indian', 'ethnic', 'international'],
  'Dips & Spreads': ['dip', 'salsa', 'hummus', 'spread']
};

async function main() {
  console.log('=== GROUPING SNACKS ===\n');
  
  const snacks = await prisma.category.findUnique({ where: { slug: 'snacks' } });
  
  const children = await prisma.category.findMany({
    where: { parentId: snacks.id },
    select: { id: true, name: true, slug: true }
  });
  
  const assigned = new Set();
  
  for (const [groupName, keywords] of Object.entries(SNACK_GROUPS)) {
    const groupSlug = 'snacks-' + groupName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
    const matches = children.filter(c => {
      const text = (c.name + ' ' + c.slug).toLowerCase();
      return keywords.some(kw => text.includes(kw)) && !assigned.has(c.id);
    });
    
    if (matches.length === 0) continue;
    
    matches.forEach(m => assigned.add(m.id));
    
    let group = await prisma.category.findUnique({ where: { slug: groupSlug } });
    if (!group) {
      group = await prisma.category.create({
        data: { name: groupName, slug: groupSlug, icon: '🍿', parentId: snacks.id, sortOrder: 0 }
      });
    }
    
    await prisma.category.updateMany({
      where: { id: { in: matches.map(m => m.id) } },
      data: { parentId: group.id }
    });
    
    console.log(groupName + ': ' + matches.length + ' categories');
  }
  
  // Handle unassigned
  const unassigned = children.filter(c => !assigned.has(c.id));
  if (unassigned.length > 5) {
    let other = await prisma.category.findUnique({ where: { slug: 'snacks-other' } });
    if (!other) {
      other = await prisma.category.create({
        data: { name: 'Other Snacks', slug: 'snacks-other', icon: '🍿', parentId: snacks.id, sortOrder: 999 }
      });
    }
    await prisma.category.updateMany({
      where: { id: { in: unassigned.map(u => u.id) } },
      data: { parentId: other.id }
    });
    console.log('Other Snacks: ' + unassigned.length + ' categories');
  }
  
  // Final count
  const finalChildren = await prisma.category.findMany({ where: { parentId: snacks.id } });
  console.log('\nSnacks now has ' + finalChildren.length + ' subcategories');
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
