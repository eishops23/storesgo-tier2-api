/**
 * StoresGo Recipe SEO Data
 * High-volume recipe keywords linked to product purchases
 */

export interface Recipe {
  slug: string;
  title: string;
  cuisine: string;
  cuisineSlug: string;
  flag: string;
  description: string;
  prepTime: string;
  cookTime: string;
  servings: number;
  difficulty: "Easy" | "Medium" | "Hard";
  ingredients: string[];
  searchVolume: "high" | "medium" | "low";
  keywords: string[];
}

export const RECIPES: Recipe[] = [
  // Caribbean - HIGH VOLUME
  {
    slug: "jamaican-jerk-chicken",
    title: "Jamaican Jerk Chicken",
    cuisine: "Jamaican",
    cuisineSlug: "jamaican",
    flag: "🇯🇲",
    description: "Authentic Jamaican jerk chicken with homemade marinade. Learn to make this spicy, smoky Caribbean classic.",
    prepTime: "30 mins",
    cookTime: "45 mins",
    servings: 6,
    difficulty: "Medium",
    ingredients: ["chicken pieces", "scotch bonnet peppers", "allspice", "thyme", "scallions", "garlic", "ginger", "soy sauce", "lime juice", "brown sugar"],
    searchVolume: "high",
    keywords: ["jerk chicken recipe", "jamaican jerk chicken", "how to make jerk chicken", "authentic jerk chicken", "caribbean jerk chicken"]
  },
  {
    slug: "jamaican-oxtail-stew",
    title: "Jamaican Oxtail Stew",
    cuisine: "Jamaican",
    cuisineSlug: "jamaican",
    flag: "🇯🇲",
    description: "Rich, fall-off-the-bone Jamaican oxtail stew with butter beans. A Sunday dinner favorite.",
    prepTime: "20 mins",
    cookTime: "3 hours",
    servings: 6,
    difficulty: "Medium",
    ingredients: ["oxtail", "butter beans", "carrots", "thyme", "allspice", "scotch bonnet", "browning sauce", "garlic", "onion"],
    searchVolume: "high",
    keywords: ["oxtail recipe", "jamaican oxtail", "how to cook oxtail", "caribbean oxtail stew", "oxtail with butter beans"]
  },
  {
    slug: "rice-and-peas",
    title: "Jamaican Rice and Peas",
    cuisine: "Jamaican",
    cuisineSlug: "jamaican",
    flag: "🇯🇲",
    description: "Traditional Jamaican rice and peas cooked in coconut milk with kidney beans and thyme.",
    prepTime: "15 mins",
    cookTime: "30 mins",
    servings: 8,
    difficulty: "Easy",
    ingredients: ["rice", "kidney beans", "coconut milk", "thyme", "scotch bonnet", "garlic", "scallions", "allspice"],
    searchVolume: "high",
    keywords: ["rice and peas recipe", "jamaican rice and peas", "caribbean rice", "coconut rice recipe"]
  },
  {
    slug: "ackee-and-saltfish",
    title: "Ackee and Saltfish",
    cuisine: "Jamaican",
    cuisineSlug: "jamaican",
    flag: "🇯🇲",
    description: "Jamaica's national dish - creamy ackee with salted codfish, peppers, and onions.",
    prepTime: "20 mins",
    cookTime: "20 mins",
    servings: 4,
    difficulty: "Medium",
    ingredients: ["canned ackee", "saltfish", "scotch bonnet", "tomatoes", "onion", "thyme", "scallions", "black pepper"],
    searchVolume: "high",
    keywords: ["ackee and saltfish", "jamaican national dish", "how to make ackee", "saltfish recipe"]
  },
  {
    slug: "jamaican-curry-goat",
    title: "Jamaican Curry Goat",
    cuisine: "Jamaican",
    cuisineSlug: "jamaican",
    flag: "🇯🇲",
    description: "Tender, aromatic Jamaican curry goat - a party and celebration essential.",
    prepTime: "30 mins",
    cookTime: "2 hours",
    servings: 8,
    difficulty: "Medium",
    ingredients: ["goat meat", "jamaican curry powder", "potatoes", "thyme", "scotch bonnet", "garlic", "ginger", "allspice"],
    searchVolume: "high",
    keywords: ["curry goat recipe", "jamaican curry goat", "caribbean curry", "goat curry recipe"]
  },
  // Haitian
  {
    slug: "haitian-griot",
    title: "Haitian Griot (Fried Pork)",
    cuisine: "Haitian",
    cuisineSlug: "haitian",
    flag: "🇭🇹",
    description: "Crispy, flavorful Haitian griot - marinated pork shoulder fried to perfection.",
    prepTime: "30 mins + marinating",
    cookTime: "2 hours",
    servings: 6,
    difficulty: "Medium",
    ingredients: ["pork shoulder", "sour orange", "epis", "scotch bonnet", "garlic", "thyme", "cloves", "oil for frying"],
    searchVolume: "high",
    keywords: ["griot recipe", "haitian griot", "haitian fried pork", "caribbean pork recipe"]
  },
  {
    slug: "soup-joumou",
    title: "Soup Joumou (Haitian Pumpkin Soup)",
    cuisine: "Haitian",
    cuisineSlug: "haitian",
    flag: "🇭🇹",
    description: "Haiti's Independence Day soup - rich pumpkin soup with beef, pasta, and vegetables.",
    prepTime: "45 mins",
    cookTime: "2 hours",
    servings: 10,
    difficulty: "Medium",
    ingredients: ["calabaza squash", "beef", "pasta", "potatoes", "carrots", "cabbage", "celery", "epis", "scotch bonnet"],
    searchVolume: "high",
    keywords: ["soup joumou recipe", "haitian pumpkin soup", "haitian soup", "haitian independence soup"]
  },
  {
    slug: "diri-ak-djon-djon",
    title: "Diri ak Djon Djon (Black Mushroom Rice)",
    cuisine: "Haitian",
    cuisineSlug: "haitian",
    flag: "🇭🇹",
    description: "Haitian black rice made with djon djon mushrooms - earthy, unique, and delicious.",
    prepTime: "20 mins",
    cookTime: "40 mins",
    servings: 6,
    difficulty: "Easy",
    ingredients: ["rice", "djon djon mushrooms", "butter", "epis", "lima beans", "cloves", "parsley"],
    searchVolume: "medium",
    keywords: ["djon djon rice", "haitian black rice", "diri djon djon recipe", "haitian rice recipe"]
  },
  {
    slug: "pikliz",
    title: "Pikliz (Haitian Pickled Vegetables)",
    cuisine: "Haitian",
    cuisineSlug: "haitian",
    flag: "🇭🇹",
    description: "Spicy Haitian coleslaw condiment - the essential accompaniment to griot and fried foods.",
    prepTime: "20 mins",
    cookTime: "0 mins",
    servings: 12,
    difficulty: "Easy",
    ingredients: ["cabbage", "carrots", "scotch bonnet", "shallots", "white vinegar", "lime juice", "cloves", "black pepper"],
    searchVolume: "medium",
    keywords: ["pikliz recipe", "haitian pikliz", "haitian coleslaw", "spicy cabbage slaw"]
  },
  // Cuban
  {
    slug: "cuban-ropa-vieja",
    title: "Ropa Vieja (Cuban Shredded Beef)",
    cuisine: "Cuban",
    cuisineSlug: "cuban",
    flag: "🇨🇺",
    description: "Cuba's national dish - tender shredded beef in tomato sauce with peppers and olives.",
    prepTime: "20 mins",
    cookTime: "3 hours",
    servings: 6,
    difficulty: "Medium",
    ingredients: ["flank steak", "tomato sauce", "bell peppers", "onion", "garlic", "cumin", "olives", "capers", "white wine"],
    searchVolume: "high",
    keywords: ["ropa vieja recipe", "cuban shredded beef", "cuban beef recipe", "authentic ropa vieja"]
  },
  {
    slug: "cuban-black-beans",
    title: "Cuban Black Beans (Frijoles Negros)",
    cuisine: "Cuban",
    cuisineSlug: "cuban",
    flag: "🇨🇺",
    description: "Creamy, garlicky Cuban black beans - the perfect side for any Cuban meal.",
    prepTime: "15 mins",
    cookTime: "1 hour",
    servings: 8,
    difficulty: "Easy",
    ingredients: ["black beans", "sofrito", "cumin", "oregano", "bay leaf", "olive oil", "vinegar", "sugar"],
    searchVolume: "high",
    keywords: ["cuban black beans", "frijoles negros recipe", "cuban beans recipe", "black beans and rice"]
  },
  {
    slug: "lechon-asado",
    title: "Lechón Asado (Cuban Roast Pork)",
    cuisine: "Cuban",
    cuisineSlug: "cuban",
    flag: "🇨🇺",
    description: "Mojo-marinated roast pork - the centerpiece of Cuban celebrations.",
    prepTime: "30 mins + marinating",
    cookTime: "4 hours",
    servings: 12,
    difficulty: "Medium",
    ingredients: ["pork shoulder", "mojo criollo", "garlic", "sour orange", "cumin", "oregano", "olive oil"],
    searchVolume: "high",
    keywords: ["lechon asado recipe", "cuban roast pork", "mojo pork", "cuban christmas pork"]
  },
  // Trinidadian
  {
    slug: "doubles",
    title: "Trinidad Doubles",
    cuisine: "Trinidadian",
    cuisineSlug: "trinidadian",
    flag: "🇹🇹",
    description: "Trinidad's famous street food - curried chickpeas in fried bread with chutneys.",
    prepTime: "30 mins",
    cookTime: "45 mins",
    servings: 8,
    difficulty: "Medium",
    ingredients: ["bara flour", "channa", "curry powder", "cumin", "turmeric", "garlic", "shadow beni", "pepper sauce"],
    searchVolume: "high",
    keywords: ["doubles recipe", "trinidad doubles", "caribbean street food", "channa doubles"]
  },
  {
    slug: "curry-chicken-roti",
    title: "Trinidad Curry Chicken with Roti",
    cuisine: "Trinidadian",
    cuisineSlug: "trinidadian",
    flag: "🇹🇹",
    description: "Aromatic Trinidadian curry chicken served with soft dhalpuri or paratha roti.",
    prepTime: "20 mins",
    cookTime: "45 mins",
    servings: 6,
    difficulty: "Medium",
    ingredients: ["chicken", "trinidad curry powder", "potatoes", "garlic", "onion", "scotch bonnet", "chadon beni", "roti"],
    searchVolume: "high",
    keywords: ["curry chicken recipe", "trinidad curry", "curry chicken roti", "caribbean curry chicken"]
  },
  // Puerto Rican
  {
    slug: "mofongo",
    title: "Mofongo",
    cuisine: "Puerto Rican",
    cuisineSlug: "puerto-rican",
    flag: "🇵🇷",
    description: "Puerto Rico's beloved mofongo - mashed fried plantains with garlic and chicharrón.",
    prepTime: "15 mins",
    cookTime: "20 mins",
    servings: 4,
    difficulty: "Easy",
    ingredients: ["green plantains", "chicharrón", "garlic", "olive oil", "chicken broth", "salt"],
    searchVolume: "high",
    keywords: ["mofongo recipe", "puerto rican mofongo", "how to make mofongo", "plantain mofongo"]
  },
  {
    slug: "arroz-con-gandules",
    title: "Arroz con Gandules",
    cuisine: "Puerto Rican",
    cuisineSlug: "puerto-rican",
    flag: "🇵🇷",
    description: "Puerto Rico's traditional rice with pigeon peas - essential for holidays and celebrations.",
    prepTime: "15 mins",
    cookTime: "40 mins",
    servings: 8,
    difficulty: "Easy",
    ingredients: ["rice", "gandules", "sofrito", "sazón", "achiote oil", "olives", "capers", "pork"],
    searchVolume: "high",
    keywords: ["arroz con gandules recipe", "puerto rican rice", "pigeon peas rice", "christmas rice puerto rico"]
  },
  {
    slug: "pernil",
    title: "Pernil (Puerto Rican Roast Pork)",
    cuisine: "Puerto Rican",
    cuisineSlug: "puerto-rican",
    flag: "🇵🇷",
    description: "Slow-roasted Puerto Rican pork shoulder with crispy skin - the holiday centerpiece.",
    prepTime: "30 mins + marinating",
    cookTime: "6 hours",
    servings: 15,
    difficulty: "Medium",
    ingredients: ["pork shoulder", "adobo", "sofrito", "garlic", "oregano", "olive oil", "vinegar"],
    searchVolume: "high",
    keywords: ["pernil recipe", "puerto rican pernil", "roast pork shoulder", "christmas pernil"]
  },
  // Nigerian
  {
    slug: "jollof-rice",
    title: "Nigerian Jollof Rice",
    cuisine: "Nigerian",
    cuisineSlug: "nigerian",
    flag: "🇳🇬",
    description: "The legendary West African party rice - smoky, tomatoey, and absolutely delicious.",
    prepTime: "20 mins",
    cookTime: "45 mins",
    servings: 8,
    difficulty: "Medium",
    ingredients: ["rice", "tomato paste", "bell peppers", "scotch bonnet", "onion", "chicken stock", "thyme", "bay leaves", "curry powder"],
    searchVolume: "high",
    keywords: ["jollof rice recipe", "nigerian jollof rice", "west african rice", "party jollof"]
  },
  {
    slug: "egusi-soup",
    title: "Egusi Soup",
    cuisine: "Nigerian",
    cuisineSlug: "nigerian",
    flag: "🇳🇬",
    description: "Rich Nigerian melon seed soup with leafy greens - perfect with fufu or pounded yam.",
    prepTime: "25 mins",
    cookTime: "45 mins",
    servings: 6,
    difficulty: "Medium",
    ingredients: ["egusi seeds", "palm oil", "stockfish", "crayfish", "spinach", "scotch bonnet", "locust beans", "beef"],
    searchVolume: "high",
    keywords: ["egusi soup recipe", "nigerian egusi", "melon seed soup", "egusi and fufu"]
  },
  {
    slug: "suya",
    title: "Suya (Nigerian Spiced Kebab)",
    cuisine: "Nigerian",
    cuisineSlug: "nigerian",
    flag: "🇳🇬",
    description: "Spicy Nigerian street food skewers coated in yaji spice mix.",
    prepTime: "30 mins",
    cookTime: "15 mins",
    servings: 4,
    difficulty: "Easy",
    ingredients: ["beef", "suya spice (yaji)", "groundnut powder", "ginger", "garlic", "onion", "vegetable oil"],
    searchVolume: "high",
    keywords: ["suya recipe", "nigerian suya", "yaji spice", "african kebab"]
  },
  // Mexican
  {
    slug: "carnitas",
    title: "Mexican Carnitas",
    cuisine: "Mexican",
    cuisineSlug: "mexican",
    flag: "🇲🇽",
    description: "Crispy, tender Mexican pulled pork braised in its own fat - taco perfection.",
    prepTime: "15 mins",
    cookTime: "3 hours",
    servings: 8,
    difficulty: "Easy",
    ingredients: ["pork shoulder", "orange", "lime", "garlic", "cumin", "oregano", "bay leaves", "lard"],
    searchVolume: "high",
    keywords: ["carnitas recipe", "mexican carnitas", "pulled pork tacos", "authentic carnitas"]
  },
  {
    slug: "birria",
    title: "Birria (Mexican Beef Stew)",
    cuisine: "Mexican",
    cuisineSlug: "mexican",
    flag: "🇲🇽",
    description: "Rich, spicy Mexican beef stew perfect for tacos or consommé.",
    prepTime: "30 mins",
    cookTime: "4 hours",
    servings: 8,
    difficulty: "Medium",
    ingredients: ["beef chuck", "guajillo chiles", "ancho chiles", "tomatoes", "onion", "garlic", "cumin", "oregano", "cloves"],
    searchVolume: "high",
    keywords: ["birria recipe", "birria tacos", "mexican birria", "consomme birria"]
  },
  // Indian
  {
    slug: "butter-chicken",
    title: "Butter Chicken (Murgh Makhani)",
    cuisine: "Indian",
    cuisineSlug: "indian",
    flag: "🇮🇳",
    description: "Creamy, tomato-based chicken curry - India's most beloved dish worldwide.",
    prepTime: "20 mins",
    cookTime: "30 mins",
    servings: 4,
    difficulty: "Medium",
    ingredients: ["chicken", "yogurt", "tomatoes", "cream", "butter", "garam masala", "kashmiri chili", "garlic", "ginger", "fenugreek"],
    searchVolume: "high",
    keywords: ["butter chicken recipe", "murgh makhani", "indian butter chicken", "creamy chicken curry"]
  },
  {
    slug: "chicken-biryani",
    title: "Chicken Biryani",
    cuisine: "Indian",
    cuisineSlug: "indian",
    flag: "🇮🇳",
    description: "Aromatic layered rice dish with spiced chicken - the king of Indian cuisine.",
    prepTime: "45 mins",
    cookTime: "1 hour",
    servings: 6,
    difficulty: "Hard",
    ingredients: ["basmati rice", "chicken", "yogurt", "onions", "saffron", "garam masala", "biryani masala", "ghee", "mint", "cilantro"],
    searchVolume: "high",
    keywords: ["biryani recipe", "chicken biryani", "indian biryani", "hyderabadi biryani"]
  },
  // Korean
  {
    slug: "korean-fried-chicken",
    title: "Korean Fried Chicken",
    cuisine: "Korean",
    cuisineSlug: "korean",
    flag: "🇰🇷",
    description: "Crispy double-fried chicken with sweet and spicy gochujang glaze.",
    prepTime: "30 mins",
    cookTime: "30 mins",
    servings: 4,
    difficulty: "Medium",
    ingredients: ["chicken wings", "gochujang", "gochugaru", "soy sauce", "garlic", "ginger", "honey", "rice flour", "corn starch"],
    searchVolume: "high",
    keywords: ["korean fried chicken", "KFC recipe", "gochujang chicken", "crispy korean chicken"]
  },
  {
    slug: "kimchi-jjigae",
    title: "Kimchi Jjigae (Kimchi Stew)",
    cuisine: "Korean",
    cuisineSlug: "korean",
    flag: "🇰🇷",
    description: "Hearty Korean stew made with fermented kimchi, pork, and tofu.",
    prepTime: "15 mins",
    cookTime: "30 mins",
    servings: 4,
    difficulty: "Easy",
    ingredients: ["aged kimchi", "pork belly", "tofu", "gochugaru", "garlic", "scallions", "sesame oil"],
    searchVolume: "high",
    keywords: ["kimchi jjigae recipe", "kimchi stew", "korean stew", "kimchi soup"]
  },
  // Vietnamese
  {
    slug: "pho-bo",
    title: "Phở Bò (Vietnamese Beef Pho)",
    cuisine: "Vietnamese",
    cuisineSlug: "vietnamese",
    flag: "🇻🇳",
    description: "Aromatic Vietnamese beef noodle soup with star anise and cinnamon-spiced broth.",
    prepTime: "30 mins",
    cookTime: "6 hours",
    servings: 6,
    difficulty: "Medium",
    ingredients: ["beef bones", "rice noodles", "star anise", "cinnamon", "ginger", "onion", "fish sauce", "bean sprouts", "herbs"],
    searchVolume: "high",
    keywords: ["pho recipe", "vietnamese pho", "beef pho", "pho bo recipe"]
  },
  {
    slug: "banh-mi",
    title: "Bánh Mì (Vietnamese Sandwich)",
    cuisine: "Vietnamese",
    cuisineSlug: "vietnamese",
    flag: "🇻🇳",
    description: "Crusty baguette filled with savory proteins, pickled vegetables, and fresh herbs.",
    prepTime: "30 mins",
    cookTime: "20 mins",
    servings: 4,
    difficulty: "Medium",
    ingredients: ["baguette", "pork", "pâté", "pickled carrots", "daikon", "cilantro", "jalapeño", "mayo", "maggi"],
    searchVolume: "high",
    keywords: ["banh mi recipe", "vietnamese sandwich", "banh mi at home", "vietnamese baguette"]
  },
  // Thai
  {
    slug: "pad-thai",
    title: "Pad Thai",
    cuisine: "Thai",
    cuisineSlug: "thai",
    flag: "🇹🇭",
    description: "Thailand's most famous stir-fried noodle dish with tamarind, peanuts, and lime.",
    prepTime: "20 mins",
    cookTime: "15 mins",
    servings: 4,
    difficulty: "Medium",
    ingredients: ["rice noodles", "shrimp", "tofu", "eggs", "tamarind paste", "fish sauce", "palm sugar", "peanuts", "bean sprouts", "lime"],
    searchVolume: "high",
    keywords: ["pad thai recipe", "thai noodles", "authentic pad thai", "easy pad thai"]
  },
  {
    slug: "green-curry",
    title: "Thai Green Curry",
    cuisine: "Thai",
    cuisineSlug: "thai",
    flag: "🇹🇭",
    description: "Creamy coconut curry with green curry paste, chicken, and Thai basil.",
    prepTime: "15 mins",
    cookTime: "25 mins",
    servings: 4,
    difficulty: "Easy",
    ingredients: ["green curry paste", "coconut milk", "chicken", "Thai eggplant", "bamboo shoots", "Thai basil", "fish sauce", "palm sugar"],
    searchVolume: "high",
    keywords: ["green curry recipe", "thai green curry", "coconut curry", "chicken green curry"]
  },
  // Ethiopian
  {
    slug: "doro-wat",
    title: "Doro Wat (Ethiopian Chicken Stew)",
    cuisine: "Ethiopian",
    cuisineSlug: "ethiopian",
    flag: "🇪🇹",
    description: "Spicy Ethiopian chicken stew with berbere spice and hard-boiled eggs.",
    prepTime: "30 mins",
    cookTime: "2 hours",
    servings: 6,
    difficulty: "Medium",
    ingredients: ["chicken", "berbere", "niter kibbeh", "onions", "garlic", "ginger", "eggs", "cardamom"],
    searchVolume: "medium",
    keywords: ["doro wat recipe", "ethiopian chicken", "berbere chicken", "ethiopian stew"]
  }
];

// Group recipes by cuisine for easy access
export function getRecipesByCuisine(cuisineSlug: string): Recipe[] {
  return RECIPES.filter(r => r.cuisineSlug === cuisineSlug);
}

// Get all high-volume recipes for priority indexing
export function getHighVolumeRecipes(): Recipe[] {
  return RECIPES.filter(r => r.searchVolume === "high");
}

export default { RECIPES, getRecipesByCuisine, getHighVolumeRecipes };
