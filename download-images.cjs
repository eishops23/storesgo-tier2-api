const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const prisma = new PrismaClient();
const OUTPUT_DIR = '/home/ubuntu/frontend/storesgo-frontend-v1/public/images/products';

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const request = protocol.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'image/*',
        'Referer': 'https://www.google.com/'
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
      const fileStream = fs.createWriteStream(filepath);
      response.pipe(fileStream);
      fileStream.on('finish', () => { fileStream.close(); resolve(true); });
      fileStream.on('error', reject);
    });
    request.on('error', reject);
    request.setTimeout(30000, () => { request.destroy(); reject(new Error('Timeout')); });
  });
}

async function main() {
  console.log('Starting image download...\n');
  const products = await prisma.product.findMany({
    where: { imageUrl: { contains: 'instacart.com' } },
    select: { id: true, imageUrl: true, name: true }
  });
  console.log('Found ' + products.length + ' products with Instacart images\n');
  
  let downloaded = 0, failed = 0, skipped = 0;
  
  for (const product of products) {
    const ext = product.imageUrl.includes('.png') ? 'png' : 'jpg';
    const filepath = path.join(OUTPUT_DIR, product.id + '.' + ext);
    
    if (fs.existsSync(filepath) && fs.statSync(filepath).size > 10000) {
      skipped++;
      continue;
    }
    
    try {
      await downloadImage(product.imageUrl, filepath);
      downloaded++;
      if (downloaded % 10 === 0) console.log('Downloaded: ' + downloaded);
    } catch (error) {
      failed++;
      fs.appendFileSync('/home/ubuntu/failed-images.txt', product.id + ': ' + error.message + '\n');
    }
    await new Promise(r => setTimeout(r, 200));
  }
  
  console.log('\nDone! Downloaded: ' + downloaded + ', Failed: ' + failed + ', Skipped: ' + skipped);
}

main().catch(console.error).finally(() => prisma.$disconnect());
