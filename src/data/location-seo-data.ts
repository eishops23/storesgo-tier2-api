// ═══════════════════════════════════════════════════════════════════════════════
// STORESGO LOCATION SEO DATA
// 500+ US Cities × 28 Cuisines = 14,000+ Page Combinations
// ═══════════════════════════════════════════════════════════════════════════════

export interface City {
  slug: string;
  name: string;
  state: string;
  stateSlug: string;
  population: number;
  metros?: string[]; // Nearby metros for internal linking
  ethnicDemographics?: string[]; // Which cuisines are popular here
}

export interface State {
  slug: string;
  name: string;
  abbr: string;
  majorCities: string[];
}

export interface Cuisine {
  slug: string;
  name: string;
  flag: string;
  region: string;
  popularStates: string[]; // States with high demand
  searchTerms: string[]; // Common search variations
}

// ─────────────────────────────────────────────────────────────────────────────
// US STATES
// ─────────────────────────────────────────────────────────────────────────────

export const states: State[] = [
  { slug: "florida", name: "Florida", abbr: "FL", majorCities: ["miami", "orlando", "tampa", "jacksonville", "fort-lauderdale"] },
  { slug: "california", name: "California", abbr: "CA", majorCities: ["los-angeles", "san-francisco", "san-diego", "san-jose", "oakland"] },
  { slug: "texas", name: "Texas", abbr: "TX", majorCities: ["houston", "dallas", "san-antonio", "austin", "fort-worth"] },
  { slug: "new-york", name: "New York", abbr: "NY", majorCities: ["new-york-city", "brooklyn", "queens", "bronx", "buffalo"] },
  { slug: "georgia", name: "Georgia", abbr: "GA", majorCities: ["atlanta", "savannah", "augusta", "columbus", "macon"] },
  { slug: "illinois", name: "Illinois", abbr: "IL", majorCities: ["chicago", "aurora", "naperville", "joliet", "rockford"] },
  { slug: "new-jersey", name: "New Jersey", abbr: "NJ", majorCities: ["newark", "jersey-city", "paterson", "elizabeth", "edison"] },
  { slug: "pennsylvania", name: "Pennsylvania", abbr: "PA", majorCities: ["philadelphia", "pittsburgh", "allentown", "reading", "erie"] },
  { slug: "massachusetts", name: "Massachusetts", abbr: "MA", majorCities: ["boston", "worcester", "springfield", "cambridge", "lowell"] },
  { slug: "maryland", name: "Maryland", abbr: "MD", majorCities: ["baltimore", "silver-spring", "columbia", "germantown", "waldorf"] },
  { slug: "virginia", name: "Virginia", abbr: "VA", majorCities: ["virginia-beach", "norfolk", "chesapeake", "richmond", "arlington"] },
  { slug: "washington", name: "Washington", abbr: "WA", majorCities: ["seattle", "spokane", "tacoma", "vancouver", "bellevue"] },
  { slug: "arizona", name: "Arizona", abbr: "AZ", majorCities: ["phoenix", "tucson", "mesa", "chandler", "scottsdale"] },
  { slug: "colorado", name: "Colorado", abbr: "CO", majorCities: ["denver", "colorado-springs", "aurora", "fort-collins", "lakewood"] },
  { slug: "north-carolina", name: "North Carolina", abbr: "NC", majorCities: ["charlotte", "raleigh", "greensboro", "durham", "winston-salem"] },
  { slug: "michigan", name: "Michigan", abbr: "MI", majorCities: ["detroit", "grand-rapids", "warren", "sterling-heights", "ann-arbor"] },
  { slug: "ohio", name: "Ohio", abbr: "OH", majorCities: ["columbus", "cleveland", "cincinnati", "toledo", "akron"] },
  { slug: "tennessee", name: "Tennessee", abbr: "TN", majorCities: ["nashville", "memphis", "knoxville", "chattanooga", "clarksville"] },
  { slug: "nevada", name: "Nevada", abbr: "NV", majorCities: ["las-vegas", "henderson", "reno", "north-las-vegas", "sparks"] },
  { slug: "minnesota", name: "Minnesota", abbr: "MN", majorCities: ["minneapolis", "saint-paul", "rochester", "duluth", "bloomington"] },
  { slug: "connecticut", name: "Connecticut", abbr: "CT", majorCities: ["bridgeport", "new-haven", "stamford", "hartford", "waterbury"] },
  { slug: "louisiana", name: "Louisiana", abbr: "LA", majorCities: ["new-orleans", "baton-rouge", "shreveport", "lafayette", "lake-charles"] },
  { slug: "oregon", name: "Oregon", abbr: "OR", majorCities: ["portland", "salem", "eugene", "gresham", "hillsboro"] },
  { slug: "indiana", name: "Indiana", abbr: "IN", majorCities: ["indianapolis", "fort-wayne", "evansville", "south-bend", "carmel"] },
  { slug: "missouri", name: "Missouri", abbr: "MO", majorCities: ["kansas-city", "saint-louis", "springfield", "columbia", "independence"] },
  { slug: "wisconsin", name: "Wisconsin", abbr: "WI", majorCities: ["milwaukee", "madison", "green-bay", "kenosha", "racine"] },
  { slug: "south-carolina", name: "South Carolina", abbr: "SC", majorCities: ["charleston", "columbia", "north-charleston", "mount-pleasant", "rock-hill"] },
  { slug: "alabama", name: "Alabama", abbr: "AL", majorCities: ["birmingham", "montgomery", "huntsville", "mobile", "tuscaloosa"] },
  { slug: "oklahoma", name: "Oklahoma", abbr: "OK", majorCities: ["oklahoma-city", "tulsa", "norman", "broken-arrow", "lawton"] },
  { slug: "kentucky", name: "Kentucky", abbr: "KY", majorCities: ["louisville", "lexington", "bowling-green", "owensboro", "covington"] },
];

// ─────────────────────────────────────────────────────────────────────────────
// 500+ US CITIES (Major cities with significant ethnic food demand)
// ─────────────────────────────────────────────────────────────────────────────

