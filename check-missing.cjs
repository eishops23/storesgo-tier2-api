const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const total = await prisma.product.count();
  const missing = await prisma.product.count({ 
    where: { sourceImageUrl: { contains: 'missing-item' } } 
  });
  const hasReal = await prisma.product.count({ 
    where: { 
      sourceImageUrl: { not: null },
      NOT: { sourceImageUrl: { contains: 'missing-item' } }
    } 
  });
  
  console.log('Total products:', total);
  console.log('With missing-item placeholder:', missing);
  console.log('With real image URLs:', hasReal);
  
  // Show a sample real URL
  const realProduct = await prisma.product.findFirst({
    where: { 
      sourceImageUrl: { not: null },
      NOT: { sourceImageUrl: { contains: 'missing-item' } }
    },
    select: { id: true, name: true, sourceImageUrl: true }
  });
  console.log('\nSample real product:', realProduct);
}

main().finally(() => prisma.$disconnect());
