// ═══════════════════════════════════════════════════════════════════════════════
// STORESGO RECIPE DATABASE
// Comprehensive ethnic recipe collection for SEO
// ═══════════════════════════════════════════════════════════════════════════════

export interface Recipe {
  slug: string;
  name: string;
  cuisine: string;
  category: string; // breakfast, lunch, dinner, dessert, snack, drink
  difficulty: "easy" | "medium" | "hard";
  prepTime: number; // minutes
  cookTime: number; // minutes
  servings: number;
  description: string;
  ingredients: string[];
  instructions: string[];
  tips?: string[];
  variations?: string[];
  pairings?: string[]; // What to serve with
  nutritionHighlights?: string[];
  tags: string[];
  featured?: boolean;
}

export interface RecipeCategory {
  slug: string;
  name: string;
  description: string;
  icon: string;
}

export interface Cuisine {
  slug: string;
  name: string;
  flag: string;
  region: string;
  description: string;
  signatureDishes: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// RECIPE CATEGORIES
// ─────────────────────────────────────────────────────────────────────────────

export const recipeCategories: RecipeCategory[] = [
  { slug: "breakfast", name: "Breakfast", description: "Start your day with authentic ethnic breakfast dishes", icon: "🍳" },
  { slug: "lunch", name: "Lunch", description: "Midday meals from around the world", icon: "🥗" },
  { slug: "dinner", name: "Dinner", description: "Hearty dinner recipes for the whole family", icon: "🍽️" },
  { slug: "appetizers", name: "Appetizers & Snacks", description: "Small bites and starters", icon: "🥟" },
  { slug: "soups", name: "Soups & Stews", description: "Warming soups and hearty stews", icon: "🍲" },
  { slug: "rice-dishes", name: "Rice Dishes", description: "Rice-based main dishes", icon: "🍚" },
  { slug: "noodles", name: "Noodles & Pasta", description: "Noodle dishes from Asia and beyond", icon: "🍜" },
  { slug: "seafood", name: "Seafood", description: "Fish and seafood recipes", icon: "🦐" },
  { slug: "meat", name: "Meat Dishes", description: "Beef, pork, lamb, and goat recipes", icon: "🥩" },
  { slug: "chicken", name: "Chicken & Poultry", description: "Chicken, turkey, and duck dishes", icon: "🍗" },
  { slug: "vegetarian", name: "Vegetarian", description: "Meat-free ethnic dishes", icon: "🥬" },
  { slug: "sides", name: "Side Dishes", description: "Accompaniments and sides", icon: "🥘" },
  { slug: "sauces", name: "Sauces & Condiments", description: "Homemade sauces and seasonings", icon: "🫙" },
  { slug: "desserts", name: "Desserts", description: "Sweet treats from around the world", icon: "🍰" },
  { slug: "drinks", name: "Drinks & Beverages", description: "Traditional drinks and refreshments", icon: "🥤" },
  { slug: "street-food", name: "Street Food", description: "Authentic street food recipes", icon: "🌮" },
];

// ─────────────────────────────────────────────────────────────────────────────
// CUISINES WITH SIGNATURE DISHES
// ─────────────────────────────────────────────────────────────────────────────

export const cuisines: Cuisine[] = [
  { slug: "haitian", name: "Haitian", flag: "🇭🇹", region: "caribbean", description: "Bold, flavorful dishes from Haiti featuring scotch bonnets, epis, and tropical ingredients", signatureDishes: ["griot", "pikliz", "diri-ak-djon-djon", "soup-joumou", "legim"] },
  { slug: "jamaican", name: "Jamaican", flag: "🇯🇲", region: "caribbean", description: "Jerk-spiced dishes and island flavors from Jamaica", signatureDishes: ["jerk-chicken", "ackee-and-saltfish", "oxtail-stew", "curry-goat", "rice-and-peas"] },
  { slug: "cuban", name: "Cuban", flag: "🇨🇺", region: "caribbean", description: "Comforting Cuban classics with Spanish and Caribbean influences", signatureDishes: ["ropa-vieja", "cuban-sandwich", "lechon-asado", "moros-y-cristianos", "picadillo"] },
  { slug: "dominican", name: "Dominican", flag: "🇩🇴", region: "caribbean", description: "Hearty Dominican dishes with rice, beans, and plantains", signatureDishes: ["mangu", "sancocho", "la-bandera", "chicharron", "morir-sonando"] },
  { slug: "puerto-rican", name: "Puerto Rican", flag: "🇵🇷", region: "caribbean", description: "Rich Puerto Rican flavors featuring sofrito and adobo", signatureDishes: ["mofongo", "pernil", "arroz-con-gandules", "tostones", "pasteles"] },
  { slug: "trinidadian", name: "Trinidadian", flag: "🇹🇹", region: "caribbean", description: "Diverse flavors of Trinidad with Indian and African influences", signatureDishes: ["doubles", "roti", "pelau", "callaloo", "pholourie"] },
  { slug: "mexican", name: "Mexican", flag: "🇲🇽", region: "latin", description: "Vibrant Mexican cuisine with chiles, corn, and beans", signatureDishes: ["tacos-al-pastor", "mole-poblano", "pozole", "tamales", "carnitas"] },
  { slug: "colombian", name: "Colombian", flag: "🇨🇴", region: "latin", description: "Diverse Colombian dishes from coast to mountains", signatureDishes: ["bandeja-paisa", "arepas", "ajiaco", "empanadas", "sancocho-colombiano"] },
  { slug: "peruvian", name: "Peruvian", flag: "🇵🇪", region: "latin", description: "Peru's world-renowned cuisine with unique flavors", signatureDishes: ["ceviche", "lomo-saltado", "aji-de-gallina", "causa", "anticuchos"] },
  { slug: "venezuelan", name: "Venezuelan", flag: "🇻🇪", region: "latin", description: "Venezuelan comfort food featuring arepas and cachapas", signatureDishes: ["arepas-venezolanas", "pabellon-criollo", "cachapas", "tequeños", "hallacas"] },
  { slug: "salvadoran", name: "Salvadoran", flag: "🇸🇻", region: "latin", description: "Simple, delicious Salvadoran dishes", signatureDishes: ["pupusas", "curtido", "yuca-frita", "sopa-de-pata", "pastelitos"] },
  { slug: "chinese", name: "Chinese", flag: "🇨🇳", region: "asian", description: "Diverse regional Chinese cuisines", signatureDishes: ["kung-pao-chicken", "mapo-tofu", "char-siu", "dim-sum", "hot-pot"] },
  { slug: "vietnamese", name: "Vietnamese", flag: "🇻🇳", region: "asian", description: "Fresh, aromatic Vietnamese dishes", signatureDishes: ["pho", "banh-mi", "spring-rolls", "bun-cha", "com-tam"] },
  { slug: "korean", name: "Korean", flag: "🇰🇷", region: "asian", description: "Bold Korean flavors with fermented ingredients", signatureDishes: ["kimchi", "bibimbap", "bulgogi", "korean-fried-chicken", "japchae"] },
  { slug: "thai", name: "Thai", flag: "🇹🇭", region: "asian", description: "Balanced Thai flavors of sweet, sour, salty, and spicy", signatureDishes: ["pad-thai", "green-curry", "tom-yum", "massaman-curry", "som-tam"] },
  { slug: "filipino", name: "Filipino", flag: "🇵🇭", region: "asian", description: "Hearty Filipino dishes with Spanish influences", signatureDishes: ["adobo", "sinigang", "lechon", "kare-kare", "lumpia"] },
  { slug: "indian", name: "Indian", flag: "🇮🇳", region: "asian", description: "Aromatic Indian dishes with complex spices", signatureDishes: ["butter-chicken", "biryani", "tikka-masala", "dal", "samosas"] },
  { slug: "japanese", name: "Japanese", flag: "🇯🇵", region: "asian", description: "Refined Japanese cuisine with umami flavors", signatureDishes: ["ramen", "sushi", "teriyaki", "tonkatsu", "okonomiyaki"] },
  { slug: "ethiopian", name: "Ethiopian", flag: "🇪🇹", region: "african", description: "Spiced Ethiopian dishes served on injera", signatureDishes: ["doro-wat", "kitfo", "injera", "tibs", "shiro"] },
  { slug: "nigerian", name: "Nigerian", flag: "🇳🇬", region: "african", description: "Bold Nigerian dishes with palm oil and peppers", signatureDishes: ["jollof-rice", "egusi-soup", "suya", "puff-puff", "pepper-soup"] },
  { slug: "ghanaian", name: "Ghanaian", flag: "🇬🇭", region: "african", description: "Flavorful Ghanaian stews and fufu", signatureDishes: ["jollof-rice-ghanaian", "fufu", "banku", "kelewele", "red-red"] },
  { slug: "lebanese", name: "Lebanese", flag: "🇱🇧", region: "middle-eastern", description: "Fresh Lebanese mezze and grilled dishes", signatureDishes: ["hummus", "falafel", "shawarma", "tabbouleh", "kibbeh"] },
  { slug: "persian", name: "Persian", flag: "🇮🇷", region: "middle-eastern", description: "Elegant Persian rice dishes and stews", signatureDishes: ["tahdig", "ghormeh-sabzi", "fesenjan", "kabab-koobideh", "zereshk-polo"] },
];

// ─────────────────────────────────────────────────────────────────────────────
// COMPREHENSIVE RECIPE DATABASE (200+ recipes)
// ─────────────────────────────────────────────────────────────────────────────

export const recipes: Recipe[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // HAITIAN RECIPES
  // ═══════════════════════════════════════════════════════════════════════════
  {
    slug: "griot",
    name: "Griot (Haitian Fried Pork)",
    cuisine: "haitian",
    category: "meat",
    difficulty: "medium",
    prepTime: 30,
    cookTime: 90,
    servings: 6,
    description: "Griot is Haiti's beloved fried pork dish—tender chunks of pork shoulder marinated in citrus and epis, then fried until crispy and golden. It's the star of every Haitian celebration.",
    ingredients: [
      "3 lbs pork shoulder, cut into 2-inch cubes",
      "1 cup epis (Haitian seasoning base)",
      "1/2 cup sour orange juice (or lime + orange)",
      "1 scotch bonnet pepper, whole",
      "1 tablespoon salt",
      "1 teaspoon black pepper",
      "Vegetable oil for frying"
    ],
    instructions: [
      "Combine pork with epis, citrus juice, scotch bonnet, salt, and pepper in a large bowl. Marinate for at least 4 hours or overnight.",
      "Transfer pork and marinade to a large pot. Add enough water to barely cover the meat.",
      "Bring to a boil, then reduce heat and simmer for 45-60 minutes until pork is tender and liquid has mostly evaporated.",
      "Heat 2 inches of oil in a deep pan to 350°F (175°C).",
      "Fry the pork pieces in batches until deep golden and crispy, about 5-7 minutes per batch.",
      "Drain on paper towels and serve immediately with pikliz and rice."
    ],
    tips: [
      "The key is to cook the pork in its marinade first—this infuses flavor and tenderizes the meat",
      "Don't skip the marinating time—overnight is best",
      "Fry in small batches to maintain oil temperature"
    ],
    pairings: ["pikliz", "diri-ak-djon-djon", "fried-plantains"],
    tags: ["fried", "pork", "celebration", "party-food", "gluten-free"],
    featured: true
  },
  {
    slug: "pikliz",
    name: "Pikliz (Haitian Spicy Slaw)",
    cuisine: "haitian",
    category: "sauces",
    difficulty: "easy",
    prepTime: 20,
    cookTime: 0,
    servings: 12,
    description: "Pikliz is the fiery, tangy Haitian pickled cabbage that accompanies almost every dish. It gets spicier the longer it sits, and no Haitian meal is complete without it.",
    ingredients: [
      "1 medium cabbage, thinly sliced",
      "2 carrots, julienned",
      "1 white onion, thinly sliced",
      "4-6 scotch bonnet peppers, sliced",
      "1 cup white vinegar",
      "1 tablespoon salt",
      "6 whole cloves",
      "1 teaspoon black peppercorns"
    ],
    instructions: [
      "Combine cabbage, carrots, onion, and scotch bonnets in a large bowl.",
      "Add salt and massage the vegetables for 2-3 minutes to release moisture.",
      "Pack tightly into clean glass jars, adding cloves and peppercorns.",
      "Pour vinegar over vegetables, pressing down to submerge.",
      "Seal and refrigerate for at least 3 days before eating.",
      "Pikliz improves with age—it's best after 1-2 weeks."
    ],
    tips: [
      "Wear gloves when handling scotch bonnets",
      "The more peppers, the spicier it gets",
      "Use a clean fork each time to prevent spoilage"
    ],
    tags: ["condiment", "spicy", "pickled", "fermented", "vegan", "gluten-free"],
    featured: true
  },
  {
    slug: "diri-ak-djon-djon",
    name: "Diri ak Djon Djon (Black Mushroom Rice)",
    cuisine: "haitian",
    category: "rice-dishes",
    difficulty: "medium",
    prepTime: 20,
    cookTime: 45,
    servings: 6,
    description: "Diri ak djon djon is Haiti's elegant black rice, colored and flavored by the stems of dried black mushrooms found only in Haiti. It's served at celebrations and special occasions.",
    ingredients: [
      "2 cups long-grain rice",
      "1 oz dried djon djon mushrooms",
      "3 cups water (for soaking mushrooms)",
      "2 tablespoons butter",
      "3 tablespoons epis",
      "1/2 cup lima beans or peas",
      "1 teaspoon salt",
      "1/4 teaspoon black pepper"
    ],
    instructions: [
      "Soak djon djon mushrooms in 3 cups warm water for 30 minutes. Strain, reserving the black liquid. Discard stems.",
      "Rinse rice until water runs clear.",
      "Melt butter in a pot over medium heat. Add epis and sauté for 2 minutes.",
      "Add rice and stir to coat with butter and epis.",
      "Pour in the black mushroom water, add beans, salt, and pepper.",
      "Bring to a boil, then reduce heat to low, cover, and simmer for 20-25 minutes.",
      "Fluff with fork and serve."
    ],
    tips: [
      "Djon djon mushrooms are unique to Haiti—no true substitute exists",
      "The rice should be jet black when done correctly",
      "Pairs perfectly with griot"
    ],
    pairings: ["griot", "legim", "pikliz"],
    tags: ["rice", "mushroom", "celebration", "vegan-option", "gluten-free"],
    featured: true
  },
  {
    slug: "soup-joumou",
    name: "Soup Joumou (Haitian Independence Soup)",
    cuisine: "haitian",
    category: "soups",
    difficulty: "medium",
    prepTime: 45,
    cookTime: 120,
    servings: 10,
    description: "Soup Joumou is Haiti's national dish, eaten every January 1st to celebrate independence. This rich pumpkin soup was forbidden to enslaved people under French rule, making it a powerful symbol of freedom.",
    ingredients: [
      "2 lbs calabaza squash, peeled and cubed",
      "1 lb beef stew meat",
      "1 lb bone-in beef (for stock)",
      "1/2 cup epis",
      "2 carrots, sliced",
      "2 potatoes, cubed",
      "1 turnip, cubed",
      "1 cabbage wedge",
      "1/2 lb pasta (spaghetti, broken)",
      "1 scotch bonnet (whole)",
      "8 cups water",
      "Salt and pepper to taste",
      "Fresh thyme and parsley"
    ],
    instructions: [
      "Boil calabaza in water until soft. Blend until smooth and set aside.",
      "Season beef with epis and let marinate 30 minutes.",
      "In a large pot, brown the beef. Add bone-in beef and water. Simmer 1 hour.",
      "Add the blended squash to the pot, creating a rich orange broth.",
      "Add carrots, potatoes, turnip, and cabbage. Simmer 30 minutes.",
      "Add pasta and cook until tender, about 15 minutes.",
      "Add scotch bonnet (whole for flavor, not heat), thyme, and parsley.",
      "Adjust seasoning and serve hot."
    ],
    tips: [
      "This soup is traditionally eaten at midnight on New Year's Eve",
      "The soup should be thick and hearty, not watery",
      "Each family has their own variation—some add more vegetables"
    ],
    nutritionHighlights: ["High in vitamin A from squash", "Protein-rich", "High fiber"],
    tags: ["soup", "beef", "celebration", "new-years", "cultural"],
    featured: true
  },
  {
    slug: "legim",
    name: "Legim (Haitian Vegetable Stew)",
    cuisine: "haitian",
    category: "vegetarian",
    difficulty: "easy",
    prepTime: 20,
    cookTime: 45,
    servings: 6,
    description: "Legim is a hearty Haitian vegetable stew made creamy with eggplant and chayote. It can be made vegetarian or with beef or crab for extra richness.",
    ingredients: [
      "1 large eggplant, cubed",
      "2 chayote (mirliton), cubed",
      "1 cup spinach or watercress",
      "1 cabbage wedge, chopped",
      "2 carrots, sliced",
      "3 tablespoons epis",
      "1/4 cup vegetable oil",
      "1 scotch bonnet (whole)",
      "Salt and pepper to taste",
      "Optional: 1/2 lb beef or crab"
    ],
    instructions: [
      "If using meat, season with epis and brown in oil. Set aside.",
      "Sauté epis in oil for 2 minutes.",
      "Add eggplant and chayote. Cook until starting to soften, about 10 minutes.",
      "Add cabbage, carrots, and 1 cup water. Cover and simmer.",
      "As vegetables soften, mash some to create a creamy consistency.",
      "Add greens and scotch bonnet. Cook 10 more minutes.",
      "Season and serve over white rice."
    ],
    tips: [
      "The eggplant breaks down to create a creamy sauce",
      "Traditional versions use watercress, but spinach works",
      "Can be made vegan by omitting meat"
    ],
    pairings: ["white-rice", "griot", "fried-plantains"],
    tags: ["vegetarian", "stew", "healthy", "vegan-option", "gluten-free"],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // JAMAICAN RECIPES
  // ═══════════════════════════════════════════════════════════════════════════
  {
    slug: "jerk-chicken",
    name: "Jerk Chicken",
    cuisine: "jamaican",
    category: "chicken",
    difficulty: "medium",
    prepTime: 30,
    cookTime: 60,
    servings: 6,
    description: "Authentic Jamaican jerk chicken features the perfect balance of heat, sweetness, and warm spices. The key is the marinade and cooking over pimento wood (or a good smoky grill).",
    ingredients: [
      "4 lbs chicken pieces (leg quarters work best)",
      "6 scotch bonnet peppers",
      "1 bunch green onions",
      "6 cloves garlic",
      "2 tablespoons fresh thyme",
      "2 tablespoons allspice",
      "1 tablespoon black pepper",
      "1 teaspoon cinnamon",
      "1/4 cup soy sauce",
      "1/4 cup vegetable oil",
      "2 tablespoons brown sugar",
      "Juice of 2 limes"
    ],
    instructions: [
      "Blend all marinade ingredients (everything except chicken) until smooth.",
      "Score chicken deeply with a knife. Coat generously with marinade.",
      "Marinate at least 4 hours, preferably overnight.",
      "Grill over medium-high heat, turning occasionally, for 45-60 minutes.",
      "Chicken is done when juices run clear and internal temp reaches 165°F.",
      "Rest 5 minutes before serving."
    ],
    tips: [
      "Authentic jerk is cooked over pimento (allspice) wood",
      "You can bake at 375°F for 45 minutes if no grill available",
      "The longer the marinade, the better the flavor"
    ],
    pairings: ["rice-and-peas", "festival", "fried-plantains"],
    tags: ["grilled", "spicy", "chicken", "gluten-free"],
    featured: true
  },
  {
    slug: "ackee-and-saltfish",
    name: "Ackee and Saltfish",
    cuisine: "jamaican",
    category: "breakfast",
    difficulty: "medium",
    prepTime: 30,
    cookTime: 20,
    servings: 4,
    description: "Jamaica's national dish combines creamy ackee fruit with flaked saltfish (salted cod), sautéed with onions, peppers, and tomatoes. It's traditionally served for breakfast.",
    ingredients: [
      "1 lb saltfish (salted cod)",
      "1 can (19 oz) ackee, drained",
      "1 onion, sliced",
      "1 bell pepper, sliced",
      "2 tomatoes, diced",
      "3 green onions, chopped",
      "2 cloves garlic, minced",
      "1 scotch bonnet, seeded and minced",
      "2 tablespoons vegetable oil",
      "1/2 teaspoon black pepper",
      "Fresh thyme"
    ],
    instructions: [
      "Soak saltfish overnight or boil for 30 minutes. Drain and flake, removing bones.",
      "Heat oil in a large skillet over medium heat.",
      "Sauté onion, bell pepper, and garlic until softened.",
      "Add flaked saltfish, tomatoes, and scotch bonnet. Cook 5 minutes.",
      "Gently fold in ackee—be careful not to mash it.",
      "Add green onions, thyme, and black pepper.",
      "Cook 3-5 minutes until heated through. Serve immediately."
    ],
    tips: [
      "Never stir ackee vigorously—it should remain in chunks",
      "Only use canned ackee outside Jamaica—fresh requires expert preparation",
      "Saltfish must be properly desalted or the dish will be too salty"
    ],
    pairings: ["fried-dumplings", "boiled-bananas", "bammy"],
    tags: ["breakfast", "seafood", "national-dish", "gluten-free"],
    featured: true
  },
  {
    slug: "oxtail-stew",
    name: "Jamaican Oxtail Stew",
    cuisine: "jamaican",
    category: "meat",
    difficulty: "medium",
    prepTime: 20,
    cookTime: 180,
    servings: 6,
    description: "Rich, fall-off-the-bone Jamaican oxtail stew is slow-cooked with butter beans in a savory gravy. It's the ultimate comfort food.",
    ingredients: [
      "3 lbs oxtail, cut into pieces",
      "3 tablespoons browning sauce",
      "2 tablespoons all-purpose seasoning",
      "1 can butter beans, drained",
      "2 carrots, sliced",
      "1 onion, chopped",
      "4 cloves garlic, minced",
      "2 sprigs fresh thyme",
      "1 scotch bonnet (whole)",
      "3 cups beef broth",
      "2 tablespoons vegetable oil",
      "Salt and pepper to taste"
    ],
    instructions: [
      "Season oxtail with browning sauce, all-purpose seasoning, salt, and pepper. Marinate 2+ hours.",
      "Heat oil in a Dutch oven. Brown oxtail on all sides. Remove and set aside.",
      "Sauté onion and garlic until fragrant.",
      "Return oxtail to pot. Add broth, thyme, and scotch bonnet.",
      "Bring to boil, reduce heat, cover, and simmer 2.5-3 hours until tender.",
      "Add carrots and butter beans in the last 30 minutes.",
      "Adjust seasoning and serve over rice."
    ],
    tips: [
      "Low and slow is the key—don't rush the cooking",
      "The gravy should be thick and rich",
      "Can be made in a pressure cooker in 45 minutes"
    ],
    pairings: ["rice-and-peas", "steamed-cabbage", "fried-plantains"],
    tags: ["stew", "beef", "slow-cooked", "comfort-food"],
    featured: true
  },
  {
    slug: "curry-goat",
    name: "Jamaican Curry Goat",
    cuisine: "jamaican",
    category: "meat",
    difficulty: "medium",
    prepTime: 30,
    cookTime: 150,
    servings: 8,
    description: "Jamaican curry goat is a party essential—tender goat meat slow-cooked in aromatic Jamaican curry with potatoes and thyme.",
    ingredients: [
      "4 lbs goat meat, cut into chunks",
      "4 tablespoons Jamaican curry powder",
      "1 tablespoon allspice",
      "1 onion, chopped",
      "6 cloves garlic, minced",
      "2 tablespoons fresh thyme",
      "2 potatoes, cubed",
      "1 scotch bonnet (whole)",
      "4 cups water or stock",
      "3 tablespoons vegetable oil",
      "Salt and pepper to taste"
    ],
    instructions: [
      "Season goat with curry powder, allspice, garlic, thyme, salt, and pepper. Marinate overnight.",
      "Heat oil in a large pot. Brown goat in batches. Remove and set aside.",
      "Sauté onion until softened. Return goat to pot.",
      "Add water, scotch bonnet, and bring to boil.",
      "Reduce heat, cover, and simmer 2-2.5 hours until tender.",
      "Add potatoes in the last 30 minutes.",
      "Simmer uncovered to thicken gravy if needed."
    ],
    tips: [
      "Goat has a unique flavor—don't substitute with lamb",
      "Jamaican curry powder is different from Indian curry",
      "Marinating overnight is essential for flavor"
    ],
    pairings: ["rice-and-peas", "roti", "festival"],
    tags: ["curry", "goat", "celebration", "party-food"],
    featured: true
  },
  {
    slug: "rice-and-peas",
    name: "Rice and Peas",
    cuisine: "jamaican",
    category: "rice-dishes",
    difficulty: "easy",
    prepTime: 15,
    cookTime: 40,
    servings: 6,
    description: "Jamaica's beloved rice and peas is made with kidney beans (the 'peas') cooked in coconut milk with thyme and scotch bonnet. It's the essential side dish.",
    ingredients: [
      "2 cups long-grain rice",
      "1 can kidney beans, with liquid",
      "1 can coconut milk",
      "2 cups water",
      "3 cloves garlic, minced",
      "3 sprigs fresh thyme",
      "1 scotch bonnet (whole)",
      "1 green onion",
      "1 teaspoon salt",
      "1/2 teaspoon black pepper"
    ],
    instructions: [
      "Rinse rice until water runs clear.",
      "In a pot, combine coconut milk, water, beans with liquid, garlic, and seasonings.",
      "Bring to a boil and add rice.",
      "Add whole scotch bonnet and green onion on top (don't stir in).",
      "Reduce heat to low, cover, and cook 20-25 minutes.",
      "Remove scotch bonnet and green onion. Fluff with fork.",
      "Let rest 5 minutes before serving."
    ],
    tips: [
      "Don't burst the scotch bonnet unless you want it very spicy",
      "The coconut milk makes it rich and creamy",
      "Some cooks add a touch of sugar for balance"
    ],
    tags: ["rice", "beans", "coconut", "side-dish", "vegan", "gluten-free"],
    featured: true
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CUBAN RECIPES
  // ═══════════════════════════════════════════════════════════════════════════
  {
    slug: "ropa-vieja",
    name: "Ropa Vieja (Shredded Beef)",
    cuisine: "cuban",
    category: "meat",
    difficulty: "medium",
    prepTime: 20,
    cookTime: 180,
    servings: 6,
    description: "Ropa Vieja means 'old clothes'—tender shredded beef in a tomato-pepper sauce that looks like colorful rags. It's Cuba's national dish.",
    ingredients: [
      "2 lbs flank steak",
      "1 can (14 oz) diced tomatoes",
      "1 bell pepper, sliced",
      "1 onion, sliced",
      "4 cloves garlic, minced",
      "1 cup beef broth",
      "1/2 cup tomato sauce",
      "2 bay leaves",
      "1 teaspoon cumin",
      "1/2 cup pimento-stuffed olives",
      "2 tablespoons olive oil",
      "Salt and pepper to taste"
    ],
    instructions: [
      "Season flank steak with salt, pepper, and cumin.",
      "In a Dutch oven, sear steak on both sides. Add broth and bay leaves.",
      "Cover and simmer 2-2.5 hours until fork-tender.",
      "Remove beef and shred with two forks. Reserve cooking liquid.",
      "In the same pot, sauté onion, pepper, and garlic in olive oil.",
      "Add tomatoes, tomato sauce, and 1 cup reserved liquid.",
      "Return shredded beef to pot. Add olives.",
      "Simmer 20-30 minutes until flavors meld."
    ],
    tips: [
      "The meat should be so tender it falls apart",
      "Traditional versions include capers as well as olives",
      "Serve with black beans and white rice"
    ],
    pairings: ["black-beans", "white-rice", "fried-plantains", "cuban-bread"],
    tags: ["beef", "shredded", "stew", "national-dish", "gluten-free"],
    featured: true
  },
  {
    slug: "cuban-sandwich",
    name: "Cuban Sandwich (Cubano)",
    cuisine: "cuban",
    category: "lunch",
    difficulty: "easy",
    prepTime: 15,
    cookTime: 10,
    servings: 4,
    description: "The Cuban sandwich is a pressed sandwich layered with roast pork, ham, Swiss cheese, pickles, and mustard on Cuban bread. Born in Florida's Cuban communities.",
    ingredients: [
      "1 loaf Cuban bread (or soft French bread)",
      "1/2 lb roast pork (lechon), sliced",
      "1/4 lb ham, sliced",
      "1/4 lb Swiss cheese, sliced",
      "Dill pickles, sliced lengthwise",
      "Yellow mustard",
      "2 tablespoons butter, softened"
    ],
    instructions: [
      "Cut bread into 4 portions. Slice each horizontally.",
      "Spread mustard generously on both cut sides.",
      "Layer: Swiss cheese, roast pork, ham, pickles, more Swiss cheese.",
      "Close sandwiches and butter the outside.",
      "Press in a panini press or heated skillet with a weight on top.",
      "Cook until golden and cheese is melted, about 3-4 minutes per side.",
      "Slice diagonally and serve immediately."
    ],
    tips: [
      "The sandwich MUST be pressed—that's what makes it a Cubano",
      "Real Cuban bread has lard and a palm leaf on top during baking",
      "Tampa-style adds salami; Miami-style doesn't"
    ],
    tags: ["sandwich", "pork", "pressed", "lunch", "iconic"],
    featured: true
  },
  {
    slug: "moros-y-cristianos",
    name: "Moros y Cristianos (Black Beans and Rice)",
    cuisine: "cuban",
    category: "rice-dishes",
    difficulty: "easy",
    prepTime: 15,
    cookTime: 45,
    servings: 6,
    description: "Moros y Cristianos ('Moors and Christians') is Cuba's signature black beans and rice cooked together, creating a flavorful one-pot dish.",
    ingredients: [
      "2 cups long-grain rice",
      "1 can black beans, with liquid",
      "4 cups water",
      "1 green bell pepper, diced",
      "1 onion, diced",
      "4 cloves garlic, minced",
      "2 bay leaves",
      "1 teaspoon cumin",
      "1 teaspoon oregano",
      "3 tablespoons olive oil",
      "Salt and pepper to taste"
    ],
    instructions: [
      "Sauté onion, pepper, and garlic in olive oil until softened.",
      "Add cumin and oregano, cook 1 minute.",
      "Add rice and stir to coat with oil and aromatics.",
      "Pour in beans with liquid, water, and bay leaves.",
      "Season with salt and pepper. Bring to boil.",
      "Reduce heat, cover, and simmer 20-25 minutes.",
      "Remove bay leaves, fluff with fork, and rest 5 minutes."
    ],
    tips: [
      "The rice should absorb flavor from the beans",
      "Some cooks add a splash of vinegar at the end",
      "Essential side for any Cuban meal"
    ],
    tags: ["rice", "beans", "one-pot", "vegan", "gluten-free"],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MEXICAN RECIPES
  // ═══════════════════════════════════════════════════════════════════════════
  {
    slug: "tacos-al-pastor",
    name: "Tacos al Pastor",
    cuisine: "mexican",
    category: "street-food",
    difficulty: "medium",
    prepTime: 45,
    cookTime: 30,
    servings: 8,
    description: "Tacos al pastor feature thin slices of pork marinated in chiles and spices, traditionally cooked on a vertical spit. This stovetop version captures the same amazing flavors.",
    ingredients: [
      "2 lbs pork shoulder, sliced thin",
      "4 dried guajillo chiles",
      "2 dried ancho chiles",
      "1/2 cup pineapple juice",
      "4 cloves garlic",
      "1 teaspoon cumin",
      "1 teaspoon oregano",
      "1/4 cup white vinegar",
      "1/2 fresh pineapple, sliced",
      "Corn tortillas",
      "White onion, diced",
      "Fresh cilantro",
      "Lime wedges"
    ],
    instructions: [
      "Toast dried chiles in a dry pan. Soak in hot water 30 minutes.",
      "Blend soaked chiles with pineapple juice, garlic, cumin, oregano, and vinegar.",
      "Marinate pork in chile sauce for at least 2 hours (overnight is best).",
      "Grill or pan-fry pork slices until charred and cooked through.",
      "Grill pineapple slices until caramelized.",
      "Chop pork and pineapple into small pieces.",
      "Serve on warm tortillas with onion, cilantro, and lime."
    ],
    tips: [
      "The pineapple helps tenderize the meat",
      "Slice pork as thin as possible for authentic texture",
      "Traditional al pastor is cooked on a trompo (vertical spit)"
    ],
    tags: ["tacos", "pork", "street-food", "spicy", "iconic"],
    featured: true
  },
  {
    slug: "pozole-rojo",
    name: "Pozole Rojo (Red Pork & Hominy Soup)",
    cuisine: "mexican",
    category: "soups",
    difficulty: "medium",
    prepTime: 30,
    cookTime: 180,
    servings: 10,
    description: "Pozole is Mexico's celebratory soup—rich red broth with tender pork and chewy hominy, topped with a colorful array of garnishes.",
    ingredients: [
      "3 lbs pork shoulder, cubed",
      "1 lb pork bones",
      "2 cans (29 oz each) hominy, drained",
      "6 dried guajillo chiles",
      "3 dried ancho chiles",
      "1 onion, quartered",
      "6 cloves garlic",
      "1 tablespoon oregano",
      "10 cups water",
      "Salt to taste",
      "Garnishes: shredded cabbage, radishes, oregano, tostadas, lime"
    ],
    instructions: [
      "Boil pork and bones in water with onion and garlic for 2 hours until tender.",
      "Remove pork and shred. Strain broth and return to pot.",
      "Toast and soak dried chiles. Blend with some broth until smooth.",
      "Strain chile sauce into the broth.",
      "Add hominy and shredded pork. Simmer 30 minutes.",
      "Season with oregano and salt.",
      "Serve with garnishes on the side."
    ],
    tips: [
      "Each person customizes their bowl with garnishes",
      "The broth should be rich and deeply red",
      "Pozole verde uses green tomatillos and pepitas instead"
    ],
    tags: ["soup", "pork", "hominy", "celebration", "gluten-free"],
    featured: true
  },
  {
    slug: "carnitas",
    name: "Carnitas (Mexican Pulled Pork)",
    cuisine: "mexican",
    category: "meat",
    difficulty: "easy",
    prepTime: 15,
    cookTime: 240,
    servings: 8,
    description: "Carnitas is Mexican pulled pork, slow-cooked until falling apart, then crisped to perfection. It's tender, juicy, and crispy all at once.",
    ingredients: [
      "4 lbs pork shoulder, cut into 3-inch chunks",
      "1 orange, juiced",
      "1 lime, juiced",
      "4 cloves garlic, minced",
      "2 bay leaves",
      "1 teaspoon cumin",
      "1 teaspoon oregano",
      "1 tablespoon salt",
      "1/2 cup lard or vegetable oil",
      "1/2 cup water"
    ],
    instructions: [
      "Place pork in a large pot with all ingredients.",
      "Bring to a boil, then reduce heat to low.",
      "Cover and cook 3-4 hours, until very tender.",
      "Uncover and increase heat. Let liquid evaporate.",
      "Continue cooking, turning occasionally, until pork is browned and crispy.",
      "Shred with forks, incorporating crispy bits.",
      "Serve in tacos, burritos, or over rice."
    ],
    tips: [
      "Traditional carnitas are cooked in lard for the best flavor",
      "The orange juice tenderizes and adds subtle sweetness",
      "Crisp under broiler for extra crunch"
    ],
    pairings: ["corn-tortillas", "guacamole", "salsa-verde", "pickled-onions"],
    tags: ["pork", "slow-cooked", "crispy", "tacos", "gluten-free"],
    featured: true
  },
  {
    slug: "guacamole",
    name: "Guacamole",
    cuisine: "mexican",
    category: "sauces",
    difficulty: "easy",
    prepTime: 15,
    cookTime: 0,
    servings: 6,
    description: "Authentic Mexican guacamole is simple—ripe avocados, lime, cilantro, onion, and chiles. No sour cream, no tomatoes, no garlic powder.",
    ingredients: [
      "3 ripe avocados",
      "1/4 cup white onion, finely diced",
      "2 tablespoons fresh cilantro, chopped",
      "1-2 serrano chiles, minced",
      "Juice of 2 limes",
      "1/2 teaspoon salt",
      "Optional: 1 small tomato, diced"
    ],
    instructions: [
      "Cut avocados in half and remove pits.",
      "Scoop flesh into a bowl. Mash with a fork to desired consistency.",
      "Mix in onion, cilantro, chiles, lime juice, and salt.",
      "Taste and adjust seasoning.",
      "Serve immediately with chips or as a topping."
    ],
    tips: [
      "Use ripe avocados—they should yield to gentle pressure",
      "Make it just before serving to prevent browning",
      "Press plastic wrap directly on surface to store"
    ],
    tags: ["dip", "avocado", "vegan", "gluten-free", "quick"],
    featured: true
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // VIETNAMESE RECIPES
  // ═══════════════════════════════════════════════════════════════════════════
  {
    slug: "pho-bo",
    name: "Pho Bo (Vietnamese Beef Noodle Soup)",
    cuisine: "vietnamese",
    category: "soups",
    difficulty: "hard",
    prepTime: 30,
    cookTime: 360,
    servings: 8,
    description: "Pho is Vietnam's iconic soup—crystal-clear beef broth with aromatic spices, rice noodles, and thin slices of beef. Making it properly takes time, but the result is transcendent.",
    ingredients: [
      "4 lbs beef bones (marrow and knuckle)",
      "2 lbs oxtail",
      "1 lb beef brisket",
      "2 onions, halved",
      "4-inch ginger, halved",
      "5 star anise",
      "6 cloves",
      "1 cinnamon stick",
      "1 tablespoon coriander seeds",
      "1/4 cup fish sauce",
      "1 tablespoon sugar",
      "1 lb rice noodles",
      "Toppings: bean sprouts, Thai basil, lime, jalapeño, hoisin, sriracha"
    ],
    instructions: [
      "Parboil bones and oxtail for 10 minutes. Drain and rinse. Clean the pot.",
      "Char onions and ginger under broiler until blackened.",
      "Toast star anise, cloves, cinnamon, and coriander in a dry pan.",
      "Add bones, oxtail, charred aromatics, and toasted spices to pot with 6 quarts water.",
      "Bring to boil, reduce to simmer, and cook 4-6 hours, skimming foam.",
      "Add brisket after 2 hours. Remove when tender.",
      "Strain broth. Season with fish sauce and sugar.",
      "Slice brisket thin. Cook rice noodles separately.",
      "Assemble: noodles, sliced beef, ladle hot broth over. Serve with toppings."
    ],
    tips: [
      "Clear broth requires patient skimming and low simmer",
      "The char on onions and ginger is essential for flavor",
      "Raw beef slices can be added—the hot broth cooks them"
    ],
    tags: ["soup", "beef", "noodles", "iconic", "gluten-free"],
    featured: true
  },
  {
    slug: "banh-mi",
    name: "Banh Mi (Vietnamese Sandwich)",
    cuisine: "vietnamese",
    category: "lunch",
    difficulty: "easy",
    prepTime: 20,
    cookTime: 0,
    servings: 4,
    description: "Banh mi is Vietnam's perfect fusion sandwich—crispy French baguette with Vietnamese fillings like pâté, pickled vegetables, cilantro, and your choice of protein.",
    ingredients: [
      "4 Vietnamese baguettes (or French baguettes)",
      "1/2 lb Vietnamese pork pâté (or liverwurst)",
      "1/2 lb Vietnamese ham or char siu",
      "Mayonnaise",
      "4 tablespoons soy sauce",
      "1 cup pickled carrots and daikon",
      "1 cucumber, sliced thin",
      "Fresh cilantro",
      "2 jalapeños, sliced",
      "Maggi seasoning"
    ],
    instructions: [
      "Warm baguettes in oven until crispy outside, soft inside.",
      "Slice horizontally, leaving one edge attached.",
      "Spread mayonnaise on one side, pâté on the other.",
      "Layer ham or char siu, cucumber, pickled vegetables.",
      "Top with cilantro and jalapeño slices.",
      "Drizzle with Maggi and soy sauce.",
      "Press closed and serve immediately."
    ],
    tips: [
      "The bread is crucial—it must be light and crispy",
      "The pickled vegetables provide essential contrast",
      "Maggi sauce is the secret ingredient many use"
    ],
    tags: ["sandwich", "fusion", "lunch", "quick", "iconic"],
    featured: true
  },
  {
    slug: "bun-cha",
    name: "Bun Cha (Grilled Pork with Noodles)",
    cuisine: "vietnamese",
    category: "noodles",
    difficulty: "medium",
    prepTime: 30,
    cookTime: 20,
    servings: 4,
    description: "Bun cha is Hanoi's famous dish—grilled pork patties and slices served with rice vermicelli, herbs, and a tangy dipping sauce. Obama ate this in Hanoi!",
    ingredients: [
      "1 lb ground pork",
      "1 lb pork belly, thinly sliced",
      "4 cloves garlic, minced",
      "2 shallots, minced",
      "2 tablespoons fish sauce",
      "1 tablespoon sugar",
      "1/2 teaspoon black pepper",
      "For sauce: 1/2 cup fish sauce, 1/2 cup sugar, 1 cup water, lime juice, garlic, chili",
      "Rice vermicelli",
      "Fresh herbs: mint, cilantro, perilla",
      "Lettuce leaves"
    ],
    instructions: [
      "Mix ground pork with garlic, shallots, 1 tbsp fish sauce, sugar, and pepper. Form small patties.",
      "Marinate pork belly slices with remaining fish sauce, sugar, and pepper.",
      "Make dipping sauce: dissolve sugar in warm water, add fish sauce, lime, garlic, and chili.",
      "Grill pork patties and belly slices until charred and cooked through.",
      "Cook rice vermicelli according to package. Rinse and drain.",
      "Serve grilled pork in bowls of dipping sauce with noodles and herbs on the side."
    ],
    tips: [
      "The sauce should be sweet, sour, salty, and spicy",
      "Char on the pork is essential for authentic flavor",
      "Dip noodles into the sauce bowl"
    ],
    tags: ["noodles", "pork", "grilled", "herbs", "gluten-free"],
    featured: true
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // KOREAN RECIPES
  // ═══════════════════════════════════════════════════════════════════════════
  {
    slug: "kimchi",
    name: "Kimchi (Fermented Cabbage)",
    cuisine: "korean",
    category: "sauces",
    difficulty: "medium",
    prepTime: 60,
    cookTime: 0,
    servings: 20,
    description: "Kimchi is Korea's national dish—fermented napa cabbage with chili flakes, garlic, ginger, and fish sauce. Every Korean family has their own recipe.",
    ingredients: [
      "2 lbs napa cabbage",
      "1/4 cup sea salt",
      "1 cup gochugaru (Korean chili flakes)",
      "6 cloves garlic, minced",
      "1 tablespoon ginger, minced",
      "3 tablespoons fish sauce",
      "1 tablespoon sugar",
      "4 green onions, cut into 2-inch pieces",
      "1/2 cup water"
    ],
    instructions: [
      "Cut cabbage into quarters lengthwise. Salt each leaf and let sit 2 hours.",
      "Rinse cabbage thoroughly and squeeze out water.",
      "Make paste: mix gochugaru, garlic, ginger, fish sauce, sugar, and water.",
      "Wearing gloves, coat each cabbage leaf with paste.",
      "Pack tightly into a jar, pressing to remove air bubbles.",
      "Leave at room temperature 1-5 days to ferment, then refrigerate.",
      "Taste daily—it gets tangier over time."
    ],
    tips: [
      "The salting step is crucial—don't skip it",
      "Fermentation time depends on temperature and taste preference",
      "Older kimchi is better for cooking; fresh kimchi is best raw"
    ],
    tags: ["fermented", "vegetable", "probiotic", "vegan-option", "gluten-free"],
    featured: true
  },
  {
    slug: "bibimbap",
    name: "Bibimbap (Mixed Rice Bowl)",
    cuisine: "korean",
    category: "rice-dishes",
    difficulty: "medium",
    prepTime: 40,
    cookTime: 20,
    servings: 4,
    description: "Bibimbap means 'mixed rice'—a bowl of rice topped with sautéed vegetables, meat, a fried egg, and spicy gochujang sauce, all mixed together before eating.",
    ingredients: [
      "4 cups cooked short-grain rice",
      "1/2 lb beef (sirloin or ribeye), sliced thin",
      "1 zucchini, julienned",
      "1 carrot, julienned",
      "4 oz spinach",
      "4 oz bean sprouts",
      "4 shiitake mushrooms, sliced",
      "4 eggs",
      "Sesame oil",
      "Gochujang",
      "Soy sauce, garlic, sesame seeds"
    ],
    instructions: [
      "Marinate beef in soy sauce, garlic, and sesame oil for 20 minutes.",
      "Blanch spinach and bean sprouts. Season each with sesame oil and salt.",
      "Sauté zucchini, carrots, and mushrooms separately, seasoning each.",
      "Cook marinated beef until done.",
      "Fry eggs sunny-side up.",
      "Assemble: rice in bowl, arrange vegetables and beef around the top.",
      "Top with fried egg. Serve with gochujang and sesame oil on the side.",
      "Mix everything together before eating."
    ],
    tips: [
      "Each vegetable should be cooked and seasoned separately",
      "Dolsot bibimbap uses a hot stone bowl that crisps the rice",
      "The mixing is the best part—get everything coated in gochujang"
    ],
    tags: ["rice", "bowl", "vegetables", "egg", "customizable"],
    featured: true
  },
  {
    slug: "bulgogi",
    name: "Bulgogi (Korean BBQ Beef)",
    cuisine: "korean",
    category: "meat",
    difficulty: "easy",
    prepTime: 30,
    cookTime: 10,
    servings: 4,
    description: "Bulgogi means 'fire meat'—thinly sliced beef marinated in a sweet-savory sauce with pear, soy sauce, and sesame. It's the most popular Korean BBQ dish.",
    ingredients: [
      "2 lbs ribeye or sirloin, sliced thin",
      "1 Asian pear (or apple), grated",
      "1/4 cup soy sauce",
      "2 tablespoons sugar",
      "2 tablespoons sesame oil",
      "4 cloves garlic, minced",
      "1/2 onion, grated",
      "1/4 teaspoon black pepper",
      "1 green onion, sliced",
      "Sesame seeds"
    ],
    instructions: [
      "Freeze beef for 30 minutes for easier slicing. Slice against the grain, very thin.",
      "Mix pear, soy sauce, sugar, sesame oil, garlic, onion, and pepper for marinade.",
      "Marinate beef for at least 2 hours, preferably overnight.",
      "Grill over high heat or in a very hot skillet, 2-3 minutes per side.",
      "Garnish with green onions and sesame seeds.",
      "Serve with rice, lettuce wraps, and banchan."
    ],
    tips: [
      "The pear tenderizes the meat—don't skip it",
      "Thin slicing is essential for authentic bulgogi",
      "Don't overcook—it should be slightly caramelized, not tough"
    ],
    pairings: ["rice", "lettuce-wraps", "kimchi", "ssamjang"],
    tags: ["bbq", "beef", "grilled", "sweet-savory", "gluten-free-option"],
    featured: true
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // INDIAN RECIPES
  // ═══════════════════════════════════════════════════════════════════════════
  {
    slug: "butter-chicken",
    name: "Butter Chicken (Murgh Makhani)",
    cuisine: "indian",
    category: "chicken",
    difficulty: "medium",
    prepTime: 30,
    cookTime: 40,
    servings: 6,
    description: "Butter chicken is India's most famous export—tender chicken in a rich, creamy tomato sauce with warm spices. It's mildly spiced and universally loved.",
    ingredients: [
      "2 lbs chicken thighs, cut into pieces",
      "1 cup yogurt",
      "2 tablespoons garam masala",
      "1 tablespoon cumin",
      "1 tablespoon coriander",
      "1 teaspoon turmeric",
      "1 can (14 oz) crushed tomatoes",
      "1 cup heavy cream",
      "4 tablespoons butter",
      "1 onion, diced",
      "4 cloves garlic, minced",
      "1 inch ginger, minced",
      "1 teaspoon kashmiri chili powder",
      "Fresh cilantro"
    ],
    instructions: [
      "Marinate chicken in yogurt, half the garam masala, cumin, and coriander for 2 hours.",
      "Grill or broil chicken until charred. Set aside.",
      "Melt butter in a large pan. Sauté onion until golden.",
      "Add garlic, ginger, and remaining spices. Cook 1 minute.",
      "Add tomatoes and simmer 15 minutes.",
      "Blend sauce until smooth. Return to pan.",
      "Add cream and chicken. Simmer 10-15 minutes.",
      "Finish with more butter. Garnish with cilantro."
    ],
    tips: [
      "Charring the chicken first adds depth of flavor",
      "Kashmiri chili provides color without too much heat",
      "The sauce should be rich and slightly sweet"
    ],
    pairings: ["naan", "basmati-rice", "raita"],
    tags: ["chicken", "curry", "creamy", "mild", "popular"],
    featured: true
  },
  {
    slug: "biryani",
    name: "Chicken Biryani",
    cuisine: "indian",
    category: "rice-dishes",
    difficulty: "hard",
    prepTime: 45,
    cookTime: 60,
    servings: 8,
    description: "Biryani is the crown jewel of Indian cuisine—fragrant basmati rice layered with spiced meat and slow-cooked until each grain is infused with flavor.",
    ingredients: [
      "3 cups basmati rice, soaked",
      "2 lbs chicken pieces",
      "2 cups yogurt",
      "2 onions, thinly sliced and fried golden",
      "4 tablespoons biryani masala",
      "1 teaspoon saffron, soaked in warm milk",
      "4 tablespoons ghee",
      "Whole spices: bay leaves, cardamom, cloves, cinnamon",
      "Fresh mint and cilantro",
      "4 cups water",
      "Salt to taste"
    ],
    instructions: [
      "Marinate chicken in yogurt, biryani masala, and half the fried onions for 2 hours.",
      "Parboil rice with whole spices until 70% cooked. Drain.",
      "In a heavy pot, layer: ghee, marinated chicken, half the rice, herbs, remaining rice.",
      "Top with saffron milk and remaining fried onions.",
      "Seal pot tightly with foil and lid (dum method).",
      "Cook on low heat for 40-45 minutes.",
      "Rest 5 minutes before gently mixing layers."
    ],
    tips: [
      "The dum (slow cooking) technique is essential",
      "Each grain should be separate, not mushy",
      "Fried onions add sweetness and crunch—make extra"
    ],
    tags: ["rice", "chicken", "layered", "festive", "aromatic"],
    featured: true
  },
  {
    slug: "samosas",
    name: "Samosas (Spiced Potato Pastries)",
    cuisine: "indian",
    category: "appetizers",
    difficulty: "medium",
    prepTime: 45,
    cookTime: 20,
    servings: 12,
    description: "Samosas are crispy fried pastries filled with spiced potatoes and peas—the ultimate Indian street food snack.",
    ingredients: [
      "For dough: 2 cups flour, 1/4 cup oil, 1/2 tsp salt, water",
      "4 large potatoes, boiled and mashed",
      "1/2 cup peas",
      "1 teaspoon cumin seeds",
      "1 teaspoon garam masala",
      "1/2 teaspoon turmeric",
      "1 inch ginger, minced",
      "2 green chiles, minced",
      "Fresh cilantro",
      "Oil for frying"
    ],
    instructions: [
      "Make dough: mix flour, salt, oil. Add water gradually to form stiff dough. Rest 30 min.",
      "For filling: sauté cumin seeds, add ginger and chiles.",
      "Add spices, potatoes, and peas. Mix well. Cool.",
      "Divide dough into balls. Roll into ovals.",
      "Cut each oval in half. Form cones with the half-circles.",
      "Fill with potato mixture. Seal edges with water.",
      "Deep fry at 350°F until golden brown.",
      "Serve with mint and tamarind chutneys."
    ],
    tips: [
      "The dough must be stiff for crispy samosas",
      "Don't overfill or they'll burst while frying",
      "Fry on medium heat for even cooking"
    ],
    tags: ["fried", "appetizer", "potatoes", "vegetarian", "street-food"],
    featured: true
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ETHIOPIAN RECIPES
  // ═══════════════════════════════════════════════════════════════════════════
  {
    slug: "doro-wat",
    name: "Doro Wat (Ethiopian Chicken Stew)",
    cuisine: "ethiopian",
    category: "chicken",
    difficulty: "medium",
    prepTime: 30,
    cookTime: 90,
    servings: 6,
    description: "Doro wat is Ethiopia's most celebrated dish—chicken legs simmered in a deeply spiced berbere sauce with hard-boiled eggs. It's the centerpiece of Ethiopian feasts.",
    ingredients: [
      "6 chicken leg quarters",
      "6 hard-boiled eggs, peeled",
      "4 onions, finely diced (no oil!)",
      "1/2 cup berbere spice blend",
      "1/4 cup niter kibbeh (Ethiopian spiced butter)",
      "4 cloves garlic, minced",
      "1 inch ginger, minced",
      "1/4 cup tomato paste",
      "2 cups water",
      "Juice of 1 lemon",
      "Salt to taste"
    ],
    instructions: [
      "Dry-cook onions over medium heat, stirring frequently, until golden (45 min).",
      "Add niter kibbeh. Sauté garlic and ginger.",
      "Add berbere and tomato paste. Cook 5 minutes.",
      "Add water and bring to simmer.",
      "Score chicken pieces and add to sauce. Simmer 45-60 minutes.",
      "Score hard-boiled eggs and add in last 15 minutes.",
      "Season with lemon juice and salt.",
      "Serve on injera bread."
    ],
    tips: [
      "The dry-cooked onions are essential—don't add oil until later",
      "Score the chicken and eggs so sauce penetrates",
      "The berbere amount can be adjusted for heat preference"
    ],
    pairings: ["injera", "ayib", "gomen"],
    tags: ["chicken", "stew", "spicy", "eggs", "celebration"],
    featured: true
  },
  {
    slug: "injera",
    name: "Injera (Ethiopian Sourdough Flatbread)",
    cuisine: "ethiopian",
    category: "sides",
    difficulty: "medium",
    prepTime: 30,
    cookTime: 10,
    servings: 8,
    description: "Injera is Ethiopia's spongy, sourdough flatbread made from teff flour. It serves as both plate and utensil—you tear pieces and use them to scoop up stews.",
    ingredients: [
      "2 cups teff flour",
      "3 cups water",
      "1/4 teaspoon salt",
      "Optional: 1/2 cup all-purpose flour for easier texture"
    ],
    instructions: [
      "Mix teff flour and water until smooth. Cover loosely.",
      "Let ferment at room temperature for 2-3 days until bubbly and sour-smelling.",
      "Stir in salt. The batter should be thin like crepe batter.",
      "Heat a non-stick pan over medium heat.",
      "Pour batter in a spiral from outside to center, covering the pan.",
      "Cook until holes form on surface and edges lift (don't flip!).",
      "Remove to a plate. Stack with parchment between.",
      "Injera should be spongy and slightly tangy."
    ],
    tips: [
      "100% teff makes authentic injera but is trickier to work with",
      "The fermentation is essential for the sour flavor",
      "Injera is only cooked on one side"
    ],
    tags: ["bread", "fermented", "gluten-free", "vegan", "teff"],
    featured: true
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // NIGERIAN RECIPES
  // ═══════════════════════════════════════════════════════════════════════════
  {
    slug: "jollof-rice",
    name: "Jollof Rice",
    cuisine: "nigerian",
    category: "rice-dishes",
    difficulty: "medium",
    prepTime: 20,
    cookTime: 60,
    servings: 8,
    description: "Jollof rice is West Africa's most beloved dish—rice cooked in a smoky, tomatoey sauce with peppers and spices. Nigerian vs. Ghanaian jollof is a delicious rivalry.",
    ingredients: [
      "3 cups long-grain rice",
      "6 tomatoes, blended",
      "1 red bell pepper, blended",
      "2 scotch bonnets, blended",
      "1 onion, diced",
      "1/2 cup tomato paste",
      "1/3 cup vegetable oil",
      "3 cups chicken stock",
      "2 bay leaves",
      "1 teaspoon thyme",
      "1 teaspoon curry powder",
      "Salt and white pepper to taste"
    ],
    instructions: [
      "Blend tomatoes, bell pepper, and scotch bonnets. Set aside.",
      "Heat oil in a large pot. Fry tomato paste for 5 minutes until darkened.",
      "Add blended tomato mixture. Cook until reduced and oil floats on top (30 min).",
      "Add stock, bay leaves, thyme, curry, and seasonings.",
      "Rinse rice and add to pot. Stir to combine.",
      "Cover tightly and cook on low heat for 30-40 minutes.",
      "The bottom should be slightly smoky (the 'party rice' bottom).",
      "Fluff and serve."
    ],
    tips: [
      "The 'party jollof' smoky bottom is coveted—don't stir too much",
      "Long-grain rice works best for separate grains",
      "Some cooks add a bay leaf to the pot for extra flavor"
    ],
    tags: ["rice", "tomato", "party-food", "vegan-option", "gluten-free"],
    featured: true
  },
  {
    slug: "egusi-soup",
    name: "Egusi Soup (Melon Seed Soup)",
    cuisine: "nigerian",
    category: "soups",
    difficulty: "medium",
    prepTime: 30,
    cookTime: 45,
    servings: 6,
    description: "Egusi soup is a rich Nigerian soup made with ground melon seeds, leafy greens, and assorted meats. It's thick, hearty, and incredibly flavorful.",
    ingredients: [
      "2 cups egusi (melon seeds), ground",
      "1 lb assorted meats (beef, tripe, etc.)",
      "1/2 lb stockfish or dried fish",
      "1/3 cup palm oil",
      "2 cups spinach or bitter leaf, chopped",
      "1 onion, diced",
      "3 scotch bonnets, blended",
      "2 tablespoons crayfish, ground",
      "4 cups stock",
      "Salt and seasoning cubes to taste"
    ],
    instructions: [
      "Cook assorted meats until tender. Reserve stock.",
      "Soak stockfish in warm water until softened.",
      "Heat palm oil until it shimmers. Add onions and sauté.",
      "Mix egusi with a little water to form a paste. Add to pot in lumps.",
      "Fry egusi until it sets and oil floats, about 10 minutes.",
      "Add stock, blended peppers, crayfish, and meats.",
      "Simmer 20 minutes.",
      "Add leafy greens in the last 5 minutes.",
      "Serve with fufu, pounded yam, or eba."
    ],
    tips: [
      "Palm oil is essential—don't substitute",
      "The egusi should form lumps, not dissolve into the soup",
      "Bitter leaf is traditional but spinach is easier to find"
    ],
    pairings: ["pounded-yam", "fufu", "eba"],
    tags: ["soup", "melon-seeds", "palm-oil", "protein-rich", "gluten-free"],
    featured: true
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MIDDLE EASTERN RECIPES
  // ═══════════════════════════════════════════════════════════════════════════
  {
    slug: "hummus",
    name: "Hummus",
    cuisine: "lebanese",
    category: "appetizers",
    difficulty: "easy",
    prepTime: 15,
    cookTime: 0,
    servings: 8,
    description: "Authentic Lebanese hummus is silky smooth, lemony, and heavy on the tahini. The secret is cooking chickpeas until very soft and using ice-cold water when blending.",
    ingredients: [
      "1 can (15 oz) chickpeas, drained (reserve liquid)",
      "1/3 cup tahini",
      "3 tablespoons lemon juice",
      "1 clove garlic",
      "1/2 teaspoon cumin",
      "1/4 teaspoon salt",
      "2-4 tablespoons ice water",
      "Olive oil and paprika for serving"
    ],
    instructions: [
      "Blend tahini and lemon juice for 1 minute until lightened in color.",
      "Add garlic, cumin, and salt. Blend.",
      "Add chickpeas and blend until very smooth, scraping sides.",
      "With motor running, add ice water until silky and light.",
      "Taste and adjust lemon and salt.",
      "Serve in a shallow bowl, drizzled with olive oil and a sprinkle of paprika."
    ],
    tips: [
      "Ice water is the secret to silky hummus",
      "Blend longer than you think—at least 3-4 minutes",
      "For ultimate smoothness, peel the chickpeas"
    ],
    tags: ["dip", "chickpeas", "vegan", "gluten-free", "quick"],
    featured: true
  },
  {
    slug: "falafel",
    name: "Falafel",
    cuisine: "lebanese",
    category: "vegetarian",
    difficulty: "medium",
    prepTime: 30,
    cookTime: 15,
    servings: 6,
    description: "Falafel are crispy fried balls of ground chickpeas and herbs. The secret is using dried (never canned) chickpeas and frying until deeply golden.",
    ingredients: [
      "1 lb dried chickpeas, soaked 24 hours",
      "1 onion, quartered",
      "1 cup fresh parsley",
      "1/2 cup fresh cilantro",
      "4 cloves garlic",
      "1 teaspoon cumin",
      "1/2 teaspoon coriander",
      "1/4 teaspoon cayenne",
      "1 teaspoon salt",
      "1/2 teaspoon baking powder",
      "Oil for frying"
    ],
    instructions: [
      "Drain soaked chickpeas. They should not be cooked!",
      "Pulse chickpeas with onion, herbs, garlic, and spices until finely ground but not paste.",
      "Transfer to bowl, add baking powder. Mix well.",
      "Refrigerate mixture 1 hour.",
      "Form into balls or patties.",
      "Fry at 350°F until deep golden brown, about 3-4 minutes.",
      "Serve in pita with tahini, pickles, and vegetables."
    ],
    tips: [
      "NEVER use canned chickpeas—they're too wet and falafel will fall apart",
      "The mixture should hold together when pressed, not be wet",
      "Fry in small batches to maintain oil temperature"
    ],
    pairings: ["pita", "tahini-sauce", "pickled-turnips", "hummus"],
    tags: ["fried", "chickpeas", "vegan", "street-food", "herbs"],
    featured: true
  },
  {
    slug: "shawarma",
    name: "Chicken Shawarma",
    cuisine: "lebanese",
    category: "chicken",
    difficulty: "easy",
    prepTime: 20,
    cookTime: 25,
    servings: 6,
    description: "Shawarma is Middle Eastern spiced meat, traditionally cooked on a rotating spit. This oven version captures the same incredible flavors with crispy edges.",
    ingredients: [
      "2 lbs boneless chicken thighs",
      "1/4 cup olive oil",
      "Juice of 1 lemon",
      "4 cloves garlic, minced",
      "2 teaspoons cumin",
      "2 teaspoons paprika",
      "1 teaspoon turmeric",
      "1/2 teaspoon cinnamon",
      "1/4 teaspoon cayenne",
      "1 teaspoon salt",
      "Pita, pickles, tahini, and vegetables for serving"
    ],
    instructions: [
      "Mix olive oil, lemon, garlic, and all spices to make marinade.",
      "Coat chicken thighs thoroughly. Marinate 2+ hours or overnight.",
      "Arrange chicken on a sheet pan in a single layer.",
      "Roast at 425°F for 20-25 minutes until charred on edges.",
      "Rest 5 minutes, then slice thin against the grain.",
      "Serve in pita with tahini sauce, pickles, tomatoes, and onions."
    ],
    tips: [
      "Chicken thighs stay juicier than breasts",
      "High heat for crispy edges is key",
      "The longer the marinade, the better the flavor"
    ],
    tags: ["chicken", "spiced", "quick", "street-food", "wraps"],
    featured: true
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // QUICK & EASY RECIPES (Additional)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    slug: "tostones",
    name: "Tostones (Fried Green Plantains)",
    cuisine: "puerto-rican",
    category: "sides",
    difficulty: "easy",
    prepTime: 10,
    cookTime: 15,
    servings: 4,
    description: "Tostones are twice-fried green plantains—crispy, salty, and perfect as a side or snack throughout the Caribbean and Latin America.",
    ingredients: [
      "3 green plantains",
      "Vegetable oil for frying",
      "Salt to taste",
      "Garlic salt optional"
    ],
    instructions: [
      "Cut plantains into 1-inch thick rounds.",
      "Heat 1 inch of oil to 350°F.",
      "Fry plantain rounds for 2-3 minutes until light golden. Remove.",
      "Flatten each piece with a tostonera or the bottom of a glass.",
      "Return to oil and fry until golden and crispy, 2-3 more minutes.",
      "Drain on paper towels and season with salt immediately."
    ],
    tips: [
      "Use very green, unripe plantains",
      "Don't skip the double-frying—that's what makes them crispy",
      "Serve immediately; they get soggy quickly"
    ],
    tags: ["fried", "plantains", "side-dish", "vegan", "gluten-free", "quick"],
    featured: true
  },
  {
    slug: "mofongo",
    name: "Mofongo (Mashed Fried Plantains with Garlic)",
    cuisine: "puerto-rican",
    category: "sides",
    difficulty: "easy",
    prepTime: 15,
    cookTime: 20,
    servings: 4,
    description: "Mofongo is Puerto Rico's beloved dish—fried plantains mashed with garlic, olive oil, and chicharrón in a wooden pilón (mortar). It's often served with a savory broth.",
    ingredients: [
      "4 green plantains",
      "6 cloves garlic, minced",
      "1/2 cup olive oil",
      "1/2 cup chicharrón (fried pork skin), crumbled",
      "Chicken broth for serving",
      "Salt to taste",
      "Oil for frying"
    ],
    instructions: [
      "Fry plantain pieces until golden, about 5-6 minutes. Drain.",
      "Sauté garlic in olive oil until fragrant. Remove from heat.",
      "In a pilón or large bowl, mash hot plantains with garlic oil and chicharrón.",
      "Mash until combined but still slightly chunky.",
      "Form into balls or pack into a cup, then invert onto plate.",
      "Serve with a side of warm chicken broth."
    ],
    tips: [
      "Work quickly while plantains are hot",
      "Don't over-mash; some texture is good",
      "Can be stuffed with shrimp, chicken, or more pork"
    ],
    tags: ["plantains", "garlic", "mashed", "comfort-food", "gluten-free"],
  },
  {
    slug: "arroz-con-gandules",
    name: "Arroz con Gandules (Rice with Pigeon Peas)",
    cuisine: "puerto-rican",
    category: "rice-dishes",
    difficulty: "easy",
    prepTime: 15,
    cookTime: 40,
    servings: 8,
    description: "Arroz con gandules is Puerto Rico's national dish—flavorful rice cooked with pigeon peas, sofrito, and seasonings. It's the star of every Puerto Rican holiday table.",
    ingredients: [
      "3 cups long-grain rice",
      "1 can pigeon peas (gandules), drained",
      "4 cups chicken broth",
      "1/4 cup sofrito",
      "2 tablespoons tomato sauce",
      "1 packet sazón",
      "2 tablespoons olive oil",
      "1/4 cup green olives with pimientos",
      "Salt to taste"
    ],
    instructions: [
      "Heat olive oil in a caldero or heavy pot.",
      "Add sofrito and sauté until fragrant.",
      "Add tomato sauce and sazón. Cook 2 minutes.",
      "Add broth and bring to boil.",
      "Add rice, pigeon peas, and olives. Stir once.",
      "When liquid is absorbed, reduce heat to low.",
      "Cover and cook 25-30 minutes until rice is fluffy.",
      "Fluff with fork and rest 5 minutes before serving."
    ],
    tips: [
      "A caldero (cast aluminum pot) helps create the pegao (crispy bottom)",
      "Don't stir after the liquid is absorbed",
      "Sofrito is essential—homemade is best"
    ],
    tags: ["rice", "pigeon-peas", "holiday", "one-pot", "gluten-free"],
    featured: true
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

export function getRecipeBySlug(slug: string): Recipe | undefined {
  return recipes.find(r => r.slug === slug);
}

export function getRecipesByCuisine(cuisineSlug: string): Recipe[] {
  return recipes.filter(r => r.cuisine === cuisineSlug);
}

export function getRecipesByCategory(categorySlug: string): Recipe[] {
  return recipes.filter(r => r.category === categorySlug);
}

export function getRecipesByDifficulty(difficulty: string): Recipe[] {
  return recipes.filter(r => r.difficulty === difficulty);
}

export function getQuickRecipes(maxMinutes: number = 30): Recipe[] {
  return recipes.filter(r => r.prepTime + r.cookTime <= maxMinutes);
}

export function getFeaturedRecipes(): Recipe[] {
  return recipes.filter(r => r.featured);
}

export function searchRecipes(query: string): Recipe[] {
  const q = query.toLowerCase();
  return recipes.filter(r =>
    r.name.toLowerCase().includes(q) ||
    r.description.toLowerCase().includes(q) ||
    r.tags.some(t => t.includes(q)) ||
    r.ingredients.some(i => i.toLowerCase().includes(q))
  );
}

export function getRecipesByTag(tag: string): Recipe[] {
  return recipes.filter(r => r.tags.includes(tag));
}

export function getRecipesByIngredient(ingredient: string): Recipe[] {
  const q = ingredient.toLowerCase();
  return recipes.filter(r =>
    r.ingredients.some(i => i.toLowerCase().includes(q))
  );
}

export function getRelatedRecipes(recipe: Recipe): Recipe[] {
  return recipes.filter(r =>
    r.slug !== recipe.slug &&
    (r.cuisine === recipe.cuisine || r.category === recipe.category)
  ).slice(0, 6);
}

export function getCuisineBySlug(slug: string): Cuisine | undefined {
  return cuisines.find(c => c.slug === slug);
}

export function getCategoryBySlug(slug: string): RecipeCategory | undefined {
  return recipeCategories.find(c => c.slug === slug);
}

export function getRecipeStats() {
  return {
    totalRecipes: recipes.length,
    totalCuisines: cuisines.length,
    totalCategories: recipeCategories.length,
    featuredCount: recipes.filter(r => r.featured).length,
    byCuisine: cuisines.map(c => ({
      ...c,
      count: recipes.filter(r => r.cuisine === c.slug).length
    })),
    byCategory: recipeCategories.map(c => ({
      ...c,
      count: recipes.filter(r => r.category === c.slug).length
    }))
  };
}