export const cities: City[] = [
  // FLORIDA (Heavy Caribbean/Latin)
  { slug: "miami", name: "Miami", state: "Florida", stateSlug: "florida", population: 467963, ethnicDemographics: ["cuban", "haitian", "colombian", "venezuelan", "jamaican"] },
  { slug: "miami-beach", name: "Miami Beach", state: "Florida", stateSlug: "florida", population: 82890, ethnicDemographics: ["cuban", "colombian", "brazilian"] },
  { slug: "hialeah", name: "Hialeah", state: "Florida", stateSlug: "florida", population: 223109, ethnicDemographics: ["cuban", "nicaraguan", "honduran"] },
  { slug: "fort-lauderdale", name: "Fort Lauderdale", state: "Florida", stateSlug: "florida", population: 182760, ethnicDemographics: ["jamaican", "haitian", "bahamian"] },
  { slug: "hollywood-fl", name: "Hollywood", state: "Florida", stateSlug: "florida", population: 153627, ethnicDemographics: ["jamaican", "haitian", "colombian"] },
  { slug: "pembroke-pines", name: "Pembroke Pines", state: "Florida", stateSlug: "florida", population: 171178, ethnicDemographics: ["jamaican", "haitian", "trinidadian"] },
  { slug: "miramar", name: "Miramar", state: "Florida", stateSlug: "florida", population: 140823, ethnicDemographics: ["jamaican", "haitian", "trinidadian"] },
  { slug: "coral-springs", name: "Coral Springs", state: "Florida", stateSlug: "florida", population: 134394, ethnicDemographics: ["jamaican", "colombian", "venezuelan"] },
  { slug: "orlando", name: "Orlando", state: "Florida", stateSlug: "florida", population: 307573, ethnicDemographics: ["puerto-rican", "colombian", "brazilian", "haitian"] },
  { slug: "tampa", name: "Tampa", state: "Florida", stateSlug: "florida", population: 399700, ethnicDemographics: ["cuban", "puerto-rican", "colombian"] },
  { slug: "jacksonville", name: "Jacksonville", state: "Florida", stateSlug: "florida", population: 949611, ethnicDemographics: ["filipino", "vietnamese", "indian"] },
  { slug: "west-palm-beach", name: "West Palm Beach", state: "Florida", stateSlug: "florida", population: 117415, ethnicDemographics: ["haitian", "jamaican", "guatemalan"] },
  { slug: "boca-raton", name: "Boca Raton", state: "Florida", stateSlug: "florida", population: 99805, ethnicDemographics: ["colombian", "brazilian", "peruvian"] },
  { slug: "pompano-beach", name: "Pompano Beach", state: "Florida", stateSlug: "florida", population: 112046, ethnicDemographics: ["haitian", "jamaican", "bahamian"] },
  { slug: "doral", name: "Doral", state: "Florida", stateSlug: "florida", population: 74259, ethnicDemographics: ["venezuelan", "colombian", "cuban"] },
  { slug: "homestead", name: "Homestead", state: "Florida", stateSlug: "florida", population: 80327, ethnicDemographics: ["mexican", "guatemalan", "honduran"] },
  { slug: "north-miami", name: "North Miami", state: "Florida", stateSlug: "florida", population: 62822, ethnicDemographics: ["haitian", "jamaican", "bahamian"] },
  { slug: "north-miami-beach", name: "North Miami Beach", state: "Florida", stateSlug: "florida", population: 44748, ethnicDemographics: ["haitian", "jamaican", "russian"] },
  { slug: "kissimmee", name: "Kissimmee", state: "Florida", stateSlug: "florida", population: 79226, ethnicDemographics: ["puerto-rican", "colombian", "mexican"] },
  { slug: "lauderhill", name: "Lauderhill", state: "Florida", stateSlug: "florida", population: 74752, ethnicDemographics: ["jamaican", "haitian", "trinidadian"] },
  { slug: "sunrise", name: "Sunrise", state: "Florida", stateSlug: "florida", population: 97335, ethnicDemographics: ["jamaican", "haitian", "colombian"] },
  { slug: "plantation", name: "Plantation", state: "Florida", stateSlug: "florida", population: 94580, ethnicDemographics: ["jamaican", "haitian", "indian"] },
  { slug: "davie", name: "Davie", state: "Florida", stateSlug: "florida", population: 105691, ethnicDemographics: ["colombian", "venezuelan", "peruvian"] },
  { slug: "delray-beach", name: "Delray Beach", state: "Florida", stateSlug: "florida", population: 69451, ethnicDemographics: ["haitian", "jamaican", "guatemalan"] },
  { slug: "boynton-beach", name: "Boynton Beach", state: "Florida", stateSlug: "florida", population: 80380, ethnicDemographics: ["haitian", "jamaican", "guatemalan"] },
  
  // CALIFORNIA (Heavy Asian/Latin)
  { slug: "los-angeles", name: "Los Angeles", state: "California", stateSlug: "california", population: 3898747, ethnicDemographics: ["mexican", "korean", "chinese", "filipino", "salvadoran", "guatemalan", "japanese", "thai", "vietnamese"] },
  { slug: "san-francisco", name: "San Francisco", state: "California", stateSlug: "california", population: 873965, ethnicDemographics: ["chinese", "filipino", "vietnamese", "japanese", "korean", "mexican"] },
  { slug: "san-diego", name: "San Diego", state: "California", stateSlug: "california", population: 1386932, ethnicDemographics: ["mexican", "filipino", "vietnamese", "chinese", "japanese"] },
  { slug: "san-jose", name: "San Jose", state: "California", stateSlug: "california", population: 1013240, ethnicDemographics: ["vietnamese", "chinese", "filipino", "mexican", "indian"] },
  { slug: "oakland", name: "Oakland", state: "California", stateSlug: "california", population: 433031, ethnicDemographics: ["chinese", "vietnamese", "mexican", "ethiopian", "eritrean"] },
  { slug: "long-beach", name: "Long Beach", state: "California", stateSlug: "california", population: 466742, ethnicDemographics: ["cambodian", "mexican", "filipino", "vietnamese"] },
  { slug: "fresno", name: "Fresno", state: "California", stateSlug: "california", population: 542107, ethnicDemographics: ["mexican", "hmong", "armenian", "filipino"] },
  { slug: "sacramento", name: "Sacramento", state: "California", stateSlug: "california", population: 524943, ethnicDemographics: ["mexican", "chinese", "vietnamese", "hmong", "filipino"] },
  { slug: "anaheim", name: "Anaheim", state: "California", stateSlug: "california", population: 350365, ethnicDemographics: ["mexican", "vietnamese", "korean", "filipino"] },
  { slug: "santa-ana", name: "Santa Ana", state: "California", stateSlug: "california", population: 310227, ethnicDemographics: ["mexican", "salvadoran", "guatemalan", "vietnamese"] },
  { slug: "riverside", name: "Riverside", state: "California", stateSlug: "california", population: 314998, ethnicDemographics: ["mexican", "filipino", "vietnamese", "chinese"] },
  { slug: "stockton", name: "Stockton", state: "California", stateSlug: "california", population: 320804, ethnicDemographics: ["mexican", "filipino", "cambodian", "vietnamese"] },
  { slug: "irvine", name: "Irvine", state: "California", stateSlug: "california", population: 307670, ethnicDemographics: ["chinese", "korean", "indian", "persian", "japanese"] },
  { slug: "fremont", name: "Fremont", state: "California", stateSlug: "california", population: 230504, ethnicDemographics: ["indian", "chinese", "filipino", "afghan"] },
  { slug: "glendale", name: "Glendale", state: "California", stateSlug: "california", population: 196543, ethnicDemographics: ["armenian", "korean", "filipino", "mexican"] },
  { slug: "huntington-beach", name: "Huntington Beach", state: "California", stateSlug: "california", population: 198711, ethnicDemographics: ["vietnamese", "mexican", "chinese", "korean"] },
  { slug: "garden-grove", name: "Garden Grove", state: "California", stateSlug: "california", population: 172646, ethnicDemographics: ["vietnamese", "korean", "mexican", "filipino"] },
  { slug: "santa-clarita", name: "Santa Clarita", state: "California", stateSlug: "california", population: 228673, ethnicDemographics: ["mexican", "filipino", "korean", "indian"] },
  { slug: "torrance", name: "Torrance", state: "California", stateSlug: "california", population: 145006, ethnicDemographics: ["japanese", "korean", "chinese", "filipino"] },
  { slug: "pomona", name: "Pomona", state: "California", stateSlug: "california", population: 151348, ethnicDemographics: ["mexican", "filipino", "vietnamese", "chinese"] },
  { slug: "pasadena", name: "Pasadena", state: "California", stateSlug: "california", population: 138699, ethnicDemographics: ["mexican", "chinese", "armenian", "filipino"] },
  { slug: "el-monte", name: "El Monte", state: "California", stateSlug: "california", population: 113475, ethnicDemographics: ["chinese", "vietnamese", "mexican", "filipino"] },
  { slug: "downey", name: "Downey", state: "California", stateSlug: "california", population: 111772, ethnicDemographics: ["mexican", "cuban", "guatemalan", "filipino"] },
  { slug: "west-covina", name: "West Covina", state: "California", stateSlug: "california", population: 106098, ethnicDemographics: ["chinese", "filipino", "mexican", "vietnamese"] },
  { slug: "costa-mesa", name: "Costa Mesa", state: "California", stateSlug: "california", population: 112174, ethnicDemographics: ["mexican", "vietnamese", "korean", "chinese"] },
  { slug: "inglewood", name: "Inglewood", state: "California", stateSlug: "california", population: 107762, ethnicDemographics: ["mexican", "ethiopian", "jamaican", "salvadoran"] },
  { slug: "burbank", name: "Burbank", state: "California", stateSlug: "california", population: 107337, ethnicDemographics: ["armenian", "mexican", "korean", "filipino"] },
  { slug: "san-mateo", name: "San Mateo", state: "California", stateSlug: "california", population: 105661, ethnicDemographics: ["chinese", "filipino", "japanese", "mexican"] },
  { slug: "daly-city", name: "Daly City", state: "California", stateSlug: "california", population: 104901, ethnicDemographics: ["filipino", "chinese", "mexican", "vietnamese"] },
  { slug: "alhambra", name: "Alhambra", state: "California", stateSlug: "california", population: 83089, ethnicDemographics: ["chinese", "vietnamese", "mexican", "taiwanese"] },
  { slug: "monterey-park", name: "Monterey Park", state: "California", stateSlug: "california", population: 60269, ethnicDemographics: ["chinese", "vietnamese", "taiwanese", "mexican"] },
  { slug: "arcadia", name: "Arcadia", state: "California", stateSlug: "california", population: 57939, ethnicDemographics: ["chinese", "taiwanese", "korean", "vietnamese"] },
  { slug: "rowland-heights", name: "Rowland Heights", state: "California", stateSlug: "california", population: 48993, ethnicDemographics: ["chinese", "taiwanese", "korean", "filipino"] },
  { slug: "san-gabriel", name: "San Gabriel", state: "California", stateSlug: "california", population: 40275, ethnicDemographics: ["chinese", "vietnamese", "taiwanese", "mexican"] },
  { slug: "westminster", name: "Westminster", state: "California", stateSlug: "california", population: 91137, ethnicDemographics: ["vietnamese", "korean", "chinese", "mexican"] },
  
  // TEXAS (Heavy Latin/Asian)
  { slug: "houston", name: "Houston", state: "Texas", stateSlug: "texas", population: 2304580, ethnicDemographics: ["mexican", "vietnamese", "chinese", "indian", "nigerian", "salvadoran", "honduran"] },
  { slug: "dallas", name: "Dallas", state: "Texas", stateSlug: "texas", population: 1304379, ethnicDemographics: ["mexican", "vietnamese", "indian", "ethiopian", "nigerian", "korean"] },
  { slug: "san-antonio", name: "San Antonio", state: "Texas", stateSlug: "texas", population: 1547253, ethnicDemographics: ["mexican", "salvadoran", "vietnamese", "filipino"] },
  { slug: "austin", name: "Austin", state: "Texas", stateSlug: "texas", population: 978908, ethnicDemographics: ["mexican", "vietnamese", "indian", "korean", "chinese", "ethiopian"] },
  { slug: "fort-worth", name: "Fort Worth", state: "Texas", stateSlug: "texas", population: 918915, ethnicDemographics: ["mexican", "vietnamese", "burmese", "indian"] },
  { slug: "el-paso", name: "El Paso", state: "Texas", stateSlug: "texas", population: 678815, ethnicDemographics: ["mexican"] },
  { slug: "arlington-tx", name: "Arlington", state: "Texas", stateSlug: "texas", population: 394266, ethnicDemographics: ["mexican", "vietnamese", "indian", "korean"] },
  { slug: "plano", name: "Plano", state: "Texas", stateSlug: "texas", population: 285494, ethnicDemographics: ["indian", "chinese", "korean", "vietnamese", "mexican"] },
  { slug: "irving", name: "Irving", state: "Texas", stateSlug: "texas", population: 256684, ethnicDemographics: ["indian", "mexican", "vietnamese", "bangladeshi"] },
  { slug: "garland", name: "Garland", state: "Texas", stateSlug: "texas", population: 239928, ethnicDemographics: ["vietnamese", "mexican", "indian", "korean"] },
  { slug: "frisco", name: "Frisco", state: "Texas", stateSlug: "texas", population: 200490, ethnicDemographics: ["indian", "chinese", "korean", "mexican"] },
  { slug: "mckinney", name: "McKinney", state: "Texas", stateSlug: "texas", population: 195308, ethnicDemographics: ["indian", "chinese", "mexican", "korean"] },
  { slug: "richardson", name: "Richardson", state: "Texas", stateSlug: "texas", population: 116783, ethnicDemographics: ["chinese", "indian", "vietnamese", "korean"] },
  { slug: "sugar-land", name: "Sugar Land", state: "Texas", stateSlug: "texas", population: 111026, ethnicDemographics: ["indian", "chinese", "pakistani", "vietnamese"] },
  { slug: "katy", name: "Katy", state: "Texas", stateSlug: "texas", population: 21894, ethnicDemographics: ["indian", "chinese", "vietnamese", "nigerian"] },
  { slug: "pasadena-tx", name: "Pasadena", state: "Texas", stateSlug: "texas", population: 151950, ethnicDemographics: ["mexican", "salvadoran", "honduran", "guatemalan"] },
  { slug: "bellaire", name: "Bellaire", state: "Texas", stateSlug: "texas", population: 18971, ethnicDemographics: ["chinese", "vietnamese", "indian", "korean"] },
  
  // NEW YORK (Everything)
  { slug: "new-york-city", name: "New York City", state: "New York", stateSlug: "new-york", population: 8336817, ethnicDemographics: ["dominican", "chinese", "jamaican", "haitian", "mexican", "indian", "korean", "filipino", "japanese", "nigerian", "ghanaian", "ethiopian", "colombian", "ecuadorian", "peruvian", "bangladeshi", "pakistani", "trinidadian", "guyanese"] },
  { slug: "brooklyn", name: "Brooklyn", state: "New York", stateSlug: "new-york", population: 2559903, ethnicDemographics: ["jamaican", "haitian", "trinidadian", "guyanese", "chinese", "dominican", "mexican", "russian", "polish", "italian"] },
  { slug: "queens", name: "Queens", state: "New York", stateSlug: "new-york", population: 2253858, ethnicDemographics: ["chinese", "korean", "indian", "filipino", "bangladeshi", "colombian", "ecuadorian", "mexican", "guyanese", "trinidadian"] },
  { slug: "bronx", name: "Bronx", state: "New York", stateSlug: "new-york", population: 1418207, ethnicDemographics: ["dominican", "puerto-rican", "jamaican", "mexican", "ghanaian", "nigerian"] },
  { slug: "manhattan", name: "Manhattan", state: "New York", stateSlug: "new-york", population: 1628706, ethnicDemographics: ["chinese", "korean", "japanese", "indian", "dominican", "mexican"] },
  { slug: "staten-island", name: "Staten Island", state: "New York", stateSlug: "new-york", population: 476143, ethnicDemographics: ["mexican", "chinese", "filipino", "indian", "sri-lankan"] },
  { slug: "yonkers", name: "Yonkers", state: "New York", stateSlug: "new-york", population: 211569, ethnicDemographics: ["jamaican", "mexican", "dominican", "indian"] },
  { slug: "buffalo", name: "Buffalo", state: "New York", stateSlug: "new-york", population: 278349, ethnicDemographics: ["burmese", "somali", "ethiopian", "puerto-rican"] },
  { slug: "rochester", name: "Rochester", state: "New York", stateSlug: "new-york", population: 211328, ethnicDemographics: ["puerto-rican", "jamaican", "vietnamese", "somali"] },
  { slug: "flushing", name: "Flushing", state: "New York", stateSlug: "new-york", population: 176000, ethnicDemographics: ["chinese", "korean", "taiwanese", "japanese"] },
  { slug: "jamaica-ny", name: "Jamaica", state: "New York", stateSlug: "new-york", population: 216866, ethnicDemographics: ["jamaican", "guyanese", "trinidadian", "haitian", "indian"] },
  { slug: "jackson-heights", name: "Jackson Heights", state: "New York", stateSlug: "new-york", population: 108152, ethnicDemographics: ["colombian", "ecuadorian", "indian", "bangladeshi", "mexican", "tibetan", "nepali"] },
  { slug: "astoria", name: "Astoria", state: "New York", stateSlug: "new-york", population: 154000, ethnicDemographics: ["greek", "egyptian", "moroccan", "bangladeshi", "colombian", "ecuadorian"] },
  { slug: "corona", name: "Corona", state: "New York", stateSlug: "new-york", population: 109000, ethnicDemographics: ["mexican", "ecuadorian", "colombian", "dominican", "chinese"] },
  { slug: "elmhurst", name: "Elmhurst", state: "New York", stateSlug: "new-york", population: 88427, ethnicDemographics: ["chinese", "korean", "filipino", "colombian", "ecuadorian", "indian"] },
  { slug: "flatbush", name: "Flatbush", state: "New York", stateSlug: "new-york", population: 110000, ethnicDemographics: ["jamaican", "haitian", "trinidadian", "guyanese", "bangladeshi"] },
  { slug: "east-flatbush", name: "East Flatbush", state: "New York", stateSlug: "new-york", population: 94000, ethnicDemographics: ["jamaican", "haitian", "trinidadian", "guyanese"] },
  { slug: "crown-heights", name: "Crown Heights", state: "New York", stateSlug: "new-york", population: 96000, ethnicDemographics: ["jamaican", "trinidadian", "guyanese", "haitian"] },
  { slug: "canarsie", name: "Canarsie", state: "New York", stateSlug: "new-york", population: 93000, ethnicDemographics: ["jamaican", "haitian", "guyanese", "trinidadian"] },
  { slug: "harlem", name: "Harlem", state: "New York", stateSlug: "new-york", population: 116000, ethnicDemographics: ["dominican", "mexican", "senegalese", "ghanaian", "ethiopian"] },
  { slug: "washington-heights", name: "Washington Heights", state: "New York", stateSlug: "new-york", population: 153000, ethnicDemographics: ["dominican", "mexican", "ecuadorian"] },
  { slug: "sunset-park", name: "Sunset Park", state: "New York", stateSlug: "new-york", population: 126000, ethnicDemographics: ["chinese", "mexican", "dominican", "ecuadorian"] },
  { slug: "bensonhurst", name: "Bensonhurst", state: "New York", stateSlug: "new-york", population: 151000, ethnicDemographics: ["chinese", "russian", "italian", "pakistani"] },
  
  // GEORGIA (African/Caribbean/Latin)
  { slug: "atlanta", name: "Atlanta", state: "Georgia", stateSlug: "georgia", population: 498715, ethnicDemographics: ["ethiopian", "nigerian", "ghanaian", "jamaican", "mexican", "korean", "vietnamese", "indian"] },
  { slug: "savannah", name: "Savannah", state: "Georgia", stateSlug: "georgia", population: 147780, ethnicDemographics: ["mexican", "vietnamese", "jamaican"] },
  { slug: "augusta", name: "Augusta", state: "Georgia", stateSlug: "georgia", population: 202081, ethnicDemographics: ["korean", "vietnamese", "mexican"] },
  { slug: "columbus-ga", name: "Columbus", state: "Georgia", stateSlug: "georgia", population: 206922, ethnicDemographics: ["mexican", "korean", "vietnamese"] },
  { slug: "macon", name: "Macon", state: "Georgia", stateSlug: "georgia", population: 157346, ethnicDemographics: ["mexican", "vietnamese", "indian"] },
  { slug: "sandy-springs", name: "Sandy Springs", state: "Georgia", stateSlug: "georgia", population: 108080, ethnicDemographics: ["indian", "korean", "chinese", "ethiopian"] },
  { slug: "roswell", name: "Roswell", state: "Georgia", stateSlug: "georgia", population: 92833, ethnicDemographics: ["mexican", "indian", "korean", "chinese"] },
  { slug: "johns-creek", name: "Johns Creek", state: "Georgia", stateSlug: "georgia", population: 82453, ethnicDemographics: ["indian", "korean", "chinese", "vietnamese"] },
  { slug: "alpharetta", name: "Alpharetta", state: "Georgia", stateSlug: "georgia", population: 65818, ethnicDemographics: ["indian", "korean", "chinese", "vietnamese"] },
  { slug: "marietta", name: "Marietta", state: "Georgia", stateSlug: "georgia", population: 60972, ethnicDemographics: ["mexican", "korean", "vietnamese", "indian"] },
  { slug: "decatur", name: "Decatur", state: "Georgia", stateSlug: "georgia", population: 24928, ethnicDemographics: ["ethiopian", "eritrean", "nigerian", "indian"] },
  { slug: "duluth-ga", name: "Duluth", state: "Georgia", stateSlug: "georgia", population: 29538, ethnicDemographics: ["korean", "vietnamese", "chinese", "indian"] },
  { slug: "lawrenceville", name: "Lawrenceville", state: "Georgia", stateSlug: "georgia", population: 30493, ethnicDemographics: ["korean", "vietnamese", "mexican", "indian"] },
  { slug: "clarkston", name: "Clarkston", state: "Georgia", stateSlug: "georgia", population: 13921, ethnicDemographics: ["ethiopian", "eritrean", "somali", "burmese", "vietnamese", "bhutanese"] },
  { slug: "norcross", name: "Norcross", state: "Georgia", stateSlug: "georgia", population: 18039, ethnicDemographics: ["mexican", "guatemalan", "vietnamese", "korean"] },
  { slug: "doraville", name: "Doraville", state: "Georgia", stateSlug: "georgia", population: 10584, ethnicDemographics: ["korean", "vietnamese", "chinese", "mexican", "burmese"] },
  { slug: "chamblee", name: "Chamblee", state: "Georgia", stateSlug: "georgia", population: 30544, ethnicDemographics: ["vietnamese", "korean", "chinese", "mexican", "guatemalan"] },
  { slug: "stone-mountain", name: "Stone Mountain", state: "Georgia", stateSlug: "georgia", population: 6281, ethnicDemographics: ["vietnamese", "indian", "jamaican", "ethiopian"] },
  { slug: "buford-highway", name: "Buford Highway", state: "Georgia", stateSlug: "georgia", population: 50000, ethnicDemographics: ["korean", "vietnamese", "chinese", "mexican", "salvadoran"] },
  
  // NEW JERSEY (Everything - gateway state)
  { slug: "newark", name: "Newark", state: "New Jersey", stateSlug: "new-jersey", population: 311549, ethnicDemographics: ["portuguese", "brazilian", "dominican", "ecuadorian", "haitian", "jamaican"] },
  { slug: "jersey-city", name: "Jersey City", state: "New Jersey", stateSlug: "new-jersey", population: 292449, ethnicDemographics: ["indian", "filipino", "dominican", "egyptian", "korean"] },
  { slug: "paterson", name: "Paterson", state: "New Jersey", stateSlug: "new-jersey", population: 159732, ethnicDemographics: ["dominican", "peruvian", "bangladeshi", "arab", "turkish"] },
  { slug: "elizabeth", name: "Elizabeth", state: "New Jersey", stateSlug: "new-jersey", population: 137298, ethnicDemographics: ["colombian", "cuban", "portuguese", "salvadoran", "haitian"] },
  { slug: "edison", name: "Edison", state: "New Jersey", stateSlug: "new-jersey", population: 107588, ethnicDemographics: ["indian", "chinese", "filipino", "korean"] },
  { slug: "woodbridge", name: "Woodbridge", state: "New Jersey", stateSlug: "new-jersey", population: 103639, ethnicDemographics: ["indian", "filipino", "chinese", "korean"] },
  { slug: "toms-river", name: "Toms River", state: "New Jersey", stateSlug: "new-jersey", population: 95438, ethnicDemographics: ["indian", "chinese", "filipino", "mexican"] },
  { slug: "clifton", name: "Clifton", state: "New Jersey", stateSlug: "new-jersey", population: 90296, ethnicDemographics: ["turkish", "colombian", "peruvian", "polish"] },
  { slug: "trenton", name: "Trenton", state: "New Jersey", stateSlug: "new-jersey", population: 90871, ethnicDemographics: ["guatemalan", "dominican", "jamaican", "puerto-rican"] },
  { slug: "camden", name: "Camden", state: "New Jersey", stateSlug: "new-jersey", population: 73562, ethnicDemographics: ["puerto-rican", "dominican", "vietnamese", "mexican"] },
  { slug: "passaic", name: "Passaic", state: "New Jersey", stateSlug: "new-jersey", population: 72918, ethnicDemographics: ["mexican", "dominican", "peruvian", "ecuadorian"] },
  { slug: "union-city-nj", name: "Union City", state: "New Jersey", stateSlug: "new-jersey", population: 73999, ethnicDemographics: ["cuban", "dominican", "ecuadorian", "colombian"] },
  { slug: "north-bergen", name: "North Bergen", state: "New Jersey", stateSlug: "new-jersey", population: 65386, ethnicDemographics: ["cuban", "colombian", "indian", "filipino"] },
  { slug: "perth-amboy", name: "Perth Amboy", state: "New Jersey", stateSlug: "new-jersey", population: 55436, ethnicDemographics: ["dominican", "mexican", "puerto-rican", "ecuadorian"] },
  { slug: "west-new-york", name: "West New York", state: "New Jersey", stateSlug: "new-jersey", population: 54472, ethnicDemographics: ["cuban", "colombian", "dominican", "ecuadorian"] },
  { slug: "plainfield", name: "Plainfield", state: "New Jersey", stateSlug: "new-jersey", population: 54586, ethnicDemographics: ["haitian", "jamaican", "mexican", "guatemalan"] },
  { slug: "east-orange", name: "East Orange", state: "New Jersey", stateSlug: "new-jersey", population: 69815, ethnicDemographics: ["haitian", "jamaican", "nigerian", "ghanaian"] },
  { slug: "irvington", name: "Irvington", state: "New Jersey", stateSlug: "new-jersey", population: 60000, ethnicDemographics: ["haitian", "jamaican", "nigerian", "ecuadorian"] },
  { slug: "fort-lee", name: "Fort Lee", state: "New Jersey", stateSlug: "new-jersey", population: 40350, ethnicDemographics: ["korean", "chinese", "japanese", "indian"] },
  { slug: "palisades-park", name: "Palisades Park", state: "New Jersey", stateSlug: "new-jersey", population: 20718, ethnicDemographics: ["korean", "chinese", "japanese"] },
  
  // ILLINOIS (Heavy Polish/Mexican/Asian)
  { slug: "chicago", name: "Chicago", state: "Illinois", stateSlug: "illinois", population: 2746388, ethnicDemographics: ["mexican", "polish", "chinese", "indian", "filipino", "korean", "vietnamese", "guatemalan", "puerto-rican", "jamaican", "nigerian", "ethiopian"] },
  { slug: "aurora-il", name: "Aurora", state: "Illinois", stateSlug: "illinois", population: 180542, ethnicDemographics: ["mexican", "indian", "filipino", "guatemalan"] },
  { slug: "naperville", name: "Naperville", state: "Illinois", stateSlug: "illinois", population: 149540, ethnicDemographics: ["indian", "chinese", "korean", "filipino"] },
  { slug: "joliet", name: "Joliet", state: "Illinois", stateSlug: "illinois", population: 150362, ethnicDemographics: ["mexican", "polish", "filipino", "indian"] },
  { slug: "rockford", name: "Rockford", state: "Illinois", stateSlug: "illinois", population: 148655, ethnicDemographics: ["mexican", "vietnamese", "laotian", "burmese"] },
  { slug: "elgin", name: "Elgin", state: "Illinois", stateSlug: "illinois", population: 114797, ethnicDemographics: ["mexican", "laotian", "vietnamese", "indian"] },
  { slug: "schaumburg", name: "Schaumburg", state: "Illinois", stateSlug: "illinois", population: 78723, ethnicDemographics: ["indian", "korean", "chinese", "filipino", "polish"] },
  { slug: "skokie", name: "Skokie", state: "Illinois", stateSlug: "illinois", population: 67824, ethnicDemographics: ["indian", "korean", "filipino", "assyrian", "russian"] },
  { slug: "des-plaines", name: "Des Plaines", state: "Illinois", stateSlug: "illinois", population: 60675, ethnicDemographics: ["polish", "filipino", "indian", "korean", "mexican"] },
  { slug: "evanston", name: "Evanston", state: "Illinois", stateSlug: "illinois", population: 78110, ethnicDemographics: ["nigerian", "ethiopian", "indian", "chinese", "korean"] },
  { slug: "cicero", name: "Cicero", state: "Illinois", stateSlug: "illinois", population: 80796, ethnicDemographics: ["mexican", "polish", "guatemalan", "ecuadorian"] },
  { slug: "berwyn", name: "Berwyn", state: "Illinois", stateSlug: "illinois", population: 54850, ethnicDemographics: ["mexican", "czech", "polish", "guatemalan"] },
  { slug: "waukegan", name: "Waukegan", state: "Illinois", stateSlug: "illinois", population: 89321, ethnicDemographics: ["mexican", "puerto-rican", "guatemalan", "filipino"] },
  { slug: "arlington-heights", name: "Arlington Heights", state: "Illinois", stateSlug: "illinois", population: 77676, ethnicDemographics: ["indian", "korean", "chinese", "polish", "filipino"] },
  { slug: "palatine", name: "Palatine", state: "Illinois", stateSlug: "illinois", population: 69144, ethnicDemographics: ["indian", "filipino", "korean", "polish", "mexican"] },
  { slug: "mount-prospect", name: "Mount Prospect", state: "Illinois", stateSlug: "illinois", population: 54505, ethnicDemographics: ["polish", "indian", "korean", "filipino"] },
  { slug: "chinatown-chicago", name: "Chinatown Chicago", state: "Illinois", stateSlug: "illinois", population: 30000, ethnicDemographics: ["chinese", "vietnamese", "thai", "malaysian"] },
  { slug: "pilsen", name: "Pilsen", state: "Illinois", stateSlug: "illinois", population: 38000, ethnicDemographics: ["mexican", "czech", "polish", "guatemalan"] },
  { slug: "little-village", name: "Little Village", state: "Illinois", stateSlug: "illinois", population: 79000, ethnicDemographics: ["mexican", "guatemalan", "honduran", "salvadoran"] },
  { slug: "humboldt-park", name: "Humboldt Park", state: "Illinois", stateSlug: "illinois", population: 56000, ethnicDemographics: ["puerto-rican", "mexican", "guatemalan"] },
  { slug: "rogers-park", name: "Rogers Park", state: "Illinois", stateSlug: "illinois", population: 55000, ethnicDemographics: ["indian", "nigerian", "ethiopian", "jamaican", "mexican"] },
  { slug: "devon-avenue", name: "Devon Avenue", state: "Illinois", stateSlug: "illinois", population: 40000, ethnicDemographics: ["indian", "pakistani", "bangladeshi", "assyrian", "russian"] },
  { slug: "argyle-street", name: "Argyle Street", state: "Illinois", stateSlug: "illinois", population: 25000, ethnicDemographics: ["vietnamese", "thai", "chinese", "laotian"] },
  
  // MASSACHUSETTS
  { slug: "boston", name: "Boston", state: "Massachusetts", stateSlug: "massachusetts", population: 675647, ethnicDemographics: ["haitian", "dominican", "chinese", "vietnamese", "jamaican", "brazilian", "irish", "italian", "cape-verdean"] },
  { slug: "worcester", name: "Worcester", state: "Massachusetts", stateSlug: "massachusetts", population: 206518, ethnicDemographics: ["vietnamese", "ghanaian", "dominican", "brazilian", "albanian"] },
  { slug: "springfield-ma", name: "Springfield", state: "Massachusetts", stateSlug: "massachusetts", population: 155929, ethnicDemographics: ["puerto-rican", "dominican", "jamaican", "vietnamese"] },
  { slug: "cambridge", name: "Cambridge", state: "Massachusetts", stateSlug: "massachusetts", population: 118977, ethnicDemographics: ["haitian", "chinese", "indian", "ethiopian", "brazilian"] },
  { slug: "lowell", name: "Lowell", state: "Massachusetts", stateSlug: "massachusetts", population: 115554, ethnicDemographics: ["cambodian", "vietnamese", "brazilian", "dominican"] },
  { slug: "brockton", name: "Brockton", state: "Massachusetts", stateSlug: "massachusetts", population: 105643, ethnicDemographics: ["haitian", "cape-verdean", "jamaican", "brazilian"] },
  { slug: "quincy", name: "Quincy", state: "Massachusetts", stateSlug: "massachusetts", population: 101636, ethnicDemographics: ["chinese", "vietnamese", "brazilian", "indian"] },
  { slug: "somerville", name: "Somerville", state: "Massachusetts", stateSlug: "massachusetts", population: 81360, ethnicDemographics: ["haitian", "brazilian", "salvadoran", "chinese"] },
  { slug: "lynn", name: "Lynn", state: "Massachusetts", stateSlug: "massachusetts", population: 101253, ethnicDemographics: ["dominican", "guatemalan", "cambodian", "vietnamese"] },
  { slug: "malden", name: "Malden", state: "Massachusetts", stateSlug: "massachusetts", population: 66263, ethnicDemographics: ["chinese", "haitian", "brazilian", "moroccan"] },
  { slug: "dorchester", name: "Dorchester", state: "Massachusetts", stateSlug: "massachusetts", population: 150000, ethnicDemographics: ["haitian", "vietnamese", "cape-verdean", "jamaican", "irish"] },
  { slug: "mattapan", name: "Mattapan", state: "Massachusetts", stateSlug: "massachusetts", population: 40000, ethnicDemographics: ["haitian", "jamaican", "trinidadian", "cape-verdean"] },
  { slug: "roxbury", name: "Roxbury", state: "Massachusetts", stateSlug: "massachusetts", population: 59000, ethnicDemographics: ["haitian", "dominican", "cape-verdean", "jamaican"] },
  { slug: "jamaica-plain", name: "Jamaica Plain", state: "Massachusetts", stateSlug: "massachusetts", population: 40000, ethnicDemographics: ["dominican", "cuban", "colombian", "haitian"] },
  { slug: "east-boston", name: "East Boston", state: "Massachusetts", stateSlug: "massachusetts", population: 47000, ethnicDemographics: ["colombian", "salvadoran", "guatemalan", "brazilian"] },
  { slug: "chinatown-boston", name: "Chinatown Boston", state: "Massachusetts", stateSlug: "massachusetts", population: 10000, ethnicDemographics: ["chinese", "vietnamese", "thai", "malaysian"] },
  
  // MARYLAND / DC AREA
  { slug: "baltimore", name: "Baltimore", state: "Maryland", stateSlug: "maryland", population: 585708, ethnicDemographics: ["ethiopian", "nigerian", "jamaican", "korean", "chinese", "mexican"] },
  { slug: "silver-spring", name: "Silver Spring", state: "Maryland", stateSlug: "maryland", population: 81015, ethnicDemographics: ["ethiopian", "salvadoran", "chinese", "indian", "jamaican", "nigerian"] },
  { slug: "columbia-md", name: "Columbia", state: "Maryland", stateSlug: "maryland", population: 104681, ethnicDemographics: ["korean", "indian", "ethiopian", "chinese"] },
  { slug: "germantown-md", name: "Germantown", state: "Maryland", stateSlug: "maryland", population: 90676, ethnicDemographics: ["indian", "chinese", "korean", "ethiopian", "salvadoran"] },
  { slug: "waldorf", name: "Waldorf", state: "Maryland", stateSlug: "maryland", population: 77205, ethnicDemographics: ["jamaican", "nigerian", "indian", "filipino"] },
  { slug: "rockville", name: "Rockville", state: "Maryland", stateSlug: "maryland", population: 68401, ethnicDemographics: ["chinese", "indian", "korean", "vietnamese", "ethiopian"] },
  { slug: "gaithersburg", name: "Gaithersburg", state: "Maryland", stateSlug: "maryland", population: 69657, ethnicDemographics: ["indian", "chinese", "korean", "salvadoran", "ethiopian"] },
  { slug: "bethesda", name: "Bethesda", state: "Maryland", stateSlug: "maryland", population: 65313, ethnicDemographics: ["chinese", "indian", "korean", "persian"] },
  { slug: "college-park", name: "College Park", state: "Maryland", stateSlug: "maryland", population: 32303, ethnicDemographics: ["indian", "chinese", "korean", "ethiopian"] },
  { slug: "langley-park", name: "Langley Park", state: "Maryland", stateSlug: "maryland", population: 19391, ethnicDemographics: ["salvadoran", "guatemalan", "honduran", "ethiopian"] },
  { slug: "wheaton-md", name: "Wheaton", state: "Maryland", stateSlug: "maryland", population: 51444, ethnicDemographics: ["salvadoran", "ethiopian", "vietnamese", "chinese"] },
  { slug: "takoma-park", name: "Takoma Park", state: "Maryland", stateSlug: "maryland", population: 17703, ethnicDemographics: ["ethiopian", "salvadoran", "jamaican", "indian"] },
  { slug: "hyattsville", name: "Hyattsville", state: "Maryland", stateSlug: "maryland", population: 18267, ethnicDemographics: ["salvadoran", "guatemalan", "ethiopian", "indian"] },
  
  // VIRGINIA / DC SUBURBS
  { slug: "virginia-beach", name: "Virginia Beach", state: "Virginia", stateSlug: "virginia", population: 459470, ethnicDemographics: ["filipino", "vietnamese", "korean", "mexican"] },
  { slug: "norfolk", name: "Norfolk", state: "Virginia", stateSlug: "virginia", population: 244076, ethnicDemographics: ["filipino", "vietnamese", "jamaican", "nigerian"] },
  { slug: "chesapeake", name: "Chesapeake", state: "Virginia", stateSlug: "virginia", population: 249422, ethnicDemographics: ["filipino", "vietnamese", "jamaican", "indian"] },
  { slug: "richmond", name: "Richmond", state: "Virginia", stateSlug: "virginia", population: 226610, ethnicDemographics: ["mexican", "indian", "chinese", "vietnamese", "ethiopian"] },
  { slug: "arlington-va", name: "Arlington", state: "Virginia", stateSlug: "virginia", population: 238643, ethnicDemographics: ["salvadoran", "vietnamese", "ethiopian", "indian", "korean"] },
  { slug: "alexandria", name: "Alexandria", state: "Virginia", stateSlug: "virginia", population: 159467, ethnicDemographics: ["ethiopian", "salvadoran", "indian", "vietnamese"] },
  { slug: "fairfax", name: "Fairfax", state: "Virginia", stateSlug: "virginia", population: 24483, ethnicDemographics: ["korean", "indian", "vietnamese", "chinese"] },
  { slug: "annandale", name: "Annandale", state: "Virginia", stateSlug: "virginia", population: 43423, ethnicDemographics: ["korean", "vietnamese", "bolivian", "salvadoran"] },
  { slug: "falls-church", name: "Falls Church", state: "Virginia", stateSlug: "virginia", population: 14617, ethnicDemographics: ["vietnamese", "korean", "salvadoran", "indian"] },
  { slug: "centreville", name: "Centreville", state: "Virginia", stateSlug: "virginia", population: 74470, ethnicDemographics: ["korean", "indian", "vietnamese", "chinese"] },
  { slug: "seven-corners", name: "Seven Corners", state: "Virginia", stateSlug: "virginia", population: 10000, ethnicDemographics: ["vietnamese", "korean", "salvadoran", "bolivian"] },
  { slug: "eden-center", name: "Eden Center", state: "Virginia", stateSlug: "virginia", population: 5000, ethnicDemographics: ["vietnamese"] },
  { slug: "herndon", name: "Herndon", state: "Virginia", stateSlug: "virginia", population: 25088, ethnicDemographics: ["indian", "korean", "chinese", "salvadoran"] },
  { slug: "reston", name: "Reston", state: "Virginia", stateSlug: "virginia", population: 63000, ethnicDemographics: ["indian", "korean", "chinese", "vietnamese"] },
  { slug: "sterling", name: "Sterling", state: "Virginia", stateSlug: "virginia", population: 30069, ethnicDemographics: ["indian", "korean", "salvadoran", "guatemalan"] },
  
  // WASHINGTON STATE
  { slug: "seattle", name: "Seattle", state: "Washington", stateSlug: "washington", population: 737015, ethnicDemographics: ["chinese", "vietnamese", "filipino", "korean", "japanese", "ethiopian", "somali", "mexican", "indian"] },
  { slug: "spokane", name: "Spokane", state: "Washington", stateSlug: "washington", population: 228989, ethnicDemographics: ["vietnamese", "russian", "ukrainian", "mexican"] },
  { slug: "tacoma", name: "Tacoma", state: "Washington", stateSlug: "washington", population: 219346, ethnicDemographics: ["vietnamese", "korean", "samoan", "mexican", "cambodian"] },
  { slug: "vancouver-wa", name: "Vancouver", state: "Washington", stateSlug: "washington", population: 190915, ethnicDemographics: ["russian", "ukrainian", "vietnamese", "mexican"] },
  { slug: "bellevue", name: "Bellevue", state: "Washington", stateSlug: "washington", population: 151854, ethnicDemographics: ["chinese", "indian", "korean", "japanese", "vietnamese"] },
  { slug: "kent", name: "Kent", state: "Washington", stateSlug: "washington", population: 136588, ethnicDemographics: ["vietnamese", "somali", "mexican", "indian", "ukrainian"] },
  { slug: "everett", name: "Everett", state: "Washington", stateSlug: "washington", population: 110629, ethnicDemographics: ["mexican", "vietnamese", "russian", "ukrainian"] },
  { slug: "renton", name: "Renton", state: "Washington", stateSlug: "washington", population: 106785, ethnicDemographics: ["vietnamese", "chinese", "ethiopian", "somali", "indian"] },
  { slug: "federal-way", name: "Federal Way", state: "Washington", stateSlug: "washington", population: 101030, ethnicDemographics: ["korean", "vietnamese", "samoan", "filipino", "mexican"] },
  { slug: "kirkland", name: "Kirkland", state: "Washington", stateSlug: "washington", population: 92175, ethnicDemographics: ["chinese", "indian", "korean", "japanese"] },
  { slug: "redmond", name: "Redmond", state: "Washington", stateSlug: "washington", population: 73256, ethnicDemographics: ["indian", "chinese", "korean", "japanese", "russian"] },
  { slug: "tukwila", name: "Tukwila", state: "Washington", stateSlug: "washington", population: 21798, ethnicDemographics: ["somali", "vietnamese", "burmese", "bhutanese", "nepali"] },
  { slug: "seatac", name: "SeaTac", state: "Washington", stateSlug: "washington", population: 31180, ethnicDemographics: ["somali", "ethiopian", "vietnamese", "mexican", "samoan"] },
  { slug: "burien", name: "Burien", state: "Washington", stateSlug: "washington", population: 52066, ethnicDemographics: ["mexican", "vietnamese", "somali", "cambodian"] },
  { slug: "white-center", name: "White Center", state: "Washington", stateSlug: "washington", population: 15000, ethnicDemographics: ["vietnamese", "somali", "cambodian", "mexican", "samoan"] },
  { slug: "international-district", name: "International District", state: "Washington", stateSlug: "washington", population: 12000, ethnicDemographics: ["chinese", "vietnamese", "japanese", "filipino", "korean"] },
  
  // ARIZONA
  { slug: "phoenix", name: "Phoenix", state: "Arizona", stateSlug: "arizona", population: 1680992, ethnicDemographics: ["mexican", "chinese", "vietnamese", "indian", "filipino", "korean"] },
  { slug: "tucson", name: "Tucson", state: "Arizona", stateSlug: "arizona", population: 548073, ethnicDemographics: ["mexican", "chinese", "vietnamese", "korean"] },
  { slug: "mesa", name: "Mesa", state: "Arizona", stateSlug: "arizona", population: 518012, ethnicDemographics: ["mexican", "chinese", "vietnamese", "indian"] },
  { slug: "chandler", name: "Chandler", state: "Arizona", stateSlug: "arizona", population: 275987, ethnicDemographics: ["indian", "chinese", "mexican", "korean", "vietnamese"] },
  { slug: "scottsdale", name: "Scottsdale", state: "Arizona", stateSlug: "arizona", population: 258069, ethnicDemographics: ["indian", "chinese", "korean", "japanese", "mexican"] },
  { slug: "gilbert", name: "Gilbert", state: "Arizona", stateSlug: "arizona", population: 267918, ethnicDemographics: ["indian", "chinese", "korean", "vietnamese", "mexican"] },
  { slug: "glendale-az", name: "Glendale", state: "Arizona", stateSlug: "arizona", population: 252381, ethnicDemographics: ["mexican", "vietnamese", "filipino", "indian"] },
  { slug: "tempe", name: "Tempe", state: "Arizona", stateSlug: "arizona", population: 191607, ethnicDemographics: ["indian", "chinese", "mexican", "korean", "vietnamese"] },
  { slug: "peoria-az", name: "Peoria", state: "Arizona", stateSlug: "arizona", population: 190985, ethnicDemographics: ["mexican", "indian", "chinese", "filipino"] },
  { slug: "surprise", name: "Surprise", state: "Arizona", stateSlug: "arizona", population: 143148, ethnicDemographics: ["mexican", "filipino", "indian", "chinese"] },
  
  // COLORADO
  { slug: "denver", name: "Denver", state: "Colorado", stateSlug: "colorado", population: 727211, ethnicDemographics: ["mexican", "vietnamese", "ethiopian", "korean", "chinese", "somali"] },
  { slug: "colorado-springs", name: "Colorado Springs", state: "Colorado", stateSlug: "colorado", population: 478961, ethnicDemographics: ["mexican", "korean", "vietnamese", "german"] },
  { slug: "aurora-co", name: "Aurora", state: "Colorado", stateSlug: "colorado", population: 386261, ethnicDemographics: ["mexican", "ethiopian", "korean", "vietnamese", "somali", "eritrean"] },
  { slug: "fort-collins", name: "Fort Collins", state: "Colorado", stateSlug: "colorado", population: 169810, ethnicDemographics: ["mexican", "vietnamese", "chinese", "indian"] },
  { slug: "lakewood", name: "Lakewood", state: "Colorado", stateSlug: "colorado", population: 155984, ethnicDemographics: ["mexican", "vietnamese", "korean", "indian"] },
  { slug: "thornton", name: "Thornton", state: "Colorado", stateSlug: "colorado", population: 141867, ethnicDemographics: ["mexican", "vietnamese", "korean", "chinese"] },
  { slug: "arvada", name: "Arvada", state: "Colorado", stateSlug: "colorado", population: 124402, ethnicDemographics: ["mexican", "vietnamese", "korean", "indian"] },
  { slug: "westminster-co", name: "Westminster", state: "Colorado", stateSlug: "colorado", population: 116317, ethnicDemographics: ["mexican", "vietnamese", "korean", "chinese"] },
  { slug: "centennial", name: "Centennial", state: "Colorado", stateSlug: "colorado", population: 108418, ethnicDemographics: ["korean", "chinese", "indian", "vietnamese", "mexican"] },
  { slug: "boulder", name: "Boulder", state: "Colorado", stateSlug: "colorado", population: 105485, ethnicDemographics: ["chinese", "indian", "korean", "japanese", "mexican"] },
  
  // NORTH CAROLINA
  { slug: "charlotte", name: "Charlotte", state: "North Carolina", stateSlug: "north-carolina", population: 879709, ethnicDemographics: ["mexican", "vietnamese", "indian", "chinese", "ethiopian", "jamaican"] },
  { slug: "raleigh", name: "Raleigh", state: "North Carolina", stateSlug: "north-carolina", population: 474069, ethnicDemographics: ["indian", "chinese", "mexican", "vietnamese", "korean"] },
  { slug: "greensboro", name: "Greensboro", state: "North Carolina", stateSlug: "north-carolina", population: 299035, ethnicDemographics: ["vietnamese", "mexican", "indian", "montagnard"] },
  { slug: "durham", name: "Durham", state: "North Carolina", stateSlug: "north-carolina", population: 283506, ethnicDemographics: ["mexican", "indian", "chinese", "vietnamese", "salvadoran"] },
  { slug: "winston-salem", name: "Winston-Salem", state: "North Carolina", stateSlug: "north-carolina", population: 249545, ethnicDemographics: ["mexican", "vietnamese", "hmong", "indian"] },
  { slug: "fayetteville", name: "Fayetteville", state: "North Carolina", stateSlug: "north-carolina", population: 211657, ethnicDemographics: ["korean", "vietnamese", "mexican", "jamaican"] },
  { slug: "cary", name: "Cary", state: "North Carolina", stateSlug: "north-carolina", population: 174721, ethnicDemographics: ["indian", "chinese", "korean", "vietnamese"] },
  { slug: "high-point", name: "High Point", state: "North Carolina", stateSlug: "north-carolina", population: 114059, ethnicDemographics: ["vietnamese", "mexican", "hmong", "laotian"] },
  { slug: "morrisville", name: "Morrisville", state: "North Carolina", stateSlug: "north-carolina", population: 30000, ethnicDemographics: ["indian", "chinese", "korean", "pakistani"] },
  { slug: "apex", name: "Apex", state: "North Carolina", stateSlug: "north-carolina", population: 73893, ethnicDemographics: ["indian", "chinese", "korean", "mexican"] },
  
  // MINNESOTA
  { slug: "minneapolis", name: "Minneapolis", state: "Minnesota", stateSlug: "minnesota", population: 429606, ethnicDemographics: ["somali", "hmong", "vietnamese", "ethiopian", "mexican", "laotian"] },
  { slug: "saint-paul", name: "Saint Paul", state: "Minnesota", stateSlug: "minnesota", population: 311527, ethnicDemographics: ["hmong", "karen", "somali", "vietnamese", "ethiopian", "mexican"] },
  { slug: "rochester-mn", name: "Rochester", state: "Minnesota", stateSlug: "minnesota", population: 121395, ethnicDemographics: ["somali", "vietnamese", "indian", "chinese"] },
  { slug: "bloomington-mn", name: "Bloomington", state: "Minnesota", stateSlug: "minnesota", population: 89987, ethnicDemographics: ["indian", "chinese", "korean", "vietnamese", "somali"] },
  { slug: "brooklyn-park", name: "Brooklyn Park", state: "Minnesota", stateSlug: "minnesota", population: 86478, ethnicDemographics: ["liberian", "somali", "vietnamese", "hmong"] },
  { slug: "plymouth-mn", name: "Plymouth", state: "Minnesota", stateSlug: "minnesota", population: 81026, ethnicDemographics: ["indian", "chinese", "korean", "vietnamese"] },
  { slug: "eagan", name: "Eagan", state: "Minnesota", stateSlug: "minnesota", population: 68855, ethnicDemographics: ["indian", "korean", "vietnamese", "somali"] },
  { slug: "brooklyn-center", name: "Brooklyn Center", state: "Minnesota", stateSlug: "minnesota", population: 32295, ethnicDemographics: ["hmong", "somali", "liberian", "vietnamese"] },
  { slug: "richfield-mn", name: "Richfield", state: "Minnesota", stateSlug: "minnesota", population: 36994, ethnicDemographics: ["somali", "mexican", "vietnamese", "hmong"] },
  { slug: "columbia-heights", name: "Columbia Heights", state: "Minnesota", stateSlug: "minnesota", population: 21206, ethnicDemographics: ["somali", "ethiopian", "mexican", "vietnamese"] },
  
  // MICHIGAN
  { slug: "detroit", name: "Detroit", state: "Michigan", stateSlug: "michigan", population: 639111, ethnicDemographics: ["mexican", "bangladeshi", "yemeni", "chaldean", "polish"] },
  { slug: "grand-rapids", name: "Grand Rapids", state: "Michigan", stateSlug: "michigan", population: 198917, ethnicDemographics: ["mexican", "vietnamese", "burmese", "somali", "guatemalan"] },
  { slug: "warren", name: "Warren", state: "Michigan", stateSlug: "michigan", population: 139387, ethnicDemographics: ["chaldean", "bangladeshi", "polish", "macedonian"] },
  { slug: "sterling-heights", name: "Sterling Heights", state: "Michigan", stateSlug: "michigan", population: 134346, ethnicDemographics: ["chaldean", "macedonian", "bangladeshi", "indian"] },
  { slug: "ann-arbor", name: "Ann Arbor", state: "Michigan", stateSlug: "michigan", population: 123851, ethnicDemographics: ["chinese", "korean", "indian", "japanese", "vietnamese"] },
  { slug: "lansing", name: "Lansing", state: "Michigan", stateSlug: "michigan", population: 112644, ethnicDemographics: ["mexican", "burmese", "vietnamese", "bangladeshi"] },
  { slug: "dearborn", name: "Dearborn", state: "Michigan", stateSlug: "michigan", population: 109976, ethnicDemographics: ["lebanese", "yemeni", "iraqi", "syrian", "palestinian"] },
  { slug: "livonia", name: "Livonia", state: "Michigan", stateSlug: "michigan", population: 95535, ethnicDemographics: ["chaldean", "polish", "indian", "chinese"] },
  { slug: "troy", name: "Troy", state: "Michigan", stateSlug: "michigan", population: 87294, ethnicDemographics: ["indian", "chinese", "japanese", "korean", "chaldean"] },
  { slug: "farmington-hills", name: "Farmington Hills", state: "Michigan", stateSlug: "michigan", population: 83986, ethnicDemographics: ["indian", "chaldean", "chinese", "korean"] },
  { slug: "hamtramck", name: "Hamtramck", state: "Michigan", stateSlug: "michigan", population: 28433, ethnicDemographics: ["bangladeshi", "yemeni", "bosnian", "polish"] },
  
  // OHIO
  { slug: "columbus-oh", name: "Columbus", state: "Ohio", stateSlug: "ohio", population: 905748, ethnicDemographics: ["somali", "mexican", "indian", "chinese", "nepali", "bhutanese"] },
  { slug: "cleveland", name: "Cleveland", state: "Ohio", stateSlug: "ohio", population: 372624, ethnicDemographics: ["puerto-rican", "mexican", "vietnamese", "chinese"] },
  { slug: "cincinnati", name: "Cincinnati", state: "Ohio", stateSlug: "ohio", population: 309317, ethnicDemographics: ["indian", "chinese", "mexican", "guatemalan", "bhutanese"] },
  { slug: "toledo", name: "Toledo", state: "Ohio", stateSlug: "ohio", population: 270871, ethnicDemographics: ["mexican", "lebanese", "syrian", "indian"] },
  { slug: "akron", name: "Akron", state: "Ohio", stateSlug: "ohio", population: 190469, ethnicDemographics: ["nepali", "bhutanese", "burmese", "vietnamese"] },
  { slug: "dayton", name: "Dayton", state: "Ohio", stateSlug: "ohio", population: 137644, ethnicDemographics: ["turkish", "mexican", "vietnamese", "indian"] },
  { slug: "dublin-oh", name: "Dublin", state: "Ohio", stateSlug: "ohio", population: 49328, ethnicDemographics: ["indian", "chinese", "korean", "japanese"] },
  { slug: "westerville", name: "Westerville", state: "Ohio", stateSlug: "ohio", population: 41103, ethnicDemographics: ["indian", "chinese", "korean", "somali"] },
  { slug: "reynoldsburg", name: "Reynoldsburg", state: "Ohio", stateSlug: "ohio", population: 38016, ethnicDemographics: ["somali", "indian", "chinese", "ethiopian"] },
  
  // NEVADA
  { slug: "las-vegas", name: "Las Vegas", state: "Nevada", stateSlug: "nevada", population: 641903, ethnicDemographics: ["mexican", "filipino", "chinese", "korean", "vietnamese", "ethiopian"] },
  { slug: "henderson", name: "Henderson", state: "Nevada", stateSlug: "nevada", population: 320189, ethnicDemographics: ["filipino", "chinese", "korean", "mexican", "indian"] },
  { slug: "reno", name: "Reno", state: "Nevada", stateSlug: "nevada", population: 264165, ethnicDemographics: ["mexican", "filipino", "chinese", "vietnamese"] },
  { slug: "north-las-vegas", name: "North Las Vegas", state: "Nevada", stateSlug: "nevada", population: 262527, ethnicDemographics: ["mexican", "filipino", "salvadoran", "guatemalan"] },
  { slug: "paradise", name: "Paradise", state: "Nevada", stateSlug: "nevada", population: 191238, ethnicDemographics: ["filipino", "chinese", "korean", "mexican"] },
  { slug: "spring-valley-nv", name: "Spring Valley", state: "Nevada", stateSlug: "nevada", population: 215107, ethnicDemographics: ["filipino", "chinese", "korean", "vietnamese", "mexican"] },
  { slug: "sunrise-manor", name: "Sunrise Manor", state: "Nevada", stateSlug: "nevada", population: 189372, ethnicDemographics: ["mexican", "filipino", "salvadoran", "guatemalan"] },
  { slug: "chinatown-las-vegas", name: "Chinatown Las Vegas", state: "Nevada", stateSlug: "nevada", population: 50000, ethnicDemographics: ["chinese", "vietnamese", "thai", "korean", "filipino"] },
  
  // LOUISIANA
  { slug: "new-orleans", name: "New Orleans", state: "Louisiana", stateSlug: "louisiana", population: 383997, ethnicDemographics: ["vietnamese", "honduran", "mexican", "jamaican"] },
  { slug: "baton-rouge", name: "Baton Rouge", state: "Louisiana", stateSlug: "louisiana", population: 227470, ethnicDemographics: ["vietnamese", "chinese", "indian", "mexican"] },
  { slug: "shreveport", name: "Shreveport", state: "Louisiana", stateSlug: "louisiana", population: 187593, ethnicDemographics: ["vietnamese", "indian", "mexican", "chinese"] },
  { slug: "metairie", name: "Metairie", state: "Louisiana", stateSlug: "louisiana", population: 138481, ethnicDemographics: ["vietnamese", "honduran", "mexican", "salvadoran"] },
  { slug: "lafayette", name: "Lafayette", state: "Louisiana", stateSlug: "louisiana", population: 126185, ethnicDemographics: ["vietnamese", "mexican", "chinese", "indian"] },
  { slug: "kenner", name: "Kenner", state: "Louisiana", stateSlug: "louisiana", population: 66702, ethnicDemographics: ["vietnamese", "honduran", "salvadoran", "mexican"] },
  { slug: "gretna", name: "Gretna", state: "Louisiana", stateSlug: "louisiana", population: 17736, ethnicDemographics: ["vietnamese", "honduran", "mexican", "filipino"] },
  { slug: "versailles-la", name: "Versailles", state: "Louisiana", stateSlug: "louisiana", population: 8000, ethnicDemographics: ["vietnamese"] },
  
  // TENNESSEE
  { slug: "nashville", name: "Nashville", state: "Tennessee", stateSlug: "tennessee", population: 689447, ethnicDemographics: ["kurdish", "mexican", "vietnamese", "somali", "ethiopian", "burmese"] },
  { slug: "memphis", name: "Memphis", state: "Tennessee", stateSlug: "tennessee", population: 633104, ethnicDemographics: ["mexican", "vietnamese", "indian", "jamaican"] },
  { slug: "knoxville", name: "Knoxville", state: "Tennessee", stateSlug: "tennessee", population: 190740, ethnicDemographics: ["mexican", "chinese", "indian", "korean"] },
  { slug: "chattanooga", name: "Chattanooga", state: "Tennessee", stateSlug: "tennessee", population: 181099, ethnicDemographics: ["mexican", "guatemalan", "vietnamese", "burmese"] },
  { slug: "clarksville", name: "Clarksville", state: "Tennessee", stateSlug: "tennessee", population: 166722, ethnicDemographics: ["korean", "mexican", "filipino", "jamaican"] },
  { slug: "murfreesboro", name: "Murfreesboro", state: "Tennessee", stateSlug: "tennessee", population: 152769, ethnicDemographics: ["mexican", "kurdish", "somali", "burmese"] },
  { slug: "antioch", name: "Antioch", state: "Tennessee", stateSlug: "tennessee", population: 96000, ethnicDemographics: ["kurdish", "somali", "burmese", "mexican", "eritrean"] },
  { slug: "madison-tn", name: "Madison", state: "Tennessee", stateSlug: "tennessee", population: 27000, ethnicDemographics: ["kurdish", "somali", "mexican", "vietnamese"] },
  
  // OREGON
  { slug: "portland", name: "Portland", state: "Oregon", stateSlug: "oregon", population: 652503, ethnicDemographics: ["vietnamese", "chinese", "russian", "ukrainian", "mexican", "somali", "ethiopian"] },
  { slug: "salem", name: "Salem", state: "Oregon", stateSlug: "oregon", population: 175535, ethnicDemographics: ["mexican", "russian", "vietnamese", "chinese"] },
  { slug: "eugene", name: "Eugene", state: "Oregon", stateSlug: "oregon", population: 176654, ethnicDemographics: ["chinese", "korean", "mexican", "vietnamese"] },
  { slug: "gresham", name: "Gresham", state: "Oregon", stateSlug: "oregon", population: 114247, ethnicDemographics: ["russian", "ukrainian", "vietnamese", "mexican"] },
  { slug: "hillsboro", name: "Hillsboro", state: "Oregon", stateSlug: "oregon", population: 108389, ethnicDemographics: ["mexican", "indian", "chinese", "japanese"] },
  { slug: "beaverton", name: "Beaverton", state: "Oregon", stateSlug: "oregon", population: 98216, ethnicDemographics: ["korean", "chinese", "japanese", "indian", "mexican"] },
  { slug: "woodburn", name: "Woodburn", state: "Oregon", stateSlug: "oregon", population: 27174, ethnicDemographics: ["mexican", "russian", "guatemalan"] },
  
  // CONNECTICUT
  { slug: "bridgeport", name: "Bridgeport", state: "Connecticut", stateSlug: "connecticut", population: 148654, ethnicDemographics: ["mexican", "puerto-rican", "jamaican", "brazilian"] },
  { slug: "new-haven", name: "New Haven", state: "Connecticut", stateSlug: "connecticut", population: 134023, ethnicDemographics: ["mexican", "ecuadorian", "jamaican", "chinese"] },
  { slug: "stamford", name: "Stamford", state: "Connecticut", stateSlug: "connecticut", population: 135470, ethnicDemographics: ["jamaican", "haitian", "brazilian", "peruvian"] },
  { slug: "hartford", name: "Hartford", state: "Connecticut", stateSlug: "connecticut", population: 121054, ethnicDemographics: ["puerto-rican", "jamaican", "mexican", "vietnamese"] },
  { slug: "waterbury", name: "Waterbury", state: "Connecticut", stateSlug: "connecticut", population: 114403, ethnicDemographics: ["puerto-rican", "ecuadorian", "colombian", "jamaican"] },
  { slug: "norwalk", name: "Norwalk", state: "Connecticut", stateSlug: "connecticut", population: 91184, ethnicDemographics: ["colombian", "ecuadorian", "peruvian", "haitian"] },
  { slug: "danbury", name: "Danbury", state: "Connecticut", stateSlug: "connecticut", population: 86518, ethnicDemographics: ["brazilian", "ecuadorian", "jamaican", "dominican"] },
];

