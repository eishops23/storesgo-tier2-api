import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";

interface FullRecipe {
  slug: string;
  title: string;
  cuisine: string;
  category: string;
  difficulty: "easy" | "medium" | "hard";
  prepTime: number;
  cookTime: number;
  servings: number;
  description: string;
  ingredients: string[];
  instructions: string[];
  tips: string[];
  tags: string[];
  nutrition: { calories: number; protein: number; carbs: number; fat: number };
}

const cuisineData: Record<string, { label: string; spices: string[]; techniques: string[]; pairings: string[] }> = {
  jamaican: { label: "Jamaican", spices: ["allspice", "scotch bonnet", "thyme", "ginger"], techniques: ["jerk marinating", "slow braising", "frying"], pairings: ["rice and peas", "festival", "fried plantains"] },
  haitian: { label: "Haitian", spices: ["epis", "scotch bonnet", "cloves", "thyme"], techniques: ["braising then frying", "slow cooking", "stewing"], pairings: ["diri blanc", "bannann peze", "pikliz"] },
  cuban: { label: "Cuban", spices: ["cumin", "oregano", "garlic", "sour orange"], techniques: ["mojo marinating", "slow roasting", "sofrito base"], pairings: ["black beans", "white rice", "tostones"] },
  nigerian: { label: "Nigerian", spices: ["curry", "thyme", "bay leaves", "seasoning cubes"], techniques: ["frying tomato base", "palm oil cooking", "steaming"], pairings: ["jollof rice", "pounded yam", "eba"] },
  vietnamese: { label: "Vietnamese", spices: ["fish sauce", "star anise", "lemongrass", "ginger"], techniques: ["charring aromatics", "quick stir-frying", "slow simmering"], pairings: ["rice noodles", "fresh herbs", "nuoc cham"] },
  indian: { label: "Indian", spices: ["garam masala", "turmeric", "cumin", "coriander"], techniques: ["tempering spices", "slow curry cooking", "tandoor grilling"], pairings: ["basmati rice", "naan", "raita"] },
  mexican: { label: "Mexican", spices: ["cumin", "oregano", "chiles", "epazote"], techniques: ["toasting chiles", "braising", "grilling"], pairings: ["corn tortillas", "rice", "beans"] },
  thai: { label: "Thai", spices: ["fish sauce", "galangal", "lemongrass", "Thai basil"], techniques: ["curry paste frying", "wok cooking", "balancing flavors"], pairings: ["jasmine rice", "fresh vegetables", "lime"] },
  korean: { label: "Korean", spices: ["gochugaru", "gochujang", "sesame", "doenjang"], techniques: ["marinating", "grilling", "fermenting"], pairings: ["steamed rice", "kimchi", "banchan"] },
  chinese: { label: "Chinese", spices: ["five spice", "soy sauce", "ginger", "star anise"], techniques: ["wok hei", "steaming", "braising"], pairings: ["steamed rice", "noodles", "bok choy"] },
  ethiopian: { label: "Ethiopian", spices: ["berbere", "mitmita", "korarima", "fenugreek"], techniques: ["slow stewing", "clarifying butter", "injera serving"], pairings: ["injera", "ayib", "collard greens"] },
  trinidadian: { label: "Trinidadian", spices: ["curry powder", "chadon beni", "pimento", "scotch bonnet"], techniques: ["curry making", "doubles frying", "pelau cooking"], pairings: ["roti", "rice", "provisions"] },
  puerto_rican: { label: "Puerto Rican", spices: ["sofrito", "adobo", "sazon", "recao"], techniques: ["sofrito base", "slow roasting", "frying"], pairings: ["arroz con gandules", "tostones", "habichuelas"] },
  ghanaian: { label: "Ghanaian", spices: ["dawadawa", "grains of paradise", "ginger", "nutmeg"], techniques: ["palm oil cooking", "fufu pounding", "grilling"], pairings: ["banku", "kenkey", "jollof"] },
  dominican: { label: "Dominican", spices: ["sazon", "oregano", "garlic", "cumin"], techniques: ["sofrito making", "stewing", "frying"], pairings: ["white rice", "habichuelas", "tostones"] },
  filipino: { label: "Filipino", spices: ["soy sauce", "vinegar", "garlic", "bay leaves"], techniques: ["adobo braising", "sinigang souring", "grilling"], pairings: ["steamed rice", "sawsawan", "atchara"] }
};

function generateRecipe(base: { slug: string; title: string; cuisine: string; category: string; difficulty: "easy" | "medium" | "hard"; time: number; keyIngredients: string[]; flavor: string }): FullRecipe {
  const cd = cuisineData[base.cuisine] || cuisineData.jamaican;
  const isEasy = base.difficulty === "easy";
  const isHard = base.difficulty === "hard";
  
  return {
    slug: base.slug,
    title: base.title,
    cuisine: base.cuisine,
    category: base.category,
    difficulty: base.difficulty,
    prepTime: Math.floor(base.time * 0.3),
    cookTime: Math.floor(base.time * 0.7),
    servings: base.category === "side" || base.category === "appetizer" ? 6 : 4,
    description: `${base.flavor} This authentic ${cd.label} ${base.title.toLowerCase()} brings traditional flavors to your kitchen. ${isHard ? "A labor of love that rewards patience." : isEasy ? "Quick and easy for busy weeknights." : "Worth the moderate effort."}`,
    ingredients: [
      ...base.keyIngredients,
      `${isEasy ? "2" : "4"} cloves garlic, minced`,
      "1 medium onion, diced",
      `${cd.spices[0]} to taste`,
      `1 teaspoon ${cd.spices[1]}`,
      "Salt and pepper to taste",
      "2 tablespoons vegetable oil"
    ],
    instructions: [
      `Prepare all ingredients: ${base.keyIngredients.slice(0, 3).join(", ")}. Having everything ready makes cooking smoother.`,
      `Season your main ingredient with salt, pepper, and ${cd.spices[0]}. Let marinate ${isEasy ? "15 minutes" : isHard ? "4 hours or overnight" : "1-2 hours"}.`,
      `Heat oil in a ${isHard ? "heavy Dutch oven" : "large skillet"} over medium-high heat.`,
      `${cd.techniques[0].charAt(0).toUpperCase() + cd.techniques[0].slice(1)} - this is essential for authentic ${cd.label} flavor.`,
      `Add onion and garlic, cook until fragrant and softened, about ${isEasy ? "3" : "5"} minutes.`,
      `Add the main ingredients and cook ${isEasy ? "until done" : "low and slow for best results"}.`,
      `Season with ${cd.spices.slice(0, 2).join(" and ")}. Taste and adjust seasoning.`,
      `${isHard ? "Let rest 10-15 minutes before serving." : "Serve immediately while hot."}`,
      `Garnish and serve with traditional ${cd.pairings[0]}.`
    ],
    tips: [
      `For authentic ${cd.label} flavor, don't skip the ${cd.spices[0]}.`,
      `${cd.techniques[0].charAt(0).toUpperCase() + cd.techniques[0].slice(1)} is the traditional technique.`,
      `Serve with ${cd.pairings.join(", ")} for a complete meal.`,
      `Leftovers keep well for 3-4 days and often taste better the next day.`,
      isHard ? `Worth the effort for special occasions.` : `Great weeknight meal.`
    ],
    tags: [base.cuisine, base.category, base.difficulty, ...cd.spices.slice(0, 2)],
    nutrition: {
      calories: base.category === "main" ? 350 + Math.floor(Math.random() * 200) : 150 + Math.floor(Math.random() * 150),
      protein: base.category === "main" ? 25 + Math.floor(Math.random() * 20) : 5 + Math.floor(Math.random() * 15),
      carbs: 20 + Math.floor(Math.random() * 40),
      fat: 10 + Math.floor(Math.random() * 25)
    }
  };
}

