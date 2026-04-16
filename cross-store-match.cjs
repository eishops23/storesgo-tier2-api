const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();
const IMAGE_DIR = '/home/ubuntu/frontend/storesgo-frontend-v1/public/images/products';

async function main() {
  console.log('=== Cross-store image matching ===\n');
  
  const missingProducts = await prisma.product.findMany({
    where: { sourceImageUrl: { contains: 'missing-item' } },
    select: { id: true, name: true, sellerId: true }
  });
  
  console.log('Products missing images:', missingProducts.length);
  
  let recovered = 0;
  let checked = 0;
  
  for (const product of missingProducts) {
    // Normalize name for matching (remove size info, lowercase)
    const baseName = product.name
      .toLowerCase()
      .replace(/\d+\s*(oz|lb|g|ml|fl|ct|pk|pack|count)\.?/gi, '')
      .replace(/[^a-z0-9\s]/g, '')
      .trim();
    
    if (baseName.length < 5) continue;
    
    // Search for similar product at different store with real image
    const match = await prisma.product.findFirst({
      where: {
        sellerId: { not: product.sellerId },
        sourceImageUrl: { not: null },
        NOT: { sourceImageUrl: { contains: 'missing-item' } },
        name: { contains: baseName.split(' ').slice(0, 3).join(' '), mode: 'insensitive' }
      },
      select: { id: true, name: true, imageUrl: true, sourceImageUrl: true }
    });
    
    if (match && match.imageUrl) {
      const sourceFile = path.join(IMAGE_DIR, path.basename(match.imageUrl));
      if (fs.existsSync(sourceFile)) {
        const ext = path.extname(sourceFile);
        const destFile = path.join(IMAGE_DIR, product.id + ext);
        
        fs.copyFileSync(sourceFile, destFile);
        
        await prisma.product.update({
          where: { id: product.id },
          data: { 
            imageUrl: '/images/products/' + product.id + ext,
            sourceImageUrl: match.sourceImageUrl
          }
        });
        
        recovered++;
        if (recovered <= 20) {
          console.log('Match: "' + product.name.substring(0,30) + '" <- "' + match.name.substring(0,30) + '"');
        }
      }
    }
    
    checked++;
    if (checked % 500 === 0) {
      console.log('Checked ' + checked + '/' + missingProducts.length + ', recovered: ' + recovered);
    }
  }
  
  console.log('\n=== Results ===');
  console.log('Recovered from other stores:', recovered);
  console.log('Still missing:', missingProducts.length - recovered);
  
  await prisma.$disconnect();
}

main().catch(console.error);
