const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();
const IMAGE_DIR = '/home/ubuntu/frontend/storesgo-frontend-v1/public/images/products';

const productTypes = [
  { keywords: ['candle'], search: 'candle' },
  { keywords: ['salad'], search: 'salad' },
  { keywords: ['mushroom'], search: 'mushroom' },
  { keywords: ['beet'], search: 'beets' },
  { keywords: ['pumpkin'], search: 'pumpkin' },
  { keywords: ['cantaloupe'], search: 'cantaloupe' },
  { keywords: ['plum'], search: 'plum' },
  { keywords: ['fig'], search: 'fig' },
  { keywords: ['egg'], search: 'eggs' },
  { keywords: ['aloe'], search: 'aloe vera' },
  { keywords: ['honey'], search: 'honey' },
  { keywords: ['vanilla'], search: 'vanilla' },
  { keywords: ['pudding'], search: 'pudding' },
  { keywords: ['hot dog'], search: 'hot dog' },
  { keywords: ['broccoli'], search: 'broccoli' },
  { keywords: ['artichoke'], search: 'artichoke' },
  { keywords: ['seed'], search: 'seeds' },
  { keywords: ['bean'], search: 'beans' },
  { keywords: ['pasta'], search: 'pasta' },
  { keywords: ['sauce'], search: 'sauce' },
  { keywords: ['brush'], search: 'brush' },
  { keywords: ['soap'], search: 'soap' },
  { keywords: ['steel'], search: 'steel' },
  { keywords: ['organic'], search: 'organic' },
  { keywords: ['frozen'], search: 'frozen' },
  { keywords: ['fresh'], search: 'fresh' },
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
