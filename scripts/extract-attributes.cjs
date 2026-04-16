const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DIETARY_KEYWORDS = {
  'organic': ['organic', 'organico', 'usda organic'],
  'gluten-free': ['gluten-free', 'gluten free', 'sin gluten', 'gf'],
  'vegan': ['vegan', 'vegano', 'plant-based', 'plant based'],
  'vegetarian': ['vegetarian', 'vegetariano'],
  'kosher': ['kosher', 'pareve', 'parve'],
  'halal': ['halal'],
  'sugar-free': ['sugar-free', 'sugar free', 'sin azucar', 'no sugar', 'zero sugar'],
  'low-sodium': ['low-sodium', 'low sodium', 'reduced sodium', 'no salt'],
  'non-gmo': ['non-gmo', 'non gmo', 'no gmo'],
  'dairy-free': ['dairy-free', 'dairy free', 'sin lactosa', 'lactose free', 'lactose-free'],
  'nut-free': ['nut-free', 'nut free', 'peanut free', 'tree nut free'],
  'keto': ['keto', 'ketogenic', 'keto friendly'],
  'paleo': ['paleo'],
  'whole-grain': ['whole grain', 'whole wheat', '100% whole'],
  'low-fat': ['low fat', 'low-fat', 'reduced fat', 'fat free'],
  'high-protein': ['high protein', 'protein rich']
};

const KNOWN_BRANDS = [
  // Caribbean/Latin
  'Goya', 'Grace', 'Iberia', 'Badia', 'La Fe', 'Bustelo', 'Pilon', 'Cafe La Llave',
  'Walkerswood', 'Ting', 'D&G', 'Jamaican Choice', 'Lasco', 'National', 'Eaton',
  'La Costena', 'Herdez', 'Jarritos', 'Jumex', 'Tajin', 'Valentina', 'Cholula',
  'El Mexicano', 'Don Julio', 'Dona Maria', 'San Marcos', 'Embasa', 'La Morena',
  'Takis', 'Bimbo', 'Marinela', 'Gamesa', 'Mission', 'Guerrero', 'Chi-Chi',
  // Asian
  'Kikkoman', 'Lee Kum Kee', 'Thai Kitchen', 'Nissin', 'Nongshim', 'Samyang',
  'Mama', 'Maggi', 'Sriracha', 'Huy Fong', 'Mae Ploy', 'Cock Brand', 'Aroy-D',
  'Pocky', 'Meiji', 'Lotte', 'Kasugai', 'Calbee', 'Shin Ramyun',
  // Major US Brands
  'Kraft', 'Heinz', 'Del Monte', 'Dole', 'Campbell', 'Progresso', 'Hunts',
  'Barilla', 'Ronzoni', 'Quaker', 'Kellogg', 'General Mills', 'Post', 'Nabisco',
  'Oreo', 'Ritz', 'Planters', 'Blue Diamond', 'Ocean Spray', 'Welch', 'Smucker',
  'Jif', 'Skippy', 'Nutella', 'Hershey', 'Mars', 'Nestle', 'Knorr',
  'Pepsi', 'Coca-Cola', 'Sprite', 'Fanta', 'Dr Pepper', 'Mountain Dew', 'Gatorade',
  'Tropicana', 'Minute Maid', 'Snapple', 'Lipton', 'Arizona', 'Starbucks',
  'Folgers', 'Maxwell House', 'Nescafe', 'McCormick', 'Lawry', 'Old Bay',
  'French', 'Hidden Valley', 'Ranch', 'Hellmann', 'Best Foods', 'Miracle Whip',
  'Oscar Mayer', 'Hormel', 'Spam', 'Tyson', 'Perdue', 'Ball Park', 'Hebrew National',
  'Oroweat', 'Sara Lee', 'Thomas', 'Pepperidge Farm', 'Wonder', 'Sunbeam',
  // Health/Organic
  'Organic Valley', 'Horizon', 'Silk', 'Almond Breeze', 'Oatly', 'Califia',
  'Kind', 'Clif', 'RxBar', 'Quest', 'Think', 'GoMacro', 'Larabar',
  'Annie', 'Amy', 'Cascadian Farm', 'Nature Valley', 'Kashi', 'Bear Naked',
  // Personal Care
  'Dove', 'Suave', 'Pantene', 'Head & Shoulders', 'Garnier', 'L\'Oreal',
  'Colgate', 'Crest', 'Sensodyne', 'Listerine', 'Scope',
  'Dial', 'Irish Spring', 'Lever 2000', 'Softsoap', 'Method',
  // Household
  'Tide', 'Gain', 'All', 'Arm & Hammer', 'OxiClean', 'Clorox', 'Lysol',
  'Bounty', 'Brawny', 'Scott', 'Charmin', 'Cottonelle', 'Kleenex', 'Puffs',
  'Ziploc', 'Glad', 'Hefty', 'Reynolds', 'Saran'
];

