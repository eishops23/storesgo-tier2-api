// ============================================
// B2B SEO DATA - ETHNIC FOOD WHOLESALE
// ============================================

export interface B2BRegion {
  slug: string;
  label: string;
  state: string;
  metros: B2BMetro[];
  primaryCuisines: string[]; // cuisine slugs prioritized for this region
}

export interface B2BMetro {
  slug: string;
  label: string;
  state: string;
  population: string;
  restaurantCount: string;
}

export interface B2BCuisine {
  slug: string;
  label: string;
  region: string; // caribbean, latin, asian, african, etc.
  flag: string;
  demandRegions: string[]; // which B2B regions have high demand
  popularProducts: string[];
  restaurantTypes: string[];
  avgOrderValue: number; // B2B average
}

export interface B2BBuyerType {
  slug: string;
  label: string;
  description: string;
  purchaseFrequency: string;
  avgMonthlySpend: string;
  commonProducts: string[];
}

// ============================================
// B2B REGIONS - Geographic Markets
// ============================================
export const B2B_REGIONS: B2BRegion[] = [
  {
    slug: "south-florida",
    label: "South Florida",
    state: "FL",
    metros: [
      { slug: "miami", label: "Miami", state: "FL", population: "450,000+", restaurantCount: "8,000+" },
      { slug: "miami-dade", label: "Miami-Dade County", state: "FL", population: "2.7M+", restaurantCount: "12,000+" },
      { slug: "broward", label: "Broward County", state: "FL", population: "1.9M+", restaurantCount: "6,500+" },
      { slug: "palm-beach", label: "Palm Beach County", state: "FL", population: "1.5M+", restaurantCount: "4,500+" },
      { slug: "fort-lauderdale", label: "Fort Lauderdale", state: "FL", population: "180,000+", restaurantCount: "2,000+" },
      { slug: "west-palm-beach", label: "West Palm Beach", state: "FL", population: "120,000+", restaurantCount: "1,200+" },
      { slug: "little-haiti", label: "Little Haiti", state: "FL", population: "35,000+", restaurantCount: "200+" },
      { slug: "hialeah", label: "Hialeah", state: "FL", population: "230,000+", restaurantCount: "1,500+" },
    ],
    primaryCuisines: ["haitian", "cuban", "jamaican", "colombian", "venezuelan", "dominican", "puerto-rican", "peruvian", "brazilian", "trinidadian", "mexican"]
  },
  {
    slug: "california",
    label: "California",
    state: "CA",
    metros: [
      { slug: "los-angeles", label: "Los Angeles", state: "CA", population: "4M+", restaurantCount: "25,000+" },
      { slug: "san-francisco", label: "San Francisco", state: "CA", population: "880,000+", restaurantCount: "6,000+" },
      { slug: "san-diego", label: "San Diego", state: "CA", population: "1.4M+", restaurantCount: "8,000+" },
      { slug: "orange-county", label: "Orange County", state: "CA", population: "3.2M+", restaurantCount: "10,000+" },
      { slug: "bay-area", label: "Bay Area", state: "CA", population: "7.7M+", restaurantCount: "18,000+" },
      { slug: "oakland", label: "Oakland", state: "CA", population: "430,000+", restaurantCount: "2,500+" },
      { slug: "san-jose", label: "San Jose", state: "CA", population: "1M+", restaurantCount: "4,000+" },
      { slug: "sacramento", label: "Sacramento", state: "CA", population: "525,000+", restaurantCount: "2,800+" },
    ],
    primaryCuisines: ["chinese", "vietnamese", "korean", "filipino", "thai", "japanese", "indian", "indonesian", "taiwanese", "mexican"]
  },
  {
    slug: "texas",
    label: "Texas",
    state: "TX",
    metros: [
      { slug: "houston", label: "Houston", state: "TX", population: "2.3M+", restaurantCount: "14,000+" },
      { slug: "dallas", label: "Dallas", state: "TX", population: "1.3M+", restaurantCount: "8,500+" },
      { slug: "san-antonio", label: "San Antonio", state: "TX", population: "1.5M+", restaurantCount: "6,000+" },
      { slug: "austin", label: "Austin", state: "TX", population: "1M+", restaurantCount: "5,500+" },
      { slug: "fort-worth", label: "Fort Worth", state: "TX", population: "950,000+", restaurantCount: "3,500+" },
    ],
    primaryCuisines: ["mexican", "salvadoran", "guatemalan", "honduran", "vietnamese", "indian", "chinese", "korean"]
  },
  {
    slug: "new-york",
    label: "New York Metro",
    state: "NY",
    metros: [
      { slug: "nyc", label: "New York City", state: "NY", population: "8.3M+", restaurantCount: "27,000+" },
      { slug: "brooklyn", label: "Brooklyn", state: "NY", population: "2.6M+", restaurantCount: "8,000+" },
      { slug: "queens", label: "Queens", state: "NY", population: "2.3M+", restaurantCount: "7,500+" },
      { slug: "bronx", label: "The Bronx", state: "NY", population: "1.4M+", restaurantCount: "3,500+" },
      { slug: "jersey-city", label: "Jersey City", state: "NJ", population: "290,000+", restaurantCount: "1,200+" },
      { slug: "newark", label: "Newark", state: "NJ", population: "310,000+", restaurantCount: "1,000+" },
    ],
    primaryCuisines: ["dominican", "puerto-rican", "jamaican", "haitian", "chinese", "mexican", "indian", "korean", "nigerian", "ethiopian", "ghanaian", "thai", "vietnamese", "colombian"]
  },
  {
    slug: "georgia",
    label: "Georgia",
    state: "GA",
    metros: [
      { slug: "atlanta", label: "Atlanta", state: "GA", population: "500,000+", restaurantCount: "5,500+" },
      { slug: "decatur", label: "Decatur", state: "GA", population: "25,000+", restaurantCount: "400+" },
      { slug: "gwinnett", label: "Gwinnett County", state: "GA", population: "950,000+", restaurantCount: "3,000+" },
    ],
    primaryCuisines: ["nigerian", "ethiopian", "ghanaian", "jamaican", "haitian", "mexican", "korean", "vietnamese", "indian"]
  }
];

