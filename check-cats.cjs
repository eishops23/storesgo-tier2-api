const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Get Personal Care and its subcategories
  const personalCare = await prisma.category.findFirst({
    where: { name: { contains: 'Personal Care' } }
  });
  
  console.log('Personal Care:', personalCare);
  
  if (personalCare) {
    const subcats = await prisma.category.findMany({
      where: { parentId: personalCare.id }
    });
    console.log('\nSubcategories:', subcats.length);
    subcats.forEach(c => {
      console.log('  ' + c.name + ' | icon: ' + (c.icon || 'NONE') + ' | emoji: ' + (c.emoji || 'NONE'));
    });
  }
  
  // Check product counts
  const activeCount = await prisma.product.count({ where: { isActive: true } });
  const inactiveCount = await prisma.product.count({ where: { isActive: false } });
  console.log('\nProducts - Active:', activeCount, '| Inactive:', inactiveCount);
  
  await prisma.$disconnect();
}
main();
