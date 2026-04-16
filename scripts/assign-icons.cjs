const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Keyword to icon mapping
const ICON_RULES = [
  // Food & Drinks
  { keywords: ['coffee'], icon: '☕' },
  { keywords: ['tea'], icon: '🍵' },
  { keywords: ['juice', 'smoothie'], icon: '🧃' },
  { keywords: ['soda', 'soft drink', 'cola'], icon: '🥤' },
  { keywords: ['water'], icon: '💧' },
  { keywords: ['milk', 'dairy'], icon: '🥛' },
  { keywords: ['beer', 'ale', 'lager'], icon: '🍺' },
  { keywords: ['wine'], icon: '🍷' },
  { keywords: ['liquor', 'spirits', 'vodka', 'whiskey', 'rum'], icon: '🥃' },
  { keywords: ['energy drink'], icon: '⚡' },
  { keywords: ['protein'], icon: '💪' },
  
  // Snacks
  { keywords: ['chip', 'crisp'], icon: '🥔' },
  { keywords: ['cookie', 'biscuit'], icon: '🍪' },
  { keywords: ['candy', 'sweet', 'chocolate'], icon: '🍬' },
  { keywords: ['nut', 'almond', 'cashew', 'peanut'], icon: '🥜' },
  { keywords: ['popcorn'], icon: '🍿' },
  { keywords: ['cracker'], icon: '🧇' },
  { keywords: ['pretzel'], icon: '🥨' },
  { keywords: ['fruit snack', 'dried fruit'], icon: '🍇' },
  { keywords: ['granola', 'bar'], icon: '🥣' },
  { keywords: ['jerky', 'meat snack'], icon: '🥩' },
  
  // Baking & Cooking
  { keywords: ['bread', 'loaf'], icon: '🍞' },
  { keywords: ['flour', 'baking'], icon: '🌾' },
  { keywords: ['sugar'], icon: '🧂' },
  { keywords: ['oil', 'olive'], icon: '🫒' },
  { keywords: ['sauce', 'salsa', 'ketchup', 'mustard'], icon: '🍅' },
  { keywords: ['spice', 'seasoning', 'herb'], icon: '🌿' },
  { keywords: ['pasta', 'noodle', 'spaghetti'], icon: '🍝' },
  { keywords: ['rice'], icon: '🍚' },
  { keywords: ['soup', 'broth'], icon: '🍲' },
  { keywords: ['cereal', 'oat'], icon: '🥣' },
  { keywords: ['egg'], icon: '🥚' },
  { keywords: ['cheese'], icon: '🧀' },
  { keywords: ['butter', 'margarine'], icon: '🧈' },
  { keywords: ['yogurt'], icon: '🥛' },
  { keywords: ['meat', 'beef', 'pork', 'chicken'], icon: '🥩' },
  { keywords: ['fish', 'seafood', 'salmon', 'tuna'], icon: '🐟' },
  { keywords: ['vegetable', 'veggie'], icon: '🥬' },
  { keywords: ['fruit'], icon: '🍎' },
  { keywords: ['frozen'], icon: '🧊' },
  { keywords: ['canned', 'can'], icon: '🥫' },
  { keywords: ['pickle', 'olive'], icon: '🫒' },
  { keywords: ['jam', 'jelly', 'preserve'], icon: '🍯' },
  { keywords: ['honey'], icon: '🍯' },
  { keywords: ['syrup', 'maple'], icon: '🥞' },
  { keywords: ['condiment'], icon: '🧴' },
  { keywords: ['vinegar'], icon: '🍶' },
  
  // Household
  { keywords: ['clean', 'cleaner', 'detergent'], icon: '🧹' },
  { keywords: ['laundry', 'fabric'], icon: '🧺' },
  { keywords: ['dish', 'dishwash'], icon: '🍽️' },
  { keywords: ['paper towel', 'napkin'], icon: '🧻' },
  { keywords: ['toilet', 'bathroom'], icon: '🚽' },
  { keywords: ['trash', 'garbage', 'bag'], icon: '🗑️' },
  { keywords: ['air fresh', 'deodor'], icon: '🌸' },
  { keywords: ['candle'], icon: '🕯️' },
  { keywords: ['battery'], icon: '🔋' },
  { keywords: ['light', 'bulb'], icon: '💡' },
  { keywords: ['foil', 'wrap', 'storage'], icon: '📦' },
  { keywords: ['pest', 'insect'], icon: '🐜' },
  
  // Personal Care
  { keywords: ['shampoo', 'hair'], icon: '💇' },
  { keywords: ['soap', 'body wash'], icon: '🧼' },
  { keywords: ['lotion', 'moistur'], icon: '🧴' },
  { keywords: ['deodorant'], icon: '🧴' },
  { keywords: ['toothpaste', 'dental', 'oral'], icon: '🦷' },
  { keywords: ['razor', 'shave'], icon: '🪒' },
  { keywords: ['makeup', 'cosmetic'], icon: '💄' },
  { keywords: ['perfume', 'cologne', 'fragrance'], icon: '🌸' },
  { keywords: ['sunscreen', 'sun care'], icon: '☀️' },
  { keywords: ['feminine', 'menstrual'], icon: '🩸' },
  { keywords: ['cotton', 'swab'], icon: '🩹' },
  
  // Health
  { keywords: ['vitamin', 'supplement'], icon: '💊' },
  { keywords: ['medicine', 'pain', 'relief'], icon: '💊' },
  { keywords: ['cold', 'flu', 'cough'], icon: '🤧' },
  { keywords: ['allergy'], icon: '🤧' },
  { keywords: ['first aid', 'bandage'], icon: '🩹' },
  { keywords: ['digest', 'antacid', 'stomach'], icon: '💊' },
  
  // Baby
  { keywords: ['diaper', 'nappy'], icon: '🧒' },
  { keywords: ['baby food', 'infant'], icon: '🍼' },
  { keywords: ['baby wipe'], icon: '🧻' },
  { keywords: ['formula'], icon: '🍼' },
  { keywords: ['pacifier', 'teether'], icon: '👶' },
  
  // Pet
  { keywords: ['dog'], icon: '🐕' },
  { keywords: ['cat'], icon: '🐈' },
  { keywords: ['bird'], icon: '🐦' },
  { keywords: ['fish'], icon: '🐠' },
  { keywords: ['pet food', 'pet treat'], icon: '🦴' },
  { keywords: ['litter'], icon: '🐈' },
  
  // Ethnic Foods
  { keywords: ['caribbean', 'jamaican', 'island'], icon: '🌴' },
  { keywords: ['latin', 'mexican', 'hispanic'], icon: '🌶️' },
  { keywords: ['asian', 'chinese', 'japanese', 'korean'], icon: '🥢' },
  { keywords: ['indian', 'curry'], icon: '🍛' },
  { keywords: ['italian'], icon: '🍝' },
  { keywords: ['mediterranean'], icon: '🫒' },
];

