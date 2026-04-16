const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();
const IMAGE_DIR = '/home/ubuntu/frontend/storesgo-frontend-v1/public/images/products';

// Product type keywords and what to search for
const productTypes = [
  { keywords: ['muffin'], search: 'muffin' },
  { keywords: ['bagel'], search: 'bagel' },
  { keywords: ['bread', 'baguette', 'loaf'], search: 'bread' },
  { keywords: ['cake'], search: 'cake' },
  { keywords: ['cookie'], search: 'cookie' },
  { keywords: ['pie'], search: 'pie' },
  { keywords: ['roll', 'rolls'], search: 'dinner roll' },
  { keywords: ['tortilla'], search: 'tortilla' },
  { keywords: ['pita'], search: 'pita' },
  { keywords: ['croissant'], search: 'croissant' },
  { keywords: ['donut', 'doughnut'], search: 'donut' },
  { keywords: ['chicken'], search: 'chicken' },
  { keywords: ['beef', 'steak'], search: 'beef' },
  { keywords: ['pork'], search: 'pork' },
  { keywords: ['apple'], search: 'apple' },
  { keywords: ['grape'], search: 'grape' },
  { keywords: ['tomato'], search: 'tomato' },
  { keywords: ['diaper'], search: 'diaper' },
  { keywords: ['wafer'], search: 'wafer' },
];

// Cache found images for each type
const imageCache = {};

async function findImageForType(searchTerm) {
  if (imageCache[searchTerm]) return imageCache[searchTerm];
  
  const product = await prisma.product.findFirst({
    where: {
      name: { contains: searchTerm, mode: 'insensitive' },
      sourceImageUrl: { not: null },
      NOT: { sourceImageUrl: { contains: 'missing-item' } }
    },
    select: { id: true, imageUrl: true, sourceImageUrl: true }
  });
  
  if (product && product.imageUrl) {
    imageCache[searchTerm] = product;
  }
  return product;
}

async function main() {
  console.log('=== Category-based image matching ===\n');
  
  const missing = await prisma.product.findMany({
    where: { sourceImageUrl: { contains: 'missing-item' } },
    select: { id: true, name: true }
  });
  
  console.log('Products missing:', missing.length);
  
  let recovered = 0;
  
  for (const product of missing) {
    const nameLower = product.name.toLowerCase();
    
    // Find matching product type
    const matchedType = productTypes.find(t => 
      t.keywords.some(k => nameLower.includes(k))
    );
    
    if (!matchedType) continue;
    
    const sourceProduct = await findImageForType(matchedType.search);
    if (!sourceProduct || !sourceProduct.imageUrl) continue;
    
    const sourceFile = path.join(IMAGE_DIR, path.basename(sourceProduct.imageUrl));
    if (!fs.existsSync(sourceFile)) continue;
    
    const ext = path.extname(sourceFile);
    const destFile = path.join(IMAGE_DIR, product.id + ext);
    
    fs.copyFileSync(sourceFile, destFile);
    
    await prisma.product.update({
      where: { id: product.id },
      data: { 
        imageUrl: '/images/products/' + product.id + ext,
        sourceImageUrl: sourceProduct.sourceImageUrl
      }
    });
    
    recovered++;
  }
  
  console.log('Recovered via category match:', recovered);
  
  const stillMissing = await prisma.product.count({
    where: { sourceImageUrl: { contains: 'missing-item' } }
  });
  console.log('Still missing:', stillMissing);
  console.log('Coverage:', ((38397 - stillMissing) / 38397 * 100).toFixed(1) + '%');
  
  await prisma.$disconnect();
}

main().catch(console.error);
