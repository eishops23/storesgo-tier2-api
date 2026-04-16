/**
 * StoresGo Store Directory Data
 * Social proof + local SEO
 */

export interface StoreLocation {
  id: number;
  sellerName: string;
  sellerSlug: string;
  storeName: string;
  address: string;
  city: string;
  county: string;
  countySlug: string;
  zipCode: string;
  neighborhood?: string;
  cuisineTypes: string[];
  hours: string;
  phone?: string;
  features: string[];
}

// Real stores from your sellers
export const STORE_LOCATIONS: StoreLocation[] = [
  // Publix locations
  { id: 1, sellerName: "Publix", sellerSlug: "publix", storeName: "Publix Super Market at Midtown Miami", address: "3401 N Miami Ave", city: "Miami", county: "Miami-Dade", countySlug: "miami-dade", zipCode: "33127", neighborhood: "Midtown", cuisineTypes: ["caribbean", "latin", "asian"], hours: "7am-10pm", features: ["Caribbean Section", "Latin Foods", "Deli"] },
  { id: 2, sellerName: "Publix", sellerSlug: "publix", storeName: "Publix Super Market at Coral Way", address: "2545 Coral Way", city: "Miami", county: "Miami-Dade", countySlug: "miami-dade", zipCode: "33145", neighborhood: "Coral Way", cuisineTypes: ["cuban", "latin", "caribbean"], hours: "7am-10pm", features: ["Cuban Bakery", "Latin Meats", "Fresh Produce"] },
  { id: 3, sellerName: "Publix", sellerSlug: "publix", storeName: "Publix Super Market at Aventura", address: "21051 Biscayne Blvd", city: "Aventura", county: "Miami-Dade", countySlug: "miami-dade", zipCode: "33180", cuisineTypes: ["latin", "kosher", "caribbean"], hours: "7am-10pm", features: ["Kosher Section", "Latin Foods", "Sushi Bar"] },
  
  // Bravo locations
  { id: 4, sellerName: "Bravo Supermarkets", sellerSlug: "bravo", storeName: "Bravo Supermarket - Hialeah", address: "3100 W 84th St", city: "Hialeah", county: "Miami-Dade", countySlug: "miami-dade", zipCode: "33018", neighborhood: "Hialeah", cuisineTypes: ["cuban", "caribbean", "latin"], hours: "7am-10pm", features: ["Cuban Specialty", "Fresh Meats", "Bakery"] },
  { id: 5, sellerName: "Bravo Supermarkets", sellerSlug: "bravo", storeName: "Bravo Supermarket - Little Havana", address: "1500 SW 8th St", city: "Miami", county: "Miami-Dade", countySlug: "miami-dade", zipCode: "33135", neighborhood: "Little Havana", cuisineTypes: ["cuban", "latin", "caribbean"], hours: "7am-10pm", features: ["Authentic Cuban", "Fresh Produce", "Carniceria"] },
  { id: 6, sellerName: "Bravo Supermarkets", sellerSlug: "bravo", storeName: "Bravo Supermarket - Hollywood", address: "5801 Hollywood Blvd", city: "Hollywood", county: "Broward", countySlug: "broward", zipCode: "33021", cuisineTypes: ["caribbean", "jamaican", "latin"], hours: "7am-10pm", features: ["Caribbean Foods", "Jamaican Section", "Fresh Seafood"] },
  
  // Gala Fresh locations
  { id: 7, sellerName: "Gala Fresh Farms", sellerSlug: "gala-fresh", storeName: "Gala Fresh Farms - North Miami", address: "13655 W Dixie Hwy", city: "North Miami", county: "Miami-Dade", countySlug: "miami-dade", zipCode: "33161", neighborhood: "North Miami", cuisineTypes: ["haitian", "caribbean", "jamaican"], hours: "8am-9pm", features: ["Haitian Specialty", "Fresh Fish", "Caribbean Produce"] },
  { id: 8, sellerName: "Gala Fresh Farms", sellerSlug: "gala-fresh", storeName: "Gala Fresh Farms - Lauderhill", address: "4501 N State Rd 7", city: "Lauderhill", county: "Broward", countySlug: "broward", zipCode: "33319", neighborhood: "Lauderhill", cuisineTypes: ["jamaican", "caribbean", "haitian"], hours: "8am-9pm", features: ["Jamaican Foods", "Caribbean Spices", "Fresh Produce"] },
  { id: 9, sellerName: "Gala Fresh Farms", sellerSlug: "gala-fresh", storeName: "Gala Fresh Farms - Miramar", address: "3200 S University Dr", city: "Miramar", county: "Broward", countySlug: "broward", zipCode: "33025", neighborhood: "Miramar", cuisineTypes: ["jamaican", "trinidadian", "caribbean"], hours: "8am-9pm", features: ["Jamaican Patties", "Roti Shop", "Fresh Meats"] },
  
  // Key Food locations
  { id: 10, sellerName: "Key Food", sellerSlug: "key-food", storeName: "Key Food - Little Haiti", address: "8320 NE 2nd Ave", city: "Miami", county: "Miami-Dade", countySlug: "miami-dade", zipCode: "33138", neighborhood: "Little Haiti", cuisineTypes: ["haitian", "caribbean", "african"], hours: "7am-10pm", features: ["Haitian Foods", "African Section", "Fresh Produce"] },
  { id: 11, sellerName: "Key Food", sellerSlug: "key-food", storeName: "Key Food - Pompano Beach", address: "2601 N Federal Hwy", city: "Pompano Beach", county: "Broward", countySlug: "broward", zipCode: "33062", neighborhood: "Pompano Beach", cuisineTypes: ["caribbean", "haitian", "latin"], hours: "7am-10pm", features: ["Caribbean Foods", "Fresh Seafood", "Bakery"] },
  { id: 12, sellerName: "Key Food", sellerSlug: "key-food", storeName: "Key Food - Delray Beach", address: "1850 S Federal Hwy", city: "Delray Beach", county: "Palm Beach", countySlug: "palm-beach", zipCode: "33483", cuisineTypes: ["caribbean", "haitian", "jamaican"], hours: "7am-10pm", features: ["Caribbean Section", "Fresh Produce", "Deli"] },
];

export function getStoresByCounty(countySlug: string): StoreLocation[] {
  return STORE_LOCATIONS.filter(s => s.countySlug === countySlug);
}

export function getStoresByCuisine(cuisineSlug: string): StoreLocation[] {
  return STORE_LOCATIONS.filter(s => s.cuisineTypes.includes(cuisineSlug));
}

export function getStoresByNeighborhood(neighborhood: string): StoreLocation[] {
  return STORE_LOCATIONS.filter(s => s.neighborhood?.toLowerCase() === neighborhood.toLowerCase());
}

export default { STORE_LOCATIONS, getStoresByCounty, getStoresByCuisine, getStoresByNeighborhood };
