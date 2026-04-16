const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const baby = await prisma.category.findFirst({
    where: { name: 'Baby', parentId: null }
  });
  console.log('Baby parent:', baby);
  
  if (baby) {
    const subcats = await prisma.category.findMany({
      where: { parentId: baby.id }
    });
    console.log('\nSubcategories under Baby:', subcats.length);
    subcats.forEach(c => console.log('  - ' + c.name));
  }
  
  // Check all Baby-related categories
  const allBaby = await prisma.category.findMany({
    where: { name: { contains: 'Baby' } }
  });
  console.log('\nAll "Baby" categories:');
  allBaby.forEach(c => console.log('  id:' + c.id + ' | ' + c.name + ' | parent:' + c.parentId));
  
  await prisma.$disconnect();
}
main();