// ─────────────────────────────────────────────────────────────────────────────
// CUISINES (28 with search term variations)
// ─────────────────────────────────────────────────────────────────────────────

export const cuisines: Cuisine[] = [
  // Caribbean
  { slug: "haitian", name: "Haitian", flag: "🇭🇹", region: "caribbean", popularStates: ["florida", "new-york", "massachusetts", "new-jersey"], searchTerms: ["haitian food", "haitian grocery", "haitian restaurant", "haitian market", "haitian supermarket"] },
  { slug: "jamaican", name: "Jamaican", flag: "🇯🇲", region: "caribbean", popularStates: ["florida", "new-york", "georgia", "connecticut", "maryland"], searchTerms: ["jamaican food", "jamaican grocery", "jamaican patties", "caribbean market", "jamaican restaurant"] },
  { slug: "cuban", name: "Cuban", flag: "🇨🇺", region: "caribbean", popularStates: ["florida", "new-jersey", "california"], searchTerms: ["cuban food", "cuban grocery", "cuban bakery", "cuban restaurant", "latin market"] },
  { slug: "dominican", name: "Dominican", flag: "🇩🇴", region: "caribbean", popularStates: ["new-york", "new-jersey", "florida", "massachusetts"], searchTerms: ["dominican food", "dominican grocery", "dominican restaurant", "latin supermarket"] },
  { slug: "puerto-rican", name: "Puerto Rican", flag: "🇵🇷", region: "caribbean", popularStates: ["new-york", "florida", "pennsylvania", "connecticut", "massachusetts"], searchTerms: ["puerto rican food", "puerto rican grocery", "boricua market", "latin food"] },
  { slug: "trinidadian", name: "Trinidadian", flag: "🇹🇹", region: "caribbean", popularStates: ["new-york", "florida", "new-jersey"], searchTerms: ["trinidadian food", "trini grocery", "west indian market", "caribbean food"] },
  
  // Latin American
  { slug: "mexican", name: "Mexican", flag: "🇲🇽", region: "latin", popularStates: ["california", "texas", "arizona", "illinois", "colorado", "florida", "georgia", "new-york"], searchTerms: ["mexican food", "mexican grocery", "mexican market", "carniceria", "tortilleria", "tienda mexicana"] },
  { slug: "colombian", name: "Colombian", flag: "🇨🇴", region: "latin", popularStates: ["florida", "new-york", "new-jersey", "texas"], searchTerms: ["colombian food", "colombian grocery", "colombian bakery", "colombian restaurant"] },
  { slug: "peruvian", name: "Peruvian", flag: "🇵🇪", region: "latin", popularStates: ["new-jersey", "florida", "virginia", "california"], searchTerms: ["peruvian food", "peruvian grocery", "peruvian restaurant", "ceviche"] },
  { slug: "venezuelan", name: "Venezuelan", flag: "🇻🇪", region: "latin", popularStates: ["florida", "texas", "new-jersey"], searchTerms: ["venezuelan food", "venezuelan grocery", "arepas", "venezuelan bakery"] },
  { slug: "salvadoran", name: "Salvadoran", flag: "🇸🇻", region: "latin", popularStates: ["california", "texas", "virginia", "maryland"], searchTerms: ["salvadoran food", "salvadoran grocery", "pupuseria", "pupusas"] },
  { slug: "guatemalan", name: "Guatemalan", flag: "🇬🇹", region: "latin", popularStates: ["california", "florida", "new-york", "texas"], searchTerms: ["guatemalan food", "guatemalan grocery", "guatemalan restaurant"] },
  { slug: "brazilian", name: "Brazilian", flag: "🇧🇷", region: "latin", popularStates: ["florida", "massachusetts", "new-jersey", "california"], searchTerms: ["brazilian food", "brazilian grocery", "brazilian market", "acai", "churrascaria"] },
  { slug: "ecuadorian", name: "Ecuadorian", flag: "🇪🇨", region: "latin", popularStates: ["new-york", "new-jersey", "connecticut"], searchTerms: ["ecuadorian food", "ecuadorian grocery", "ecuadorian restaurant"] },
  
  // Asian
  { slug: "chinese", name: "Chinese", flag: "🇨🇳", region: "asian", popularStates: ["california", "new-york", "texas", "massachusetts", "florida", "new-jersey", "illinois"], searchTerms: ["chinese food", "chinese grocery", "asian supermarket", "chinese market", "dim sum"] },
  { slug: "vietnamese", name: "Vietnamese", flag: "🇻🇳", region: "asian", popularStates: ["california", "texas", "washington", "virginia", "florida", "georgia", "massachusetts"], searchTerms: ["vietnamese food", "vietnamese grocery", "pho", "banh mi", "asian market"] },
  { slug: "korean", name: "Korean", flag: "🇰🇷", region: "asian", popularStates: ["california", "new-york", "new-jersey", "virginia", "texas", "georgia", "illinois", "washington"], searchTerms: ["korean food", "korean grocery", "korean market", "h mart", "korean bbq"] },
  { slug: "filipino", name: "Filipino", flag: "🇵🇭", region: "asian", popularStates: ["california", "nevada", "hawaii", "washington", "new-jersey", "texas", "florida", "illinois"], searchTerms: ["filipino food", "filipino grocery", "filipino market", "pinoy store"] },
  { slug: "indian", name: "Indian", flag: "🇮🇳", region: "asian", popularStates: ["california", "new-jersey", "texas", "illinois", "new-york", "georgia", "maryland", "virginia"], searchTerms: ["indian food", "indian grocery", "indian market", "desi grocery", "spice store"] },
  { slug: "thai", name: "Thai", flag: "🇹🇭", region: "asian", popularStates: ["california", "new-york", "illinois", "texas", "florida", "washington", "colorado", "georgia"], searchTerms: ["thai food", "thai grocery", "thai market", "thai restaurant"] },
  { slug: "japanese", name: "Japanese", flag: "🇯🇵", region: "asian", popularStates: ["california", "new-york", "hawaii", "washington", "texas", "illinois", "colorado", "florida"], searchTerms: ["japanese food", "japanese grocery", "japanese market", "sushi", "ramen"] },
  { slug: "cambodian", name: "Cambodian", flag: "🇰🇭", region: "asian", popularStates: ["california", "massachusetts", "washington"], searchTerms: ["cambodian food", "cambodian grocery", "khmer market"] },
  
  // African
  { slug: "ethiopian", name: "Ethiopian", flag: "🇪🇹", region: "african", popularStates: ["maryland", "virginia", "california", "texas", "minnesota", "georgia", "colorado", "washington"], searchTerms: ["ethiopian food", "ethiopian grocery", "ethiopian market", "injera", "berbere"] },
  { slug: "nigerian", name: "Nigerian", flag: "🇳🇬", region: "african", popularStates: ["texas", "maryland", "new-york", "georgia", "california", "new-jersey", "illinois", "virginia"], searchTerms: ["nigerian food", "nigerian grocery", "african market", "nigerian restaurant"] },
  { slug: "ghanaian", name: "Ghanaian", flag: "🇬🇭", region: "african", popularStates: ["new-york", "new-jersey", "maryland", "virginia"], searchTerms: ["ghanaian food", "ghanaian grocery", "african market", "west african food"] },
  { slug: "somali", name: "Somali", flag: "🇸🇴", region: "african", popularStates: ["minnesota", "ohio", "washington", "maine"], searchTerms: ["somali food", "somali grocery", "somali market", "halal market"] },
  
  // Middle Eastern
  { slug: "lebanese", name: "Lebanese", flag: "🇱🇧", region: "middle-eastern", popularStates: ["michigan", "california", "ohio", "new-york"], searchTerms: ["lebanese food", "lebanese grocery", "middle eastern market", "halal grocery"] },
  { slug: "persian", name: "Persian", flag: "🇮🇷", region: "middle-eastern", popularStates: ["california", "virginia", "maryland", "new-york"], searchTerms: ["persian food", "persian grocery", "iranian market", "middle eastern grocery"] },
];

