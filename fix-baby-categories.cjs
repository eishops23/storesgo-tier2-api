const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== Fixing Baby Categories ===\n');
  
  // 1. Delete empty categories (0 products, no children)
  const emptyCategories = await prisma.category.findMany({
    where: {
      NOT: { products: { some: { isActive: true } } }
    }
  });
  
  let deleted = 0;
  for (const cat of emptyCategories) {
    const childCount = await prisma.category.count({ where: { parentId: cat.id } });
    if (childCount === 0) {
      try {
        await prisma.category.delete({ where: { id: cat.id } });
        console.log('Deleted empty: ' + cat.name);
        deleted++;
      } catch (e) { }
    }
  }
  console.log('Deleted', deleted, 'empty categories');
  
  // 2. Fix wrong icons
  const fixes = [
    ['Shampoo & Conditioner', '🧴'], ['Meals', '🍽️'], ['Electrolytes', '💧'],
    ['Pacifiers & Teething', '🍼'], ['Nasal Aspirators', '👃'], ['Purees & Pouches', '🥣'],
    ['Disposable Training Pants', '🩲'], ['Thermometers', '🌡️'], ['Sippy Cups', '🥤'],
    ['Baby Health Care', '💊'], ['Baby Medicine', '💊'], ['Baby Wipes', '🧻'],
    ['Baby Powders', '🧴'], ['Baby Toys', '🧸']
  ];
  
  for (const [name, icon] of fixes) {
    await prisma.category.updateMany({ where: { name }, data: { icon } });
  }
  console.log('Fixed specific icons');
  
  await prisma.$disconnect();
}
main();
