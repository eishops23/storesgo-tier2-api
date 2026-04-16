const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Define logical groupings for each category
const GROUPINGS = {
  'health-and-wellness': {
    'Cold & Flu': ['cold', 'flu', 'allergy', 'congestion', 'cough', 'nasal', 'throat', 'inhaler', 'sinus'],
    'Pain Relief': ['pain', 'fever', 'headache', 'muscle', 'joint', 'relief'],
    'Vitamins & Supplements': ['vitamin', 'supplement', 'mineral', 'antioxidant', 'amino', 'prenatal', 'immune', 'energy'],
    'Digestive Health': ['digestive', 'laxative', 'probiotic', 'prebiotic', 'fiber', 'heartburn', 'antidiarrheal', 'antigas'],
    'First Aid': ['first', 'aid', 'bandage', 'antiseptic', 'gauze', 'tape', 'cotton'],
    'Specialty Care': ['specialty', 'antifungal', 'wart', 'cold-sore', 'anti-itch', 'sleep'],
    'Foot Care': ['foot', 'insole'],
    'Health Supplies': ['thermometer', 'test', 'glove', 'mask', 'pill', 'heating', 'ice']
  },
  'personal-care': {
    'Hair Care': ['hair', 'shampoo', 'conditioner', 'styling'],
    'Skin Care': ['skin', 'lotion', 'moisturizer', 'face', 'cleanser', 'acne'],
    'Oral Care': ['oral', 'tooth', 'dental', 'mouth', 'floss'],
    'Body Care': ['body', 'soap', 'wash', 'deodorant', 'antiperspirant'],
    'Shaving': ['shav', 'razor', 'beard'],
    'Cosmetics': ['cosmetic', 'makeup', 'lip', 'nail', 'eye'],
    'Sun Care': ['sun', 'sunscreen', 'tanning']
  },
  'baby-products': {
    'Feeding': ['food', 'formula', 'bottle', 'feeding', 'drink'],
    'Diapering': ['diaper', 'wipe'],
    'Baby Care': ['bath', 'lotion', 'oil', 'powder', 'health'],
    'Gear & Safety': ['gear', 'safety', 'monitor', 'gate']
  }
};

async function smartRegroup(parentSlug, groupDefs) {
  const parent = await prisma.category.findUnique({ where: { slug: parentSlug } });
  if (!parent) return;
  
  const children = await prisma.category.findMany({
    where: { parentId: parent.id },
    select: { id: true, name: true, slug: true }
  });
  
  if (children.length <= 15) {
    console.log(parent.name + ': ' + children.length + ' (OK, skipping)');
    return;
  }
  
  console.log('\n' + parent.name + ': ' + children.length + ' subcategories');
  
  const assigned = new Set();
  
  for (const [groupName, keywords] of Object.entries(groupDefs)) {
    const groupSlug = parentSlug + '-' + groupName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
    // Find matching children
    const matches = children.filter(c => {
      const searchText = (c.name + ' ' + c.slug).toLowerCase();
      return keywords.some(kw => searchText.includes(kw)) && !assigned.has(c.id);
    });
    
    if (matches.length === 0) continue;
    
    matches.forEach(m => assigned.add(m.id));
    
    // Create group
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
    }
    
    // Move matches to group
    await prisma.category.updateMany({
      where: { id: { in: matches.map(m => m.id) } },
      data: { parentId: group.id }
    });
    
    console.log('  ' + groupName + ': ' + matches.length + ' categories');
  }
  
  // Check unassigned
  const unassigned = children.filter(c => !assigned.has(c.id));
  if (unassigned.length > 0) {
    console.log('  (Unassigned: ' + unassigned.length + ')');
  }
}

async function main() {
  console.log('=== SMART REGROUPING ===');
  
  for (const [slug, groups] of Object.entries(GROUPINGS)) {
    await smartRegroup(slug, groups);
  }
  
  console.log('\n✅ Done!');
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