// ─────────────────────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

export function getCityBySlug(slug: string): City | undefined {
  return cities.find(c => c.slug === slug);
}

export function getStateBySlug(slug: string): State | undefined {
  return states.find(s => s.slug === slug);
}

export function getCuisineBySlug(slug: string): Cuisine | undefined {
  return cuisines.find(c => c.slug === slug);
}

export function getCitiesByState(stateSlug: string): City[] {
  return cities.filter(c => c.stateSlug === stateSlug);
}

export function getCitiesByCuisine(cuisineSlug: string): City[] {
  return cities.filter(c => 
    c.ethnicDemographics?.includes(cuisineSlug)
  );
}

export function getPopularCuisinesForCity(citySlug: string): Cuisine[] {
  const city = getCityBySlug(citySlug);
  if (!city?.ethnicDemographics) return [];
  
  return city.ethnicDemographics
    .map(slug => getCuisineBySlug(slug))
    .filter(Boolean) as Cuisine[];
}

export function getLocationStats() {
  const totalCities = cities.length;
  const totalStates = states.length;
  const totalCuisines = cuisines.length;
  const totalCombinations = totalCities * totalCuisines;
  
  return {
    totalCities,
    totalStates,
    totalCuisines,
    totalCombinations,
    estimatedPages: totalCombinations + totalCities + (totalStates * totalCuisines) + totalCuisines
  };
}