const recipeDatabase = [
  // JAMAICAN (20)
  { slug: "authentic-jerk-chicken", title: "Authentic Jamaican Jerk Chicken", cuisine: "jamaican", category: "main", difficulty: "medium" as const, time: 75, keyIngredients: ["3 lbs chicken pieces", "6 scotch bonnet peppers", "1/4 cup allspice", "1 bunch scallions", "fresh thyme"], flavor: "Fiery, aromatic, and deeply flavored with scotch bonnet and allspice." },
  { slug: "jamaican-rice-and-peas", title: "Jamaican Rice and Peas", cuisine: "jamaican", category: "side", difficulty: "easy" as const, time: 55, keyIngredients: ["2 cups rice", "1 can kidney beans", "1 can coconut milk", "scotch bonnet pepper", "fresh thyme"], flavor: "Creamy coconut-infused rice with tender kidney beans." },
  { slug: "ackee-and-saltfish", title: "Ackee and Saltfish", cuisine: "jamaican", category: "main", difficulty: "medium" as const, time: 45, keyIngredients: ["1 lb saltfish", "1 can ackee", "tomatoes", "scotch bonnet", "scallions"], flavor: "Jamaica's national dish - buttery ackee with savory salted cod." },
  { slug: "jamaican-oxtail-stew", title: "Jamaican Oxtail Stew", cuisine: "jamaican", category: "main", difficulty: "medium" as const, time: 210, keyIngredients: ["4 lbs oxtail", "butter beans", "browning sauce", "thyme", "scotch bonnet"], flavor: "Rich, fall-off-the-bone tender oxtail in thick savory gravy." },
  { slug: "jamaican-curry-goat", title: "Jamaican Curry Goat", cuisine: "jamaican", category: "main", difficulty: "medium" as const, time: 150, keyIngredients: ["4 lbs goat meat", "Jamaican curry powder", "potatoes", "thyme", "scotch bonnet"], flavor: "Aromatic curry with tender goat meat - a celebration staple." },
  { slug: "jamaican-beef-patty", title: "Jamaican Beef Patties", cuisine: "jamaican", category: "snack", difficulty: "medium" as const, time: 90, keyIngredients: ["ground beef", "turmeric pastry", "scotch bonnet", "thyme", "curry powder"], flavor: "Flaky golden pastry with spiced beef filling." },
  { slug: "jamaican-festival", title: "Jamaican Festival", cuisine: "jamaican", category: "side", difficulty: "easy" as const, time: 30, keyIngredients: ["flour", "cornmeal", "sugar", "vanilla", "baking powder"], flavor: "Sweet, golden fried dumplings - perfect with jerk." },
  { slug: "jamaican-escovitch-fish", title: "Jamaican Escovitch Fish", cuisine: "jamaican", category: "main", difficulty: "medium" as const, time: 50, keyIngredients: ["whole snapper", "bell peppers", "scotch bonnet", "vinegar", "allspice"], flavor: "Crispy fried fish topped with tangy pickled vegetables." },
  { slug: "jamaican-brown-stew-chicken", title: "Brown Stew Chicken", cuisine: "jamaican", category: "main", difficulty: "medium" as const, time: 65, keyIngredients: ["chicken pieces", "browning sauce", "tomatoes", "thyme", "scotch bonnet"], flavor: "Tender chicken in rich, savory brown gravy." },
  { slug: "jamaican-pepper-shrimp", title: "Jamaican Pepper Shrimp", cuisine: "jamaican", category: "appetizer", difficulty: "easy" as const, time: 25, keyIngredients: ["large shrimp", "scotch bonnet", "garlic", "butter", "black pepper"], flavor: "Spicy, garlicky shrimp - a roadside favorite." },
  
  // HAITIAN (15)
  { slug: "griot-haitian-pork", title: "Griot - Haitian Fried Pork", cuisine: "haitian", category: "main", difficulty: "medium" as const, time: 120, keyIngredients: ["4 lbs pork shoulder", "sour orange", "epis", "scotch bonnet", "thyme"], flavor: "Crispy, succulent pork braised then fried - Haiti's celebration dish." },
  { slug: "diri-djon-djon", title: "Diri Djon Djon", cuisine: "haitian", category: "side", difficulty: "medium" as const, time: 65, keyIngredients: ["rice", "djon djon mushrooms", "lima beans", "epis", "butter"], flavor: "Jet-black mushroom rice reserved for special occasions." },
  { slug: "haitian-legume", title: "Haitian Legume", cuisine: "haitian", category: "main", difficulty: "medium" as const, time: 90, keyIngredients: ["eggplant", "cabbage", "chayote", "beef or crab", "epis"], flavor: "Hearty vegetable stew - comfort food at its finest." },
  { slug: "haitian-pikliz", title: "Pikliz", cuisine: "haitian", category: "condiment", difficulty: "easy" as const, time: 20, keyIngredients: ["cabbage", "carrots", "scotch bonnet", "cloves", "white vinegar"], flavor: "Fiery pickled slaw - essential with every Haitian meal." },
  { slug: "soup-joumou", title: "Soup Joumou", cuisine: "haitian", category: "soup", difficulty: "hard" as const, time: 225, keyIngredients: ["calabaza pumpkin", "beef", "pasta", "vegetables", "thyme"], flavor: "Independence Day soup symbolizing freedom - rich and hearty." },
  { slug: "haitian-sauce-pois", title: "Sauce Pois", cuisine: "haitian", category: "main", difficulty: "medium" as const, time: 140, keyIngredients: ["red or black beans", "pork", "epis", "scotch bonnet", "thyme"], flavor: "Thick, creamy bean sauce - ultimate Haitian comfort food." },
  { slug: "haitian-tassot", title: "Tassot - Fried Beef", cuisine: "haitian", category: "main", difficulty: "medium" as const, time: 90, keyIngredients: ["beef", "sour orange", "epis", "scotch bonnet", "thyme"], flavor: "Crispy fried beef - griot's delicious cousin." },
  { slug: "haitian-banann-peze", title: "Bannann Peze", cuisine: "haitian", category: "side", difficulty: "easy" as const, time: 20, keyIngredients: ["green plantains", "salt", "oil for frying"], flavor: "Twice-fried plantains - crispy and addictive." },
  { slug: "haitian-akra", title: "Haitian Akra", cuisine: "haitian", category: "appetizer", difficulty: "medium" as const, time: 45, keyIngredients: ["malanga", "scotch bonnet", "garlic", "scallions", "salt"], flavor: "Crispy malanga fritters - perfect street food." },
  { slug: "haitian-poulet-creole", title: "Poulet Creole", cuisine: "haitian", category: "main", difficulty: "medium" as const, time: 75, keyIngredients: ["chicken", "tomatoes", "bell peppers", "epis", "scotch bonnet"], flavor: "Chicken braised in rich tomato-pepper sauce." },
  
  // NIGERIAN (15)
  { slug: "nigerian-jollof-rice", title: "Nigerian Jollof Rice", cuisine: "nigerian", category: "main", difficulty: "medium" as const, time: 90, keyIngredients: ["parboiled rice", "tomatoes", "bell peppers", "scotch bonnet", "tomato paste"], flavor: "Smoky, tomato-based party rice - Nigeria's pride." },
  { slug: "nigerian-egusi-soup", title: "Egusi Soup", cuisine: "nigerian", category: "soup", difficulty: "medium" as const, time: 75, keyIngredients: ["ground egusi", "assorted meat", "palm oil", "spinach", "stockfish"], flavor: "Thick melon seed soup with leafy greens and meat." },
  { slug: "nigerian-suya", title: "Suya", cuisine: "nigerian", category: "appetizer", difficulty: "easy" as const, time: 45, keyIngredients: ["beef", "suya spice", "groundnut powder", "onions"], flavor: "Spicy grilled beef skewers - iconic street food." },
  { slug: "nigerian-puff-puff", title: "Puff Puff", cuisine: "nigerian", category: "snack", difficulty: "easy" as const, time: 110, keyIngredients: ["flour", "yeast", "sugar", "nutmeg", "oil"], flavor: "Fluffy fried dough balls - sweet and addictive." },
  { slug: "nigerian-pepper-soup", title: "Nigerian Pepper Soup", cuisine: "nigerian", category: "soup", difficulty: "medium" as const, time: 80, keyIngredients: ["goat or catfish", "pepper soup spice", "scotch bonnet", "scent leaves"], flavor: "Spicy, aromatic broth - believed to cure anything." },
  { slug: "nigerian-moi-moi", title: "Moi Moi", cuisine: "nigerian", category: "side", difficulty: "medium" as const, time: 105, keyIngredients: ["black-eyed peas", "peppers", "onion", "crayfish", "eggs"], flavor: "Steamed bean pudding - protein-rich and delicious." },
  { slug: "nigerian-fried-rice", title: "Nigerian Fried Rice", cuisine: "nigerian", category: "main", difficulty: "easy" as const, time: 45, keyIngredients: ["rice", "mixed vegetables", "liver", "shrimp", "curry"], flavor: "Colorful party rice with vegetables and protein." },
  { slug: "nigerian-chin-chin", title: "Chin Chin", cuisine: "nigerian", category: "snack", difficulty: "easy" as const, time: 60, keyIngredients: ["flour", "butter", "sugar", "nutmeg", "eggs"], flavor: "Crunchy fried pastry bites - perfect snack." },
  { slug: "nigerian-akara", title: "Akara", cuisine: "nigerian", category: "breakfast", difficulty: "medium" as const, time: 45, keyIngredients: ["black-eyed peas", "peppers", "onion", "salt"], flavor: "Crispy bean fritters - traditional breakfast." },
  { slug: "nigerian-efo-riro", title: "Efo Riro", cuisine: "nigerian", category: "soup", difficulty: "medium" as const, time: 60, keyIngredients: ["spinach", "palm oil", "assorted meat", "locust beans", "crayfish"], flavor: "Rich spinach stew with assorted meats." },
  
  // VIETNAMESE (12)
  { slug: "vietnamese-pho-bo", title: "Pho Bo", cuisine: "vietnamese", category: "soup", difficulty: "hard" as const, time: 480, keyIngredients: ["beef bones", "brisket", "star anise", "cinnamon", "pho noodles"], flavor: "Iconic beef noodle soup with aromatic broth." },
  { slug: "vietnamese-banh-mi", title: "Banh Mi", cuisine: "vietnamese", category: "main", difficulty: "medium" as const, time: 50, keyIngredients: ["baguette", "pate", "cold cuts", "pickled vegetables", "cilantro"], flavor: "Crispy sandwich with French-Vietnamese fusion fillings." },
  { slug: "vietnamese-bun-cha", title: "Bun Cha", cuisine: "vietnamese", category: "main", difficulty: "medium" as const, time: 60, keyIngredients: ["pork patties", "pork belly", "rice noodles", "nuoc cham", "herbs"], flavor: "Grilled pork in dipping sauce - Hanoi's signature." },
  { slug: "vietnamese-goi-cuon", title: "Goi Cuon - Fresh Spring Rolls", cuisine: "vietnamese", category: "appetizer", difficulty: "easy" as const, time: 45, keyIngredients: ["rice paper", "shrimp", "pork", "vermicelli", "herbs"], flavor: "Fresh, healthy rolls with peanut dipping sauce." },
  { slug: "vietnamese-com-tam", title: "Com Tam", cuisine: "vietnamese", category: "main", difficulty: "medium" as const, time: 60, keyIngredients: ["broken rice", "grilled pork chop", "fish sauce", "lemongrass"], flavor: "Broken rice with caramelized grilled pork." },
  { slug: "vietnamese-banh-xeo", title: "Banh Xeo", cuisine: "vietnamese", category: "main", difficulty: "medium" as const, time: 45, keyIngredients: ["rice flour", "turmeric", "shrimp", "pork", "bean sprouts"], flavor: "Crispy Vietnamese crepes - sizzling and savory." },
  { slug: "vietnamese-pho-ga", title: "Pho Ga", cuisine: "vietnamese", category: "soup", difficulty: "medium" as const, time: 180, keyIngredients: ["whole chicken", "ginger", "star anise", "pho noodles", "herbs"], flavor: "Lighter chicken pho - clean and comforting." },
  { slug: "vietnamese-thit-kho", title: "Thit Kho - Caramelized Pork", cuisine: "vietnamese", category: "main", difficulty: "medium" as const, time: 90, keyIngredients: ["pork belly", "eggs", "coconut water", "fish sauce", "sugar"], flavor: "Sweet-savory braised pork with eggs." },
  { slug: "vietnamese-bo-luc-lac", title: "Bo Luc Lac - Shaking Beef", cuisine: "vietnamese", category: "main", difficulty: "easy" as const, time: 30, keyIngredients: ["beef tenderloin", "garlic", "soy sauce", "watercress"], flavor: "Seared beef cubes - quick and impressive." },
  { slug: "vietnamese-ca-phe-sua-da", title: "Vietnamese Iced Coffee", cuisine: "vietnamese", category: "beverage", difficulty: "easy" as const, time: 10, keyIngredients: ["Vietnamese coffee", "condensed milk", "ice"], flavor: "Strong, sweet iced coffee - addictively good." },
  
  // INDIAN (12)
  { slug: "indian-butter-chicken", title: "Butter Chicken", cuisine: "indian", category: "main", difficulty: "medium" as const, time: 70, keyIngredients: ["chicken thighs", "tomatoes", "cream", "butter", "garam masala"], flavor: "Creamy, mildly spiced tomato curry - globally beloved." },
  { slug: "indian-chicken-biryani", title: "Chicken Biryani", cuisine: "indian", category: "main", difficulty: "hard" as const, time: 105, keyIngredients: ["basmati rice", "chicken", "yogurt", "saffron", "fried onions"], flavor: "Layered rice and chicken - the king of rice dishes." },
  { slug: "indian-dal-tadka", title: "Dal Tadka", cuisine: "indian", category: "main", difficulty: "easy" as const, time: 40, keyIngredients: ["yellow lentils", "ghee", "cumin", "garlic", "tomatoes"], flavor: "Comforting lentils with sizzling tempered spices." },
  { slug: "indian-samosa", title: "Samosa", cuisine: "indian", category: "appetizer", difficulty: "medium" as const, time: 75, keyIngredients: ["potatoes", "peas", "pastry", "cumin", "garam masala"], flavor: "Crispy triangular pastries with spiced potato filling." },
  { slug: "indian-palak-paneer", title: "Palak Paneer", cuisine: "indian", category: "main", difficulty: "medium" as const, time: 45, keyIngredients: ["spinach", "paneer", "cream", "garam masala", "ginger"], flavor: "Creamy spinach curry with cheese cubes." },
  { slug: "indian-chicken-tikka-masala", title: "Chicken Tikka Masala", cuisine: "indian", category: "main", difficulty: "medium" as const, time: 60, keyIngredients: ["chicken", "yogurt", "tomato sauce", "cream", "spices"], flavor: "Tandoori chicken in rich creamy sauce." },
  { slug: "indian-chana-masala", title: "Chana Masala", cuisine: "indian", category: "main", difficulty: "easy" as const, time: 45, keyIngredients: ["chickpeas", "tomatoes", "onion", "garam masala", "amchur"], flavor: "Tangy, spiced chickpea curry - vegan favorite." },
  { slug: "indian-naan", title: "Naan Bread", cuisine: "indian", category: "bread", difficulty: "medium" as const, time: 120, keyIngredients: ["flour", "yogurt", "yeast", "garlic butter"], flavor: "Soft, pillowy flatbread - perfect for scooping curry." },
  { slug: "indian-tandoori-chicken", title: "Tandoori Chicken", cuisine: "indian", category: "main", difficulty: "medium" as const, time: 300, keyIngredients: ["chicken", "yogurt", "tandoori masala", "lemon", "ginger"], flavor: "Smoky, charred chicken with vibrant red color." },
  { slug: "indian-gulab-jamun", title: "Gulab Jamun", cuisine: "indian", category: "dessert", difficulty: "medium" as const, time: 60, keyIngredients: ["milk powder", "flour", "cardamom", "rose syrup"], flavor: "Soft milk balls soaked in sweet rose syrup." },
  
  // MEXICAN (12)
  { slug: "mexican-carnitas", title: "Carnitas", cuisine: "mexican", category: "main", difficulty: "medium" as const, time: 200, keyIngredients: ["pork shoulder", "orange", "cinnamon", "cola", "lard"], flavor: "Crispy, tender braised pork - taco perfection." },
  { slug: "mexican-pozole-rojo", title: "Pozole Rojo", cuisine: "mexican", category: "soup", difficulty: "medium" as const, time: 210, keyIngredients: ["pork", "hominy", "guajillo chiles", "ancho chiles", "oregano"], flavor: "Rich red chile soup with hominy - celebration food." },
  { slug: "mexican-mole-poblano", title: "Mole Poblano", cuisine: "mexican", category: "main", difficulty: "hard" as const, time: 180, keyIngredients: ["dried chiles", "chocolate", "nuts", "spices", "turkey"], flavor: "Complex chile-chocolate sauce - Mexico's masterpiece." },
  { slug: "mexican-tamales", title: "Tamales", cuisine: "mexican", category: "main", difficulty: "hard" as const, time: 210, keyIngredients: ["masa", "lard", "corn husks", "chicken", "salsa"], flavor: "Steamed corn dough parcels - holiday tradition." },
  { slug: "mexican-tacos-al-pastor", title: "Tacos al Pastor", cuisine: "mexican", category: "main", difficulty: "medium" as const, time: 180, keyIngredients: ["pork", "achiote", "pineapple", "guajillo", "corn tortillas"], flavor: "Spit-roasted pork with pineapple - street food king." },
  { slug: "mexican-birria", title: "Birria", cuisine: "mexican", category: "main", difficulty: "medium" as const, time: 240, keyIngredients: ["beef or goat", "guajillo chiles", "ancho chiles", "spices"], flavor: "Rich, red chile-braised meat - quesabirria base." },
  { slug: "mexican-enchiladas-verdes", title: "Enchiladas Verdes", cuisine: "mexican", category: "main", difficulty: "medium" as const, time: 60, keyIngredients: ["corn tortillas", "chicken", "tomatillos", "cream", "cheese"], flavor: "Rolled tortillas in tangy green salsa." },
  { slug: "mexican-guacamole", title: "Guacamole", cuisine: "mexican", category: "appetizer", difficulty: "easy" as const, time: 15, keyIngredients: ["avocados", "lime", "cilantro", "onion", "jalapeño"], flavor: "Fresh, chunky avocado dip - universally loved." },
  { slug: "mexican-churros", title: "Churros", cuisine: "mexican", category: "dessert", difficulty: "medium" as const, time: 45, keyIngredients: ["flour", "butter", "eggs", "cinnamon sugar", "chocolate"], flavor: "Crispy fried dough with cinnamon and chocolate." },
  { slug: "mexican-horchata", title: "Horchata", cuisine: "mexican", category: "beverage", difficulty: "easy" as const, time: 240, keyIngredients: ["rice", "cinnamon", "vanilla", "sugar", "milk"], flavor: "Sweet, creamy rice drink - refreshing and unique." },
  
  // THAI (10)
  { slug: "thai-green-curry", title: "Thai Green Curry", cuisine: "thai", category: "main", difficulty: "medium" as const, time: 45, keyIngredients: ["green curry paste", "coconut milk", "chicken", "Thai basil", "eggplant"], flavor: "Fragrant, creamy curry with fresh Thai basil." },
  { slug: "thai-pad-thai", title: "Pad Thai", cuisine: "thai", category: "main", difficulty: "medium" as const, time: 30, keyIngredients: ["rice noodles", "shrimp", "tamarind", "peanuts", "eggs"], flavor: "Sweet-sour-salty stir-fried noodles - Thailand's export." },
  { slug: "thai-tom-yum-goong", title: "Tom Yum Goong", cuisine: "thai", category: "soup", difficulty: "easy" as const, time: 35, keyIngredients: ["shrimp", "lemongrass", "galangal", "lime leaves", "mushrooms"], flavor: "Hot and sour shrimp soup - intensely aromatic." },
  { slug: "thai-massaman-curry", title: "Massaman Curry", cuisine: "thai", category: "main", difficulty: "medium" as const, time: 120, keyIngredients: ["beef", "potatoes", "peanuts", "massaman paste", "coconut milk"], flavor: "Rich, mild curry with Indian influences." },
  { slug: "thai-pad-see-ew", title: "Pad See Ew", cuisine: "thai", category: "main", difficulty: "easy" as const, time: 25, keyIngredients: ["wide rice noodles", "Chinese broccoli", "soy sauce", "eggs"], flavor: "Sweet soy sauce noodles - comfort food classic." },
  { slug: "thai-larb", title: "Larb", cuisine: "thai", category: "main", difficulty: "easy" as const, time: 25, keyIngredients: ["ground meat", "lime", "fish sauce", "mint", "toasted rice"], flavor: "Spicy meat salad - bright and refreshing." },
  { slug: "thai-som-tam", title: "Som Tam - Green Papaya Salad", cuisine: "thai", category: "side", difficulty: "easy" as const, time: 20, keyIngredients: ["green papaya", "tomatoes", "peanuts", "lime", "fish sauce"], flavor: "Crunchy, spicy papaya salad - addictively good." },
  { slug: "thai-satay", title: "Chicken Satay", cuisine: "thai", category: "appetizer", difficulty: "medium" as const, time: 60, keyIngredients: ["chicken", "coconut milk", "turmeric", "peanut sauce", "cucumber relish"], flavor: "Grilled skewers with creamy peanut sauce." },
  { slug: "thai-mango-sticky-rice", title: "Mango Sticky Rice", cuisine: "thai", category: "dessert", difficulty: "easy" as const, time: 60, keyIngredients: ["glutinous rice", "coconut milk", "mango", "sugar"], flavor: "Sweet coconut rice with fresh mango - heavenly." },
  
  // KOREAN (10)
  { slug: "korean-bibimbap", title: "Bibimbap", cuisine: "korean", category: "main", difficulty: "medium" as const, time: 75, keyIngredients: ["rice", "vegetables", "beef", "gochujang", "egg"], flavor: "Colorful rice bowl mixed with spicy sauce." },
  { slug: "korean-bulgogi", title: "Bulgogi", cuisine: "korean", category: "main", difficulty: "easy" as const, time: 40, keyIngredients: ["beef", "soy sauce", "pear", "sesame", "garlic"], flavor: "Sweet-savory marinated beef - grilling essential." },
  { slug: "korean-kimchi-jjigae", title: "Kimchi Jjigae", cuisine: "korean", category: "soup", difficulty: "easy" as const, time: 40, keyIngredients: ["aged kimchi", "pork", "tofu", "gochugaru", "scallions"], flavor: "Spicy, sour kimchi stew - ultimate comfort." },
  { slug: "korean-japchae", title: "Japchae", cuisine: "korean", category: "main", difficulty: "medium" as const, time: 45, keyIngredients: ["glass noodles", "vegetables", "beef", "soy sauce", "sesame"], flavor: "Sweet potato noodles with vegetables - party dish." },
  { slug: "korean-tteokbokki", title: "Tteokbokki", cuisine: "korean", category: "main", difficulty: "easy" as const, time: 30, keyIngredients: ["rice cakes", "gochujang", "fish cakes", "scallions"], flavor: "Spicy rice cakes in sweet-hot sauce - street food icon." },
  { slug: "korean-fried-chicken", title: "Korean Fried Chicken", cuisine: "korean", category: "main", difficulty: "medium" as const, time: 60, keyIngredients: ["chicken", "gochujang", "soy garlic sauce", "cornstarch"], flavor: "Extra crispy double-fried chicken with sauce." },
  { slug: "korean-kimchi", title: "Homemade Kimchi", cuisine: "korean", category: "condiment", difficulty: "medium" as const, time: 60, keyIngredients: ["napa cabbage", "gochugaru", "fish sauce", "garlic", "ginger"], flavor: "Fermented spicy cabbage - Korean essential." },
  { slug: "korean-samgyetang", title: "Samgyetang", cuisine: "korean", category: "soup", difficulty: "medium" as const, time: 120, keyIngredients: ["Cornish hen", "ginseng", "rice", "garlic", "jujubes"], flavor: "Ginseng chicken soup - restorative and mild." },
  
  // CHINESE (10)
  { slug: "chinese-kung-pao-chicken", title: "Kung Pao Chicken", cuisine: "chinese", category: "main", difficulty: "medium" as const, time: 30, keyIngredients: ["chicken", "peanuts", "dried chiles", "Sichuan peppercorns", "soy sauce"], flavor: "Spicy, numbing chicken with peanuts - Sichuan classic." },
  { slug: "chinese-mapo-tofu", title: "Mapo Tofu", cuisine: "chinese", category: "main", difficulty: "easy" as const, time: 25, keyIngredients: ["silken tofu", "ground pork", "doubanjiang", "Sichuan peppercorns"], flavor: "Spicy, numbing tofu in chili bean sauce." },
  { slug: "chinese-fried-rice", title: "Chinese Fried Rice", cuisine: "chinese", category: "main", difficulty: "easy" as const, time: 20, keyIngredients: ["day-old rice", "eggs", "scallions", "soy sauce", "vegetables"], flavor: "Classic wok-fried rice with eggs and vegetables." },
  { slug: "chinese-dumplings", title: "Chinese Dumplings (Jiaozi)", cuisine: "chinese", category: "main", difficulty: "medium" as const, time: 90, keyIngredients: ["ground pork", "cabbage", "ginger", "soy sauce", "wrappers"], flavor: "Handmade pork and cabbage dumplings." },
  { slug: "chinese-char-siu", title: "Char Siu", cuisine: "chinese", category: "main", difficulty: "medium" as const, time: 180, keyIngredients: ["pork shoulder", "honey", "hoisin", "five spice", "soy sauce"], flavor: "Sweet, sticky Cantonese BBQ pork." },
  { slug: "chinese-dan-dan-noodles", title: "Dan Dan Noodles", cuisine: "chinese", category: "main", difficulty: "medium" as const, time: 35, keyIngredients: ["noodles", "ground pork", "chili oil", "sesame paste", "Sichuan peppercorns"], flavor: "Spicy, nutty noodles with minced pork." },
  { slug: "chinese-hot-pot", title: "Chinese Hot Pot", cuisine: "chinese", category: "main", difficulty: "medium" as const, time: 60, keyIngredients: ["broth", "sliced meats", "vegetables", "tofu", "dipping sauces"], flavor: "Interactive simmering pot - social dining experience." },
  
  // CUBAN (10)
  { slug: "cuban-ropa-vieja", title: "Ropa Vieja", cuisine: "cuban", category: "main", difficulty: "medium" as const, time: 200, keyIngredients: ["flank steak", "tomatoes", "bell peppers", "olives", "capers"], flavor: "Shredded beef in rich tomato sauce - Cuba's national dish." },
  { slug: "cuban-lechon-asado", title: "Lechon Asado", cuisine: "cuban", category: "main", difficulty: "medium" as const, time: 270, keyIngredients: ["pork shoulder", "mojo criollo", "garlic", "sour orange", "oregano"], flavor: "Slow-roasted pork in citrus garlic marinade." },
  { slug: "cuban-picadillo", title: "Picadillo Cubano", cuisine: "cuban", category: "main", difficulty: "easy" as const, time: 45, keyIngredients: ["ground beef", "olives", "raisins", "capers", "tomato sauce"], flavor: "Sweet and savory ground beef hash - family favorite." },
  { slug: "cuban-black-beans", title: "Frijoles Negros", cuisine: "cuban", category: "side", difficulty: "easy" as const, time: 135, keyIngredients: ["black beans", "sofrito", "cumin", "oregano", "vinegar"], flavor: "Thick, creamy black beans - essential Cuban side." },
  { slug: "cuban-vaca-frita", title: "Vaca Frita", cuisine: "cuban", category: "main", difficulty: "medium" as const, time: 170, keyIngredients: ["flank steak", "lime", "garlic", "onions", "mojo"], flavor: "Crispy twice-cooked beef with caramelized onions." },
  { slug: "cuban-moros-y-cristianos", title: "Moros y Cristianos", cuisine: "cuban", category: "side", difficulty: "medium" as const, time: 65, keyIngredients: ["rice", "black beans", "bacon", "sofrito", "cumin"], flavor: "Black beans and rice cooked together - classic combo." },
  { slug: "cuban-sandwich", title: "Cuban Sandwich", cuisine: "cuban", category: "main", difficulty: "easy" as const, time: 30, keyIngredients: ["Cuban bread", "roast pork", "ham", "Swiss cheese", "pickles"], flavor: "Pressed sandwich perfection - crispy and melty." },
  { slug: "cuban-tostones", title: "Tostones", cuisine: "cuban", category: "side", difficulty: "easy" as const, time: 20, keyIngredients: ["green plantains", "salt", "garlic", "oil"], flavor: "Twice-fried plantain discs - crispy and garlicky." },
  
  // ETHIOPIAN (8)
  { slug: "ethiopian-doro-wat", title: "Doro Wat", cuisine: "ethiopian", category: "main", difficulty: "medium" as const, time: 120, keyIngredients: ["chicken", "berbere", "niter kibbeh", "onions", "eggs"], flavor: "Spicy chicken stew - Ethiopia's national dish." },
  { slug: "ethiopian-injera", title: "Injera", cuisine: "ethiopian", category: "bread", difficulty: "hard" as const, time: 4320, keyIngredients: ["teff flour", "water", "starter"], flavor: "Spongy, sour flatbread - plate and utensil in one." },
  { slug: "ethiopian-kitfo", title: "Kitfo", cuisine: "ethiopian", category: "main", difficulty: "easy" as const, time: 30, keyIngredients: ["raw beef", "mitmita", "niter kibbeh", "kocho"], flavor: "Ethiopian beef tartare - warming and rich." },
  { slug: "ethiopian-shiro", title: "Shiro", cuisine: "ethiopian", category: "main", difficulty: "easy" as const, time: 45, keyIngredients: ["chickpea flour", "berbere", "onions", "tomatoes"], flavor: "Smooth chickpea stew - vegan comfort food." },
  { slug: "ethiopian-tibs", title: "Tibs", cuisine: "ethiopian", category: "main", difficulty: "easy" as const, time: 30, keyIngredients: ["beef or lamb", "onions", "jalapeños", "rosemary"], flavor: "Sautéed meat with vegetables - quick and flavorful." },
  { slug: "ethiopian-misir-wat", title: "Misir Wat", cuisine: "ethiopian", category: "main", difficulty: "easy" as const, time: 60, keyIngredients: ["red lentils", "berbere", "onions", "niter kibbeh"], flavor: "Spicy red lentil stew - vegan staple." },
  
  // TRINIDADIAN (8)
  { slug: "trinidadian-doubles", title: "Doubles", cuisine: "trinidadian", category: "breakfast", difficulty: "medium" as const, time: 120, keyIngredients: ["bara", "channa", "pepper sauce", "tamarind"], flavor: "Curried chickpeas in fried bread - street food king." },
  { slug: "trinidadian-pelau", title: "Pelau", cuisine: "trinidadian", category: "main", difficulty: "medium" as const, time: 75, keyIngredients: ["chicken", "pigeon peas", "rice", "coconut milk", "browning"], flavor: "One-pot rice with caramelized chicken and peas." },
  { slug: "trinidadian-callaloo", title: "Callaloo", cuisine: "trinidadian", category: "side", difficulty: "medium" as const, time: 60, keyIngredients: ["dasheen leaves", "okra", "coconut milk", "crab", "scotch bonnet"], flavor: "Creamy green soup with crab - national dish." },
  { slug: "trinidadian-roti", title: "Trinidadian Roti", cuisine: "trinidadian", category: "bread", difficulty: "medium" as const, time: 90, keyIngredients: ["flour", "baking powder", "curry filling"], flavor: "Flaky flatbread wrapped around curried filling." },
  { slug: "trinidadian-curry-chicken", title: "Curry Chicken", cuisine: "trinidadian", category: "main", difficulty: "medium" as const, time: 60, keyIngredients: ["chicken", "Trinidad curry powder", "potatoes", "scotch bonnet"], flavor: "Rich, aromatic curry - Caribbean-Indian fusion." },
  { slug: "trinidadian-bake-and-shark", title: "Bake and Shark", cuisine: "trinidadian", category: "main", difficulty: "medium" as const, time: 45, keyIngredients: ["shark", "fry bake", "chadon beni", "garlic sauce"], flavor: "Fried shark in bread - Maracas Beach famous." },
  
  // PUERTO RICAN (8)
  { slug: "puerto-rican-mofongo", title: "Mofongo", cuisine: "puerto_rican", category: "main", difficulty: "medium" as const, time: 45, keyIngredients: ["green plantains", "chicharrones", "garlic", "olive oil"], flavor: "Mashed plantains with pork cracklings - comfort classic." },
  { slug: "puerto-rican-pernil", title: "Pernil", cuisine: "puerto_rican", category: "main", difficulty: "medium" as const, time: 480, keyIngredients: ["pork shoulder", "adobo", "sofrito", "garlic"], flavor: "Slow-roasted pork shoulder - Christmas essential." },
  { slug: "puerto-rican-arroz-con-gandules", title: "Arroz con Gandules", cuisine: "puerto_rican", category: "main", difficulty: "medium" as const, time: 60, keyIngredients: ["rice", "pigeon peas", "sofrito", "sazon", "pork"], flavor: "Rice with pigeon peas - holiday must-have." },
  { slug: "puerto-rican-pasteles", title: "Pasteles", cuisine: "puerto_rican", category: "main", difficulty: "hard" as const, time: 180, keyIngredients: ["green banana masa", "pork filling", "banana leaves"], flavor: "Meat-filled masa wrapped in leaves - labor of love." },
  { slug: "puerto-rican-coquito", title: "Coquito", cuisine: "puerto_rican", category: "beverage", difficulty: "easy" as const, time: 20, keyIngredients: ["coconut milk", "condensed milk", "rum", "cinnamon"], flavor: "Puerto Rican eggnog - creamy holiday drink." },
  { slug: "puerto-rican-sofrito", title: "Sofrito", cuisine: "puerto_rican", category: "condiment", difficulty: "easy" as const, time: 15, keyIngredients: ["recao", "peppers", "onions", "garlic", "cilantro"], flavor: "Aromatic cooking base - foundation of PR cuisine." },
  
  // GHANAIAN (8)
  { slug: "ghanaian-jollof-rice", title: "Ghanaian Jollof Rice", cuisine: "ghanaian", category: "main", difficulty: "medium" as const, time: 75, keyIngredients: ["rice", "tomatoes", "scotch bonnet", "onions", "spices"], flavor: "The other famous jollof - Ghana's version in the wars." },
  { slug: "ghanaian-waakye", title: "Waakye", cuisine: "ghanaian", category: "main", difficulty: "medium" as const, time: 120, keyIngredients: ["rice", "black-eyed peas", "millet leaves", "shito"], flavor: "Rice and beans with distinctive red color." },
  { slug: "ghanaian-fufu", title: "Fufu with Light Soup", cuisine: "ghanaian", category: "main", difficulty: "medium" as const, time: 90, keyIngredients: ["cassava", "plantain", "light soup", "goat meat"], flavor: "Pounded starch with tomato-based soup." },
  { slug: "ghanaian-kelewele", title: "Kelewele", cuisine: "ghanaian", category: "side", difficulty: "easy" as const, time: 25, keyIngredients: ["ripe plantains", "ginger", "cayenne", "cloves"], flavor: "Spicy fried plantains - addictive snack." },
  { slug: "ghanaian-red-red", title: "Red Red", cuisine: "ghanaian", category: "main", difficulty: "easy" as const, time: 60, keyIngredients: ["black-eyed peas", "palm oil", "plantains", "tomatoes"], flavor: "Bean stew with fried plantains - comfort classic." },
  { slug: "ghanaian-groundnut-soup", title: "Groundnut Soup", cuisine: "ghanaian", category: "soup", difficulty: "medium" as const, time: 90, keyIngredients: ["peanut butter", "chicken", "tomatoes", "onions"], flavor: "Rich peanut soup - served with fufu." },
  
  // DOMINICAN (8)
  { slug: "dominican-mangu", title: "Mangu", cuisine: "dominican", category: "breakfast", difficulty: "easy" as const, time: 30, keyIngredients: ["green plantains", "butter", "onions", "salami", "eggs"], flavor: "Mashed plantains - Dominican breakfast essential." },
  { slug: "dominican-sancocho", title: "Sancocho", cuisine: "dominican", category: "soup", difficulty: "medium" as const, time: 180, keyIngredients: ["multiple meats", "root vegetables", "cilantro", "sour orange"], flavor: "Seven-meat stew - celebration soup." },
  { slug: "dominican-locrio", title: "Locrio de Pollo", cuisine: "dominican", category: "main", difficulty: "medium" as const, time: 60, keyIngredients: ["chicken", "rice", "tomatoes", "olives", "capers"], flavor: "Dominican chicken and rice - like paella." },
  { slug: "dominican-moro", title: "Moro de Habichuelas", cuisine: "dominican", category: "side", difficulty: "medium" as const, time: 60, keyIngredients: ["rice", "red beans", "coconut milk", "sofrito"], flavor: "Rice and beans cooked together - daily staple." },
  { slug: "dominican-chimichurri", title: "Chimichurri Burger", cuisine: "dominican", category: "main", difficulty: "easy" as const, time: 30, keyIngredients: ["beef patty", "cabbage slaw", "tomato", "special sauce"], flavor: "Dominican street burger with the works." },
  
  // FILIPINO (10)
  { slug: "filipino-adobo", title: "Chicken Adobo", cuisine: "filipino", category: "main", difficulty: "easy" as const, time: 60, keyIngredients: ["chicken", "soy sauce", "vinegar", "garlic", "bay leaves"], flavor: "Tangy, savory braised chicken - national dish." },
  { slug: "filipino-sinigang", title: "Sinigang", cuisine: "filipino", category: "soup", difficulty: "medium" as const, time: 90, keyIngredients: ["pork", "tamarind", "vegetables", "tomatoes", "kangkong"], flavor: "Sour soup - beloved comfort food." },
  { slug: "filipino-lumpia", title: "Lumpia Shanghai", cuisine: "filipino", category: "appetizer", difficulty: "medium" as const, time: 75, keyIngredients: ["ground pork", "carrots", "wrapper", "garlic"], flavor: "Crispy spring rolls - party essential." },
  { slug: "filipino-pancit", title: "Pancit Canton", cuisine: "filipino", category: "main", difficulty: "easy" as const, time: 45, keyIngredients: ["canton noodles", "vegetables", "pork", "soy sauce"], flavor: "Stir-fried noodles - birthday tradition." },
  { slug: "filipino-sisig", title: "Sisig", cuisine: "filipino", category: "main", difficulty: "medium" as const, time: 90, keyIngredients: ["pork face", "onions", "chili", "calamansi", "egg"], flavor: "Sizzling chopped pork - bar food perfection." },
  { slug: "filipino-lechon-kawali", title: "Lechon Kawali", cuisine: "filipino", category: "main", difficulty: "medium" as const, time: 120, keyIngredients: ["pork belly", "salt", "bay leaves", "peppercorns"], flavor: "Crispy deep-fried pork belly - crunch heaven." },
  { slug: "filipino-kare-kare", title: "Kare Kare", cuisine: "filipino", category: "main", difficulty: "medium" as const, time: 180, keyIngredients: ["oxtail", "peanut butter", "vegetables", "bagoong"], flavor: "Peanut-based stew with oxtail - special occasion dish." },
  { slug: "filipino-halo-halo", title: "Halo Halo", cuisine: "filipino", category: "dessert", difficulty: "easy" as const, time: 30, keyIngredients: ["shaved ice", "evaporated milk", "various toppings", "ube"], flavor: "Mixed shaved ice dessert - summer essential." },

  // ═══════════════════════════════════════════════════════════════════════════════
  // BATCH 2: EXPANDED RECIPES (371 more to reach 500+)
  // ═══════════════════════════════════════════════════════════════════════════════

  // JAMAICAN EXPANDED (10 more = 20 total)
  { slug: "jamaican-mannish-water", title: "Mannish Water", cuisine: "jamaican", category: "soup", difficulty: "hard" as const, time: 180, keyIngredients: ["goat head", "goat tripe", "green bananas", "scotch bonnet", "thyme"], flavor: "Traditional goat soup - believed to be an aphrodisiac." },
  { slug: "jamaican-run-down", title: "Run Down", cuisine: "jamaican", category: "main", difficulty: "medium" as const, time: 60, keyIngredients: ["mackerel", "coconut milk", "tomatoes", "scotch bonnet", "thyme"], flavor: "Fish simmered in seasoned coconut milk until it 'runs down'." },
  { slug: "jamaican-fried-dumplings", title: "Jamaican Fried Dumplings", cuisine: "jamaican", category: "side", difficulty: "easy" as const, time: 25, keyIngredients: ["flour", "baking powder", "butter", "salt", "water"], flavor: "Golden, crispy fried dough - breakfast staple." },
  { slug: "jamaican-callaloo", title: "Jamaican Callaloo", cuisine: "jamaican", category: "side", difficulty: "easy" as const, time: 30, keyIngredients: ["callaloo leaves", "onion", "garlic", "scotch bonnet", "butter"], flavor: "Sautéed leafy greens - healthy and delicious." },
  { slug: "jamaican-stew-peas", title: "Stew Peas", cuisine: "jamaican", category: "main", difficulty: "medium" as const, time: 150, keyIngredients: ["red kidney beans", "pig tail", "coconut milk", "spinners", "thyme"], flavor: "Hearty bean stew with salted meat and dumplings." },
  { slug: "jamaican-ackee-fritters", title: "Ackee Fritters", cuisine: "jamaican", category: "appetizer", difficulty: "medium" as const, time: 40, keyIngredients: ["ackee", "flour", "scotch bonnet", "scallions", "thyme"], flavor: "Crispy fried ackee bites - creative appetizer." },
  { slug: "jamaican-sorrel-drink", title: "Jamaican Sorrel", cuisine: "jamaican", category: "beverage", difficulty: "easy" as const, time: 1440, keyIngredients: ["sorrel sepals", "ginger", "cloves", "sugar", "rum optional"], flavor: "Festive red drink - Christmas tradition." },
  { slug: "jamaican-bammy", title: "Bammy", cuisine: "jamaican", category: "side", difficulty: "medium" as const, time: 45, keyIngredients: ["cassava", "salt", "coconut milk"], flavor: "Traditional cassava flatbread - Taino heritage." },
  { slug: "jamaican-solomon-gundy", title: "Solomon Gundy", cuisine: "jamaican", category: "appetizer", difficulty: "medium" as const, time: 30, keyIngredients: ["smoked herring", "scotch bonnet", "onion", "vinegar"], flavor: "Spicy smoked herring paste - strong and savory." },
  { slug: "jamaican-duckunoo", title: "Blue Drawers (Duckunoo)", cuisine: "jamaican", category: "dessert", difficulty: "medium" as const, time: 120, keyIngredients: ["cornmeal", "coconut", "brown sugar", "banana leaves", "spices"], flavor: "Sweet cornmeal pudding steamed in banana leaves." },

  // HAITIAN EXPANDED (10 more = 20 total)
  { slug: "haitian-mayi-moulen", title: "Mayi Moulen", cuisine: "haitian", category: "side", difficulty: "easy" as const, time: 35, keyIngredients: ["cornmeal", "kidney beans", "coconut milk", "epis"], flavor: "Creamy cornmeal with beans - comfort food classic." },
  { slug: "haitian-lambi", title: "Lambi Creole", cuisine: "haitian", category: "main", difficulty: "hard" as const, time: 180, keyIngredients: ["conch", "tomatoes", "scotch bonnet", "epis", "lime"], flavor: "Tender conch in spicy Creole sauce - delicacy." },
  { slug: "haitian-diri-ak-pwa", title: "Diri ak Pwa", cuisine: "haitian", category: "side", difficulty: "easy" as const, time: 50, keyIngredients: ["rice", "kidney beans", "coconut milk", "epis", "thyme"], flavor: "Everyday rice and beans - Haitian staple." },
  { slug: "haitian-bouillon", title: "Bouillon", cuisine: "haitian", category: "soup", difficulty: "medium" as const, time: 120, keyIngredients: ["beef", "yam", "plantain", "cabbage", "watercress"], flavor: "Hearty vegetable soup - Saturday tradition." },
  { slug: "haitian-pate-kode", title: "Pate Kode", cuisine: "haitian", category: "snack", difficulty: "medium" as const, time: 60, keyIngredients: ["flour", "herring or beef", "scotch bonnet", "epis"], flavor: "Savory fried pastries - street food favorite." },
  { slug: "haitian-pwason-gros-sel", title: "Pwason Gros Sel", cuisine: "haitian", category: "main", difficulty: "easy" as const, time: 40, keyIngredients: ["whole fish", "coarse salt", "lime", "scotch bonnet", "epis"], flavor: "Salt-crusted fried fish - crispy perfection." },
  { slug: "haitian-marinad", title: "Marinad", cuisine: "haitian", category: "appetizer", difficulty: "easy" as const, time: 35, keyIngredients: ["flour", "herring", "scotch bonnet", "scallions", "baking powder"], flavor: "Spicy fritters - addictive snack." },
  { slug: "haitian-pain-patate", title: "Pain Patate", cuisine: "haitian", category: "dessert", difficulty: "medium" as const, time: 120, keyIngredients: ["sweet potato", "coconut", "evaporated milk", "spices", "banana"], flavor: "Sweet potato pudding - holiday dessert." },
  { slug: "haitian-kremas", title: "Kremas", cuisine: "haitian", category: "beverage", difficulty: "easy" as const, time: 30, keyIngredients: ["coconut cream", "condensed milk", "rum", "nutmeg", "vanilla"], flavor: "Creamy rum drink - celebration essential." },
  { slug: "haitian-tchaka", title: "Tchaka", cuisine: "haitian", category: "main", difficulty: "hard" as const, time: 240, keyIngredients: ["corn", "beans", "pork", "squash", "coconut"], flavor: "Ancient harvest stew - ceremonial dish." },

  // NIGERIAN EXPANDED (10 more = 20 total)
  { slug: "nigerian-ogbono-soup", title: "Ogbono Soup", cuisine: "nigerian", category: "soup", difficulty: "medium" as const, time: 60, keyIngredients: ["ogbono seeds", "palm oil", "assorted meat", "stockfish", "spinach"], flavor: "Draw soup with unique slimy texture." },
  { slug: "nigerian-edikang-ikong", title: "Edikang Ikong", cuisine: "nigerian", category: "soup", difficulty: "hard" as const, time: 90, keyIngredients: ["pumpkin leaves", "waterleaf", "assorted meat", "periwinkle", "palm oil"], flavor: "Premium vegetable soup - Cross River delicacy." },
  { slug: "nigerian-banga-soup", title: "Banga Soup", cuisine: "nigerian", category: "soup", difficulty: "medium" as const, time: 120, keyIngredients: ["palm fruit extract", "catfish", "beef", "banga spice", "scent leaves"], flavor: "Palm fruit soup - Delta state specialty." },
  { slug: "nigerian-tuwo-shinkafa", title: "Tuwo Shinkafa", cuisine: "nigerian", category: "side", difficulty: "easy" as const, time: 40, keyIngredients: ["rice", "water"], flavor: "Soft rice swallow - Northern Nigerian staple." },
  { slug: "nigerian-masa", title: "Masa (Waina)", cuisine: "nigerian", category: "breakfast", difficulty: "medium" as const, time: 180, keyIngredients: ["rice", "yeast", "sugar", "salt"], flavor: "Fermented rice cakes - Northern snack." },
  { slug: "nigerian-kilishi", title: "Kilishi", cuisine: "nigerian", category: "snack", difficulty: "hard" as const, time: 1440, keyIngredients: ["beef", "groundnut paste", "spices", "ginger", "onion"], flavor: "Nigerian beef jerky - intensely flavored." },
  { slug: "nigerian-gbegiri", title: "Gbegiri", cuisine: "nigerian", category: "soup", difficulty: "medium" as const, time: 90, keyIngredients: ["beans", "palm oil", "locust beans", "crayfish", "peppers"], flavor: "Smooth bean soup - pairs with ewedu." },
  { slug: "nigerian-ewedu", title: "Ewedu Soup", cuisine: "nigerian", category: "soup", difficulty: "easy" as const, time: 30, keyIngredients: ["jute leaves", "locust beans", "crayfish", "salt"], flavor: "Slimy jute leaf soup - Yoruba favorite." },
  { slug: "nigerian-asaro", title: "Asaro (Yam Porridge)", cuisine: "nigerian", category: "main", difficulty: "easy" as const, time: 45, keyIngredients: ["yam", "palm oil", "peppers", "fish", "crayfish"], flavor: "Mashed yam porridge - comfort in a bowl." },
  { slug: "nigerian-dodo", title: "Dodo (Fried Plantain)", cuisine: "nigerian", category: "side", difficulty: "easy" as const, time: 15, keyIngredients: ["ripe plantain", "vegetable oil", "salt"], flavor: "Sweet fried plantains - beloved side dish." },

  // VIETNAMESE EXPANDED (8 more = 20 total)
  { slug: "vietnamese-bun-bo-hue", title: "Bun Bo Hue", cuisine: "vietnamese", category: "soup", difficulty: "hard" as const, time: 360, keyIngredients: ["beef shank", "pork", "lemongrass", "shrimp paste", "chili oil"], flavor: "Spicy beef noodle soup - Hue specialty." },
  { slug: "vietnamese-mi-quang", title: "Mi Quang", cuisine: "vietnamese", category: "main", difficulty: "medium" as const, time: 90, keyIngredients: ["turmeric noodles", "pork", "shrimp", "peanuts", "herbs"], flavor: "Turmeric noodles with little broth - Da Nang pride." },
  { slug: "vietnamese-ca-kho-to", title: "Ca Kho To", cuisine: "vietnamese", category: "main", difficulty: "medium" as const, time: 60, keyIngredients: ["catfish", "caramel sauce", "fish sauce", "pepper", "coconut water"], flavor: "Caramelized fish in clay pot - Southern classic." },
  { slug: "vietnamese-cha-gio", title: "Cha Gio - Fried Spring Rolls", cuisine: "vietnamese", category: "appetizer", difficulty: "medium" as const, time: 60, keyIngredients: ["rice paper", "ground pork", "crab", "taro", "wood ear mushroom"], flavor: "Crispy fried rolls - crunch perfection." },
  { slug: "vietnamese-canh-chua", title: "Canh Chua", cuisine: "vietnamese", category: "soup", difficulty: "easy" as const, time: 40, keyIngredients: ["fish", "tamarind", "pineapple", "tomatoes", "bean sprouts"], flavor: "Sweet and sour soup - refreshing comfort." },
  { slug: "vietnamese-xoi", title: "Xoi - Sticky Rice", cuisine: "vietnamese", category: "breakfast", difficulty: "easy" as const, time: 60, keyIngredients: ["sticky rice", "mung beans", "fried shallots", "pork floss"], flavor: "Savory sticky rice - breakfast staple." },
  { slug: "vietnamese-che", title: "Che - Sweet Soup", cuisine: "vietnamese", category: "dessert", difficulty: "easy" as const, time: 45, keyIngredients: ["beans", "coconut milk", "tapioca", "fruit", "sugar"], flavor: "Sweet dessert soup - endless varieties." },
  { slug: "vietnamese-nem-nuong", title: "Nem Nuong", cuisine: "vietnamese", category: "main", difficulty: "medium" as const, time: 45, keyIngredients: ["ground pork", "garlic", "fish sauce", "sugar", "rice paper"], flavor: "Grilled pork sausage - wrap and enjoy." },

  // INDIAN EXPANDED (8 more = 20 total)
  { slug: "indian-lamb-rogan-josh", title: "Lamb Rogan Josh", cuisine: "indian", category: "main", difficulty: "medium" as const, time: 120, keyIngredients: ["lamb", "yogurt", "Kashmiri chili", "ginger", "fennel"], flavor: "Aromatic Kashmiri lamb curry - deep red color." },
  { slug: "indian-chole-bhature", title: "Chole Bhature", cuisine: "indian", category: "main", difficulty: "medium" as const, time: 180, keyIngredients: ["chickpeas", "flour", "yogurt", "spices", "onion"], flavor: "Spiced chickpeas with fried bread - Punjabi favorite." },
  { slug: "indian-dosa", title: "Masala Dosa", cuisine: "indian", category: "breakfast", difficulty: "medium" as const, time: 1440, keyIngredients: ["rice", "urad dal", "potatoes", "mustard seeds", "curry leaves"], flavor: "Crispy crepe with potato filling - South Indian star." },
  { slug: "indian-idli-sambar", title: "Idli Sambar", cuisine: "indian", category: "breakfast", difficulty: "medium" as const, time: 480, keyIngredients: ["rice", "urad dal", "lentils", "vegetables", "tamarind"], flavor: "Steamed rice cakes with lentil soup - healthy breakfast." },
  { slug: "indian-korma", title: "Chicken Korma", cuisine: "indian", category: "main", difficulty: "medium" as const, time: 60, keyIngredients: ["chicken", "yogurt", "cream", "cashews", "cardamom"], flavor: "Mild, creamy, nutty curry - Mughlai elegance." },
  { slug: "indian-vindaloo", title: "Pork Vindaloo", cuisine: "indian", category: "main", difficulty: "medium" as const, time: 120, keyIngredients: ["pork", "vinegar", "Kashmiri chili", "garlic", "ginger"], flavor: "Fiery Goan curry - Portuguese influence." },
  { slug: "indian-aloo-gobi", title: "Aloo Gobi", cuisine: "indian", category: "main", difficulty: "easy" as const, time: 40, keyIngredients: ["potatoes", "cauliflower", "turmeric", "cumin", "ginger"], flavor: "Simple potato-cauliflower curry - everyday classic." },
  { slug: "indian-raita", title: "Cucumber Raita", cuisine: "indian", category: "side", difficulty: "easy" as const, time: 10, keyIngredients: ["yogurt", "cucumber", "cumin", "mint", "salt"], flavor: "Cool yogurt side - balances spicy dishes." },

  // MEXICAN EXPANDED (10 more = 20 total)
  { slug: "mexican-tacos-al-pastor", title: "Tacos al Pastor", cuisine: "mexican", category: "main", difficulty: "hard" as const, time: 300, keyIngredients: ["pork", "achiote", "pineapple", "dried chiles", "corn tortillas"], flavor: "Spit-roasted pork tacos - Lebanese-Mexican fusion." },
  { slug: "mexican-mole-poblano", title: "Mole Poblano", cuisine: "mexican", category: "main", difficulty: "hard" as const, time: 240, keyIngredients: ["dried chiles", "chocolate", "chicken", "sesame", "spices"], flavor: "Complex sauce with 20+ ingredients - Mexican treasure." },
  { slug: "mexican-pozole-rojo", title: "Pozole Rojo", cuisine: "mexican", category: "soup", difficulty: "medium" as const, time: 180, keyIngredients: ["hominy", "pork", "guajillo chiles", "oregano", "cabbage"], flavor: "Hearty hominy soup - celebration essential." },
  { slug: "mexican-carnitas", title: "Carnitas", cuisine: "mexican", category: "main", difficulty: "medium" as const, time: 240, keyIngredients: ["pork shoulder", "lard", "orange", "cinnamon", "bay leaves"], flavor: "Crispy braised pork - Michoacán specialty." },
  { slug: "mexican-tamales", title: "Tamales", cuisine: "mexican", category: "main", difficulty: "hard" as const, time: 300, keyIngredients: ["masa", "corn husks", "pork", "chiles", "lard"], flavor: "Steamed corn dough parcels - holiday tradition." },
  { slug: "mexican-enchiladas-verdes", title: "Enchiladas Verdes", cuisine: "mexican", category: "main", difficulty: "medium" as const, time: 60, keyIngredients: ["corn tortillas", "tomatillos", "chicken", "crema", "cheese"], flavor: "Tangy green sauce enchiladas - fresh and bright." },
  { slug: "mexican-chiles-rellenos", title: "Chiles Rellenos", cuisine: "mexican", category: "main", difficulty: "medium" as const, time: 90, keyIngredients: ["poblano peppers", "cheese", "eggs", "tomato sauce"], flavor: "Stuffed peppers in egg batter - classic comfort." },
  { slug: "mexican-sopes", title: "Sopes", cuisine: "mexican", category: "appetizer", difficulty: "easy" as const, time: 45, keyIngredients: ["masa", "beans", "meat", "salsa", "queso fresco"], flavor: "Thick corn cakes with toppings - street food star." },
  { slug: "mexican-birria", title: "Birria", cuisine: "mexican", category: "main", difficulty: "hard" as const, time: 300, keyIngredients: ["goat or beef", "dried chiles", "vinegar", "spices", "consomme"], flavor: "Braised meat in red chile broth - trending sensation." },
  { slug: "mexican-elote", title: "Elote", cuisine: "mexican", category: "side", difficulty: "easy" as const, time: 20, keyIngredients: ["corn", "mayo", "cotija", "chili powder", "lime"], flavor: "Mexican street corn - creamy, tangy, spicy." },

  // THAI EXPANDED (11 more = 20 total)
  { slug: "thai-green-curry", title: "Green Curry", cuisine: "thai", category: "main", difficulty: "medium" as const, time: 45, keyIngredients: ["green curry paste", "coconut milk", "chicken", "Thai eggplant", "basil"], flavor: "Aromatic, creamy, spicy curry - Thai essential." },
  { slug: "thai-massaman-curry", title: "Massaman Curry", cuisine: "thai", category: "main", difficulty: "medium" as const, time: 120, keyIngredients: ["massaman paste", "beef", "potatoes", "peanuts", "coconut milk"], flavor: "Rich, mild curry with Persian influence." },
  { slug: "thai-tom-yum", title: "Tom Yum Goong", cuisine: "thai", category: "soup", difficulty: "medium" as const, time: 30, keyIngredients: ["shrimp", "lemongrass", "galangal", "lime leaves", "chili"], flavor: "Hot and sour shrimp soup - iconic Thai flavor." },
  { slug: "thai-som-tam", title: "Som Tam", cuisine: "thai", category: "salad", difficulty: "easy" as const, time: 20, keyIngredients: ["green papaya", "tomatoes", "peanuts", "dried shrimp", "lime"], flavor: "Spicy green papaya salad - Isaan classic." },
  { slug: "thai-khao-pad", title: "Khao Pad", cuisine: "thai", category: "main", difficulty: "easy" as const, time: 20, keyIngredients: ["jasmine rice", "egg", "vegetables", "soy sauce", "lime"], flavor: "Thai fried rice - simple perfection." },
  { slug: "thai-larb", title: "Larb", cuisine: "thai", category: "salad", difficulty: "easy" as const, time: 25, keyIngredients: ["ground meat", "lime", "fish sauce", "mint", "toasted rice"], flavor: "Spicy meat salad - Isaan national dish." },
  { slug: "thai-satay", title: "Chicken Satay", cuisine: "thai", category: "appetizer", difficulty: "medium" as const, time: 120, keyIngredients: ["chicken", "coconut milk", "turmeric", "peanut sauce", "cucumber relish"], flavor: "Grilled skewers with peanut sauce - crowd pleaser." },
  { slug: "thai-gaeng-keow-wan-gai", title: "Sweet Green Curry Chicken", cuisine: "thai", category: "main", difficulty: "medium" as const, time: 40, keyIngredients: ["chicken", "green curry paste", "coconut cream", "pea eggplant", "Thai basil"], flavor: "Classic Thai green curry - restaurant favorite." },
  { slug: "thai-mango-sticky-rice", title: "Mango Sticky Rice", cuisine: "thai", category: "dessert", difficulty: "easy" as const, time: 60, keyIngredients: ["sticky rice", "coconut milk", "mango", "sugar", "sesame"], flavor: "Sweet rice with fresh mango - heavenly dessert." },
  { slug: "thai-tom-kha-gai", title: "Tom Kha Gai", cuisine: "thai", category: "soup", difficulty: "medium" as const, time: 35, keyIngredients: ["chicken", "coconut milk", "galangal", "lemongrass", "mushrooms"], flavor: "Creamy coconut chicken soup - mild and aromatic." },
  { slug: "thai-pad-see-ew", title: "Pad See Ew", cuisine: "thai", category: "main", difficulty: "easy" as const, time: 20, keyIngredients: ["wide rice noodles", "Chinese broccoli", "egg", "soy sauce", "pork"], flavor: "Sweet soy stir-fried noodles - comfort food." },

  // KOREAN EXPANDED (12 more = 20 total)
  { slug: "korean-bibimbap", title: "Bibimbap", cuisine: "korean", category: "main", difficulty: "medium" as const, time: 60, keyIngredients: ["rice", "vegetables", "beef", "gochujang", "egg"], flavor: "Mixed rice bowl - colorful and nutritious." },
  { slug: "korean-bulgogi", title: "Bulgogi", cuisine: "korean", category: "main", difficulty: "medium" as const, time: 135, keyIngredients: ["beef", "soy sauce", "pear", "sesame oil", "garlic"], flavor: "Sweet marinated grilled beef - BBQ essential." },
  { slug: "korean-kimchi-jjigae", title: "Kimchi Jjigae", cuisine: "korean", category: "soup", difficulty: "easy" as const, time: 40, keyIngredients: ["aged kimchi", "pork", "tofu", "gochugaru", "scallions"], flavor: "Spicy kimchi stew - ultimate comfort food." },
  { slug: "korean-japchae", title: "Japchae", cuisine: "korean", category: "main", difficulty: "medium" as const, time: 45, keyIngredients: ["sweet potato noodles", "vegetables", "beef", "soy sauce", "sesame"], flavor: "Stir-fried glass noodles - celebration dish." },
  { slug: "korean-samgyeopsal", title: "Samgyeopsal", cuisine: "korean", category: "main", difficulty: "easy" as const, time: 30, keyIngredients: ["pork belly", "lettuce", "ssamjang", "garlic", "kimchi"], flavor: "Grilled pork belly wraps - social dining." },
  { slug: "korean-tteokbokki", title: "Tteokbokki", cuisine: "korean", category: "snack", difficulty: "easy" as const, time: 25, keyIngredients: ["rice cakes", "gochujang", "fish cakes", "scallions", "sugar"], flavor: "Spicy rice cakes - beloved street food." },
  { slug: "korean-sundubu-jjigae", title: "Sundubu Jjigae", cuisine: "korean", category: "soup", difficulty: "easy" as const, time: 30, keyIngredients: ["soft tofu", "seafood", "gochugaru", "egg", "scallions"], flavor: "Silky tofu stew - spicy and comforting." },
  { slug: "korean-dakgalbi", title: "Dakgalbi", cuisine: "korean", category: "main", difficulty: "medium" as const, time: 45, keyIngredients: ["chicken", "gochujang", "cabbage", "sweet potato", "rice cakes"], flavor: "Spicy stir-fried chicken - Chuncheon specialty." },
  { slug: "korean-pajeon", title: "Pajeon", cuisine: "korean", category: "appetizer", difficulty: "easy" as const, time: 25, keyIngredients: ["scallions", "flour", "egg", "seafood", "soy dipping sauce"], flavor: "Savory scallion pancake - rainy day tradition." },
  { slug: "korean-gimbap", title: "Gimbap", cuisine: "korean", category: "main", difficulty: "medium" as const, time: 45, keyIngredients: ["rice", "seaweed", "vegetables", "egg", "sesame oil"], flavor: "Korean rice rolls - perfect picnic food." },
  { slug: "korean-galbi", title: "Galbi", cuisine: "korean", category: "main", difficulty: "medium" as const, time: 180, keyIngredients: ["beef short ribs", "soy sauce", "pear", "garlic", "sesame"], flavor: "Marinated grilled short ribs - BBQ king." },
  { slug: "korean-bossam", title: "Bossam", cuisine: "korean", category: "main", difficulty: "medium" as const, time: 180, keyIngredients: ["pork belly", "soybean paste", "radish", "kimchi", "lettuce"], flavor: "Boiled pork belly wraps - party centerpiece." },

  // CHINESE EXPANDED (13 more = 20 total)
  { slug: "chinese-kung-pao-chicken", title: "Kung Pao Chicken", cuisine: "chinese", category: "main", difficulty: "medium" as const, time: 30, keyIngredients: ["chicken", "peanuts", "dried chiles", "Sichuan peppercorn", "scallions"], flavor: "Spicy, numbing Sichuan classic - perfectly balanced." },
  { slug: "chinese-mapo-tofu", title: "Mapo Tofu", cuisine: "chinese", category: "main", difficulty: "easy" as const, time: 25, keyIngredients: ["tofu", "ground pork", "doubanjiang", "Sichuan peppercorn", "scallions"], flavor: "Numbing spicy tofu - Sichuan legend." },
  { slug: "chinese-char-siu", title: "Char Siu", cuisine: "chinese", category: "main", difficulty: "medium" as const, time: 180, keyIngredients: ["pork", "honey", "hoisin", "five spice", "red food coloring"], flavor: "Cantonese BBQ pork - sweet and savory." },
  { slug: "chinese-dim-sum-har-gow", title: "Har Gow", cuisine: "chinese", category: "appetizer", difficulty: "hard" as const, time: 90, keyIngredients: ["shrimp", "wheat starch", "bamboo shoots", "sesame oil"], flavor: "Crystal shrimp dumplings - dim sum royalty." },
  { slug: "chinese-dim-sum-siu-mai", title: "Siu Mai", cuisine: "chinese", category: "appetizer", difficulty: "medium" as const, time: 60, keyIngredients: ["pork", "shrimp", "wonton wrapper", "mushrooms"], flavor: "Open-top pork dumplings - dim sum classic." },
  { slug: "chinese-general-tso", title: "General Tso's Chicken", cuisine: "chinese", category: "main", difficulty: "medium" as const, time: 45, keyIngredients: ["chicken", "dried chiles", "soy sauce", "vinegar", "sugar"], flavor: "Sweet, tangy, crispy - American-Chinese icon." },
  { slug: "chinese-dan-dan-noodles", title: "Dan Dan Noodles", cuisine: "chinese", category: "main", difficulty: "medium" as const, time: 35, keyIngredients: ["noodles", "ground pork", "sesame paste", "chili oil", "Sichuan peppercorn"], flavor: "Spicy, nutty noodles - Sichuan street food." },
  { slug: "chinese-hot-pot", title: "Chinese Hot Pot", cuisine: "chinese", category: "main", difficulty: "medium" as const, time: 120, keyIngredients: ["broth", "thinly sliced meats", "vegetables", "tofu", "dipping sauces"], flavor: "Interactive communal cooking - social dining." },
  { slug: "chinese-peking-duck", title: "Peking Duck", cuisine: "chinese", category: "main", difficulty: "hard" as const, time: 1440, keyIngredients: ["whole duck", "maltose", "hoisin", "scallions", "pancakes"], flavor: "Crispy duck with pancakes - Beijing imperial dish." },
  { slug: "chinese-yangzhou-fried-rice", title: "Yangzhou Fried Rice", cuisine: "chinese", category: "main", difficulty: "easy" as const, time: 20, keyIngredients: ["rice", "eggs", "char siu", "shrimp", "peas"], flavor: "Classic Chinese fried rice - simple excellence." },
  { slug: "chinese-sweet-sour-pork", title: "Sweet and Sour Pork", cuisine: "chinese", category: "main", difficulty: "medium" as const, time: 45, keyIngredients: ["pork", "pineapple", "bell peppers", "vinegar", "ketchup"], flavor: "Tangy, fruity pork - Cantonese favorite." },
  { slug: "chinese-congee", title: "Congee", cuisine: "chinese", category: "breakfast", difficulty: "easy" as const, time: 90, keyIngredients: ["rice", "broth", "ginger", "century egg", "pork floss"], flavor: "Silky rice porridge - comfort for body and soul." },
  { slug: "chinese-scallion-pancakes", title: "Scallion Pancakes", cuisine: "chinese", category: "appetizer", difficulty: "medium" as const, time: 45, keyIngredients: ["flour", "scallions", "oil", "salt"], flavor: "Crispy, flaky, savory - addictive appetizer." },

  // CUBAN EXPANDED (12 more = 20 total)
  { slug: "cuban-ropa-vieja", title: "Ropa Vieja", cuisine: "cuban", category: "main", difficulty: "medium" as const, time: 180, keyIngredients: ["flank steak", "tomatoes", "bell peppers", "onion", "cumin"], flavor: "Shredded beef in tomato sauce - national dish." },
  { slug: "cuban-lechon-asado", title: "Lechon Asado", cuisine: "cuban", category: "main", difficulty: "hard" as const, time: 480, keyIngredients: ["whole pig", "mojo", "sour orange", "garlic", "oregano"], flavor: "Mojo-marinated roast pork - celebration centerpiece." },
  { slug: "cuban-sandwich", title: "Cuban Sandwich", cuisine: "cuban", category: "main", difficulty: "easy" as const, time: 25, keyIngredients: ["Cuban bread", "ham", "roast pork", "Swiss cheese", "pickles"], flavor: "Pressed sandwich perfection - Tampa-Havana fusion." },
  { slug: "cuban-moros-y-cristianos", title: "Moros y Cristianos", cuisine: "cuban", category: "side", difficulty: "easy" as const, time: 60, keyIngredients: ["black beans", "rice", "sofrito", "cumin", "bay leaves"], flavor: "Black beans and rice - everyday staple." },
  { slug: "cuban-picadillo", title: "Picadillo", cuisine: "cuban", category: "main", difficulty: "easy" as const, time: 45, keyIngredients: ["ground beef", "tomatoes", "olives", "raisins", "cumin"], flavor: "Sweet-savory ground beef - comfort classic." },
  { slug: "cuban-vaca-frita", title: "Vaca Frita", cuisine: "cuban", category: "main", difficulty: "medium" as const, time: 180, keyIngredients: ["flank steak", "lime", "garlic", "onion", "oil"], flavor: "Crispy fried beef with onions - addictive texture." },
  { slug: "cuban-tostones", title: "Tostones", cuisine: "cuban", category: "side", difficulty: "easy" as const, time: 20, keyIngredients: ["green plantains", "oil", "salt", "garlic mojo"], flavor: "Twice-fried plantains - crunchy perfection." },
  { slug: "cuban-arroz-con-pollo", title: "Arroz con Pollo", cuisine: "cuban", category: "main", difficulty: "medium" as const, time: 75, keyIngredients: ["chicken", "rice", "beer", "saffron", "peas"], flavor: "One-pot chicken and rice - family favorite." },
  { slug: "cuban-yuca-con-mojo", title: "Yuca con Mojo", cuisine: "cuban", category: "side", difficulty: "easy" as const, time: 35, keyIngredients: ["yuca", "garlic", "sour orange", "olive oil", "onion"], flavor: "Boiled cassava with garlic sauce - simple delicious." },
  { slug: "cuban-flan", title: "Cuban Flan", cuisine: "cuban", category: "dessert", difficulty: "medium" as const, time: 90, keyIngredients: ["eggs", "condensed milk", "evaporated milk", "vanilla", "caramel"], flavor: "Creamy caramel custard - silky sweet ending." },
  { slug: "cuban-croquetas", title: "Croquetas de Jamon", cuisine: "cuban", category: "appetizer", difficulty: "medium" as const, time: 180, keyIngredients: ["ham", "bechamel", "breadcrumbs", "eggs", "flour"], flavor: "Crispy ham croquettes - café staple." },
  { slug: "cuban-cafe-cubano", title: "Café Cubano", cuisine: "cuban", category: "beverage", difficulty: "easy" as const, time: 10, keyIngredients: ["espresso", "sugar", "water"], flavor: "Sweet, strong espresso - Cuban fuel." },

  // ETHIOPIAN EXPANDED (14 more = 20 total)
  { slug: "ethiopian-doro-wat", title: "Doro Wat", cuisine: "ethiopian", category: "main", difficulty: "hard" as const, time: 180, keyIngredients: ["chicken", "berbere", "onions", "niter kibbeh", "eggs"], flavor: "Spicy chicken stew - Ethiopia's national dish." },
  { slug: "ethiopian-kitfo", title: "Kitfo", cuisine: "ethiopian", category: "main", difficulty: "easy" as const, time: 20, keyIngredients: ["beef", "mitmita", "niter kibbeh", "kocho", "ayib"], flavor: "Ethiopian beef tartare - spiced and rich." },
  { slug: "ethiopian-injera", title: "Injera", cuisine: "ethiopian", category: "bread", difficulty: "medium" as const, time: 4320, keyIngredients: ["teff flour", "water", "starter"], flavor: "Spongy sourdough flatbread - edible plate." },
  { slug: "ethiopian-tibs", title: "Tibs", cuisine: "ethiopian", category: "main", difficulty: "easy" as const, time: 30, keyIngredients: ["beef or lamb", "onions", "tomatoes", "rosemary", "berbere"], flavor: "Sautéed meat with vegetables - everyday favorite." },
  { slug: "ethiopian-shiro", title: "Shiro", cuisine: "ethiopian", category: "main", difficulty: "easy" as const, time: 45, keyIngredients: ["chickpea flour", "berbere", "onions", "garlic", "oil"], flavor: "Smooth chickpea stew - vegan comfort food." },
  { slug: "ethiopian-gomen", title: "Gomen", cuisine: "ethiopian", category: "side", difficulty: "easy" as const, time: 30, keyIngredients: ["collard greens", "garlic", "ginger", "onion", "oil"], flavor: "Sautéed collard greens - healthy side." },
  { slug: "ethiopian-misir-wat", title: "Misir Wat", cuisine: "ethiopian", category: "main", difficulty: "easy" as const, time: 60, keyIngredients: ["red lentils", "berbere", "onions", "garlic", "niter kibbeh"], flavor: "Spicy red lentil stew - protein-rich vegan." },
  { slug: "ethiopian-ayib", title: "Ayib", cuisine: "ethiopian", category: "side", difficulty: "easy" as const, time: 30, keyIngredients: ["buttermilk", "salt"], flavor: "Fresh Ethiopian cheese - mild and creamy." },
  { slug: "ethiopian-key-sir", title: "Key Sir", cuisine: "ethiopian", category: "side", difficulty: "easy" as const, time: 20, keyIngredients: ["beets", "potatoes", "carrots", "jalapeño", "oil"], flavor: "Beet and potato salad - colorful side." },
  { slug: "ethiopian-sambusa", title: "Sambusa", cuisine: "ethiopian", category: "appetizer", difficulty: "medium" as const, time: 60, keyIngredients: ["pastry", "lentils or meat", "onion", "berbere", "oil"], flavor: "Ethiopian samosas - spiced and crispy." },
  { slug: "ethiopian-firfir", title: "Firfir", cuisine: "ethiopian", category: "breakfast", difficulty: "easy" as const, time: 25, keyIngredients: ["injera pieces", "berbere", "niter kibbeh", "onion"], flavor: "Shredded injera in spiced butter - breakfast dish." },
  { slug: "ethiopian-alicha", title: "Alicha", cuisine: "ethiopian", category: "main", difficulty: "easy" as const, time: 45, keyIngredients: ["vegetables or meat", "turmeric", "ginger", "garlic", "oil"], flavor: "Mild, non-spicy stew - gentle flavors." },
  { slug: "ethiopian-tej", title: "Tej", cuisine: "ethiopian", category: "beverage", difficulty: "medium" as const, time: 10080, keyIngredients: ["honey", "gesho", "water"], flavor: "Honey wine - traditional celebration drink." },
  { slug: "ethiopian-coffee-ceremony", title: "Ethiopian Coffee", cuisine: "ethiopian", category: "beverage", difficulty: "medium" as const, time: 60, keyIngredients: ["green coffee beans", "frankincense", "popcorn"], flavor: "Traditional coffee ceremony - cultural experience." },

  // TRINIDADIAN EXPANDED (14 more = 20 total)
  { slug: "trinidadian-doubles", title: "Doubles", cuisine: "trinidadian", category: "breakfast", difficulty: "medium" as const, time: 180, keyIngredients: ["bara", "channa", "pepper sauce", "cucumber chutney", "tamarind"], flavor: "Curried chickpeas in fried bread - street food king." },
  { slug: "trinidadian-roti", title: "Chicken Roti", cuisine: "trinidadian", category: "main", difficulty: "medium" as const, time: 120, keyIngredients: ["roti skin", "chicken", "curry", "potatoes", "pepper"], flavor: "Curry wrapped in flatbread - lunch essential." },
  { slug: "trinidadian-pelau", title: "Pelau", cuisine: "trinidadian", category: "main", difficulty: "medium" as const, time: 90, keyIngredients: ["chicken", "rice", "pigeon peas", "coconut milk", "browning"], flavor: "One-pot rice and chicken - comfort classic." },
  { slug: "trinidadian-callaloo", title: "Callaloo", cuisine: "trinidadian", category: "soup", difficulty: "medium" as const, time: 90, keyIngredients: ["dasheen leaves", "okra", "coconut milk", "crab", "pepper"], flavor: "Creamy green soup - Sunday lunch staple." },
  { slug: "trinidadian-curry-duck", title: "Curry Duck", cuisine: "trinidadian", category: "main", difficulty: "medium" as const, time: 120, keyIngredients: ["duck", "curry powder", "potatoes", "chadon beni", "pepper"], flavor: "Flavorful curried duck - celebration dish." },
  { slug: "trinidadian-bake-and-shark", title: "Bake and Shark", cuisine: "trinidadian", category: "main", difficulty: "medium" as const, time: 60, keyIngredients: ["shark", "fried bake", "chadon beni", "garlic sauce", "tamarind"], flavor: "Fried shark in bread - beach food legend." },
  { slug: "trinidadian-pholourie", title: "Pholourie", cuisine: "trinidadian", category: "appetizer", difficulty: "easy" as const, time: 45, keyIngredients: ["split pea flour", "turmeric", "cumin", "pepper"], flavor: "Spiced fried dough balls - party snack." },
  { slug: "trinidadian-corn-soup", title: "Corn Soup", cuisine: "trinidadian", category: "soup", difficulty: "medium" as const, time: 120, keyIngredients: ["corn", "split peas", "dumplings", "pig tail", "pepper"], flavor: "Hearty street soup - late night favorite." },
  { slug: "trinidadian-stew-chicken", title: "Stew Chicken", cuisine: "trinidadian", category: "main", difficulty: "medium" as const, time: 75, keyIngredients: ["chicken", "browning", "sugar", "thyme", "pepper"], flavor: "Caramelized braised chicken - Sunday classic." },
  { slug: "trinidadian-geera-pork", title: "Geera Pork", cuisine: "trinidadian", category: "main", difficulty: "easy" as const, time: 45, keyIngredients: ["pork", "cumin", "garlic", "pepper", "chadon beni"], flavor: "Cumin-spiced pork - Indian-Caribbean fusion." },
  { slug: "trinidadian-pastelles", title: "Pastelles", cuisine: "trinidadian", category: "main", difficulty: "hard" as const, time: 300, keyIngredients: ["cornmeal", "meat filling", "olives", "capers", "banana leaves"], flavor: "Christmas tamales - holiday tradition." },
  { slug: "trinidadian-black-cake", title: "Black Cake", cuisine: "trinidadian", category: "dessert", difficulty: "hard" as const, time: 8640, keyIngredients: ["dried fruits", "rum", "browning", "spices", "cherries"], flavor: "Dark rum fruitcake - Christmas essential." },
  { slug: "trinidadian-kurma", title: "Kurma", cuisine: "trinidadian", category: "dessert", difficulty: "medium" as const, time: 90, keyIngredients: ["flour", "sugar", "coconut", "cardamom", "ghee"], flavor: "Spiced fried dough in sugar syrup - sweet snack." },
  { slug: "trinidadian-sorrel", title: "Sorrel Drink", cuisine: "trinidadian", category: "beverage", difficulty: "easy" as const, time: 1440, keyIngredients: ["sorrel", "ginger", "cloves", "sugar", "rum optional"], flavor: "Festive hibiscus drink - Christmas tradition." },

  // PUERTO RICAN EXPANDED (14 more = 20 total)
  { slug: "puerto-rican-mofongo", title: "Mofongo", cuisine: "puerto_rican", category: "main", difficulty: "medium" as const, time: 45, keyIngredients: ["green plantains", "chicharron", "garlic", "olive oil", "broth"], flavor: "Mashed plantains with pork cracklings - iconic dish." },
  { slug: "puerto-rican-pernil", title: "Pernil", cuisine: "puerto_rican", category: "main", difficulty: "hard" as const, time: 720, keyIngredients: ["pork shoulder", "adobo", "sazon", "garlic", "oregano"], flavor: "Slow-roasted pork shoulder - Christmas centerpiece." },
  { slug: "puerto-rican-arroz-con-gandules", title: "Arroz con Gandules", cuisine: "puerto_rican", category: "main", difficulty: "medium" as const, time: 75, keyIngredients: ["rice", "pigeon peas", "sofrito", "sazon", "pork"], flavor: "Rice with pigeon peas - holiday essential." },
  { slug: "puerto-rican-pasteles", title: "Pasteles", cuisine: "puerto_rican", category: "main", difficulty: "hard" as const, time: 480, keyIngredients: ["green bananas", "yautia", "pork", "banana leaves", "achiote"], flavor: "Wrapped plantain masa parcels - labor of love." },
  { slug: "puerto-rican-tostones", title: "Tostones", cuisine: "puerto_rican", category: "side", difficulty: "easy" as const, time: 20, keyIngredients: ["green plantains", "oil", "salt", "garlic sauce"], flavor: "Twice-fried plantain coins - crispy delight." },
  { slug: "puerto-rican-asopao", title: "Asopao de Pollo", cuisine: "puerto_rican", category: "soup", difficulty: "medium" as const, time: 90, keyIngredients: ["chicken", "rice", "sofrito", "olives", "capers"], flavor: "Puerto Rican chicken gumbo - soupy comfort." },
  { slug: "puerto-rican-carne-guisada", title: "Carne Guisada", cuisine: "puerto_rican", category: "main", difficulty: "medium" as const, time: 120, keyIngredients: ["beef", "potatoes", "sofrito", "olives", "tomato sauce"], flavor: "Beef stew - everyday comfort." },
  { slug: "puerto-rican-alcapurrias", title: "Alcapurrias", cuisine: "puerto_rican", category: "appetizer", difficulty: "medium" as const, time: 90, keyIngredients: ["green bananas", "yautia", "beef", "achiote", "sofrito"], flavor: "Fried fritters with meat filling - beach food." },
  { slug: "puerto-rican-bacalaitos", title: "Bacalaitos", cuisine: "puerto_rican", category: "appetizer", difficulty: "easy" as const, time: 45, keyIngredients: ["salt cod", "flour", "baking powder", "garlic"], flavor: "Crispy cod fritters - kiosk favorite." },
  { slug: "puerto-rican-tembleque", title: "Tembleque", cuisine: "puerto_rican", category: "dessert", difficulty: "easy" as const, time: 240, keyIngredients: ["coconut milk", "cornstarch", "sugar", "cinnamon"], flavor: "Coconut pudding - jiggly and sweet." },
  { slug: "puerto-rican-coquito", title: "Coquito", cuisine: "puerto_rican", category: "beverage", difficulty: "easy" as const, time: 20, keyIngredients: ["coconut cream", "condensed milk", "rum", "cinnamon", "vanilla"], flavor: "Coconut eggnog - Christmas must-have." },
  { slug: "puerto-rican-lechon-asado", title: "Lechon Asado", cuisine: "puerto_rican", category: "main", difficulty: "hard" as const, time: 720, keyIngredients: ["whole pig", "adobo", "sazon", "garlic", "oregano"], flavor: "Whole roasted pig - fiesta centerpiece." },
  { slug: "puerto-rican-amarillos", title: "Amarillos", cuisine: "puerto_rican", category: "side", difficulty: "easy" as const, time: 15, keyIngredients: ["ripe plantains", "oil", "salt"], flavor: "Sweet fried ripe plantains - simple perfection." },
  { slug: "puerto-rican-empanadas", title: "Empanadillas", cuisine: "puerto_rican", category: "appetizer", difficulty: "medium" as const, time: 60, keyIngredients: ["dough", "beef", "sofrito", "olives", "achiote"], flavor: "Fried turnovers - party essential." },

  // GHANAIAN EXPANDED (14 more = 20 total)
  { slug: "ghanaian-jollof", title: "Ghanaian Jollof Rice", cuisine: "ghanaian", category: "main", difficulty: "medium" as const, time: 90, keyIngredients: ["rice", "tomatoes", "onion", "scotch bonnet", "spices"], flavor: "Smoky tomato rice - rivalry with Nigeria." },
  { slug: "ghanaian-fufu", title: "Fufu", cuisine: "ghanaian", category: "side", difficulty: "hard" as const, time: 60, keyIngredients: ["cassava", "plantain", "water"], flavor: "Pounded starchy dough - soup companion." },
  { slug: "ghanaian-banku-tilapia", title: "Banku with Tilapia", cuisine: "ghanaian", category: "main", difficulty: "medium" as const, time: 90, keyIngredients: ["corn dough", "cassava dough", "tilapia", "pepper sauce", "tomatoes"], flavor: "Fermented corn dough with grilled fish - coastal favorite." },
  { slug: "ghanaian-kelewele", title: "Kelewele", cuisine: "ghanaian", category: "side", difficulty: "easy" as const, time: 30, keyIngredients: ["ripe plantains", "ginger", "cayenne", "cloves", "oil"], flavor: "Spicy fried plantains - street snack." },
  { slug: "ghanaian-red-red", title: "Red Red", cuisine: "ghanaian", category: "main", difficulty: "easy" as const, time: 60, keyIngredients: ["black-eyed peas", "palm oil", "plantains", "onion", "tomatoes"], flavor: "Bean stew with fried plantains - comfort food." },
  { slug: "ghanaian-groundnut-soup", title: "Groundnut Soup", cuisine: "ghanaian", category: "soup", difficulty: "medium" as const, time: 90, keyIngredients: ["peanut butter", "chicken", "tomatoes", "onion", "ginger"], flavor: "Rich peanut soup - hearty and warming." },
  { slug: "ghanaian-light-soup", title: "Light Soup", cuisine: "ghanaian", category: "soup", difficulty: "easy" as const, time: 60, keyIngredients: ["tomatoes", "onion", "chili", "fish or chicken", "garden eggs"], flavor: "Clear tomato soup - simple and refreshing." },
  { slug: "ghanaian-waakye", title: "Waakye", cuisine: "ghanaian", category: "main", difficulty: "medium" as const, time: 120, keyIngredients: ["rice", "beans", "millet leaves", "spaghetti", "gari"], flavor: "Rice and beans with toppings - breakfast champion." },
  { slug: "ghanaian-kenkey", title: "Kenkey", cuisine: "ghanaian", category: "side", difficulty: "hard" as const, time: 240, keyIngredients: ["corn dough", "corn husks"], flavor: "Fermented corn dough - traditional staple." },
  { slug: "ghanaian-palm-nut-soup", title: "Palm Nut Soup", cuisine: "ghanaian", category: "soup", difficulty: "medium" as const, time: 120, keyIngredients: ["palm fruit extract", "meat", "crabs", "onion", "tomatoes"], flavor: "Rich palm fruit soup - traditional favorite." },
  { slug: "ghanaian-kontomire", title: "Kontomire Stew", cuisine: "ghanaian", category: "main", difficulty: "easy" as const, time: 45, keyIngredients: ["cocoyam leaves", "palm oil", "fish", "onion", "tomatoes"], flavor: "Spinach-like leaf stew - nutritious comfort." },
  { slug: "ghanaian-tatale", title: "Tatale", cuisine: "ghanaian", category: "side", difficulty: "easy" as const, time: 30, keyIngredients: ["overripe plantains", "flour", "onion", "ginger", "pepper"], flavor: "Plantain pancakes - sweet and savory." },
  { slug: "ghanaian-chinchinga", title: "Chinchinga (Kebabs)", cuisine: "ghanaian", category: "appetizer", difficulty: "easy" as const, time: 45, keyIngredients: ["beef", "suya spice", "onion", "tomatoes"], flavor: "Grilled meat skewers - street food favorite." },
  { slug: "ghanaian-sobolo", title: "Sobolo", cuisine: "ghanaian", category: "beverage", difficulty: "easy" as const, time: 120, keyIngredients: ["hibiscus flowers", "ginger", "pineapple", "sugar", "cloves"], flavor: "Hibiscus drink - refreshing and healthy." },

  // DOMINICAN EXPANDED (15 more = 20 total)
  { slug: "dominican-mangu", title: "Mangú", cuisine: "dominican", category: "breakfast", difficulty: "easy" as const, time: 30, keyIngredients: ["green plantains", "butter", "onions", "oil", "vinegar"], flavor: "Mashed plantains with pickled onions - breakfast king." },
  { slug: "dominican-sancocho", title: "Sancocho", cuisine: "dominican", category: "soup", difficulty: "medium" as const, time: 180, keyIngredients: ["various meats", "root vegetables", "corn", "cilantro", "oregano"], flavor: "Seven-meat stew - celebration soup." },
  { slug: "dominican-la-bandera", title: "La Bandera", cuisine: "dominican", category: "main", difficulty: "medium" as const, time: 90, keyIngredients: ["rice", "beans", "meat", "salad", "tostones"], flavor: "Rice, beans, meat - national lunch plate." },
  { slug: "dominican-chicharron", title: "Chicharrón", cuisine: "dominican", category: "appetizer", difficulty: "medium" as const, time: 60, keyIngredients: ["pork belly", "lime", "garlic", "oregano", "oil"], flavor: "Crispy fried pork - irresistible crackling." },
  { slug: "dominican-morir-sonando", title: "Morir Soñando", cuisine: "dominican", category: "beverage", difficulty: "easy" as const, time: 10, keyIngredients: ["orange juice", "evaporated milk", "sugar", "ice", "vanilla"], flavor: "Orange creamsicle drink - to die dreaming." },
  { slug: "dominican-habichuelas-guisadas", title: "Habichuelas Guisadas", cuisine: "dominican", category: "side", difficulty: "easy" as const, time: 45, keyIngredients: ["beans", "sofrito", "squash", "cilantro", "sazon"], flavor: "Stewed beans - essential side dish." },
  { slug: "dominican-moro", title: "Moro de Guandules", cuisine: "dominican", category: "side", difficulty: "medium" as const, time: 60, keyIngredients: ["rice", "pigeon peas", "coconut milk", "sofrito", "sazon"], flavor: "Rice with pigeon peas - Christmas favorite." },
  { slug: "dominican-pollo-guisado", title: "Pollo Guisado", cuisine: "dominican", category: "main", difficulty: "easy" as const, time: 60, keyIngredients: ["chicken", "tomato sauce", "sofrito", "olives", "potatoes"], flavor: "Braised chicken - weeknight staple." },
  { slug: "dominican-chivo-guisado", title: "Chivo Guisado", cuisine: "dominican", category: "main", difficulty: "medium" as const, time: 150, keyIngredients: ["goat", "tomato paste", "oregano", "rum", "peppers"], flavor: "Stewed goat - celebration dish." },
  { slug: "dominican-locrio", title: "Locrio de Pollo", cuisine: "dominican", category: "main", difficulty: "medium" as const, time: 75, keyIngredients: ["chicken", "rice", "tomato paste", "sofrito", "olives"], flavor: "Dominican chicken and rice - one pot wonder." },
  { slug: "dominican-empanadas", title: "Empanadas Dominicanas", cuisine: "dominican", category: "appetizer", difficulty: "medium" as const, time: 60, keyIngredients: ["flour", "beef", "sofrito", "tomato paste", "olives"], flavor: "Baked turnovers - party staple." },
  { slug: "dominican-yaroa", title: "Yaroa", cuisine: "dominican", category: "main", difficulty: "easy" as const, time: 30, keyIngredients: ["fries", "meat", "cheese", "mayo", "ketchup"], flavor: "Loaded fries - street food indulgence." },
  { slug: "dominican-concón", title: "Concón", cuisine: "dominican", category: "side", difficulty: "easy" as const, time: 45, keyIngredients: ["rice", "oil"], flavor: "Crispy rice bottom - coveted crust." },
  { slug: "dominican-dulce-de-leche", title: "Dulce de Leche Cortada", cuisine: "dominican", category: "dessert", difficulty: "medium" as const, time: 120, keyIngredients: ["milk", "sugar", "cinnamon", "lime"], flavor: "Curdled milk dessert - sweet tradition." },
  { slug: "dominican-habichuelas-con-dulce", title: "Habichuelas con Dulce", cuisine: "dominican", category: "dessert", difficulty: "medium" as const, time: 90, keyIngredients: ["red beans", "coconut milk", "sweet potato", "raisins", "milk cookies"], flavor: "Sweet bean dessert - Easter specialty." },

  // FILIPINO EXPANDED (12 more = 20 total)
  { slug: "filipino-lechon", title: "Lechon", cuisine: "filipino", category: "main", difficulty: "hard" as const, time: 480, keyIngredients: ["whole pig", "lemongrass", "garlic", "scallions", "bay leaves"], flavor: "Whole roasted pig - fiesta centerpiece." },
  { slug: "filipino-menudo", title: "Menudo", cuisine: "filipino", category: "main", difficulty: "medium" as const, time: 90, keyIngredients: ["pork", "liver", "potatoes", "tomato sauce", "soy sauce"], flavor: "Pork and liver stew - hearty comfort." },
  { slug: "filipino-mechado", title: "Mechado", cuisine: "filipino", category: "main", difficulty: "medium" as const, time: 120, keyIngredients: ["beef", "soy sauce", "calamansi", "potatoes", "tomato sauce"], flavor: "Beef stew in tomato sauce - Sunday lunch." },
  { slug: "filipino-pinakbet", title: "Pinakbet", cuisine: "filipino", category: "main", difficulty: "easy" as const, time: 45, keyIngredients: ["vegetables", "shrimp paste", "pork", "tomatoes", "bitter melon"], flavor: "Mixed vegetable stew - Ilocano specialty." },
  { slug: "filipino-tinola", title: "Tinola", cuisine: "filipino", category: "soup", difficulty: "easy" as const, time: 60, keyIngredients: ["chicken", "green papaya", "chili leaves", "ginger", "fish sauce"], flavor: "Ginger chicken soup - nourishing comfort." },
  { slug: "filipino-bicol-express", title: "Bicol Express", cuisine: "filipino", category: "main", difficulty: "easy" as const, time: 45, keyIngredients: ["pork", "coconut milk", "shrimp paste", "chili", "garlic"], flavor: "Spicy coconut pork - Bicolano fire." },
  { slug: "filipino-caldereta", title: "Caldereta", cuisine: "filipino", category: "main", difficulty: "medium" as const, time: 120, keyIngredients: ["beef or goat", "liver paste", "tomato sauce", "potatoes", "olives"], flavor: "Rich meat stew - celebration dish." },
  { slug: "filipino-laing", title: "Laing", cuisine: "filipino", category: "main", difficulty: "medium" as const, time: 60, keyIngredients: ["taro leaves", "coconut milk", "shrimp paste", "chili", "pork"], flavor: "Taro leaves in coconut - creamy and spicy." },
  { slug: "filipino-dinuguan", title: "Dinuguan", cuisine: "filipino", category: "main", difficulty: "medium" as const, time: 90, keyIngredients: ["pork", "pig blood", "vinegar", "chili", "garlic"], flavor: "Pork blood stew - chocolate meat." },
  { slug: "filipino-turon", title: "Turon", cuisine: "filipino", category: "dessert", difficulty: "easy" as const, time: 30, keyIngredients: ["ripe bananas", "jackfruit", "spring roll wrapper", "brown sugar"], flavor: "Fried banana rolls - street sweet." },
  { slug: "filipino-leche-flan", title: "Leche Flan", cuisine: "filipino", category: "dessert", difficulty: "medium" as const, time: 90, keyIngredients: ["egg yolks", "condensed milk", "evaporated milk", "vanilla", "caramel"], flavor: "Rich egg custard - celebration dessert." },
  { slug: "filipino-buko-pandan", title: "Buko Pandan", cuisine: "filipino", category: "dessert", difficulty: "easy" as const, time: 240, keyIngredients: ["young coconut", "pandan", "cream", "condensed milk", "gelatin"], flavor: "Coconut pandan salad - cool and creamy." },

  // SEASONAL & SPECIAL OCCASION RECIPES (40 recipes)
  
  // Christmas/Holiday (15)
  { slug: "christmas-ham-glazed", title: "Honey Glazed Christmas Ham", cuisine: "jamaican", category: "main", difficulty: "medium" as const, time: 240, keyIngredients: ["ham", "honey", "brown sugar", "cloves", "pineapple"], flavor: "Sweet, sticky glazed ham - holiday centerpiece." },
  { slug: "christmas-rum-cake", title: "Caribbean Rum Cake", cuisine: "jamaican", category: "dessert", difficulty: "medium" as const, time: 120, keyIngredients: ["rum", "butter", "brown sugar", "vanilla", "dried fruit"], flavor: "Boozy, moist cake - celebration essential." },
  { slug: "christmas-ponche-crema", title: "Ponche Crema", cuisine: "trinidadian", category: "beverage", difficulty: "easy" as const, time: 30, keyIngredients: ["rum", "condensed milk", "eggs", "nutmeg", "lime zest"], flavor: "Caribbean eggnog - festive drink." },
  { slug: "christmas-pasteles-masa", title: "Pasteles de Masa", cuisine: "puerto_rican", category: "main", difficulty: "hard" as const, time: 360, keyIngredients: ["green bananas", "pork", "sofrito", "annatto", "banana leaves"], flavor: "Christmas tamales - Puerto Rican tradition." },
  { slug: "christmas-roast-pork", title: "Caribbean Roast Pork", cuisine: "cuban", category: "main", difficulty: "medium" as const, time: 360, keyIngredients: ["pork leg", "mojo", "garlic", "oregano", "cumin"], flavor: "Crispy skin roast pork - Noche Buena star." },
  { slug: "kwanzaa-jollof", title: "Kwanzaa Jollof Rice", cuisine: "nigerian", category: "main", difficulty: "medium" as const, time: 90, keyIngredients: ["rice", "tomatoes", "peppers", "onion", "stock"], flavor: "Festive West African rice - celebration dish." },
  { slug: "diwali-samosa", title: "Diwali Samosas", cuisine: "indian", category: "appetizer", difficulty: "medium" as const, time: 90, keyIngredients: ["potatoes", "peas", "pastry", "garam masala", "cumin"], flavor: "Festival of lights appetizer - crispy delight." },
  { slug: "lunar-new-year-dumplings", title: "Lunar New Year Dumplings", cuisine: "chinese", category: "main", difficulty: "medium" as const, time: 120, keyIngredients: ["pork", "cabbage", "ginger", "dumpling wrappers", "soy sauce"], flavor: "Lucky dumplings - prosperity symbol." },
  { slug: "thanksgiving-curry-turkey", title: "Caribbean Curry Turkey", cuisine: "trinidadian", category: "main", difficulty: "medium" as const, time: 300, keyIngredients: ["turkey", "curry powder", "coconut milk", "potatoes", "scotch bonnet"], flavor: "Spiced holiday turkey - fusion favorite." },
  { slug: "easter-escovitch", title: "Easter Escovitch Fish", cuisine: "jamaican", category: "main", difficulty: "medium" as const, time: 60, keyIngredients: ["snapper", "vinegar", "onions", "peppers", "pimento"], flavor: "Good Friday fish - Jamaican tradition." },
  { slug: "cinco-de-mayo-carnitas", title: "Cinco de Mayo Carnitas", cuisine: "mexican", category: "main", difficulty: "medium" as const, time: 240, keyIngredients: ["pork shoulder", "orange", "lard", "bay leaves", "oregano"], flavor: "Celebration pork - fiesta essential." },
  { slug: "eid-biryani", title: "Eid Lamb Biryani", cuisine: "indian", category: "main", difficulty: "hard" as const, time: 180, keyIngredients: ["lamb", "basmati rice", "saffron", "yogurt", "fried onions"], flavor: "Festive layered rice - Eid celebration." },
  { slug: "chuseok-songpyeon", title: "Songpyeon", cuisine: "korean", category: "dessert", difficulty: "medium" as const, time: 120, keyIngredients: ["rice flour", "sesame", "honey", "pine needles", "mugwort"], flavor: "Korean harvest rice cakes - Chuseok tradition." },
  { slug: "mid-autumn-mooncake", title: "Mooncakes", cuisine: "chinese", category: "dessert", difficulty: "hard" as const, time: 240, keyIngredients: ["lotus paste", "salted egg yolks", "flour", "golden syrup"], flavor: "Festival cakes - Mid-Autumn tradition." },
  { slug: "independence-day-cook-up", title: "Guyanese Cook-Up Rice", cuisine: "trinidadian", category: "main", difficulty: "medium" as const, time: 90, keyIngredients: ["rice", "black-eyed peas", "coconut milk", "salted meat", "thyme"], flavor: "One-pot celebration rice - Caribbean staple." },

  // Quick Weeknight Meals (25)
  { slug: "quick-jerk-salmon", title: "15-Minute Jerk Salmon", cuisine: "jamaican", category: "main", difficulty: "easy" as const, time: 15, keyIngredients: ["salmon", "jerk seasoning", "lime", "butter", "scallions"], flavor: "Fast, flavorful fish - healthy weeknight." },
  { slug: "quick-curry-shrimp", title: "Quick Curry Shrimp", cuisine: "trinidadian", category: "main", difficulty: "easy" as const, time: 20, keyIngredients: ["shrimp", "curry powder", "coconut milk", "tomatoes", "scallions"], flavor: "Speedy curry - under 20 minutes." },
  { slug: "quick-stir-fry-beef", title: "Quick Beef Stir Fry", cuisine: "chinese", category: "main", difficulty: "easy" as const, time: 15, keyIngredients: ["beef", "broccoli", "soy sauce", "garlic", "ginger"], flavor: "Fast Asian flavors - busy night solution." },
  { slug: "quick-tacos", title: "Quick Ground Beef Tacos", cuisine: "mexican", category: "main", difficulty: "easy" as const, time: 20, keyIngredients: ["ground beef", "taco seasoning", "tortillas", "cheese", "salsa"], flavor: "Weeknight favorite - family pleaser." },
  { slug: "quick-fried-rice", title: "Quick Egg Fried Rice", cuisine: "chinese", category: "main", difficulty: "easy" as const, time: 15, keyIngredients: ["rice", "eggs", "soy sauce", "vegetables", "sesame oil"], flavor: "Leftover rice magic - fast and filling." },
  { slug: "quick-chicken-adobo", title: "Quick Chicken Adobo", cuisine: "filipino", category: "main", difficulty: "easy" as const, time: 30, keyIngredients: ["chicken thighs", "soy sauce", "vinegar", "garlic", "bay leaves"], flavor: "Speedy Filipino classic - tangy comfort." },
  { slug: "quick-dal", title: "15-Minute Dal", cuisine: "indian", category: "main", difficulty: "easy" as const, time: 15, keyIngredients: ["red lentils", "turmeric", "cumin", "garlic", "tomatoes"], flavor: "Fast protein-rich curry - vegan delight." },
  { slug: "quick-pho", title: "Quick Pho", cuisine: "vietnamese", category: "soup", difficulty: "easy" as const, time: 25, keyIngredients: ["beef broth", "rice noodles", "beef slices", "herbs", "hoisin"], flavor: "Shortcut pho - weeknight soup." },
  { slug: "quick-bibimbap", title: "Quick Bibimbap Bowl", cuisine: "korean", category: "main", difficulty: "easy" as const, time: 25, keyIngredients: ["rice", "vegetables", "egg", "gochujang", "sesame"], flavor: "Fast Korean bowl - healthy and quick." },
  { slug: "quick-pad-thai", title: "Quick Pad Thai", cuisine: "thai", category: "main", difficulty: "easy" as const, time: 25, keyIngredients: ["rice noodles", "shrimp", "egg", "peanuts", "lime"], flavor: "Fast Thai noodles - takeout at home." },
  { slug: "quick-jerk-chicken-bowl", title: "Jerk Chicken Rice Bowl", cuisine: "jamaican", category: "main", difficulty: "easy" as const, time: 25, keyIngredients: ["chicken breast", "jerk seasoning", "rice", "black beans", "mango"], flavor: "Caribbean bowl - fast and fresh." },
  { slug: "quick-burrito-bowl", title: "Quick Burrito Bowl", cuisine: "mexican", category: "main", difficulty: "easy" as const, time: 20, keyIngredients: ["chicken", "rice", "beans", "corn", "salsa"], flavor: "Chipotle style - homemade fast." },
  { slug: "quick-peanut-noodles", title: "Quick Peanut Noodles", cuisine: "thai", category: "main", difficulty: "easy" as const, time: 20, keyIngredients: ["noodles", "peanut butter", "soy sauce", "lime", "vegetables"], flavor: "Creamy Asian noodles - kid favorite." },
  { slug: "quick-curry-chickpeas", title: "Quick Chickpea Curry", cuisine: "indian", category: "main", difficulty: "easy" as const, time: 20, keyIngredients: ["chickpeas", "coconut milk", "curry powder", "tomatoes", "spinach"], flavor: "Fast vegan curry - pantry staple." },
  { slug: "quick-stir-fry-tofu", title: "Quick Tofu Stir Fry", cuisine: "chinese", category: "main", difficulty: "easy" as const, time: 20, keyIngredients: ["tofu", "vegetables", "soy sauce", "garlic", "ginger"], flavor: "Fast vegetarian - protein packed." },
  { slug: "quick-shrimp-tacos", title: "Quick Shrimp Tacos", cuisine: "mexican", category: "main", difficulty: "easy" as const, time: 15, keyIngredients: ["shrimp", "chili powder", "lime", "cabbage", "crema"], flavor: "Fast fish tacos - fresh and zesty." },
  { slug: "quick-coconut-curry", title: "Quick Coconut Vegetable Curry", cuisine: "thai", category: "main", difficulty: "easy" as const, time: 25, keyIngredients: ["coconut milk", "curry paste", "vegetables", "tofu", "basil"], flavor: "Fast Thai curry - weeknight exotic." },
  { slug: "quick-korean-beef", title: "Quick Korean Beef", cuisine: "korean", category: "main", difficulty: "easy" as const, time: 20, keyIngredients: ["ground beef", "soy sauce", "brown sugar", "sesame", "ginger"], flavor: "Fast Korean flavors - kid approved." },
  { slug: "quick-teriyaki-chicken", title: "Quick Teriyaki Chicken", cuisine: "japanese", category: "main", difficulty: "easy" as const, time: 20, keyIngredients: ["chicken", "soy sauce", "mirin", "sugar", "ginger"], flavor: "Fast Japanese classic - glossy and sweet." },
  { slug: "quick-black-bean-soup", title: "Quick Black Bean Soup", cuisine: "cuban", category: "soup", difficulty: "easy" as const, time: 25, keyIngredients: ["black beans", "sofrito", "cumin", "lime", "cilantro"], flavor: "Fast Cuban soup - hearty and filling." },
  { slug: "quick-lemon-chicken", title: "Quick Lemon Chicken", cuisine: "chinese", category: "main", difficulty: "easy" as const, time: 25, keyIngredients: ["chicken", "lemon", "honey", "garlic", "ginger"], flavor: "Fast crispy chicken - tangy sauce." },
  { slug: "quick-fish-curry", title: "Quick Fish Curry", cuisine: "indian", category: "main", difficulty: "easy" as const, time: 25, keyIngredients: ["white fish", "coconut milk", "curry powder", "tomatoes", "cilantro"], flavor: "Fast seafood curry - light and flavorful." },
  { slug: "quick-larb-bowl", title: "Quick Larb Lettuce Wraps", cuisine: "thai", category: "main", difficulty: "easy" as const, time: 20, keyIngredients: ["ground pork", "lime", "fish sauce", "mint", "lettuce"], flavor: "Fast Thai wraps - fresh and light." },
  { slug: "quick-rice-and-peas", title: "Quick Rice and Peas", cuisine: "jamaican", category: "side", difficulty: "easy" as const, time: 25, keyIngredients: ["rice", "kidney beans", "coconut milk", "thyme", "garlic"], flavor: "Fast Caribbean side - essential pairing." },
  { slug: "quick-plantain-bowl", title: "Quick Plantain Power Bowl", cuisine: "nigerian", category: "main", difficulty: "easy" as const, time: 20, keyIngredients: ["ripe plantains", "black beans", "avocado", "eggs", "hot sauce"], flavor: "Fast African fusion - nutritious bowl." },
  // ═══════════════════════════════════════════════════════════════════════════════
  // BATCH 3: MORE RECIPES TO REACH 500+
  // ═══════════════════════════════════════════════════════════════════════════════

  // MORE JAMAICAN (10)
  { slug: "jamaican-stamp-and-go", title: "Stamp and Go", cuisine: "jamaican", category: "appetizer", difficulty: "easy" as const, time: 30, keyIngredients: ["saltfish", "flour", "scotch bonnet", "scallions", "thyme"], flavor: "Crispy saltfish fritters - Jamaican street food." },
  { slug: "jamaican-cow-foot", title: "Cow Foot Stew", cuisine: "jamaican", category: "main", difficulty: "hard" as const, time: 240, keyIngredients: ["cow foot", "butter beans", "scotch bonnet", "thyme", "allspice"], flavor: "Gelatinous, rich stew - traditional comfort." },
  { slug: "jamaican-pepperpot-soup", title: "Jamaican Pepper Pot Soup", cuisine: "jamaican", category: "soup", difficulty: "medium" as const, time: 120, keyIngredients: ["callaloo", "okra", "salt beef", "coconut milk", "scotch bonnet"], flavor: "Thick green soup - Saturday tradition." },
  { slug: "jamaican-saltfish-fritters", title: "Saltfish Fritters", cuisine: "jamaican", category: "appetizer", difficulty: "easy" as const, time: 25, keyIngredients: ["saltfish", "flour", "peppers", "onion", "thyme"], flavor: "Golden crispy bites - perfect snack." },
  { slug: "jamaican-guinep", title: "Guinep Drink", cuisine: "jamaican", category: "beverage", difficulty: "easy" as const, time: 20, keyIngredients: ["guinep fruit", "water", "sugar", "lime"], flavor: "Refreshing tropical fruit drink." },
  { slug: "jamaican-matrimony", title: "Matrimony", cuisine: "jamaican", category: "dessert", difficulty: "easy" as const, time: 15, keyIngredients: ["star apple", "oranges", "condensed milk", "nutmeg"], flavor: "Tropical fruit dessert - marriage of flavors." },
  { slug: "jamaican-gizzada", title: "Gizzada", cuisine: "jamaican", category: "dessert", difficulty: "medium" as const, time: 60, keyIngredients: ["coconut", "brown sugar", "ginger", "pastry shell", "nutmeg"], flavor: "Coconut tart - Portuguese heritage sweet." },
  { slug: "jamaican-totoes", title: "Totoes", cuisine: "jamaican", category: "dessert", difficulty: "easy" as const, time: 45, keyIngredients: ["coconut", "flour", "brown sugar", "vanilla", "nutmeg"], flavor: "Coconut drops - chewy sweet treat." },
  { slug: "jamaican-cornmeal-porridge", title: "Cornmeal Porridge", cuisine: "jamaican", category: "breakfast", difficulty: "easy" as const, time: 25, keyIngredients: ["cornmeal", "coconut milk", "condensed milk", "cinnamon", "vanilla"], flavor: "Creamy breakfast porridge - morning comfort." },
  { slug: "jamaican-peanut-porridge", title: "Peanut Porridge", cuisine: "jamaican", category: "breakfast", difficulty: "easy" as const, time: 30, keyIngredients: ["peanuts", "oats", "coconut milk", "cinnamon", "vanilla"], flavor: "Nutty breakfast bowl - protein rich." },

  // MORE HAITIAN (10)
  { slug: "haitian-poisson-gros-sel", title: "Poisson Gros Sel", cuisine: "haitian", category: "main", difficulty: "medium" as const, time: 45, keyIngredients: ["whole fish", "coarse salt", "lime", "epis", "scotch bonnet"], flavor: "Salt-crusted fried fish - coastal favorite." },
  { slug: "haitian-sos-pwa-noir", title: "Sos Pwa Noir", cuisine: "haitian", category: "main", difficulty: "medium" as const, time: 120, keyIngredients: ["black beans", "epis", "scotch bonnet", "thyme", "pork"], flavor: "Black bean sauce - rich and hearty." },
  { slug: "haitian-diri-blan", title: "Diri Blan", cuisine: "haitian", category: "side", difficulty: "easy" as const, time: 25, keyIngredients: ["rice", "salt", "oil"], flavor: "Perfect white rice - Haitian style." },
  { slug: "haitian-bef", title: "Bef Haitian", cuisine: "haitian", category: "main", difficulty: "medium" as const, time: 90, keyIngredients: ["beef", "tomatoes", "epis", "scotch bonnet", "carrots"], flavor: "Braised beef in tomato sauce." },
  { slug: "haitian-kabrit", title: "Kabrit (Goat)", cuisine: "haitian", category: "main", difficulty: "medium" as const, time: 150, keyIngredients: ["goat", "epis", "tomato paste", "scotch bonnet", "thyme"], flavor: "Stewed goat - celebration dish." },
  { slug: "haitian-macaroni-au-gratin", title: "Macaroni au Gratin", cuisine: "haitian", category: "side", difficulty: "medium" as const, time: 60, keyIngredients: ["macaroni", "cheese", "evaporated milk", "butter", "eggs"], flavor: "Creamy baked pasta - party side." },
  { slug: "haitian-labouyi-bannann", title: "Labouyi Bannann", cuisine: "haitian", category: "breakfast", difficulty: "easy" as const, time: 30, keyIngredients: ["green plantains", "cinnamon", "star anise", "vanilla", "milk"], flavor: "Plantain porridge - warming breakfast." },
  { slug: "haitian-akasan", title: "Akasan", cuisine: "haitian", category: "beverage", difficulty: "medium" as const, time: 45, keyIngredients: ["cornmeal", "star anise", "cinnamon", "evaporated milk", "vanilla"], flavor: "Thick corn drink - street beverage." },
  { slug: "haitian-pen-patat", title: "Pen Patat", cuisine: "haitian", category: "dessert", difficulty: "medium" as const, time: 90, keyIngredients: ["sweet potato", "banana", "coconut milk", "spices", "sugar"], flavor: "Sweet potato bread - holiday treat." },
  { slug: "haitian-douce-macoss", title: "Douce Macoss", cuisine: "haitian", category: "dessert", difficulty: "easy" as const, time: 30, keyIngredients: ["sugar", "peanuts", "vanilla", "lime"], flavor: "Peanut brittle - sweet snack." },

  // MORE NIGERIAN (10)
  { slug: "nigerian-ofada-rice", title: "Ofada Rice with Ayamase", cuisine: "nigerian", category: "main", difficulty: "medium" as const, time: 90, keyIngredients: ["ofada rice", "green bell peppers", "locust beans", "palm oil", "assorted meat"], flavor: "Local rice with spicy green sauce." },
  { slug: "nigerian-bole", title: "Bole (Roasted Plantain)", cuisine: "nigerian", category: "snack", difficulty: "easy" as const, time: 30, keyIngredients: ["plantains", "groundnut", "palm oil", "pepper sauce"], flavor: "Roasted plantain - street food classic." },
  { slug: "nigerian-nkwobi", title: "Nkwobi", cuisine: "nigerian", category: "appetizer", difficulty: "medium" as const, time: 90, keyIngredients: ["cow foot", "palm oil", "utazi leaves", "potash", "peppers"], flavor: "Spicy cow foot - Igbo delicacy." },
  { slug: "nigerian-isi-ewu", title: "Isi Ewu", cuisine: "nigerian", category: "appetizer", difficulty: "hard" as const, time: 120, keyIngredients: ["goat head", "palm oil", "utazi", "potash", "peppers"], flavor: "Spiced goat head - ceremonial dish." },
  { slug: "nigerian-draw-soup", title: "Okra Draw Soup", cuisine: "nigerian", category: "soup", difficulty: "easy" as const, time: 45, keyIngredients: ["okra", "palm oil", "fish", "crayfish", "peppers"], flavor: "Slimy okra soup - comfort classic." },
  { slug: "nigerian-abacha", title: "Abacha (African Salad)", cuisine: "nigerian", category: "side", difficulty: "medium" as const, time: 60, keyIngredients: ["dried cassava", "palm oil", "utazi", "garden egg", "stockfish"], flavor: "Cassava salad - Igbo specialty." },
  { slug: "nigerian-kunu", title: "Kunu", cuisine: "nigerian", category: "beverage", difficulty: "medium" as const, time: 1440, keyIngredients: ["millet", "ginger", "cloves", "sugar", "sweet potato"], flavor: "Fermented millet drink - refreshing." },
  { slug: "nigerian-zobo", title: "Zobo", cuisine: "nigerian", category: "beverage", difficulty: "easy" as const, time: 120, keyIngredients: ["hibiscus", "ginger", "pineapple", "cloves", "sugar"], flavor: "Hibiscus drink - party favorite." },
  { slug: "nigerian-pounded-yam", title: "Pounded Yam", cuisine: "nigerian", category: "side", difficulty: "medium" as const, time: 45, keyIngredients: ["yam", "water"], flavor: "Smooth yam swallow - soup companion." },
  { slug: "nigerian-amala", title: "Amala", cuisine: "nigerian", category: "side", difficulty: "easy" as const, time: 20, keyIngredients: ["yam flour", "water"], flavor: "Dark yam swallow - Yoruba staple." },

  // MORE MEXICAN (15)
  { slug: "mexican-chilaquiles", title: "Chilaquiles Verdes", cuisine: "mexican", category: "breakfast", difficulty: "easy" as const, time: 30, keyIngredients: ["tortilla chips", "green salsa", "crema", "cheese", "eggs"], flavor: "Crispy chips in salsa - breakfast favorite." },
  { slug: "mexican-huevos-rancheros", title: "Huevos Rancheros", cuisine: "mexican", category: "breakfast", difficulty: "easy" as const, time: 25, keyIngredients: ["eggs", "tortillas", "ranchero sauce", "beans", "cheese"], flavor: "Ranch-style eggs - classic breakfast." },
  { slug: "mexican-gorditas", title: "Gorditas", cuisine: "mexican", category: "main", difficulty: "medium" as const, time: 60, keyIngredients: ["masa", "pork", "beans", "cheese", "salsa"], flavor: "Thick corn pockets - stuffed perfection." },
  { slug: "mexican-tostadas", title: "Tostadas de Tinga", cuisine: "mexican", category: "appetizer", difficulty: "easy" as const, time: 45, keyIngredients: ["tostada shells", "chicken tinga", "lettuce", "crema", "cheese"], flavor: "Crispy flat tacos - topped delight." },
  { slug: "mexican-molcajete", title: "Molcajete", cuisine: "mexican", category: "main", difficulty: "medium" as const, time: 60, keyIngredients: ["steak", "chicken", "shrimp", "cheese", "salsa"], flavor: "Sizzling stone bowl - tableside drama." },
  { slug: "mexican-cochinita-pibil", title: "Cochinita Pibil", cuisine: "mexican", category: "main", difficulty: "medium" as const, time: 240, keyIngredients: ["pork", "achiote", "sour orange", "banana leaves", "pickled onion"], flavor: "Yucatan pulled pork - citrusy and tender." },
  { slug: "mexican-barbacoa", title: "Barbacoa", cuisine: "mexican", category: "main", difficulty: "hard" as const, time: 360, keyIngredients: ["beef cheeks", "chipotles", "cloves", "cumin", "bay leaves"], flavor: "Slow-cooked beef - melt in mouth." },
  { slug: "mexican-menudo", title: "Menudo", cuisine: "mexican", category: "soup", difficulty: "hard" as const, time: 300, keyIngredients: ["tripe", "hominy", "guajillo chiles", "oregano", "lime"], flavor: "Tripe soup - hangover cure legend." },
  { slug: "mexican-tortas-ahogadas", title: "Tortas Ahogadas", cuisine: "mexican", category: "main", difficulty: "medium" as const, time: 45, keyIngredients: ["birote bread", "carnitas", "chile de arbol sauce", "onion", "lime"], flavor: "Drowned sandwich - Guadalajara specialty." },
  { slug: "mexican-tlayudas", title: "Tlayudas", cuisine: "mexican", category: "main", difficulty: "medium" as const, time: 30, keyIngredients: ["large tortilla", "beans", "asiento", "cheese", "meat"], flavor: "Oaxacan pizza - crispy and loaded." },
  { slug: "mexican-quesabirria", title: "Quesabirria Tacos", cuisine: "mexican", category: "main", difficulty: "medium" as const, time: 240, keyIngredients: ["beef", "dried chiles", "cheese", "tortillas", "consomme"], flavor: "Birria tacos with cheese - crispy dipping." },
  { slug: "mexican-esquites", title: "Esquites", cuisine: "mexican", category: "snack", difficulty: "easy" as const, time: 20, keyIngredients: ["corn kernels", "mayo", "cheese", "chili", "lime"], flavor: "Street corn in a cup - portable elote." },
  { slug: "mexican-churros", title: "Churros", cuisine: "mexican", category: "dessert", difficulty: "medium" as const, time: 45, keyIngredients: ["flour", "butter", "eggs", "sugar", "cinnamon"], flavor: "Fried dough sticks - chocolate dipping." },
  { slug: "mexican-tres-leches", title: "Tres Leches Cake", cuisine: "mexican", category: "dessert", difficulty: "medium" as const, time: 240, keyIngredients: ["cake", "three milks", "whipped cream", "vanilla", "cinnamon"], flavor: "Soaked cake - moist and dreamy." },
  { slug: "mexican-flan-napolitano", title: "Flan Napolitano", cuisine: "mexican", category: "dessert", difficulty: "medium" as const, time: 120, keyIngredients: ["cream cheese", "condensed milk", "eggs", "vanilla", "caramel"], flavor: "Creamy caramel custard - silky smooth." },

  // MORE THAI (10)
  { slug: "thai-panang-curry", title: "Panang Curry", cuisine: "thai", category: "main", difficulty: "medium" as const, time: 40, keyIngredients: ["panang paste", "beef", "coconut cream", "lime leaves", "basil"], flavor: "Rich, nutty curry - less soupy." },
  { slug: "thai-khao-soi", title: "Khao Soi", cuisine: "thai", category: "soup", difficulty: "medium" as const, time: 60, keyIngredients: ["egg noodles", "coconut curry", "chicken", "pickled mustard", "shallots"], flavor: "Northern curry noodle soup - crispy topped." },
  { slug: "thai-kai-yang", title: "Gai Yang", cuisine: "thai", category: "main", difficulty: "medium" as const, time: 180, keyIngredients: ["chicken", "lemongrass", "cilantro root", "garlic", "fish sauce"], flavor: "Thai grilled chicken - Isaan street food." },
  { slug: "thai-nam-tok", title: "Nam Tok", cuisine: "thai", category: "salad", difficulty: "easy" as const, time: 25, keyIngredients: ["grilled beef", "mint", "shallots", "fish sauce", "chili"], flavor: "Waterfall beef salad - spicy and fresh." },
  { slug: "thai-yam-woon-sen", title: "Yum Woon Sen", cuisine: "thai", category: "salad", difficulty: "easy" as const, time: 20, keyIngredients: ["glass noodles", "shrimp", "pork", "lime", "chili"], flavor: "Spicy glass noodle salad - tangy refreshing." },
  { slug: "thai-pla-rad-prik", title: "Pla Rad Prik", cuisine: "thai", category: "main", difficulty: "medium" as const, time: 45, keyIngredients: ["whole fish", "tamarind", "chili", "garlic", "palm sugar"], flavor: "Crispy fish with tamarind - sweet spicy." },
  { slug: "thai-kai-med-ma-muang", title: "Cashew Chicken", cuisine: "thai", category: "main", difficulty: "easy" as const, time: 20, keyIngredients: ["chicken", "cashews", "dried chili", "onion", "soy sauce"], flavor: "Quick stir-fry - nutty delight." },
  { slug: "thai-gaeng-hung-lay", title: "Gaeng Hang Lay", cuisine: "thai", category: "main", difficulty: "medium" as const, time: 120, keyIngredients: ["pork belly", "ginger", "tamarind", "curry paste", "palm sugar"], flavor: "Northern pork curry - Burmese influenced." },
  { slug: "thai-tod-mun-pla", title: "Tod Mun Pla", cuisine: "thai", category: "appetizer", difficulty: "medium" as const, time: 45, keyIngredients: ["fish", "red curry paste", "long beans", "lime leaves", "fish sauce"], flavor: "Thai fish cakes - bouncy texture." },
  { slug: "thai-khao-niao", title: "Sticky Rice", cuisine: "thai", category: "side", difficulty: "easy" as const, time: 45, keyIngredients: ["sticky rice", "water"], flavor: "Isaan essential - hand-eaten perfection." },

  // MORE KOREAN (10)
  { slug: "korean-budae-jjigae", title: "Budae Jjigae", cuisine: "korean", category: "soup", difficulty: "easy" as const, time: 30, keyIngredients: ["spam", "hot dogs", "ramen", "kimchi", "gochugaru"], flavor: "Army stew - fusion comfort food." },
  { slug: "korean-jjajangmyeon", title: "Jjajangmyeon", cuisine: "korean", category: "main", difficulty: "medium" as const, time: 45, keyIngredients: ["noodles", "black bean paste", "pork", "onion", "zucchini"], flavor: "Black bean noodles - Korean-Chinese." },
  { slug: "korean-dakdoritang", title: "Dakdoritang", cuisine: "korean", category: "main", difficulty: "medium" as const, time: 60, keyIngredients: ["chicken", "potatoes", "carrots", "gochugaru", "gochujang"], flavor: "Spicy chicken stew - hearty comfort." },
  { slug: "korean-gamjatang", title: "Gamjatang", cuisine: "korean", category: "soup", difficulty: "hard" as const, time: 180, keyIngredients: ["pork spine", "potatoes", "perilla", "gochugaru", "doenjang"], flavor: "Pork bone soup - rich and spicy." },
  { slug: "korean-haemul-pajeon", title: "Haemul Pajeon", cuisine: "korean", category: "appetizer", difficulty: "medium" as const, time: 30, keyIngredients: ["seafood", "scallions", "flour", "egg", "soy dipping"], flavor: "Seafood scallion pancake - crispy savory." },
  { slug: "korean-ojingeo-bokkeum", title: "Ojingeo Bokkeum", cuisine: "korean", category: "main", difficulty: "easy" as const, time: 25, keyIngredients: ["squid", "gochujang", "vegetables", "sesame", "garlic"], flavor: "Spicy stir-fried squid - quick and fiery." },
  { slug: "korean-kongnamul-guk", title: "Kongnamul Guk", cuisine: "korean", category: "soup", difficulty: "easy" as const, time: 25, keyIngredients: ["bean sprouts", "garlic", "sesame", "scallions", "salt"], flavor: "Bean sprout soup - hangover cure." },
  { slug: "korean-hobak-jeon", title: "Hobak Jeon", cuisine: "korean", category: "side", difficulty: "easy" as const, time: 20, keyIngredients: ["zucchini", "egg", "flour", "salt"], flavor: "Pan-fried zucchini - simple banchan." },
  { slug: "korean-dubu-jorim", title: "Dubu Jorim", cuisine: "korean", category: "side", difficulty: "easy" as const, time: 25, keyIngredients: ["tofu", "soy sauce", "sesame", "gochugaru", "garlic"], flavor: "Braised tofu - savory banchan." },
  { slug: "korean-patbingsu", title: "Patbingsu", cuisine: "korean", category: "dessert", difficulty: "easy" as const, time: 15, keyIngredients: ["shaved ice", "red beans", "condensed milk", "mochi", "fruit"], flavor: "Shaved ice dessert - summer essential." },

  // MORE CHINESE (15)
  { slug: "chinese-xiaolongbao", title: "Xiaolongbao", cuisine: "chinese", category: "appetizer", difficulty: "hard" as const, time: 180, keyIngredients: ["pork", "soup", "dough", "ginger", "vinegar"], flavor: "Soup dumplings - Shanghai treasure." },
  { slug: "chinese-zhajiangmian", title: "Zha Jiang Mian", cuisine: "chinese", category: "main", difficulty: "easy" as const, time: 30, keyIngredients: ["noodles", "pork", "bean paste", "cucumber", "radish"], flavor: "Beijing noodles - savory and thick." },
  { slug: "chinese-hong-shao-rou", title: "Hong Shao Rou", cuisine: "chinese", category: "main", difficulty: "medium" as const, time: 120, keyIngredients: ["pork belly", "soy sauce", "sugar", "star anise", "ginger"], flavor: "Red braised pork - Mao's favorite." },
  { slug: "chinese-gong-bao-ji-ding", title: "Gong Bao Ji Ding", cuisine: "chinese", category: "main", difficulty: "medium" as const, time: 25, keyIngredients: ["chicken", "peanuts", "dried chili", "Sichuan peppercorn"], flavor: "Kung Pao chicken - authentic Sichuan." },
  { slug: "chinese-shui-zhu-niu", title: "Shui Zhu Niu Rou", cuisine: "chinese", category: "main", difficulty: "medium" as const, time: 40, keyIngredients: ["beef", "Sichuan peppercorn", "dried chili", "bean sprouts"], flavor: "Water-boiled beef - numbing spicy." },
  { slug: "chinese-ma-yi-shang-shu", title: "Ma Yi Shang Shu", cuisine: "chinese", category: "main", difficulty: "easy" as const, time: 20, keyIngredients: ["glass noodles", "pork", "doubanjiang", "scallions"], flavor: "Ants climbing tree - spicy noodles." },
  { slug: "chinese-hui-guo-rou", title: "Hui Guo Rou", cuisine: "chinese", category: "main", difficulty: "medium" as const, time: 45, keyIngredients: ["pork belly", "leeks", "doubanjiang", "fermented black beans"], flavor: "Twice-cooked pork - Sichuan classic." },
  { slug: "chinese-la-zi-ji", title: "La Zi Ji", cuisine: "chinese", category: "main", difficulty: "medium" as const, time: 35, keyIngredients: ["chicken", "dried chili", "Sichuan peppercorn", "ginger"], flavor: "Chongqing chicken - buried in chilis." },
  { slug: "chinese-yu-xiang-qiezi", title: "Yu Xiang Qie Zi", cuisine: "chinese", category: "main", difficulty: "easy" as const, time: 25, keyIngredients: ["eggplant", "pork", "doubanjiang", "garlic", "vinegar"], flavor: "Fish-fragrant eggplant - no fish involved." },
  { slug: "chinese-jian-bing", title: "Jian Bing", cuisine: "chinese", category: "breakfast", difficulty: "medium" as const, time: 15, keyIngredients: ["batter", "egg", "scallions", "crispy cracker", "sauce"], flavor: "Chinese crepe - breakfast on the go." },
  { slug: "chinese-baozi", title: "Baozi", cuisine: "chinese", category: "breakfast", difficulty: "medium" as const, time: 180, keyIngredients: ["dough", "pork", "cabbage", "ginger", "soy sauce"], flavor: "Steamed buns - fluffy pillows." },
  { slug: "chinese-zongzi", title: "Zongzi", cuisine: "chinese", category: "snack", difficulty: "hard" as const, time: 300, keyIngredients: ["sticky rice", "pork", "bamboo leaves", "mung beans"], flavor: "Dragon boat dumplings - festival food." },
  { slug: "chinese-tang-yuan", title: "Tang Yuan", cuisine: "chinese", category: "dessert", difficulty: "medium" as const, time: 60, keyIngredients: ["glutinous rice", "black sesame", "ginger soup", "sugar"], flavor: "Sweet rice balls - Lantern Festival." },
  { slug: "chinese-douhua", title: "Douhua", cuisine: "chinese", category: "dessert", difficulty: "medium" as const, time: 45, keyIngredients: ["tofu", "ginger syrup", "peanuts"], flavor: "Silky tofu pudding - street dessert." },
  { slug: "chinese-egg-tart", title: "Egg Tart", cuisine: "chinese", category: "dessert", difficulty: "medium" as const, time: 60, keyIngredients: ["pastry", "eggs", "milk", "sugar", "vanilla"], flavor: "Cantonese custard tart - dim sum ending." },

  // ADDITIONAL VIETNAMESE (10)
  { slug: "vietnamese-bun-rieu", title: "Bun Rieu", cuisine: "vietnamese", category: "soup", difficulty: "hard" as const, time: 180, keyIngredients: ["crab paste", "tomatoes", "tofu", "rice noodles", "shrimp paste"], flavor: "Crab tomato noodle soup - tangy rich." },
  { slug: "vietnamese-hu-tieu", title: "Hu Tieu", cuisine: "vietnamese", category: "soup", difficulty: "medium" as const, time: 120, keyIngredients: ["pork", "shrimp", "rice noodles", "pork broth", "herbs"], flavor: "Southern noodle soup - clear and sweet." },
  { slug: "vietnamese-banh-cuon", title: "Banh Cuon", cuisine: "vietnamese", category: "breakfast", difficulty: "hard" as const, time: 90, keyIngredients: ["rice sheets", "pork", "wood ear", "shallots", "fish sauce"], flavor: "Steamed rice rolls - delicate and light." },
  { slug: "vietnamese-bun-dau-mam-tom", title: "Bun Dau Mam Tom", cuisine: "vietnamese", category: "main", difficulty: "easy" as const, time: 30, keyIngredients: ["rice noodles", "fried tofu", "shrimp paste", "herbs", "pork"], flavor: "Noodles with shrimp paste - bold flavors." },
  { slug: "vietnamese-bo-kho", title: "Bo Kho", cuisine: "vietnamese", category: "soup", difficulty: "medium" as const, time: 180, keyIngredients: ["beef", "lemongrass", "star anise", "carrots", "bread"], flavor: "Vietnamese beef stew - French influenced." },
  { slug: "vietnamese-ga-nuong", title: "Ga Nuong", cuisine: "vietnamese", category: "main", difficulty: "medium" as const, time: 120, keyIngredients: ["chicken", "lemongrass", "fish sauce", "honey", "garlic"], flavor: "Grilled chicken - caramelized perfection." },
  { slug: "vietnamese-banh-khot", title: "Banh Khot", cuisine: "vietnamese", category: "appetizer", difficulty: "medium" as const, time: 45, keyIngredients: ["rice flour", "shrimp", "mung beans", "scallions", "coconut milk"], flavor: "Mini crispy pancakes - bite-sized." },
  { slug: "vietnamese-bap-xao", title: "Bap Xao", cuisine: "vietnamese", category: "snack", difficulty: "easy" as const, time: 15, keyIngredients: ["corn", "butter", "dried shrimp", "scallions", "chili"], flavor: "Vietnamese buttered corn - street snack." },
  { slug: "vietnamese-banh-trang-nuong", title: "Banh Trang Nuong", cuisine: "vietnamese", category: "snack", difficulty: "easy" as const, time: 15, keyIngredients: ["rice paper", "egg", "scallions", "dried shrimp", "chili sauce"], flavor: "Vietnamese pizza - Da Lat specialty." },
  { slug: "vietnamese-sinh-to", title: "Sinh To", cuisine: "vietnamese", category: "beverage", difficulty: "easy" as const, time: 10, keyIngredients: ["fruit", "condensed milk", "ice", "sugar"], flavor: "Vietnamese smoothie - creamy tropical." },

  // ADDITIONAL INDIAN (10)
  { slug: "indian-pav-bhaji", title: "Pav Bhaji", cuisine: "indian", category: "main", difficulty: "medium" as const, time: 60, keyIngredients: ["vegetables", "pav bhaji masala", "butter", "bread rolls", "onion"], flavor: "Mumbai street food - buttery delight." },
  { slug: "indian-vada-pav", title: "Vada Pav", cuisine: "indian", category: "snack", difficulty: "medium" as const, time: 45, keyIngredients: ["potato", "gram flour", "bread", "garlic chutney", "green chili"], flavor: "Mumbai burger - spicy potato fritter." },
  { slug: "indian-bhel-puri", title: "Bhel Puri", cuisine: "indian", category: "snack", difficulty: "easy" as const, time: 15, keyIngredients: ["puffed rice", "sev", "chutneys", "onion", "potato"], flavor: "Beach snack - crispy tangy mix." },
  { slug: "indian-pani-puri", title: "Pani Puri", cuisine: "indian", category: "snack", difficulty: "medium" as const, time: 45, keyIngredients: ["puri shells", "spiced water", "chickpeas", "potato", "tamarind"], flavor: "Crispy water bombs - street favorite." },
  { slug: "indian-malai-kofta", title: "Malai Kofta", cuisine: "indian", category: "main", difficulty: "hard" as const, time: 90, keyIngredients: ["paneer", "potato", "cream", "cashews", "tomato gravy"], flavor: "Royal dumplings in cream - restaurant special." },
  { slug: "indian-rajma-chawal", title: "Rajma Chawal", cuisine: "indian", category: "main", difficulty: "easy" as const, time: 60, keyIngredients: ["kidney beans", "tomatoes", "onion", "rice", "spices"], flavor: "Punjabi comfort - beans and rice." },
  { slug: "indian-kadhi-pakora", title: "Kadhi Pakora", cuisine: "indian", category: "main", difficulty: "medium" as const, time: 60, keyIngredients: ["yogurt", "gram flour", "pakoras", "turmeric", "fenugreek"], flavor: "Yogurt curry with fritters - tangy comfort." },
  { slug: "indian-hyderabadi-biryani", title: "Hyderabadi Biryani", cuisine: "indian", category: "main", difficulty: "hard" as const, time: 180, keyIngredients: ["basmati rice", "goat", "yogurt", "saffron", "fried onions"], flavor: "Dum-cooked layered rice - Nizam's pride." },
  { slug: "indian-rasam", title: "Rasam", cuisine: "indian", category: "soup", difficulty: "easy" as const, time: 30, keyIngredients: ["tamarind", "tomato", "pepper", "cumin", "curry leaves"], flavor: "Spicy soup - South Indian essential." },
  { slug: "indian-kheer", title: "Kheer", cuisine: "indian", category: "dessert", difficulty: "easy" as const, time: 45, keyIngredients: ["rice", "milk", "sugar", "cardamom", "nuts"], flavor: "Rice pudding - celebration sweet." },

  // ADDITIONAL CUBAN (5)
  { slug: "cuban-pan-con-lechon", title: "Pan con Lechon", cuisine: "cuban", category: "main", difficulty: "easy" as const, time: 15, keyIngredients: ["Cuban bread", "roast pork", "mojo", "onion"], flavor: "Pork sandwich - simple perfection." },
  { slug: "cuban-fricase-de-pollo", title: "Fricase de Pollo", cuisine: "cuban", category: "main", difficulty: "medium" as const, time: 75, keyIngredients: ["chicken", "potatoes", "olives", "tomato sauce", "wine"], flavor: "Cuban chicken fricassee - hearty stew." },
  { slug: "cuban-platanos-maduros", title: "Platanos Maduros", cuisine: "cuban", category: "side", difficulty: "easy" as const, time: 15, keyIngredients: ["ripe plantains", "oil", "salt"], flavor: "Sweet fried plantains - caramelized edges." },
  { slug: "cuban-arroz-amarillo", title: "Arroz Amarillo", cuisine: "cuban", category: "side", difficulty: "easy" as const, time: 30, keyIngredients: ["rice", "saffron", "garlic", "olive oil", "broth"], flavor: "Yellow rice - colorful side." },
  { slug: "cuban-tres-leches-cubano", title: "Cuban Tres Leches", cuisine: "cuban", category: "dessert", difficulty: "medium" as const, time: 180, keyIngredients: ["cake", "three milks", "meringue", "vanilla"], flavor: "Three milk cake - soaked heaven." },
  // ═══════════════════════════════════════════════════════════════════════════════
  // MEGA BATCH: 300+ MORE RECIPES FOR GLOBAL ETHNIC FOOD DOMINANCE
  // Target: 750+ total recipes for category leadership
  // ═══════════════════════════════════════════════════════════════════════════════

  // ═══════════════════════════════════════════════════════════════════════════════
  // JAMAICAN - COMPLETE COVERAGE (30 more)
  // ═══════════════════════════════════════════════════════════════════════════════
  { slug: "jamaican-stamp-and-go", title: "Stamp and Go", cuisine: "jamaican", category: "appetizer", difficulty: "easy" as const, time: 30, keyIngredients: ["saltfish", "flour", "scotch bonnet", "scallions", "thyme"], flavor: "Crispy saltfish fritters - street food classic." },
  { slug: "jamaican-cow-foot", title: "Cow Foot Stew", cuisine: "jamaican", category: "main", difficulty: "hard" as const, time: 240, keyIngredients: ["cow foot", "butter beans", "scotch bonnet", "thyme", "allspice"], flavor: "Gelatinous rich stew - traditional comfort." },
  { slug: "jamaican-pepperpot-soup", title: "Jamaican Pepper Pot Soup", cuisine: "jamaican", category: "soup", difficulty: "medium" as const, time: 120, keyIngredients: ["callaloo", "okra", "salt beef", "coconut milk", "yam"], flavor: "Thick green soup - Saturday tradition." },
  { slug: "jamaican-matrimony", title: "Matrimony", cuisine: "jamaican", category: "dessert", difficulty: "easy" as const, time: 15, keyIngredients: ["star apple", "oranges", "condensed milk", "nutmeg"], flavor: "Tropical fruit dessert - marriage of flavors." },
  { slug: "jamaican-gizzada", title: "Gizzada", cuisine: "jamaican", category: "dessert", difficulty: "medium" as const, time: 60, keyIngredients: ["coconut", "brown sugar", "ginger", "pastry shell"], flavor: "Coconut tart - Portuguese heritage sweet." },
  { slug: "jamaican-cornmeal-porridge", title: "Cornmeal Porridge", cuisine: "jamaican", category: "breakfast", difficulty: "easy" as const, time: 25, keyIngredients: ["cornmeal", "coconut milk", "condensed milk", "cinnamon"], flavor: "Creamy breakfast - morning comfort." },
  { slug: "jamaican-banana-porridge", title: "Banana Porridge", cuisine: "jamaican", category: "breakfast", difficulty: "easy" as const, time: 20, keyIngredients: ["green bananas", "coconut milk", "vanilla", "nutmeg"], flavor: "Sweet breakfast porridge - energy boost." },
  { slug: "jamaican-hard-dough-bread", title: "Hard Dough Bread", cuisine: "jamaican", category: "bread", difficulty: "medium" as const, time: 180, keyIngredients: ["flour", "yeast", "sugar", "butter"], flavor: "Dense chewy bread - bulla companion." },
  { slug: "jamaican-bulla-cake", title: "Bulla Cake", cuisine: "jamaican", category: "dessert", difficulty: "easy" as const, time: 45, keyIngredients: ["flour", "molasses", "ginger", "baking soda"], flavor: "Ginger spiced flat cake - with cheese." },
  { slug: "jamaican-coconut-drops", title: "Coconut Drops", cuisine: "jamaican", category: "dessert", difficulty: "easy" as const, time: 40, keyIngredients: ["coconut", "brown sugar", "ginger", "vanilla"], flavor: "Chewy coconut candy - street sweet." },
  { slug: "jamaican-plantain-tart", title: "Plantain Tart", cuisine: "jamaican", category: "dessert", difficulty: "medium" as const, time: 60, keyIngredients: ["ripe plantain", "pastry", "cinnamon", "vanilla"], flavor: "Sweet plantain pastry - unique treat." },
  { slug: "jamaican-turned-cornmeal", title: "Turn Cornmeal", cuisine: "jamaican", category: "side", difficulty: "easy" as const, time: 30, keyIngredients: ["cornmeal", "coconut milk", "okra", "salt"], flavor: "Savory cornmeal - comfort side dish." },
  { slug: "jamaican-steamed-fish", title: "Jamaican Steamed Fish", cuisine: "jamaican", category: "main", difficulty: "medium" as const, time: 45, keyIngredients: ["snapper", "okra", "tomatoes", "scotch bonnet", "crackers"], flavor: "Healthy fish dish - light and flavorful." },
  { slug: "jamaican-fried-fish", title: "Jamaican Fried Fish", cuisine: "jamaican", category: "main", difficulty: "easy" as const, time: 30, keyIngredients: ["snapper", "seasoning", "flour", "oil"], flavor: "Crispy fried fish - festival companion." },
  { slug: "jamaican-liver-and-onions", title: "Jamaican Liver", cuisine: "jamaican", category: "main", difficulty: "easy" as const, time: 25, keyIngredients: ["chicken liver", "onions", "thyme", "scotch bonnet"], flavor: "Savory liver dish - iron rich." },
  { slug: "jamaican-kidney-stew", title: "Stewed Kidney", cuisine: "jamaican", category: "main", difficulty: "medium" as const, time: 45, keyIngredients: ["kidney", "tomatoes", "thyme", "scotch bonnet"], flavor: "Offal delicacy - rich and savory." },
  { slug: "jamaican-tripe-and-beans", title: "Tripe and Beans", cuisine: "jamaican", category: "main", difficulty: "hard" as const, time: 180, keyIngredients: ["tripe", "butter beans", "thyme", "scotch bonnet"], flavor: "Traditional offal dish - tender delicious." },
  { slug: "jamaican-sweet-potato-pudding", title: "Sweet Potato Pudding", cuisine: "jamaican", category: "dessert", difficulty: "medium" as const, time: 120, keyIngredients: ["sweet potato", "coconut", "raisins", "spices"], flavor: "Dense spiced pudding - hell a top." },
  { slug: "jamaican-bread-pudding", title: "Jamaican Bread Pudding", cuisine: "jamaican", category: "dessert", difficulty: "easy" as const, time: 60, keyIngredients: ["bread", "condensed milk", "raisins", "vanilla"], flavor: "Comfort dessert - waste not want not." },
  { slug: "jamaican-peanut-punch", title: "Peanut Punch", cuisine: "jamaican", category: "beverage", difficulty: "easy" as const, time: 10, keyIngredients: ["peanuts", "milk", "condensed milk", "nutmeg"], flavor: "Protein rich drink - energy booster." },
  { slug: "jamaican-sea-moss", title: "Sea Moss Drink", cuisine: "jamaican", category: "beverage", difficulty: "medium" as const, time: 1440, keyIngredients: ["sea moss", "condensed milk", "vanilla", "nutmeg"], flavor: "Health drink - mineral rich." },
  { slug: "jamaican-carrot-juice", title: "Jamaican Carrot Juice", cuisine: "jamaican", category: "beverage", difficulty: "easy" as const, time: 15, keyIngredients: ["carrots", "condensed milk", "nutmeg", "vanilla"], flavor: "Sweet carrot drink - Jamaican style." },
  { slug: "jamaican-june-plum-drink", title: "June Plum Drink", cuisine: "jamaican", category: "beverage", difficulty: "easy" as const, time: 15, keyIngredients: ["june plum", "sugar", "ginger", "water"], flavor: "Tart tropical drink - refreshing." },
  { slug: "jamaican-tamarind-balls", title: "Tamarind Balls", cuisine: "jamaican", category: "snack", difficulty: "easy" as const, time: 30, keyIngredients: ["tamarind", "sugar", "pepper"], flavor: "Sweet sour candy - tangy treat." },
  { slug: "jamaican-grater-cake", title: "Grater Cake", cuisine: "jamaican", category: "dessert", difficulty: "easy" as const, time: 30, keyIngredients: ["coconut", "sugar", "food coloring"], flavor: "Pink and white coconut candy." },
  { slug: "jamaican-bustamante-backbone", title: "Bustamante Backbone", cuisine: "jamaican", category: "snack", difficulty: "hard" as const, time: 60, keyIngredients: ["coconut", "molasses", "ginger"], flavor: "Hard coconut candy - chewy challenge." },
  { slug: "jamaican-asham", title: "Asham", cuisine: "jamaican", category: "snack", difficulty: "easy" as const, time: 30, keyIngredients: ["parched corn", "sugar", "nutmeg"], flavor: "Toasted corn snack - traditional treat." },
  { slug: "jamaican-pinch-me-round", title: "Pinch Me Round", cuisine: "jamaican", category: "snack", difficulty: "easy" as const, time: 45, keyIngredients: ["flour", "coconut", "sugar", "spices"], flavor: "Coconut dumplings - sweet snack." },
  { slug: "jamaican-jackfruit-rundown", title: "Jackfruit Rundown", cuisine: "jamaican", category: "main", difficulty: "medium" as const, time: 60, keyIngredients: ["jackfruit", "coconut milk", "tomatoes", "thyme"], flavor: "Vegan rundown - meat-free version." },
  { slug: "jamaican-ital-stew", title: "Ital Stew", cuisine: "jamaican", category: "main", difficulty: "easy" as const, time: 60, keyIngredients: ["vegetables", "coconut milk", "thyme", "allspice"], flavor: "Rastafarian stew - no salt vegan." },

  // ═══════════════════════════════════════════════════════════════════════════════
  // HAITIAN - COMPLETE COVERAGE (25 more)
  // ═══════════════════════════════════════════════════════════════════════════════
  { slug: "haitian-sos-pwa-rouj", title: "Sos Pwa Rouj", cuisine: "haitian", category: "main", difficulty: "medium" as const, time: 120, keyIngredients: ["red beans", "epis", "pork", "thyme"], flavor: "Red bean sauce - Haitian staple." },
  { slug: "haitian-diri-blan-ak-sos", title: "Diri Blan ak Sos", cuisine: "haitian", category: "main", difficulty: "easy" as const, time: 40, keyIngredients: ["white rice", "bean sauce", "meat"], flavor: "Rice with sauce - everyday meal." },
  { slug: "haitian-kibi", title: "Haitian Kibbe", cuisine: "haitian", category: "appetizer", difficulty: "medium" as const, time: 60, keyIngredients: ["bulgur", "beef", "mint", "onion"], flavor: "Lebanese-Haitian fusion - crispy outside." },
  { slug: "haitian-poul-nan-sos", title: "Poul nan Sos", cuisine: "haitian", category: "main", difficulty: "medium" as const, time: 75, keyIngredients: ["chicken", "tomatoes", "epis", "scotch bonnet"], flavor: "Chicken in sauce - Creole style." },
  { slug: "haitian-taso-kabrit", title: "Taso Kabrit", cuisine: "haitian", category: "main", difficulty: "medium" as const, time: 120, keyIngredients: ["goat", "sour orange", "epis", "scotch bonnet"], flavor: "Fried goat - crispy celebration meat." },
  { slug: "haitian-pwason-nan-sos", title: "Pwason nan Sos", cuisine: "haitian", category: "main", difficulty: "medium" as const, time: 45, keyIngredients: ["fish", "tomatoes", "epis", "lime"], flavor: "Fish in Creole sauce - coastal favorite." },
  { slug: "haitian-legim-nan-sos", title: "Legim Vegetarian", cuisine: "haitian", category: "main", difficulty: "medium" as const, time: 60, keyIngredients: ["eggplant", "cabbage", "chayote", "spinach"], flavor: "Vegetable stew - meatless version." },
  { slug: "haitian-macaroni-gratin", title: "Macaroni Gratin", cuisine: "haitian", category: "side", difficulty: "medium" as const, time: 60, keyIngredients: ["macaroni", "evaporated milk", "cheese", "butter"], flavor: "Baked pasta - party essential." },
  { slug: "haitian-salad-russe", title: "Salade Russe", cuisine: "haitian", category: "side", difficulty: "easy" as const, time: 45, keyIngredients: ["beets", "potatoes", "carrots", "mayo"], flavor: "Russian salad - Haitian style." },
  { slug: "haitian-joumou-soup", title: "Soup Joumou (Independence)", cuisine: "haitian", category: "soup", difficulty: "hard" as const, time: 240, keyIngredients: ["calabaza", "beef", "pasta", "vegetables"], flavor: "January 1st soup - freedom symbol." },
  { slug: "haitian-bouyon", title: "Bouyon Bef", cuisine: "haitian", category: "soup", difficulty: "medium" as const, time: 120, keyIngredients: ["beef", "yam", "plantain", "dumplings"], flavor: "Hearty beef soup - Saturday tradition." },
  { slug: "haitian-chiktay", title: "Chiktay", cuisine: "haitian", category: "appetizer", difficulty: "easy" as const, time: 20, keyIngredients: ["smoked herring", "scotch bonnet", "lime", "oil"], flavor: "Smoked fish spread - strong flavored." },
  { slug: "haitian-ble-moulen", title: "Ble Moulen", cuisine: "haitian", category: "breakfast", difficulty: "easy" as const, time: 30, keyIngredients: ["bulgur wheat", "milk", "sugar", "cinnamon"], flavor: "Wheat porridge - breakfast comfort." },
  { slug: "haitian-avoka", title: "Avoka ak Kasav", cuisine: "haitian", category: "breakfast", difficulty: "easy" as const, time: 10, keyIngredients: ["avocado", "cassava bread", "salt", "lime"], flavor: "Simple breakfast - creamy and filling." },
  { slug: "haitian-bonbon-siwo", title: "Bonbon Siwo", cuisine: "haitian", category: "dessert", difficulty: "medium" as const, time: 60, keyIngredients: ["sweet potato", "ginger", "cinnamon", "syrup"], flavor: "Sweet potato in syrup - festive treat." },
  { slug: "haitian-tablette", title: "Tablette Pistach", cuisine: "haitian", category: "dessert", difficulty: "easy" as const, time: 30, keyIngredients: ["peanuts", "sugar", "vanilla"], flavor: "Peanut brittle - crunchy sweet." },
  { slug: "haitian-dous-makos", title: "Dous Makoss", cuisine: "haitian", category: "dessert", difficulty: "easy" as const, time: 30, keyIngredients: ["sugar", "peanuts", "vanilla", "lime"], flavor: "Caramelized peanut candy - street snack." },
  { slug: "haitian-konfiti", title: "Konfiti Kokoye", cuisine: "haitian", category: "dessert", difficulty: "medium" as const, time: 90, keyIngredients: ["coconut", "sugar", "vanilla", "lime"], flavor: "Coconut jam - spread or candy." },
  { slug: "haitian-pen-let", title: "Pain au Lait", cuisine: "haitian", category: "bread", difficulty: "medium" as const, time: 180, keyIngredients: ["flour", "milk", "sugar", "butter"], flavor: "Milk bread - soft breakfast roll." },
  { slug: "haitian-beignets", title: "Beignets Banane", cuisine: "haitian", category: "dessert", difficulty: "easy" as const, time: 30, keyIngredients: ["ripe bananas", "flour", "sugar", "cinnamon"], flavor: "Banana fritters - quick dessert." },
  { slug: "haitian-sirop-grenadine", title: "Sirop Grenadine", cuisine: "haitian", category: "beverage", difficulty: "easy" as const, time: 30, keyIngredients: ["grenadine", "water", "lime", "sugar"], flavor: "Sweet red drink - refreshing." },
  { slug: "haitian-ji-kokoye", title: "Ji Kokoye", cuisine: "haitian", category: "beverage", difficulty: "easy" as const, time: 10, keyIngredients: ["coconut water", "sugar", "lime"], flavor: "Fresh coconut water - natural refreshment." },
  { slug: "haitian-labapen", title: "Labapen (Breadfruit)", cuisine: "haitian", category: "side", difficulty: "easy" as const, time: 45, keyIngredients: ["breadfruit", "oil", "salt"], flavor: "Fried breadfruit - starchy side." },
  { slug: "haitian-bannann-bouyi", title: "Bannann Bouyi", cuisine: "haitian", category: "side", difficulty: "easy" as const, time: 25, keyIngredients: ["green plantains", "salt", "water"], flavor: "Boiled plantains - simple staple." },
  { slug: "haitian-patat-bouyi", title: "Patat Bouyi", cuisine: "haitian", category: "side", difficulty: "easy" as const, time: 30, keyIngredients: ["sweet potato", "butter", "cinnamon"], flavor: "Boiled sweet potato - comfort side." },

  // ═══════════════════════════════════════════════════════════════════════════════
  // NIGERIAN - COMPLETE COVERAGE (30 more)
  // ═══════════════════════════════════════════════════════════════════════════════
  { slug: "nigerian-authentic-jollof", title: "Authentic Nigerian Jollof", cuisine: "nigerian", category: "main", difficulty: "medium" as const, time: 90, keyIngredients: ["rice", "tomatoes", "scotch bonnet", "bay leaves", "thyme"], flavor: "The real party jollof - smoky bottom." },
  { slug: "nigerian-party-rice", title: "Nigerian Party Fried Rice", cuisine: "nigerian", category: "main", difficulty: "medium" as const, time: 60, keyIngredients: ["rice", "vegetables", "liver", "prawns", "curry"], flavor: "Colorful celebration rice - party essential." },
  { slug: "nigerian-native-jollof", title: "Native Jollof (Palm Oil)", cuisine: "nigerian", category: "main", difficulty: "medium" as const, time: 75, keyIngredients: ["rice", "palm oil", "locust beans", "smoked fish"], flavor: "Traditional palm oil rice - ancestral recipe." },
  { slug: "nigerian-coconut-rice", title: "Nigerian Coconut Rice", cuisine: "nigerian", category: "main", difficulty: "easy" as const, time: 45, keyIngredients: ["rice", "coconut milk", "curry", "vegetables"], flavor: "Creamy coconut rice - coastal favorite." },
  { slug: "nigerian-ofada-stew", title: "Ayamase (Ofada Stew)", cuisine: "nigerian", category: "main", difficulty: "medium" as const, time: 60, keyIngredients: ["green peppers", "locust beans", "palm oil", "assorted meat"], flavor: "Green pepper stew - bold and spicy." },
  { slug: "nigerian-white-soup", title: "Ofe Nsala (White Soup)", cuisine: "nigerian", category: "soup", difficulty: "medium" as const, time: 75, keyIngredients: ["catfish", "yam", "utazi", "crayfish"], flavor: "Igbo white soup - no palm oil." },
  { slug: "nigerian-oha-soup", title: "Oha Soup", cuisine: "nigerian", category: "soup", difficulty: "medium" as const, time: 60, keyIngredients: ["oha leaves", "cocoyam", "assorted meat", "palm oil"], flavor: "Igbo delicacy - aromatic leaves." },
  { slug: "nigerian-bitter-leaf-soup", title: "Bitter Leaf Soup", cuisine: "nigerian", category: "soup", difficulty: "medium" as const, time: 90, keyIngredients: ["bitter leaves", "cocoyam", "assorted meat", "stockfish"], flavor: "Medicinal soup - acquired taste." },
  { slug: "nigerian-afang-soup", title: "Afang Soup", cuisine: "nigerian", category: "soup", difficulty: "hard" as const, time: 90, keyIngredients: ["afang leaves", "waterleaf", "periwinkle", "stockfish"], flavor: "Cross River specialty - leafy rich." },
  { slug: "nigerian-groundnut-soup", title: "Nigerian Groundnut Soup", cuisine: "nigerian", category: "soup", difficulty: "medium" as const, time: 75, keyIngredients: ["groundnut paste", "chicken", "tomatoes", "spinach"], flavor: "Peanut soup - creamy hearty." },
  { slug: "nigerian-miyan-kuka", title: "Miyan Kuka", cuisine: "nigerian", category: "soup", difficulty: "easy" as const, time: 30, keyIngredients: ["baobab leaves", "dried fish", "locust beans", "peppers"], flavor: "Northern draw soup - unique flavor." },
  { slug: "nigerian-miyan-taushe", title: "Miyan Taushe", cuisine: "nigerian", category: "soup", difficulty: "medium" as const, time: 60, keyIngredients: ["pumpkin", "spinach", "groundnut", "meat"], flavor: "Pumpkin soup - Northern specialty." },
  { slug: "nigerian-eba-garri", title: "Eba (Garri)", cuisine: "nigerian", category: "side", difficulty: "easy" as const, time: 10, keyIngredients: ["garri", "hot water"], flavor: "Cassava swallow - most popular." },
  { slug: "nigerian-semovita", title: "Semovita", cuisine: "nigerian", category: "side", difficulty: "easy" as const, time: 15, keyIngredients: ["semovita flour", "water"], flavor: "Wheat swallow - smooth texture." },
  { slug: "nigerian-wheat-meal", title: "Wheat Meal Swallow", cuisine: "nigerian", category: "side", difficulty: "easy" as const, time: 15, keyIngredients: ["wheat flour", "water"], flavor: "Healthy swallow - fiber rich." },
  { slug: "nigerian-ogi-pap", title: "Ogi (Pap)", cuisine: "nigerian", category: "breakfast", difficulty: "medium" as const, time: 1440, keyIngredients: ["corn", "water", "sugar", "milk"], flavor: "Fermented corn porridge - breakfast." },
  { slug: "nigerian-agidi", title: "Agidi (Eko)", cuisine: "nigerian", category: "side", difficulty: "medium" as const, time: 60, keyIngredients: ["corn starch", "water", "banana leaves"], flavor: "Solid corn pudding - akara companion." },
  { slug: "nigerian-tuwo-masara", title: "Tuwo Masara", cuisine: "nigerian", category: "side", difficulty: "easy" as const, time: 30, keyIngredients: ["corn flour", "water"], flavor: "Corn swallow - Northern staple." },
  { slug: "nigerian-abacha-salad", title: "African Salad (Abacha)", cuisine: "nigerian", category: "side", difficulty: "medium" as const, time: 45, keyIngredients: ["dried cassava", "palm oil", "ugba", "garden egg"], flavor: "Igbo salad - ceremonial dish." },
  { slug: "nigerian-peppered-snail", title: "Peppered Snail", cuisine: "nigerian", category: "appetizer", difficulty: "medium" as const, time: 60, keyIngredients: ["snails", "peppers", "onions", "palm oil"], flavor: "Spicy delicacy - bar favorite." },
  { slug: "nigerian-peppered-gizzard", title: "Peppered Gizzard", cuisine: "nigerian", category: "appetizer", difficulty: "easy" as const, time: 45, keyIngredients: ["gizzard", "peppers", "onions", "seasoning"], flavor: "Chewy spicy snack - small chops." },
  { slug: "nigerian-asun", title: "Asun (Spicy Goat)", cuisine: "nigerian", category: "appetizer", difficulty: "medium" as const, time: 60, keyIngredients: ["goat meat", "scotch bonnet", "onions", "spices"], flavor: "Grilled spicy goat - party starter." },
  { slug: "nigerian-gizdodo", title: "Gizdodo", cuisine: "nigerian", category: "appetizer", difficulty: "easy" as const, time: 30, keyIngredients: ["gizzard", "plantains", "peppers", "onions"], flavor: "Gizzard and plantain - fusion snack." },
  { slug: "nigerian-small-chops", title: "Small Chops Platter", cuisine: "nigerian", category: "appetizer", difficulty: "medium" as const, time: 90, keyIngredients: ["spring rolls", "samosa", "puff puff", "chicken"], flavor: "Party appetizers - celebration essential." },
  { slug: "nigerian-epa-groundnut", title: "Roasted Groundnuts", cuisine: "nigerian", category: "snack", difficulty: "easy" as const, time: 30, keyIngredients: ["groundnuts", "salt"], flavor: "Roasted peanuts - movie snack." },
  { slug: "nigerian-kokoro", title: "Kokoro", cuisine: "nigerian", category: "snack", difficulty: "medium" as const, time: 60, keyIngredients: ["corn", "sugar", "pepper"], flavor: "Crunchy corn snack - street food." },
  { slug: "nigerian-kulikuli", title: "Kulikuli", cuisine: "nigerian", category: "snack", difficulty: "medium" as const, time: 60, keyIngredients: ["groundnut paste", "pepper", "ginger"], flavor: "Peanut snack - crunchy protein." },
  { slug: "nigerian-chapman", title: "Chapman", cuisine: "nigerian", category: "beverage", difficulty: "easy" as const, time: 10, keyIngredients: ["fanta", "sprite", "grenadine", "cucumber", "lemon"], flavor: "Nigerian cocktail - party drink." },
  { slug: "nigerian-palm-wine", title: "Palm Wine (Fresh)", cuisine: "nigerian", category: "beverage", difficulty: "easy" as const, time: 5, keyIngredients: ["palm wine"], flavor: "Natural alcoholic drink - fresh tapped." },
  { slug: "nigerian-fura-da-nono", title: "Fura da Nono", cuisine: "nigerian", category: "beverage", difficulty: "medium" as const, time: 60, keyIngredients: ["millet balls", "fermented milk", "sugar"], flavor: "Northern drink - probiotic rich." },

  // ═══════════════════════════════════════════════════════════════════════════════
  // WEST AFRICAN EXPANSION (Ghana, Senegal, Cameroon) (25)
  // ═══════════════════════════════════════════════════════════════════════════════
  { slug: "ghanaian-authentic-jollof", title: "Authentic Ghanaian Jollof", cuisine: "ghanaian", category: "main", difficulty: "medium" as const, time: 90, keyIngredients: ["rice", "tomatoes", "onion", "spices"], flavor: "Smoky tomato rice - Ghanaian pride." },
  { slug: "ghanaian-okro-soup", title: "Okro Soup", cuisine: "ghanaian", category: "soup", difficulty: "easy" as const, time: 45, keyIngredients: ["okra", "palm oil", "fish", "crayfish"], flavor: "Slimy draw soup - comfort food." },
  { slug: "ghanaian-ampesi", title: "Ampesi", cuisine: "ghanaian", category: "main", difficulty: "easy" as const, time: 40, keyIngredients: ["yam", "plantain", "kontomire", "fish"], flavor: "Boiled staples with stew - simple meal." },
  { slug: "ghanaian-omo-tuo", title: "Omo Tuo", cuisine: "ghanaian", category: "side", difficulty: "medium" as const, time: 45, keyIngredients: ["rice", "water"], flavor: "Rice balls - soup companion." },
  { slug: "ghanaian-tuo-zaafi", title: "Tuo Zaafi", cuisine: "ghanaian", category: "side", difficulty: "medium" as const, time: 60, keyIngredients: ["corn flour", "cassava", "water"], flavor: "Northern TZ - ayoyo soup pair." },
  { slug: "ghanaian-shito", title: "Shito (Black Pepper Sauce)", cuisine: "ghanaian", category: "condiment", difficulty: "medium" as const, time: 90, keyIngredients: ["dried shrimp", "fish", "peppers", "oil"], flavor: "Hot black sauce - universal condiment." },
  { slug: "senegalese-thieboudienne", title: "Thieboudienne", cuisine: "senegalese", category: "main", difficulty: "hard" as const, time: 180, keyIngredients: ["fish", "rice", "vegetables", "tomatoes"], flavor: "Senegal national dish - one pot feast." },
  { slug: "senegalese-yassa-chicken", title: "Yassa Poulet", cuisine: "senegalese", category: "main", difficulty: "medium" as const, time: 120, keyIngredients: ["chicken", "onions", "lemon", "mustard", "olives"], flavor: "Onion-lemon chicken - tangy bright." },
  { slug: "senegalese-mafe", title: "Mafe", cuisine: "senegalese", category: "main", difficulty: "medium" as const, time: 90, keyIngredients: ["meat", "peanut butter", "tomatoes", "vegetables"], flavor: "Peanut stew - West African classic." },
  { slug: "senegalese-fataya", title: "Fataya", cuisine: "senegalese", category: "appetizer", difficulty: "medium" as const, time: 60, keyIngredients: ["pastry", "fish", "onions", "parsley"], flavor: "Fish turnovers - street snack." },
  { slug: "senegalese-bissap", title: "Bissap", cuisine: "senegalese", category: "beverage", difficulty: "easy" as const, time: 120, keyIngredients: ["hibiscus", "sugar", "vanilla", "mint"], flavor: "Hibiscus drink - refreshing sweet." },
  { slug: "cameroonian-ndole", title: "Ndolé", cuisine: "cameroonian", category: "main", difficulty: "hard" as const, time: 180, keyIngredients: ["bitter leaves", "groundnuts", "crayfish", "meat"], flavor: "Cameroon national dish - complex flavor." },
  { slug: "cameroonian-eru", title: "Eru", cuisine: "cameroonian", category: "main", difficulty: "medium" as const, time: 90, keyIngredients: ["eru leaves", "waterleaf", "palm oil", "cow skin"], flavor: "Leafy stew - Southern specialty." },
  { slug: "cameroonian-koki", title: "Koki", cuisine: "cameroonian", category: "side", difficulty: "medium" as const, time: 120, keyIngredients: ["black-eyed peas", "palm oil", "banana leaves"], flavor: "Steamed bean cake - festive dish." },
  { slug: "cameroonian-achu", title: "Achu Soup", cuisine: "cameroonian", category: "soup", difficulty: "hard" as const, time: 180, keyIngredients: ["cocoyams", "limestone", "yellow soup", "meat"], flavor: "Yellow soup with pounded cocoyam." },
  { slug: "cameroonian-puff-puff", title: "Cameroonian Puff Puff", cuisine: "cameroonian", category: "snack", difficulty: "easy" as const, time: 90, keyIngredients: ["flour", "yeast", "sugar", "nutmeg"], flavor: "Sweet fried dough - universal favorite." },
  { slug: "ivorian-kedjenou", title: "Kedjenou", cuisine: "ivorian", category: "main", difficulty: "medium" as const, time: 90, keyIngredients: ["chicken", "tomatoes", "onions", "ginger"], flavor: "Slow-cooked chicken - no water added." },
  { slug: "ivorian-attieke", title: "Attieke", cuisine: "ivorian", category: "side", difficulty: "hard" as const, time: 1440, keyIngredients: ["cassava", "oil", "onion"], flavor: "Fermented cassava couscous - tangy." },
  { slug: "ivorian-alloco", title: "Alloco", cuisine: "ivorian", category: "side", difficulty: "easy" as const, time: 20, keyIngredients: ["plantains", "palm oil", "chili"], flavor: "Fried plantains - street food." },
  { slug: "liberian-palm-butter", title: "Palm Butter Soup", cuisine: "liberian", category: "soup", difficulty: "medium" as const, time: 120, keyIngredients: ["palm fruit", "meat", "fish", "okra"], flavor: "Rich palm soup - Liberian pride." },
  { slug: "liberian-jollof-rice", title: "Liberian Jollof Rice", cuisine: "liberian", category: "main", difficulty: "medium" as const, time: 90, keyIngredients: ["rice", "tomatoes", "bacon", "vegetables"], flavor: "West African rice variation - unique blend." },
  { slug: "sierra-leonean-cassava-leaves", title: "Cassava Leaf Stew", cuisine: "sierra_leonean", category: "main", difficulty: "hard" as const, time: 180, keyIngredients: ["cassava leaves", "palm oil", "fish", "meat"], flavor: "National dish - rich and earthy." },
  { slug: "sierra-leonean-groundnut-soup", title: "Sierra Leonean Groundnut Soup", cuisine: "sierra_leonean", category: "soup", difficulty: "medium" as const, time: 90, keyIngredients: ["groundnuts", "chicken", "okra", "palm oil"], flavor: "Creamy peanut soup - comforting." },
  { slug: "gambian-domoda", title: "Domoda", cuisine: "gambian", category: "main", difficulty: "medium" as const, time: 90, keyIngredients: ["peanut butter", "tomatoes", "meat", "vegetables"], flavor: "Gambian peanut stew - national dish." },
  { slug: "gambian-benachin", title: "Benachin", cuisine: "gambian", category: "main", difficulty: "medium" as const, time: 120, keyIngredients: ["rice", "fish", "vegetables", "tomatoes"], flavor: "One pot rice - Jollof cousin." },

  // ═══════════════════════════════════════════════════════════════════════════════
  // EAST AFRICAN (Ethiopian, Somali, Kenyan) (20)
  // ═══════════════════════════════════════════════════════════════════════════════
  { slug: "ethiopian-yebeg-wot", title: "Yebeg Wot (Lamb Stew)", cuisine: "ethiopian", category: "main", difficulty: "medium" as const, time: 120, keyIngredients: ["lamb", "berbere", "onions", "niter kibbeh"], flavor: "Spicy lamb stew - celebration dish." },
  { slug: "ethiopian-yebeg-alicha", title: "Yebeg Alicha", cuisine: "ethiopian", category: "main", difficulty: "medium" as const, time: 90, keyIngredients: ["lamb", "turmeric", "ginger", "garlic"], flavor: "Mild lamb stew - gentle spice." },
  { slug: "ethiopian-gored-gored", title: "Gored Gored", cuisine: "ethiopian", category: "main", difficulty: "easy" as const, time: 15, keyIngredients: ["beef cubes", "mitmita", "niter kibbeh"], flavor: "Raw beef cubes - spiced butter." },
  { slug: "ethiopian-timatim-fitfit", title: "Timatim Fitfit", cuisine: "ethiopian", category: "side", difficulty: "easy" as const, time: 15, keyIngredients: ["injera", "tomatoes", "onions", "jalapeño"], flavor: "Tomato salad with injera - refreshing." },
  { slug: "ethiopian-azifa", title: "Azifa", cuisine: "ethiopian", category: "side", difficulty: "easy" as const, time: 45, keyIngredients: ["lentils", "onion", "jalapeño", "lemon"], flavor: "Green lentil salad - cold and zesty." },
  { slug: "ethiopian-buticha", title: "Buticha", cuisine: "ethiopian", category: "side", difficulty: "easy" as const, time: 30, keyIngredients: ["chickpea flour", "jalapeño", "onion", "lemon"], flavor: "Chickpea dip - vegan protein." },
  { slug: "ethiopian-fossolia", title: "Fossolia", cuisine: "ethiopian", category: "side", difficulty: "easy" as const, time: 25, keyIngredients: ["green beans", "carrots", "garlic", "ginger"], flavor: "Sauteed vegetables - mild side." },
  { slug: "somali-suqaar", title: "Suqaar", cuisine: "somali", category: "main", difficulty: "easy" as const, time: 30, keyIngredients: ["beef", "onions", "peppers", "xawaash spice"], flavor: "Sauteed beef - quick breakfast." },
  { slug: "somali-bariis-iskukaris", title: "Bariis Iskukaris", cuisine: "somali", category: "main", difficulty: "medium" as const, time: 90, keyIngredients: ["rice", "meat", "raisins", "xawaash", "potatoes"], flavor: "Spiced rice - Somali biryani." },
  { slug: "somali-canjeero", title: "Canjeero", cuisine: "somali", category: "bread", difficulty: "medium" as const, time: 1440, keyIngredients: ["flour", "yeast", "sugar"], flavor: "Fermented pancake - breakfast staple." },
  { slug: "somali-sambusa", title: "Somali Sambusa", cuisine: "somali", category: "appetizer", difficulty: "medium" as const, time: 60, keyIngredients: ["pastry", "meat", "onions", "cilantro"], flavor: "Triangular pastries - Ramadan favorite." },
  { slug: "somali-hilib-ari", title: "Hilib Ari (Goat)", cuisine: "somali", category: "main", difficulty: "medium" as const, time: 120, keyIngredients: ["goat", "xawaash", "onions", "tomatoes"], flavor: "Stewed goat - special occasions." },
  { slug: "somali-maraq", title: "Maraq (Soup)", cuisine: "somali", category: "soup", difficulty: "easy" as const, time: 60, keyIngredients: ["meat", "vegetables", "cilantro", "xawaash"], flavor: "Light soup - meal starter." },
  { slug: "kenyan-nyama-choma", title: "Nyama Choma", cuisine: "kenyan", category: "main", difficulty: "medium" as const, time: 120, keyIngredients: ["goat", "salt", "lemon", "kachumbari"], flavor: "Grilled meat - Kenyan BBQ." },
  { slug: "kenyan-ugali", title: "Ugali", cuisine: "kenyan", category: "side", difficulty: "easy" as const, time: 20, keyIngredients: ["corn flour", "water"], flavor: "Corn porridge - East African staple." },
  { slug: "kenyan-sukuma-wiki", title: "Sukuma Wiki", cuisine: "kenyan", category: "side", difficulty: "easy" as const, time: 20, keyIngredients: ["collard greens", "onions", "tomatoes", "oil"], flavor: "Sauteed greens - everyday vegetable." },
  { slug: "kenyan-githeri", title: "Githeri", cuisine: "kenyan", category: "main", difficulty: "easy" as const, time: 90, keyIngredients: ["maize", "beans", "vegetables"], flavor: "Corn and beans - comfort food." },
  { slug: "kenyan-pilau", title: "Kenyan Pilau", cuisine: "kenyan", category: "main", difficulty: "medium" as const, time: 75, keyIngredients: ["rice", "meat", "pilau masala", "potatoes"], flavor: "Spiced rice - coastal influence." },
  { slug: "kenyan-chapati", title: "Kenyan Chapati", cuisine: "kenyan", category: "bread", difficulty: "medium" as const, time: 60, keyIngredients: ["flour", "oil", "salt", "water"], flavor: "Layered flatbread - Indian influence." },
  { slug: "kenyan-mandazi", title: "Mandazi", cuisine: "kenyan", category: "snack", difficulty: "easy" as const, time: 60, keyIngredients: ["flour", "coconut milk", "cardamom", "sugar"], flavor: "East African doughnuts - breakfast treat." },

  // ═══════════════════════════════════════════════════════════════════════════════
  // SOUTH ASIAN EXPANSION (Pakistan, Bangladesh, Sri Lanka) (20)
  // ═══════════════════════════════════════════════════════════════════════════════
  { slug: "pakistani-biryani", title: "Pakistani Biryani", cuisine: "pakistani", category: "main", difficulty: "hard" as const, time: 180, keyIngredients: ["basmati", "meat", "yogurt", "saffron", "fried onions"], flavor: "Karachi style layered rice - aromatic feast." },
  { slug: "pakistani-nihari", title: "Nihari", cuisine: "pakistani", category: "main", difficulty: "hard" as const, time: 480, keyIngredients: ["beef shank", "wheat flour", "nihari masala", "ginger"], flavor: "Slow-cooked stew - breakfast of kings." },
  { slug: "pakistani-haleem", title: "Haleem", cuisine: "pakistani", category: "main", difficulty: "hard" as const, time: 360, keyIngredients: ["meat", "wheat", "lentils", "barley", "spices"], flavor: "Thick porridge - Ramadan essential." },
  { slug: "pakistani-karahi", title: "Chicken Karahi", cuisine: "pakistani", category: "main", difficulty: "medium" as const, time: 45, keyIngredients: ["chicken", "tomatoes", "ginger", "green chilies"], flavor: "Wok-style curry - restaurant favorite." },
  { slug: "pakistani-chapli-kebab", title: "Chapli Kebab", cuisine: "pakistani", category: "main", difficulty: "medium" as const, time: 45, keyIngredients: ["beef mince", "tomatoes", "pomegranate seeds", "spices"], flavor: "Peshawar patties - juicy and flat." },
  { slug: "pakistani-seekh-kebab", title: "Seekh Kebab", cuisine: "pakistani", category: "appetizer", difficulty: "medium" as const, time: 45, keyIngredients: ["beef mince", "onions", "herbs", "spices"], flavor: "Grilled skewers - smoky perfection." },
  { slug: "pakistani-paratha", title: "Layered Paratha", cuisine: "pakistani", category: "bread", difficulty: "medium" as const, time: 45, keyIngredients: ["flour", "ghee", "salt"], flavor: "Flaky flatbread - breakfast essential." },
  { slug: "bangladeshi-kacchi-biryani", title: "Kacchi Biryani", cuisine: "bangladeshi", category: "main", difficulty: "hard" as const, time: 240, keyIngredients: ["mutton", "rice", "yogurt", "potatoes", "saffron"], flavor: "Raw meat biryani - Dhaka specialty." },
  { slug: "bangladeshi-hilsa-fish", title: "Hilsa Fish Curry", cuisine: "bangladeshi", category: "main", difficulty: "medium" as const, time: 45, keyIngredients: ["hilsa fish", "mustard paste", "turmeric", "green chili"], flavor: "National fish - monsoon delicacy." },
  { slug: "bangladeshi-panta-bhat", title: "Panta Bhat", cuisine: "bangladeshi", category: "main", difficulty: "easy" as const, time: 480, keyIngredients: ["leftover rice", "water", "onion", "green chili"], flavor: "Fermented rice - New Year dish." },
  { slug: "bangladeshi-fuchka", title: "Fuchka (Pani Puri)", cuisine: "bangladeshi", category: "snack", difficulty: "medium" as const, time: 60, keyIngredients: ["puri shells", "tamarind water", "chickpeas", "potato"], flavor: "Street snack - tangy explosion." },
  { slug: "bangladeshi-singara", title: "Singara", cuisine: "bangladeshi", category: "snack", difficulty: "medium" as const, time: 60, keyIngredients: ["pastry", "potato", "peas", "spices"], flavor: "Bengali samosa - teatime favorite." },
  { slug: "sri-lankan-rice-curry", title: "Sri Lankan Rice and Curry", cuisine: "sri_lankan", category: "main", difficulty: "medium" as const, time: 90, keyIngredients: ["rice", "multiple curries", "sambol", "papadum"], flavor: "Full rice plate - balanced meal." },
  { slug: "sri-lankan-kottu", title: "Kottu Roti", cuisine: "sri_lankan", category: "main", difficulty: "medium" as const, time: 30, keyIngredients: ["roti", "vegetables", "egg", "curry sauce"], flavor: "Chopped flatbread stir-fry - street food." },
  { slug: "sri-lankan-hoppers", title: "Hoppers (Appa)", cuisine: "sri_lankan", category: "breakfast", difficulty: "medium" as const, time: 1440, keyIngredients: ["rice flour", "coconut milk", "yeast", "egg"], flavor: "Bowl-shaped pancake - breakfast staple." },
  { slug: "sri-lankan-string-hoppers", title: "String Hoppers", cuisine: "sri_lankan", category: "breakfast", difficulty: "hard" as const, time: 60, keyIngredients: ["rice flour", "water", "salt"], flavor: "Rice noodle nests - delicate texture." },
  { slug: "sri-lankan-lamprais", title: "Lamprais", cuisine: "sri_lankan", category: "main", difficulty: "hard" as const, time: 240, keyIngredients: ["rice", "mixed curry", "frikkadel", "banana leaf"], flavor: "Dutch-Burgher specialty - wrapped feast." },
  { slug: "sri-lankan-fish-ambulthiyal", title: "Fish Ambulthiyal", cuisine: "sri_lankan", category: "main", difficulty: "medium" as const, time: 60, keyIngredients: ["tuna", "goraka", "pepper", "curry leaves"], flavor: "Sour fish curry - unique preservation." },
  { slug: "sri-lankan-pol-sambol", title: "Pol Sambol", cuisine: "sri_lankan", category: "condiment", difficulty: "easy" as const, time: 15, keyIngredients: ["coconut", "chili", "onion", "lime"], flavor: "Coconut sambal - essential condiment." },
  { slug: "sri-lankan-watalappam", title: "Watalappam", cuisine: "sri_lankan", category: "dessert", difficulty: "medium" as const, time: 90, keyIngredients: ["jaggery", "coconut milk", "eggs", "cardamom"], flavor: "Malay pudding - festive dessert." },

  // ═══════════════════════════════════════════════════════════════════════════════
  // SOUTHEAST ASIAN EXPANSION (20)
  // ═══════════════════════════════════════════════════════════════════════════════
  { slug: "indonesian-gado-gado", title: "Gado Gado", cuisine: "indonesian", category: "main", difficulty: "medium" as const, time: 45, keyIngredients: ["vegetables", "tofu", "tempeh", "peanut sauce", "egg"], flavor: "Indonesian salad - peanut dressed." },
  { slug: "indonesian-soto-ayam", title: "Soto Ayam", cuisine: "indonesian", category: "soup", difficulty: "medium" as const, time: 90, keyIngredients: ["chicken", "turmeric", "lemongrass", "noodles", "eggs"], flavor: "Yellow chicken soup - breakfast comfort." },
  { slug: "indonesian-bakso", title: "Bakso", cuisine: "indonesian", category: "soup", difficulty: "medium" as const, time: 90, keyIngredients: ["beef balls", "noodles", "bok choy", "broth"], flavor: "Meatball soup - street food king." },
  { slug: "indonesian-mie-goreng", title: "Mie Goreng", cuisine: "indonesian", category: "main", difficulty: "easy" as const, time: 20, keyIngredients: ["noodles", "kecap manis", "vegetables", "egg"], flavor: "Fried noodles - sweet savory." },
  { slug: "indonesian-tempeh-goreng", title: "Tempeh Goreng", cuisine: "indonesian", category: "side", difficulty: "easy" as const, time: 20, keyIngredients: ["tempeh", "garlic", "coriander", "salt"], flavor: "Fried tempeh - protein snack." },
  { slug: "malaysian-nasi-lemak", title: "Nasi Lemak", cuisine: "malaysian", category: "main", difficulty: "medium" as const, time: 60, keyIngredients: ["coconut rice", "sambal", "anchovies", "egg", "peanuts"], flavor: "Malaysia national dish - fragrant coconut." },
  { slug: "malaysian-rendang", title: "Malaysian Rendang", cuisine: "malaysian", category: "main", difficulty: "hard" as const, time: 240, keyIngredients: ["beef", "coconut milk", "lemongrass", "galangal"], flavor: "Dry curry - slow-cooked perfection." },
  { slug: "malaysian-satay", title: "Malaysian Satay", cuisine: "malaysian", category: "appetizer", difficulty: "medium" as const, time: 120, keyIngredients: ["chicken", "turmeric", "lemongrass", "peanut sauce"], flavor: "Grilled skewers - night market favorite." },
  { slug: "malaysian-roti-canai", title: "Roti Canai", cuisine: "malaysian", category: "breakfast", difficulty: "hard" as const, time: 180, keyIngredients: ["flour", "ghee", "condensed milk", "dhal"], flavor: "Flaky flatbread - mamak stall essential." },
  { slug: "malaysian-curry-laksa", title: "Curry Laksa", cuisine: "malaysian", category: "soup", difficulty: "medium" as const, time: 60, keyIngredients: ["coconut milk", "curry paste", "noodles", "prawns"], flavor: "Spicy coconut noodle soup - Penang style." },
  { slug: "singaporean-chili-crab", title: "Chilli Crab", cuisine: "singaporean", category: "main", difficulty: "hard" as const, time: 45, keyIngredients: ["mud crab", "chili sauce", "tomato", "egg"], flavor: "Singapore iconic dish - sweet spicy." },
  { slug: "singaporean-bak-kut-teh", title: "Bak Kut Teh", cuisine: "singaporean", category: "soup", difficulty: "medium" as const, time: 180, keyIngredients: ["pork ribs", "garlic", "pepper", "herbs"], flavor: "Pork rib soup - Teochew style." },
  { slug: "singaporean-kaya-toast", title: "Kaya Toast", cuisine: "singaporean", category: "breakfast", difficulty: "easy" as const, time: 15, keyIngredients: ["bread", "kaya jam", "butter", "soft eggs"], flavor: "Coconut jam toast - kopitiam breakfast." },
  { slug: "burmese-mohinga", title: "Mohinga", cuisine: "burmese", category: "soup", difficulty: "hard" as const, time: 180, keyIngredients: ["catfish", "rice noodles", "banana stem", "lemongrass"], flavor: "Burma national dish - breakfast soup." },
  { slug: "burmese-tea-leaf-salad", title: "Lahpet Thoke", cuisine: "burmese", category: "salad", difficulty: "easy" as const, time: 20, keyIngredients: ["fermented tea leaves", "peanuts", "sesame", "garlic"], flavor: "Tea leaf salad - unique flavors." },
  { slug: "cambodian-amok", title: "Fish Amok", cuisine: "cambodian", category: "main", difficulty: "medium" as const, time: 60, keyIngredients: ["fish", "coconut milk", "kroeung paste", "egg"], flavor: "Cambodian curry mousse - steamed." },
  { slug: "cambodian-lok-lak", title: "Lok Lak", cuisine: "cambodian", category: "main", difficulty: "easy" as const, time: 25, keyIngredients: ["beef", "pepper sauce", "tomatoes", "onion"], flavor: "Stir-fried beef - Khmer classic." },
  { slug: "laotian-larb", title: "Larb (Laotian)", cuisine: "laotian", category: "salad", difficulty: "easy" as const, time: 20, keyIngredients: ["meat", "mint", "cilantro", "lime", "fish sauce"], flavor: "National dish of Laos - spicy salad." },
  { slug: "laotian-khao-piak-sen", title: "Khao Piak Sen", cuisine: "laotian", category: "soup", difficulty: "medium" as const, time: 120, keyIngredients: ["chicken", "tapioca noodles", "herbs", "lime"], flavor: "Lao chicken noodle soup - comfort." },
  { slug: "laotian-tam-mak-hoong", title: "Tam Mak Hoong", cuisine: "laotian", category: "salad", difficulty: "easy" as const, time: 15, keyIngredients: ["green papaya", "padaek", "tomatoes", "chili"], flavor: "Lao papaya salad - fermented fish." },

  // ═══════════════════════════════════════════════════════════════════════════════
  // LATINO/HISPANIC MEGA EXPANSION - CATEGORY DOMINANCE
  // ═══════════════════════════════════════════════════════════════════════════════

  // HONDURAN (20 recipes) - Large South Florida population
  { slug: "honduran-baleadas", title: "Baleadas", cuisine: "honduran", category: "main", difficulty: "easy" as const, time: 30, keyIngredients: ["flour tortilla", "refried beans", "cheese", "crema", "eggs"], flavor: "Honduras national street food - stuffed tortilla." },
  { slug: "honduran-sopa-de-caracol", title: "Sopa de Caracol", cuisine: "honduran", category: "soup", difficulty: "medium" as const, time: 90, keyIngredients: ["conch", "coconut milk", "yuca", "plantains", "cilantro"], flavor: "Garifuna conch soup - coastal treasure." },
  { slug: "honduran-plato-tipico", title: "Plato Típico", cuisine: "honduran", category: "main", difficulty: "medium" as const, time: 60, keyIngredients: ["carne asada", "beans", "rice", "plantains", "cheese"], flavor: "Traditional plate - complete meal." },
  { slug: "honduran-catrachas", title: "Catrachas", cuisine: "honduran", category: "appetizer", difficulty: "easy" as const, time: 25, keyIngredients: ["tortillas", "beans", "cheese", "salsa"], flavor: "Crispy tortilla bites - party snack." },
  { slug: "honduran-tamales", title: "Tamales Hondureños", cuisine: "honduran", category: "main", difficulty: "hard" as const, time: 240, keyIngredients: ["masa", "pork", "potatoes", "olives", "banana leaves"], flavor: "Christmas tamales - family tradition." },
  { slug: "honduran-pollo-con-tajadas", title: "Pollo con Tajadas", cuisine: "honduran", category: "main", difficulty: "medium" as const, time: 60, keyIngredients: ["fried chicken", "green plantains", "pickled onions", "chimol"], flavor: "Fried chicken with plantain chips - comfort food." },
  { slug: "honduran-sopa-de-mondongo", title: "Sopa de Mondongo", cuisine: "honduran", category: "soup", difficulty: "hard" as const, time: 240, keyIngredients: ["tripe", "vegetables", "cilantro", "lime"], flavor: "Tripe soup - Sunday tradition." },
  { slug: "honduran-yuca-con-chicharron", title: "Yuca con Chicharrón", cuisine: "honduran", category: "main", difficulty: "medium" as const, time: 60, keyIngredients: ["yuca", "pork belly", "pickled onions", "chimol"], flavor: "Fried yuca with crispy pork - street food." },
  { slug: "honduran-enchiladas", title: "Enchiladas Hondureñas", cuisine: "honduran", category: "appetizer", difficulty: "medium" as const, time: 45, keyIngredients: ["tortillas", "ground beef", "cabbage", "cheese", "tomato sauce"], flavor: "Honduran style tostadas - different from Mexican." },
  { slug: "honduran-nacatamales", title: "Nacatamales", cuisine: "honduran", category: "main", difficulty: "hard" as const, time: 300, keyIngredients: ["masa", "pork", "rice", "potatoes", "banana leaves"], flavor: "Giant tamales - special occasion." },
  { slug: "honduran-carne-asada", title: "Carne Asada Hondureña", cuisine: "honduran", category: "main", difficulty: "easy" as const, time: 45, keyIngredients: ["beef", "lime", "garlic", "chimol", "tortillas"], flavor: "Grilled beef - weekend BBQ." },
  { slug: "honduran-pupusas", title: "Pupusas Hondureñas", cuisine: "honduran", category: "main", difficulty: "medium" as const, time: 60, keyIngredients: ["masa", "cheese", "beans", "chicharron", "curtido"], flavor: "Stuffed corn cakes - shared with El Salvador." },
  { slug: "honduran-horchata", title: "Horchata Hondureña", cuisine: "honduran", category: "beverage", difficulty: "easy" as const, time: 240, keyIngredients: ["morro seeds", "rice", "cinnamon", "vanilla"], flavor: "Seed-based drink - unique recipe." },
  { slug: "honduran-atol-de-elote", title: "Atol de Elote", cuisine: "honduran", category: "beverage", difficulty: "easy" as const, time: 30, keyIngredients: ["corn", "milk", "sugar", "cinnamon"], flavor: "Sweet corn drink - breakfast favorite." },
  { slug: "honduran-licuados", title: "Licuados", cuisine: "honduran", category: "beverage", difficulty: "easy" as const, time: 10, keyIngredients: ["fruit", "milk", "sugar", "ice"], flavor: "Fresh fruit smoothies - tropical refreshment." },
  { slug: "honduran-pastelitos", title: "Pastelitos de Carne", cuisine: "honduran", category: "appetizer", difficulty: "medium" as const, time: 60, keyIngredients: ["pastry", "beef", "potatoes", "peas"], flavor: "Meat turnovers - party food." },
  { slug: "honduran-torrejas", title: "Torrejas", cuisine: "honduran", category: "dessert", difficulty: "easy" as const, time: 30, keyIngredients: ["bread", "eggs", "panela syrup", "cinnamon"], flavor: "Sweet french toast - Easter tradition." },
  { slug: "honduran-ayote-en-miel", title: "Ayote en Miel", cuisine: "honduran", category: "dessert", difficulty: "easy" as const, time: 60, keyIngredients: ["squash", "panela", "cinnamon", "cloves"], flavor: "Candied squash - fall dessert." },
  { slug: "honduran-arroz-con-leche", title: "Arroz con Leche Hondureño", cuisine: "honduran", category: "dessert", difficulty: "easy" as const, time: 45, keyIngredients: ["rice", "milk", "cinnamon", "raisins"], flavor: "Rice pudding - comfort dessert." },
  { slug: "honduran-platanos-en-gloria", title: "Plátanos en Gloria", cuisine: "honduran", category: "dessert", difficulty: "easy" as const, time: 30, keyIngredients: ["ripe plantains", "cream", "cinnamon", "sugar"], flavor: "Fried plantains in cream - heavenly." },

  // NICARAGUAN (20 recipes) - Miami has largest population outside Nicaragua
  { slug: "nicaraguan-gallo-pinto", title: "Gallo Pinto", cuisine: "nicaraguan", category: "main", difficulty: "easy" as const, time: 30, keyIngredients: ["rice", "red beans", "onion", "garlic", "Lizano sauce"], flavor: "National dish - spotted rooster rice." },
  { slug: "nicaraguan-nacatamal", title: "Nacatamal", cuisine: "nicaraguan", category: "main", difficulty: "hard" as const, time: 300, keyIngredients: ["masa", "pork", "rice", "potatoes", "banana leaves"], flavor: "Giant tamale - Saturday tradition." },
  { slug: "nicaraguan-vigoron", title: "Vigorón", cuisine: "nicaraguan", category: "main", difficulty: "easy" as const, time: 45, keyIngredients: ["yuca", "chicharron", "curtido", "banana leaf"], flavor: "Boiled yuca with pork - Granada specialty." },
  { slug: "nicaraguan-quesillo", title: "Quesillo", cuisine: "nicaraguan", category: "snack", difficulty: "easy" as const, time: 15, keyIngredients: ["tortilla", "cheese", "pickled onions", "crema"], flavor: "Cheese-stuffed tortilla - street snack." },
  { slug: "nicaraguan-indio-viejo", title: "Indio Viejo", cuisine: "nicaraguan", category: "main", difficulty: "medium" as const, time: 90, keyIngredients: ["shredded beef", "masa", "tomatoes", "achiote"], flavor: "Ancient stew - pre-Colombian recipe." },
  { slug: "nicaraguan-rondon", title: "Rondón", cuisine: "nicaraguan", category: "soup", difficulty: "hard" as const, time: 180, keyIngredients: ["fish", "coconut milk", "yuca", "plantains", "breadfruit"], flavor: "Caribbean coast stew - Creole heritage." },
  { slug: "nicaraguan-sopa-de-queso", title: "Sopa de Queso", cuisine: "nicaraguan", category: "soup", difficulty: "easy" as const, time: 30, keyIngredients: ["cheese", "milk", "eggs", "onion", "butter"], flavor: "Cheese soup - comfort food." },
  { slug: "nicaraguan-chancho-con-yuca", title: "Chancho con Yuca", cuisine: "nicaraguan", category: "main", difficulty: "medium" as const, time: 120, keyIngredients: ["pork", "yuca", "cabbage salad", "chimichurri"], flavor: "Pork and yuca - festive dish." },
  { slug: "nicaraguan-tajadas", title: "Tajadas con Queso", cuisine: "nicaraguan", category: "side", difficulty: "easy" as const, time: 20, keyIngredients: ["green plantains", "cheese", "sour cream"], flavor: "Fried plantain chips - universal side." },
  { slug: "nicaraguan-maduro-en-gloria", title: "Maduro en Gloria", cuisine: "nicaraguan", category: "dessert", difficulty: "easy" as const, time: 25, keyIngredients: ["ripe plantain", "cheese", "cream", "cinnamon"], flavor: "Fried plantain dessert - sweet and savory." },
  { slug: "nicaraguan-baho", title: "Baho", cuisine: "nicaraguan", category: "main", difficulty: "hard" as const, time: 240, keyIngredients: ["beef", "pork", "yuca", "plantains", "banana leaves"], flavor: "Steamed meat layers - Sunday feast." },
  { slug: "nicaraguan-caballo-bayo", title: "Caballo Bayo", cuisine: "nicaraguan", category: "main", difficulty: "easy" as const, time: 40, keyIngredients: ["rice", "beans", "steak", "plantains", "salad"], flavor: "Complete plate - lunch special." },
  { slug: "nicaraguan-sopa-de-mondongo", title: "Sopa de Mondongo Nica", cuisine: "nicaraguan", category: "soup", difficulty: "hard" as const, time: 240, keyIngredients: ["tripe", "vegetables", "oregano", "lime"], flavor: "Tripe soup - restorative." },
  { slug: "nicaraguan-vaho", title: "Vaho", cuisine: "nicaraguan", category: "main", difficulty: "medium" as const, time: 180, keyIngredients: ["beef brisket", "green plantains", "ripe plantains", "yuca"], flavor: "Banana leaf steam - traditional." },
  { slug: "nicaraguan-rosquillas", title: "Rosquillas", cuisine: "nicaraguan", category: "snack", difficulty: "medium" as const, time: 90, keyIngredients: ["corn", "cheese", "butter", "eggs"], flavor: "Corn cookies - coffee companion." },
  { slug: "nicaraguan-cosa-de-horno", title: "Cosa de Horno", cuisine: "nicaraguan", category: "dessert", difficulty: "medium" as const, time: 60, keyIngredients: ["corn", "cheese", "sugar", "butter"], flavor: "Baked corn pudding - sweet treat." },
  { slug: "nicaraguan-tres-leches", title: "Tres Leches Nicaragüense", cuisine: "nicaraguan", category: "dessert", difficulty: "medium" as const, time: 180, keyIngredients: ["cake", "three milks", "whipped cream", "rum"], flavor: "Soaked cake - celebration dessert." },
  { slug: "nicaraguan-pinolillo", title: "Pinolillo", cuisine: "nicaraguan", category: "beverage", difficulty: "easy" as const, time: 15, keyIngredients: ["corn flour", "cacao", "cinnamon", "water"], flavor: "National drink - corn and cacao." },
  { slug: "nicaraguan-chicha", title: "Chicha de Maíz", cuisine: "nicaraguan", category: "beverage", difficulty: "medium" as const, time: 1440, keyIngredients: ["purple corn", "sugar", "cinnamon"], flavor: "Fermented corn drink - traditional." },
  { slug: "nicaraguan-tiste", title: "Tiste", cuisine: "nicaraguan", category: "beverage", difficulty: "easy" as const, time: 20, keyIngredients: ["corn", "cacao", "achiote", "vanilla"], flavor: "Chocolate corn drink - refreshing." },

  // GUATEMALAN (20 recipes) - Large US population
  { slug: "guatemalan-pepian", title: "Pepián", cuisine: "guatemalan", category: "main", difficulty: "hard" as const, time: 180, keyIngredients: ["chicken", "pumpkin seeds", "sesame", "chilies", "tomatoes"], flavor: "National dish - ancient Mayan stew." },
  { slug: "guatemalan-kak-ik", title: "Kak'ik", cuisine: "guatemalan", category: "soup", difficulty: "hard" as const, time: 180, keyIngredients: ["turkey", "achiote", "chilies", "cilantro", "mint"], flavor: "Mayan turkey soup - red and spicy." },
  { slug: "guatemalan-jocon", title: "Jocón", cuisine: "guatemalan", category: "main", difficulty: "medium" as const, time: 90, keyIngredients: ["chicken", "tomatillos", "cilantro", "green onion", "pepitas"], flavor: "Green chicken stew - herbal bright." },
  { slug: "guatemalan-hilachas", title: "Hilachas", cuisine: "guatemalan", category: "main", difficulty: "medium" as const, time: 120, keyIngredients: ["shredded beef", "tomatoes", "tomatillos", "potatoes", "carrots"], flavor: "Shredded meat stew - comfort classic." },
  { slug: "guatemalan-tamales-colorados", title: "Tamales Colorados", cuisine: "guatemalan", category: "main", difficulty: "hard" as const, time: 300, keyIngredients: ["masa", "tomato recado", "chicken", "olives", "banana leaves"], flavor: "Red tamales - Christmas essential." },
  { slug: "guatemalan-tamales-negros", title: "Tamales Negros", cuisine: "guatemalan", category: "main", difficulty: "hard" as const, time: 300, keyIngredients: ["masa", "chocolate", "raisins", "prunes", "banana leaves"], flavor: "Sweet black tamales - holiday special." },
  { slug: "guatemalan-chiles-rellenos", title: "Chiles Rellenos Guatemaltecos", cuisine: "guatemalan", category: "main", difficulty: "medium" as const, time: 90, keyIngredients: ["pimiento peppers", "pork", "vegetables", "egg batter", "tomato sauce"], flavor: "Stuffed peppers - different from Mexican." },
  { slug: "guatemalan-caldo-de-res", title: "Caldo de Res", cuisine: "guatemalan", category: "soup", difficulty: "medium" as const, time: 150, keyIngredients: ["beef", "vegetables", "corn", "cilantro"], flavor: "Hearty beef soup - Sunday lunch." },
  { slug: "guatemalan-platanos-en-mole", title: "Plátanos en Mole", cuisine: "guatemalan", category: "main", difficulty: "medium" as const, time: 60, keyIngredients: ["ripe plantains", "chocolate mole", "sesame", "chilies"], flavor: "Plantains in mole - sweet savory." },
  { slug: "guatemalan-chuchitos", title: "Chuchitos", cuisine: "guatemalan", category: "main", difficulty: "medium" as const, time: 120, keyIngredients: ["masa", "tomato sauce", "pork", "corn husk"], flavor: "Small tamales - corn husk wrapped." },
  { slug: "guatemalan-tostadas", title: "Tostadas Guatemaltecas", cuisine: "guatemalan", category: "appetizer", difficulty: "easy" as const, time: 30, keyIngredients: ["tortillas", "guacamole", "beans", "salsa"], flavor: "Crispy tortillas topped - street food." },
  { slug: "guatemalan-garnachas", title: "Garnachas", cuisine: "guatemalan", category: "appetizer", difficulty: "easy" as const, time: 30, keyIngredients: ["tortillas", "beef", "onion", "cabbage", "salsa"], flavor: "Topped tortilla bites - party snack." },
  { slug: "guatemalan-fiambre", title: "Fiambre", cuisine: "guatemalan", category: "main", difficulty: "hard" as const, time: 480, keyIngredients: ["cold cuts", "cheeses", "vegetables", "pickles", "special dressing"], flavor: "All Saints Day salad - 50+ ingredients." },
  { slug: "guatemalan-revolcado", title: "Revolcado", cuisine: "guatemalan", category: "main", difficulty: "hard" as const, time: 180, keyIngredients: ["pig head", "tomatoes", "chilies", "loroco"], flavor: "Pork head stew - acquired taste." },
  { slug: "guatemalan-subanik", title: "Subanik", cuisine: "guatemalan", category: "main", difficulty: "hard" as const, time: 240, keyIngredients: ["three meats", "tomatoes", "chilies", "banana leaves"], flavor: "Three meat stew - ceremonial dish." },
  { slug: "guatemalan-rellenitos", title: "Rellenitos de Plátano", cuisine: "guatemalan", category: "dessert", difficulty: "medium" as const, time: 45, keyIngredients: ["ripe plantains", "black beans", "cinnamon", "sugar"], flavor: "Bean-stuffed plantain - sweet snack." },
  { slug: "guatemalan-champurradas", title: "Champurradas", cuisine: "guatemalan", category: "snack", difficulty: "medium" as const, time: 60, keyIngredients: ["flour", "sesame", "butter", "sugar"], flavor: "Sesame cookies - coffee time." },
  { slug: "guatemalan-canillitas-de-leche", title: "Canillitas de Leche", cuisine: "guatemalan", category: "dessert", difficulty: "medium" as const, time: 60, keyIngredients: ["milk", "sugar", "cinnamon", "vanilla"], flavor: "Milk candy - melt in mouth." },
  { slug: "guatemalan-atol-de-elote", title: "Atol de Elote", cuisine: "guatemalan", category: "beverage", difficulty: "easy" as const, time: 30, keyIngredients: ["corn", "milk", "sugar", "cinnamon"], flavor: "Sweet corn drink - warm comfort." },
  { slug: "guatemalan-rosa-de-jamaica", title: "Rosa de Jamaica", cuisine: "guatemalan", category: "beverage", difficulty: "easy" as const, time: 120, keyIngredients: ["hibiscus", "sugar", "lime"], flavor: "Hibiscus drink - refreshing." },

  // TEX-MEX (25 recipes) - Massive US search volume
  { slug: "tex-mex-nachos", title: "Loaded Nachos", cuisine: "tex_mex", category: "appetizer", difficulty: "easy" as const, time: 20, keyIngredients: ["tortilla chips", "cheese", "beans", "jalapeños", "sour cream"], flavor: "Ultimate appetizer - piled high." },
  { slug: "tex-mex-fajitas", title: "Sizzling Fajitas", cuisine: "tex_mex", category: "main", difficulty: "easy" as const, time: 30, keyIngredients: ["beef or chicken", "bell peppers", "onions", "lime", "tortillas"], flavor: "Sizzling platter - tableside drama." },
  { slug: "tex-mex-queso", title: "Queso Dip", cuisine: "tex_mex", category: "appetizer", difficulty: "easy" as const, time: 15, keyIngredients: ["Velveeta", "Rotel tomatoes", "chorizo", "jalapeños"], flavor: "Creamy cheese dip - addictive." },
  { slug: "tex-mex-chili-con-carne", title: "Texas Chili", cuisine: "tex_mex", category: "main", difficulty: "medium" as const, time: 180, keyIngredients: ["beef", "chilies", "cumin", "no beans"], flavor: "No beans chili - Texas style." },
  { slug: "tex-mex-enchiladas", title: "Tex-Mex Enchiladas", cuisine: "tex_mex", category: "main", difficulty: "medium" as const, time: 60, keyIngredients: ["tortillas", "beef", "chili gravy", "cheese", "onions"], flavor: "Chili gravy enchiladas - not Mexican." },
  { slug: "tex-mex-tacos", title: "Crispy Tacos", cuisine: "tex_mex", category: "main", difficulty: "easy" as const, time: 25, keyIngredients: ["hard shells", "ground beef", "lettuce", "cheese", "tomatoes"], flavor: "American taco night - family favorite." },
  { slug: "tex-mex-burrito", title: "Tex-Mex Burrito", cuisine: "tex_mex", category: "main", difficulty: "easy" as const, time: 20, keyIngredients: ["flour tortilla", "rice", "beans", "meat", "cheese"], flavor: "Giant wrapped burrito - filling meal." },
  { slug: "tex-mex-chimichanga", title: "Chimichanga", cuisine: "tex_mex", category: "main", difficulty: "medium" as const, time: 30, keyIngredients: ["flour tortilla", "beef", "beans", "cheese", "deep fried"], flavor: "Fried burrito - crispy outside." },
  { slug: "tex-mex-quesadilla", title: "Tex-Mex Quesadilla", cuisine: "tex_mex", category: "main", difficulty: "easy" as const, time: 15, keyIngredients: ["flour tortilla", "cheese", "chicken", "peppers"], flavor: "Cheese-filled tortilla - quick lunch." },
  { slug: "tex-mex-taco-salad", title: "Taco Salad", cuisine: "tex_mex", category: "main", difficulty: "easy" as const, time: 25, keyIngredients: ["tortilla bowl", "beef", "lettuce", "cheese", "salsa"], flavor: "Salad in edible bowl - healthier option." },
  { slug: "tex-mex-chalupa", title: "Chalupas", cuisine: "tex_mex", category: "appetizer", difficulty: "easy" as const, time: 20, keyIngredients: ["fried tortilla", "beans", "cheese", "lettuce", "tomatoes"], flavor: "Boat-shaped crispy tortilla." },
  { slug: "tex-mex-sopapillas", title: "Sopapillas", cuisine: "tex_mex", category: "dessert", difficulty: "easy" as const, time: 30, keyIngredients: ["flour", "baking powder", "honey", "cinnamon sugar"], flavor: "Fried dough pillows - honey drizzled." },
  { slug: "tex-mex-breakfast-tacos", title: "Breakfast Tacos", cuisine: "tex_mex", category: "breakfast", difficulty: "easy" as const, time: 20, keyIngredients: ["eggs", "bacon", "cheese", "potatoes", "tortillas"], flavor: "Texas breakfast - morning essential." },
  { slug: "tex-mex-migas", title: "Migas", cuisine: "tex_mex", category: "breakfast", difficulty: "easy" as const, time: 20, keyIngredients: ["eggs", "tortilla chips", "cheese", "jalapeños", "tomatoes"], flavor: "Scrambled eggs with chips - breakfast." },
  { slug: "tex-mex-huevos-rancheros", title: "Huevos Rancheros Tex-Mex", cuisine: "tex_mex", category: "breakfast", difficulty: "easy" as const, time: 25, keyIngredients: ["eggs", "tortillas", "ranchero sauce", "beans", "cheese"], flavor: "Ranch style eggs - hearty breakfast." },
  { slug: "tex-mex-tamale-pie", title: "Tamale Pie", cuisine: "tex_mex", category: "main", difficulty: "medium" as const, time: 60, keyIngredients: ["cornbread", "chili", "cheese", "olives"], flavor: "Casserole version of tamales - easy." },
  { slug: "tex-mex-king-ranch-chicken", title: "King Ranch Chicken", cuisine: "tex_mex", category: "main", difficulty: "medium" as const, time: 60, keyIngredients: ["chicken", "tortillas", "Rotel", "cream soup", "cheese"], flavor: "Texas casserole - potluck star." },
  { slug: "tex-mex-puffy-tacos", title: "Puffy Tacos", cuisine: "tex_mex", category: "main", difficulty: "medium" as const, time: 40, keyIngredients: ["masa", "beef", "lettuce", "cheese", "tomatoes"], flavor: "San Antonio specialty - air-puffed." },
  { slug: "tex-mex-taquitos", title: "Taquitos", cuisine: "tex_mex", category: "appetizer", difficulty: "easy" as const, time: 30, keyIngredients: ["corn tortillas", "beef or chicken", "cheese", "salsa"], flavor: "Rolled crispy tacos - party finger food." },
  { slug: "tex-mex-street-corn", title: "Tex-Mex Street Corn", cuisine: "tex_mex", category: "side", difficulty: "easy" as const, time: 15, keyIngredients: ["corn", "mayo", "cotija", "chili", "lime"], flavor: "Elote style corn - creamy spicy." },
  { slug: "tex-mex-guacamole", title: "Chunky Guacamole", cuisine: "tex_mex", category: "appetizer", difficulty: "easy" as const, time: 10, keyIngredients: ["avocados", "lime", "cilantro", "onion", "jalapeño"], flavor: "Fresh avocado dip - chip companion." },
  { slug: "tex-mex-pico-de-gallo", title: "Fresh Pico de Gallo", cuisine: "tex_mex", category: "condiment", difficulty: "easy" as const, time: 10, keyIngredients: ["tomatoes", "onion", "cilantro", "jalapeño", "lime"], flavor: "Fresh salsa - essential topping." },
  { slug: "tex-mex-salsa-verde", title: "Salsa Verde", cuisine: "tex_mex", category: "condiment", difficulty: "easy" as const, time: 20, keyIngredients: ["tomatillos", "jalapeños", "cilantro", "onion", "garlic"], flavor: "Green salsa - tangy fresh." },
  { slug: "tex-mex-refried-beans", title: "Refried Beans", cuisine: "tex_mex", category: "side", difficulty: "easy" as const, time: 30, keyIngredients: ["pinto beans", "lard", "onion", "garlic"], flavor: "Creamy beans - essential side." },
  { slug: "tex-mex-spanish-rice", title: "Spanish Rice", cuisine: "tex_mex", category: "side", difficulty: "easy" as const, time: 30, keyIngredients: ["rice", "tomato sauce", "cumin", "onion", "garlic"], flavor: "Restaurant-style rice - red and fluffy." },

  // SPANISH TAPAS & DISHES (20 recipes) - High search volume
  { slug: "spanish-paella-valenciana", title: "Authentic Paella Valenciana", cuisine: "spanish", category: "main", difficulty: "hard" as const, time: 90, keyIngredients: ["bomba rice", "saffron", "rabbit", "chicken", "green beans"], flavor: "Valencia original - crispy socarrat." },
  { slug: "spanish-paella-mixta", title: "Paella Mixta", cuisine: "spanish", category: "main", difficulty: "medium" as const, time: 75, keyIngredients: ["rice", "seafood", "chicken", "saffron", "peppers"], flavor: "Mixed paella - surf and turf." },
  { slug: "spanish-paella-mariscos", title: "Seafood Paella", cuisine: "spanish", category: "main", difficulty: "medium" as const, time: 60, keyIngredients: ["rice", "shrimp", "mussels", "clams", "saffron"], flavor: "All seafood - coastal favorite." },
  { slug: "spanish-tortilla-espanola", title: "Tortilla Española", cuisine: "spanish", category: "main", difficulty: "medium" as const, time: 45, keyIngredients: ["potatoes", "eggs", "onions", "olive oil"], flavor: "Spanish omelette - tapas essential." },
  { slug: "spanish-patatas-bravas", title: "Patatas Bravas", cuisine: "spanish", category: "appetizer", difficulty: "easy" as const, time: 40, keyIngredients: ["potatoes", "bravas sauce", "aioli", "paprika"], flavor: "Crispy potatoes - spicy sauce." },
  { slug: "spanish-gambas-al-ajillo", title: "Gambas al Ajillo", cuisine: "spanish", category: "appetizer", difficulty: "easy" as const, time: 15, keyIngredients: ["shrimp", "garlic", "olive oil", "chili", "parsley"], flavor: "Garlic shrimp - sizzling hot." },
  { slug: "spanish-chorizo-al-vino", title: "Chorizo al Vino", cuisine: "spanish", category: "appetizer", difficulty: "easy" as const, time: 20, keyIngredients: ["chorizo", "red wine", "bay leaves"], flavor: "Wine-braised sausage - tapas classic." },
  { slug: "spanish-jamon-serrano", title: "Jamón Serrano Platter", cuisine: "spanish", category: "appetizer", difficulty: "easy" as const, time: 10, keyIngredients: ["serrano ham", "manchego", "olives", "almonds"], flavor: "Cured ham - Spanish pride." },
  { slug: "spanish-croquetas", title: "Croquetas de Jamón", cuisine: "spanish", category: "appetizer", difficulty: "medium" as const, time: 180, keyIngredients: ["ham", "bechamel", "breadcrumbs", "eggs"], flavor: "Creamy ham croquettes - bar snack." },
  { slug: "spanish-gazpacho", title: "Gazpacho Andaluz", cuisine: "spanish", category: "soup", difficulty: "easy" as const, time: 20, keyIngredients: ["tomatoes", "cucumber", "peppers", "garlic", "olive oil"], flavor: "Cold tomato soup - summer refresher." },
  { slug: "spanish-fabada-asturiana", title: "Fabada Asturiana", cuisine: "spanish", category: "main", difficulty: "medium" as const, time: 180, keyIngredients: ["white beans", "chorizo", "morcilla", "pork"], flavor: "Asturian bean stew - hearty winter." },
  { slug: "spanish-cochinillo", title: "Cochinillo Asado", cuisine: "spanish", category: "main", difficulty: "hard" as const, time: 240, keyIngredients: ["suckling pig", "salt", "lard", "garlic"], flavor: "Roast suckling pig - Segovia specialty." },
  { slug: "spanish-pulpo-gallego", title: "Pulpo a la Gallega", cuisine: "spanish", category: "main", difficulty: "medium" as const, time: 90, keyIngredients: ["octopus", "potatoes", "paprika", "olive oil"], flavor: "Galician octopus - tender and paprika." },
  { slug: "spanish-pimientos-de-padron", title: "Pimientos de Padrón", cuisine: "spanish", category: "appetizer", difficulty: "easy" as const, time: 10, keyIngredients: ["padron peppers", "olive oil", "sea salt"], flavor: "Blistered peppers - Russian roulette." },
  { slug: "spanish-albondigas", title: "Albóndigas en Salsa", cuisine: "spanish", category: "main", difficulty: "medium" as const, time: 60, keyIngredients: ["meatballs", "tomato sauce", "wine", "garlic"], flavor: "Spanish meatballs - saucy comfort." },
  { slug: "spanish-escalivada", title: "Escalivada", cuisine: "spanish", category: "side", difficulty: "easy" as const, time: 60, keyIngredients: ["eggplant", "peppers", "onion", "olive oil"], flavor: "Roasted vegetables - Catalan style." },
  { slug: "spanish-pan-con-tomate", title: "Pan con Tomate", cuisine: "spanish", category: "appetizer", difficulty: "easy" as const, time: 10, keyIngredients: ["crusty bread", "tomatoes", "garlic", "olive oil"], flavor: "Tomato bread - Catalan breakfast." },
  { slug: "spanish-churros-chocolate", title: "Churros con Chocolate", cuisine: "spanish", category: "dessert", difficulty: "medium" as const, time: 45, keyIngredients: ["flour", "water", "eggs", "hot chocolate"], flavor: "Fried dough dipping - breakfast treat." },
  { slug: "spanish-flan", title: "Flan Español", cuisine: "spanish", category: "dessert", difficulty: "medium" as const, time: 90, keyIngredients: ["eggs", "milk", "sugar", "caramel"], flavor: "Classic caramel custard - silky smooth." },
  { slug: "spanish-sangria", title: "Sangria", cuisine: "spanish", category: "beverage", difficulty: "easy" as const, time: 240, keyIngredients: ["red wine", "brandy", "fruit", "orange juice", "sugar"], flavor: "Wine punch - party pitcher." },

  // COLOMBIAN (15 recipes)
  { slug: "colombian-bandeja-paisa", title: "Bandeja Paisa", cuisine: "colombian", category: "main", difficulty: "hard" as const, time: 120, keyIngredients: ["beans", "rice", "chicharron", "chorizo", "arepa", "egg", "avocado"], flavor: "Mega platter - national pride." },
  { slug: "colombian-ajiaco", title: "Ajiaco", cuisine: "colombian", category: "soup", difficulty: "medium" as const, time: 120, keyIngredients: ["chicken", "three potatoes", "corn", "guascas", "capers"], flavor: "Bogotá chicken soup - creamy layers." },
  { slug: "colombian-empanadas", title: "Empanadas Colombianas", cuisine: "colombian", category: "appetizer", difficulty: "medium" as const, time: 90, keyIngredients: ["corn masa", "beef", "potatoes", "aji"], flavor: "Corn empanadas - street favorite." },
  { slug: "colombian-arepa", title: "Arepas Colombianas", cuisine: "colombian", category: "side", difficulty: "easy" as const, time: 30, keyIngredients: ["corn flour", "cheese", "butter", "salt"], flavor: "Corn cakes - daily bread." },
  { slug: "colombian-arepa-de-huevo", title: "Arepa de Huevo", cuisine: "colombian", category: "main", difficulty: "medium" as const, time: 45, keyIngredients: ["corn masa", "egg", "beef", "oil"], flavor: "Egg-stuffed arepa - coastal specialty." },
  { slug: "colombian-sancocho", title: "Sancocho Colombiano", cuisine: "colombian", category: "soup", difficulty: "medium" as const, time: 150, keyIngredients: ["chicken", "yuca", "plantains", "corn", "potatoes"], flavor: "Hearty soup - hangover cure." },
  { slug: "colombian-lechona", title: "Lechona", cuisine: "colombian", category: "main", difficulty: "hard" as const, time: 720, keyIngredients: ["whole pig", "rice", "peas", "spices"], flavor: "Stuffed whole pig - Tolima pride." },
  { slug: "colombian-tamales", title: "Tamales Colombianos", cuisine: "colombian", category: "main", difficulty: "hard" as const, time: 300, keyIngredients: ["corn masa", "pork", "chicken", "vegetables", "banana leaves"], flavor: "Regional variations - Christmas essential." },
  { slug: "colombian-patacon", title: "Patacones", cuisine: "colombian", category: "side", difficulty: "easy" as const, time: 25, keyIngredients: ["green plantains", "oil", "salt"], flavor: "Twice-fried plantains - crunchy." },
  { slug: "colombian-hogao", title: "Hogao", cuisine: "colombian", category: "condiment", difficulty: "easy" as const, time: 20, keyIngredients: ["tomatoes", "onion", "garlic", "cumin", "oil"], flavor: "Colombian sofrito - flavor base." },
  { slug: "colombian-buñuelos", title: "Buñuelos", cuisine: "colombian", category: "snack", difficulty: "medium" as const, time: 45, keyIngredients: ["cheese", "cornstarch", "eggs", "oil"], flavor: "Cheese balls - Christmas tradition." },
  { slug: "colombian-natilla", title: "Natilla", cuisine: "colombian", category: "dessert", difficulty: "medium" as const, time: 60, keyIngredients: ["milk", "panela", "cornstarch", "cinnamon"], flavor: "Corn custard - holiday dessert." },
  { slug: "colombian-arroz-con-coco", title: "Arroz con Coco", cuisine: "colombian", category: "side", difficulty: "medium" as const, time: 60, keyIngredients: ["rice", "coconut", "sugar", "raisins"], flavor: "Sweet coconut rice - coastal favorite." },
  { slug: "colombian-lulada", title: "Lulada", cuisine: "colombian", category: "beverage", difficulty: "easy" as const, time: 15, keyIngredients: ["lulo fruit", "lime", "sugar", "water"], flavor: "Lulo drink - Cali specialty." },
  { slug: "colombian-aguapanela", title: "Aguapanela", cuisine: "colombian", category: "beverage", difficulty: "easy" as const, time: 15, keyIngredients: ["panela", "water", "lime"], flavor: "Cane sugar drink - energy boost." },

  // VENEZUELAN (15 recipes)
  { slug: "venezuelan-arepa", title: "Arepas Venezolanas", cuisine: "venezuelan", category: "main", difficulty: "easy" as const, time: 30, keyIngredients: ["harina pan", "water", "salt", "fillings"], flavor: "Corn pockets - national icon." },
  { slug: "venezuelan-arepa-reina-pepiada", title: "Reina Pepiada", cuisine: "venezuelan", category: "main", difficulty: "easy" as const, time: 30, keyIngredients: ["arepa", "chicken", "avocado", "mayo"], flavor: "Queen arepa filling - classic." },
  { slug: "venezuelan-pabellon-criollo", title: "Pabellón Criollo", cuisine: "venezuelan", category: "main", difficulty: "medium" as const, time: 90, keyIngredients: ["shredded beef", "black beans", "rice", "plantains", "cheese"], flavor: "National dish - complete plate." },
  { slug: "venezuelan-hallaca", title: "Hallacas", cuisine: "venezuelan", category: "main", difficulty: "hard" as const, time: 480, keyIngredients: ["corn dough", "stew", "olives", "raisins", "banana leaves"], flavor: "Christmas tamale - labor of love." },
  { slug: "venezuelan-cachapa", title: "Cachapas", cuisine: "venezuelan", category: "main", difficulty: "easy" as const, time: 30, keyIngredients: ["fresh corn", "cheese", "butter"], flavor: "Sweet corn pancake - queso de mano." },
  { slug: "venezuelan-tequeños", title: "Tequeños", cuisine: "venezuelan", category: "appetizer", difficulty: "medium" as const, time: 60, keyIngredients: ["dough", "white cheese", "oil"], flavor: "Cheese sticks - party essential." },
  { slug: "venezuelan-empanadas", title: "Empanadas Venezolanas", cuisine: "venezuelan", category: "appetizer", difficulty: "medium" as const, time: 60, keyIngredients: ["corn flour", "cheese", "beans", "beef"], flavor: "Corn empanadas - various fillings." },
  { slug: "venezuelan-patacon", title: "Patacón Venezolano", cuisine: "venezuelan", category: "main", difficulty: "medium" as const, time: 40, keyIngredients: ["green plantains", "beef", "cheese", "toppings"], flavor: "Plantain sandwich - stuffed and loaded." },
  { slug: "venezuelan-asado-negro", title: "Asado Negro", cuisine: "venezuelan", category: "main", difficulty: "medium" as const, time: 180, keyIngredients: ["beef", "papelón", "onions", "spices"], flavor: "Black roast - caramelized meat." },
  { slug: "venezuelan-mondongo", title: "Mondongo Venezolano", cuisine: "venezuelan", category: "soup", difficulty: "hard" as const, time: 240, keyIngredients: ["tripe", "vegetables", "corn", "chickpeas"], flavor: "Tripe soup - Sunday tradition." },
  { slug: "venezuelan-hervido", title: "Hervido de Gallina", cuisine: "venezuelan", category: "soup", difficulty: "medium" as const, time: 120, keyIngredients: ["hen", "vegetables", "corn", "yuca"], flavor: "Hen soup - comfort food." },
  { slug: "venezuelan-golfeados", title: "Golfeados", cuisine: "venezuelan", category: "dessert", difficulty: "medium" as const, time: 180, keyIngredients: ["dough", "papelón", "cheese", "anise"], flavor: "Sweet rolls - sticky buns." },
  { slug: "venezuelan-quesillo", title: "Quesillo", cuisine: "venezuelan", category: "dessert", difficulty: "medium" as const, time: 90, keyIngredients: ["eggs", "condensed milk", "caramel"], flavor: "Venezuelan flan - silky smooth." },
  { slug: "venezuelan-chicha", title: "Chicha Venezolana", cuisine: "venezuelan", category: "beverage", difficulty: "easy" as const, time: 20, keyIngredients: ["rice", "condensed milk", "cinnamon", "vanilla"], flavor: "Rice drink - sweet and creamy." },
  { slug: "venezuelan-papelón-con-limón", title: "Papelón con Limón", cuisine: "venezuelan", category: "beverage", difficulty: "easy" as const, time: 15, keyIngredients: ["panela", "lime", "water"], flavor: "Cane sugar lemonade - refreshing." },

  // PERUVIAN (15 recipes)
  { slug: "peruvian-ceviche", title: "Ceviche Peruano", cuisine: "peruvian", category: "main", difficulty: "medium" as const, time: 30, keyIngredients: ["sea bass", "lime", "red onion", "aji amarillo", "cilantro"], flavor: "Citrus-cured fish - national pride." },
  { slug: "peruvian-lomo-saltado", title: "Lomo Saltado", cuisine: "peruvian", category: "main", difficulty: "easy" as const, time: 30, keyIngredients: ["beef", "tomatoes", "onion", "soy sauce", "fries"], flavor: "Stir-fried beef - chifa fusion." },
  { slug: "peruvian-aji-de-gallina", title: "Ají de Gallina", cuisine: "peruvian", category: "main", difficulty: "medium" as const, time: 90, keyIngredients: ["chicken", "aji amarillo", "walnuts", "bread", "cheese"], flavor: "Creamy chicken - yellow pepper sauce." },
  { slug: "peruvian-papa-a-la-huancaina", title: "Papa a la Huancaína", cuisine: "peruvian", category: "appetizer", difficulty: "easy" as const, time: 30, keyIngredients: ["potatoes", "aji amarillo", "cheese", "crackers", "milk"], flavor: "Potatoes in creamy sauce - classic." },
  { slug: "peruvian-causa", title: "Causa Limeña", cuisine: "peruvian", category: "appetizer", difficulty: "medium" as const, time: 60, keyIngredients: ["potato", "aji amarillo", "chicken", "avocado", "lime"], flavor: "Layered potato dish - cold appetizer." },
  { slug: "peruvian-arroz-con-pollo", title: "Arroz con Pollo Peruano", cuisine: "peruvian", category: "main", difficulty: "medium" as const, time: 75, keyIngredients: ["rice", "chicken", "cilantro", "beer", "peas"], flavor: "Green chicken rice - cilantro heavy." },
  { slug: "peruvian-tacu-tacu", title: "Tacu Tacu", cuisine: "peruvian", category: "main", difficulty: "medium" as const, time: 45, keyIngredients: ["rice", "beans", "egg", "steak"], flavor: "Rice and bean patty - topped with steak." },
  { slug: "peruvian-seco-de-cordero", title: "Seco de Cordero", cuisine: "peruvian", category: "main", difficulty: "medium" as const, time: 180, keyIngredients: ["lamb", "cilantro", "beer", "beans"], flavor: "Lamb stew - Northern specialty." },
  { slug: "peruvian-rocoto-relleno", title: "Rocoto Relleno", cuisine: "peruvian", category: "main", difficulty: "hard" as const, time: 120, keyIngredients: ["rocoto peppers", "beef", "cheese", "egg"], flavor: "Stuffed hot peppers - Arequipa dish." },
  { slug: "peruvian-cau-cau", title: "Cau Cau", cuisine: "peruvian", category: "main", difficulty: "medium" as const, time: 90, keyIngredients: ["tripe", "potatoes", "turmeric", "mint", "peas"], flavor: "Tripe stew - yellow and minty." },
  { slug: "peruvian-tiradito", title: "Tiradito", cuisine: "peruvian", category: "appetizer", difficulty: "easy" as const, time: 20, keyIngredients: ["fish", "aji amarillo", "lime", "ginger"], flavor: "Sashimi-style ceviche - no onion." },
  { slug: "peruvian-alfajores", title: "Alfajores Peruanos", cuisine: "peruvian", category: "dessert", difficulty: "medium" as const, time: 60, keyIngredients: ["cornstarch cookies", "dulce de leche", "powdered sugar"], flavor: "Sandwich cookies - melt in mouth." },
  { slug: "peruvian-picarones", title: "Picarones", cuisine: "peruvian", category: "dessert", difficulty: "medium" as const, time: 60, keyIngredients: ["sweet potato", "squash", "anise", "chancaca syrup"], flavor: "Peruvian donuts - syrup drizzled." },
  { slug: "peruvian-chicha-morada", title: "Chicha Morada", cuisine: "peruvian", category: "beverage", difficulty: "easy" as const, time: 90, keyIngredients: ["purple corn", "cinnamon", "cloves", "lime"], flavor: "Purple corn drink - sweet and spiced." },
  { slug: "peruvian-pisco-sour", title: "Pisco Sour", cuisine: "peruvian", category: "beverage", difficulty: "easy" as const, time: 10, keyIngredients: ["pisco", "lime", "egg white", "bitters", "syrup"], flavor: "National cocktail - frothy and sour." },
];

