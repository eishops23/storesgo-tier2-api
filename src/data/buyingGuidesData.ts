/**
 * StoresGo Buying Guides
 * Educational content for SEO + trust building
 */

export interface BuyingGuide {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  cuisine: string;
  cuisineSlug: string;
  category: string;
  heroImage?: string;
  intro: string;
  sections: { heading: string; content: string }[];
  tips: string[];
  relatedProducts: string[];
  keywords: string[];
}

export const BUYING_GUIDES: BuyingGuide[] = [
  {
    slug: "how-to-choose-plantains",
    title: "How to Choose the Perfect Plantains",
    metaTitle: "How to Choose Plantains: Green vs Yellow vs Black | Buying Guide",
    metaDescription: "Learn how to choose the right plantains for your recipe. Guide to green plantains for tostones, yellow for maduros, and black for the sweetest dishes.",
    cuisine: "Caribbean",
    cuisineSlug: "caribbean",
    category: "Produce",
    intro: "Plantains are a staple in Caribbean, Latin, and African cooking. Unlike bananas, plantains must be cooked and their ripeness determines how you'll use them. This guide helps you choose the perfect plantains for any recipe.",
    sections: [
      { heading: "Green Plantains (Plátanos Verdes)", content: "Green plantains are unripe and starchy, similar to potatoes. They're firm, hard to peel, and have no sweetness. Perfect for: Tostones (twice-fried plantains), Mofongo, Chips, Soups and stews. Look for: Bright green color, very firm texture, no black spots." },
      { heading: "Yellow Plantains (Plátanos Maduros)", content: "Yellow plantains are semi-ripe with some sweetness developing. The skin is yellow with some black spots. Perfect for: Maduros (sweet fried plantains), Plantain porridge, Some mofongo recipes. Look for: Yellow color with black spots, slightly soft but not mushy." },
      { heading: "Black Plantains (Plátanos Muy Maduros)", content: "Black plantains are fully ripe and very sweet. The skin is mostly or completely black. Perfect for: Extra-sweet maduros, Plantain bread, Desserts. Look for: Mostly black skin, soft to touch, sweet aroma." }
    ],
    tips: [
      "Buy green plantains several days ahead and let them ripen at room temperature",
      "To speed ripening, place in a paper bag with a banana",
      "Never refrigerate green plantains - it stops the ripening process",
      "Black plantains can be refrigerated to slow further ripening",
      "One plantain typically serves 1-2 people as a side dish"
    ],
    relatedProducts: ["plantains", "green plantains", "ripe plantains", "platanos", "cooking bananas"],
    keywords: ["how to choose plantains", "plantain ripeness", "green vs yellow plantains", "plantains for tostones", "plantains for maduros"]
  },
  {
    slug: "guide-to-scotch-bonnet-peppers",
    title: "The Complete Guide to Scotch Bonnet Peppers",
    metaTitle: "Scotch Bonnet Peppers Guide: Heat, Uses & Substitutes | StoresGo",
    metaDescription: "Everything about Scotch Bonnet peppers: heat level, flavor profile, how to use them in Caribbean cooking, and the best substitutes if you can't find them.",
    cuisine: "Jamaican",
    cuisineSlug: "jamaican",
    category: "Produce",
    intro: "Scotch Bonnet peppers are the soul of Caribbean cooking, especially in Jamaican cuisine. These fiery peppers pack serious heat but also deliver a unique fruity flavor that's irreplaceable in authentic Caribbean dishes.",
    sections: [
      { heading: "Heat Level & Flavor", content: "Scotch Bonnets rate 100,000-350,000 on the Scoville scale - about 40x hotter than jalapeños. But they're not just about heat. They have a distinctive fruity, slightly sweet flavor with hints of apple and tomato that defines Caribbean cuisine." },
      { heading: "Common Uses", content: "Essential in: Jerk seasoning and marinades, Jamaican pepper sauce, Curry goat and chicken, Rice and peas, Escovitch fish, Pepper pot soup. The flavor is so distinct that substitutes never quite match authentic Caribbean taste." },
      { heading: "How to Handle", content: "Always wear gloves when cutting Scotch Bonnets. The oils can burn skin for hours. Never touch your face, especially eyes. For less heat, remove the seeds and white membrane - that's where most capsaicin lives." },
      { heading: "Substitutes", content: "If you can't find Scotch Bonnets: Habanero peppers (closest match, same heat level), Caribbean Red peppers, For less heat: serrano + a drop of mango extract for fruitiness" }
    ],
    tips: [
      "For flavor without extreme heat, add whole pepper to cooking and remove before serving",
      "Freeze extras - they keep for months and are easier to chop when frozen",
      "A little goes a long way - start with 1/4 pepper and add more",
      "Look for peppers that are firm with no soft spots",
      "Colors range from green to yellow to red - all are usable but red is ripest"
    ],
    relatedProducts: ["scotch bonnet peppers", "hot peppers", "caribbean peppers", "jerk seasoning", "pepper sauce"],
    keywords: ["scotch bonnet peppers", "jamaican peppers", "caribbean hot peppers", "jerk pepper", "scotch bonnet substitute"]
  },
  {
    slug: "essential-caribbean-pantry",
    title: "Building Your Essential Caribbean Pantry",
    metaTitle: "Caribbean Pantry Essentials: Must-Have Ingredients | StoresGo",
    metaDescription: "Stock your kitchen with essential Caribbean pantry items. Complete guide to Caribbean spices, seasonings, canned goods, and staples for authentic island cooking.",
    cuisine: "Caribbean",
    cuisineSlug: "caribbean",
    category: "Pantry",
    intro: "Building a well-stocked Caribbean pantry means having the right spices, seasonings, and staples on hand to create authentic island flavors whenever inspiration strikes. Here's everything you need.",
    sections: [
      { heading: "Essential Spices & Seasonings", content: "Allspice (pimento): The backbone of Caribbean seasoning. Thyme: Fresh or dried, used in almost everything. Curry powder (Jamaican-style): Different from Indian curry. Scotch bonnet pepper sauce: For heat. Bay leaves, garlic powder, onion powder, black pepper, paprika." },
      { heading: "Canned & Jarred Essentials", content: "Coconut milk: For rice and peas, curries, drinks. Ackee (canned): Jamaica's national fruit. Callaloo: Leafy green for soups and sides. Kidney beans: For rice and peas. Pigeon peas (gungo peas): Holiday essential. Grace products: Trusted brand for authentic ingredients." },
      { heading: "Dry Goods", content: "Rice: Long grain white rice is standard. Flour: For dumplings and festivals. Cornmeal: For cou-cou and porridge. Dried beans: Kidney, black-eyed peas, pigeon peas. Cassava (yuca): Fresh or frozen." },
      { heading: "Sauces & Condiments", content: "Browning sauce: For color and flavor in stews. Soy sauce: Used more than you'd think. Vinegar: White and apple cider. Ketchup: Yes, it's a Caribbean staple. Maggi seasoning: Adds umami depth." }
    ],
    tips: [
      "Buy spices in small quantities to keep them fresh",
      "Store spices away from heat and light",
      "Coconut milk separates - shake well before using",
      "Fresh thyme is worth seeking out over dried",
      "Grace, Walkerswood, and Pickapeppa are trusted Caribbean brands"
    ],
    relatedProducts: ["allspice", "thyme", "coconut milk", "curry powder", "scotch bonnet sauce", "kidney beans", "rice"],
    keywords: ["caribbean pantry", "caribbean spices", "jamaican ingredients", "caribbean cooking essentials", "island cooking"]
  },
  {
    slug: "haitian-cooking-essentials",
    title: "Haitian Cooking Essentials: Your Complete Guide",
    metaTitle: "Essential Haitian Ingredients: Epis, Djon Djon & More | StoresGo",
    metaDescription: "Master Haitian cooking with this guide to essential ingredients. Learn about epis, djon djon mushrooms, pikliz, and the staples of authentic Haitian cuisine.",
    cuisine: "Haitian",
    cuisineSlug: "haitian",
    category: "Pantry",
    intro: "Haitian cuisine is bold, flavorful, and deeply rooted in African, French, and Taíno influences. Understanding these essential ingredients will help you create authentic Haitian dishes at home.",
    sections: [
      { heading: "Epis: The Haitian Flavor Base", content: "Epis is a blended seasoning paste that forms the foundation of almost all Haitian cooking. Made from: Green onions, garlic, parsley, bell peppers, thyme, Scotch bonnet, and oil. Make a big batch and refrigerate - it keeps for weeks." },
      { heading: "Djon Djon Mushrooms", content: "These small black mushrooms are unique to Haiti and give Diri Djon Djon its distinctive color and earthy flavor. The dried mushrooms are simmered in water to extract their color before cooking. There's no real substitute for their unique flavor." },
      { heading: "Pikliz", content: "Haitian spicy pickled slaw made from cabbage, carrots, and Scotch bonnet peppers in vinegar. It's served with everything - especially griot (fried pork) and fried chicken. Every family has their own recipe." },
      { heading: "Other Essentials", content: "Sour oranges (or blend orange + lime): For marinades. Cloves: Used more in Haitian cooking than other Caribbean cuisines. Maggi cubes: Adds depth to stews. Tomato paste: Base for many sauces. Cooking oil: Haitian cooking uses generous amounts." }
    ],
    tips: [
      "Make epis in bulk and freeze in ice cube trays for easy portions",
      "Djon djon mushrooms must be cleaned well - they can be sandy",
      "Let pikliz ferment for at least 3 days for best flavor",
      "Haitian recipes often call for 'sour orange' - substitute with 2/3 orange + 1/3 lime juice",
      "Low and slow is the key to most Haitian meat dishes"
    ],
    relatedProducts: ["epis", "djon djon mushrooms", "scotch bonnet", "pikliz", "sour orange", "maggi cubes"],
    keywords: ["haitian cooking", "epis recipe", "djon djon", "haitian ingredients", "pikliz", "haitian food essentials"]
  },
  {
    slug: "choosing-the-right-rice",
    title: "Choosing the Right Rice for Ethnic Cooking",
    metaTitle: "Rice Guide: Best Rice for Caribbean, Latin, Asian Dishes | StoresGo",
    metaDescription: "Find the perfect rice for your ethnic recipes. Guide to long grain, jasmine, basmati, and specialty rice for Caribbean, Latin, Asian, and African cooking.",
    cuisine: "Asian",
    cuisineSlug: "asian",
    category: "Dry Goods",
    intro: "Rice is central to cuisines around the world, but not all rice is the same. Using the right rice makes a significant difference in your final dish. Here's how to choose.",
    sections: [
      { heading: "Long Grain White Rice", content: "Best for: Caribbean rice and peas, Latin rice dishes, general cooking. Grains stay separate when cooked. Brands to look for: Mahatma, Carolina, Iberia. This is the everyday rice for most Caribbean and Latin cooking." },
      { heading: "Jasmine Rice", content: "Best for: Thai curries, Southeast Asian dishes, any dish where you want fragrant rice. Slightly sticky with floral aroma. Brands: Three Ladies, Dynasty, Thai Kitchen. Cook with less water than long grain." },
      { heading: "Basmati Rice", content: "Best for: Indian biryanis, Persian rice, Middle Eastern dishes. Long, slender grains that elongate when cooked. Very aromatic. Brands: Tilda, Kohinoor, Daawat. Rinse well before cooking." },
      { heading: "Short Grain/Sushi Rice", content: "Best for: Japanese dishes, sushi, Korean rice. Sticky when cooked. Brands: Kokuho Rose, Calrose, Nishiki. Must be rinsed until water runs clear." },
      { heading: "Specialty Rices", content: "Parboiled rice: Holds up in stews, used in some Caribbean cooking. Bomba/Valencia: Spanish paella rice. Sticky/glutinous rice: Thai desserts, some savory Asian dishes. Black rice: Nutritious, used in Filipino desserts." }
    ],
    tips: [
      "Store rice in airtight containers to keep out moisture and pests",
      "Aged basmati is considered superior - it cooks fluffier",
      "Rinsing rice removes excess starch and prevents gumminess",
      "For most ethnic cooking, avoid instant or minute rice",
      "A rice cooker is a worthwhile investment for consistent results"
    ],
    relatedProducts: ["long grain rice", "jasmine rice", "basmati rice", "sushi rice", "coconut milk", "rice cooker"],
    keywords: ["best rice for cooking", "rice for rice and peas", "jasmine vs basmati", "caribbean rice", "asian rice types"]
  }
];

export function getGuide(slug: string): BuyingGuide | undefined {
  return BUYING_GUIDES.find(g => g.slug === slug);
}

export function getGuidesByCuisine(cuisineSlug: string): BuyingGuide[] {
  return BUYING_GUIDES.filter(g => g.cuisineSlug === cuisineSlug);
}

export default { BUYING_GUIDES, getGuide, getGuidesByCuisine };
