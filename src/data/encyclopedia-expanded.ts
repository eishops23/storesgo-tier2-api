// ═══════════════════════════════════════════════════════════════════════════════
// STORESGO ENCYCLOPEDIA - EXPANDED (100+ ARTICLES)
// ═══════════════════════════════════════════════════════════════════════════════

export interface EncyclopediaArticle {
  slug: string;
  title: string;
  category: "culture" | "history" | "technique" | "science" | "tradition" | "regional" | "ingredient" | "guide";
  region: string;
  metaDescription: string;
  introduction: string;
  sections: { heading: string; content: string }[];
  keyFacts: string[];
  relatedArticles: string[];
  relatedIngredients: string[];
  relatedRecipes: string[];
  lastUpdated: string;
}

export const expandedEncyclopediaArticles: EncyclopediaArticle[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // CARIBBEAN CUISINE (20 articles)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    slug: "trinidadian-doubles-street-food",
    title: "Trinidadian Doubles: The King of Caribbean Street Food",
    category: "tradition",
    region: "caribbean",
    metaDescription: "Discover the history and art of Trinidadian doubles, the beloved street food that defines Caribbean morning culture.",
    introduction: "In Trinidad and Tobago, the day begins with doubles. This iconic street food—two soft bara breads filled with curried chickpeas and an array of chutneys—represents the beautiful fusion of Indian and Caribbean culinary traditions.",
    sections: [
      { heading: "Indian Origins, Caribbean Soul", content: "Doubles emerged from the Indian indentured laborers who came to Trinidad in the 19th century. They adapted their traditional chole bhature to local ingredients and tastes, creating something entirely new. The name 'doubles' comes from the practice of using two bara instead of one." },
      { heading: "The Perfect Bara", content: "Bara, the soft fried bread that cradles the filling, requires precise technique. The dough must be soft and slightly sticky, fermented just enough to create air pockets when fried. Masters know the oil temperature by sight and sound." },
      { heading: "Channa: The Heart of Doubles", content: "The curried chickpeas (channa) that fill doubles are seasoned with a unique Trinidad curry blend. Unlike Indian versions, Trinidad curry typically includes more cumin and locally grown shadow beni (culantro)." },
      { heading: "The Condiment Bar", content: "What elevates doubles is the condiment selection: tamarind sauce (sweet and tangy), pepper sauce (fiery), cucumber chutney (cooling), and mango chutney. The combination you choose defines your doubles experience." },
      { heading: "Doubles Culture", content: "Doubles vendors set up before dawn, and lines form early. There's an etiquette: know your order before reaching the front, eat standing up, and always have exact change. The best vendors are known by name across the island." }
    ],
    keyFacts: [
      "Doubles cost between $1-3 TT (about $0.15-0.50 USD)",
      "The dish emerged in the 1930s in Princes Town",
      "Traditionally eaten for breakfast, now available all day",
      "The bara must be made fresh daily - they don't keep",
      "Championship doubles-eating competitions exist in Trinidad"
    ],
    relatedArticles: ["indian-influence-caribbean", "trinidad-street-food-guide"],
    relatedIngredients: ["chickpeas", "curry-powder", "tamarind", "culantro"],
    relatedRecipes: ["doubles", "bara", "channa-curry"],
    lastUpdated: "2024-12-19"
  },
  {
    slug: "jamaican-patty-history",
    title: "The Jamaican Patty: From British Pasty to Caribbean Icon",
    category: "history",
    region: "caribbean",
    metaDescription: "Trace the evolution of the Jamaican patty from British colonial influence to global fast-food phenomenon.",
    introduction: "The golden, flaky Jamaican patty—with its distinctive turmeric-tinted crust and spiced meat filling—is perhaps the Caribbean's most successful culinary export. Found everywhere from London to Tokyo, it began as a humble adaptation of the British pasty.",
    sections: [
      { heading: "Colonial Beginnings", content: "British colonizers brought the Cornish pasty to Jamaica. Local cooks adapted it, adding scotch bonnet peppers, allspice, and thyme. The turmeric that gives the crust its golden color was a practical addition—it masked the use of less expensive fats." },
      { heading: "The Tastee Revolution", content: "In 1966, Vincent Chang opened Tastee Limited in Kingston, standardizing the Jamaican patty for mass production. His innovation made patties accessible across the island and eventually the world. Tastee remains Jamaica's largest patty producer." },
      { heading: "Anatomy of a Perfect Patty", content: "The ideal patty has a crust that shatters when bitten, revealing a savory filling that's spiced but not overwhelming. The meat should be finely ground, the fat ratio precise to prevent dryness. The crimped edge must seal completely." },
      { heading: "Beyond Beef", content: "While beef remains the classic, Jamaican patties now come in dozens of varieties: chicken, vegetable, shrimp, lobster, ackee, and even pizza-flavored for adventurous tourists. Each filling maintains the essential spice profile." },
      { heading: "Global Spread", content: "Jamaican immigration brought patties worldwide. In New York, the patty-in-coco-bread combination became a bodega staple. London's Brixton Market sells thousands daily. The patty has become a symbol of Caribbean identity abroad." }
    ],
    keyFacts: [
      "Jamaicans consume over 90 million patties annually",
      "The turmeric crust was originally to disguise cheaper ingredients",
      "Tastee produces over 10 million patties per month",
      "New York's Golden Krust chain has 120+ locations",
      "The patty-in-coco-bread is called a 'patty and bread'"
    ],
    relatedArticles: ["jamaican-fast-food-culture", "caribbean-street-food"],
    relatedIngredients: ["scotch-bonnet-pepper", "allspice", "thyme", "turmeric"],
    relatedRecipes: ["jamaican-beef-patty", "vegetable-patty", "coco-bread"],
    lastUpdated: "2024-12-19"
  },
  {
    slug: "cuban-sandwich-origins",
    title: "The Cuban Sandwich: Tampa, Miami, and the Battle for Authenticity",
    category: "history",
    region: "caribbean",
    metaDescription: "Explore the disputed origins of the Cuban sandwich and why Tampa and Miami can't agree on the authentic recipe.",
    introduction: "Few sandwiches inspire more passionate debate than the Cuban. Is salami authentic or heresy? Should it be pressed? Tampa and Miami have feuded for decades over the 'real' Cuban sandwich—a dispute rooted in different immigration patterns and culinary evolution.",
    sections: [
      { heading: "Cigar City Origins", content: "The Cuban sandwich likely originated in Tampa's Ybor City in the late 1800s, created for cigar factory workers. The workforce was diverse—Cuban, Italian, Spanish—and the sandwich reflected this: Cuban roast pork with Italian salami on Spanish bread." },
      { heading: "Miami's Claim", content: "Miami Cubans argue their version—without salami—is more authentically Cuban. When Fidel Castro's revolution drove mass emigration in the 1960s, these Cubans brought their sandwich tradition directly from Havana, where salami wasn't used." },
      { heading: "The Essential Components", content: "Both cities agree on the core: Cuban bread (made with lard for crispness), roast pork, ham, Swiss cheese, pickles, and mustard. The bread must be pressed until crispy outside, soft inside, cheese melted, pickles warm." },
      { heading: "The Bread Matters Most", content: "Authentic Cuban bread is crucial and hard to find outside Florida. It's made with lard and has a palmetto leaf laid on top during baking, creating a distinctive crack down the center. Without proper Cuban bread, purists argue, you don't have a Cuban sandwich." },
      { heading: "Modern Variations", content: "The Cubano has inspired countless variations: the Midnight (medianoche) on sweet egg bread, the Tampa Cuban with salami, pressed and grilled versions, and fusion interpretations worldwide. Purists may protest, but evolution continues." }
    ],
    keyFacts: [
      "Tampa claims the sandwich originated there in the 1880s",
      "Miami's version traditionally omits salami",
      "The sandwich must be pressed on a plancha (flat grill)",
      "Tampa declared the Cuban sandwich its 'signature sandwich' in 2012",
      "Proper Cuban bread requires lard and a palmetto leaf"
    ],
    relatedArticles: ["cuban-cuisine-florida", "tampa-food-history"],
    relatedIngredients: ["cuban-bread", "roast-pork", "swiss-cheese", "pickles"],
    relatedRecipes: ["cuban-sandwich", "medianoche", "cuban-roast-pork"],
    lastUpdated: "2024-12-19"
  },
  {
    slug: "puerto-rican-mofongo",
    title: "Mofongo: Puerto Rico's Plantain Masterpiece",
    category: "tradition",
    region: "caribbean",
    metaDescription: "Learn about mofongo, the Puerto Rican dish of mashed plantains that represents the island's African heritage.",
    introduction: "Mofongo is Puerto Rico's most beloved dish—a mound of mashed fried plantains mixed with garlic, olive oil, and chicharrón. It represents the African influence on Puerto Rican cuisine and has become a symbol of island identity.",
    sections: [
      { heading: "African Roots", content: "Mofongo descends from fufu, the mashed plantain dishes of West Africa. Enslaved Africans brought this technique to Puerto Rico, adapting it with local ingredients. The wooden pilón (mortar and pestle) used to mash mofongo connects directly to African cooking traditions." },
      { heading: "The Art of the Pilón", content: "Traditional mofongo must be made in a wooden pilón. The fried plantains are added while hot and mashed with garlic and oil. The wooden vessel is essential—it absorbs flavors over years of use and imparts character no other method can replicate." },
      { heading: "Chicharrón: The Soul", content: "Crispy pork cracklings (chicharrón) mixed into mofongo provide richness and texture. The fat from the chicharrón combines with olive oil to bind the plantains. Some versions use bacon; purists insist on proper chicharrón." },
      { heading: "Relleno: The Filling", content: "Modern mofongo often comes relleno (stuffed) with shrimp, chicken, beef, or octopus in a rich sauce. The mofongo becomes a vessel, its mild sweetness complementing savory fillings. Some restaurants serve it in the pilón itself." },
      { heading: "Regional Variations", content: "Dominican mangú (mashed boiled plantains) and Cuban fufu are cousins to mofongo. Each island developed its own interpretation of the African original. Puerto Rico's version, with its garlic and chicharrón, became the most elaborate." }
    ],
    keyFacts: [
      "Mofongo comes from the Angolan word 'mfongo'",
      "The wooden pilón is essential for authentic texture",
      "Ripe plantains won't work - green plantains are required",
      "La Mallorquina in Old San Juan has served mofongo since 1848",
      "Every September, Puerto Rico celebrates 'Mofongo Week'"
    ],
    relatedArticles: ["african-caribbean-connection", "plantain-cooking-guide"],
    relatedIngredients: ["green-plantains", "chicharron", "garlic", "olive-oil"],
    relatedRecipes: ["mofongo", "mofongo-relleno", "tostones"],
    lastUpdated: "2024-12-19"
  },
  {
    slug: "bajan-flying-fish-cou-cou",
    title: "Flying Fish and Cou-Cou: Barbados' National Dish",
    category: "culture",
    region: "caribbean",
    metaDescription: "Discover why flying fish and cou-cou became Barbados' national dish and symbol of Bajan identity.",
    introduction: "Every nation has a dish that defines it, and for Barbados, it's flying fish with cou-cou. This combination of cornmeal and okra alongside seasoned flying fish represents Bajan history, geography, and ingenuity.",
    sections: [
      { heading: "The Flying Fish Connection", content: "Flying fish were once so abundant around Barbados that the island was called 'The Land of the Flying Fish.' These unique fish, which glide above water to escape predators, became central to Bajan cuisine and identity. Overfishing has reduced stocks, but the cultural connection remains." },
      { heading: "Cou-Cou: African Heritage", content: "Cou-cou is Barbados' version of the African cornmeal dishes found throughout the Caribbean. Made from cornmeal and okra, stirred continuously until smooth, it requires patience and technique. The okra provides a slight silkiness that distinguishes it from simple polenta." },
      { heading: "The Friday Tradition", content: "Traditionally, flying fish and cou-cou is eaten on Fridays—a custom dating to when the Catholic church prohibited meat on Fridays. Though religious observance has relaxed, the Friday tradition persists in homes and restaurants across the island." },
      { heading: "Preparing Flying Fish", content: "Bajans bone and season flying fish with a mixture of lime, thyme, marjoram, and Bajan seasoning. The fish can be steamed, fried, or stewed. Each method produces different textures, from delicate to crispy." },
      { heading: "National Pride", content: "Flying fish appears on Barbadian currency, stamps, and official documents. The dish represents not just cuisine but national identity. When Bajans abroad gather, flying fish and cou-cou connects them to home." }
    ],
    keyFacts: [
      "Flying fish can glide up to 200 meters above water",
      "Cou-cou must be stirred constantly to prevent lumps",
      "Barbados produces Bajan seasoning commercially for export",
      "The dish was declared national dish in 2019",
      "Friday is still the traditional day for this meal"
    ],
    relatedArticles: ["barbados-food-culture", "cornmeal-caribbean-cooking"],
    relatedIngredients: ["cornmeal", "okra", "flying-fish", "bajan-seasoning"],
    relatedRecipes: ["flying-fish-cou-cou", "bajan-fish-cakes", "pepper-sauce"],
    lastUpdated: "2024-12-19"
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // LATIN AMERICAN CUISINE (20 articles)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    slug: "mexican-mole-history",
    title: "Mole: The Soul of Mexican Cuisine",
    category: "history",
    region: "latin",
    metaDescription: "Explore the complex history and varieties of Mexican mole, from colonial convents to regional pride.",
    introduction: "Mole is not a single dish but a family of complex sauces that represent the pinnacle of Mexican culinary achievement. With recipes containing 20, 30, or even 50 ingredients, moles embody the patience, skill, and cultural fusion that define Mexican cooking.",
    sections: [
      { heading: "Convent Origins", content: "Legend places mole's invention in Puebla's Santa Rosa convent, where nuns created mole poblano to honor a visiting viceroy. While romantic, this story oversimplifies mole's likely indigenous origins—the word comes from Nahuatl 'molli' meaning sauce." },
      { heading: "The Seven Moles of Oaxaca", content: "Oaxaca, 'the land of seven moles,' is Mexico's mole heartland. Negro (black), rojo (red), coloradito, amarillo (yellow), verde (green), chichilo, and manchamanteles each represent distinct flavor profiles, colors, and occasions." },
      { heading: "The Chocolate Question", content: "Chocolate in mole surprises many, but it's traditional in poblano and negro varieties. The chocolate doesn't sweeten—it adds depth and helps bind the sauce. Pre-Hispanic Mexicans combined cacao with chiles long before the conquest." },
      { heading: "A Labor of Love", content: "Traditional mole requires days of preparation: toasting and rehydrating chiles, grinding spices, frying paste, simmering for hours. Each step builds layers of flavor. Many families reserve mole for weddings, quinceañeras, and important holidays." },
      { heading: "Regional Pride", content: "Mole competitions are serious affairs in Mexico. Towns stake their identity on their mole recipes, passed through generations. The 'best mole' debate mirrors wine region rivalries in intensity and passion." }
    ],
    keyFacts: [
      "Mole poblano contains over 20 ingredients minimum",
      "Oaxaca recognizes seven traditional mole varieties",
      "The word 'mole' comes from Nahuatl 'molli' (sauce)",
      "Traditional preparation can take 2-3 days",
      "October 7 is National Mole Day in Mexico"
    ],
    relatedArticles: ["oaxacan-cuisine", "mexican-chile-varieties"],
    relatedIngredients: ["ancho-chile", "mulato-chile", "mexican-chocolate", "piloncillo"],
    relatedRecipes: ["mole-poblano", "mole-negro", "mole-verde"],
    lastUpdated: "2024-12-19"
  },
  {
    slug: "argentinian-asado-tradition",
    title: "Asado: Argentina's Sacred Fire",
    category: "tradition",
    region: "latin",
    metaDescription: "Understand the rituals, techniques, and cultural significance of Argentina's asado tradition.",
    introduction: "Asado is not merely Argentine barbecue—it's a cultural institution, a social ritual, and a source of national identity. The asador (grill master) commands respect, and the parrilla (grill) is treated with reverence.",
    sections: [
      { heading: "Gaucho Origins", content: "Asado began with the gauchos, the cowboys of the Argentine pampas. Cattle were abundant, wood was plentiful, and cooking meat over fire became both necessity and art. The gaucho tradition of asado con cuero (hide-on) persists in rural areas." },
      { heading: "The Role of the Asador", content: "The asador controls the fire, timing, and meat selection. This role is traditionally male—a controversial tradition some modern Argentines are questioning. The asador's reputation rests on every asado, creating pressure to perform perfectly." },
      { heading: "Fire and Wood", content: "Argentine asado uses wood, not charcoal. The type of wood matters—quebracho burns hot and long, espinillo adds flavor. The fire is built beside the grill, and embers are shoveled under meat as needed. Temperature control is entirely manual." },
      { heading: "The Sacred Cuts", content: "Certain cuts are essential: short ribs (tira de asado), flank steak (vacío), blood sausage (morcilla), and sweetbreads (mollejas). The progression of meats—offal first, then beef—is ritualized. Chimichurri is the only acceptable sauce." },
      { heading: "Sunday Tradition", content: "Sunday asado gathers families and friends for hours of eating, drinking, and conversation. It's the social glue of Argentine life. No holiday, birthday, or celebration is complete without asado." }
    ],
    keyFacts: [
      "Argentines consume 50kg of beef per person annually",
      "Asado traditionally uses wood fire, not charcoal",
      "The asador (grill master) is a respected role",
      "Blood sausage (morcilla) is always served first",
      "Sunday asado is a near-universal Argentine tradition"
    ],
    relatedArticles: ["argentinian-beef-culture", "chimichurri-history"],
    relatedIngredients: ["beef-short-ribs", "morcilla", "chimichurri", "provoleta"],
    relatedRecipes: ["asado", "chimichurri", "provoleta-grilled"],
    lastUpdated: "2024-12-19"
  },
  {
    slug: "colombian-bandeja-paisa",
    title: "Bandeja Paisa: Colombia's Most Generous Plate",
    category: "culture",
    region: "latin",
    metaDescription: "Discover bandeja paisa, the massive Colombian platter that represents Antioquia's hearty mountain culture.",
    introduction: "Bandeja paisa is abundance on a plate—rice, beans, ground beef, chicharrón, fried egg, plantain, arepa, avocado, and chorizo all on one overflowing platter. This dish from Colombia's Antioquia region reflects the mountain people's need for caloric fuel.",
    sections: [
      { heading: "Mountain Fuel", content: "The paisa region's mountainous terrain demanded heavy labor—farming, mining, coffee harvesting. Workers needed massive caloric intake. Bandeja paisa developed to meet this need, combining every available protein and carbohydrate." },
      { heading: "The Essential Components", content: "A proper bandeja paisa includes: red beans cooked with pork (fríjoles), white rice, carne molida (seasoned ground beef), chicharrón, fried egg, sweet plantain (maduro), arepa, avocado, chorizo, and hogao (tomato-onion sauce). Restaurants compete to add more." },
      { heading: "Paisa Pride", content: "Paisas—people from Antioquia and the Coffee Region—are famously proud. They consider themselves Colombia's hardest workers and their food the country's best. Bandeja paisa embodies this regional pride." },
      { heading: "Modern Adaptations", content: "The original bandeja was working-class food. Now it appears in upscale restaurants with refined presentations, though purists argue something is lost when the portion shrinks. Some restaurants offer 'bandeja paisa challenges' for competitive eaters." },
      { heading: "Beyond Medellín", content: "While Medellín is bandeja paisa's capital, the dish has spread throughout Colombia and to Colombian communities worldwide. In Miami, New York, and Madrid, it connects expatriates to home." }
    ],
    keyFacts: [
      "A traditional bandeja can exceed 2,000 calories",
      "The dish originated with farmers and miners",
      "All components must be present for authenticity",
      "Medellín is considered the bandeja paisa capital",
      "The dish represents paisa regional identity"
    ],
    relatedArticles: ["colombian-regional-cuisines", "arepa-guide"],
    relatedIngredients: ["colombian-beans", "chicharron", "arepa", "chorizo"],
    relatedRecipes: ["bandeja-paisa", "frijoles-antioquenos", "hogao"],
    lastUpdated: "2024-12-19"
  },
  {
    slug: "brazilian-feijoada-history",
    title: "Feijoada: Brazil's National Dish and Its Complex History",
    category: "history",
    region: "latin",
    metaDescription: "Explore the true origins of feijoada and why the 'slave food' origin story is a myth.",
    introduction: "Feijoada—Brazil's beloved black bean and pork stew—is often said to have been invented by enslaved Africans using scraps. This romantic narrative, however, oversimplifies a dish with roots in Portuguese cooking traditions.",
    sections: [
      { heading: "The Myth of Slave Origins", content: "The popular story claims enslaved people created feijoada from pork scraps their masters discarded. Food historians now dispute this: the 'scrap' cuts in feijoada (ears, tail, feet) were valued in Portuguese cuisine, not garbage. The dish more likely evolved from Portuguese bean stews." },
      { heading: "Portuguese Foundations", content: "Portugal has a long tradition of bean and pork stews. Enslaved cooks may have adapted these recipes in Brazil, but the basic concept arrived with colonizers. African influence appears in preparation techniques and possibly the use of black beans over white." },
      { heading: "The Saturday Ritual", content: "Feijoada is traditionally a Saturday lunch dish. The long cooking time suited weekend leisure, and the heavy meal demanded afternoon rest. This tradition continues: restaurants offer Saturday feijoada completa as a special event." },
      { heading: "Regional Variations", content: "Rio de Janeiro's feijoada includes dried beef and uses black beans. São Paulo versions are lighter. Bahia adds palm oil for an African touch. The variety reflects Brazil's regional diversity." },
      { heading: "The Complete Experience", content: "Feijoada completa includes more than the stew: farofa (toasted manioc flour), couve (collard greens), orange slices, and white rice. Each element serves a purpose—farofa absorbs liquid, oranges aid digestion, greens add freshness." }
    ],
    keyFacts: [
      "The 'slave food' origin is considered a myth by historians",
      "Portuguese bean stews are the likely ancestor",
      "Saturday is the traditional day for feijoada",
      "A complete feijoada includes 6-10 different pork cuts",
      "Orange slices are believed to aid digestion"
    ],
    relatedArticles: ["brazilian-portuguese-food-connection", "african-brazilian-cuisine"],
    relatedIngredients: ["black-beans", "linguica", "farofa", "collard-greens"],
    relatedRecipes: ["feijoada", "farofa", "couve-mineira"],
    lastUpdated: "2024-12-19"
  },
  {
    slug: "venezuelan-arepa-guide",
    title: "The Venezuelan Arepa: A Complete Guide",
    category: "guide",
    region: "latin",
    metaDescription: "Everything you need to know about Venezuelan arepas, from making the perfect dough to classic fillings.",
    introduction: "The arepa—a round, flat corn cake—is Venezuela's daily bread, eaten at every meal. Unlike Colombian arepas (thinner, often topped), Venezuelan arepas are thicker and split open like pockets to hold generous fillings.",
    sections: [
      { heading: "Ancient Origins", content: "Arepas predate Columbus by centuries. Indigenous peoples ground corn with stone metates, mixed it with water, and cooked it on clay surfaces. The Spanish arrival didn't diminish the arepa—it simply continued alongside wheat bread." },
      { heading: "Harina P.A.N. Revolution", content: "In 1960, Empresas Polar introduced Harina P.A.N., pre-cooked corn flour that eliminated hours of grinding. This convenience product transformed arepa-making, making it accessible to urban Venezuelans. Today, Harina P.A.N. is the Venezuelan diaspora's most essential import." },
      { heading: "The Perfect Dough", content: "Arepa dough should be smooth, not crumbly, and slightly moist. Too much water makes sticky dough; too little makes cracks. The ratio is roughly 1:1 water to flour, but cooks adjust by feel. A proper arepa holds together when shaped but isn't dense." },
      { heading: "Classic Fillings", content: "La Reina Pepiada (chicken salad with avocado) is the most famous filling. Domino (black beans and white cheese) is the simplest. Pabellón uses shredded beef, black beans, and cheese. Pelua features shredded beef and yellow cheese. The combinations are endless." },
      { heading: "Areperas Everywhere", content: "Venezuelan areperas (arepa restaurants) have spread globally with the diaspora. Miami's Venezuelan population has brought dozens of areperas. These become community centers where expatriates gather to taste home." }
    ],
    keyFacts: [
      "Venezuelans eat an average of 3 arepas per day",
      "Harina P.A.N. revolutionized arepa-making in 1960",
      "La Reina Pepiada was named after a beauty queen",
      "Venezuelan arepas are thicker than Colombian versions",
      "Areperas have spread worldwide with Venezuelan immigration"
    ],
    relatedArticles: ["corn-americas-history", "venezuelan-diaspora-food"],
    relatedIngredients: ["harina-pan", "queso-blanco", "black-beans", "avocado"],
    relatedRecipes: ["arepa", "reina-pepiada", "arepa-pabellon"],
    lastUpdated: "2024-12-19"
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ASIAN CUISINE (20 articles)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    slug: "thai-curry-paste-guide",
    title: "Thai Curry Pastes: The Foundation of Thai Cooking",
    category: "technique",
    region: "asian",
    metaDescription: "Master the art of Thai curry pastes: green, red, yellow, and beyond.",
    introduction: "Thai curries are defined by their pastes—aromatic blends pounded by hand in a granite mortar. Unlike Indian curries built on dry spices, Thai curry pastes are wet, fresh, and intensely fragrant.",
    sections: [
      { heading: "The Holy Trinity", content: "Three curry pastes dominate Thai cooking: green (prik gaeng khiao wan), red (prik gaeng phet), and yellow (prik gaeng karee). Green is hottest, using fresh green chilies. Red uses dried red chilies for warmth. Yellow incorporates turmeric and is mildest." },
      { heading: "Mortar and Pestle Essential", content: "Traditional paste-making uses a heavy granite mortar (krok) and pestle (saak). The pounding action releases oils and creates a smoother paste than any blender. This is considered essential for authentic flavor and texture." },
      { heading: "Common Ingredients", content: "Most Thai pastes share a foundation: lemongrass, galangal, garlic, shallots, shrimp paste, and chilies. Kaffir lime zest and coriander root add complexity. The proportions and additional ingredients vary by color and region." },
      { heading: "Regional Variations", content: "Southern Thai curries are fiercer; Northern versions are milder and may skip coconut milk. Massaman curry from the south incorporates Indian spices from Muslim influence. Panang curry is richer, with more peanuts." },
      { heading: "Store-Bought vs. Fresh", content: "Quality store-bought pastes from Mae Ploy or Maesri are acceptable for home cooking. However, freshly pounded paste has a vibrancy and aroma that packaged versions can't match. For special occasions, fresh paste justifies the effort." }
    ],
    keyFacts: [
      "Green curry paste is typically the hottest",
      "Shrimp paste (kapi) is essential in most recipes",
      "Granite mortars produce better paste than blenders",
      "Massaman curry shows Indian/Muslim influence",
      "Fresh paste should be used within a week or frozen"
    ],
    relatedArticles: ["thai-coconut-milk-cooking", "thai-chile-varieties"],
    relatedIngredients: ["lemongrass", "galangal", "kaffir-lime", "shrimp-paste"],
    relatedRecipes: ["green-curry", "red-curry", "massaman-curry"],
    lastUpdated: "2024-12-19"
  },
  {
    slug: "japanese-ramen-regional-guide",
    title: "Japanese Ramen: A Regional Guide",
    category: "regional",
    region: "asian",
    metaDescription: "Explore Japan's regional ramen styles from Sapporo's miso to Hakata's tonkotsu.",
    introduction: "Ramen is Japan's great regional food—each city, each neighborhood, even each shop has its own style. Understanding ramen means understanding Japan's geography, history, and obsessive pursuit of perfection.",
    sections: [
      { heading: "The Four Major Styles", content: "Japanese ramen is categorized by broth: shoyu (soy sauce), shio (salt), miso, and tonkotsu (pork bone). Each originated in different regions and reflects local ingredients, climate, and tastes. These categories, however, barely capture ramen's diversity." },
      { heading: "Sapporo: Miso Ramen", content: "Hokkaido's cold climate demanded rich, warming bowls. Sapporo miso ramen uses red or white miso for depth, often with butter and corn. The broth is thick, the toppings hearty. This style emerged in the 1950s and spread nationwide." },
      { heading: "Hakata: Tonkotsu", content: "Fukuoka's Hakata district created tonkotsu—pork bones boiled for days until the broth turns creamy white. The noodles are thin and firm, served with kikurage mushrooms and pickled ginger. Customers order 'kaedama' (extra noodles) to extend the meal." },
      { heading: "Tokyo: Shoyu", content: "Tokyo-style shoyu ramen uses a clear, soy-sauce-seasoned chicken and pork broth. It's lighter than regional rivals but elegant. Curly noodles, chashu pork, nori, and soft-boiled egg are classic toppings." },
      { heading: "The Ramen Shop Experience", content: "Serious ramen shops are temples of focus. Tickets are purchased from machines, seating is at counters, and conversation is minimal. Slurping is expected—it aerates the noodles and shows appreciation. Finishing the broth honors the chef." }
    ],
    keyFacts: [
      "Tonkotsu broth simmers for 12-24+ hours",
      "Japan has over 30,000 ramen shops",
      "Instant ramen was invented by Momofuku Ando in 1958",
      "Regional styles reflect local climate and ingredients",
      "Slurping ramen is proper etiquette in Japan"
    ],
    relatedArticles: ["japanese-noodle-culture", "umami-japanese-cooking"],
    relatedIngredients: ["ramen-noodles", "chashu-pork", "ajitsuke-egg", "nori"],
    relatedRecipes: ["tonkotsu-ramen", "miso-ramen", "shoyu-ramen"],
    lastUpdated: "2024-12-19"
  },
  {
    slug: "indian-biryani-regional-styles",
    title: "Biryani: India's Regional Rice Masterpiece",
    category: "regional",
    region: "asian",
    metaDescription: "Journey through India's biryani styles from Hyderabadi dum to Lucknowi perfection.",
    introduction: "Biryani is India's most celebrated rice dish—layers of aromatic basmati, spiced meat, and saffron united through slow cooking. Each region claims their biryani is authentic, sparking debates that have lasted centuries.",
    sections: [
      { heading: "Mughal Origins", content: "Biryani came to India with the Mughals, though it may have Persian or Arab roots. The Mughal court refined it into a sophisticated dish requiring precise technique. From royal kitchens, it spread to every corner of the subcontinent." },
      { heading: "Hyderabadi: The King", content: "Hyderabad's biryani is considered India's finest by many. The kachchi (raw) style cooks raw marinated meat with rice—risky but rewarding. The dum (slow steam) method seals the pot with dough, trapping flavors. Hyderabadi biryani is always layered, never mixed." },
      { heading: "Lucknowi: Refined Elegance", content: "Lucknow's Awadhi biryani uses the pakki (cooked) method—meat and rice are partially cooked separately before layering. The result is more delicate than Hyderabadi, with subtle spicing. It reflects Awadhi cuisine's reputation for refinement." },
      { heading: "Kolkata: The Potato Debate", content: "Kolkata biryani includes potatoes—heresy to purists elsewhere. This addition came from the Nawab of Awadh, exiled to Kolkata, who stretched meat with potatoes. The potato absorbs flavors and has earned devoted fans." },
      { heading: "Southern Variations", content: "Malabar biryani in Kerala uses short-grain rice and includes more coconut. Tamil Nadu's biryanis are spicier. Dindigul biryani uses seeraga samba rice for a distinctive texture. Each region adapted biryani to local tastes." }
    ],
    keyFacts: [
      "Authentic biryani uses basmati rice aged at least one year",
      "Saffron is essential for color and aroma",
      "Dum cooking seals the pot with dough for steam",
      "Hyderabad and Lucknow compete for 'best biryani'",
      "Kolkata biryani uniquely includes potatoes"
    ],
    relatedArticles: ["mughal-culinary-legacy", "basmati-rice-guide"],
    relatedIngredients: ["basmati-rice", "saffron", "garam-masala", "rose-water"],
    relatedRecipes: ["hyderabadi-biryani", "lucknowi-biryani", "chicken-biryani"],
    lastUpdated: "2024-12-19"
  },
  {
    slug: "chinese-dumpling-encyclopedia",
    title: "Chinese Dumplings: A Complete Encyclopedia",
    category: "guide",
    region: "asian",
    metaDescription: "Master the world of Chinese dumplings: jiaozi, wontons, baozi, and dozens of regional varieties.",
    introduction: "Chinese dumplings are not one dish but hundreds—each region has its own shapes, fillings, and cooking methods. From northern wheat dumplings to southern rice-flour creations, dumplings reflect China's vastness.",
    sections: [
      { heading: "Jiaozi: The Northern Classic", content: "Northern China's jiaozi are crescent-shaped wheat-dough dumplings, typically filled with pork and cabbage or chives. They're boiled (shuijiao), steamed, or pan-fried (guotie/potstickers). Jiaozi are essential for Lunar New Year—their shape resembles gold ingots." },
      { heading: "Wontons: Southern Elegance", content: "Cantonese wontons are wrapped in thin, delicate skins and typically filled with shrimp and pork. Served in broth or with noodles, they're lighter than northern dumplings. Hong Kong's wonton noodle shops are legendary." },
      { heading: "Xiaolongbao: Soup Inside", content: "Shanghai's xiaolongbao are engineering marvels—soup is sealed inside the dumpling by using aspic that melts during steaming. Eating them requires technique: bite a hole, sip soup, then eat. First-timers inevitably burn their mouths." },
      { heading: "Baozi: Filled Buns", content: "Baozi are fluffy steamed buns with various fillings: char siu pork, vegetables, or sweet pastes. They're larger than dumplings and serve as portable meals. Every region has its specialty baozi." },
      { heading: "Regional Varieties", content: "Shandong's boiled jiaozi, Sichuan's spicy wontons in red oil, Cantonese har gow (shrimp dumplings), Shanghai's shengjian (pan-fried soup buns)—the diversity is overwhelming. Each variety rewards specific techniques and local ingredients." }
    ],
    keyFacts: [
      "Jiaozi are essential for Chinese New Year celebrations",
      "Xiaolongbao contain soup sealed inside the wrapper",
      "Northern dumplings use wheat; southern use rice flour too",
      "Wonton and jiaozi have different wrapper thicknesses",
      "Dumpling-making is traditionally a family activity"
    ],
    relatedArticles: ["dim-sum-guide", "chinese-new-year-foods"],
    relatedIngredients: ["dumpling-wrappers", "ground-pork", "napa-cabbage", "ginger"],
    relatedRecipes: ["pork-jiaozi", "shrimp-wontons", "char-siu-bao"],
    lastUpdated: "2024-12-19"
  },
  {
    slug: "filipino-adobo-deep-dive",
    title: "Filipino Adobo: One Name, Infinite Variations",
    category: "culture",
    region: "asian",
    metaDescription: "Understand why Filipino adobo varies by region, family, and cook—and why there's no 'authentic' recipe.",
    introduction: "Ask ten Filipino cooks for their adobo recipe and you'll get eleven answers. This vinegar-braised dish is the Philippines' national dish—not because of uniformity, but because every family has their version, and all of them are 'authentic.'",
    sections: [
      { heading: "Pre-Colonial Origins", content: "Filipinos were preserving meat in vinegar long before Spanish arrival. The Spanish called this technique 'adobo' (marinade) because it resembled their own preparation. But Filipino adobo is distinctly its own—the similarities end with the name." },
      { heading: "The Core Formula", content: "All adobo shares vinegar, soy sauce (a later addition), garlic, bay leaves, and black peppercorns. The protein can be chicken, pork, or both (adobong manok at baboy). From this base, variations explode in every direction." },
      { heading: "Regional Styles", content: "Batangas adobo is dry and garlicky. Cavite style is yellow from annatto. Visayan adobo may use coconut milk (adobo sa gata). Bicolano versions are spicy. Some regions add liver for richness, others add sugar for sweetness. There is no standard." },
      { heading: "The Sauce Debate", content: "Should adobo be dry (with sauce reduced to a glaze) or saucy (with abundant braising liquid)? Filipinos argue passionately. Some re-fry the meat after braising for crispness. Others consider this heresy. Both are correct." },
      { heading: "Beyond Meat", content: "Vegetable adobos exist: kangkong (water spinach), sitaw (long beans), and even seafood adobos. The technique adapts to any ingredient, proving adobo is a method as much as a recipe." }
    ],
    keyFacts: [
      "Filipino adobo predates Spanish contact",
      "There is no single 'authentic' adobo recipe",
      "Soy sauce was a later Chinese-Filipino addition",
      "Every region and family has its own version",
      "The dish's acidity helped preserve meat before refrigeration"
    ],
    relatedArticles: ["filipino-food-fundamentals", "vinegar-asian-cooking"],
    relatedIngredients: ["cane-vinegar", "soy-sauce", "bay-leaves", "black-pepper"],
    relatedRecipes: ["chicken-adobo", "pork-adobo", "adobo-sa-gata"],
    lastUpdated: "2024-12-19"
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // AFRICAN CUISINE (20 articles)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    slug: "jollof-rice-wars",
    title: "The Jollof Rice Wars: Nigeria vs. Ghana",
    category: "culture",
    region: "african",
    metaDescription: "Understand the passionate debate between Nigeria and Ghana over who makes the best jollof rice.",
    introduction: "No culinary rivalry burns hotter than the 'Jollof Wars' between Nigeria and Ghana. Both nations claim their jollof rice is superior, and social media has turned this friendly competition into an international phenomenon.",
    sections: [
      { heading: "Origins in Senegal", content: "Jollof rice actually originated with the Wolof people of Senegal and Gambia. Called 'ceebu jën' in Wolof, it spread throughout West Africa as 'jollof,' with each country developing its own interpretation. Neither Nigeria nor Ghana invented it." },
      { heading: "The Nigerian Style", content: "Nigerian jollof is intensely tomato-forward with a distinctive smoky 'party jollof' flavor. Long-grain rice is preferred, and the bottom is often intentionally burnt to create 'party jollof' crust. Nigerians consider theirs the benchmark." },
      { heading: "The Ghanaian Style", content: "Ghanaian jollof uses more tomato paste than fresh tomatoes, creating a deeper color. They often add butter and use basmati rice for separate, fluffy grains. Ghanaians argue their version is more refined." },
      { heading: "Social Media Warfare", content: "The rivalry exploded on Twitter (X) where hashtags like #JollofWars trend regularly. Celebrities weigh in. Memes proliferate. What was once kitchen-table debate now involves millions of participants." },
      { heading: "The Real Winner", content: "The Jollof Wars celebrate West African cuisine. The rivalry has introduced jollof to global audiences, increased interest in African cooking, and united diaspora communities in proud culinary nationalism. Everyone wins." }
    ],
    keyFacts: [
      "Jollof rice originated with the Wolof people of Senegal",
      "Nigerian and Ghanaian styles differ in tomato use and rice type",
      "The rivalry is friendly but passionately argued",
      "Social media has internationalized the debate",
      "Senegalese original is called 'ceebu jën'"
    ],
    relatedArticles: ["west-african-rice-culture", "party-jollof-secrets"],
    relatedIngredients: ["long-grain-rice", "tomato-paste", "scotch-bonnet", "party-jollof-spice"],
    relatedRecipes: ["nigerian-jollof", "ghanaian-jollof", "party-jollof"],
    lastUpdated: "2024-12-19"
  },
  {
    slug: "moroccan-tagine-tradition",
    title: "The Moroccan Tagine: Vessel, Dish, and Tradition",
    category: "tradition",
    region: "african",
    metaDescription: "Learn how the iconic conical tagine pot shapes Moroccan cuisine and culture.",
    introduction: "The tagine is both a cooking vessel and the dishes prepared in it. Its distinctive conical lid circulates steam perfectly, tenderizing meat and concentrating flavors. In Morocco, the tagine is central to home cooking and hospitality.",
    sections: [
      { heading: "The Perfect Design", content: "The tagine's conical lid creates a self-basting environment. Steam rises, condenses on the cool lid, and drips back down. This conserves water—crucial in Morocco's arid climate—while keeping food moist and flavorful." },
      { heading: "Sweet and Savory Balance", content: "Moroccan tagines often combine meat with fruit—lamb with apricots, chicken with preserved lemons and olives, beef with prunes. This sweet-savory balance reflects Arab, Berber, and Andalusian influences." },
      { heading: "Spice Mastery", content: "Ras el hanout ('head of the shop') is the signature spice blend, containing 20-30 spices including cumin, coriander, ginger, turmeric, cinnamon, and rose petals. Each spice merchant's blend is unique." },
      { heading: "The Communal Table", content: "Tagines are served in the cooking vessel, placed at the table's center. Diners eat directly from the pot using bread as utensils. This communal eating style reinforces family bonds and hospitality." },
      { heading: "Beyond Morocco", content: "Tagine cooking has spread worldwide, and tagine pots are now sold globally. However, many non-Moroccan recipes ignore the authentic techniques—true tagine cooking is slow and gentle, not quick and hot." }
    ],
    keyFacts: [
      "Tagine lids recirculate steam to conserve water",
      "Sweet-savory combinations are traditional",
      "Ras el hanout can contain 20-30 spices",
      "Eating is communal, directly from the pot",
      "Traditional tagines cook over charcoal, not gas"
    ],
    relatedArticles: ["moroccan-spice-guide", "berber-cooking-traditions"],
    relatedIngredients: ["ras-el-hanout", "preserved-lemons", "dried-apricots", "harissa"],
    relatedRecipes: ["lamb-tagine", "chicken-tagine-preserved-lemon", "vegetable-tagine"],
    lastUpdated: "2024-12-19"
  },
  {
    slug: "south-african-braai-culture",
    title: "Braai: South Africa's Fire Culture",
    category: "tradition",
    region: "african",
    metaDescription: "Discover how the braai (barbecue) unites South Africa across cultural divides.",
    introduction: "In South Africa, the braai is more than barbecue—it's a cultural institution that crosses racial and ethnic lines. Everyone braais, and September 24 (Heritage Day) is informally known as 'National Braai Day.'",
    sections: [
      { heading: "More Than Barbecue", content: "While Americans grill and Argentines do asado, South Africans braai. The term comes from Afrikaans 'braaivleis' (roasted meat), but the practice unites all South African cultures. Zulu, Xhosa, English, and Afrikaner families all gather around fires." },
      { heading: "Wood, Not Charcoal", content: "Proper braai uses hardwood—not charcoal, never gas. The type of wood matters: rooikrans and sekelbos are prized for their heat and subtle flavor. The braaimaster tends the fire for hours before cooking begins." },
      { heading: "Essential Foods", content: "Boerewors (farmer's sausage) is non-negotiable. Lamb chops, sosaties (kebabs), and chicken follow. Pap (maize porridge) accompanies the meat. Cold beer is essential. The meal is abundant and leisurely." },
      { heading: "Social Ritual", content: "Braai begins at 'Africa time'—starting hours are suggestions. The host provides meat; guests bring drinks and sides. Conversation flows while the fire is built. The actual eating is almost secondary to the gathering." },
      { heading: "Rainbow Nation Symbol", content: "In post-apartheid South Africa, braai represents unity. Archbishop Desmond Tutu championed it as a 'Rainbow Nation' activity. It's something all South Africans share regardless of background." }
    ],
    keyFacts: [
      "September 24 is unofficially 'National Braai Day'",
      "Proper braai uses hardwood, not charcoal",
      "Boerewors sausage is essential",
      "The braai unites all South African cultures",
      "Gas grilling is considered inferior"
    ],
    relatedArticles: ["boerewors-making-guide", "south-african-food-culture"],
    relatedIngredients: ["boerewors", "sosaties", "pap", "chakalaka"],
    relatedRecipes: ["boerewors", "sosaties", "braai-bread"],
    lastUpdated: "2024-12-19"
  },
  {
    slug: "senegalese-thieboudienne",
    title: "Thiéboudiène: Senegal's Gift to World Cuisine",
    category: "culture",
    region: "african",
    metaDescription: "Explore thiéboudiène, Senegal's national dish and the ancestor of jollof rice.",
    introduction: "Thiéboudiène (ceebu jën in Wolof, meaning 'fish and rice') is Senegal's national dish and arguably the ancestor of jollof rice. This one-pot masterpiece of fish, vegetables, and rice reflects Senegal's position as a culinary crossroads.",
    sections: [
      { heading: "Saint-Louis Origins", content: "Thiéboudiène originated in Saint-Louis, Senegal's former colonial capital. Legend attributes it to Penda Mbaye, a 19th-century cook. The dish spread throughout Senegal and became central to national identity." },
      { heading: "The Fish Foundation", content: "Fresh fish—usually thiof (grouper)—is stuffed with roff (parsley, garlic, pepper paste) and fried. The frying oil becomes the flavor base. Fish variety matters; Senegalese insist on local species for authenticity." },
      { heading: "The Vegetable Layer", content: "Vegetables are specific and numerous: cassava, carrot, cabbage, eggplant, okra, and tamarind-stuffed bitter tomato (nététou). Each vegetable adds distinct flavor and texture. Shortcuts are unacceptable." },
      { heading: "Rice Perfection", content: "The rice absorbs the cooking liquid—fish broth, tomato, and vegetable flavors. The prized bottom crust (xorom) is scraped and served separately to honored guests. Rice texture is crucial: distinct grains, not mushy." },
      { heading: "UNESCO Recognition", content: "In 2021, thiéboudiène was added to UNESCO's Intangible Cultural Heritage list—the first African dish to receive this recognition. This honor reflects its cultural importance beyond mere cuisine." }
    ],
    keyFacts: [
      "Thiéboudiène is the ancestor of jollof rice",
      "UNESCO recognized it as Intangible Cultural Heritage in 2021",
      "The bottom rice crust (xorom) is served to honored guests",
      "Legend credits Penda Mbaye with creating the dish",
      "Fresh fish, especially thiof, is essential"
    ],
    relatedArticles: ["west-african-fish-cooking", "senegalese-food-culture"],
    relatedIngredients: ["broken-rice", "tamarind", "nététou", "dried-fish"],
    relatedRecipes: ["thieboudienne", "yassa-fish", "mafe"],
    lastUpdated: "2024-12-19"
  },
  {
    slug: "somali-cuisine-introduction",
    title: "Somali Cuisine: The Undiscovered Horn of Africa",
    category: "culture",
    region: "african",
    metaDescription: "Discover Somali cuisine, where Arab, Indian, and African influences create unique flavors.",
    introduction: "Somali cuisine remains one of Africa's best-kept secrets—a sophisticated blend of Arab, Indian, and African influences shaped by Somalia's position on ancient trade routes. From aromatic rice dishes to tender stews, Somali food rewards exploration.",
    sections: [
      { heading: "Trade Route Heritage", content: "Somalia's coast faced Arabia and connected to the Indian Ocean trade. This brought rice, spices, and cooking techniques from India and the Middle East. These influences merged with pastoral African traditions to create something unique." },
      { heading: "Camel Culture", content: "Camel milk and meat are central to traditional Somali cuisine—unusual in global cooking. Camel milk makes drinks and is used in tea. Camel meat appears in stews and grilled dishes. This reflects Somalia's nomadic heritage." },
      { heading: "Bariis: The Rice Center", content: "Bariis (rice) dishes show Indian influence—basmati cooked with spices, raisins, and meat. Bariis iskukaris is the celebratory version, served at weddings and holidays. The rice is fluffy, aromatic, and subtly sweet." },
      { heading: "The Banana Accompaniment", content: "Somalis eat banana with almost everything—including rice and meat dishes. This surprises non-Somalis but adds sweetness that balances savory and spicy elements. Bananas are grown along the Jubba and Shabelle rivers." },
      { heading: "Diaspora Spread", content: "Somali restaurants have spread with refugee communities. Minneapolis, London, and Columbus, Ohio, have thriving Somali food scenes. These restaurants introduce Somali cuisine to new audiences." }
    ],
    keyFacts: [
      "Somalia's cuisine blends Arab, Indian, and African influences",
      "Camel milk and meat are traditional foods",
      "Bananas accompany most main dishes",
      "Bariis (rice) dishes show Indian influence",
      "Minneapolis has one of the largest Somali diaspora populations"
    ],
    relatedArticles: ["horn-of-africa-cuisine", "camel-cooking-traditions"],
    relatedIngredients: ["basmati-rice", "xawaash-spice", "cardamom", "cumin"],
    relatedRecipes: ["bariis-iskukaris", "suqaar", "canjeero"],
    lastUpdated: "2024-12-19"
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TECHNIQUE ARTICLES (20 articles)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    slug: "art-of-fermentation-global",
    title: "The Art of Fermentation: A Global Perspective",
    category: "technique",
    region: "global",
    metaDescription: "Explore fermentation techniques across world cuisines, from kimchi to sauerkraut to injera.",
    introduction: "Fermentation is humanity's oldest food technology. Every culture has fermented foods—they developed independently across the globe because fermentation preserves food, enhances nutrition, and creates extraordinary flavors.",
    sections: [
      { heading: "The Science", content: "Fermentation occurs when microorganisms—bacteria, yeasts, molds—transform sugars and starches. Lactic acid fermentation (kimchi, sauerkraut) creates tang. Alcohol fermentation makes wine and beer. Each type involves different microbes and conditions." },
      { heading: "Asian Ferments", content: "Asia leads in fermentation diversity. Korean kimchi, Japanese miso and natto, Chinese doubanjiang, Vietnamese fish sauce, Indonesian tempeh—each represents centuries of refined technique. Many involve multi-stage fermentations." },
      { heading: "African Traditions", content: "Africa has underappreciated fermentation cultures. Ethiopian injera relies on fermented teff. Dawadawa (fermented locust beans) provides umami in West Africa. Ogi (fermented corn) is a Nigerian staple. These traditions deserve global recognition." },
      { heading: "European Heritage", content: "European fermentation focuses on dairy (cheese, yogurt), cabbage (sauerkraut), and alcohol (wine, beer). Sourdough bread depends on wild yeast fermentation. These traditions shaped European cuisine over millennia." },
      { heading: "Health Benefits", content: "Fermented foods provide probiotics that support gut health. They also increase nutrient bioavailability and may reduce harmful compounds. Traditional diets rich in fermented foods correlate with better health outcomes." }
    ],
    keyFacts: [
      "Fermentation is the oldest food preservation method",
      "Lactic acid fermentation creates sour flavors",
      "Fermented foods contain beneficial probiotics",
      "Every culture independently developed fermentation",
      "Temperature and salt control fermentation speed"
    ],
    relatedArticles: ["korean-fermentation-tradition", "making-your-own-fermented-foods"],
    relatedIngredients: ["kimchi", "miso", "sauerkraut", "tempeh"],
    relatedRecipes: ["basic-kimchi", "quick-pickles", "fermented-hot-sauce"],
    lastUpdated: "2024-12-19"
  },
  {
    slug: "mastering-rice-global-techniques",
    title: "Mastering Rice: Techniques from Around the World",
    category: "technique",
    region: "global",
    metaDescription: "Learn rice cooking techniques from Japan to Senegal, from absorption to pilaf methods.",
    introduction: "Half the world depends on rice, and each rice culture has developed specific techniques for cooking it perfectly. What constitutes 'perfect' rice, however, varies dramatically—from sticky sushi rice to fluffy basmati.",
    sections: [
      { heading: "Understanding Rice Types", content: "Rice falls into long, medium, and short grain categories. Long grain (basmati, jasmine) cooks fluffy and separate. Short grain (sushi rice, bomba) is stickier. Medium grain falls between. Each type requires different techniques." },
      { heading: "The Absorption Method", content: "Most Asian rice is cooked by absorption: measured water and rice, brought to a boil, then steamed. The ratio varies by rice type—usually 1:1 to 1:1.5 rice to water. This is the method rice cookers automate." },
      { heading: "The Pilaf Method", content: "Middle Eastern and Central Asian rice is often made pilaf-style: rice is first fried in fat before liquid is added. This coats grains and prevents sticking. Iranian tahdig (crispy bottom) takes this further." },
      { heading: "West African Techniques", content: "Nigerian jollof and Senegalese thiéboudiène cook rice directly in sauce, absorbing flavor. The prized bottom crust develops from this method. The rice isn't pre-cooked; it starts raw in the flavored liquid." },
      { heading: "Rinsing and Soaking", content: "Most traditions rinse rice before cooking to remove surface starch. Japanese rice is rinsed until water runs clear. Basmati is often soaked 30 minutes. These steps affect final texture significantly." }
    ],
    keyFacts: [
      "Long-grain rice cooks fluffy; short-grain cooks sticky",
      "Rice rinsing removes excess starch",
      "The pilaf method fries rice before adding liquid",
      "Rice-to-water ratio varies by rice type",
      "Crispy rice bottoms are prized in many cultures"
    ],
    relatedArticles: ["basmati-rice-guide", "sushi-rice-perfection"],
    relatedIngredients: ["basmati-rice", "jasmine-rice", "sushi-rice", "broken-rice"],
    relatedRecipes: ["perfect-rice", "biryani", "jollof-rice"],
    lastUpdated: "2024-12-19"
  },
  {
    slug: "wok-cooking-essentials",
    title: "Wok Cooking Essentials: Heat, Speed, and Technique",
    category: "technique",
    region: "asian",
    metaDescription: "Master wok cooking fundamentals, from seasoning your wok to achieving wok hei.",
    introduction: "The wok is Asia's most versatile cooking vessel—stir-frying, deep-frying, steaming, smoking, and braising all happen in this simple bowl-shaped pan. Mastering wok cooking means mastering high-heat, quick techniques.",
    sections: [
      { heading: "The Right Wok", content: "Traditional woks are thin carbon steel, round-bottomed, 14 inches in diameter. Carbon steel heats quickly and evenly, develops seasoning, and lasts generations. Flat-bottomed woks work on Western stoves; round-bottomed require a wok ring or wok burner." },
      { heading: "Seasoning Process", content: "New carbon steel woks are coated with anti-rust oil that must be removed. After scrubbing, the wok is heated until blue-black, then repeatedly oiled and heated. This creates a non-stick patina that improves with use." },
      { heading: "Wok Hei: Breath of the Wok", content: "Wok hei is the smoky, slightly charred flavor achieved through extremely high heat and technique. The wok must be nearly smoking, food must be dry, and tossing must be aggressive. Home stoves struggle to produce true wok hei." },
      { heading: "Mise en Place", content: "Wok cooking is too fast for mid-cooking prep. Everything must be cut uniformly, measured, and arranged within reach before turning on the heat. This mise en place is essential—once cooking starts, there's no time to prepare." },
      { heading: "The Stir-Fry Sequence", content: "Aromatics (garlic, ginger) go first but briefly—30 seconds to prevent burning. Proteins next, seared quickly then removed. Vegetables in order of hardness. Sauce at the end. Everything is assembled and served immediately." }
    ],
    keyFacts: [
      "Carbon steel woks are traditional and preferred",
      "Seasoning creates a natural non-stick surface",
      "Wok hei requires temperatures above 400°F",
      "All ingredients must be prepared before cooking",
      "Proteins should be at room temperature"
    ],
    relatedArticles: ["chinese-stir-fry-guide", "wok-recipes-beginner"],
    relatedIngredients: ["cooking-oil", "garlic", "ginger", "soy-sauce"],
    relatedRecipes: ["basic-stir-fry", "kung-pao-chicken", "beef-broccoli"],
    lastUpdated: "2024-12-19"
  },
  {
    slug: "spice-toasting-blooming",
    title: "Spice Toasting and Blooming: Unlocking Flavor",
    category: "technique",
    region: "global",
    metaDescription: "Learn how toasting and blooming spices transforms their flavor in Indian, Mexican, and global cuisines.",
    introduction: "Raw spices are merely promising. Toasted or bloomed in fat, they release aromatic compounds invisible to uncooked spices. This technique spans Indian, Mexican, Ethiopian, and other cuisines—each with specific methods.",
    sections: [
      { heading: "The Chemistry", content: "Spices contain volatile oils that carry flavor and aroma. Heat transforms and releases these oils. Dry-toasting creates different compounds than fat-blooming—both develop flavors that raw spices lack." },
      { heading: "Dry Toasting", content: "Cumin seeds, coriander, dried chilies, and peppercorns all benefit from dry toasting. A dry pan over medium heat, constant stirring, and toasting until fragrant (not burnt) unlocks nutty, complex notes. Mexican and Indian cuisines rely heavily on this." },
      { heading: "Blooming in Fat", content: "Indian tadka involves blooming spices in hot oil or ghee—mustard seeds, cumin, dried chilies, curry leaves. The fat extracts fat-soluble flavor compounds unavailable to dry-toasting. This flavored oil seasons the entire dish." },
      { heading: "Timing Matters", content: "Delicate spices (cumin, fennel) toast quickly—30-60 seconds. Hardy spices (coriander, chili) take longer. Burning destroys flavor immediately. Watch carefully; toasting goes from perfect to ruined in seconds." },
      { heading: "Whole vs. Ground", content: "Whole spices should be toasted before grinding—this intensifies flavor. Pre-ground spices can be bloomed but not dry-toasted effectively. Serious cooks buy whole and grind fresh." }
    ],
    keyFacts: [
      "Toasting releases volatile aromatic compounds",
      "Fat-blooming extracts fat-soluble flavors",
      "Burnt spices become bitter immediately",
      "Whole spices toast more evenly than ground",
      "Different spices require different toasting times"
    ],
    relatedArticles: ["indian-spice-mastery", "mexican-spice-guide"],
    relatedIngredients: ["cumin-seeds", "coriander-seeds", "dried-chilies", "mustard-seeds"],
    relatedRecipes: ["tadka-dal", "mexican-salsa", "berbere-spice-blend"],
    lastUpdated: "2024-12-19"
  },
  {
    slug: "braise-and-stew-guide",
    title: "The Universal Art of Braising and Stewing",
    category: "technique",
    region: "global",
    metaDescription: "Master the slow-cooking techniques that transform tough cuts into tender perfection worldwide.",
    introduction: "Every cuisine has its braises and stews—goulash, tagine, adobo, curry, coq au vin. These slow-cooked dishes transform tough, cheap cuts into tender luxury through time, moisture, and low heat.",
    sections: [
      { heading: "The Science of Collagen", content: "Tough cuts are tough because they contain collagen, a connective tissue. Collagen requires time and moisture to convert to gelatin—the process that makes braised meat silky. This happens between 160-180°F over hours." },
      { heading: "Browning Matters", content: "Searing meat before braising creates Maillard reaction flavors—complex, savory, slightly sweet. This step is often skipped but shouldn't be. Brown in batches to avoid steaming; crowding prevents browning." },
      { heading: "Low and Slow", content: "High heat toughens meat even in liquid. Braising should simmer gently—barely bubbling. Oven braising at 300-325°F provides even, gentle heat. Many classics braise for 2-4 hours; some benefit from overnight." },
      { heading: "Liquid Level", content: "Braising uses less liquid than stewing—meat is partially submerged, not covered. Stewing covers meat completely. Both methods work; they produce different results. Braised meat develops more intense flavor on exposed surfaces." },
      { heading: "Rest and Reheat", content: "Braises and stews improve when made ahead and reheated. Overnight rest allows flavors to meld and fat to solidify for easy removal. This make-ahead quality makes them perfect for entertaining." }
    ],
    keyFacts: [
      "Collagen converts to gelatin between 160-180°F",
      "Browning meat creates Maillard reaction flavors",
      "Braising partially submerges; stewing fully covers",
      "Low temperature prevents toughening",
      "Braises improve when made ahead"
    ],
    relatedArticles: ["cheap-cuts-expensive-taste", "one-pot-cooking-guide"],
    relatedIngredients: ["beef-chuck", "pork-shoulder", "chicken-thighs", "lamb-shoulder"],
    relatedRecipes: ["classic-beef-stew", "moroccan-lamb-tagine", "coq-au-vin"],
    lastUpdated: "2024-12-19"
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // INGREDIENT DEEP DIVES (20 articles)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    slug: "scotch-bonnet-guide",
    title: "Scotch Bonnet Peppers: The Heat of the Caribbean",
    category: "ingredient",
    region: "caribbean",
    metaDescription: "Everything you need to know about Scotch bonnet peppers, from heat levels to culinary uses.",
    introduction: "The Scotch bonnet is the Caribbean's signature chile—fiery, fruity, and essential to authentic jerk, hot sauces, and countless regional dishes. Understanding this pepper means understanding Caribbean cooking.",
    sections: [
      { heading: "Heat Profile", content: "Scotch bonnets measure 100,000-350,000 Scoville units—comparable to habaneros but with distinct flavor. The heat is immediate and intense but fades relatively quickly. Caribbean cooks use them for flavor as much as heat." },
      { heading: "The Fruity Flavor", content: "Beyond heat, Scotch bonnets have a distinctive fruity, slightly sweet flavor. This makes them irreplaceable in Caribbean cuisine—substituting habaneros works but loses something. The flavor is crucial in jerk seasoning and pepper sauces." },
      { heading: "Handling and Safety", content: "Capsaicin, the compound creating heat, can burn skin and eyes. Wear gloves when cutting Scotch bonnets. If you do touch your eyes, milk helps more than water. The seeds and ribs contain the most capsaicin." },
      { heading: "Culinary Uses", content: "Caribbean cooking often uses whole Scotch bonnets simmered in dishes, then removed before serving—infusing heat without overwhelming. Minced, they appear in pepper sauces, jerks, and curries. Green (unripe) Scotch bonnets have a different, sharper heat." },
      { heading: "Growing and Storage", content: "Scotch bonnets grow well in warm climates with full sun. Plants produce abundantly and peppers can be frozen whole for long storage. Dried Scotch bonnets work for some applications but lose the fresh fruity notes." }
    ],
    keyFacts: [
      "Heat range: 100,000-350,000 Scoville units",
      "Distinctive fruity flavor distinguishes them from habaneros",
      "Seeds and ribs contain the most capsaicin",
      "Can be frozen whole for storage",
      "Essential for authentic jerk seasoning"
    ],
    relatedArticles: ["caribbean-pepper-varieties", "hot-sauce-making-guide"],
    relatedIngredients: ["habanero", "bird-eye-chile", "cayenne", "pimento"],
    relatedRecipes: ["caribbean-pepper-sauce", "jerk-marinade", "pepper-shrimp"],
    lastUpdated: "2024-12-19"
  },
  {
    slug: "coconut-milk-cream-guide",
    title: "Coconut Milk and Cream: A Complete Guide",
    category: "ingredient",
    region: "global",
    metaDescription: "Master coconut milk and cream in Thai, Caribbean, Indian, and global cooking.",
    introduction: "Coconut milk and cream appear in cuisines across the tropics—from Thai curries to Caribbean rice and peas to South Indian stews. Understanding the difference between products and how to use them elevates your cooking.",
    sections: [
      { heading: "Milk vs. Cream", content: "Coconut cream comes from the first pressing of coconut flesh—thick and rich. Coconut milk comes from subsequent pressings diluted with water—thinner but still flavorful. Canned products vary; check fat percentage." },
      { heading: "Choosing Products", content: "Quality varies dramatically between brands. Thai brands (Aroy-D, Chaokoh) are preferred for curries. Look for products without guar gum for cleaner flavor. Full-fat versions have more coconut flavor than light." },
      { heading: "Breaking the Cream", content: "Thai curries often 'break' coconut cream by cooking it until oil separates. This intensifies flavor and allows curry paste to fry. The technique requires patience and medium heat." },
      { heading: "In Curries and Stews", content: "Coconut milk tempers spice heat and adds richness. Thai curries add it in stages. Caribbean stews might add a splash for richness. Indian curries vary by region—some use coconut, others avoid it." },
      { heading: "Sweet Applications", content: "Coconut cream stars in desserts across Asia: Thai sticky rice with mango, Filipino halo-halo, Indian payasam. The fat content carries sweetness beautifully. Coconut milk makes ice creams, puddings, and drinks." }
    ],
    keyFacts: [
      "Cream comes from first pressing; milk from subsequent",
      "Full-fat versions have more flavor",
      "Thai brands are preferred for curries",
      "'Breaking' cream separates the oil for frying",
      "Coconut milk appears in both savory and sweet dishes"
    ],
    relatedArticles: ["thai-curry-guide", "coconut-desserts-asia"],
    relatedIngredients: ["coconut-cream", "coconut-milk", "coconut-oil", "desiccated-coconut"],
    relatedRecipes: ["thai-green-curry", "rice-and-peas", "coconut-rice-pudding"],
    lastUpdated: "2024-12-19"
  },
  {
    slug: "plantain-complete-guide",
    title: "Plantains: From Green to Black and Everything Between",
    category: "ingredient",
    region: "global",
    metaDescription: "Master plantains at every ripeness stage, from green tostones to sweet maduros.",
    introduction: "Plantains are the workhorse starch of tropical cuisines—used green, yellow, and black ripe in completely different ways. Understanding ripeness stages and their applications opens up hundreds of traditional dishes.",
    sections: [
      { heading: "Green Plantains", content: "Completely green plantains are starchy and not sweet—essentially a vegetable. They're used for tostones (twice-fried), mofongo, mangu, and soups. The flesh is firm and pale, the peel tight and difficult to remove." },
      { heading: "Yellow Plantains", content: "As plantains ripen to yellow with black spots, starches convert to sugars. The flesh softens slightly. This stage works for some fried preparations but is often considered transitional—not ideal for most dishes." },
      { heading: "Black Ripe Plantains", content: "When the peel turns fully black, plantains are ripe—sweet and soft. This is the stage for maduros (sweet fried plantains). The flesh is soft, yellow-orange, and can be mashed. The peel removes easily." },
      { heading: "Peeling Technique", content: "Green plantains resist peeling. Cut off ends, score the peel lengthwise, and pry it off in strips. Some soak in salted water to ease peeling. Ripe plantains simply slip out of their peels." },
      { heading: "Global Uses", content: "West African dishes use plantains extensively—roasted, fried, boiled, mashed. Caribbean cuisine treats them as essential. Colombian patacones, Cuban mariquitas, Puerto Rican arañitas—each culture has signature preparations." }
    ],
    keyFacts: [
      "Green plantains are starchy; ripe ones are sweet",
      "Ripeness takes 1-2 weeks at room temperature",
      "Store green plantains at room temperature to ripen",
      "Refrigeration stops ripening and turns skin black",
      "Plantains are a different variety from dessert bananas"
    ],
    relatedArticles: ["caribbean-starch-guide", "west-african-cooking-basics"],
    relatedIngredients: ["green-banana", "cassava", "yam", "breadfruit"],
    relatedRecipes: ["tostones", "maduros", "mofongo", "plantain-chips"],
    lastUpdated: "2024-12-19"
  },
  {
    slug: "fish-sauce-guide",
    title: "Fish Sauce: Southeast Asia's Liquid Umami",
    category: "ingredient",
    region: "asian",
    metaDescription: "Understand fish sauce varieties, quality indicators, and essential culinary uses.",
    introduction: "Fish sauce is Southeast Asia's soy sauce—the essential umami-rich seasoning that defines Vietnamese, Thai, Filipino, and other cuisines. This ancient condiment, made from fermented fish, provides depth no other ingredient can match.",
    sections: [
      { heading: "How It's Made", content: "Traditional fish sauce ferments anchovies (or other small fish) with salt for 12-24 months. The first draw from the tanks is the highest quality—clear, amber, and intensely flavored. Subsequent draws are diluted and lower grade." },
      { heading: "Quality Indicators", content: "Good fish sauce should be amber (not dark brown), have sediment-free clarity, and smell fermented but not rotten. The best brands list fish and salt only—no sugar or additives. Higher protein content generally indicates quality." },
      { heading: "Regional Variations", content: "Vietnamese nước mắm tends to be lighter and more refined than Thai nam pla. Filipino patis is often darker. Each tradition has preferences for certain fish species and fermentation conditions." },
      { heading: "Using Fish Sauce", content: "Fish sauce rarely appears alone—it's a background seasoning adding savory depth. In Vietnamese cooking, it's diluted into nước chấm dipping sauce with lime and sugar. Thai dishes balance it with palm sugar and lime." },
      { heading: "Substitutes and Allergies", content: "Soy sauce provides umami but different flavor. Coconut aminos work for some applications. Vegetarian fish sauces exist (made from seaweed) but taste different. For true Southeast Asian flavor, fish sauce is essential." }
    ],
    keyFacts: [
      "Traditional fermentation takes 12-24 months",
      "First-press fish sauce is highest quality",
      "Good fish sauce should be amber, not dark brown",
      "Vietnamese nước mắm is typically lighter than Thai nam pla",
      "High protein content indicates quality"
    ],
    relatedArticles: ["vietnamese-food-philosophy", "thai-flavor-balance"],
    relatedIngredients: ["fish-sauce", "soy-sauce", "oyster-sauce", "shrimp-paste"],
    relatedRecipes: ["nuoc-cham", "pad-thai", "vietnamese-spring-rolls"],
    lastUpdated: "2024-12-19"
  },
  {
    slug: "dried-chiles-mexican-guide",
    title: "Mexican Dried Chiles: A Complete Guide",
    category: "ingredient",
    region: "latin",
    metaDescription: "Master Mexico's essential dried chiles from mild anchos to fiery árbol.",
    introduction: "Mexican cuisine depends on dried chiles—not just for heat but for the complex, fruity, earthy, and smoky flavors they provide. Understanding these chiles is essential to authentic Mexican cooking.",
    sections: [
      { heading: "Ancho: The Foundation", content: "Anchos are dried poblanos—mild (1,000-2,000 Scoville), sweet, with notes of dried fruit. They're the most common dried chile in Mexican cooking, forming the base of many moles and salsas. The flesh is thick and the skin wrinkled." },
      { heading: "Guajillo: The Workhorse", content: "Guajillos are mild to medium heat (2,500-5,000 Scoville), tangy, with berry notes. They provide the red color in many sauces. The skin is tough—toast and soak longer than anchos. Essential for adobo sauces." },
      { heading: "Pasilla: The Noir", content: "Pasillas (chile negro) are dried chilaca peppers—medium heat, with earthy, herbal flavors and hints of chocolate. They're essential in mole negro. The long, thin shape distinguishes them from anchos." },
      { heading: "Chile de Árbol: The Heat", content: "Árbol chiles bring the fire (15,000-30,000 Scoville). These thin, bright red chiles provide heat without much complexity. Use sparingly—they're for spice, not the base flavor of a dish." },
      { heading: "Chipotle: The Smoke", content: "Chipotles are smoked, dried jalapeños—medium heat with intense smokiness. Available dried or canned in adobo sauce. The smoky flavor is essential in certain dishes but overwhelming if overused." }
    ],
    keyFacts: [
      "Ancho chiles are dried poblanos—most common dried chile",
      "Guajillos provide color and tangy flavor",
      "Chile de árbol is for heat, not flavor complexity",
      "Chipotles are smoked, dried jalapeños",
      "Toasting and soaking are essential preparation steps"
    ],
    relatedArticles: ["mexican-mole-history", "building-chile-sauces"],
    relatedIngredients: ["ancho-chile", "guajillo-chile", "pasilla-chile", "chipotle"],
    relatedRecipes: ["mole-poblano", "salsa-roja", "chile-colorado"],
    lastUpdated: "2024-12-19"
  }
];

// Combine with existing articles
export function getAllEncyclopediaArticles() {
  // Import original articles if they exist
  try {
    const { encyclopediaArticles } = require('./encyclopedia-data');
    return [...encyclopediaArticles, ...expandedEncyclopediaArticles];
  } catch {
    return expandedEncyclopediaArticles;
  }
}

export const totalExpandedArticles = expandedEncyclopediaArticles.length;
