const axios = require('axios');
const fs = require('fs');
const OXYLABS_USER = 'nesviostore_28WMp';
const OXYLABS_PASS = 'Nesviocomp23+';

// ~250 categories for 10K target (each returns ~40 products)
const CATEGORIES = [
  // === CANNED GOODS (expanded) ===
  'canned tomatoes', 'canned diced tomatoes', 'canned crushed tomatoes', 'tomato paste',
  'canned corn', 'canned green beans', 'canned peas', 'canned mixed vegetables',
  'canned carrots', 'canned beets', 'canned spinach', 'canned artichoke hearts',
  'canned mushrooms', 'canned olives', 'canned rotel',
  // === SOUPS ===
  'tomato soup', 'chicken noodle soup', 'cream of mushroom soup', 'cream of chicken soup',
  'vegetable soup', 'beef stew canned', 'clam chowder', 'minestrone soup',
  'canned chili', 'canned chili beans',
  // === CANNED PROTEIN ===
  'canned tuna', 'canned chicken', 'canned salmon', 'sardines canned',
  'canned spam', 'canned corned beef', 'vienna sausages canned', 'canned crab meat',
  // === CANNED FRUIT ===
  'canned peaches', 'canned pineapple', 'canned fruit cocktail', 'canned mandarin oranges',
  'canned pears', 'applesauce cups', 'canned cherries',
  // === PASTA & NOODLES ===
  'spaghetti pasta', 'penne pasta', 'rigatoni pasta', 'linguine pasta',
  'angel hair pasta', 'elbow macaroni', 'egg noodles', 'lasagna noodles',
  'ramen noodles', 'rice noodles', 'lo mein noodles',
  // === PASTA SAUCE ===
  'pasta sauce', 'marinara sauce', 'alfredo sauce', 'pesto sauce',
  // === RICE & GRAINS ===
  'white rice', 'brown rice', 'jasmine rice', 'basmati rice',
  'instant rice', 'yellow rice mix', 'wild rice',
  'quinoa', 'couscous', 'grits',
  // === BEANS & LEGUMES ===
  'black beans canned', 'pinto beans canned', 'kidney beans canned',
  'garbanzo beans canned', 'navy beans canned', 'refried beans',
  'lentils dry', 'split peas dry',
  // === CONDIMENTS ===
  'ketchup', 'mustard', 'yellow mustard', 'dijon mustard',
  'mayonnaise', 'relish', 'hot sauce', 'sriracha',
  'soy sauce', 'teriyaki sauce', 'worcestershire sauce',
  'steak sauce', 'barbecue sauce', 'buffalo sauce',
  // === COOKING OILS ===
  'olive oil', 'extra virgin olive oil', 'vegetable oil', 'canola oil',
  'coconut oil', 'avocado oil', 'sesame oil', 'cooking spray',
  // === VINEGAR ===
  'vinegar', 'apple cider vinegar', 'balsamic vinegar', 'rice vinegar',
  // === SALAD DRESSING ===
  'ranch dressing', 'italian dressing', 'caesar dressing', 'balsamic dressing',
  'thousand island dressing', 'honey mustard dressing',
  // === BREAKFAST CEREAL ===
  'cereal', 'cheerios', 'frosted flakes', 'granola',
  'oatmeal', 'instant oatmeal', 'cream of wheat',
  // === BREAKFAST ===
  'pancake mix', 'waffle mix', 'maple syrup', 'pancake syrup',
  // === SNACKS - CHIPS ===
  'potato chips', 'tortilla chips', 'pretzels', 'cheese puffs',
  'pork rinds', 'veggie chips', 'kettle chips',
  // === SNACKS - CRACKERS ===
  'crackers', 'saltine crackers', 'graham crackers', 'rice cakes',
  'animal crackers', 'cheese crackers',
  // === SNACKS - POPCORN & NUTS ===
  'microwave popcorn', 'mixed nuts', 'peanuts', 'almonds',
  'cashews', 'trail mix', 'sunflower seeds',
  // === SPREADS ===
  'peanut butter', 'almond butter', 'grape jelly', 'strawberry jam',
  'nutella', 'honey', 'marshmallow fluff',
  // === BAKING ===
  'all purpose flour', 'bread flour', 'cake flour',
  'granulated sugar', 'brown sugar', 'powdered sugar',
  'chocolate chips', 'baking soda', 'baking powder',
  'vanilla extract', 'cocoa powder', 'cornstarch',
  'evaporated milk', 'condensed milk', 'cream of tartar',
  'cake mix', 'brownie mix', 'muffin mix',
  'pie crust', 'frosting', 'food coloring',
  // === BEVERAGES ===
  'orange juice', 'apple juice', 'grape juice', 'cranberry juice',
  'lemonade', 'fruit punch',
  'coca cola soda', 'pepsi soda', 'ginger ale', 'sprite soda',
  'bottled water', 'sparkling water', 'coconut water',
  'ground coffee', 'instant coffee', 'coffee pods keurig',
  'tea bags', 'green tea bags', 'herbal tea',
  // === MILK ALTERNATIVES ===
  'coconut milk', 'almond milk shelf stable', 'oat milk shelf stable',
  // === MEXICAN FOOD ===
  'flour tortillas', 'corn tortillas', 'taco shells',
  'salsa', 'enchilada sauce', 'taco seasoning',
  'canned green chilies', 'canned jalapenos', 'queso dip',
  // === ASIAN FOOD ===
  'hoisin sauce', 'fish sauce', 'oyster sauce',
  'curry paste', 'thai curry sauce', 'chili garlic sauce',
  'mirin', 'stir fry sauce',
  // === BROTH & STOCK ===
  'chicken broth', 'beef broth', 'vegetable broth',
  'bone broth', 'chicken stock',
  // === GRAVY & SAUCE MIX ===
  'gravy mix', 'brown gravy', 'turkey gravy',
  // === CONVENIENCE ===
  'mac and cheese', 'hamburger helper', 'stuffing mix',
  'breadcrumbs', 'panko breadcrumbs', 'croutons',
  'instant mashed potatoes', 'rice a roni',
  // === SPICES & SEASONINGS ===
  'black pepper', 'garlic powder', 'onion powder',
  'paprika', 'cumin', 'chili powder', 'italian seasoning',
  'cinnamon', 'nutmeg', 'bay leaves',
  'salt', 'sea salt', 'seasoned salt',
  'adobo seasoning', 'cajun seasoning', 'everything bagel seasoning',
  'goya seasoning', 'lemon pepper seasoning',
  // === CARIBBEAN & LATIN ===
  'goya black beans', 'goya yellow rice', 'goya adobo',
  'plantain chips', 'badia complete seasoning',
  'sofrito', 'mojo sauce', 'sazon seasoning',
  'achiote paste', 'malta drink',
  // === DRIED GOODS ===
  'dried pasta', 'dried lentils', 'dried black beans',
  'cornmeal', 'masa harina', 'semolina flour',
  // === CANNED READY MEALS ===
  'canned ravioli', 'canned spaghetti', 'baked beans canned',
  'pork and beans', 'canned tamales',
];

