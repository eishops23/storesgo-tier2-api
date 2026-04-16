const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function restructure() {
  // Soft Drinks (166) groups sodas
  // Water & Sparkling Water (172) groups waters
  // Energy Drinks (139) groups energy shots
  // Mixers & Non-Alcoholic Drinks (156) groups cocktail items

  const moves = [
    // Waters under "Water & Sparkling Water" (172)
    { from: 173, to: 172, name: 'Bottled Water' },
    { from: 174, to: 172, name: 'Flavored Water' },
    { from: 175, to: 172, name: 'Sparkling Water' },
    { from: 142, to: 172, name: 'Coconut Water' },
    { from: 163, to: 172, name: 'Tonic Water' },
    { from: 1072, to: 172, name: 'Water Enhancers' },
    
    // Energy under "Energy Drinks" (139)
    { from: 140, to: 139, name: 'Energy Shots' },
    { from: 1071, to: 139, name: 'Powdered Energy Drinks' },
    
    // Cocktail items under "Mixers & Non-Alcoholic Drinks" (156)
    { from: 157, to: 156, name: 'Cocktail Mixers' },
    { from: 158, to: 156, name: 'Cocktail Rimmers' },
    { from: 159, to: 156, name: 'Cocktail Syrups' },
    { from: 160, to: 156, name: 'Ginger Beer' },
    { from: 161, to: 156, name: 'Non-Alcoholic Beer' },
    { from: 162, to: 156, name: 'Non-Alcoholic Wine' },
    { from: 980, to: 156, name: 'Non-Alcoholic Spirits' },
    
    // Drink Mixes consolidation under "Drink Mixes" (136)
    { from: 138, to: 136, name: 'Powdered Drink Mixes' },
    { from: 137, to: 136, name: 'Cocoa Mix' },
  ];

  for (const move of moves) {
    try {
      await prisma.category.update({
        where: { id: move.from },
        data: { parentId: move.to }
      });
      console.log('Moved', move.name, 'under parent', move.to);
    } catch (e) {
      console.log('Error moving', move.name, e.message);
    }
  }

  // Count final structure
  const remaining = await prisma.category.findMany({
    where: { parentId: 128 },
    select: { id: true, name: true }
  });
  console.log('\nBeverages now has', remaining.length, 'direct children:');
  remaining.forEach(c => console.log(' -', c.name));
}

restructure().then(() => process.exit(0));
