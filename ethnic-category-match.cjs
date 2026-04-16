const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();
const IMAGE_DIR = '/home/ubuntu/frontend/storesgo-frontend-v1/public/images/products';

// Ethnic and specialty product types
const productTypes = [
  // Latin
  { keywords: ['cassava', 'yuca'], search: 'cassava' },
  { keywords: ['plantain'], search: 'plantain' },
  { keywords: ['empanada'], search: 'empanada' },
  { keywords: ['tamale'], search: 'tamale' },
  { keywords: ['churro'], search: 'churro' },
  { keywords: ['flan'], search: 'flan' },
  { keywords: ['dulce'], search: 'dulce de leche' },
  { keywords: ['arepas', 'arepa'], search: 'arepa' },
  { keywords: ['pupusa'], search: 'pupusa' },
  { keywords: ['mango'], search: 'mango' },
  { keywords: ['papaya'], search: 'papaya' },
  { keywords: ['guava'], search: 'guava' },
  { keywords: ['passion fruit', 'maracuya'], search: 'passion fruit' },
  { keywords: ['coconut', 'coco'], search: 'coconut' },
  
  // Caribbean
  { keywords: ['jerk'], search: 'jerk seasoning' },
  { keywords: ['roti'], search: 'roti bread' },
  { keywords: ['patty', 'pattie'], search: 'jamaican patty' },
  { keywords: ['sorrel'], search: 'sorrel drink' },
  { keywords: ['ackee'], search: 'ackee' },
  { keywords: ['callaloo'], search: 'callaloo' },
  
  // Asian
  { keywords: ['kimchi'], search: 'kimchi' },
  { keywords: ['ramen', 'noodle'], search: 'ramen noodles' },
  { keywords: ['soy sauce'], search: 'soy sauce' },
  { keywords: ['tofu'], search: 'tofu' },
  { keywords: ['dumpling'], search: 'dumpling' },
  { keywords: ['spring roll', 'egg roll'], search: 'spring roll' },
  { keywords: ['rice paper'], search: 'rice paper' },
  { keywords: ['mochi'], search: 'mochi' },
  { keywords: ['pocky'], search: 'pocky' },
  
  // Middle Eastern
  { keywords: ['hummus'], search: 'hummus' },
  { keywords: ['falafel'], search: 'falafel' },
  { keywords: ['tahini'], search: 'tahini' },
  { keywords: ['halal'], search: 'halal meat' },
  { keywords: ['baklava'], search: 'baklava' },
  { keywords: ['pita'], search: 'pita bread' },
  { keywords: ['shawarma'], search: 'shawarma' },
  
  // European
  { keywords: ['pierogi'], search: 'pierogi' },
  { keywords: ['kielbasa'], search: 'kielbasa' },
  { keywords: ['bratwurst'], search: 'bratwurst' },
  { keywords: ['stroopwafel'], search: 'stroopwafel' },
  
  // General ethnic
  { keywords: ['malta'], search: 'malta drink' },
  { keywords: ['tamarind'], search: 'tamarind' },
  { keywords: ['hibiscus', 'jamaica'], search: 'hibiscus' },
  { keywords: ['horchata'], search: 'horchata' },
  { keywords: ['sofrito'], search: 'sofrito' },
  { keywords: ['adobo'], search: 'adobo seasoning' },
  { keywords: ['sazon'], search: 'sazon seasoning' },
  { keywords: ['recaito'], search: 'recaito' },
  { keywords: ['mofongo'], search: 'mofongo' },
  { keywords: ['tostones'], search: 'tostones' },
  { keywords: ['chicharron'], search: 'chicharron' },
  
  // Bakery extras
  { keywords: ['pan de'], search: 'pan dulce' },
  { keywords: ['conchas'], search: 'conchas bread' },
  { keywords: ['tres leches'], search: 'tres leches cake' },
  { keywords: ['flan'], search: 'flan' },
  { keywords: ['pastelito'], search: 'pastelito' },
  { keywords: ['quesito'], search: 'quesito' },
  { keywords: ['cupcake'], search: 'cupcake' },
  { keywords: ['brownie'], search: 'brownie' },
  { keywords: ['danish'], search: 'danish pastry' },
  { keywords: ['croissant'], search: 'croissant' },
  { keywords: ['scone'], search: 'scone' },
  { keywords: ['biscotti'], search: 'biscotti' },
  { keywords: ['lady finger'], search: 'ladyfinger cookie' },
  
  // More produce
  { keywords: ['avocado'], search: 'avocado' },
  { keywords: ['lime'], search: 'lime' },
  { keywords: ['lemon'], search: 'lemon' },
  { keywords: ['orange'], search: 'orange' },
  { keywords: ['banana'], search: 'banana' },
  { keywords: ['pineapple'], search: 'pineapple' },
  { keywords: ['melon'], search: 'melon' },
  { keywords: ['berry', 'berries'], search: 'berries' },
  { keywords: ['pepper'], search: 'bell pepper' },
  { keywords: ['onion'], search: 'onion' },
  { keywords: ['garlic'], search: 'garlic' },
  { keywords: ['cilantro'], search: 'cilantro' },
  { keywords: ['jalapeno'], search: 'jalapeno' },
  { keywords: ['habanero'], search: 'habanero' },
  
  // Meat/Seafood
  { keywords: ['salmon'], search: 'salmon' },
  { keywords: ['shrimp'], search: 'shrimp' },
  { keywords: ['tilapia'], search: 'tilapia' },
  { keywords: ['cod', 'bacalao'], search: 'cod fish' },
  { keywords: ['crab'], search: 'crab' },
  { keywords: ['lobster'], search: 'lobster' },
  { keywords: ['sausage'], search: 'sausage' },
  { keywords: ['bacon'], search: 'bacon' },
  { keywords: ['ham'], search: 'ham' },
  { keywords: ['turkey'], search: 'turkey' },
  
  // Dairy
  { keywords: ['queso'], search: 'queso fresco' },
  { keywords: ['crema'], search: 'crema mexicana' },
  { keywords: ['yogurt'], search: 'yogurt' },
  { keywords: ['cheese'], search: 'cheese' },
  { keywords: ['milk'], search: 'milk' },
  { keywords: ['butter'], search: 'butter' },
  
  // Drinks
  { keywords: ['juice'], search: 'juice' },
  { keywords: ['soda'], search: 'soda' },
  { keywords: ['water'], search: 'water bottle' },
  { keywords: ['coffee'], search: 'coffee' },
  { keywords: ['tea'], search: 'tea' },
  
  // Snacks
  { keywords: ['chips'], search: 'potato chips' },
  { keywords: ['crackers'], search: 'crackers' },
  { keywords: ['nuts'], search: 'mixed nuts' },
  { keywords: ['candy'], search: 'candy' },
  { keywords: ['chocolate'], search: 'chocolate' },
  { keywords: ['gummy', 'gummi'], search: 'gummy candy' },
];

