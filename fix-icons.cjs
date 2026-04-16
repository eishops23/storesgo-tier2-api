const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const categoryIcons = {
  'Body Care': '🧴',
  'Body Wash & Soap': '🧼',
  'Hand Sanitizer': '🧴',
  'Hand Soap': '🧼',
  'Loofahs': '🧽',
  'Lotion': '🧴',
  'Cosmetics': '💄',
  'Deodorant': '🧴',
  'Feminine Care': '🌸',
  'Pads': '🩹',
  'Panty Liners': '🌸',
  'Tampons': '🌸',
  'Hair Care': '💇',
  '2-in-1': '🧴',
  'Shampoo': '🧴',
  'Oral Hygiene': '🦷',
  'Mouthwash': '💧',
  'Toothbrushes': '🪥',
  'Toothpaste': '🦷',
  'Shaving': '🪒',
  'Skin Care': '✨',
  'Adult Care': '🧓',
  'Fragrance': '🌹',
  'Makeup': '💄',
  'Nail Care': '💅',
  'Eye & Ear Care': '👁️',
  'Cotton Swabs': '🧹',
  'Eye Drops': '💧',
  'Feminine Wipes & Washes': '🌸',
  'Conditioner': '💇',
  'Styling Products': '💇',
  'Intimacy': '💕',
  'Condoms': '💕',
  'Pregnancy Test': '🤰',
  'Dental Floss': '🦷',
  "Kid's Oral Hygiene": '🧒',
  'Razors': '🪒',
  'Shaving Cream': '🧴',
  'Sun Protection & Bug Spray': '☀️',
  'Cleansers': '✨',
  'Lip Balm': '💋',
  'Sunscreen': '☀️',
  'Contact Solution': '👁️',
  'Incontinence Pads': '🩹',
  'Incontinence Underwear': '🩲',
  'Body Powder': '🧴',
  'Bubble Bath': '🛁',
  'Ear Oil': '👂',
  'Feminine Medication': '💊',
  '3-in-1': '🧴',
  'Color & Treatments': '🎨',
  'Hair Ties, Clips & Accessories': '💇',
  'Hairspray': '💇',
  'Styling Tools': '💇',
  'Lubricant': '💕',
  'Other Intimacy': '💕',
  'Breath Spray & Strips': '💨',
  'Denture Care': '🦷',
  'More Dental Tools': '🦷',
  'Pain Relief & Night Guards': '😴',
  'Teeth Whitening': '✨',
  'Aftershave': '🪒',
  'Electric Razors': '🪒',
  'Other Shaving Tools': '🪒',
  'Razor Blades': '🪒',
  'Facial Wipes': '🧻',
  'Makeup Removers': '💄',
  'Moisturizers': '💧',
  'Specialty Skin Care': '✨'
};

async function main() {
  console.log('Fixing subcategory icons...\n');
  
  let updated = 0;
  for (const [name, icon] of Object.entries(categoryIcons)) {
    const result = await prisma.category.updateMany({
      where: { name: name },
      data: { icon: icon }
    });
    if (result.count > 0) updated += result.count;
  }
  
  console.log('Updated', updated, 'categories');
  
  // Also fix any remaining 📂 icons
  const remaining = await prisma.category.findMany({
    where: { icon: '📂' }
  });
  console.log('Categories still with folder icon:', remaining.length);
  
  await prisma.$disconnect();
}
main();