// ============================================
// B2B CUISINES - Ethnic Food Categories
// ============================================
export const B2B_CUISINES: B2BCuisine[] = [
  // CARIBBEAN - South Florida / NYC Focus
  {
    slug: "haitian",
    label: "Haitian",
    region: "caribbean",
    flag: "🇭🇹",
    demandRegions: ["south-florida", "new-york", "georgia"],
    popularProducts: ["Djon djon mushrooms", "Epis seasoning", "Pikliz", "Haitian coffee", "Cassava flour", "Scotch bonnet peppers"],
    restaurantTypes: ["Haitian restaurants", "Caribbean fusion", "Soul food", "Catering companies"],
    avgOrderValue: 850
  },
  {
    slug: "jamaican",
    label: "Jamaican",
    region: "caribbean",
    flag: "🇯🇲",
    demandRegions: ["south-florida", "new-york", "georgia"],
    popularProducts: ["Jerk seasoning", "Ackee", "Scotch bonnet", "Grace products", "Jamaican patties", "Blue Mountain coffee"],
    restaurantTypes: ["Jamaican restaurants", "Caribbean grills", "Jerk spots", "Food trucks"],
    avgOrderValue: 920
  },
  {
    slug: "cuban",
    label: "Cuban",
    region: "caribbean",
    flag: "🇨🇺",
    demandRegions: ["south-florida", "new-york", "texas"],
    popularProducts: ["Cuban coffee", "Mojo criollo", "Guava paste", "Black beans", "Plantain chips", "Sazon"],
    restaurantTypes: ["Cuban restaurants", "Cafeterias", "Bakeries", "Coffee shops"],
    avgOrderValue: 780
  },
  {
    slug: "dominican",
    label: "Dominican",
    region: "caribbean",
    flag: "🇩🇴",
    demandRegions: ["new-york", "south-florida"],
    popularProducts: ["Sazon Goya", "Adobo", "Mofongo mix", "Plantains", "Dominican coffee", "Mamajuana ingredients"],
    restaurantTypes: ["Dominican restaurants", "Latin cafeterias", "Food trucks", "Catering"],
    avgOrderValue: 750
  },
  {
    slug: "puerto-rican",
    label: "Puerto Rican",
    region: "caribbean",
    flag: "🇵🇷",
    demandRegions: ["new-york", "south-florida"],
    popularProducts: ["Sofrito", "Adobo", "Goya products", "Recao", "Mofongo seasoning", "Café Bustelo"],
    restaurantTypes: ["Puerto Rican restaurants", "Latin diners", "Food trucks", "Catering companies"],
    avgOrderValue: 720
  },
  {
    slug: "trinidadian",
    label: "Trinidadian",
    region: "caribbean",
    flag: "🇹🇹",
    demandRegions: ["south-florida", "new-york"],
    popularProducts: ["Doubles ingredients", "Trinidad pepper sauce", "Curry powder", "Roti skins", "Chadon beni"],
    restaurantTypes: ["Trinidadian restaurants", "Roti shops", "Caribbean fusion"],
    avgOrderValue: 680
  },
  
  // LATIN AMERICAN - South Florida / Texas Focus
  {
    slug: "colombian",
    label: "Colombian",
    region: "latin",
    flag: "🇨🇴",
    demandRegions: ["south-florida", "new-york", "texas"],
    popularProducts: ["Arepas", "Colombian coffee", "Panela", "Chorizo", "Empanada shells", "Aji sauce"],
    restaurantTypes: ["Colombian restaurants", "Arepa spots", "Bakeries", "Coffee shops"],
    avgOrderValue: 820
  },
  {
    slug: "venezuelan",
    label: "Venezuelan",
    region: "latin",
    flag: "🇻🇪",
    demandRegions: ["south-florida", "texas"],
    popularProducts: ["Harina PAN", "Cachapas mix", "Venezuelan cheese", "Pabellon ingredients", "Tequeños"],
    restaurantTypes: ["Venezuelan restaurants", "Arepa houses", "Latin bakeries"],
    avgOrderValue: 790
  },
  {
    slug: "peruvian",
    label: "Peruvian",
    region: "latin",
    flag: "🇵🇪",
    demandRegions: ["south-florida", "california", "new-york"],
    popularProducts: ["Aji amarillo", "Peruvian corn", "Lucuma", "Pisco", "Ceviche ingredients", "Quinoa"],
    restaurantTypes: ["Peruvian restaurants", "Cevicherias", "Pollo a la brasa spots"],
    avgOrderValue: 950
  },
  {
    slug: "mexican",
    label: "Mexican",
    region: "latin",
    flag: "🇲🇽",
    demandRegions: ["texas", "california", "south-florida", "new-york", "georgia"],
    popularProducts: ["Corn tortillas", "Dried chilies", "Queso fresco", "Mole paste", "Tamarindo", "Mexican oregano"],
    restaurantTypes: ["Mexican restaurants", "Taquerias", "Tex-Mex", "Food trucks", "Catering"],
    avgOrderValue: 1200
  },
  {
    slug: "salvadoran",
    label: "Salvadoran",
    region: "latin",
    flag: "🇸🇻",
    demandRegions: ["texas", "california", "new-york"],
    popularProducts: ["Pupusa masa", "Curtido ingredients", "Loroco", "Salvadoran cream", "Horchata"],
    restaurantTypes: ["Salvadoran restaurants", "Pupuserias", "Latin cafeterias"],
    avgOrderValue: 650
  },
  {
    slug: "guatemalan",
    label: "Guatemalan",
    region: "latin",
    flag: "🇬🇹",
    demandRegions: ["texas", "california"],
    popularProducts: ["Black beans", "Pepian spices", "Guatemalan coffee", "Chirmol ingredients", "Tamale supplies"],
    restaurantTypes: ["Guatemalan restaurants", "Central American eateries"],
    avgOrderValue: 620
  },
  {
    slug: "honduran",
    label: "Honduran",
    region: "latin",
    flag: "🇭🇳",
    demandRegions: ["texas", "california"],
    popularProducts: ["Baleada supplies", "Honduran cream", "Platanos", "Honduran coffee", "Chimol ingredients"],
    restaurantTypes: ["Honduran restaurants", "Central American eateries", "Food trucks"],
    avgOrderValue: 580
  },
  {
    slug: "brazilian",
    label: "Brazilian",
    region: "latin",
    flag: "🇧🇷",
    demandRegions: ["south-florida", "new-york", "california"],
    popularProducts: ["Guarana", "Farofa", "Pão de queijo mix", "Brazilian coffee", "Açaí", "Feijoada ingredients"],
    restaurantTypes: ["Brazilian steakhouses", "Açaí shops", "Brazilian bakeries", "Churrascarias"],
    avgOrderValue: 1100
  },
  
  // ASIAN - California / NYC Focus
  {
    slug: "chinese",
    label: "Chinese",
    region: "asian",
    flag: "🇨🇳",
    demandRegions: ["california", "new-york", "texas"],
    popularProducts: ["Soy sauce", "Rice noodles", "Hoisin sauce", "Five spice", "Dim sum supplies", "Tea"],
    restaurantTypes: ["Chinese restaurants", "Dim sum houses", "Hot pot", "Noodle shops", "Takeout"],
    avgOrderValue: 1500
  },
  {
    slug: "vietnamese",
    label: "Vietnamese",
    region: "asian",
    flag: "🇻🇳",
    demandRegions: ["california", "texas", "new-york"],
    popularProducts: ["Fish sauce", "Rice paper", "Pho spices", "Sriracha", "Rice noodles", "Vietnamese coffee"],
    restaurantTypes: ["Pho restaurants", "Banh mi shops", "Vietnamese cafes", "Noodle houses"],
    avgOrderValue: 980
  },
  {
    slug: "korean",
    label: "Korean",
    region: "asian",
    flag: "🇰🇷",
    demandRegions: ["california", "new-york", "texas", "georgia"],
    popularProducts: ["Gochujang", "Kimchi", "Soju", "Korean BBQ supplies", "Doenjang", "Sesame oil"],
    restaurantTypes: ["Korean BBQ", "Korean fried chicken", "Tofu houses", "Korean cafes"],
    avgOrderValue: 1350
  },
  {
    slug: "filipino",
    label: "Filipino",
    region: "asian",
    flag: "🇵🇭",
    demandRegions: ["california", "new-york"],
    popularProducts: ["Calamansi", "Coconut vinegar", "Ube", "Lumpia wrappers", "Pancit noodles", "Adobo seasoning"],
    restaurantTypes: ["Filipino restaurants", "Turo-turo", "Filipino bakeries", "Catering"],
    avgOrderValue: 780
  },
  {
    slug: "thai",
    label: "Thai",
    region: "asian",
    flag: "🇹🇭",
    demandRegions: ["california", "new-york", "texas"],
    popularProducts: ["Curry paste", "Fish sauce", "Coconut milk", "Rice noodles", "Thai basil", "Pad Thai supplies"],
    restaurantTypes: ["Thai restaurants", "Noodle shops", "Thai street food", "Fusion"],
    avgOrderValue: 920
  },
  {
    slug: "japanese",
    label: "Japanese",
    region: "asian",
    flag: "🇯🇵",
    demandRegions: ["california", "new-york"],
    popularProducts: ["Sushi rice", "Nori", "Miso paste", "Soy sauce", "Wasabi", "Sake"],
    restaurantTypes: ["Sushi bars", "Ramen shops", "Izakayas", "Japanese steakhouses", "Udon shops"],
    avgOrderValue: 1800
  },
  {
    slug: "indian",
    label: "Indian",
    region: "asian",
    flag: "🇮🇳",
    demandRegions: ["california", "new-york", "texas", "georgia"],
    popularProducts: ["Basmati rice", "Spice blends", "Ghee", "Paneer", "Lentils", "Naan supplies"],
    restaurantTypes: ["Indian restaurants", "Curry houses", "Biryani spots", "Vegetarian Indian", "Catering"],
    avgOrderValue: 1100
  },
  {
    slug: "indonesian",
    label: "Indonesian",
    region: "asian",
    flag: "🇮🇩",
    demandRegions: ["california"],
    popularProducts: ["Sambal", "Kecap manis", "Tempeh", "Rendang paste", "Indonesian spices"],
    restaurantTypes: ["Indonesian restaurants", "Southeast Asian fusion"],
    avgOrderValue: 720
  },
  {
    slug: "taiwanese",
    label: "Taiwanese",
    region: "asian",
    flag: "🇹🇼",
    demandRegions: ["california", "new-york"],
    popularProducts: ["Boba supplies", "Five spice", "Taiwanese sausage", "Tea leaves", "Beef noodle supplies"],
    restaurantTypes: ["Bubble tea shops", "Taiwanese restaurants", "Night market style", "Hot pot"],
    avgOrderValue: 850
  },
  
  // AFRICAN - Atlanta / NYC Focus
  {
    slug: "nigerian",
    label: "Nigerian",
    region: "african",
    flag: "🇳🇬",
    demandRegions: ["georgia", "new-york", "texas"],
    popularProducts: ["Palm oil", "Egusi", "Stockfish", "Ogbono", "Nigerian spices", "Fufu flour"],
    restaurantTypes: ["Nigerian restaurants", "West African eateries", "Catering companies"],
    avgOrderValue: 920
  },
  {
    slug: "ethiopian",
    label: "Ethiopian",
    region: "african",
    flag: "🇪🇹",
    demandRegions: ["georgia", "new-york", "california"],
    popularProducts: ["Injera", "Berbere spice", "Mitmita", "Ethiopian coffee", "Teff flour", "Niter kibbeh"],
    restaurantTypes: ["Ethiopian restaurants", "East African eateries", "Coffee houses"],
    avgOrderValue: 780
  },
  {
    slug: "ghanaian",
    label: "Ghanaian",
    region: "african",
    flag: "🇬🇭",
    demandRegions: ["georgia", "new-york"],
    popularProducts: ["Palm oil", "Kenkey", "Shito sauce", "Fufu flour", "Ghanaian spices", "Smoked fish"],
    restaurantTypes: ["Ghanaian restaurants", "West African eateries"],
    avgOrderValue: 680
  }
];