var seen = {};
var products = [];

function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

function extractBrand(title) {
  var brands = [
    'Great Value', 'Del Monte', 'Green Giant', 'Goya', 'Heinz', 'Dole',
    'Progresso', 'Barilla', 'Prego', 'Ragu', 'Classico', 'Kraft',
    'Tabasco', 'Kikkoman', 'Cheerios', 'Quaker', 'Jif', 'Skippy',
    'Nutella', 'Gold Medal', 'Domino', 'McCormick', 'Tropicana',
    'Minute Maid', 'Coca-Cola', 'Pepsi', 'Folgers', 'Maxwell House',
    'Starbucks', 'Lipton', 'Carnation', 'Mission', 'Old El Paso',
    'Maruchan', 'Nissin', 'Swanson', 'Knorr', 'SPAM', 'Hormel',
    'Bumble Bee', 'StarKist', 'Iberia', 'Badia', 'Grace',
    'Campbells', 'Hunts', 'Libbys', 'Hellmanns', 'Frenchs',
    'Sweet Baby Rays', 'Hidden Valley', 'Lays', 'Smuckers',
    'Welchs', 'Hersheys', 'Annies', 'Chicken of the Sea', 'Bushs',
    'Bertolli', 'Raos', 'Newmans Own', 'Muir Glen', 'S&W',
    'Contadina', 'Rotel', 'Manwich', 'Dennisons', 'Nalley',
    'Pacific Foods', 'Imagine', 'Amy', 'Kettle Brand', 'Cape Cod',
    'Tostitos', 'Doritos', 'Fritos', 'Cheetos', 'Ruffles',
    'Pringles', 'Ritz', 'Triscuit', 'Wheat Thins', 'Cheez-It',
    'Goldfish', 'Orville Redenbacher', 'Pop Secret', 'Jolly Time',
    'Planters', 'Blue Diamond', 'Diamond', 'Fisher',
    'Peter Pan', 'Adams', 'Laura Scudder', 'Justin',
    'King Arthur', 'Pillsbury', 'Betty Crocker', 'Duncan Hines',
    'Ghirardelli', 'Nestle', 'Baker', 'Arm Hammer',
    'Clabber Girl', 'Rumford', 'Calumet',
    'Simply Orange', 'Mott', 'Ocean Spray', 'V8',
    'Dr Pepper', 'Mountain Dew', '7UP', 'Canada Dry',
    'La Croix', 'Perrier', 'San Pellegrino', 'Topo Chico',
    'Gevalia', 'Dunkin', 'Green Mountain', 'Lavazza',
    'Twinings', 'Celestial Seasonings', 'Tazo', 'Bigelow',
    'Silk', 'Califia', 'So Delicious',
    'Tio Pepe', 'Buen Gusto', 'Rica', 'Bravo', 'Conchita',
    'La Fe', 'La Costena', 'Herdez', 'Cholula', 'Valentina',
    'Zatarain', 'Tony Chachere', 'Slap Ya Mama', 'Emeril',
    'Thai Kitchen', 'Annie Chun', 'Kame', 'Lee Kum Kee', 'Dynasty',
    'Chef Boyardee', 'Van Camp', 'Bush',
  ];
  var lower = title.toLowerCase();
  for (var i = 0; i < brands.length; i++) {
    if (lower.startsWith(brands[i].toLowerCase())) return brands[i];
  }
  // Try first 2 words as brand
  var words = title.split(' ');
  return words.length >= 2 ? words.slice(0, 2).join(' ') : words[0] || '';
}