async function main() {
  console.log('=== ASSIGNING ICONS TO CATEGORIES ===\n');
  
  // Get categories with generic icon
  const genericCats = await prisma.category.findMany({
    where: { icon: '📦' },
    select: { id: true, name: true, slug: true }
  });
  
  console.log('Categories with generic 📦 icon:', genericCats.length);
  
  let updated = 0;
  let unchanged = 0;
  
  for (const cat of genericCats) {
    const nameLower = cat.name.toLowerCase();
    const slugLower = cat.slug.toLowerCase();
    let matched = false;
    
    for (const rule of ICON_RULES) {
      for (const keyword of rule.keywords) {
        if (nameLower.includes(keyword) || slugLower.includes(keyword)) {
          await prisma.category.update({
            where: { id: cat.id },
            data: { icon: rule.icon }
          });
          updated++;
          matched = true;
          break;
        }
      }
      if (matched) break;
    }
    
    if (!matched) {
      unchanged++;
    }
  }
  
  console.log('\n✅ Updated:', updated);
  console.log('⚠️  Still generic:', unchanged);
  
  // Check remaining generic
  const stillGeneric = await prisma.category.findMany({
    where: { icon: '📦' },
    select: { id: true, name: true, slug: true },
    take: 20
  });
  
  if (stillGeneric.length > 0) {
    console.log('\nSample still generic:');
    console.table(stillGeneric);
  }
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
