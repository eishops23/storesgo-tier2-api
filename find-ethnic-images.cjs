const { PrismaClient } = require('@prisma/client');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();
const IMAGE_DIR = '/home/ubuntu/frontend/storesgo-frontend-v1/public/images/products';

// Try to get image from Google (via product search)
function searchGoogleShopping(productName) {
  return new Promise((resolve) => {
    const query = encodeURIComponent(productName + ' product');
    // Use DuckDuckGo instant answers (free, no API key)
    const url = `https://api.duckduckgo.com/?q=${query}&format=json&ia=products`;
    
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.Image) resolve(json.Image);
          else if (json.RelatedTopics && json.RelatedTopics[0] && json.RelatedTopics[0].Icon) {
            resolve(json.RelatedTopics[0].Icon.URL);
          } else resolve(null);
        } catch (e) { resolve(null); }
      });
    }).on('error', () => resolve(null));
  });
}

// Try Walmart's product image CDN (many ethnic products)
async function tryWalmartSearch(name) {
  return new Promise((resolve) => {
    const query = encodeURIComponent(name);
    const url = `https://www.walmart.com/search?q=${query}`;
    
    https.get(url, { 
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html'
      } 
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        // Look for image URL in response
        const match = data.match(/https:\/\/i5\.walmartimages\.com\/[^"'\s]+\.(?:jpg|png|jpeg)/i);
        resolve(match ? match[0] : null);
      });
    }).on('error', () => resolve(null));
  });
}

function downloadImage(url, filepath) {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https') ? https : http;
    protocol.get(url, { 
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 10000
    }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        if (res.headers.location) {
          downloadImage(res.headers.location, filepath).then(resolve);
        } else resolve(false);
        return;
      }
      if (res.statusCode !== 200) { resolve(false); return; }
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        if (buffer.length < 2000) { resolve(false); return; }
        fs.writeFileSync(filepath, buffer);
        resolve(true);
      });
    }).on('error', () => resolve(false));
  });
}

async function main() {
  console.log('=== Searching for ethnic product images ===\n');
  
  const missing = await prisma.product.findMany({
    where: { sourceImageUrl: { contains: 'missing-item' } },
    select: { id: true, name: true }
  });
  
  console.log('Missing products:', missing.length);
  console.log('Trying DuckDuckGo and Walmart...\n');
  
  let recovered = 0;
  let checked = 0;
  
  for (const product of missing) {
    // Try DuckDuckGo first
    let imageUrl = await searchGoogleShopping(product.name);
    
    // If not found, try Walmart
    if (!imageUrl) {
      imageUrl = await tryWalmartSearch(product.name);
    }
    
    if (imageUrl && imageUrl.startsWith('http')) {
      const ext = imageUrl.toLowerCase().includes('.png') ? '.png' : '.jpg';
      const filepath = path.join(IMAGE_DIR, product.id + ext);
      
      const success = await downloadImage(imageUrl, filepath);
      if (success) {
        await prisma.product.update({
          where: { id: product.id },
          data: { 
            imageUrl: '/images/products/' + product.id + ext,
            sourceImageUrl: imageUrl
          }
        });
        recovered++;
        if (recovered <= 20) {
          console.log('Found: ' + product.name.substring(0, 50));
        }
      }
    }
    
    checked++;
    if (checked % 100 === 0) {
      console.log('Progress: ' + checked + '/' + missing.length + ' checked, ' + recovered + ' recovered');
    }
    
    // Rate limit
    await new Promise(r => setTimeout(r, 300));
  }
  
  console.log('\n=== Results ===');
  console.log('Recovered:', recovered);
  
  const stillMissing = await prisma.product.count({
    where: { sourceImageUrl: { contains: 'missing-item' } }
  });
  console.log('Still missing:', stillMissing);
  console.log('Coverage:', ((38397 - stillMissing) / 38397 * 100).toFixed(1) + '%');
  
  await prisma.$disconnect();
}

main().catch(console.error);