async function searchWalmart(query) {
  try {
    var r = await axios.post('https://realtime.oxylabs.io/v1/queries', {
      source: 'walmart_search', query: query, parse: true,
    }, { auth: { username: OXYLABS_USER, password: OXYLABS_PASS }, timeout: 60000 });
    var raw = r.data && r.data.results && r.data.results[0] && r.data.results[0].content && r.data.results[0].content.results;
    if (!raw) return [];
    var items = Array.isArray(raw) ? raw : Object.values(raw);
    var results = [];
    for (var j = 0; j < items.length; j++) {
      var item = items[j];
      if (!item.general || !item.general.title || !item.general.image) continue;
      if (item.general.sponsored) continue;
      var id = item.general.product_id;
      if (!id || seen[id]) continue;
      seen[id] = true;
      results.push({
        walmartId: id,
        name: item.general.title,
        brand: extractBrand(item.general.title),
        price: item.price ? item.price.price : null,
        imageUrl: item.general.image,
        category: query,
        rating: item.rating ? item.rating.rating : null,
        reviewCount: item.rating ? item.rating.count : 0,
        inStock: item.general.out_of_stock ? false : true,
        url: item.general.url ? 'https://www.walmart.com' + item.general.url : '',
      });
    }
    return results;
  } catch (e) {
    console.log(' Error: ' + (e.response ? e.response.status : e.message));
    return [];
  }
}

async function main() {
  console.log('Starting Walmart 10K scrape via Oxylabs');
  console.log('Categories: ' + CATEGORIES.length);
  console.log('Target: ~10,000 unique products');
  console.log('Estimated API credits: ' + CATEGORIES.length + '/2000\n');

  for (var i = 0; i < CATEGORIES.length; i++) {
    var cat = CATEGORIES[i];
    process.stdout.write('[' + (i+1) + '/' + CATEGORIES.length + '] ' + cat + '...');
    var results = await searchWalmart(cat);
    for (var k = 0; k < results.length; k++) products.push(results[k]);
    console.log(' ' + results.length + ' (total: ' + products.length + ')');

    if ((i+1) % 25 === 0) {
      fs.writeFileSync('walmart-products-10k-progress.json', JSON.stringify(products, null, 2));
      console.log('  >> Saved progress (' + products.length + ' products)\n');
    }
    await sleep(1500);
  }

  fs.writeFileSync('walmart-products-10k.json', JSON.stringify(products, null, 2));
  var brandSet = {};
  products.forEach(function(p) { if (p.brand) brandSet[p.brand] = true; });
  var withPrice = products.filter(function(p) { return p.price && p.price > 0; });
  var inStock = products.filter(function(p) { return p.inStock; });
  var withImages = products.filter(function(p) { return p.imageUrl; });

  console.log('\n=== DONE ===');
  console.log('Total: ' + products.length);
  console.log('With images: ' + withImages.length);
  console.log('With price: ' + withPrice.length);
  console.log('In stock: ' + inStock.length);
  console.log('Brands: ' + Object.keys(brandSet).length);
  console.log('API used: ' + CATEGORIES.length + '/2000');
  console.log('Saved to: walmart-products-10k.json');
}

main().catch(function(e) { console.error(e); process.exit(1); });