// ============================================
// B2B BUYER TYPES
// ============================================
export const B2B_BUYER_TYPES: B2BBuyerType[] = [
  {
    slug: "restaurants",
    label: "Restaurants",
    description: "Full-service and quick-service restaurants specializing in ethnic cuisines",
    purchaseFrequency: "2-3x per week",
    avgMonthlySpend: "$3,000 - $15,000",
    commonProducts: ["Spices & seasonings", "Sauces", "Rice & grains", "Proteins", "Produce", "Specialty ingredients"]
  },
  {
    slug: "food-trucks",
    label: "Food Trucks",
    description: "Mobile food vendors serving ethnic cuisine at events and locations",
    purchaseFrequency: "2-4x per week",
    avgMonthlySpend: "$1,500 - $5,000",
    commonProducts: ["Tortillas", "Sauces", "Proteins", "Produce", "Packaging"]
  },
  {
    slug: "catering",
    label: "Catering Companies",
    description: "Event caterers specializing in ethnic and multicultural menus",
    purchaseFrequency: "Per event",
    avgMonthlySpend: "$2,000 - $20,000",
    commonProducts: ["Bulk proteins", "Rice & grains", "Spices", "Disposables", "Specialty items"]
  },
  {
    slug: "hotels",
    label: "Hotels & Resorts",
    description: "Hotel kitchens and resort restaurants with diverse menu offerings",
    purchaseFrequency: "Weekly",
    avgMonthlySpend: "$5,000 - $30,000",
    commonProducts: ["Breakfast items", "International ingredients", "Banquet supplies", "Beverages"]
  },
  {
    slug: "grocery-stores",
    label: "Grocery Stores",
    description: "Independent ethnic grocery stores and specialty markets",
    purchaseFrequency: "Weekly",
    avgMonthlySpend: "$5,000 - $25,000",
    commonProducts: ["Packaged goods", "Frozen items", "Beverages", "Snacks", "Canned goods"]
  },
  {
    slug: "schools",
    label: "Schools & Universities",
    description: "K-12 schools and university dining services with diverse menus",
    purchaseFrequency: "Weekly",
    avgMonthlySpend: "$10,000 - $50,000",
    commonProducts: ["Bulk grains", "Proteins", "Produce", "Packaged snacks", "Beverages"]
  },
  {
    slug: "healthcare",
    label: "Healthcare Facilities",
    description: "Hospitals and nursing homes with diverse patient populations",
    purchaseFrequency: "Weekly",
    avgMonthlySpend: "$8,000 - $40,000",
    commonProducts: ["Specialty diet items", "Cultural foods", "Produce", "Grains", "Low-sodium options"]
  },
  {
    slug: "corporate",
    label: "Corporate Cafeterias",
    description: "Corporate dining facilities serving diverse workforces",
    purchaseFrequency: "Weekly",
    avgMonthlySpend: "$5,000 - $25,000",
    commonProducts: ["International ingredients", "Healthy options", "Beverages", "Snacks"]
  }
];

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getB2BRegionBySlug(slug: string): B2BRegion | undefined {
  return B2B_REGIONS.find(r => r.slug === slug);
}

