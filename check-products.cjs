const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({
    take: 5,
    select: { id: true, name: true, sellerId: true }
  });
  console.log("Sample Products:");
  products.forEach(p => console.log("  ID:", p.id, "Seller:", p.sellerId, "Name:", p.name?.substring(0,40)));
  
  const sellers = await prisma.seller.findMany({
    take: 5,
    select: { id: true, storeName: true }
  });
  console.log("\nSellers:");
  sellers.forEach(s => console.log("  ID:", s.id, "Store:", s.storeName));
}

main().catch(console.error).finally(() => prisma.$disconnect());
