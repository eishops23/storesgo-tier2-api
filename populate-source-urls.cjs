const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();
const DATA_DIR = '/home/ubuntu';
const FILES = ['bravo.json', 'gala_fresh.json', 'key_food.json', 'publix.json'];

async function main() {
  console.log('Populating sourceImageUrl from JSON files...\n');
  
  let updated = 0;
  let notFound = 0;
  
  for (const file of FILES) {
    const filePath = path.join(DATA_DIR, file);
    if (!fs.existsSync(filePath)) {
      console.log('File not found:', file);
      continue;
    }
    
    console.log('Processing:', file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const products = data.products || data;
    
    for (const product of products) {
      if (!product.image || !product.id) continue;
      
      const externalId = product.id;
      
      try {
        const result = await prisma.product.updateMany({
          where: { externalId: externalId },
          data: { sourceImageUrl: product.image }
        });
        
        if (result.count > 0) {
          updated += result.count;
        } else {
          notFound++;
        }
      } catch (err) {
        // Skip errors
      }
    }
    
    console.log('  Updated so far:', updated);
  }
  
  console.log('\nDone!');
  console.log('Updated:', updated);
  console.log('Not found:', notFound);
}

main().catch(console.error).finally(() => prisma.$disconnect());
