const fs = require('fs');

const files = [
  '/home/ubuntu/bravo.json',
  '/home/ubuntu/gala_fresh.json', 
  '/home/ubuntu/key_food.json',
  '/home/ubuntu/publix.json'
];

console.log('=== Investigating source JSON for alternative image fields ===\n');

for (const file of files) {
  if (!fs.existsSync(file)) {
    console.log('File not found:', file);
    continue;
  }
  
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  const products = Array.isArray(data) ? data : (data.products || []);
  
  // Find products with missing-item URLs
  const missingItems = products.filter(p => 
    p.image && p.image.includes('missing-item')
  );
  
  console.log('=== ' + file.split('/').pop() + ' ===');
  console.log('Total products:', products.length);
  console.log('With missing-item URL:', missingItems.length);
  
  if (missingItems.length > 0) {
    // Show ALL fields of first missing item to find alternatives
    console.log('\nSample missing item - ALL FIELDS:');
    console.log(JSON.stringify(missingItems[0], null, 2));
    
    // Check what other image-related fields exist
    const sampleKeys = Object.keys(missingItems[0]);
    const imageFields = sampleKeys.filter(k => 
      k.toLowerCase().includes('image') || 
      k.toLowerCase().includes('photo') ||
      k.toLowerCase().includes('thumbnail') ||
      k.toLowerCase().includes('url') ||
      k.toLowerCase().includes('media')
    );
    console.log('\nImage-related fields found:', imageFields);
  }
  console.log('');
}
