/**
 * StoresGo Neighborhood SEO Data
 * Hyperlocal targeting for "near me" searches
 */

export interface Neighborhood {
  slug: string;
  name: string;
  county: string;
  countySlug: string;
  zipCodes: string[];
  population: string;
  demographics: string;
  landmarks: string[];
}

export const NEIGHBORHOODS: Neighborhood[] = [
  // Miami-Dade - Caribbean/Latin Heavy
  { slug: "little-haiti", name: "Little Haiti", county: "Miami-Dade", countySlug: "miami-dade", zipCodes: ["33127", "33137", "33138"], population: "30,000+", demographics: "Haitian community hub, vibrant Caribbean culture", landmarks: ["Little Haiti Cultural Complex", "Caribbean Marketplace", "Notre Dame d'Haiti Church"] },
  { slug: "little-havana", name: "Little Havana", county: "Miami-Dade", countySlug: "miami-dade", zipCodes: ["33135", "33130", "33125"], population: "50,000+", demographics: "Cuban heritage district, Latin American melting pot", landmarks: ["Calle Ocho", "Domino Park", "Tower Theater"] },
  { slug: "hialeah", name: "Hialeah", county: "Miami-Dade", countySlug: "miami-dade", zipCodes: ["33010", "33012", "33013", "33014", "33015", "33016"], population: "230,000+", demographics: "95% Hispanic, largest Cuban population outside Cuba", landmarks: ["Hialeah Park Racing & Casino", "Westland Mall"] },
  { slug: "kendall", name: "Kendall", county: "Miami-Dade", countySlug: "miami-dade", zipCodes: ["33156", "33157", "33176", "33183", "33186"], population: "75,000+", demographics: "Diverse suburban community, growing Latin population", landmarks: ["Dadeland Mall", "The Falls"] },
  { slug: "doral", name: "Doral", county: "Miami-Dade", countySlug: "miami-dade", zipCodes: ["33122", "33166", "33172", "33178"], population: "80,000+", demographics: "Venezuelan hub, diverse Latin American community", landmarks: ["Downtown Doral", "Trump National Doral"] },
  { slug: "coral-gables", name: "Coral Gables", county: "Miami-Dade", countySlug: "miami-dade", zipCodes: ["33134", "33143", "33146"], population: "50,000+", demographics: "Affluent, diverse international community", landmarks: ["Miracle Mile", "Biltmore Hotel", "University of Miami"] },
  { slug: "miami-beach", name: "Miami Beach", county: "Miami-Dade", countySlug: "miami-dade", zipCodes: ["33139", "33140", "33141"], population: "90,000+", demographics: "International tourists, diverse residents", landmarks: ["South Beach", "Lincoln Road", "Art Deco District"] },
  { slug: "north-miami", name: "North Miami", county: "Miami-Dade", countySlug: "miami-dade", zipCodes: ["33161", "33162", "33181"], population: "60,000+", demographics: "Caribbean and Haitian community", landmarks: ["MOCA", "Oleta River State Park"] },
  { slug: "homestead", name: "Homestead", county: "Miami-Dade", countySlug: "miami-dade", zipCodes: ["33030", "33031", "33032", "33033"], population: "80,000+", demographics: "Agricultural community, Hispanic majority", landmarks: ["Homestead-Miami Speedway", "Everglades National Park"] },
  { slug: "sweetwater", name: "Sweetwater", county: "Miami-Dade", countySlug: "miami-dade", zipCodes: ["33174", "33144"], population: "20,000+", demographics: "Nicaraguan community hub", landmarks: ["Florida International University"] },
  
  // Broward - Mixed Caribbean/Latin
  { slug: "fort-lauderdale", name: "Fort Lauderdale", county: "Broward", countySlug: "broward", zipCodes: ["33301", "33304", "33305", "33306", "33308", "33311", "33312"], population: "180,000+", demographics: "Diverse urban center, Caribbean community", landmarks: ["Las Olas Boulevard", "Fort Lauderdale Beach", "Riverwalk"] },
  { slug: "hollywood", name: "Hollywood", county: "Broward", countySlug: "broward", zipCodes: ["33019", "33020", "33021", "33024"], population: "150,000+", demographics: "Caribbean, Latin, and diverse communities", landmarks: ["Hollywood Beach Broadwalk", "Young Circle Arts Park"] },
  { slug: "miramar", name: "Miramar", county: "Broward", countySlug: "broward", zipCodes: ["33023", "33025", "33027", "33029"], population: "140,000+", demographics: "Jamaican and Caribbean hub", landmarks: ["Miramar Regional Park", "Ansin Sports Complex"] },
  { slug: "pembroke-pines", name: "Pembroke Pines", county: "Broward", countySlug: "broward", zipCodes: ["33024", "33025", "33026", "33027", "33028", "33029"], population: "170,000+", demographics: "Diverse suburban, Caribbean communities", landmarks: ["C.B. Smith Park", "Pembroke Lakes Mall"] },
  { slug: "lauderhill", name: "Lauderhill", county: "Broward", countySlug: "broward", zipCodes: ["33311", "33313", "33319"], population: "70,000+", demographics: "Jamaican community center, Caribbean culture", landmarks: ["Central Broward Regional Park", "Lauderhill Mall"] },
  { slug: "plantation", name: "Plantation", county: "Broward", countySlug: "broward", zipCodes: ["33317", "33322", "33324", "33325", "33388"], population: "95,000+", demographics: "Diverse suburban community", landmarks: ["Plantation Central Park", "Westfield Broward"] },
  { slug: "sunrise", name: "Sunrise", county: "Broward", countySlug: "broward", zipCodes: ["33313", "33321", "33322", "33323", "33351"], population: "95,000+", demographics: "Caribbean and Latin communities", landmarks: ["Sawgrass Mills", "BB&T Center"] },
  { slug: "coral-springs", name: "Coral Springs", county: "Broward", countySlug: "broward", zipCodes: ["33065", "33067", "33071", "33076"], population: "135,000+", demographics: "Family-oriented, diverse suburban", landmarks: ["Coral Springs Museum of Art", "Tall Cypress Natural Area"] },
  { slug: "pompano-beach", name: "Pompano Beach", county: "Broward", countySlug: "broward", zipCodes: ["33060", "33062", "33063", "33064", "33069"], population: "110,000+", demographics: "Haitian and Caribbean communities", landmarks: ["Pompano Beach Pier", "Isle Casino"] },
  { slug: "deerfield-beach", name: "Deerfield Beach", county: "Broward", countySlug: "broward", zipCodes: ["33441", "33442"], population: "80,000+", demographics: "Diverse beach community", landmarks: ["Deerfield Beach Pier", "Quiet Waters Park"] },
  
  // Palm Beach - Growing Caribbean presence
  { slug: "west-palm-beach", name: "West Palm Beach", county: "Palm Beach", countySlug: "palm-beach", zipCodes: ["33401", "33405", "33407", "33409"], population: "115,000+", demographics: "Urban center, growing Caribbean community", landmarks: ["Clematis Street", "CityPlace", "Norton Museum of Art"] },
  { slug: "boynton-beach", name: "Boynton Beach", county: "Palm Beach", countySlug: "palm-beach", zipCodes: ["33426", "33435", "33436", "33437"], population: "80,000+", demographics: "Caribbean and Haitian communities growing", landmarks: ["Boynton Beach Inlet", "Mangrove Nature Park"] },
  { slug: "delray-beach", name: "Delray Beach", county: "Palm Beach", countySlug: "palm-beach", zipCodes: ["33444", "33445", "33446", "33483", "33484"], population: "70,000+", demographics: "Haitian community in west, diverse downtown", landmarks: ["Atlantic Avenue", "Pineapple Grove", "Morikami Museum"] },
  { slug: "boca-raton", name: "Boca Raton", county: "Palm Beach", countySlug: "palm-beach", zipCodes: ["33427", "33428", "33431", "33432", "33433", "33434"], population: "100,000+", demographics: "Affluent, international community", landmarks: ["Mizner Park", "Town Center Mall", "FAU"] },
  { slug: "lake-worth", name: "Lake Worth Beach", county: "Palm Beach", countySlug: "palm-beach", zipCodes: ["33460", "33461", "33463"], population: "45,000+", demographics: "Guatemalan community hub, Latin culture", landmarks: ["Lake Worth Beach", "Bryant Park"] },
  { slug: "greenacres", name: "Greenacres", county: "Palm Beach", countySlug: "palm-beach", zipCodes: ["33413", "33415", "33463"], population: "45,000+", demographics: "Haitian and Caribbean community", landmarks: ["Okeeheelee Park"] },
  { slug: "riviera-beach", name: "Riviera Beach", county: "Palm Beach", countySlug: "palm-beach", zipCodes: ["33404", "33407"], population: "35,000+", demographics: "African American and Caribbean community", landmarks: ["Riviera Beach Marina", "Phil Foster Park"] },
  { slug: "belle-glade", name: "Belle Glade", county: "Palm Beach", countySlug: "palm-beach", zipCodes: ["33430"], population: "20,000+", demographics: "Agricultural, Haitian workers community", landmarks: ["Lake Okeechobee", "Sugar Cane Fields"] },
];

// Get neighborhoods by county
export function getNeighborhoodsByCounty(countySlug: string): Neighborhood[] {
  return NEIGHBORHOODS.filter(n => n.countySlug === countySlug);
}

// Get all neighborhood slugs
export function getAllNeighborhoodSlugs(): string[] {
  return NEIGHBORHOODS.map(n => n.slug);
}

export default { NEIGHBORHOODS, getNeighborhoodsByCounty, getAllNeighborhoodSlugs };
