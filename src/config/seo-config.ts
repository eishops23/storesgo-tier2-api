/**
 * StoresGo Hyper-Local SEO Configuration
 */

export const TIER1_CITIES = [
  { slug: 'miami', name: 'Miami', county: 'Miami-Dade', ethnicFocus: ['cuban', 'haitian', 'caribbean', 'latin'] },
  { slug: 'hialeah', name: 'Hialeah', county: 'Miami-Dade', ethnicFocus: ['cuban', 'latin'] },
  { slug: 'fort-lauderdale', name: 'Fort Lauderdale', county: 'Broward', ethnicFocus: ['caribbean', 'jamaican', 'latin'] },
  { slug: 'pembroke-pines', name: 'Pembroke Pines', county: 'Broward', ethnicFocus: ['jamaican', 'caribbean', 'latin'] },
  { slug: 'hollywood', name: 'Hollywood', county: 'Broward', ethnicFocus: ['caribbean', 'latin', 'haitian'] },
  { slug: 'miramar', name: 'Miramar', county: 'Broward', ethnicFocus: ['jamaican', 'caribbean', 'trinidadian'] },
  { slug: 'coral-springs', name: 'Coral Springs', county: 'Broward', ethnicFocus: ['caribbean', 'latin', 'asian'] },
  { slug: 'west-palm-beach', name: 'West Palm Beach', county: 'Palm Beach', ethnicFocus: ['caribbean', 'haitian', 'latin'] },
  { slug: 'miami-gardens', name: 'Miami Gardens', county: 'Miami-Dade', ethnicFocus: ['haitian', 'jamaican', 'caribbean'] },
  { slug: 'pompano-beach', name: 'Pompano Beach', county: 'Broward', ethnicFocus: ['haitian', 'caribbean', 'latin'] },
];

export const TIER2_CITIES = [
  { slug: 'davie', name: 'Davie', county: 'Broward', ethnicFocus: ['latin', 'caribbean'] },
  { slug: 'boca-raton', name: 'Boca Raton', county: 'Palm Beach', ethnicFocus: ['latin', 'asian', 'middle-eastern'] },
  { slug: 'homestead', name: 'Homestead', county: 'Miami-Dade', ethnicFocus: ['latin', 'caribbean', 'mexican'] },
  { slug: 'deerfield-beach', name: 'Deerfield Beach', county: 'Broward', ethnicFocus: ['caribbean', 'haitian', 'latin'] },
  { slug: 'plantation', name: 'Plantation', county: 'Broward', ethnicFocus: ['jamaican', 'caribbean', 'latin'] },
  { slug: 'sunrise', name: 'Sunrise', county: 'Broward', ethnicFocus: ['caribbean', 'jamaican', 'latin'] },
  { slug: 'miami-beach', name: 'Miami Beach', county: 'Miami-Dade', ethnicFocus: ['cuban', 'latin', 'caribbean'] },
  { slug: 'boynton-beach', name: 'Boynton Beach', county: 'Palm Beach', ethnicFocus: ['haitian', 'caribbean', 'latin'] },
  { slug: 'doral', name: 'Doral', county: 'Miami-Dade', ethnicFocus: ['venezuelan', 'colombian', 'latin'] },
  { slug: 'delray-beach', name: 'Delray Beach', county: 'Palm Beach', ethnicFocus: ['haitian', 'caribbean', 'latin'] },
  { slug: 'lauderhill', name: 'Lauderhill', county: 'Broward', ethnicFocus: ['jamaican', 'caribbean', 'trinidadian'] },
  { slug: 'tamarac', name: 'Tamarac', county: 'Broward', ethnicFocus: ['caribbean', 'jamaican', 'latin'] },
  { slug: 'north-miami', name: 'North Miami', county: 'Miami-Dade', ethnicFocus: ['haitian', 'caribbean', 'jamaican'] },
  { slug: 'margate', name: 'Margate', county: 'Broward', ethnicFocus: ['caribbean', 'jamaican', 'latin'] },
];

