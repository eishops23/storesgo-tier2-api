const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();
const IMAGE_DIR = '/home/ubuntu/frontend/storesgo-frontend-v1/public/images/products';

// Common brands to match
const brands = [
  'Goya', 'Boars Head', 'Perdue', 'Tyson', 'Oscar Mayer', 'Kraft', 'Heinz',
  'Kelloggs', 'General Mills', 'Pepsi', 'Coca Cola', 'Nestle', 'Hershey',
  'Campbells', 'Del Monte', 'Dole', 'Chiquita', 'Smucker', 'Jif', 'Skippy',
  'Pillsbury', 'Betty Crocker', 'Duncan Hines', 'Nabisco', 'Oreo', 'Ritz',
  'Quaker', 'Tropicana', 'Minute Maid', 'Simply', 'Starbucks', 'Folgers',
  'Maxwell House', 'Lipton', 'Poland Spring', 'Dasani', 'Aquafina',
  'Colgate', 'Crest', 'Tide', 'Gain', 'Downy', 'Bounty', 'Charmin',
  'Huggies', 'Pampers', 'Similac', 'Enfamil', 'Pedialyte', 'Pediasure',
  'Ensure', 'Glucerna', 'Boost', 'Carnation', 'Lactaid', 'Silk', 'Oatly',
  'Blue Diamond', 'Planters', 'Frito Lay', 'Doritos', 'Lays', 'Cheetos',
  'Pringles', 'Tostitos', 'Snyders', 'Kettle', 'Cape Cod', 'Utz'
];

async function main() {
  console.log('=== Brand-based image matching ===\n');
  
  const missingProducts = await prisma.product.findMany({
    where: { sourceImageUrl: { contains: 'missing-item' } },
    select: { id: true, name: true }
  });
  
  console.log('Products missing images:', missingProducts.length);
  
  let recovered = 0;
  
  for (const product of missingProducts) {
    const nameLower = product.name.toLowerCase();
    
    // Find which brand this product belongs to
    const matchedBrand = brands.find(b => nameLower.includes(b.toLowerCase()));
    if (!matchedBrand) continue;
    
    // Find another product with same brand that has an image
    const match = await prisma.product.findFirst({
      where: {
        id: { not: product.id },
        name: { contains: matchedBrand, mode: 'insensitive' },
        sourceImageUrl: { not: null },
        NOT: { sourceImageUrl: { contains: 'missing-item' } }
      },
      select: { id: true, name: true, imageUrl: true, sourceImageUrl: true }
    });
    
    if (match && match.imageUrl) {
      // Check if names are actually similar (not just brand match)
      const productWords = product.name.toLowerCase().split(/\s+/).slice(0, 4);
      const matchWords = match.name.toLowerCase().split(/\s+/).slice(0, 4);
      const commonWords = productWords.filter(w => matchWords.includes(w) && w.length > 2);
      
      if (commonWords.length >= 2) {
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
          if (recovered <= 15) {
            console.log('Match: "' + product.name.substring(0,35) + '" <- "' + match.name.substring(0,35) + '"');
          }
        }
      }
    }
  }
  
  console.log('\n=== Results ===');
  console.log('Recovered via brand match:', recovered);
  
  // Final count
  const stillMissing = await prisma.product.count({
    where: { sourceImageUrl: { contains: 'missing-item' } }
  });
  console.log('Still missing:', stillMissing);
  console.log('Coverage:', ((38397 - stillMissing) / 38397 * 100).toFixed(1) + '%');
  
  await prisma.$disconnect();
}

main().catch(console.error);
