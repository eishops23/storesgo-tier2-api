// ═══════════════════════════════════════════════════════════════════════════════
// STORESGO INGREDIENT ENCYCLOPEDIA DATA
// Comprehensive database of ethnic/specialty ingredients
// ═══════════════════════════════════════════════════════════════════════════════

export interface Ingredient {
  slug: string;
  name: string;
  alternateName?: string[];
  category: string;
  cuisines: string[];
  description: string;
  flavorProfile: string;
  commonUses: string[];
  substitutes: string[];
  storageInfo: string;
  nutritionHighlights?: string[];
  buyingTips?: string;
  funFact?: string;
}

export interface IngredientCategory {
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
}

// ─────────────────────────────────────────────────────────────────────────────
// INGREDIENT CATEGORIES
// ─────────────────────────────────────────────────────────────────────────────

export const ingredientCategories: IngredientCategory[] = [
  { slug: "spices", name: "Spices & Seasonings", description: "Dried spices, spice blends, and seasonings from around the world", icon: "🌶️" },
  { slug: "sauces", name: "Sauces & Condiments", description: "Cooking sauces, table sauces, and condiments", icon: "🫙" },
  { slug: "grains", name: "Grains & Rice", description: "Rice varieties, ancient grains, and cereals", icon: "🌾" },
  { slug: "noodles", name: "Noodles & Pasta", description: "Asian noodles, pasta varieties, and wrappers", icon: "🍜" },
  { slug: "proteins", name: "Proteins & Meats", description: "Dried proteins, preserved meats, and seafood", icon: "🥩" },
  { slug: "produce", name: "Fresh Produce", description: "Specialty fruits, vegetables, and herbs", icon: "🥬" },
  { slug: "dairy", name: "Dairy & Alternatives", description: "Cheeses, milks, and dairy alternatives", icon: "🧀" },
  { slug: "oils", name: "Oils & Fats", description: "Cooking oils, rendered fats, and specialty oils", icon: "🫒" },
  { slug: "sweeteners", name: "Sweeteners", description: "Sugars, syrups, and natural sweeteners", icon: "🍯" },
  { slug: "beans", name: "Beans & Legumes", description: "Dried beans, lentils, and legumes", icon: "🫘" },
  { slug: "flours", name: "Flours & Starches", description: "Specialty flours, starches, and thickeners", icon: "🌾" },
  { slug: "pickled", name: "Pickled & Preserved", description: "Pickled vegetables, preserved foods, and fermented items", icon: "🥒" },
  { slug: "beverages", name: "Beverages", description: "Teas, coffees, and drink mixes", icon: "🍵" },
  { slug: "canned", name: "Canned & Jarred", description: "Canned goods, pastes, and jarred ingredients", icon: "🥫" },
  { slug: "dried", name: "Dried & Dehydrated", description: "Dried fruits, vegetables, and mushrooms", icon: "🍄" },
];

// ─────────────────────────────────────────────────────────────────────────────
// CUISINES
// ─────────────────────────────────────────────────────────────────────────────

export const cuisines: Cuisine[] = [
  // Caribbean
  { slug: "haitian", name: "Haitian", flag: "🇭🇹", region: "caribbean" },
  { slug: "jamaican", name: "Jamaican", flag: "🇯🇲", region: "caribbean" },
  { slug: "cuban", name: "Cuban", flag: "🇨🇺", region: "caribbean" },
  { slug: "dominican", name: "Dominican", flag: "🇩🇴", region: "caribbean" },
  { slug: "puerto-rican", name: "Puerto Rican", flag: "🇵🇷", region: "caribbean" },
  { slug: "trinidadian", name: "Trinidadian", flag: "🇹🇹", region: "caribbean" },
  // Latin American
  { slug: "mexican", name: "Mexican", flag: "🇲🇽", region: "latin" },
  { slug: "colombian", name: "Colombian", flag: "🇨🇴", region: "latin" },
  { slug: "peruvian", name: "Peruvian", flag: "🇵🇪", region: "latin" },
  { slug: "venezuelan", name: "Venezuelan", flag: "🇻🇪", region: "latin" },
  { slug: "brazilian", name: "Brazilian", flag: "🇧🇷", region: "latin" },
  { slug: "salvadoran", name: "Salvadoran", flag: "🇸🇻", region: "latin" },
  { slug: "guatemalan", name: "Guatemalan", flag: "🇬🇹", region: "latin" },
  // Asian
  { slug: "chinese", name: "Chinese", flag: "🇨🇳", region: "asian" },
  { slug: "japanese", name: "Japanese", flag: "🇯🇵", region: "asian" },
  { slug: "korean", name: "Korean", flag: "🇰🇷", region: "asian" },
  { slug: "vietnamese", name: "Vietnamese", flag: "🇻🇳", region: "asian" },
  { slug: "thai", name: "Thai", flag: "🇹🇭", region: "asian" },
  { slug: "filipino", name: "Filipino", flag: "🇵🇭", region: "asian" },
  { slug: "indian", name: "Indian", flag: "🇮🇳", region: "asian" },
  { slug: "indonesian", name: "Indonesian", flag: "🇮🇩", region: "asian" },
  // African
  { slug: "nigerian", name: "Nigerian", flag: "🇳🇬", region: "african" },
  { slug: "ethiopian", name: "Ethiopian", flag: "🇪🇹", region: "african" },
  { slug: "ghanaian", name: "Ghanaian", flag: "🇬🇭", region: "african" },
  { slug: "senegalese", name: "Senegalese", flag: "🇸🇳", region: "african" },
  // Middle Eastern
  { slug: "lebanese", name: "Lebanese", flag: "🇱🇧", region: "middle-eastern" },
  { slug: "moroccan", name: "Moroccan", flag: "🇲🇦", region: "middle-eastern" },
  { slug: "persian", name: "Persian", flag: "🇮🇷", region: "middle-eastern" },
];

// ─────────────────────────────────────────────────────────────────────────────
// COMPREHENSIVE INGREDIENT DATABASE
// ─────────────────────────────────────────────────────────────────────────────

