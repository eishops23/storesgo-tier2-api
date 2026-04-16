const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();
const IMAGE_DIR = '/home/ubuntu/frontend/storesgo-frontend-v1/public/images/products';

const productTypes = [
  { keywords: ['food'], search: 'food' },
  { keywords: ['drink'], search: 'drink' },
  { keywords: ['mix'], search: 'mix' },
  { keywords: ['natural'], search: 'natural' },
  { keywords: ['white'], search: 'white' },
  { keywords: ['black'], search: 'black' },
  { keywords: ['gold'], search: 'gold' },
  { keywords: ['sweet'], search: 'sweet' },
  { keywords: ['salt'], search: 'salt' },
  { keywords: ['sugar'], search: 'sugar' },
  { keywords: ['sesame'], search: 'sesame' },
  { keywords: ['extract'], search: 'extract' },
  { keywords: ['spice'], search: 'spice' },
  { keywords: ['herb'], search: 'herb' },
  { keywords: ['leaf'], search: 'leaf' },
  { keywords: ['root'], search: 'root' },
  { keywords: ['fruit'], search: 'fruit' },
  { keywords: ['vegetable'], search: 'vegetable' },
  { keywords: ['meat'], search: 'meat' },
  { keywords: ['fish'], search: 'fish' },
  { keywords: ['rice'], search: 'rice' },
  { keywords: ['flour'], search: 'flour' },
  { keywords: ['oil'], search: 'oil' },
  { keywords: ['vinegar'], search: 'vinegar' },
  { keywords: ['cream'], search: 'cream' },
  { keywords: ['spread'], search: 'spread' },
  { keywords: ['snack'], search: 'snack' },
  { keywords: ['treat'], search: 'treat' },
  { keywords: ['candy'], search: 'candy' },
  { keywords: ['nutrition'], search: 'nutrition' },
  { keywords: ['vitamin'], search: 'vitamin' },
  { keywords: ['protein'], search: 'protein' },
  { keywords: ['pack'], search: 'pack' },
  { keywords: ['bag'], search: 'bag' },
  { keywords: ['bottle'], search: 'bottle' },
  { keywords: ['jar'], search: 'jar' },
  { keywords: ['can'], search: 'canned' },
  { keywords: ['box'], search: 'box' },
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