const ORIGIN_KEYWORDS = {
  'caribbean': ['caribbean', 'west indian', 'island'],
  'jamaica': ['jamaican', 'jamaica'],
  'puerto-rico': ['puerto rican', 'puerto rico', 'boricua'],
  'dominican': ['dominican', 'dominicano', 'quisqueya'],
  'mexico': ['mexican', 'mexico', 'mexicano'],
  'cuba': ['cuban', 'cuba', 'cubano'],
  'haiti': ['haitian', 'haiti'],
  'trinidad': ['trinidad', 'trinidadian', 'trini'],
  'guyana': ['guyanese', 'guyana'],
  'china': ['chinese', 'china'],
  'japan': ['japanese', 'japan'],
  'korea': ['korean', 'korea'],
  'thailand': ['thai', 'thailand'],
  'vietnam': ['vietnamese', 'vietnam'],
  'india': ['indian', 'india'],
  'philippines': ['filipino', 'philippines'],
  'italy': ['italian', 'italy', 'italiano'],
  'spain': ['spanish', 'spain', 'espanol']
};

function extractBrand(name) {
  const lower = name.toLowerCase();
  for (const brand of KNOWN_BRANDS) {
    if (lower.startsWith(brand.toLowerCase() + ' ') || 
        lower.startsWith(brand.toLowerCase() + "'") ||
        lower.includes(' ' + brand.toLowerCase() + ' ')) {
      return brand;
    }
  }
  // Check if first word might be brand (capitalized, not generic)
  const firstWord = name.split(/[\s,]+/)[0];
  if (firstWord && firstWord.length > 2 && /^[A-Z]/.test(firstWord)) {
    const generic = ['the', 'a', 'an', 'fresh', 'organic', 'natural', 'premium', 'value', 'great'];
    if (!generic.includes(firstWord.toLowerCase())) {
      return firstWord;
    }
  }
  return null;
}

function extractDietary(text) {
  const lower = text.toLowerCase();
  const found = [];
  for (const [key, keywords] of Object.entries(DIETARY_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) found.push(key);
  }
  return found;
}

function extractOrigin(text) {
  const lower = text.toLowerCase();
  const found = [];
  for (const [key, keywords] of Object.entries(ORIGIN_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) found.push(key);
  }
  return found;
}

async function main() {
  console.log('='.repeat(60));
  console.log('STORESGO ATTRIBUTE EXTRACTION - Production Scale');
  console.log('='.repeat(60));
  
  // Clear existing
  const deleted = await prisma.productAttribute.deleteMany({});
  console.log(`Cleared ${deleted.count} existing attributes`);
  
  // Ensure filter configs
  const configCount = await prisma.filterConfig.count();
  if (configCount === 0) {
    await prisma.filterConfig.createMany({
      data: [
        { categorySlug: null, filterKey: 'brand', displayName: 'Brand', filterType: 'checkbox', sortOrder: 1 },
        { categorySlug: null, filterKey: 'dietary', displayName: 'Dietary Preferences', filterType: 'checkbox', sortOrder: 2 },
        { categorySlug: null, filterKey: 'origin', displayName: 'Origin / Cuisine', filterType: 'checkbox', sortOrder: 3 },
        { categorySlug: null, filterKey: 'price', displayName: 'Price Range', filterType: 'range', sortOrder: 4 },
        { categorySlug: null, filterKey: 'store', displayName: 'Store', filterType: 'checkbox', sortOrder: 5 },
      ]
    });
    console.log('Created default filter configs');
  }
  
  const batchSize = 3000;
  let offset = 0;
  let totalProcessed = 0;
  let totalAttrs = 0;
  const startTime = Date.now();
  
  while (true) {
    const products = await prisma.product.findMany({
      skip: offset,
      take: batchSize,
      select: { id: true, name: true, description: true, aiTags: true, aiDescription: true }
    });
    
    if (products.length === 0) break;
    
    const attrs = [];
    
    for (const p of products) {
      const text = [p.name, p.description, p.aiDescription, ...(p.aiTags || [])].filter(Boolean).join(' ');
      
      const brand = extractBrand(p.name);
      if (brand) attrs.push({ productId: p.id, key: 'brand', value: brand });
      
      for (const d of extractDietary(text)) {
        attrs.push({ productId: p.id, key: 'dietary', value: d });
      }
      
      for (const o of extractOrigin(text)) {
        attrs.push({ productId: p.id, key: 'origin', value: o });
      }
    }
    
    if (attrs.length > 0) {
      const result = await prisma.productAttribute.createMany({
        data: attrs,
        skipDuplicates: true
      });
      totalAttrs += result.count;
    }
    
    totalProcessed += products.length;
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const rate = (totalProcessed / elapsed).toFixed(0);
    console.log(`Processed: ${totalProcessed} | Attributes: ${totalAttrs} | Rate: ${rate}/sec`);
    offset += batchSize;
  }
  
  // Final stats
  const stats = await prisma.productAttribute.groupBy({
    by: ['key'],
    _count: true,
    orderBy: { _count: { key: 'desc' } }
  });
  
  const uniqueBrands = await prisma.productAttribute.groupBy({
    by: ['value'],
    where: { key: 'brand' },
    _count: true,
    orderBy: { _count: { value: 'desc' } },
    take: 20
  });
  
  console.log('\n' + '='.repeat(60));
  console.log('EXTRACTION COMPLETE');
  console.log('='.repeat(60));
  console.log(`Total products: ${totalProcessed}`);
  console.log(`Total attributes: ${totalAttrs}`);
  console.log(`Time: ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
  console.log('\nAttributes by type:');
  stats.forEach(s => console.log(`  ${s.key}: ${s._count}`));
  console.log('\nTop 20 brands:');
  uniqueBrands.forEach(b => console.log(`  ${b.value}: ${b._count}`));
  
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