export const ETHNIC_NEIGHBORHOODS = [
  { slug: 'little-haiti', name: 'Little Haiti', parentCity: 'miami', county: 'Miami-Dade', ethnicFocus: ['haitian'] },
  { slug: 'little-havana', name: 'Little Havana', parentCity: 'miami', county: 'Miami-Dade', ethnicFocus: ['cuban', 'latin'] },
  { slug: 'kendall', name: 'Kendall', parentCity: 'miami', county: 'Miami-Dade', ethnicFocus: ['latin', 'cuban', 'colombian'] },
  { slug: 'westchester', name: 'Westchester', parentCity: 'miami', county: 'Miami-Dade', ethnicFocus: ['cuban', 'latin'] },
  { slug: 'sweetwater', name: 'Sweetwater', parentCity: 'miami', county: 'Miami-Dade', ethnicFocus: ['nicaraguan', 'latin'] },
  { slug: 'liberty-city', name: 'Liberty City', parentCity: 'miami', county: 'Miami-Dade', ethnicFocus: ['haitian', 'caribbean'] },
];

export const ETHNIC_CATEGORIES = [
  { slug: 'jamaican-grocery', name: 'Jamaican Grocery', cuisine: 'caribbean', keywords: ['jamaican food', 'jamaican grocery store'], description: 'Authentic Jamaican groceries including jerk seasonings, ackee, saltfish, and Caribbean staples.', topBrands: ['Grace', 'Walkerswood', 'Island Spice'] },
  { slug: 'caribbean-grocery', name: 'Caribbean Grocery', cuisine: 'caribbean', keywords: ['caribbean food', 'caribbean grocery store', 'west indian grocery'], description: 'Caribbean groceries from Jamaica, Trinidad, Barbados, and the islands.', topBrands: ['Grace', 'Chief', 'Baron'] },
  { slug: 'haitian-grocery', name: 'Haitian Grocery', cuisine: 'caribbean', keywords: ['haitian food', 'haitian grocery store'], description: 'Authentic Haitian groceries including pikliz, epis, and Creole cooking essentials.', topBrands: ['Chef Creole', 'Rebo', 'Maggi'] },
  { slug: 'trinidadian-grocery', name: 'Trinidadian Grocery', cuisine: 'caribbean', keywords: ['trinidadian food', 'trinidad grocery'], description: 'Trinidad & Tobago groceries including doubles supplies, curry, and pepper sauces.', topBrands: ['Chief', 'Matouk\'s', 'Baron'] },
  { slug: 'cuban-grocery', name: 'Cuban Grocery', cuisine: 'latin', keywords: ['cuban food', 'cuban grocery store'], description: 'Authentic Cuban groceries including mojo, black beans, and cafe Cubano.', topBrands: ['Goya', 'Iberia', 'Kirby'] },
  { slug: 'mexican-grocery', name: 'Mexican Grocery', cuisine: 'latin', keywords: ['mexican food', 'mexican grocery store', 'tienda mexicana'], description: 'Mexican groceries including masa, mole, chiles, and tortillas.', topBrands: ['Goya', 'La Costena', 'Herdez'] },
  { slug: 'latin-grocery', name: 'Latin Grocery', cuisine: 'latin', keywords: ['latin food', 'latin grocery store', 'hispanic market'], description: 'Latin American groceries from Mexico, Central America, and South America.', topBrands: ['Goya', 'Badia', 'Iberia'] },
  { slug: 'colombian-grocery', name: 'Colombian Grocery', cuisine: 'latin', keywords: ['colombian food', 'colombian grocery store'], description: 'Colombian groceries including arepas, panela, and Colombian coffee.', topBrands: ['Goya', 'Colombiana', 'Yupi'] },
  { slug: 'venezuelan-grocery', name: 'Venezuelan Grocery', cuisine: 'latin', keywords: ['venezuelan food', 'venezuelan grocery store'], description: 'Venezuelan groceries including Harina PAN, black beans, and arepas supplies.', topBrands: ['Harina PAN', 'Goya', 'Polar'] },
  { slug: 'asian-grocery', name: 'Asian Grocery', cuisine: 'asian', keywords: ['asian food', 'asian grocery store', 'asian market'], description: 'Asian groceries from China, Japan, Korea, Vietnam, and Southeast Asia.', topBrands: ['Lee Kum Kee', 'Kikkoman', 'Nissin'] },
  { slug: 'chinese-grocery', name: 'Chinese Grocery', cuisine: 'asian', keywords: ['chinese food', 'chinese grocery store'], description: 'Chinese groceries including soy sauce, hoisin, and dim sum supplies.', topBrands: ['Lee Kum Kee', 'Pearl River Bridge'] },
  { slug: 'indian-grocery', name: 'Indian Grocery', cuisine: 'asian', keywords: ['indian food', 'indian grocery store', 'desi grocery'], description: 'Indian groceries including spices, dal, basmati rice, and curry.', topBrands: ['MDH', 'Shan', 'Patak\'s'] },
  { slug: 'african-grocery', name: 'African Grocery', cuisine: 'african', keywords: ['african food', 'african grocery store'], description: 'African groceries from Nigeria, Ghana, Ethiopia, and across the continent.', topBrands: ['Maggi', 'Royco', 'Titus'] },
  { slug: 'nigerian-grocery', name: 'Nigerian Grocery', cuisine: 'african', keywords: ['nigerian food', 'nigerian grocery store'], description: 'Nigerian groceries including egusi, palm oil, garri, and jollof supplies.', topBrands: ['Maggi', 'Titus', 'Nina'] },
  { slug: 'middle-eastern-grocery', name: 'Middle Eastern Grocery', cuisine: 'middle-eastern', keywords: ['middle eastern food', 'arabic grocery', 'halal market'], description: 'Middle Eastern groceries including hummus, tahini, and halal products.', topBrands: ['Sadaf', 'Ziyad', 'Cortas'] },
  { slug: 'halal-grocery', name: 'Halal Grocery', cuisine: 'middle-eastern', keywords: ['halal food', 'halal grocery store', 'halal meat'], description: 'Halal-certified groceries and meats for Muslim dietary requirements.', topBrands: ['Saffron Road', 'Al Safa'] },
  { slug: 'ethnic-grocery', name: 'Ethnic Grocery', cuisine: 'international', keywords: ['ethnic food', 'ethnic grocery store', 'international market'], description: 'International and ethnic groceries from around the world.', topBrands: ['Grace', 'Goya', 'Lee Kum Kee'] },
  { slug: 'international-grocery', name: 'International Grocery', cuisine: 'international', keywords: ['international food', 'world market'], description: 'International groceries from every continent, delivered to your door.', topBrands: ['Goya', 'Lee Kum Kee', 'Grace'] },
];

