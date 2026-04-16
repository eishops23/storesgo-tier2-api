const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();
const IMAGE_DIR = '/home/ubuntu/frontend/storesgo-frontend-v1/public/images/products';

async function main() {
  console.log('=== Recovering images by name match ===\n');
  
  const missingProducts = await prisma.product.findMany({
    where: { sourceImageUrl: { contains: 'missing-item' } },
    select: { id: true, name: true }
  });
  
  let recovered = 0;
  let noMatch = 0;
  
  for (const product of missingProducts) {
    // Find another product with same name that has a real image
    const match = await prisma.product.findFirst({
      where: {
        name: product.name,
        id: { not: product.id },
        sourceImageUrl: { not: null },
        NOT: { sourceImageUrl: { contains: 'missing-item' } }
      },
      select: { id: true, imageUrl: true, sourceImageUrl: true }
    });
    
    if (match && match.imageUrl) {
      // Find the source image file
      const sourceFile = path.join(IMAGE_DIR, path.basename(match.imageUrl));
      if (fs.existsSync(sourceFile)) {
        const ext = path.extname(sourceFile);
        const destFile = path.join(IMAGE_DIR, product.id + ext);
        
        // Copy the image
        fs.copyFileSync(sourceFile, destFile);
        
        // Update database
        await prisma.product.update({
          where: { id: product.id },
          data: { 
            imageUrl: '/images/products/' + product.id + ext,
            sourceImageUrl: match.sourceImageUrl  // Update source too
          }
        });
        
        recovered++;
        console.log('Recovered ID ' + product.id + ': ' + product.name.substring(0, 40));
      }
    } else {
      noMatch++;
    }
  }
  
  console.log('\n=== Results ===');
  console.log('Recovered:', recovered);
  console.log('No match found:', noMatch);
  console.log('Still missing:', missingProducts.length - recovered);
  
  await prisma.$disconnect();
}

main().catch(console.error);
