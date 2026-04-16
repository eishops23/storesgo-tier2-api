const axios = require('axios');
const fs = require('fs');
const OXYLABS_USER = 'nesviostore_28WMp';
const OXYLABS_PASS = 'Nesviocomp23+';
const CATEGORIES = [
  'canned tomatoes', 'canned corn', 'canned green beans',
  'canned peas', 'canned mixed vegetables',
  'tomato soup', 'chicken noodle soup', 'cream of mushroom soup',
  'canned chili',
  'canned tuna', 'canned chicken', 'canned salmon', 'sardines canned',
  'canned peaches', 'canned pineapple', 'canned fruit cocktail',
  'spaghetti pasta', 'penne pasta', 'egg noodles', 'pasta sauce',
  'white rice', 'brown rice', 'jasmine rice', 'black beans canned',
  'pinto beans canned',
  'ketchup', 'mustard', 'mayonnaise', 'hot sauce', 'soy sauce',
  'olive oil', 'vegetable oil', 'vinegar',
  'cereal', 'oatmeal', 'pancake mix', 'maple syrup',
  'potato chips', 'tortilla chips', 'pretzels', 'crackers',
  'microwave popcorn',
  'peanut butter', 'grape jelly', 'nutella',
  'all purpose flour', 'granulated sugar', 'chocolate chips',
  'vanilla extract',
  'orange juice', 'apple juice', 'coca cola soda',
  'bottled water', 'ground coffee', 'tea bags',
  'evaporated milk', 'condensed milk', 'coconut milk',
  'flour tortillas', 'salsa', 'taco seasoning',
  'ramen noodles', 'sriracha',
  'chicken broth', 'beef broth', 'gravy mix',
  'mac and cheese', 'stuffing mix', 'breadcrumbs',
  'canned spam',
  'goya beans', 'goya seasoning', 'adobo seasoning',
  'plantain chips', 'coconut water',
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
    'Welchs', 'Hersheys', 'Annies', 'Chicken of the Sea', 'Bushs'
  ];
  var lower = title.toLowerCase();
  for (var i = 0; i < brands.length; i++) {
    if (lower.startsWith(brands[i].toLowerCase())) return brands[i];
  }
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
  console.log('Starting Walmart scrape via Oxylabs');
  console.log('Categories: ' + CATEGORIES.length + '\n');
  for (var i = 0; i < CATEGORIES.length; i++) {
    var cat = CATEGORIES[i];
    process.stdout.write('[' + (i+1) + '/' + CATEGORIES.length + '] ' + cat + '...');
    var results = await searchWalmart(cat);
    for (var k = 0; k < results.length; k++) products.push(results[k]);
    console.log(' ' + results.length + ' (total: ' + products.length + ')');
    if ((i+1) % 10 === 0) {
      fs.writeFileSync('walmart-products-progress.json', JSON.stringify(products, null, 2));
      console.log('  >> Saved progress\n');
    }
    await sleep(1500);
  }
  fs.writeFileSync('walmart-products.json', JSON.stringify(products, null, 2));
  var brandSet = {};
  products.forEach(function(p) { if (p.brand) brandSet[p.brand] = true; });
  console.log('\n=== DONE ===');
  console.log('Total: ' + products.length);
  console.log('With images: ' + products.filter(function(p) { return p.imageUrl; }).length);
  console.log('Brands: ' + Object.keys(brandSet).length);
  console.log('API used: ' + CATEGORIES.length + '/2000');
  console.log('Saved to: walmart-products.json');
}
main().catch(function(e) { console.error(e); process.exit(1); });
