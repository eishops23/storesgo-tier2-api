const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Check Personal Care subcategories
  const personalCare = await prisma.category.findFirst({
    where: { name: { contains: 'Personal Care' } },
    include: { 
      children: {
        include: {
          _count: { select: { products: true } }
        }
      }
    }
  });
  
  console.log('=== Personal Care Subcategories ===');
  if (personalCare?.children) {
    personalCare.children.forEach(c => {
      console.log(c.name + ': ' + c._count.products + ' products | icon: ' + (c.icon || 'NONE'));
    });
  }
  
  // Check total active products
  const activeCount = await prisma.product.count({ where: { isActive: true } });
  const inactiveCount = await prisma.product.count({ where: { isActive: false } });
  
  console.log('\n=== Product Status ===');
  console.log('Active:', activeCount);
  console.log('Inactive:', inactiveCount);
  
  // Check if products are properly assigned to categories
  const noCategory = await prisma.product.count({ where: { isActive: true, categoryId: null } });
  console.log('Active without category:', noCategory);
  
  await prisma.$disconnect();
}
main();
