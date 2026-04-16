const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // 1. FIX ALL REMAINING FOLDER ICONS
  console.log('=== Fixing ALL remaining folder icons ===\n');
  
  const folders = await prisma.category.findMany({
    where: { icon: '📂' }
  });
  
  console.log('Categories with folder icon:', folders.length);
  
  // Default icons by keyword
  const iconMap = {
    'bottle': '🍼', 'formula': '🍼', 'diaper': '👶', 'wipe': '🧻',
    'food': '🍽️', 'drink': '🥤', 'snack': '🍿', 'candy': '🍬',
    'medicine': '💊', 'health': '💊', 'vitamin': '💊',
    'bath': '🛁', 'soap': '🧼', 'wash': '🧴', 'lotion': '🧴',
    'toy': '🧸', 'powder': '🧴', 'cream': '🧴',
    'pet': '🐾', 'dog': '🐕', 'cat': '🐱',
    'clean': '🧹', 'laundry': '🧺', 'dish': '🍽️',
    'paper': '🧻', 'trash': '🗑️', 'storage': '📦',
    'fruit': '🍎', 'vegetable': '🥦', 'meat': '🥩', 'seafood': '🦐',
    'dairy': '🥛', 'cheese': '🧀', 'egg': '🥚', 'milk': '🥛',
    'bread': '🍞', 'bakery': '🥖', 'cake': '🎂',
    'frozen': '🧊', 'ice cream': '🍦',
    'coffee': '☕', 'tea': '🍵', 'juice': '🧃', 'water': '💧', 'soda': '🥤',
    'beer': '🍺', 'wine': '🍷', 'spirit': '🥃',
    'chip': '🥔', 'cookie': '🍪', 'cracker': '🥨',
    'cereal': '🥣', 'pasta': '🍝', 'rice': '🍚', 'bean': '🫘',
    'sauce': '🥫', 'soup': '🍲', 'can': '🥫',
    'spice': '🌿', 'herb': '🌿', 'oil': '🫒',
    'baby': '👶', 'infant': '👶', 'toddler': '🧒',
    'hair': '💇', 'skin': '✨', 'face': '😊', 'oral': '🦷', 'dental': '🦷',
    'shave': '🪒', 'razor': '🪒', 'feminine': '🌸', 'makeup': '💄',
    'asian': '🍜', 'latin': '🌮', 'mexican': '🌮', 'caribbean': '🏝️',
    'italian': '🍝', 'indian': '🍛', 'chinese': '🥡',
    'organic': '🌱', 'natural': '🌿', 'gluten': '🌾', 'vegan': '🥗'
  };
  
  for (const cat of folders) {
    let newIcon = '📦'; // default
    const nameLower = cat.name.toLowerCase();
    
    for (const [keyword, icon] of Object.entries(iconMap)) {
      if (nameLower.includes(keyword)) {
        newIcon = icon;
        break;
      }
    }
    
    await prisma.category.update({
      where: { id: cat.id },
      data: { icon: newIcon }
    });
  }
  
  const remainingFolders = await prisma.category.count({ where: { icon: '📂' } });
  console.log('Updated', folders.length, 'icons');
  console.log('Remaining folder icons:', remainingFolders);
  
  // 2. CHECK PRODUCT COUNT ISSUE
  console.log('\n=== Investigating Product Counts ===\n');
  
  const babyProducts = await prisma.category.findFirst({
    where: { name: 'Baby Products', parentId: null }
  });
  
  if (babyProducts) {
    // Products directly in Baby Products (not in subcategory)
    const directProducts = await prisma.product.count({
      where: { categoryId: babyProducts.id, isActive: true }
    });
    
    // Get all subcategory IDs
    const subcats = await prisma.category.findMany({
      where: { parentId: babyProducts.id }
    });
    
    const subcatIds = subcats.map(s => s.id);
    
    // Products in subcategories
    const subcatProducts = await prisma.product.count({
      where: { categoryId: { in: subcatIds }, isActive: true }
    });
    
    // Get deeper nested categories (sub-subcategories)
    const subSubcats = await prisma.category.findMany({
      where: { parentId: { in: subcatIds } }
    });
    
    const subSubcatIds = subSubcats.map(s => s.id);
    const subSubcatProducts = await prisma.product.count({
      where: { categoryId: { in: subSubcatIds }, isActive: true }
    });
    
    console.log('Baby Products breakdown:');
    console.log('  Direct in parent:', directProducts);
    console.log('  In subcategories:', subcatProducts);
    console.log('  In sub-subcategories:', subSubcatProducts);
    console.log('  Total:', directProducts + subcatProducts + subSubcatProducts);
    
    // Show subcategory counts
    console.log('\nSubcategory product counts:');
    for (const sub of subcats) {
      const count = await prisma.product.count({
        where: { categoryId: sub.id, isActive: true }
      });
      if (count > 0) {
        console.log('  ' + sub.name + ': ' + count);
      }
    }
  }
  
  await prisma.$disconnect();
}
main();
