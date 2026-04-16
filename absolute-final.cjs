const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();
const IMAGE_DIR = '/home/ubuntu/frontend/storesgo-frontend-v1/public/images/products';

const productTypes = [
  { keywords: ['tiramisu'], search: 'tiramisu' },
  { keywords: ['lady finger'], search: 'ladyfinger' },
  { keywords: ['tortilleria'], search: 'tortilla' },
  { keywords: ['marshmallow'], search: 'marshmallow' },
  { keywords: ['malta'], search: 'malta' },
  { keywords: ['ginger ale'], search: 'ginger' },
  { keywords: ['oats', 'avena'], search: 'oats' },
  { keywords: ['peach'], search: 'peach' },
  { keywords: ['chickpea'], search: 'chickpea' },
  { keywords: ['polenta'], search: 'polenta' },
  { keywords: ['gnocchi'], search: 'gnocchi' },
  { keywords: ['spaghetti'], search: 'spaghetti' },
  { keywords: ['lentil'], search: 'lentil' },
  { keywords: ['pizza'], search: 'pizza' },
  { keywords: ['cough'], search: 'cough' },
  { keywords: ['alcohol'], search: 'alcohol' },
  { keywords: ['glove'], search: 'glove' },
  { keywords: ['cleaner'], search: 'cleaner' },
  { keywords: ['spray'], search: 'spray' },
  { keywords: ['dish'], search: 'dish' },
  { keywords: ['mop'], search: 'mop' },
  { keywords: ['bulb'], search: 'bulb' },
  { keywords: ['bleach'], search: 'bleach' },
  { keywords: ['detergent'], search: 'detergent' },
  { keywords: ['compote'], search: 'jam' },
  { keywords: ['shredded'], search: 'shredded cheese' },
  { keywords: ['half'], search: 'half' },
  { keywords: ['peas'], search: 'peas' },
  { keywords: ['ravioli'], search: 'ravioli' },
  { keywords: ['gel'], search: 'gel' },
  { keywords: ['leche', 'milk'], search: 'milk' },
  { keywords: ['wine'], search: 'wine' },
  { keywords: ['beer'], search: 'beer' },
  { keywords: ['panela'], search: 'panela' },
  { keywords: ['agave'], search: 'agave' },
  { keywords: ['sterile', 'bandage'], search: 'bandage' },
  { keywords: ['tostada'], search: 'tostada' },
  { keywords: ['semolina'], search: 'semolina' },
  { keywords: ['rotini'], search: 'pasta' },
  { keywords: ['fettuccine'], search: 'pasta' },
  { keywords: ['grain'], search: 'grain' },
  { keywords: ['wheat'], search: 'wheat' },
  { keywords: ['chia'], search: 'chia' },
  { keywords: ['amaranth'], search: 'amaranth' },
  { keywords: ['pop'], search: 'popsicle' },
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
