const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const categoryRules = {
  'caribbean-foods': [
    { name: 'Jamaican Foods', slug: 'jamaican-foods', icon: '🇯🇲', keywords: ['jamaican', 'jamaica', 'jerk', 'ackee'] },
    { name: 'Coconut Products', slug: 'caribbean-coconut', icon: '🥥', keywords: ['coconut'] },
    { name: 'Grace Products', slug: 'grace-caribbean', icon: '🌴', keywords: ['grace '] },
    { name: 'Tropical Products', slug: 'tropical-caribbean', icon: '🍹', keywords: ['tropical'] },
    { name: 'Caribbean Breads', slug: 'caribbean-breads', icon: '🍞', keywords: ['griddle cake', 'cassava', 'bread'] },
    { name: 'Caribbean Spices', slug: 'caribbean-spices', icon: '🌶️', keywords: ['spice', 'season', 'pepper'] },
    { name: 'Caribbean Canned Goods', slug: 'caribbean-canned', icon: '🥫', keywords: ['sardine', 'canned'] },
  ],
  'latin-foods': [
    { name: 'Mexican Foods', slug: 'mexican-foods', icon: '🇲🇽', keywords: ['mexican', 'taco', 'burrito', 'enchilada', 'salsa'] },
    { name: 'Tortillas & Wraps', slug: 'tortillas-wraps', icon: '🌮', keywords: ['tortilla', 'taco shell'] },
    { name: 'Goya Products', slug: 'goya-latin', icon: '🫘', keywords: ['goya '] },
    { name: 'Colombian Foods', slug: 'colombian-foods', icon: '🇨🇴', keywords: ['colombian', 'arepa', 'bocadillo'] },
    { name: 'Latin Beans & Rice', slug: 'latin-beans-rice', icon: '🍚', keywords: ['bean', 'rice', 'frijol'] },
    { name: 'Latin Sweets', slug: 'latin-sweets', icon: '🍬', keywords: ['dulce', 'panettone', 'flan', 'custard'] },
    { name: 'Latin Spices', slug: 'latin-spices', icon: '🌶️', keywords: ['sazon', 'adobo', 'sofrito'] },
  ],
  'asian-foods': [
    { name: 'Thai Foods', slug: 'thai-foods', icon: '🇹🇭', keywords: ['thai', 'pad thai', 'curry paste'] },
    { name: 'Japanese Foods', slug: 'japanese-foods', icon: '🇯🇵', keywords: ['japanese', 'sushi', 'miso', 'ramen', 'teriyaki'] },
    { name: 'Chinese Foods', slug: 'chinese-foods', icon: '🇨🇳', keywords: ['chinese', 'wonton', 'dumpling', 'soy sauce'] },
    { name: 'Korean Foods', slug: 'korean-foods', icon: '🇰🇷', keywords: ['korean', 'kimchi', 'gochujang'] },
    { name: 'Indian Foods', slug: 'indian-foods', icon: '🇮🇳', keywords: ['indian', 'curry', 'masala', 'naan'] },
    { name: 'Asian Noodles', slug: 'asian-noodles', icon: '🍜', keywords: ['noodle', 'ramen', 'udon'] },
    { name: 'Sesame Products', slug: 'sesame-products', icon: '🥜', keywords: ['sesame', 'tahini'] },
    { name: 'Asian Coconut', slug: 'asian-coconut', icon: '🥥', keywords: ['coconut milk', 'coconut cream'] },
  ]
};

async function run() {
  for (const [parentSlug, subcats] of Object.entries(categoryRules)) {
    const parent = await prisma.category.findFirst({ where: { slug: parentSlug } });
    if (!parent) { console.log('Missing:', parentSlug); continue; }
    
    console.log('\n' + parent.name + ' (ID: ' + parent.id + ')');
    const products = await prisma.product.findMany({
      where: { categoryId: parent.id },
      select: { id: true, name: true }
    });
    console.log('Products:', products.length);
    
    for (const sub of subcats) {
      let cat = await prisma.category.findFirst({ where: { slug: sub.slug } });
      if (!cat) {
        cat = await prisma.category.create({
          data: { name: sub.name, slug: sub.slug, icon: sub.icon, parentId: parent.id, tagline: 'Shop ' + sub.name, color: '#6B7280' }
        });
        console.log('Created:', sub.icon, sub.name);
      }
      
      let count = 0;
      for (const p of products) {
        const lower = p.name.toLowerCase();
        if (sub.keywords.some(k => lower.includes(k.toLowerCase()))) {
          await prisma.product.update({ where: { id: p.id }, data: { categoryId: cat.id } });
          count++;
        }
      }
      if (count > 0) console.log('  Assigned', count, 'products');
    }
  }
  await prisma.$disconnect();
  console.log('\nDone!');
}
run();