export function getAllLocations() {
  return [
    ...TIER1_CITIES.map(c => ({ ...c, type: 'city', tier: 1 })),
    ...TIER2_CITIES.map(c => ({ ...c, type: 'city', tier: 2 })),
    ...ETHNIC_NEIGHBORHOODS.map(n => ({ ...n, type: 'neighborhood', tier: 3 })),
  ];
}

export function getLocationBySlug(slug: string) {
  return getAllLocations().find(l => l.slug === slug);
}

export function getCategoryBySlug(slug: string) {
  return ETHNIC_CATEGORIES.find(c => c.slug === slug);
}

export function generateHubPages() {
  const hubs: Array<{ location: any; category: any; url: string; priority: number }> = [];
  const allLocations = getAllLocations();
  const CUISINE_MAP: Record<string, string[]> = {
    'caribbean': ['caribbean', 'jamaican', 'haitian', 'trinidadian', 'bahamian'],
    'latin': ['latin', 'cuban', 'mexican', 'colombian', 'venezuelan', 'nicaraguan'],
    'asian': ['asian', 'chinese', 'japanese', 'korean', 'vietnamese', 'filipino', 'thai', 'indian'],
    'african': ['african', 'nigerian', 'ghanaian', 'ethiopian'],
    'middle-eastern': ['middle-eastern', 'halal'],
    'international': ['international'],
  };
  
  for (const location of allLocations) {
    for (const category of ETHNIC_CATEGORIES) {
      const cuisineEthnicities = CUISINE_MAP[category.cuisine] || [];
      const locationFocus = (location as any).ethnicFocus || [];
      const hasOverlap = cuisineEthnicities.some(c => locationFocus.includes(c));
      const isGeneric = ['ethnic-grocery', 'international-grocery'].includes(category.slug);
      
      if (hasOverlap || isGeneric) {
        const priority = (location as any).tier === 1 ? 0.9 : (location as any).tier === 2 ? 0.8 : 0.7;
        hubs.push({ location, category, url: `/${location.slug}/${category.slug}`, priority });
      }
    }
  }
  return hubs;
}
