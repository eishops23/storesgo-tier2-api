const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const prisma = new PrismaClient();
const IMAGE_DIR = '/home/ubuntu/frontend/storesgo-frontend-v1/public/images/products';
const BASE_URL = '/images/products';

if (!fs.existsSync(IMAGE_DIR)) {
  fs.mkdirSync(IMAGE_DIR, { recursive: true });
}

async function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(filepath);
    
    protocol.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        downloadImage(response.headers.location, filepath).then(resolve).catch(reject);
        return;
      }
      if (response.statusCode !== 200) {
        reject(new Error('HTTP ' + response.statusCode));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve(true);
      });
    }).on('error', (err) => {
      fs.unlink(filepath, () => {});
      reject(err);
    });
  });
}

async function main() {
  const products = await prisma.product.findMany({
    where: { imageUrl: { startsWith: 'http' } },
    select: { id: true, imageUrl: true }
  });

  console.log('Found ' + products.length + ' products with external images');
  
  let downloaded = 0;
  let failed = 0;
  let skipped = 0;

  for (const product of products) {
    const ext = product.imageUrl.includes('.png') ? 'png' : 'jpg';
    const filename = product.id + '.' + ext;
    const filepath = path.join(IMAGE_DIR, filename);
    const newUrl = BASE_URL + '/' + filename;

    if (fs.existsSync(filepath)) {
      skipped++;
      if (!product.imageUrl.startsWith(BASE_URL)) {
        await prisma.product.update({
          where: { id: product.id },
          data: { imageUrl: newUrl }
        });
      }
      continue;
    }

    try {
      await downloadImage(product.imageUrl, filepath);
      await prisma.product.update({
        where: { id: product.id },
        data: { imageUrl: newUrl }
      });
      downloaded++;
      if (downloaded % 100 === 0) {
        console.log('Downloaded: ' + downloaded + ', Failed: ' + failed + ', Skipped: ' + skipped);
      }
    } catch (err) {
      failed++;
      console.error('Failed ' + product.id + ': ' + err.message);
    }
  }

  console.log('\n=== COMPLETE ===');
  console.log('Downloaded: ' + downloaded);
  console.log('Skipped: ' + skipped);
  console.log('Failed: ' + failed);
}

main().then(() => process.exit(0)).catch(console.error);
