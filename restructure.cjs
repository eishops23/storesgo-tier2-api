const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const groupings = {
  'Tea': ['Tea'],
  'Juice': ['Juice'],
  'Milk': ['Milk'],
  'Soda': ['Soda', 'Pop'],
  'Water': ['Water'],
};

async function restructure() {
  for (const [parentName, keywords] of Object.entries(groupings)) {
    const parent = await prisma.category.findFirst({
      where: { parentId: 128, name: parentName }
    });
    
    if (!parent) {
      console.log('Parent not found:', parentName);
      continue;
    }
    
    for (const keyword of keywords) {
      const related = await prisma.category.findMany({
        where: {
          parentId: 128,
          id: { not: parent.id },
          name: { contains: keyword, mode: 'insensitive' }
        }
      });
      
      for (const cat of related) {
        await prisma.category.update({
          where: { id: cat.id },
          data: { parentId: parent.id }
        });
        console.log('Moved', cat.name, 'under', parentName);
      }
    }
    
    const count = await prisma.category.count({ where: { parentId: parent.id } });
    console.log(parentName, 'now has', count, 'children');
  }
}

restructure().then(() => process.exit(0));