// Generate full recipes
const fullRecipes: FullRecipe[] = recipeDatabase.map(r => generateRecipe(r));

const cuisineLabels: Record<string, string> = {
  jamaican: "Jamaican", haitian: "Haitian", cuban: "Cuban", nigerian: "Nigerian",
  vietnamese: "Vietnamese", indian: "Indian", mexican: "Mexican", thai: "Thai",
  korean: "Korean", chinese: "Chinese", ethiopian: "Ethiopian", trinidadian: "Trinidadian",
  puerto_rican: "Puerto Rican", ghanaian: "Ghanaian", dominican: "Dominican", filipino: "Filipino",
  senegalese: "Senegalese", cameroonian: "Cameroonian", ivorian: "Ivorian", liberian: "Liberian",
  sierra_leonean: "Sierra Leonean", gambian: "Gambian", somali: "Somali", kenyan: "Kenyan",
  pakistani: "Pakistani", bangladeshi: "Bangladeshi", sri_lankan: "Sri Lankan",
  indonesian: "Indonesian", malaysian: "Malaysian", singaporean: "Singaporean",
  burmese: "Burmese", cambodian: "Cambodian", laotian: "Laotian",
  japanese: "Japanese", greek: "Greek", middle_eastern: "Middle Eastern", peruvian: "Peruvian",
  argentinian: "Argentinian", venezuelan: "Venezuelan", salvadoran: "Salvadoran", colombian: "Colombian",
  ukrainian: "Ukrainian", polish: "Polish", austrian: "Austrian", french: "French", italian: "Italian",
  cajun: "Cajun", spanish: "Spanish",
  honduran: "Honduran", nicaraguan: "Nicaraguan", guatemalan: "Guatemalan", tex_mex: "Tex-Mex"
};

