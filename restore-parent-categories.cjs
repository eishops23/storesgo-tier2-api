const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== Restoring Parent Categories ===\n');
  
  // Define parent-child relationships that should exist
  const parentChildMap = {
    'Baby Products': {
      'Baby Food & Drinks': ['Cereal', 'Purees & Pouches', 'Drinks', 'Meals', 'Nursery Water', 'Electrolytes'],
      'Diapers & Wipes': ['Diapers', 'Baby Wipes', 'Disposable Training Pants'],
      'Baby Bath': ['Body Wash & Soap', 'Bubble Bath', 'Bath Accessories', 'Shampoo & Conditioner'],
      'Baby Health Care': ['Baby Medicine', 'Thermometers', 'Nasal Aspirators'],
      'Bottles & Formula': ['Bottles', 'Formula', 'Sippy Cups']
    },
    'Snacks': {
      'Chips': [],
      'Chocolate & Candy': [],
      'Cookies & Sweet Treats': [],
      'Nuts & Trail Mix': [],
      'Popcorn & Pretzels': []
    }
  };
  
  for (const [topLevelName, parentGroups] of Object.entries(parentChildMap)) {
    const topLevel = await prisma.category.findFirst({
      where: { name: topLevelName, parentId: null }
    });
    
    if (!topLevel) {
      console.log('Top level not found:', topLevelName);
      continue;
    }
    
    for (const [parentName, childNames] of Object.entries(parentGroups)) {
      // Check if parent exists
      let parent = await prisma.category.findFirst({
        where: { name: parentName, parentId: topLevel.id }
      });
      
      // Create if doesn't exist
      if (!parent) {
        const slug = parentName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        parent = await prisma.category.create({
          data: {
            name: parentName,
            slug: slug,
            parentId: topLevel.id,
            icon: '📦'
          }
        });
        console.log('Created parent:', parentName);
      }
      
      // Move children under this parent
      if (childNames.length > 0) {
        for (const childName of childNames) {
          const child = await prisma.category.findFirst({
            where: { name: childName, parentId: topLevel.id }
          });
          
          if (child) {
            await prisma.category.update({
              where: { id: child.id },
              data: { parentId: parent.id }
            });
            console.log('  Moved', childName, 'under', parentName);
          }
        }
      }
    }
  }
  
  console.log('\nDone! Parent categories restored.');
  await prisma.$disconnect();
}
main();