const imageCache = {};

async function findImageForType(searchTerm) {
  if (imageCache[searchTerm]) return imageCache[searchTerm];
  
  const product = await prisma.product.findFirst({
    where: {
      name: { contains: searchTerm, mode: 'insensitive' },
      sourceImageUrl: { not: null },
      NOT: { sourceImageUrl: { contains: 'missing-item' } }
    },
    select: { id: true, imageUrl: true, sourceImageUrl: true }
  });
  
  if (product && product.imageUrl) {
    imageCache[searchTerm] = product;
  }
  return product;
}

async function main() {
  console.log('=== Ethnic/specialty category image matching ===\n');
  
  const missing = await prisma.product.findMany({
    where: { sourceImageUrl: { contains: 'missing-item' } },
    select: { id: true, name: true }
  });
  
  console.log('Products missing:', missing.length);
  
  let recovered = 0;
  
  for (const product of missing) {
    const nameLower = product.name.toLowerCase();
    
    const matchedType = productTypes.find(t => 
      t.keywords.some(k => nameLower.includes(k))
    );
    
    if (!matchedType) continue;
    
    const sourceProduct = await findImageForType(matchedType.search);
    if (!sourceProduct || !sourceProduct.imageUrl) continue;
    
    const sourceFile = path.join(IMAGE_DIR, path.basename(sourceProduct.imageUrl));
    if (!fs.existsSync(sourceFile)) continue;
    
    const ext = path.extname(sourceFile);
    const destFile = path.join(IMAGE_DIR, product.id + ext);
    
    fs.copyFileSync(sourceFile, destFile);
    
    await prisma.product.update({
      where: { id: product.id },
      data: { 
        imageUrl: '/images/products/' + product.id + ext,
        sourceImageUrl: sourceProduct.sourceImageUrl
      }
    });
    
    recovered++;
  }
  
  console.log('Recovered via ethnic category match:', recovered);
  
  const stillMissing = await prisma.product.count({
    where: { sourceImageUrl: { contains: 'missing-item' } }
  });
  console.log('Still missing:', stillMissing);
  console.log('Coverage:', ((38397 - stillMissing) / 38397 * 100).toFixed(1) + '%');
  
  await prisma.$disconnect();
}

main().catch(console.error);