export const ingredients: Ingredient[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // CARIBBEAN INGREDIENTS
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Haitian
  {
    slug: "epis",
    name: "Epis",
    alternateName: ["Haitian Seasoning Base", "Green Seasoning"],
    category: "sauces",
    cuisines: ["haitian"],
    description: "Epis is the aromatic foundation of Haitian cuisine—a vibrant green seasoning paste made from fresh herbs, peppers, and aromatics. Every Haitian household has their own recipe, passed down through generations.",
    flavorProfile: "Herbaceous, garlicky, bright, and aromatic with subtle heat",
    commonUses: ["Marinades for griot (fried pork)", "Seasoning rice and beans", "Base for stews and soups", "Marinating chicken and fish"],
    substitutes: ["Sofrito (Puerto Rican)", "Recaito", "Green seasoning (Trinidadian)"],
    storageInfo: "Refrigerate for up to 2 weeks or freeze in ice cube trays for up to 3 months",
    nutritionHighlights: ["Rich in vitamins from fresh herbs", "Contains beneficial compounds from garlic"],
    buyingTips: "Look for bright green color with no browning. Fresh epis should smell vibrant and herbaceous.",
    funFact: "The word 'epis' comes from the French 'épice' meaning spice, reflecting Haiti's French colonial history."
  },
  {
    slug: "pikliz",
    name: "Pikliz",
    alternateName: ["Haitian Pickled Vegetables", "Haitian Slaw"],
    category: "pickled",
    cuisines: ["haitian"],
    description: "Pikliz is Haiti's beloved spicy pickled cabbage condiment. This fiery, tangy slaw is the perfect accompaniment to griot, fried plantains, and virtually any Haitian dish that needs a kick.",
    flavorProfile: "Spicy, tangy, crunchy, with pronounced vinegar notes",
    commonUses: ["Topping for griot", "Served with fried foods", "Accompaniment to rice dishes", "Garnish for sandwiches"],
    substitutes: ["Curtido (Salvadoran)", "Kimchi (less vinegary)", "Pickled jalapeños"],
    storageInfo: "Refrigerate for up to 1 month. Flavor develops over time.",
    nutritionHighlights: ["High in vitamin C", "Probiotic benefits from fermentation", "Low calorie"],
    funFact: "Pikliz gets spicier the longer it sits—some Haitian grandmothers keep jars for months!"
  },
  {
    slug: "scotch-bonnet-pepper",
    name: "Scotch Bonnet Pepper",
    alternateName: ["Bonet", "Caribbean Red Pepper"],
    category: "produce",
    cuisines: ["haitian", "jamaican", "trinidadian"],
    description: "The scotch bonnet is the quintessential Caribbean pepper, known for its distinctive shape resembling a Scottish tam o'shanter hat. Despite its intense heat, it has a sweet, fruity flavor that's irreplaceable in Caribbean cooking.",
    flavorProfile: "Fruity, sweet, intensely spicy (100,000-350,000 Scoville units)",
    commonUses: ["Jerk seasoning", "Hot sauces", "Pepper sauce", "Stews and soups"],
    substitutes: ["Habanero pepper (close heat, less fruity)", "Bird's eye chili (more heat, less fruity)"],
    storageInfo: "Refrigerate fresh peppers for 1-2 weeks. Can be frozen whole for 6 months.",
    nutritionHighlights: ["Extremely high in vitamin C", "Contains capsaicin with metabolism benefits"],
    buyingTips: "Choose firm, glossy peppers without soft spots. Color doesn't indicate ripeness—green to red are all usable.",
    funFact: "Scotch bonnets are closely related to habaneros but have a more complex, fruity flavor profile."
  },
  
  // Jamaican
  {
    slug: "allspice",
    name: "Allspice",
    alternateName: ["Pimento", "Jamaica Pepper", "Myrtle Pepper"],
    category: "spices",
    cuisines: ["jamaican", "caribbean"],
    description: "Allspice is Jamaica's gift to world cuisine—the dried unripe berries of the Pimenta dioica tree. Despite its name suggesting a blend, it's a single spice with complex flavors resembling cinnamon, nutmeg, and cloves combined.",
    flavorProfile: "Warm, sweet, combining notes of cinnamon, nutmeg, and cloves",
    commonUses: ["Jerk seasoning", "Caribbean curries", "Baking", "Pickling", "Mulled drinks"],
    substitutes: ["Equal parts cinnamon, nutmeg, and cloves", "Cloves alone in a pinch"],
    storageInfo: "Whole berries last 3-4 years in airtight container. Ground allspice loses potency after 6 months.",
    nutritionHighlights: ["Contains eugenol with anti-inflammatory properties", "Rich in manganese"],
    buyingTips: "Buy whole berries when possible—they retain flavor much longer than ground.",
    funFact: "Jamaica produces most of the world's allspice, and the wood from allspice trees is traditionally used for smoking jerk."
  },
  {
    slug: "jerk-seasoning",
    name: "Jerk Seasoning",
    alternateName: ["Jerk Spice", "Jamaican Jerk"],
    category: "spices",
    cuisines: ["jamaican"],
    description: "Jerk seasoning is Jamaica's most famous culinary export—a fiery, aromatic blend that transforms any protein into an island feast. The blend combines the heat of scotch bonnets with warm allspice and fresh aromatics.",
    flavorProfile: "Spicy, aromatic, earthy, with sweet and savory notes",
    commonUses: ["Marinating chicken, pork, fish", "Grilling and smoking meats", "Seasoning vegetables", "Flavoring rice"],
    substitutes: ["Homemade blend of allspice, thyme, scotch bonnet, garlic, ginger"],
    storageInfo: "Dry rub keeps 6 months in airtight container. Wet jerk paste refrigerates 2 weeks, freezes 3 months.",
    nutritionHighlights: ["Contains metabolism-boosting capsaicin", "Rich in antioxidants from spices"],
    funFact: "The word 'jerk' may come from the Spanish 'charqui' (dried meat) or the Quechua 'ch'arki'—the origin of 'jerky'."
  },
  {
    slug: "ackee",
    name: "Ackee",
    alternateName: ["Aki", "Achee"],
    category: "canned",
    cuisines: ["jamaican"],
    description: "Ackee is Jamaica's national fruit and half of the beloved national dish, ackee and saltfish. When cooked, its creamy yellow flesh has an egg-like texture and subtle, buttery flavor.",
    flavorProfile: "Mild, creamy, slightly nutty, buttery",
    commonUses: ["Ackee and saltfish", "Curried ackee", "Ackee patties", "Breakfast dishes"],
    substitutes: ["Scrambled eggs (for texture)", "Hearts of palm (for appearance)"],
    storageInfo: "Canned ackee keeps 2-3 years unopened. Once opened, refrigerate and use within 3 days.",
    nutritionHighlights: ["High in protein for a fruit", "Good source of vitamin C and zinc"],
    buyingTips: "Only buy canned ackee from reputable sources—fresh ackee requires expert preparation to be safe.",
    funFact: "Ackee was brought to Jamaica from West Africa on slave ships in the 18th century and is named after the Akan people's word 'ankye'."
  },
  {
    slug: "callaloo",
    name: "Callaloo",
    alternateName: ["Amaranth Leaves", "Bhaji"],
    category: "produce",
    cuisines: ["jamaican", "trinidadian", "caribbean"],
    description: "Callaloo refers to leafy greens used throughout the Caribbean, typically amaranth or taro leaves. In Jamaica, it's often sautéed with saltfish, while in Trinidad, it becomes a creamy coconut-based soup.",
    flavorProfile: "Earthy, slightly bitter, spinach-like",
    commonUses: ["Jamaican callaloo and saltfish", "Trinidadian callaloo soup", "Steamed as side dish", "Added to rice"],
    substitutes: ["Spinach", "Swiss chard", "Collard greens", "Kale"],
    storageInfo: "Fresh callaloo keeps 3-5 days refrigerated. Canned callaloo keeps 2 years.",
    nutritionHighlights: ["Extremely high in iron", "Rich in calcium and vitamins A and C"],
    funFact: "The word 'callaloo' can refer to either the leaf vegetable OR the dish made from it, depending on the island."
  },

  // Cuban
  {
    slug: "mojo-criollo",
    name: "Mojo Criollo",
    alternateName: ["Cuban Mojo", "Mojo Sauce"],
    category: "sauces",
    cuisines: ["cuban"],
    description: "Mojo criollo is the soul of Cuban cooking—a garlicky, citrusy marinade and sauce made with sour orange juice. It's essential for lechón asado (roast pork) and gives Cuban cuisine its distinctive tangy-garlicky character.",
    flavorProfile: "Intensely garlicky, citrusy, tangy, with cumin undertones",
    commonUses: ["Marinade for roast pork", "Yuca con mojo", "Tostones topping", "Grilled meats", "Cuban sandwiches"],
    substitutes: ["Mix of orange and lime juice with lots of garlic", "Bitter orange juice with garlic and cumin"],
    storageInfo: "Refrigerate for up to 2 weeks. Flavors meld and improve after 24 hours.",
    nutritionHighlights: ["High in vitamin C", "Contains beneficial compounds from garlic"],
    buyingTips: "Look for versions with naranja agria (sour orange) listed as an ingredient for authentic flavor.",
    funFact: "The word 'mojo' comes from the Portuguese 'molho' meaning sauce, brought to Cuba via the Canary Islands."
  },
  {
    slug: "sazon-goya",
    name: "Sazón",
    alternateName: ["Sazón Goya", "Latin Seasoning"],
    category: "spices",
    cuisines: ["cuban", "puerto-rican", "dominican"],
    description: "Sazón is the secret weapon of Latin American home cooks—a seasoning blend that adds color, flavor, and depth to everything it touches. Its distinctive orange-red color comes from annatto.",
    flavorProfile: "Savory, slightly earthy, with garlic and cumin notes",
    commonUses: ["Rice and beans", "Stews", "Meat marinades", "Soups", "Sofrito enhancement"],
    substitutes: ["Homemade blend of annatto, cumin, coriander, garlic powder, oregano, salt"],
    storageInfo: "Sealed packets last 2-3 years. Once opened, use within 6 months.",
    nutritionHighlights: ["Contains annatto with antioxidant properties"],
    buyingTips: "Available with or without MSG—check labels if you prefer to avoid it.",
    funFact: "Sazón literally means 'seasoning' in Spanish, and every Latin American country has their own version."
  },
  {
    slug: "bijol",
    name: "Bijol",
    alternateName: ["Bija", "Annatto Powder"],
    category: "spices",
    cuisines: ["cuban"],
    description: "Bijol is Cuba's go-to coloring agent for rice, giving arroz amarillo its signature golden hue. It's a blend of annatto seeds and cumin that adds both color and subtle flavor.",
    flavorProfile: "Mildly earthy, slightly peppery, with subtle cumin notes",
    commonUses: ["Yellow rice (arroz amarillo)", "Paella", "Stews", "Marinades"],
    substitutes: ["Achiote powder", "Saffron (more expensive)", "Turmeric (different flavor)"],
    storageInfo: "Keeps 2-3 years in a cool, dry place away from light.",
    nutritionHighlights: ["Contains carotenoids from annatto"],
    funFact: "Bijol was created in Cuba as an affordable saffron substitute that could achieve similar coloring."
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // LATIN AMERICAN INGREDIENTS
  // ═══════════════════════════════════════════════════════════════════════════

  // Mexican
  {
    slug: "chipotle-in-adobo",
    name: "Chipotle Peppers in Adobo",
    alternateName: ["Chipotles en Adobo", "Chipotle Adobo"],
    category: "canned",
    cuisines: ["mexican"],
    description: "Chipotle peppers in adobo are smoke-dried jalapeños rehydrated in a tangy, slightly sweet tomato-based sauce. This pantry staple adds instant depth, smokiness, and heat to countless dishes.",
    flavorProfile: "Smoky, moderately spicy, tangy, with subtle sweetness",
    commonUses: ["Marinades and sauces", "Tacos and burritos", "Soups and stews", "Burgers and sandwiches", "Dips and spreads"],
    substitutes: ["Smoked paprika + cayenne", "Ancho chile paste + liquid smoke"],
    storageInfo: "Transfer unused portion to glass jar and refrigerate for 2 weeks, or freeze for 6 months.",
    nutritionHighlights: ["Contains capsaicin", "Good source of vitamin A"],
    buyingTips: "A little goes a long way—even a teaspoon of the adobo sauce adds significant flavor.",
    funFact: "The word 'chipotle' comes from the Nahuatl 'chīlpoctli' meaning 'smoked chili'."
  },
  {
    slug: "masa-harina",
    name: "Masa Harina",
    alternateName: ["Corn Flour", "Instant Corn Masa"],
    category: "flours",
    cuisines: ["mexican", "guatemalan", "salvadoran"],
    description: "Masa harina is nixtamalized corn flour—the essential ingredient for authentic tortillas, tamales, pupusas, and more. The nixtamalization process transforms ordinary corn into something magical.",
    flavorProfile: "Earthy, slightly sweet, distinctively corn-forward",
    commonUses: ["Corn tortillas", "Tamales", "Pupusas", "Gorditas", "Sopes", "Atole"],
    substitutes: ["Fresh masa (superior but harder to find)", "No true substitute—cornmeal won't work"],
    storageInfo: "Keeps 6-9 months in cool, dry place. Refrigerate or freeze for longer storage.",
    nutritionHighlights: ["Nixtamalization increases niacin availability", "Good source of fiber"],
    buyingTips: "Maseca is the most common brand. Look for 'instant corn masa flour' on the label.",
    funFact: "Nixtamalization was developed by Mesoamerican civilizations over 3,500 years ago and prevents pellagra."
  },
  {
    slug: "epazote",
    name: "Epazote",
    alternateName: ["Mexican Tea", "Wormseed", "Hierba Santa"],
    category: "produce",
    cuisines: ["mexican"],
    description: "Epazote is Mexican cuisine's most distinctive herb—loved for its pungent, almost medicinal flavor that's essential in black beans. It's an acquired taste that becomes addictive once you acquire it.",
    flavorProfile: "Pungent, earthy, slightly minty, with petroleum-like notes",
    commonUses: ["Black beans (frijoles de olla)", "Quesadillas", "Soups", "Mole verde", "Esquites"],
    substitutes: ["No true substitute—cilantro + oregano + mint can approximate", "Omit if unavailable"],
    storageInfo: "Fresh epazote keeps 1 week refrigerated. Dried keeps 6 months but loses potency.",
    nutritionHighlights: ["Traditionally used as digestive aid", "Contains beneficial essential oils"],
    buyingTips: "Fresh is strongly preferred. Look for it at Mexican markets or grow your own—it's easy.",
    funFact: "Epazote is said to reduce the gas-producing effects of beans, which is why it's always cooked with them in Mexico."
  },
  {
    slug: "achiote-paste",
    name: "Achiote Paste",
    alternateName: ["Recado Rojo", "Annatto Paste"],
    category: "spices",
    cuisines: ["mexican", "yucatan"],
    description: "Achiote paste is Yucatán's essential seasoning—a brick-red paste made from annatto seeds, spices, and citrus. It's the soul of cochinita pibil and gives Yucatecan cuisine its distinctive color and flavor.",
    flavorProfile: "Earthy, slightly sweet, mildly peppery, with citrus notes",
    commonUses: ["Cochinita pibil", "Pollo pibil", "Tacos al pastor", "Fish tikin xic", "Marinades"],
    substitutes: ["Annatto powder + cumin + oregano + citrus juice"],
    storageInfo: "Keeps 1 year refrigerated after opening. Frozen lasts indefinitely.",
    nutritionHighlights: ["Rich in carotenoids", "Contains beneficial compounds from spices"],
    buyingTips: "El Yucateco brand is authentic and widely available. Avoid pastes with too many fillers.",
    funFact: "Ancient Maya used achiote not just for cooking but as body paint, medicine, and even as a sunscreen."
  },
  {
    slug: "cotija-cheese",
    name: "Cotija Cheese",
    alternateName: ["Queso Cotija", "Mexican Parmesan"],
    category: "dairy",
    cuisines: ["mexican"],
    description: "Cotija is Mexico's aged, crumbly, salty cheese—named after the town of Cotija in Michoacán. Often called 'the Parmesan of Mexico,' it adds salty, tangy punch to everything from elotes to tacos.",
    flavorProfile: "Salty, sharp, tangy, crumbly",
    commonUses: ["Elotes (street corn)", "Tacos and tostadas", "Salads", "Beans", "Enchiladas"],
    substitutes: ["Feta cheese", "Pecorino Romano", "Aged ricotta salata"],
    storageInfo: "Refrigerate wrapped in plastic for 3-4 weeks. Freezes well for 3 months.",
    nutritionHighlights: ["High in protein", "Good source of calcium"],
    buyingTips: "Comes in two styles: 'fresco' (younger, milder) and 'añejo' (aged, saltier, crumblier).",
    funFact: "Authentic Cotija has protected designation of origin in Mexico, similar to European PDO cheeses."
  },
  {
    slug: "queso-fresco",
    name: "Queso Fresco",
    alternateName: ["Fresh Cheese", "Queso Blanco"],
    category: "dairy",
    cuisines: ["mexican", "latin"],
    description: "Queso fresco is the gentle, mild fresh cheese that appears on Mexican tables daily. Its soft, crumbly texture and milky flavor make it perfect for topping spicy dishes without overpowering them.",
    flavorProfile: "Mild, milky, slightly tangy, fresh",
    commonUses: ["Tacos and enchiladas", "Black beans", "Salads", "Fresh fruit", "Antojitos"],
    substitutes: ["Mild feta", "Farmer's cheese", "Ricotta salata", "Fresh goat cheese"],
    storageInfo: "Highly perishable—use within 2 weeks of opening. Keep tightly wrapped.",
    nutritionHighlights: ["Lower in fat than aged cheeses", "Good protein source"],
    buyingTips: "Check expiration dates carefully. Fresher is better with this cheese.",
    funFact: "Queso fresco doesn't melt like other cheeses—it softens but holds its shape, making it perfect for grilling."
  },

  // Colombian
  {
    slug: "panela",
    name: "Panela",
    alternateName: ["Piloncillo", "Rapadura", "Chancaca"],
    category: "sweeteners",
    cuisines: ["colombian", "mexican", "latin"],
    description: "Panela is unrefined whole cane sugar—pure sugarcane juice that's been boiled down and solidified. It retains all the molasses and minerals that are stripped from white sugar, giving it deep caramel flavor.",
    flavorProfile: "Deep caramel, molasses-forward, with hints of honey and rum",
    commonUses: ["Agua de panela (Colombian drink)", "Moles and adobos", "Baking", "Coffee and hot drinks", "Sauces"],
    substitutes: ["Dark brown sugar + molasses", "Jaggery", "Dark muscovado sugar"],
    storageInfo: "Keeps indefinitely in airtight container. May harden over time—grate when needed.",
    nutritionHighlights: ["Contains iron, calcium, and other minerals", "Less processed than refined sugar"],
    buyingTips: "Comes in cones, blocks, or granulated. Cones are most traditional; granulated is most convenient.",
    funFact: "Colombia is the second-largest producer of panela in the world and Colombians drink 'agua de panela' like Americans drink coffee."
  },
  {
    slug: "ajiaco-herbs",
    name: "Guascas",
    alternateName: ["Galinsoga", "Potato Weed"],
    category: "dried",
    cuisines: ["colombian"],
    description: "Guascas is the herb that makes Colombian ajiaco authentic. This dried leaf adds an irreplaceable herby, slightly artichoke-like flavor to Colombia's beloved chicken and potato soup.",
    flavorProfile: "Herbaceous, slightly bitter, artichoke-like",
    commonUses: ["Ajiaco bogotano", "Soups and stews", "Colombian chicken dishes"],
    substitutes: ["No true substitute—a mix of bay leaf and oregano can approximate"],
    storageInfo: "Dried guascas keeps 1 year in cool, dark place.",
    nutritionHighlights: ["Traditional medicinal herb", "Contains beneficial compounds"],
    buyingTips: "Look for whole dried leaves, not powder. Colombian grocery stores are the best source.",
    funFact: "Guascas grows wild in many places, including North America, where it's often considered a weed."
  },

  // Peruvian
  {
    slug: "aji-amarillo",
    name: "Ají Amarillo",
    alternateName: ["Yellow Peruvian Pepper", "Ají Escabeche"],
    category: "produce",
    cuisines: ["peruvian"],
    description: "Ají amarillo is Peru's beloved golden pepper—the heart and soul of Peruvian cuisine. Despite its bright color, it has moderate heat and a uniquely fruity, slightly tropical flavor.",
    flavorProfile: "Fruity, moderately spicy, with hints of passion fruit and raisin",
    commonUses: ["Ají de gallina", "Causa", "Papa a la huancaína", "Ceviche", "Sauces"],
    substitutes: ["Habanero (hotter, less fruity)", "Yellow bell pepper + cayenne + honey"],
    storageInfo: "Fresh keeps 2 weeks refrigerated. Paste lasts months refrigerated, indefinitely frozen.",
    nutritionHighlights: ["High in vitamin C", "Contains capsaicin"],
    buyingTips: "Paste is more common outside Peru and works perfectly for most recipes.",
    funFact: "There are over 50 varieties of ají peppers in Peru, but amarillo is the undisputed king."
  },
  {
    slug: "huacatay",
    name: "Huacatay",
    alternateName: ["Black Mint", "Peruvian Black Mint", "Muña"],
    category: "produce",
    cuisines: ["peruvian"],
    description: "Huacatay is Peruvian black mint—an intensely aromatic herb with a flavor unlike anything else. It's essential for ocopa sauce and gives many Peruvian dishes their distinctive herbal punch.",
    flavorProfile: "Intensely minty, herbaceous, with basil and tarragon notes",
    commonUses: ["Ocopa sauce", "Pachamanca", "Roasted meats", "Potato dishes", "Green sauces"],
    substitutes: ["Equal parts mint, basil, and tarragon (approximation only)"],
    storageInfo: "Fresh keeps 1 week refrigerated. Paste keeps several months refrigerated.",
    nutritionHighlights: ["Rich in essential oils", "Traditional digestive aid"],
    buyingTips: "Most commonly available as paste in jars. Fresh is rare outside Peru.",
    funFact: "Huacatay has been cultivated in the Andes for thousands of years and was used by the Inca."
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ASIAN INGREDIENTS
  // ═══════════════════════════════════════════════════════════════════════════

  // Chinese
  {
    slug: "soy-sauce",
    name: "Soy Sauce",
    alternateName: ["Shoyu", "Jiang You", "Soya Sauce"],
    category: "sauces",
    cuisines: ["chinese", "japanese", "korean", "vietnamese", "thai"],
    description: "Soy sauce is the foundational seasoning of East Asian cuisine—a fermented condiment made from soybeans, wheat, salt, and water. Its complex umami depth took centuries to perfect.",
    flavorProfile: "Salty, deeply savory, complex umami, slightly sweet",
    commonUses: ["Stir-fries", "Marinades", "Dipping sauces", "Fried rice", "Soups", "Braises"],
    substitutes: ["Tamari (gluten-free)", "Coconut aminos", "Liquid aminos"],
    storageInfo: "Unopened keeps indefinitely. Refrigerate after opening for best flavor, lasts 2+ years.",
    nutritionHighlights: ["Contains natural glutamates", "Some protein from fermentation"],
    buyingTips: "Light soy sauce for cooking, dark for color and richness. Japanese shoyu is sweeter than Chinese.",
    funFact: "Traditional soy sauce takes 6 months to 2 years to ferment, while mass-produced versions take only 2 days using hydrolysis."
  },
  {
    slug: "oyster-sauce",
    name: "Oyster Sauce",
    alternateName: ["Hao You", "Oyster Flavored Sauce"],
    category: "sauces",
    cuisines: ["chinese", "thai", "vietnamese"],
    description: "Oyster sauce is Cantonese cooking's secret weapon—a thick, savory-sweet sauce made from oyster extracts. It adds incomparable depth and glossy finish to stir-fries and braises.",
    flavorProfile: "Savory, slightly sweet, briny, intensely umami",
    commonUses: ["Stir-fried vegetables", "Beef and broccoli", "Fried noodles", "Glazes", "Marinades"],
    substitutes: ["Hoisin + soy sauce", "Mushroom vegetarian oyster sauce", "Fish sauce + sugar"],
    storageInfo: "Refrigerate after opening for up to 6 months.",
    nutritionHighlights: ["Contains minerals from oyster extract", "Good source of zinc"],
    buyingTips: "Premium brands list 'oyster extractives' as first ingredient, not 'sugar' or 'water'.",
    funFact: "Oyster sauce was invented by accident in 1888 when a Cantonese cook forgot about his simmering oysters."
  },
  {
    slug: "shaoxing-wine",
    name: "Shaoxing Wine",
    alternateName: ["Chinese Cooking Wine", "Shao Hsing", "Rice Wine"],
    category: "beverages",
    cuisines: ["chinese"],
    description: "Shaoxing wine is China's most important cooking wine—a fermented rice wine from Zhejiang province. It adds depth, removes fishiness, and brings dishes together in ways no substitute can match.",
    flavorProfile: "Nutty, slightly sweet, complex, with hints of caramel",
    commonUses: ["Marinades", "Stir-fries", "Drunken chicken", "Braised dishes", "Dumpling fillings"],
    substitutes: ["Dry sherry (closest)", "Sake + tiny bit of sugar", "Mirin (sweeter)"],
    storageInfo: "Keeps indefinitely in cool, dark place. Quality improves with age.",
    nutritionHighlights: ["Contains amino acids from fermentation"],
    buyingTips: "Avoid 'cooking wine' with added salt. Look for drinkable Shaoxing wine for best results.",
    funFact: "Premium aged Shaoxing wine can be over 100 years old and is drunk, not cooked with."
  },
  {
    slug: "five-spice-powder",
    name: "Five Spice Powder",
    alternateName: ["Chinese Five Spice", "Wu Xiang Fen"],
    category: "spices",
    cuisines: ["chinese", "vietnamese"],
    description: "Five spice powder embodies the Chinese philosophy of balance—combining five flavors: sweet, sour, bitter, savory, and salty. This aromatic blend perfumes everything from roast duck to mooncakes.",
    flavorProfile: "Warm, licorice-forward, sweet, aromatic, complex",
    commonUses: ["Roast duck and pork", "Marinades", "Braised dishes", "Mooncakes", "Spiced nuts"],
    substitutes: ["Equal parts cinnamon, cloves, star anise, fennel, Sichuan peppercorn"],
    storageInfo: "Keeps 6 months in airtight container. Make small batches for best flavor.",
    nutritionHighlights: ["Contains beneficial compounds from star anise and cinnamon"],
    buyingTips: "A little goes a long way—start with 1/4 teaspoon and adjust.",
    funFact: "The 'five' doesn't refer to exactly five spices—traditional blends might have more, representing the five elements."
  },
  {
    slug: "black-bean-sauce",
    name: "Fermented Black Beans",
    alternateName: ["Douchi", "Chinese Black Beans", "Salted Black Beans"],
    category: "sauces",
    cuisines: ["chinese"],
    description: "Fermented black beans are one of China's oldest seasonings—soybeans preserved in salt until they develop intense, funky, savory depth. They're the soul of black bean sauce dishes.",
    flavorProfile: "Intensely salty, funky, earthy, deeply savory",
    commonUses: ["Black bean chicken", "Steamed fish", "Clams in black bean sauce", "Stir-fries"],
    substitutes: ["Black bean garlic sauce (convenient)", "Miso + soy sauce (different but umami)"],
    storageInfo: "Dry beans keep indefinitely. Rinse before using to reduce saltiness.",
    nutritionHighlights: ["Probiotic benefits", "High in protein"],
    buyingTips: "Look for whole beans rather than sauce for more control. Yang Jiang brand is excellent.",
    funFact: "Archaeological evidence shows fermented black beans were made in China over 2,000 years ago."
  },
  {
    slug: "hoisin-sauce",
    name: "Hoisin Sauce",
    alternateName: ["Chinese BBQ Sauce", "Peking Sauce"],
    category: "sauces",
    cuisines: ["chinese", "vietnamese"],
    description: "Hoisin is China's beloved sweet-savory sauce—thick, fragrant, and essential for Peking duck and moo shu pork. Its name means 'seafood sauce' though it contains no seafood.",
    flavorProfile: "Sweet, savory, with hints of garlic and five spice",
    commonUses: ["Peking duck", "Spring rolls dipping", "Pho condiment", "Glazes", "Stir-fry sauces"],
    substitutes: ["Plum sauce + soy sauce", "BBQ sauce + soy sauce + molasses"],
    storageInfo: "Refrigerate after opening for up to 18 months.",
    buyingTips: "Lee Kum Kee is the most widely available quality brand.",
    funFact: "Despite meaning 'seafood sauce,' hoisin is completely vegetarian and contains no seafood."
  },
  {
    slug: "sesame-oil",
    name: "Toasted Sesame Oil",
    alternateName: ["Asian Sesame Oil", "Ma You"],
    category: "oils",
    cuisines: ["chinese", "japanese", "korean"],
    description: "Toasted sesame oil is liquid gold in Asian cooking—a finishing oil with intense nutty aroma that transforms dishes with just a few drops. It's a seasoning, not a cooking oil.",
    flavorProfile: "Intensely nutty, toasted, aromatic",
    commonUses: ["Finishing stir-fries", "Dressings", "Marinades", "Dipping sauces", "Fried rice"],
    substitutes: ["No true substitute—use toasted sesame seeds for similar flavor"],
    storageInfo: "Refrigerate to prevent rancidity. Lasts 6+ months refrigerated.",
    nutritionHighlights: ["Contains sesamol with antioxidant properties", "Rich in vitamin E"],
    buyingTips: "Buy small bottles—a little goes a long way and it can go rancid. Japanese brands are often highest quality.",
    funFact: "Cold-pressed (light) sesame oil has a higher smoke point and can be used for cooking, while toasted cannot."
  },
  {
    slug: "doubanjiang",
    name: "Doubanjiang",
    alternateName: ["Chili Bean Paste", "Toban Djan", "Broad Bean Paste"],
    category: "sauces",
    cuisines: ["chinese"],
    description: "Doubanjiang is the 'soul of Sichuan cuisine'—a fermented paste of chili peppers and broad beans that brings spicy, salty, savory depth. Pixian doubanjiang, aged for years, is considered the finest.",
    flavorProfile: "Spicy, salty, deeply fermented, complex",
    commonUses: ["Mapo tofu", "Twice-cooked pork", "Dan dan noodles", "Stir-fries", "Braises"],
    substitutes: ["Gochujang + miso (different but similar function)", "Sambal + soy sauce"],
    storageInfo: "Refrigerate after opening. Keeps 1+ years. Flavor deepens over time.",
    nutritionHighlights: ["Fermented food benefits", "Contains capsaicin"],
    buyingTips: "Pixian County doubanjiang is the gold standard. Look for aged versions (3+ years) for best depth.",
    funFact: "Premium Pixian doubanjiang is fermented and aged for up to 8 years in earthen crocks."
  },

  // Japanese
  {
    slug: "miso",
    name: "Miso",
    alternateName: ["Miso Paste", "Fermented Soybean Paste"],
    category: "sauces",
    cuisines: ["japanese"],
    description: "Miso is Japan's umami powerhouse—fermented soybean paste that ranges from sweet and mild (white) to rich and robust (red). It's the base of miso soup and adds depth to countless dishes.",
    flavorProfile: "Salty, savory, complex umami, with variations from sweet to earthy",
    commonUses: ["Miso soup", "Marinades", "Glazes", "Salad dressings", "Sauces", "Ramen"],
    substitutes: ["Tahini + soy sauce (texture only)", "Doenjang (Korean, stronger)"],
    storageInfo: "Refrigerate for up to 1 year. It may darken but remains safe.",
    nutritionHighlights: ["Probiotic benefits from fermentation", "Good protein source"],
    buyingTips: "White (shiro) miso is mildest and best for beginners. Red (aka) miso is most versatile.",
    funFact: "Miso fermentation times range from weeks (sweet white miso) to 3 years (hatcho miso)."
  },
  {
    slug: "mirin",
    name: "Mirin",
    alternateName: ["Sweet Rice Wine", "Japanese Sweet Wine"],
    category: "sauces",
    cuisines: ["japanese"],
    description: "Mirin is sweet Japanese rice wine—essential for teriyaki, simmered dishes, and dipping sauces. Real mirin (hon mirin) is alcoholic and complex; imitations are syrupy and one-dimensional.",
    flavorProfile: "Sweet, slightly tangy, with subtle alcohol warmth",
    commonUses: ["Teriyaki sauce", "Simmered dishes", "Tempura dipping sauce", "Glazes", "Marinades"],
    substitutes: ["Sake + sugar (3:1 ratio)", "Sweet sherry", "Rice wine vinegar + sugar"],
    storageInfo: "Hon mirin keeps indefinitely at room temperature. Mirin-style condiments should be refrigerated.",
    nutritionHighlights: ["Contains natural sugars from rice"],
    buyingTips: "Look for 'hon mirin' with 14% alcohol. Avoid 'aji-mirin' or 'mirin-style' which are inferior.",
    funFact: "In Edo-period Japan, mirin was drunk as a sweet sake before becoming a cooking ingredient."
  },
  {
    slug: "nori",
    name: "Nori",
    alternateName: ["Dried Seaweed", "Seaweed Sheets", "Sushi Nori"],
    category: "dried",
    cuisines: ["japanese", "korean"],
    description: "Nori is dried edible seaweed—the dark green wrapper of sushi rolls and onigiri. High-quality nori is crisp, fragrant, and melts on the tongue with deep ocean flavor.",
    flavorProfile: "Ocean-like, slightly sweet, toasted, umami-rich",
    commonUses: ["Sushi rolls", "Onigiri", "Ramen topping", "Rice seasoning", "Snacking"],
    substitutes: ["Roasted kim (Korean, usually seasoned)", "Rice paper (for wrapping only)"],
    storageInfo: "Keep sealed with desiccant packet. Once opened, humidity makes it chewy—use quickly or toast.",
    nutritionHighlights: ["Extremely high in iodine", "Good source of B12 for plant-based diets", "Rich in minerals"],
    buyingTips: "High-quality nori is dark, almost black-green. Cheaper versions are brownish and more fishy.",
    funFact: "Japan has over 600 nori processing facilities, and nori farming is a $2 billion industry."
  },
  {
    slug: "dashi",
    name: "Dashi",
    alternateName: ["Japanese Soup Stock", "Dashi Stock"],
    category: "dried",
    cuisines: ["japanese"],
    description: "Dashi is Japan's foundational stock—the backbone of Japanese cuisine. Made from kombu (kelp) and katsuobushi (bonito flakes), it exemplifies the fifth taste: umami.",
    flavorProfile: "Clean, subtly oceanic, deeply savory, light",
    commonUses: ["Miso soup", "Ramen broth", "Simmered dishes", "Rice seasoning", "Tamagoyaki"],
    substitutes: ["Vegetable stock + splash of soy sauce", "Kombu dashi (vegetarian)"],
    storageInfo: "Fresh dashi keeps 3-4 days refrigerated. Freeze in ice cube trays for convenience.",
    nutritionHighlights: ["Rich in natural glutamates", "Low calorie", "Contains minerals from kelp"],
    buyingTips: "Instant dashi (hondashi) is convenient. For best results, make fresh from kombu and bonito.",
    funFact: "The discovery of glutamate in kombu dashi in 1908 led to the identification of umami as the fifth taste."
  },
  {
    slug: "katsuobushi",
    name: "Katsuobushi",
    alternateName: ["Bonito Flakes", "Dried Bonito"],
    category: "dried",
    cuisines: ["japanese"],
    description: "Katsuobushi is skipjack tuna that's been smoked, fermented, dried, and shaved into feathery flakes. It's one of the world's hardest foods and the soul of dashi.",
    flavorProfile: "Smoky, oceanic, intensely savory, slightly fishy",
    commonUses: ["Dashi stock", "Okonomiyaki topping", "Takoyaki garnish", "Rice topping", "Onigiri filling"],
    substitutes: ["No true substitute—anchovy can approximate in dashi"],
    storageInfo: "Sealed flakes keep 6+ months. Once opened, use quickly or refrigerate.",
    nutritionHighlights: ["Extremely high in protein", "Rich in B vitamins"],
    buyingTips: "Freshly shaved from a block is best. Pre-shaved bags are convenient and still excellent.",
    funFact: "Making traditional katsuobushi takes 6 months. The finished product is so hard it must be shaved with a special plane."
  },
  {
    slug: "wakame",
    name: "Wakame",
    alternateName: ["Seaweed Salad Seaweed", "Miyeok"],
    category: "dried",
    cuisines: ["japanese", "korean"],
    description: "Wakame is the silky, tender seaweed found in miso soup and seaweed salad. It rehydrates in minutes and adds gentle ocean flavor and satisfying texture.",
    flavorProfile: "Mild ocean flavor, slightly sweet, silky texture",
    commonUses: ["Miso soup", "Seaweed salad", "Sunomono", "Korean miyeokguk", "Ramen topping"],
    substitutes: ["Kombu (tougher, stronger)", "Dulse (different flavor)"],
    storageInfo: "Dried wakame keeps 1 year in cool, dark place. Rehydrated keeps 3-4 days refrigerated.",
    nutritionHighlights: ["High in iodine", "Good source of magnesium", "Contains fucoxanthin"],
    buyingTips: "A little goes a long way—it expands 10x when rehydrated.",
    funFact: "In Korea, miyeokguk (wakame soup) is traditionally eaten on birthdays and by new mothers."
  },

  // Korean
  {
    slug: "gochugaru",
    name: "Gochugaru",
    alternateName: ["Korean Chili Flakes", "Korean Red Pepper Flakes"],
    category: "spices",
    cuisines: ["korean"],
    description: "Gochugaru is the vibrant red chili that makes Korean food distinctive—sun-dried Korean peppers with a perfect balance of heat, sweetness, and fruity depth. Essential for kimchi.",
    flavorProfile: "Moderately spicy, sweet, fruity, slightly smoky",
    commonUses: ["Kimchi", "Tteokbokki", "Gochujang", "Stews", "Marinades", "Bibimbap"],
    substitutes: ["Aleppo pepper (similar heat/sweetness)", "Crushed red pepper + paprika (inferior)"],
    storageInfo: "Refrigerate or freeze for best color and flavor. Keeps 6 months refrigerated, 1 year frozen.",
    nutritionHighlights: ["High in vitamin C and A", "Contains capsaicin"],
    buyingTips: "Buy coarse for kimchi, fine for sauces. Look for vibrant red color—dull means old.",
    funFact: "Gochugaru wasn't introduced to Korea until the 16th or 17th century, making kimchi as we know it relatively modern."
  },
  {
    slug: "gochujang",
    name: "Gochujang",
    alternateName: ["Korean Chili Paste", "Red Pepper Paste"],
    category: "sauces",
    cuisines: ["korean"],
    description: "Gochujang is Korea's signature fermented chili paste—a unique combination of spicy, sweet, and funky that has no equivalent in other cuisines. It takes months to ferment properly.",
    flavorProfile: "Spicy, sweet, fermented, complex, slightly smoky",
    commonUses: ["Bibimbap", "Tteokbokki", "Marinades", "Fried chicken", "Dipping sauces", "Stews"],
    substitutes: ["Sriracha + miso + honey (rough approximation)"],
    storageInfo: "Refrigerate after opening. Keeps 1+ years due to fermentation.",
    nutritionHighlights: ["Probiotic benefits from fermentation", "Contains capsaicin"],
    buyingTips: "Traditionally made gochujang lists rice as main ingredient. Mass-produced versions use more corn syrup.",
    funFact: "Traditional gochujang is fermented in onggi (earthenware pots) outdoors for up to a year."
  },
  {
    slug: "doenjang",
    name: "Doenjang",
    alternateName: ["Korean Soybean Paste", "Korean Miso"],
    category: "sauces",
    cuisines: ["korean"],
    description: "Doenjang is Korea's fermented soybean paste—bolder and funkier than Japanese miso. It's the foundation of doenjang jjigae (stew) and adds powerful umami to Korean cooking.",
    flavorProfile: "Intensely savory, funky, earthy, bold",
    commonUses: ["Doenjang jjigae", "Ssamjang", "Marinades", "Stews", "Vegetable dips"],
    substitutes: ["Red miso (milder)", "Miso + splash of soy sauce"],
    storageInfo: "Refrigerate after opening. Keeps 1+ years.",
    nutritionHighlights: ["High in protein", "Probiotic benefits", "Contains beneficial isoflavones"],
    buyingTips: "Traditional doenjang is chunkier with visible soybean pieces. Commercial versions are smoother.",
    funFact: "Doenjang and gochujang are traditionally made together—the liquid from meju blocks becomes soy sauce."
  },
  {
    slug: "kimchi",
    name: "Kimchi",
    alternateName: ["Korean Fermented Vegetables", "Baechu Kimchi"],
    category: "pickled",
    cuisines: ["korean"],
    description: "Kimchi is Korea's national dish—fermented napa cabbage with a complex blend of chili, garlic, ginger, and fish sauce. Each family has their own recipe passed down for generations.",
    flavorProfile: "Spicy, sour, garlicky, funky, umami-rich",
    commonUses: ["Side dish (banchan)", "Kimchi jjigae", "Kimchi fried rice", "Kimchi pancakes", "Ramen topping"],
    substitutes: ["Sauerkraut + gochugaru + garlic (different but similar function)"],
    storageInfo: "Refrigerate to slow fermentation. Becomes more sour over time—use older kimchi for cooking.",
    nutritionHighlights: ["Probiotic powerhouse", "High in vitamins A and C", "Contains beneficial bacteria"],
    buyingTips: "Check for bubbles—active fermentation means it's alive. Fresher kimchi is crunchier, older is tangier.",
    funFact: "UNESCO recognized kimjang (the tradition of making kimchi) as an Intangible Cultural Heritage of Humanity."
  },

  // Vietnamese
  {
    slug: "fish-sauce",
    name: "Fish Sauce",
    alternateName: ["Nuoc Mam", "Nam Pla", "Patis"],
    category: "sauces",
    cuisines: ["vietnamese", "thai", "filipino"],
    description: "Fish sauce is the liquid gold of Southeast Asian cooking—fermented anchovies and salt transformed into pure savory essence. It's funky, salty, and absolutely essential.",
    flavorProfile: "Intensely salty, funky, savory, umami",
    commonUses: ["Nuoc cham dipping sauce", "Pad Thai", "Pho", "Marinades", "Stir-fries", "Green papaya salad"],
    substitutes: ["Soy sauce + splash of Worcestershire", "Coconut aminos (much milder)"],
    storageInfo: "Keeps indefinitely at room temperature. May crystallize—that's normal and not harmful.",
    nutritionHighlights: ["Very high in sodium", "Contains protein from fermented fish"],
    buyingTips: "First press (nhi or nuoc mam nhi) is highest quality. Red Boat is excellent. Avoid those with sugar or MSG.",
    funFact: "The Romans had their own fish sauce called garum, which was equally beloved and expensive."
  },
  {
    slug: "rice-paper",
    name: "Rice Paper",
    alternateName: ["Banh Trang", "Spring Roll Wrappers", "Rice Paper Wrappers"],
    category: "noodles",
    cuisines: ["vietnamese"],
    description: "Rice paper is the translucent wrapper that makes Vietnamese fresh spring rolls so beautiful and light. Made from rice flour and water, it becomes pliable when briefly wetted.",
    flavorProfile: "Neutral, very slightly sweet, chewy when hydrated",
    commonUses: ["Fresh spring rolls (goi cuon)", "Fried spring rolls (cha gio)", "Rice paper pizzas", "Salad wraps"],
    substitutes: ["Lettuce leaves (for wrapping only)", "Wheat spring roll wrappers (for frying)"],
    storageInfo: "Keeps 2 years in cool, dry place. Moisture ruins them.",
    nutritionHighlights: ["Gluten-free", "Low calorie", "Fat-free"],
    buyingTips: "Thicker wrappers are easier for beginners. Very thin ones are traditional but tear easily.",
    funFact: "Rice paper was traditionally sun-dried on bamboo mats, which is why some varieties have a crosshatch pattern."
  },
  {
    slug: "pho-spices",
    name: "Pho Spice Blend",
    alternateName: ["Pho Spices", "Vietnamese Soup Spices"],
    category: "spices",
    cuisines: ["vietnamese"],
    description: "The aromatic spice blend that makes pho magical—star anise, cinnamon, cloves, coriander, and fennel. These whole spices are toasted and simmered to create pho's signature fragrant broth.",
    flavorProfile: "Warm, aromatic, licorice notes, sweet spice",
    commonUses: ["Pho broth", "Bo kho (beef stew)", "Marinades", "Mulled drinks"],
    substitutes: ["Individual spices: star anise, cinnamon, cloves, coriander, fennel, cardamom"],
    storageInfo: "Whole spices keep 2-3 years. Store in airtight container away from light.",
    nutritionHighlights: ["Contains beneficial compounds from spices"],
    buyingTips: "Buy whole spices and toast fresh for best flavor. Pre-ground blends lose aroma quickly.",
    funFact: "The exact pho spice blend varies by region—northern pho is more subtle, southern pho is sweeter and spicier."
  },
  {
    slug: "lemongrass",
    name: "Lemongrass",
    alternateName: ["Citronella", "Xa"],
    category: "produce",
    cuisines: ["vietnamese", "thai", "indonesian"],
    description: "Lemongrass is Southeast Asia's citrus grass—long, fibrous stalks with intense lemon-floral aroma. It adds irreplaceable freshness to soups, curries, and marinades.",
    flavorProfile: "Lemony, floral, slightly ginger-like, aromatic",
    commonUses: ["Tom yum soup", "Vietnamese lemongrass chicken", "Curries", "Marinades", "Teas"],
    substitutes: ["Lemon zest + ginger (distant approximation)", "Lemongrass paste"],
    storageInfo: "Refrigerate 2-3 weeks. Freezes perfectly for 6 months. Can also be dried.",
    nutritionHighlights: ["Contains citral with antimicrobial properties", "Traditional digestive aid"],
    buyingTips: "Choose firm, pale green stalks. Avoid dry or brown specimens. Use only the bottom 4-6 inches.",
    funFact: "Lemongrass contains citronella oil, the same compound used in insect repellents."
  },

  // Thai
  {
    slug: "thai-basil",
    name: "Thai Basil",
    alternateName: ["Horapa", "Asian Basil"],
    category: "produce",
    cuisines: ["thai", "vietnamese"],
    description: "Thai basil is the anise-scented herb essential to Thai cooking—sturdier than Italian basil with a distinctive licorice flavor that doesn't wilt at high heat.",
    flavorProfile: "Anise-like, slightly spicy, sturdy, aromatic",
    commonUses: ["Pad krapao", "Curries", "Pho garnish", "Stir-fries", "Fresh spring rolls"],
    substitutes: ["Italian basil + mint (approximation)", "Holy basil (different but authentic for Thai)"],
    storageInfo: "Store stems in water like flowers, loosely covered. Keeps 5-7 days. Doesn't dry well.",
    nutritionHighlights: ["Rich in vitamins K and A", "Contains antioxidants"],
    buyingTips: "Look for purple stems and small leaves. Avoid wilted or blackened leaves.",
    funFact: "There are three main types of basil used in Thai cooking: Thai, holy, and lemon basil—each with distinct uses."
  },
  {
    slug: "galangal",
    name: "Galangal",
    alternateName: ["Thai Ginger", "Kha", "Blue Ginger"],
    category: "produce",
    cuisines: ["thai", "indonesian", "vietnamese"],
    description: "Galangal is ginger's more sophisticated cousin—a rhizome with sharp, piney, almost mentholated flavor. It's essential for tom kha gai and Thai curry pastes.",
    flavorProfile: "Sharp, piney, citrusy, more peppery than ginger",
    commonUses: ["Tom kha gai", "Curry pastes", "Tom yum", "Rendang", "Indonesian soups"],
    substitutes: ["Ginger (distant substitute)", "Galangal powder (1 tsp = 1 inch fresh)"],
    storageInfo: "Refrigerate uncut for 3 weeks. Freeze whole for 3 months. Slice before completely frozen.",
    nutritionHighlights: ["Contains anti-inflammatory compounds", "Traditional medicine uses"],
    buyingTips: "Choose firm, heavy pieces. Young galangal has thinner skin and is easier to slice.",
    funFact: "Galangal was popular in medieval European cooking but fell out of use—it's making a modern comeback."
  },
  {
    slug: "coconut-milk",
    name: "Coconut Milk",
    alternateName: ["Coconut Cream", "Kati"],
    category: "canned",
    cuisines: ["thai", "indian", "caribbean", "filipino"],
    description: "Coconut milk is the rich, creamy liquid extracted from coconut meat—the foundation of countless curries, desserts, and beverages across tropical cuisines.",
    flavorProfile: "Rich, creamy, slightly sweet, coconut-forward",
    commonUses: ["Thai curries", "Pina coladas", "Rice dishes", "Desserts", "Smoothies", "Vegan cream substitute"],
    substitutes: ["Heavy cream + coconut extract", "Full-fat Greek yogurt (for texture)"],
    storageInfo: "Canned keeps 2-3 years. Once opened, refrigerate and use within 5-7 days. Freezes well.",
    nutritionHighlights: ["High in healthy MCT fats", "Contains lauric acid", "Good source of manganese"],
    buyingTips: "Full-fat has more cream. Shake before opening for consistency, or don't shake to harvest the cream on top.",
    funFact: "Coconut 'milk' and 'cream' are from the same process—cream is the first press, milk is the second."
  },

  // Indian
  {
    slug: "garam-masala",
    name: "Garam Masala",
    alternateName: ["Hot Spice Mix", "Indian Spice Blend"],
    category: "spices",
    cuisines: ["indian"],
    description: "Garam masala means 'warming spices'—India's most important spice blend. Each region and family has their own recipe, but all share the goal of warming the body and soul.",
    flavorProfile: "Warm, aromatic, complex, slightly sweet",
    commonUses: ["Curries", "Biryanis", "Tandoori", "Dals", "Finishing spice", "Chai"],
    substitutes: ["Blend of cumin, coriander, cardamom, cinnamon, cloves, pepper"],
    storageInfo: "Keep in airtight container for 6 months. Toast whole spices fresh for best flavor.",
    nutritionHighlights: ["Anti-inflammatory properties from spices", "Aids digestion"],
    buyingTips: "Quality varies enormously. Buy from Indian grocery stores or make your own. Avoid dust-like powders.",
    funFact: "Garam masala is traditionally added at the end of cooking, not the beginning, to preserve its aromatics."
  },
  {
    slug: "ghee",
    name: "Ghee",
    alternateName: ["Clarified Butter", "Desi Ghee"],
    category: "oils",
    cuisines: ["indian"],
    description: "Ghee is clarified butter taken further—cooked until milk solids brown and water evaporates. The result is pure butterfat with a nutty flavor and very high smoke point.",
    flavorProfile: "Rich, nutty, caramelized, buttery",
    commonUses: ["Sautéing and frying", "Rice dishes", "Roti and naan", "Dals", "Sweets", "Coffee"],
    substitutes: ["Clarified butter (lighter flavor)", "Butter (lower smoke point)"],
    storageInfo: "Keeps 3 months at room temperature, 1 year refrigerated. No refrigeration needed if kept clean.",
    nutritionHighlights: ["High smoke point (485°F)", "Contains fat-soluble vitamins", "Lactose-free"],
    buyingTips: "Look for 'pure' or 'desi' ghee. Color should be golden, not pale. Granular texture is ideal.",
    funFact: "In Ayurveda, ghee is considered sacred and believed to nourish ojas (vital energy)."
  },
  {
    slug: "tamarind",
    name: "Tamarind",
    alternateName: ["Imli", "Tamarind Paste", "Tamarind Concentrate"],
    category: "sauces",
    cuisines: ["indian", "thai", "mexican"],
    description: "Tamarind is the sour pod fruit that gives its tang to dishes across multiple continents. Its unique sweet-sour flavor is essential for pad Thai, sambar, and agua fresca.",
    flavorProfile: "Sour, slightly sweet, fruity, complex acidity",
    commonUses: ["Pad Thai", "Sambar", "Chutneys", "Rasam", "Agua de tamarindo", "Worcestershire sauce"],
    substitutes: ["Lime juice + molasses", "Pomegranate molasses + lemon"],
    storageInfo: "Paste keeps indefinitely. Concentrate keeps 2 years. Whole pods keep 6 months.",
    nutritionHighlights: ["High in B vitamins", "Contains iron and magnesium", "Traditional digestive aid"],
    buyingTips: "Concentrate is most convenient. Paste from whole pods has best flavor. Avoid those with added sugar.",
    funFact: "The name 'tamarind' comes from Arabic 'tamr hindi' meaning 'Indian date.'"
  },
  {
    slug: "curry-leaves",
    name: "Curry Leaves",
    alternateName: ["Kari Patta", "Karivepaku", "Sweet Neem"],
    category: "produce",
    cuisines: ["indian"],
    description: "Curry leaves are the aromatic leaves of the curry tree—essential for South Indian cooking with a flavor that's impossible to replicate. They have nothing to do with curry powder.",
    flavorProfile: "Citrusy, nutty, herbal, slightly smoky when fried",
    commonUses: ["Tempering (tadka)", "Sambar and rasam", "Curries", "Chutneys", "Upma"],
    substitutes: ["None adequate—omit rather than substitute", "Bay leaves (very different but similar technique)"],
    storageInfo: "Refrigerate in paper towel for 2 weeks. Freeze for 3 months. Dried loses much flavor.",
    nutritionHighlights: ["Rich in antioxidants", "Traditional medicine for digestion"],
    buyingTips: "Buy branches from Indian stores. Fresh should be dark green and aromatic when crushed.",
    funFact: "In South India, houses traditionally have curry leaf trees in their gardens for daily use."
  },
  {
    slug: "asafoetida",
    name: "Asafoetida",
    alternateName: ["Hing", "Devil's Dung"],
    category: "spices",
    cuisines: ["indian"],
    description: "Asafoetida is the strong-smelling resin used in Indian cooking—its sulfurous smell transforms into a savory, onion-garlic flavor when cooked. Essential for many vegetarian dishes.",
    flavorProfile: "Pungent raw, onion-garlic flavor when cooked",
    commonUses: ["Dals and beans", "Sambar", "Vegetable dishes", "Pickles", "Tempering"],
    substitutes: ["Garlic + onion powder (approximation)", "Omit if unavailable"],
    storageInfo: "Store in very airtight container—it will flavor everything nearby. Keeps 2+ years.",
    nutritionHighlights: ["Traditional digestive aid", "Anti-flatulent properties"],
    buyingTips: "Buy 'compounded' asafoetida (mixed with flour) for cooking. Pure resin is very strong.",
    funFact: "Jain and strict Brahmin cooking uses asafoetida as an onion-garlic substitute, as they don't eat those."
  },

  // Filipino
  {
    slug: "calamansi",
    name: "Calamansi",
    alternateName: ["Calamondin", "Philippine Lime", "Kalamansi"],
    category: "produce",
    cuisines: ["filipino"],
    description: "Calamansi is the Filipino citrus—tiny, sour, and essential. Its unique flavor is between lime and tangerine, adding brightness to pancit, sawsawan dips, and refreshing drinks.",
    flavorProfile: "Sour, fragrant, more complex than lime, slightly sweet",
    commonUses: ["Sawsawan dipping sauce", "Pancit", "Sinigang", "Juices and cocktails", "Marinades"],
    substitutes: ["Equal parts lime and orange juice", "Meyer lemon"],
    storageInfo: "Room temperature 1 week, refrigerated 2-3 weeks. Juice freezes perfectly.",
    nutritionHighlights: ["Extremely high in vitamin C", "Contains antioxidants"],
    buyingTips: "Available fresh at Asian markets or as frozen juice. Frozen works great for cooking.",
    funFact: "Filipinos squeeze calamansi on almost everything, including fast food, the way Americans use ketchup."
  },
  {
    slug: "banana-ketchup",
    name: "Banana Ketchup",
    alternateName: ["Filipino Ketchup", "Banana Sauce"],
    category: "sauces",
    cuisines: ["filipino"],
    description: "Banana ketchup is the Philippines' tomato ketchup alternative—invented during WWII when tomatoes were scarce. It's made from mashed bananas, sugar, and spices, dyed red.",
    flavorProfile: "Sweet, tangy, mild banana flavor, similar to ketchup but fruitier",
    commonUses: ["Filipino spaghetti", "Dipping sauce for fried foods", "Marinades", "Cooking sauce"],
    substitutes: ["Tomato ketchup + pinch of sugar", "No true substitute for the banana flavor"],
    storageInfo: "Refrigerate after opening for 6 months.",
    nutritionHighlights: ["Lower in sodium than tomato ketchup", "Contains potassium from bananas"],
    buyingTips: "Jufran and UFC are popular brands. Comes in regular and spicy versions.",
    funFact: "Maria Orosa, a Filipino food scientist, invented banana ketchup to provide cheap nutrition during WWII."
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // AFRICAN INGREDIENTS
  // ═══════════════════════════════════════════════════════════════════════════

  // Nigerian
  {
    slug: "egusi",
    name: "Egusi",
    alternateName: ["Melon Seeds", "Agushi"],
    category: "dried",
    cuisines: ["nigerian", "ghanaian"],
    description: "Egusi are dried melon seeds—the thickener and protein source that gives egusi soup its characteristic richness. When ground and cooked, they create a hearty, nutty base.",
    flavorProfile: "Nutty, earthy, slightly bitter, rich",
    commonUses: ["Egusi soup", "Stews", "Ground as thickener"],
    substitutes: ["Pumpkin seeds (different but similar function)", "Sunflower seeds"],
    storageInfo: "Whole seeds keep 1 year. Ground should be used within 3 months for best flavor.",
    nutritionHighlights: ["Very high in protein", "Rich in healthy fats", "Good source of zinc"],
    buyingTips: "Buy whole seeds and grind fresh for best flavor. Pre-ground is convenient but less flavorful.",
    funFact: "Egusi seeds come from a specific type of melon grown primarily for its seeds, not its flesh."
  },
  {
    slug: "palm-oil",
    name: "Palm Oil",
    alternateName: ["Red Palm Oil", "Dende Oil", "Zomi"],
    category: "oils",
    cuisines: ["nigerian", "ghanaian", "brazilian"],
    description: "Red palm oil is West Africa's signature cooking fat—unrefined and bright orange-red from carotenoids. Its distinctive flavor and color are essential for authentic West African and Bahian cooking.",
    flavorProfile: "Earthy, slightly sweet, rich, distinctive",
    commonUses: ["Jollof rice", "Egusi soup", "Moqueca", "Caruru", "West African stews"],
    substitutes: ["No true substitute—butter + paprika for color only"],
    storageInfo: "Keeps 6-12 months at room temperature. Solidifies when cold—that's normal.",
    nutritionHighlights: ["Extremely high in vitamin A (beta-carotene)", "Contains vitamin E", "No trans fats"],
    buyingTips: "Look for 'unrefined' or 'virgin' red palm oil. Refined palm oil is different and unsuitable.",
    funFact: "Palm oil was brought to Brazil via the slave trade and became essential to Bahian cuisine."
  },
  {
    slug: "ogiri",
    name: "Ogiri",
    alternateName: ["Dawadawa", "Iru", "Fermented Locust Beans"],
    category: "sauces",
    cuisines: ["nigerian", "ghanaian"],
    description: "Ogiri is West Africa's fermented seasoning—made from locust beans, sesame, or melon seeds. Its powerful, funky aroma becomes deeply savory umami when cooked.",
    flavorProfile: "Pungent, fermented, deeply savory, funky",
    commonUses: ["Egusi soup", "Ogbono soup", "Stews", "Vegetable soups"],
    substitutes: ["Fermented shrimp paste", "Miso (different but similar function)"],
    storageInfo: "Refrigerate for 3 months or freeze indefinitely.",
    nutritionHighlights: ["High in protein", "Contains beneficial probiotics"],
    buyingTips: "Strong smell is normal—it should smell fermented but not rotten. African markets are best source.",
    funFact: "Like many fermented foods, ogiri was developed as a preservation method before refrigeration."
  },
  {
    slug: "crayfish-ground",
    name: "Ground Crayfish",
    alternateName: ["Dried Crayfish", "Crayfish Powder"],
    category: "dried",
    cuisines: ["nigerian"],
    description: "Ground crayfish is Nigeria's umami bomb—dried freshwater crayfish ground into powder. It adds intense seafood depth to soups and stews.",
    flavorProfile: "Intensely seafood-forward, salty, umami-rich",
    commonUses: ["Egusi soup", "Okra soup", "Jollof rice", "Stews", "Pepper soup"],
    substitutes: ["Dried shrimp, ground", "Shrimp powder + fish sauce"],
    storageInfo: "Keep in airtight container for 6 months. Refrigerate for longer storage.",
    nutritionHighlights: ["Very high in protein", "Rich in minerals"],
    buyingTips: "Buy whole and grind fresh for best flavor, or buy pre-ground from African stores.",
    funFact: "Nigerian ground crayfish is different from Louisiana crawfish—these are smaller freshwater crustaceans."
  },

  // Ethiopian
  {
    slug: "berbere",
    name: "Berbere",
    alternateName: ["Ethiopian Spice Blend", "Berbere Spice"],
    category: "spices",
    cuisines: ["ethiopian"],
    description: "Berbere is Ethiopia's essential spice blend—a complex, fiery mixture of chili peppers, fenugreek, and warm spices. It's the soul of doro wat and the flavor of Ethiopia.",
    flavorProfile: "Complex, spicy, warm, with fenugreek and cardamom notes",
    commonUses: ["Doro wat", "Tibs", "Vegetable stews", "Lentil dishes", "Marinades"],
    substitutes: ["Ras el hanout + cayenne (approximation)", "Homemade blend"],
    storageInfo: "Keeps 6 months in airtight container. Flavor diminishes over time.",
    nutritionHighlights: ["Contains beneficial spice compounds", "Anti-inflammatory properties"],
    buyingTips: "Quality varies widely. Ethiopian stores have best versions. Should be fragrant, not dusty.",
    funFact: "Ethiopian families traditionally make berbere together, with recipes passed down through generations."
  },
  {
    slug: "injera",
    name: "Injera",
    alternateName: ["Ethiopian Flatbread", "Teff Bread"],
    category: "grains",
    cuisines: ["ethiopian"],
    description: "Injera is Ethiopia's spongy, sourdough flatbread—made from teff flour and fermented for days. It serves as both plate and utensil, torn and used to scoop up stews.",
    flavorProfile: "Sour, tangy, slightly earthy, spongy texture",
    commonUses: ["Base for Ethiopian meals", "Edible plate", "Utensil for scooping", "Rolls for dipping"],
    substitutes: ["Teff flour crepes (quick approximation)", "Buckwheat crepes (texture only)"],
    storageInfo: "Best fresh. Refrigerate 3-5 days. Can be frozen for 1 month.",
    nutritionHighlights: ["Gluten-free", "High in fiber", "Complete protein from fermentation"],
    buyingTips: "Look for authentic injera made with 100% teff at Ethiopian restaurants or groceries.",
    funFact: "Teff grains are tiny—it takes about 150 grains to equal one grain of wheat."
  },
  {
    slug: "niter-kibbeh",
    name: "Niter Kibbeh",
    alternateName: ["Ethiopian Spiced Butter", "Ethiopian Ghee"],
    category: "oils",
    cuisines: ["ethiopian"],
    description: "Niter kibbeh is Ethiopian spiced clarified butter—infused with fenugreek, cardamom, and other warm spices. It's the aromatic foundation of Ethiopian cooking.",
    flavorProfile: "Nutty, warmly spiced, aromatic, rich",
    commonUses: ["Base for wats (stews)", "Finishing butter", "Cooking fat", "Rice dishes"],
    substitutes: ["Ghee + garam masala (approximation)", "Butter + Ethiopian spices"],
    storageInfo: "Refrigerate for 3 months or freeze for 1 year.",
    nutritionHighlights: ["Contains beneficial compounds from spices", "High smoke point"],
    buyingTips: "Make your own for best results. Commercial versions vary in spice quality.",
    funFact: "Making niter kibbeh is an art—each family has their own blend of spices, kept secret for generations."
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MIDDLE EASTERN INGREDIENTS
  // ═══════════════════════════════════════════════════════════════════════════

  {
    slug: "tahini",
    name: "Tahini",
    alternateName: ["Sesame Paste", "Sesame Butter"],
    category: "sauces",
    cuisines: ["lebanese", "persian", "middle-eastern"],
    description: "Tahini is ground sesame paste—the creamy, nutty base of hummus and halva. Quality tahini should be pourable and silky, not thick and bitter.",
    flavorProfile: "Nutty, slightly bitter, creamy, rich",
    commonUses: ["Hummus", "Baba ganoush", "Salad dressings", "Halva", "Falafel sauce"],
    substitutes: ["Sunflower seed butter", "Cashew butter (milder)"],
    storageInfo: "Store at room temperature—stir before using. Keeps 1 year. Refrigeration makes it too thick.",
    nutritionHighlights: ["High in healthy fats", "Rich in calcium", "Good protein source"],
    buyingTips: "Should be pourable, not thick. Light-colored tahini is milder. Best brands: Soom, Al Arz, Har Bracha.",
    funFact: "Ancient Egyptians made tahini over 4,000 years ago, making it one of humanity's oldest condiments."
  },
  {
    slug: "za-atar",
    name: "Za'atar",
    alternateName: ["Zaatar", "Middle Eastern Spice Blend"],
    category: "spices",
    cuisines: ["lebanese", "middle-eastern"],
    description: "Za'atar is the Levantine spice blend of wild thyme, sumac, sesame seeds, and salt. It's drizzled with olive oil on flatbread, sprinkled on labneh, and used on everything.",
    flavorProfile: "Herbal, tangy, nutty, earthy",
    commonUses: ["Manakish (flatbread)", "Labneh topping", "Salads", "Roasted vegetables", "Eggs"],
    substitutes: ["Dried thyme + lemon zest + sesame seeds"],
    storageInfo: "Keeps 6 months in airtight container. Flavor is best when fresh.",
    nutritionHighlights: ["Rich in antioxidants from thyme", "Contains sumac's vitamin C"],
    buyingTips: "Quality varies enormously. Za'atar from Middle Eastern stores is usually best. Should be fragrant.",
    funFact: "In the Middle East, children eat za'atar before school, believing it makes the mind alert and the body strong."
  },
  {
    slug: "sumac",
    name: "Sumac",
    alternateName: ["Rhus", "Sicilian Sumac"],
    category: "spices",
    cuisines: ["lebanese", "persian", "middle-eastern"],
    description: "Sumac is the tangy, fruity ground spice from sumac berries. Before lemons reached the Middle East, sumac provided acidity. Its unique tartness is irreplaceable.",
    flavorProfile: "Tart, fruity, slightly salty, with notes of lemon",
    commonUses: ["Fattoush salad", "Grilled meats", "Muhammara", "Rice dishes", "Finishing spice"],
    substitutes: ["Lemon zest (for tartness only)", "No true substitute for the flavor"],
    storageInfo: "Keeps 2 years in cool, dark place. Flavor is best within 1 year.",
    nutritionHighlights: ["Very high in antioxidants", "Contains vitamin C"],
    buyingTips: "Should be deep burgundy red. Brown or dull color indicates old, flavorless sumac.",
    funFact: "Native Americans used North American sumac to make 'sumac-ade,' a lemonade-like beverage."
  },
  {
    slug: "pomegranate-molasses",
    name: "Pomegranate Molasses",
    alternateName: ["Pomegranate Syrup", "Dibs Rumman"],
    category: "sauces",
    cuisines: ["lebanese", "persian", "middle-eastern"],
    description: "Pomegranate molasses is reduced pomegranate juice—thick, tangy, and fruity. It adds complex sweet-sour depth to savory and sweet dishes alike.",
    flavorProfile: "Tangy, fruity, sweet-sour, complex",
    commonUses: ["Muhammara", "Salad dressings", "Glazes", "Marinades", "Fesenjan"],
    substitutes: ["Balsamic reduction + lemon", "Cranberry juice reduction"],
    storageInfo: "Keeps 2 years in pantry. Refrigerate after opening for longest life.",
    nutritionHighlights: ["High in antioxidants", "Contains potassium"],
    buyingTips: "Check ingredients—best versions contain only pomegranate juice (and maybe sugar). Avoid corn syrup.",
    funFact: "Ancient Persians used pomegranate molasses as both medicine and a symbol of fertility."
  },
  {
    slug: "rose-water",
    name: "Rose Water",
    alternateName: ["Gulab", "Rosewater", "Ma Wared"],
    category: "beverages",
    cuisines: ["persian", "lebanese", "indian"],
    description: "Rose water is distilled rose petals—the fragrant essence that perfumes desserts, drinks, and savory dishes across the Middle East and South Asia.",
    flavorProfile: "Intensely floral, perfumed, delicate, aromatic",
    commonUses: ["Baklava", "Turkish delight", "Rice pudding", "Lassi", "Biryani"],
    substitutes: ["Rose extract (use 1/4 amount)", "Vanilla extract (different but aromatic)"],
    storageInfo: "Keeps indefinitely in cool, dark place. Quality diminishes after 1 year.",
    nutritionHighlights: ["Traditional calming properties", "Used in aromatherapy"],
    buyingTips: "Look for 'distilled' rose water. Avoid versions with artificial flavor. Should smell like fresh roses.",
    funFact: "Cleopatra allegedly filled her palace fountains with rose water and scattered rose petals on floors."
  },
  {
    slug: "saffron",
    name: "Saffron",
    alternateName: ["Kesar", "Azafran", "Za'faran"],
    category: "spices",
    cuisines: ["persian", "indian", "spanish"],
    description: "Saffron is the world's most precious spice—hand-harvested stigmas of crocus flowers. Its unique honey-hay flavor and brilliant color have been prized for millennia.",
    flavorProfile: "Honey-like, hay-like, slightly metallic, complex",
    commonUses: ["Paella", "Risotto Milanese", "Biryani", "Persian rice", "Desserts", "Bouillabaisse"],
    substitutes: ["Turmeric (color only)", "Safflower (color only)—no true flavor substitute"],
    storageInfo: "Keeps 2-3 years in airtight container away from light. Don't refrigerate.",
    nutritionHighlights: ["Contains mood-enhancing compounds", "Traditional medicine for many ailments"],
    buyingTips: "Buy threads, not powder. Real saffron is expensive—if it's cheap, it's fake. Should smell like honey and hay.",
    funFact: "It takes 75,000 crocus flowers to make one pound of saffron, which is why it costs $5,000+ per pound."
  },

];

// ─────────────────────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

export function getIngredientBySlug(slug: string): Ingredient | undefined {
  return ingredients.find(i => i.slug === slug);
}

export function getIngredientsByCategory(category: string): Ingredient[] {
  return ingredients.filter(i => i.category === category);
}

export function getIngredientsByCuisine(cuisine: string): Ingredient[] {
  return ingredients.filter(i => i.cuisines.includes(cuisine));
}

export function getCuisineBySlug(slug: string): Cuisine | undefined {
  return cuisines.find(c => c.slug === slug);
}

export function getCategoryBySlug(slug: string): IngredientCategory | undefined {
  return ingredientCategories.find(c => c.slug === slug);
}

export function searchIngredients(query: string): Ingredient[] {
  const q = query.toLowerCase();
  return ingredients.filter(i => 
    i.name.toLowerCase().includes(q) ||
    i.slug.includes(q) ||
    i.description.toLowerCase().includes(q) ||
    (i.alternateName && i.alternateName.some(n => n.toLowerCase().includes(q)))
  );
}

export function getRelatedIngredients(ingredient: Ingredient): Ingredient[] {
  // Find ingredients from the same category or cuisine
  return ingredients.filter(i => 
    i.slug !== ingredient.slug &&
    (i.category === ingredient.category || 
     i.cuisines.some(c => ingredient.cuisines.includes(c)))
  ).slice(0, 6);
}

// Stats for hub page
export function getIngredientStats() {
  return {
    totalIngredients: ingredients.length,
    totalCategories: ingredientCategories.length,
    totalCuisines: cuisines.length,
    byCategory: ingredientCategories.map(cat => ({
      ...cat,
      count: ingredients.filter(i => i.category === cat.slug).length
    })),
    byCuisine: cuisines.map(cuis => ({
      ...cuis,
      count: ingredients.filter(i => i.cuisines.includes(cuis.slug)).length
    }))
  };
}