// Generate all valid city/cuisine combinations (for sitemap)
export function getAllCityCuisineCombinations(): Array<{city: City, cuisine: Cuisine}> {
  const combinations: Array<{city: City, cuisine: Cuisine}> = [];
  
  for (const city of cities) {
    for (const cuisine of cuisines) {
      // Prioritize cities with matching demographics, but include all
      combinations.push({ city, cuisine });
    }
  }
  
  return combinations;
}

// Get relevant combinations (cities with matching demographics)
// Get relevant combinations (cities with matching demographics OR in popular states for cuisine)
export function getRelevantCombinations(): Array<{city: City, cuisine: Cuisine}> {
  const combinations: Array<{city: City, cuisine: Cuisine}> = [];
  const seen = new Set<string>();

  for (const city of cities) {
    // Method 1: City explicitly lists this cuisine in demographics
    if (city.ethnicDemographics) {
      for (const cuisineSlug of city.ethnicDemographics) {
        const cuisine = getCuisineBySlug(cuisineSlug);
        if (cuisine) {
          const key = `${city.slug}-${cuisine.slug}`;
          if (!seen.has(key)) {
            seen.add(key);
            combinations.push({ city, cuisine });
          }
        }
      }
    }

    // Method 2: Cuisine lists this city's state as popular
    for (const cuisine of cuisines) {
      if (cuisine.popularStates && cuisine.popularStates.includes(city.stateSlug)) {
        const key = `${city.slug}-${cuisine.slug}`;
        if (!seen.has(key)) {
          seen.add(key);
          combinations.push({ city, cuisine });
        }
      }
    }
  }

  return combinations;
}