export default async function recipesExpandedRoutes(app: FastifyInstance) {
  // List all recipes with filtering
  app.get("/", async (req, reply) => {
    const { cuisine, difficulty, category, page = "1", limit = "20" } = req.query as Record<string, string>;
    let recipes = [...fullRecipes];
    if (cuisine) recipes = recipes.filter(r => r.cuisine === cuisine);
    if (difficulty) recipes = recipes.filter(r => r.difficulty === difficulty);
    if (category) recipes = recipes.filter(r => r.category === category);
    const p = parseInt(page), l = parseInt(limit), start = (p - 1) * l;
    return reply.send({ 
      ok: true, 
      data: recipes.slice(start, start + l), 
      pagination: { page: p, limit: l, total: recipes.length, pages: Math.ceil(recipes.length / l) } 
    });
  });

  // Get single recipe by slug
  app.get("/:slug", async (req, reply) => {
    const { slug } = req.params as { slug: string };
    const recipe = fullRecipes.find(r => r.slug === slug);
    if (!recipe) return reply.status(404).send({ ok: false, error: "Recipe not found" });
    return reply.send({
      ok: true,
      data: {
        ...recipe,
        cuisineLabel: cuisineLabels[recipe.cuisine],
        totalTime: recipe.prepTime + recipe.cookTime,
        metaTitle: `${recipe.title} Recipe | Authentic ${cuisineLabels[recipe.cuisine]} | StoresGo`,
        metaDescription: recipe.description.substring(0, 155),
        relatedRecipes: fullRecipes.filter(r => r.cuisine === recipe.cuisine && r.slug !== slug).slice(0, 4).map(r => ({ slug: r.slug, title: r.title }))
      }
    });
  });

  // Get recipes by cuisine
  app.get("/cuisine/:cuisine", async (req, reply) => {
    const { cuisine } = req.params as { cuisine: string };
    const cuisineKey = cuisine.replace("-", "_");
    const recipes = fullRecipes.filter(r => r.cuisine === cuisine || r.cuisine === cuisineKey);
    if (!recipes.length) return reply.status(404).send({ ok: false, error: "Cuisine not found" });
    return reply.send({ 
      ok: true, 
      data: recipes, 
      cuisine: { slug: cuisine, label: cuisineLabels[cuisine] || cuisineLabels[cuisineKey] }, 
      total: recipes.length 
    });
  });

  // Sitemap slugs
  app.get("/sitemap/slugs", async (req, reply) => {
    return reply.send({ ok: true, data: fullRecipes.map(r => r.slug), total: fullRecipes.length });
  });

  // Stats
  app.get("/stats", async (req, reply) => {
    const byCuisine = fullRecipes.reduce((acc, r) => { 
      acc[r.cuisine] = (acc[r.cuisine] || 0) + 1; 
      return acc; 
    }, {} as Record<string, number>);
    
    const stats = Object.entries(byCuisine).map(([c, n]) => ({ 
      cuisine: c, 
      label: cuisineLabels[c], 
      count: n 
    }));
    
    return reply.send({ 
      ok: true, 
      data: { 
        totalRecipes: fullRecipes.length, 
        cuisines: stats, 
        difficulty: { 
          easy: fullRecipes.filter(r => r.difficulty === "easy").length, 
          medium: fullRecipes.filter(r => r.difficulty === "medium").length, 
          hard: fullRecipes.filter(r => r.difficulty === "hard").length 
        } 
      } 
    });
  });

  // Get recipes by tag (difficulty, cuisine, ingredient tags)
  app.get("/tag/:tag", async (req, reply) => {
    const { tag } = req.params as { tag: string };
    const tagLower = tag.toLowerCase().replace(/%20/g, " ").replace(/-/g, "_");
    
    // Check if it's a difficulty tag
    if (["easy", "medium", "hard"].includes(tagLower)) {
      const recipes = fullRecipes.filter(r => r.difficulty === tagLower);
      return reply.send({
        ok: true,
        data: {
          formattedTag: tagLower.charAt(0).toUpperCase() + tagLower.slice(1),
          totalCount: recipes.length,
          recipes: recipes.map(r => ({
            slug: r.slug,
            name: r.title,
            description: r.description,
            cuisine: r.cuisine,
            difficulty: r.difficulty,
            time: r.prepTime + r.cookTime
          })),
          seo: {
            title: `${tagLower.charAt(0).toUpperCase() + tagLower.slice(1)} Recipes | StoresGo`,
            description: `Discover ${recipes.length} ${tagLower} recipes. Perfect for ${tagLower === 'easy' ? 'beginners' : tagLower === 'hard' ? 'experienced cooks' : 'home cooks'}.`
          }
        }
      });
    }
    
    // Check if it's a cuisine tag
    const cuisineKey = tagLower.replace(/ /g, "_");
    if (cuisineLabels[cuisineKey]) {
      const recipes = fullRecipes.filter(r => r.cuisine === cuisineKey);
      return reply.send({
        ok: true,
        data: {
          formattedTag: cuisineLabels[cuisineKey],
          totalCount: recipes.length,
          recipes: recipes.map(r => ({
            slug: r.slug,
            name: r.title,
            description: r.description,
            cuisine: r.cuisine,
            difficulty: r.difficulty,
            time: r.prepTime + r.cookTime
          })),
          seo: {
            title: `${cuisineLabels[cuisineKey]} Recipes | StoresGo`,
            description: `Discover ${recipes.length} authentic ${cuisineLabels[cuisineKey]} recipes.`
          }
        }
      });
    }
    
    // Search by ingredient/tag in recipe tags
    const recipes = fullRecipes.filter(r => 
      r.tags?.some(t => t.toLowerCase().includes(tagLower)) ||
      r.ingredients?.some(i => i.toLowerCase().includes(tagLower))
    );
    
    if (!recipes.length) {
      return reply.status(404).send({ ok: false, error: "Tag not found" });
    }
    
    const formattedTag = tag.replace(/%20/g, " ").replace(/-/g, " ").split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    
    return reply.send({
      ok: true,
      data: {
        formattedTag,
        totalCount: recipes.length,
        recipes: recipes.map(r => ({
          slug: r.slug,
          name: r.title,
          description: r.description,
          cuisine: r.cuisine,
          difficulty: r.difficulty,
          time: r.prepTime + r.cookTime
        })),
        seo: {
          title: `${formattedTag} Recipes | StoresGo`,
          description: `Discover ${recipes.length} recipes featuring ${formattedTag.toLowerCase()}.`
        }
      }
    });
  });

  // Get recipes by category (main, side, appetizer, soup, dessert, etc.)
  app.get("/category/:category", async (req, reply) => {
    const { category } = req.params as { category: string };
    const categoryLower = category.toLowerCase();
    
    const categoryInfo: Record<string, { name: string; icon: string; description: string }> = {
      main: { name: "Main Dishes", icon: "🍖", description: "Hearty main courses from around the world" },
      side: { name: "Side Dishes", icon: "🥗", description: "Perfect accompaniments to complete your meal" },
      appetizer: { name: "Appetizers", icon: "🥟", description: "Starters and snacks to kick off your meal" },
      soup: { name: "Soups & Stews", icon: "🍲", description: "Warming soups and hearty stews" },
      dessert: { name: "Desserts", icon: "🍮", description: "Sweet treats to end your meal" },
      breakfast: { name: "Breakfast", icon: "🍳", description: "Morning favorites to start your day" },
      drink: { name: "Drinks & Beverages", icon: "🥤", description: "Refreshing drinks and traditional beverages" },
      beverage: { name: "Drinks & Beverages", icon: "🥤", description: "Refreshing drinks and traditional beverages" },
      snack: { name: "Snacks", icon: "🍿", description: "Quick bites and street food favorites" },
      condiment: { name: "Condiments & Sauces", icon: "🫙", description: "Essential sauces and accompaniments" },
      bread: { name: "Breads", icon: "🍞", description: "Fresh breads and baked goods" }
    };
    
    const recipes = fullRecipes.filter(r => r.category === categoryLower);
    
    if (!recipes.length) {
      return reply.status(404).send({ ok: false, error: "Category not found" });
    }
    
    const catInfo = categoryInfo[categoryLower] || { 
      name: category.charAt(0).toUpperCase() + category.slice(1), 
      icon: "🍽️", 
      description: `Delicious ${category} recipes` 
    };
    
    return reply.send({
      ok: true,
      data: {
        category: {
          slug: categoryLower,
          name: catInfo.name,
          icon: catInfo.icon,
          description: catInfo.description
        },
        totalCount: recipes.length,
        recipes: recipes.map(r => ({
          slug: r.slug,
          name: r.title,
          description: r.description,
          cuisine: r.cuisine,
          cuisineLabel: cuisineLabels[r.cuisine],
          difficulty: r.difficulty,
          time: r.prepTime + r.cookTime
        })),
        seo: {
          title: `${catInfo.name} Recipes | Authentic Ethnic Cuisine | StoresGo`,
          description: `Discover ${recipes.length} authentic ${catInfo.name.toLowerCase()} recipes from Caribbean, Latin, Asian, and African cuisines.`
        }
      }
    });
  });
  // Get recipes by collection (quick, easy, vegan, etc.)
  app.get("/collection/:collection", async (req, reply) => {
    const { collection } = req.params as { collection: string };
    const collectionLower = collection.toLowerCase();
    
    let recipes: typeof fullRecipes = [];
    let title = "";
    let description = "";
    
    switch (collectionLower) {
      case "quick":
        recipes = fullRecipes.filter(r => (r.prepTime + r.cookTime) <= 30);
        title = "Quick Recipes (Under 30 Minutes)";
        description = "Delicious recipes you can make in 30 minutes or less.";
        break;
      case "easy":
        recipes = fullRecipes.filter(r => r.difficulty === "easy");
        title = "Easy Recipes for Beginners";
        description = "Simple, foolproof recipes perfect for beginners.";
        break;
      case "weekend":
        recipes = fullRecipes.filter(r => r.difficulty === "hard" || (r.prepTime + r.cookTime) > 120);
        title = "Weekend Project Recipes";
        description = "Special recipes worth the extra time and effort.";
        break;
      case "vegetarian":
      case "vegan":
        recipes = fullRecipes.filter(r => 
          r.tags?.some(t => t.toLowerCase().includes("vegan") || t.toLowerCase().includes("vegetarian")) ||
          !r.ingredients?.some(i => 
            i.toLowerCase().includes("chicken") || 
            i.toLowerCase().includes("beef") || 
            i.toLowerCase().includes("pork") ||
            i.toLowerCase().includes("fish") ||
            i.toLowerCase().includes("meat") ||
            i.toLowerCase().includes("goat")
          )
        );
        title = collectionLower === "vegan" ? "Vegan Recipes" : "Vegetarian Recipes";
        description = `Plant-based ${collectionLower} recipes from around the world.`;
        break;
      case "spicy":
        recipes = fullRecipes.filter(r => 
          r.ingredients?.some(i => 
            i.toLowerCase().includes("scotch bonnet") || 
            i.toLowerCase().includes("habanero") ||
            i.toLowerCase().includes("chili") ||
            i.toLowerCase().includes("pepper")
          )
        );
        title = "Spicy Recipes";
        description = "Bring the heat with these spicy dishes.";
        break;
      default:
        return reply.status(404).send({ ok: false, error: "Collection not found" });
    }
    
    return reply.send({
      ok: true,
      data: {
        collection: collectionLower,
        formattedCollection: title,
        totalCount: recipes.length,
        recipes: recipes.map(r => ({
          slug: r.slug,
          name: r.title,
          description: r.description,
          cuisine: r.cuisine,
          cuisineLabel: cuisineLabels[r.cuisine],
          difficulty: r.difficulty,
          time: r.prepTime + r.cookTime
        })),
        seo: {
          title: `${title} | StoresGo`,
          description: `${description} ${recipes.length} recipes to explore.`
        }
      }
    });
  });
}