export function getB2BCuisineBySlug(slug: string): B2BCuisine | undefined {
  return B2B_CUISINES.find(c => c.slug === slug);
}

export function getB2BBuyerTypeBySlug(slug: string): B2BBuyerType | undefined {
  return B2B_BUYER_TYPES.find(b => b.slug === slug);
}

export function getCuisinesForRegion(regionSlug: string): B2BCuisine[] {
  const region = getB2BRegionBySlug(regionSlug);
  if (!region) return [];
  return B2B_CUISINES.filter(c => region.primaryCuisines.includes(c.slug));
}

export function getMetrosForRegion(regionSlug: string): B2BMetro[] {
  const region = getB2BRegionBySlug(regionSlug);
  return region?.metros || [];
}

// Generate all B2B wholesale page combinations
export function generateB2BWholesalePages(): Array<{cuisine: string, location: string, region: string}> {
  const pages: Array<{cuisine: string, location: string, region: string}> = [];
  
  for (const region of B2B_REGIONS) {
    for (const cuisine of getCuisinesForRegion(region.slug)) {
      // Region-level page
      pages.push({ cuisine: cuisine.slug, location: region.slug, region: region.slug });
      
      // Metro-level pages
      for (const metro of region.metros) {
        pages.push({ cuisine: cuisine.slug, location: metro.slug, region: region.slug });
      }
    }
  }
  
  return pages;
}

// Generate all B2B partner page combinations (for sellers/distributors)
export function generateB2BPartnerPages(): Array<{cuisine: string, location: string, region: string}> {
  // Same structure as wholesale for now
  return generateB2BWholesalePages();
}
