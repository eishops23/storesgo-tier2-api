const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const https = require('https');

const prisma = new PrismaClient();
const OUTPUT_DIR = '/home/ubuntu/frontend/storesgo-frontend-v1/public/images/products';

function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'image/*'
      }
    }, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        downloadImage(response.headers.location, filepath).then(resolve).catch(reject);
        return;
      }
      if (response.statusCode !== 200) {
        reject(new Error('HTTP ' + response.statusCode));
        return;
      }
      const chunks = [];
      response.on('data', chunk => chunks.push(chunk));
      response.on('end', () => {
        const buffer = Buffer.concat(chunks);
        if (buffer.length < 5000) {
          reject(new Error('Too small'));
          return;
        }
        fs.writeFileSync(filepath, buffer);
        resolve(buffer.length);
      });
      response.on('error', reject);
    }).on('error', reject);
  });
}

async function main() {
  console.log('Batch downloading real images...\n');
  
  // Get products with real images (not missing-item)
  const products = await prisma.product.findMany({
    where: {
      sourceImageUrl: { not: null },
      NOT: { sourceImageUrl: { contains: 'missing-item' } }
    },
    select: { id: true, sourceImageUrl: true },
    orderBy: { id: 'asc' }
  });
  
  console.log('Found', products.length, 'products with real images\n');
  
  let downloaded = 0, failed = 0, skipped = 0;
  const startTime = Date.now();
  
  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    const ext = product.sourceImageUrl.includes('.png') ? 'png' : 'jpg';
    const filepath = path.join(OUTPUT_DIR, product.id + '.' + ext);
    
    // Skip if exists and > 10KB
    if (fs.existsSync(filepath) && fs.statSync(filepath).size > 10000) {
      skipped++;
      continue;
    }
    
    try {
      const size = await downloadImage(product.sourceImageUrl, filepath);
      downloaded++;
      
      // Update database
      await prisma.product.update({
        where: { id: product.id },
        data: { imageUrl: '/images/products/' + product.id + '.' + ext }
      });
      
    } catch (err) {
      failed++;
    }
    
    // Progress every 100
    if ((downloaded + failed) % 100 === 0) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
      const rate = ((downloaded + failed) / elapsed * 60).toFixed(0);
      console.log(`Progress: ${downloaded} downloaded, ${failed} failed, ${skipped} skipped (${rate}/min)`);
    }
    
    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 50));
  }
  
  console.log('\n=== DONE ===');
  console.log('Downloaded:', downloaded);
  console.log('Failed:', failed);
  console.log('Skipped:', skipped);
  console.log('Time:', ((Date.now() - startTime) / 1000 / 60).toFixed(1), 'minutes');
}

main().catch(console.error).finally(() => prisma.$disconnect());
