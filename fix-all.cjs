const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixAll() {
  console.log('=== 1. FIXING FLAG EMOJIS ===\n');
  
  const emojiFixes = [
    { id: 1270, newIcon: '🍗', name: 'Jamaican Foods' },      // was 🇯🇲
    { id: 1277, newIcon: '🌯', name: 'Mexican Foods' },       // was 🇲🇽
    { id: 1280, newIcon: '🫓', name: 'Colombian Foods' },     // was 🇨🇴
    { id: 1284, newIcon: '🍜', name: 'Thai Foods' },          // was 🇹🇭
    { id: 1285, newIcon: '🍣', name: 'Japanese Foods' },      // was 🇯🇵
    { id: 1286, newIcon: '🥡', name: 'Chinese Foods' },       // was 🇨🇳
    { id: 1287, newIcon: '🍲', name: 'Korean Foods' },        // was 🇰🇷
    { id: 1288, newIcon: '🍛', name: 'Indian Foods' },        // was 🇮🇳
  ];
  
  for (const fix of emojiFixes) {
    await prisma.category.update({
      where: { id: fix.id },
      data: { icon: fix.newIcon }
    });
    console.log('Fixed:', fix.newIcon, fix.name);
  }
  
  console.log('\n=== 2. CREATING FRAGRANCES SUBCATEGORIES ===\n');
  
  const fragrances = await prisma.category.findFirst({ where: { slug: 'fragrances' } });
  if (fragrances) {
    console.log('Fragrances ID:', fragrances.id);
    
    // Get fragrance products to analyze
    const products = await prisma.product.findMany({
      where: { categoryId: fragrances.id },
      select: { id: true, name: true }
    });
    console.log('Products:', products.length);
    
    const subcats = [
      { name: 'Perfumes', slug: 'perfumes', icon: '💎', keywords: ['perfume', 'parfum', 'eau de'] },
      { name: 'Colognes', slug: 'colognes', icon: '🧴', keywords: ['cologne', 'pour homme', 'men'] },
      { name: 'Body Sprays', slug: 'body-sprays', icon: '✨', keywords: ['body spray', 'body mist', 'splash'] },
      { name: 'Air Fresheners', slug: 'air-fresheners-fragrance', icon: '🌸', keywords: ['air fresh', 'room spray', 'febreze', 'glade'] },
      { name: 'Scented Candles', slug: 'scented-candles', icon: '🕯️', keywords: ['candle', 'scented'] },
      { name: 'Essential Oils', slug: 'essential-oils', icon: '🫒', keywords: ['essential oil', 'aromatherapy', 'diffuser'] },
    ];
    
    for (const sub of subcats) {
      let cat = await prisma.category.findFirst({ where: { slug: sub.slug } });
      if (!cat) {
        cat = await prisma.category.create({
          data: { 
            name: sub.name, 
            slug: sub.slug, 
            icon: sub.icon, 
            parentId: fragrances.id, 
            tagline: 'Shop ' + sub.name, 
            color: '#6B7280' 
          }
        });
        console.log('Created:', sub.icon, sub.name);
      }
      
      // Assign products
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
  
  console.log('\n=== 3. CHECKING IMAGE PATHS ===\n');
  
  const sampleProds = await prisma.product.findMany({ 
    take: 10, 
    select: { id: true, name: true, imageUrl: true } 
  });
  
  console.log('Sample image URLs:');
  sampleProds.forEach(p => console.log(p.imageUrl));
  
  // Count products with images
  const withImages = await prisma.product.count({ where: { imageUrl: { not: null } } });
  const total = await prisma.product.count();
  console.log('\nProducts with images:', withImages, '/', total);
  
  await prisma.$disconnect();
  console.log('\nDone!');
}

fixAll();
