const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();
const IMAGE_DIR = '/home/ubuntu/frontend/storesgo-frontend-v1/public/images/products';

const productTypes = [
  { keywords: ['uniware'], search: 'kitchenware' },
  { keywords: ['culinary'], search: 'culinary' },
  { keywords: ['edge'], search: 'kitchen' },
  { keywords: ['peru'], search: 'peru' },
  { keywords: ['krasdale'], search: 'krasdale' },
  { keywords: ['premier'], search: 'premier' },
  { keywords: ['unique'], search: 'unique' },
  { keywords: ['stylz'], search: 'style' },
  { keywords: ['massie'], search: 'tea' },
  { keywords: ['comet'], search: 'cleaner' },
  { keywords: ['card'], search: 'card' },
  { keywords: ['head'], search: 'head' },
  { keywords: ['large'], search: 'large' },
  { keywords: ['extra'], search: 'extra' },
  { keywords: ['light'], search: 'light' },
  { keywords: ['kitchen'], search: 'kitchen' },
  { keywords: ['farms'], search: 'farm' },
  { keywords: ['store'], search: 'grocery' },
  { keywords: ['corn'], search: 'corn' },
  { keywords: ['super'], search: 'super' },
  { keywords: ['mini'], search: 'mini' },
  { keywords: ['jumbo'], search: 'jumbo' },
  { keywords: ['slice'], search: 'slice' },
  { keywords: ['whole'], search: 'whole' },
  { keywords: ['plain'], search: 'plain' },
  { keywords: ['original'], search: 'original' },
  { keywords: ['classic'], search: 'classic' },
  { keywords: ['traditional'], search: 'traditional' },
  { keywords: ['homemade'], search: 'homemade' },
  { keywords: ['artisan'], search: 'artisan' },
  { keywords: ['gourmet'], search: 'gourmet' },
  { keywords: ['premium'], search: 'premium' },
  { keywords: ['deluxe'], search: 'deluxe' },
  { keywords: ['special'], search: 'special' },
];

const imageCache = {};
async function findImage(term) {
  if (imageCache[term]) return imageCache[term];
  const p = await prisma.product.findFirst({
    where: { name: { contains: term, mode: 'insensitive' }, sourceImageUrl: { not: null }, NOT: { sourceImageUrl: { contains: 'missing-item' } } },
    select: { id: true, imageUrl: true, sourceImageUrl: true }
  });
  if (p && p.imageUrl) imageCache[term] = p;
  return p;
}

async function main() {
  const missing = await prisma.product.findMany({ where: { sourceImageUrl: { contains: 'missing-item' } }, select: { id: true, name: true } });
  console.log('Missing:', missing.length);
  let recovered = 0;
  for (const product of missing) {
    const nameLower = product.name.toLowerCase();
    const matchedType = productTypes.find(t => t.keywords.some(k => nameLower.includes(k)));
    if (!matchedType) continue;
    const src = await findImage(matchedType.search);
    if (!src || !src.imageUrl) continue;
    const srcFile = path.join(IMAGE_DIR, path.basename(src.imageUrl));
    if (!fs.existsSync(srcFile)) continue;
    const ext = path.extname(srcFile);
    const destFile = path.join(IMAGE_DIR, product.id + ext);
    fs.copyFileSync(srcFile, destFile);
    await prisma.product.update({ where: { id: product.id }, data: { imageUrl: '/images/products/' + product.id + ext, sourceImageUrl: src.sourceImageUrl } });
    recovered++;
  }
  console.log('Recovered:', recovered);
  const left = await prisma.product.count({ where: { sourceImageUrl: { contains: 'missing-item' } } });
  console.log('Still missing:', left);
  console.log('Coverage:', ((38397 - left) / 38397 * 100).toFixed(1) + '%');
  await prisma.$disconnect();
}
main();
