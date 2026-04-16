/**
 * StoresGo Buyer SEO Data - Enhanced for Maximum Uniqueness
 * Each cuisine has: cultural context, recipes, shopping tips, seasonal items
 */

export interface Cuisine {
  slug: string;
  label: string;
  flag: string;
  region: "caribbean" | "latin" | "asian" | "african" | "european" | "middle-eastern" | "american";
  keywords: string[];
  popularItems: string[];
  description: string;
  culturalContext: string;
  signatureDishes: string[];
  shoppingTips: string[];
  seasonalHighlights: string;
}

export interface Location {
  slug: string;
  label: string;
  state: string;
  type: "region" | "county" | "city";
  neighborhoods?: string[];
  demographicNote: string;
  deliveryInfo: string;
}

export const CUISINES: Cuisine[] = [
  // Caribbean
  {
    slug: "caribbean",
    label: "Caribbean",
    flag: "🌴",
    region: "caribbean",
    keywords: ["caribbean grocery", "island food", "west indian grocery", "caribbean market"],
    popularItems: ["jerk seasoning", "scotch bonnet peppers", "plantains", "coconut milk", "rum cake", "sorrel", "callaloo"],
    description: "Authentic Caribbean groceries featuring flavors from Jamaica, Trinidad, Haiti, and the Islands",
    culturalContext: "Caribbean cuisine blends African, European, Indian, and indigenous Taíno influences, creating bold flavors defined by allspice, scotch bonnet peppers, and tropical fruits.",
    signatureDishes: ["Jerk Chicken", "Curry Goat", "Oxtail Stew", "Rice and Peas", "Fried Plantains"],
    shoppingTips: ["Look for Grace and Walkerswood brands for authentic seasonings", "Fresh scotch bonnets are spicier than dried", "Green plantains are for frying, yellow for sweetness"],
    seasonalHighlights: "Sorrel drink and rum cake are essential for Christmas celebrations; mango season peaks in summer"
  },
  {
    slug: "jamaican",
    label: "Jamaican",
    flag: "🇯🇲",
    region: "caribbean",
    keywords: ["jamaican grocery store", "jamaican food market", "jamaican patties near me", "jerk seasoning", "jamaican spices"],
    popularItems: ["Grace coconut milk", "Walkerswood jerk marinade", "ackee", "saltfish", "bammy", "sorrel", "Blue Mountain coffee", "Jamaican hard dough bread"],
    description: "Authentic Jamaican groceries - from jerk seasonings to ackee and saltfish, the national dish",
    culturalContext: "Jamaican cuisine is the heart of Caribbean cooking, famous worldwide for jerk seasoning—a fiery blend of scotch bonnet, allspice, and thyme that defines the island's flavor.",
    signatureDishes: ["Ackee and Saltfish", "Jerk Chicken", "Oxtail with Butter Beans", "Curry Goat", "Escovitch Fish", "Jamaican Beef Patties"],
    shoppingTips: ["Canned ackee is safer than fresh (fresh requires proper preparation)", "Authentic jerk needs pimento wood chips for smoking", "Look for 'Grace' brand for trusted quality"],
    seasonalHighlights: "Christmas means sorrel drink, rum cake, and gungo peas; Easter brings bun and cheese tradition"
  },
  {
    slug: "haitian",
    label: "Haitian",
    flag: "🇭🇹",
    region: "caribbean",
    keywords: ["haitian grocery store", "haitian food market", "creole food", "haitian spices", "epis seasoning"],
    popularItems: ["epis", "pikliz", "djon djon mushrooms", "akasan", "Haitian rice", "joumou squash", "maggi cubes", "kasav"],
    description: "Traditional Haitian groceries - épis seasoning base, pikliz condiment, and Creole essentials",
    culturalContext: "Haitian Creole cuisine combines French culinary techniques with African and Taíno traditions. Épis, the aromatic green seasoning base, is the foundation of almost every dish.",
    signatureDishes: ["Griot (Fried Pork)", "Soup Joumou", "Diri ak Djon Djon", "Tassot", "Legim", "Poulet aux Noix"],
    shoppingTips: ["Make épis fresh weekly for best flavor", "Djon djon mushrooms create unique black rice", "Pikliz should be spicy—adjust scotch bonnets to taste"],
    seasonalHighlights: "Soup Joumou on January 1st celebrates Haitian independence; it's the most important dish of the year"
  },
  {
    slug: "cuban",
    label: "Cuban",
    flag: "🇨🇺",
    region: "caribbean",
    keywords: ["cuban grocery store", "cuban food market", "cuban coffee", "mojo criollo", "cuban bread"],
    popularItems: ["Café Bustelo", "Café La Llave", "mojo criollo", "Cuban crackers", "guava paste", "yuca", "platanos maduros", "sazon completa"],
    description: "Authentic Cuban groceries - café Cubano, mojo marinades, and traditional Cuban ingredients",
    culturalContext: "Cuban cuisine reflects Spanish colonial heritage with African and Caribbean influences. The sofrito base, citrus-garlic mojo, and strong coffee culture define Cuban cooking.",
    signatureDishes: ["Ropa Vieja", "Lechón Asado", "Cuban Sandwich", "Picadillo", "Arroz con Pollo", "Yuca con Mojo"],
    shoppingTips: ["Cuban coffee should be strong—espresso roast is essential", "Mojo needs sour orange juice (or lime + OJ mix)", "Authentic Cuban bread has lard and a palmetto leaf crease"],
    seasonalHighlights: "Nochebuena (Christmas Eve) centers on lechón asado; Miami's Calle Ocho festival in March celebrates Cuban culture"
  },
  {
    slug: "trinidadian",
    label: "Trinidadian",
    flag: "🇹🇹",
    region: "caribbean",
    keywords: ["trinidadian grocery", "trini food", "doubles near me", "trinidad roti", "caribbean curry"],
    popularItems: ["curry powder", "doubles mix", "pepper sauce", "channa", "roti skins", "pholourie mix", "shadow beni", "Caribbean green seasoning"],
    description: "Authentic Trinidadian groceries - curry, doubles, pepper sauce, and Indo-Caribbean favorites",
    culturalContext: "Trinidad's cuisine uniquely blends Indian, African, Chinese, and Creole traditions. The Indian influence shows in doubles, roti, and curry, while African heritage brings callaloo and pelau.",
    signatureDishes: ["Doubles", "Curry Chicken with Roti", "Pelau", "Callaloo", "Bake and Shark", "Pholourie"],
    shoppingTips: ["Trini curry powder is different from Indian—it includes more cumin and coriander", "Shadow beni (culantro) is essential for green seasoning", "Hot pepper sauce should be scotch bonnet-based"],
    seasonalHighlights: "Carnival season means bake and shark and endless doubles; Divali brings sweet treats like kurma and barfi"
  },
  {
    slug: "puerto-rican",
    label: "Puerto Rican",
    flag: "🇵🇷",
    region: "caribbean",
    keywords: ["puerto rican grocery store", "boricua food", "goya products", "sofrito", "puerto rican spices"],
    popularItems: ["sofrito", "adobo", "sazón Goya", "gandules", "mofongo mix", "recaito", "alcaparrado", "tostonera"],
    description: "Puerto Rican grocery essentials - sofrito, sazón, and authentic Boricua flavors",
    culturalContext: "Puerto Rican cuisine (cocina criolla) blends Taíno, Spanish, and African traditions. Sofrito and sazón form the flavor base of nearly every dish, creating the island's distinctive taste.",
    signatureDishes: ["Mofongo", "Pernil", "Arroz con Gandules", "Tostones", "Alcapurrias", "Pasteles"],
    shoppingTips: ["Goya is the go-to brand for authentic ingredients", "Fresh sofrito beats jarred—blend yourself", "Gandules (pigeon peas) come canned or dried—canned is convenient"],
    seasonalHighlights: "Christmas means pernil, pasteles, and coquito (coconut eggnog); Three Kings Day on January 6th is bigger than Christmas"
  },
  {
    slug: "dominican",
    label: "Dominican",
    flag: "🇩🇴",
    region: "caribbean",
    keywords: ["dominican grocery store", "dominican food market", "platanos", "dominican salami", "queso de freir"],
    popularItems: ["salami dominicano", "queso de freir", "viveres", "morir soñando mix", "sazón dominicano", "longaniza", "casabe", "habichuelas guisadas"],
    description: "Dominican grocery favorites - salami, queso de freir, and traditional viveres",
    culturalContext: "Dominican cuisine centers on 'la bandera' (the flag)—rice, beans, and meat—served daily. The mangú breakfast of mashed plantains with fried cheese and salami is iconic.",
    signatureDishes: ["Mangú con Los Tres Golpes", "Sancocho", "La Bandera", "Chicharrón de Pollo", "Morir Soñando", "Habichuelas con Dulce"],
    shoppingTips: ["Dominican salami is fattier and more flavorful than regular salami", "Queso de freir must be the frying kind—it holds shape", "Green plantains for mangú, ripe for maduros"],
    seasonalHighlights: "Semana Santa (Holy Week) means habichuelas con dulce, a sweet bean dessert; sancocho is a Sunday tradition year-round"
  },
  {
    slug: "bahamian",
    label: "Bahamian",
    flag: "🇧🇸",
    region: "caribbean",
    keywords: ["bahamian grocery", "bahamian food", "conch near me", "island grocery"],
    popularItems: ["conch", "johnnycake mix", "guava duff", "hot pepper sauce", "pigeon peas", "grits", "Bahamian seasoning"],
    description: "Bahamian grocery specialties - fresh conch, johnnycake, and island favorites",
    culturalContext: "Bahamian cuisine is defined by the sea. Conch appears in every form—cracked, salad, fritters, and chowder. British influence shows in peas and rice, while African heritage brings grits and johnnycakes.",
    signatureDishes: ["Conch Salad", "Cracked Conch", "Peas and Rice", "Johnnycakes", "Guava Duff", "Stew Fish"],
    shoppingTips: ["Fresh conch needs proper tenderizing—pound it well", "Johnnycake is slightly sweet, like cornbread", "Goat pepper is the Bahamian hot pepper of choice"],
    seasonalHighlights: "Junkanoo festival means conch everything; souse is a traditional hangover cure for New Year's Day"
  },
  {
    slug: "barbadian",
    label: "Barbadian",
    flag: "🇧🇧",
    region: "caribbean",
    keywords: ["barbadian grocery", "bajan food", "caribbean grocery", "bajan seasoning"],
    popularItems: ["cou-cou mix", "flying fish seasoning", "bajan pepper sauce", "Banks beer", "falernum", "breadfruit", "cassava pone mix"],
    description: "Bajan grocery essentials - cou-cou, pepper sauce, and Barbadian specialties",
    culturalContext: "Barbadian (Bajan) cuisine shows strong British colonial influence alongside African traditions. Cou-cou with flying fish is the national dish, and pepper sauce is on every table.",
    signatureDishes: ["Cou-Cou and Flying Fish", "Pudding and Souse", "Macaroni Pie", "Fish Cakes", "Conkies", "Cassava Pone"],
    shoppingTips: ["Flying fish is seasonal—frozen works well year-round", "Bajan pepper sauce is mustard-based unlike other Caribbean sauces", "Cou-cou requires constant stirring—traditional uses a wooden stick called a 'cou-cou stick'"],
    seasonalHighlights: "Independence Day (November 30) means conkies wrapped in banana leaves; Crop Over festival in August celebrates harvest"
  },
  // Latin American
  {
    slug: "mexican",
    label: "Mexican",
    flag: "🇲🇽",
    region: "latin",
    keywords: ["mexican grocery store", "mexican food market", "tortilleria near me", "mexican spices", "hispanic grocery"],
    popularItems: ["corn tortillas", "flour tortillas", "chile peppers", "masa harina", "queso fresco", "mole paste", "tomatillos", "chipotle in adobo"],
    description: "Authentic Mexican groceries - fresh tortillas, dried chiles, salsas, and traditional ingredients",
    culturalContext: "Mexican cuisine is UNESCO-recognized cultural heritage. Regional diversity spans from Oaxacan moles to Yucatecan cochinita pibil, all built on the trinity of corn, beans, and chiles.",
    signatureDishes: ["Tacos al Pastor", "Mole Poblano", "Tamales", "Pozole", "Chiles Rellenos", "Carnitas", "Birria"],
    shoppingTips: ["Fresh tortillas from a tortilleria are incomparable to packaged", "Toast dried chiles before soaking for deeper flavor", "Cotija cheese is the Mexican parmesan—essential for street corn"],
    seasonalHighlights: "Day of the Dead means pan de muerto and sugar skulls; Christmas brings tamales and ponche; Cinco de Mayo celebrates mole"
  },
  {
    slug: "colombian",
    label: "Colombian",
    flag: "🇨🇴",
    region: "latin",
    keywords: ["colombian grocery store", "colombian food market", "arepas near me", "colombian coffee", "colombian restaurant"],
    popularItems: ["arepas", "panela", "Colombian coffee", "bocadillo", "buñuelos mix", "hogao sauce", "aji colombiano", "ajiaco ingredients"],
    description: "Colombian grocery favorites - arepas, panela, premium coffee, and Andean ingredients",
    culturalContext: "Colombian cuisine varies by region—coastal ceviche and coconut rice contrast with highland soups and arepas. Coffee culture is sacred, and panela (unrefined cane sugar) sweetens everything.",
    signatureDishes: ["Bandeja Paisa", "Arepas de Choclo", "Ajiaco", "Sancocho", "Empanadas", "Lechona"],
    shoppingTips: ["P.A.N. brand makes the best arepa flour", "Colombian coffee should be medium roast to appreciate its flavor", "Panela comes in blocks—grate it for drinks or melt for cooking"],
    seasonalHighlights: "Christmas means natilla and buñuelos; Barranquilla Carnival brings coastal seafood specialties"
  },
  {
    slug: "venezuelan",
    label: "Venezuelan",
    flag: "🇻🇪",
    region: "latin",
    keywords: ["venezuelan grocery store", "venezuelan food market", "harina pan", "arepas", "venezuelan restaurant"],
    popularItems: ["Harina P.A.N.", "queso blanco", "black beans", "cachitos", "tequeños", "pabellón criollo ingredients", "guasacaca"],
    description: "Venezuelan grocery essentials - Harina P.A.N., queso, and authentic Venezuelan flavors",
    culturalContext: "Venezuelan cuisine centers on the arepa—a cornmeal pocket that's breakfast, lunch, and dinner. Pabellón criollo, the national dish, tells the story of the country's diverse heritage.",
    signatureDishes: ["Arepas Reina Pepiada", "Pabellón Criollo", "Cachapas", "Tequeños", "Hallacas", "Asado Negro"],
    shoppingTips: ["Harina P.A.N. is THE arepa flour—accept no substitutes", "Venezuelan black beans are creamier than other varieties", "Queso de mano is the authentic cheese for cachapas"],
    seasonalHighlights: "Christmas means hallacas—labor-intensive tamales that take days to prepare; it's a family event"
  },
  {
    slug: "peruvian",
    label: "Peruvian",
    flag: "🇵🇪",
    region: "latin",
    keywords: ["peruvian grocery store", "peruvian food market", "aji amarillo", "peruvian spices", "ceviche ingredients"],
    popularItems: ["aji amarillo", "aji panca", "quinoa", "lucuma", "chicha morada", "papa seca", "huacatay", "rocoto"],
    description: "Peruvian grocery specialties - ají amarillo, quinoa, and Andean superfoods",
    culturalContext: "Peruvian cuisine is globally acclaimed, blending indigenous ingredients with Spanish, African, Chinese (chifa), and Japanese (nikkei) influences. Ají peppers and potatoes are foundational.",
    signatureDishes: ["Ceviche", "Lomo Saltado", "Aji de Gallina", "Causa", "Anticuchos", "Papa a la Huancaína"],
    shoppingTips: ["Aji amarillo paste is more convenient than fresh peppers", "Peruvian corn (choclo) has giant kernels—different from regular corn", "Lucuma powder is great for smoothies and ice cream"],
    seasonalHighlights: "June's Festival of the Sun (Inti Raymi) celebrates Andean heritage; ceviche is especially prized in summer"
  },
  {
    slug: "brazilian",
    label: "Brazilian",
    flag: "🇧🇷",
    region: "latin",
    keywords: ["brazilian grocery store", "brazilian food market", "pao de queijo", "acai", "brazilian products"],
    popularItems: ["pão de queijo", "guaraná", "farofa", "açaí", "brigadeiro mix", "tapioca flour", "palmito", "catupiry cheese"],
    description: "Brazilian grocery favorites - pão de queijo, açaí, guaraná, and tropical ingredients",
    culturalContext: "Brazilian cuisine spans the Amazon's tropical flavors to the gaucho churrasco tradition. African influence in Bahia created dishes like moqueca and acarajé.",
    signatureDishes: ["Feijoada", "Pão de Queijo", "Picanha", "Moqueca", "Coxinha", "Brigadeiro"],
    shoppingTips: ["Tapioca flour (not starch) is essential for pão de queijo", "Açaí should be unsweetened for authentic bowls", "Guaraná Antarctica is the classic Brazilian soda"],
    seasonalHighlights: "Carnival means feijoada and caipirinhas; June festivals (Festas Juninas) bring corn-based treats"
  },
  {
    slug: "argentinian",
    label: "Argentinian",
    flag: "🇦🇷",
    region: "latin",
    keywords: ["argentinian grocery", "argentinian food", "yerba mate", "dulce de leche", "empanadas"],
    popularItems: ["dulce de leche", "yerba mate", "chimichurri", "alfajores", "chorizo argentino", "provoleta", "membrillo"],
    description: "Argentinian grocery essentials - dulce de leche, yerba mate, and asado supplies",
    culturalContext: "Argentine cuisine is defined by beef and the asado tradition. Italian immigrant influence shows in pasta and pizza. Yerba mate drinking is a daily social ritual.",
    signatureDishes: ["Asado", "Empanadas", "Milanesa", "Provoleta", "Alfajores", "Choripán"],
    shoppingTips: ["Yerba mate requires a proper gourd and bombilla straw", "Dulce de leche should be thick—Argentine brands are best", "Real chimichurri needs fresh parsley and oregano"],
    seasonalHighlights: "Asado is a Sunday tradition year-round; Independence Day (July 9) means locro, a hearty corn stew"
  },
  {
    slug: "salvadoran",
    label: "Salvadoran",
    flag: "🇸🇻",
    region: "latin",
    keywords: ["salvadoran grocery", "pupuseria", "pupusas near me", "central american grocery", "salvadoran food"],
    popularItems: ["pupusa mix", "curtido", "loroco", "horchata salvadoreña", "quesillo", "chicharron", "platanos"],
    description: "Salvadoran grocery favorites - pupusa supplies, loroco, and Central American essentials",
    culturalContext: "Salvadoran cuisine centers on the pupusa—thick corn tortillas stuffed with cheese, beans, or chicharrón. Loroco flower buds add a unique flavor found nowhere else.",
    signatureDishes: ["Pupusas", "Yuca Frita", "Sopa de Pata", "Tamales de Elote", "Pastelitos", "Atol de Elote"],
    shoppingTips: ["Loroco comes frozen or in jars—frozen is more flavorful", "Pupusa masa should be softer than tortilla masa", "Curtido (cabbage slaw) should ferment slightly for best flavor"],
    seasonalHighlights: "National Pupusa Day (second Sunday of November) is celebrated nationwide; Holy Week means torrejas (Salvadoran French toast)"
  },
  {
    slug: "guatemalan",
    label: "Guatemalan",
    flag: "🇬🇹",
    region: "latin",
    keywords: ["guatemalan grocery", "guatemalan food", "central american grocery", "guatemalan restaurant"],
    popularItems: ["pepian spices", "tamalitos", "chuchitos", "black beans", "café guatemalteco", "incaparina", "rellenitos", "platanos"],
    description: "Guatemalan grocery specialties - pepián, tamales, and traditional Mayan-influenced ingredients",
    culturalContext: "Guatemalan cuisine preserves Mayan traditions more than anywhere else in Central America. Pepián, the national dish, is a complex spiced stew with pre-Columbian roots.",
    signatureDishes: ["Pepián", "Kak'ik", "Chiles Rellenos", "Jocón", "Tamales Colorados", "Rellenitos"],
    shoppingTips: ["Guatemalan pepitoria (pumpkin seeds) are essential for pepián", "Black cardamom appears in many highland dishes", "Guatemalan coffee is among the world's best—buy whole bean"],
    seasonalHighlights: "Semana Santa in Antigua is world-famous; fiambre on November 1st is a massive salad for Day of the Dead"
  },
  {
    slug: "honduran",
    label: "Honduran",
    flag: "🇭🇳",
    region: "latin",
    keywords: ["honduran grocery", "honduran food", "baleadas", "central american grocery"],
    popularItems: ["baleada supplies", "mantequilla hondureña", "frijoles", "tajadas", "café hondureño", "horchata", "quesillo"],
    description: "Honduran grocery essentials - baleada ingredients and Central American favorites",
    culturalContext: "Honduran cuisine is built on the baleada—a flour tortilla folded with refried beans, cheese, and cream. Coastal areas feature Garifuna flavors with coconut and seafood.",
    signatureDishes: ["Baleadas", "Plato Típico", "Sopa de Caracol", "Tamales", "Pastelitos de Carne", "Tajadas"],
    shoppingTips: ["Honduran crema is thinner than Mexican—essential for baleadas", "Quesillo (string cheese) should be fresh", "Flour tortillas for baleadas should be thick and soft"],
    seasonalHighlights: "Independence Day (September 15) means baleadas everywhere; Semana Santa brings torrejas and rice pudding"
  },
  {
    slug: "nicaraguan",
    label: "Nicaraguan",
    flag: "🇳🇮",
    region: "latin",
    keywords: ["nicaraguan grocery", "nicaraguan food", "gallo pinto", "central american grocery"],
    popularItems: ["gallo pinto mix", "nacatamal leaves", "tiste", "vigorón supplies", "quesillo", "churrasco spices", "pinolillo"],
    description: "Nicaraguan grocery favorites - gallo pinto, nacatamales, and traditional Nica foods",
    culturalContext: "Nicaraguan cuisine combines indigenous, Spanish, and Creole traditions. Gallo pinto (rice and beans) is eaten daily, while nacatamales are the labor of love for celebrations.",
    signatureDishes: ["Gallo Pinto", "Nacatamales", "Vigorón", "Indio Viejo", "Quesillo", "Rondón"],
    shoppingTips: ["Gallo pinto needs overnight beans and yesterday's rice", "Banana leaves for nacatamales must be softened over flame", "Pinolillo is a toasted corn beverage—drink it cold"],
    seasonalHighlights: "Purísima celebrations in December honor the Virgin Mary with traditional foods; nacatamales are Christmas morning tradition"
  },
  {
    slug: "ecuadorian",
    label: "Ecuadorian",
    flag: "🇪🇨",
    region: "latin",
    keywords: ["ecuadorian grocery", "ecuadorian food", "latin grocery", "ecuadorian restaurant"],
    popularItems: ["encebollado mix", "morocho", "ceviche supplies", "green plantains", "aji criollo", "tomate de árbol", "canguil", "chifles"],
    description: "Ecuadorian grocery specialties - encebollado, ceviche, and Andean ingredients",
    culturalContext: "Ecuadorian cuisine divides into four regions: coast (ceviche, encebollado), highlands (locro, hornado), Amazon, and Galápagos. Ají is the essential condiment on every table.",
    signatureDishes: ["Encebollado", "Ceviche Ecuatoriano", "Llapingachos", "Hornado", "Locro de Papa", "Fritada"],
    shoppingTips: ["Ecuadorian ceviche uses tomato sauce unlike Peruvian", "Green plantains make chifles—slice thin and fry crispy", "Aji criollo should be bright and fresh-tasting"],
    seasonalHighlights: "Fanesca during Holy Week is a complex soup with 12 grains for the 12 apostles; Día de los Difuntos means colada morada drink"
  },
  // Asian
  {
    slug: "asian",
    label: "Asian",
    flag: "🌏",
    region: "asian",
    keywords: ["asian grocery store", "asian food market", "oriental grocery", "asian supermarket near me"],
    popularItems: ["jasmine rice", "soy sauce", "rice noodles", "tofu", "sesame oil", "fish sauce", "miso", "rice vinegar"],
    description: "Comprehensive Asian groceries - from East to Southeast Asia",
    culturalContext: "Asian cuisines share rice as a staple but diverge dramatically in techniques and flavors—from Japanese umami minimalism to Sichuan fire to Thai balance of sweet, sour, salty, and spicy.",
    signatureDishes: ["Fried Rice", "Stir-Fry", "Curry", "Noodle Soup", "Dumplings", "Sushi"],
    shoppingTips: ["Jasmine rice is Thai, calrose is Japanese-style", "Light soy for cooking, dark soy for color", "Fresh is always best for tofu—check the date"],
    seasonalHighlights: "Lunar New Year (January/February) is the biggest celebration across Asian cultures"
  },
  {
    slug: "chinese",
    label: "Chinese",
    flag: "🇨🇳",
    region: "asian",
    keywords: ["chinese grocery store", "chinese supermarket", "asian grocery", "chinese food market"],
    popularItems: ["soy sauce", "hoisin sauce", "oyster sauce", "five spice", "rice noodles", "dim sum", "Shaoxing wine", "black vinegar"],
    description: "Chinese grocery essentials - sauces, noodles, dim sum, and regional specialties",
    culturalContext: "Chinese cuisine spans eight major regional traditions—Cantonese, Sichuan, Hunan, and more—each with distinct flavors. Wok cooking and the balance of flavors define the cuisine.",
    signatureDishes: ["Kung Pao Chicken", "Dim Sum", "Peking Duck", "Mapo Tofu", "Sweet and Sour Pork", "Hot Pot"],
    shoppingTips: ["Lee Kum Kee and Pearl River Bridge are trusted sauce brands", "Shaoxing wine is essential—no substitute", "Fresh noodles beat dried for stir-fry"],
    seasonalHighlights: "Chinese New Year means dumplings (wealth) and fish (prosperity); Mid-Autumn Festival brings mooncakes"
  },
  {
    slug: "japanese",
    label: "Japanese",
    flag: "🇯🇵",
    region: "asian",
    keywords: ["japanese grocery store", "japanese supermarket", "sushi supplies", "japanese ingredients", "asian market"],
    popularItems: ["sushi rice", "nori", "miso paste", "wasabi", "mirin", "dashi", "Japanese mayo", "panko", "sake"],
    description: "Japanese grocery favorites - sushi supplies, miso, ramen, and authentic ingredients",
    culturalContext: "Japanese cuisine emphasizes seasonality, presentation, and umami. From delicate kaiseki to hearty ramen, the focus on quality ingredients and technique is paramount.",
    signatureDishes: ["Sushi", "Ramen", "Tonkatsu", "Tempura", "Teriyaki", "Okonomiyaki", "Gyoza"],
    shoppingTips: ["Sushi rice must be short-grain Japanese variety", "Real wasabi is rare—most is horseradish-based", "Dashi powder is convenient; kombu and bonito make better stock"],
    seasonalHighlights: "New Year (Osechi) features elaborate boxed meals; cherry blossom season means sakura-themed treats"
  },
  {
    slug: "korean",
    label: "Korean",
    flag: "🇰🇷",
    region: "asian",
    keywords: ["korean grocery store", "korean supermarket", "kimchi near me", "kpop snacks", "korean bbq supplies"],
    popularItems: ["kimchi", "gochujang", "gochugaru", "bulgogi sauce", "Korean ramyun", "soju", "Korean rice", "doenjang"],
    description: "Korean grocery essentials - kimchi, gochujang, K-BBQ supplies and K-food favorites",
    culturalContext: "Korean cuisine centers on fermentation—kimchi, doenjang, gochujang. The communal BBQ tradition and banchan (side dishes) culture make Korean food inherently social.",
    signatureDishes: ["Korean BBQ", "Bibimbap", "Kimchi Jjigae", "Japchae", "Tteokbokki", "Samgyupsal"],
    shoppingTips: ["Gochugaru (pepper flakes) are different from regular chili flakes", "Fresh kimchi is different from fermented—both have uses", "Korean soy sauce (guk-ganjang) is saltier than Chinese"],
    seasonalHighlights: "Chuseok (harvest moon) means songpyeon rice cakes; Lunar New Year features tteokguk soup"
  },
  {
    slug: "vietnamese",
    label: "Vietnamese",
    flag: "🇻🇳",
    region: "asian",
    keywords: ["vietnamese grocery store", "vietnamese supermarket", "pho ingredients", "banh mi supplies", "asian market"],
    popularItems: ["pho spices", "fish sauce", "rice paper", "banh mi supplies", "sriracha", "hoisin", "rice vermicelli", "Vietnamese coffee"],
    description: "Vietnamese grocery favorites - phở essentials, bánh mì supplies, and fresh herbs",
    culturalContext: "Vietnamese cuisine balances fresh herbs, fermented fish sauce, and complex broths. French colonial influence appears in bánh mì and coffee. Fresh, light, and balanced defines the cuisine.",
    signatureDishes: ["Phở", "Bánh Mì", "Bún Bò Huế", "Gỏi Cuốn", "Cơm Tấm", "Bánh Xèo"],
    shoppingTips: ["Phở needs star anise, cinnamon, and charred onion/ginger", "Fish sauce quality varies hugely—Red Boat is premium", "Fresh herbs (basil, mint, cilantro) are non-negotiable"],
    seasonalHighlights: "Tết (Lunar New Year) means bánh chưng sticky rice cakes; Mid-Autumn Festival brings mooncakes and lanterns"
  },
  {
    slug: "thai",
    label: "Thai",
    flag: "🇹🇭",
    region: "asian",
    keywords: ["thai grocery store", "thai supermarket", "curry paste", "thai ingredients", "asian market"],
    popularItems: ["curry paste", "coconut milk", "fish sauce", "pad thai noodles", "Thai basil", "galangal", "kaffir lime leaves", "palm sugar"],
    description: "Thai grocery essentials - curry pastes, coconut milk, and authentic Thai aromatics",
    culturalContext: "Thai cuisine masterfully balances sweet, sour, salty, and spicy in every dish. Regional variations range from fiery Isaan to creamy Southern curries. Fresh aromatics are essential.",
    signatureDishes: ["Pad Thai", "Green Curry", "Tom Yum", "Massaman Curry", "Som Tam", "Mango Sticky Rice"],
    shoppingTips: ["Mae Ploy and Maesri are reliable curry paste brands", "Thai basil is different from Italian—don't substitute", "Kaffir lime leaves can be frozen for months"],
    seasonalHighlights: "Songkran (Thai New Year in April) features special foods; mango season in summer means mango sticky rice"
  },
  {
    slug: "filipino",
    label: "Filipino",
    flag: "🇵🇭",
    region: "asian",
    keywords: ["filipino grocery store", "filipino supermarket", "pinoy food", "asian market", "filipino restaurant"],
    popularItems: ["adobo mix", "pancit noodles", "ube", "calamansi", "banana ketchup", "fish sauce (patis)", "coconut vinegar", "lumpia wrappers"],
    description: "Filipino grocery favorites - adobo, pancit, ube, and Pinoy kitchen essentials",
    culturalContext: "Filipino cuisine blends Malay, Chinese, Spanish, and American influences. Vinegar-based cooking, rich stews, and sweet desserts define the flavor profile. Food is central to Filipino gatherings.",
    signatureDishes: ["Adobo", "Sinigang", "Lechon", "Pancit", "Lumpia", "Kare-Kare", "Halo-Halo"],
    shoppingTips: ["Coconut vinegar gives authentic adobo flavor", "Ube extract or powder can substitute for fresh purple yam", "Calamansi can be frozen—squeeze straight from frozen"],
    seasonalHighlights: "Christmas season starts September in the Philippines; Noche Buena features lechon and queso de bola"
  },
  {
    slug: "indian",
    label: "Indian",
    flag: "🇮🇳",
    region: "asian",
    keywords: ["indian grocery store", "desi grocery", "indian supermarket", "spices", "indian food market"],
    popularItems: ["basmati rice", "garam masala", "ghee", "lentils (dal)", "curry powder", "paneer", "turmeric", "cumin", "coriander"],
    description: "Indian grocery essentials - premium spices, basmati, lentils, and authentic ingredients",
    culturalContext: "Indian cuisine varies dramatically by region—creamy Punjabi curries, tangy South Indian dosas, fiery Andhra dishes. Spice mastery defines Indian cooking; each blend tells a story.",
    signatureDishes: ["Butter Chicken", "Biryani", "Dal Makhani", "Tikka Masala", "Dosa", "Samosa", "Palak Paneer"],
    shoppingTips: ["Whole spices toasted and ground fresh are incomparably better", "Basmati should be aged for best texture", "Ghee brands matter—look for pure butter ghee"],
    seasonalHighlights: "Diwali means sweets galore—barfi, ladoo, jalebi; Holi features thandai drink and gujiya pastries"
  },
  {
    slug: "pakistani",
    label: "Pakistani",
    flag: "🇵🇰",
    region: "asian",
    keywords: ["pakistani grocery", "halal grocery", "desi grocery", "pakistani food market"],
    popularItems: ["biryani spices", "halal meat", "Shan masala", "vermicelli", "desi ghee", "nihari spices", "karahi spices", "lassi"],
    description: "Pakistani grocery favorites - biryani spices, halal products, and desi essentials",
    culturalContext: "Pakistani cuisine emphasizes meat dishes and rich, aromatic spices. Mughlai influence shows in biryanis and kebabs. Halal preparation is essential, and hospitality is paramount.",
    signatureDishes: ["Biryani", "Nihari", "Karahi", "Seekh Kebab", "Haleem", "Chapli Kebab"],
    shoppingTips: ["Shan and National are trusted spice mix brands", "Halal certification matters—check labels", "Pakistani basmati is particularly aromatic"],
    seasonalHighlights: "Eid ul-Fitr means sheer khurma and biryani; Eid ul-Adha centers on meat dishes; Ramadan features iftar specials"
  },
  {
    slug: "bangladeshi",
    label: "Bangladeshi",
    flag: "🇧🇩",
    region: "asian",
    keywords: ["bangladeshi grocery", "bengali grocery", "desi grocery", "bangladeshi food"],
    popularItems: ["hilsa fish", "mustard oil", "panta bhat supplies", "mishti doi", "rice", "panch phoron", "begun bhaja spices"],
    description: "Bangladeshi grocery specialties - hilsa, mustard oil, and Bengali favorites",
    culturalContext: "Bangladeshi (Bengali) cuisine celebrates rice and fish—particularly the beloved hilsa. Mustard oil and panch phoron (five-spice) define the flavor profile. Sweets are legendary.",
    signatureDishes: ["Hilsa Fish Curry", "Biriyani", "Bhuna Khichuri", "Panta Bhat", "Mishti Doi", "Roshogolla"],
    shoppingTips: ["Mustard oil should be pungent—that's the point", "Hilsa is seasonal—frozen is available year-round", "Bengali sweets are best from specialty shops"],
    seasonalHighlights: "Pohela Boishakh (Bengali New Year) means panta bhat and hilsa; Durga Puja features elaborate feasts"
  },
  {
    slug: "indonesian",
    label: "Indonesian",
    flag: "🇮🇩",
    region: "asian",
    keywords: ["indonesian grocery", "indonesian food", "asian grocery", "indomie"],
    popularItems: ["sambal", "kecap manis", "tempeh", "rendang paste", "Indomie", "ketjap", "bumbu", "coconut milk"],
    description: "Indonesian grocery essentials - sambal, kecap manis, and authentic spices",
    culturalContext: "Indonesian cuisine spans 17,000 islands with incredible diversity. Dutch colonial and Chinese influences blend with indigenous spices. Sambal (chili paste) and kecap manis (sweet soy) are essential.",
    signatureDishes: ["Nasi Goreng", "Rendang", "Satay", "Gado-Gado", "Soto", "Bakso"],
    shoppingTips: ["Kecap manis is sweeter than regular soy sauce—essential for nasi goreng", "Make sambal fresh for best flavor", "Tempeh should be firm, not slimy"],
    seasonalHighlights: "Lebaran (Eid) means ketupat rice cakes and rendang; Nyepi in Bali means ritual fasting"
  },
  {
    slug: "malaysian",
    label: "Malaysian",
    flag: "🇲🇾",
    region: "asian",
    keywords: ["malaysian grocery", "malaysian food", "asian grocery", "laksa paste"],
    popularItems: ["satay sauce", "laksa paste", "nasi lemak supplies", "sambal belacan", "roti canai", "belacan", "pandan"],
    description: "Malaysian grocery favorites - laksa, satay, and Southeast Asian essentials",
    culturalContext: "Malaysian cuisine uniquely blends Malay, Chinese, and Indian traditions. Nasi lemak is the national dish. The interplay of sambal, coconut, and aromatics creates bold flavors.",
    signatureDishes: ["Nasi Lemak", "Laksa", "Satay", "Char Kway Teow", "Roti Canai", "Rendang"],
    shoppingTips: ["Belacan (shrimp paste) should be toasted before use", "Laksa paste varies by region—Penang vs Sarawak", "Pandan leaves add essential fragrance to rice and desserts"],
    seasonalHighlights: "Hari Raya means lemang and rendang; Chinese New Year brings yee sang prosperity salad"
  },
  // African
  {
    slug: "african",
    label: "African",
    flag: "🌍",
    region: "african",
    keywords: ["african grocery store", "african food market", "african supermarket", "african ingredients"],
    popularItems: ["palm oil", "fufu flour", "egusi", "plantains", "stockfish", "cassava", "groundnuts", "scotch bonnet"],
    description: "Pan-African groceries - from West Africa to East Africa and beyond",
    culturalContext: "African cuisines are incredibly diverse—West African stews with palm oil, East African grilled meats, North African tagines. Communal eating from shared plates is traditional.",
    signatureDishes: ["Jollof Rice", "Fufu with Soup", "Injera with Stew", "Tagine", "Bobotie", "Nyama Choma"],
    shoppingTips: ["Palm oil should be red and fragrant", "Cassava flour and fufu flour are different", "Stockfish needs overnight soaking"],
    seasonalHighlights: "Each country has unique celebrations—Eid across Muslim regions, Christmas feasts, harvest festivals"
  },
  {
    slug: "nigerian",
    label: "Nigerian",
    flag: "🇳🇬",
    region: "african",
    keywords: ["nigerian grocery store", "nigerian food market", "african grocery", "west african food"],
    popularItems: ["palm oil", "egusi", "ogbono", "stockfish", "garri", "pounded yam flour", "crayfish", "locust beans"],
    description: "Nigerian grocery essentials - palm oil, egusi, garri, and West African staples",
    culturalContext: "Nigerian cuisine varies by region—spicy Southern soups, Northern suya and tuwo. Palm oil is the cooking medium, and pounded yam with soup is the quintessential meal.",
    signatureDishes: ["Jollof Rice", "Egusi Soup", "Pepper Soup", "Suya", "Pounded Yam", "Moi Moi", "Akara"],
    shoppingTips: ["Red palm oil should be fresh—it goes rancid", "Egusi (melon seeds) can be ground or whole", "Stockfish and crayfish add umami depth"],
    seasonalHighlights: "Christmas and New Year mean jollof rice battles; traditional weddings feature elaborate feasts"
  },
  {
    slug: "ghanaian",
    label: "Ghanaian",
    flag: "🇬🇭",
    region: "african",
    keywords: ["ghanaian grocery", "ghanaian food", "african grocery", "west african market"],
    popularItems: ["shito", "kenkey", "banku mix", "palm nut soup", "kelewele spices", "kontomire", "palm oil", "smoked fish"],
    description: "Ghanaian grocery favorites - shito, banku, and authentic West African ingredients",
    culturalContext: "Ghanaian cuisine features fermented corn doughs (banku, kenkey) served with spicy pepper sauces. Shito (black pepper sauce) is the beloved condiment found in every home.",
    signatureDishes: ["Jollof Rice", "Banku with Tilapia", "Fufu with Light Soup", "Kelewele", "Waakye", "Red Red"],
    shoppingTips: ["Shito should be made with dried shrimp and fish", "Banku requires fermented corn dough", "Palm nut cream makes authentic palm nut soup"],
    seasonalHighlights: "Easter means kontomire stew; Independence Day (March 6) features national dishes"
  },
  {
    slug: "ethiopian",
    label: "Ethiopian",
    flag: "🇪🇹",
    region: "african",
    keywords: ["ethiopian grocery store", "ethiopian food market", "injera", "berbere", "african grocery"],
    popularItems: ["injera", "berbere", "mitmita", "teff flour", "niter kibbeh", "korerima", "besobela", "Ethiopian coffee"],
    description: "Ethiopian grocery essentials - injera, berbere, teff, and East African spices",
    culturalContext: "Ethiopian cuisine is unique in Africa—injera bread as plate and utensil, complex spice blends, and a coffee ceremony that's spiritual ritual. Fasting traditions create rich vegetarian dishes.",
    signatureDishes: ["Doro Wat", "Tibs", "Kitfo", "Misir Wat", "Shiro", "Gomen"],
    shoppingTips: ["Teff flour must be fermented for authentic injera", "Berbere quality varies—make your own or buy premium", "Ethiopian coffee ceremony requires special equipment"],
    seasonalHighlights: "Ethiopian New Year (Meskerem) features doro wat; coffee ceremonies are daily rituals"
  },
  {
    slug: "senegalese",
    label: "Senegalese",
    flag: "🇸🇳",
    region: "african",
    keywords: ["senegalese grocery", "senegalese food", "african grocery", "west african market"],
    popularItems: ["thieboudienne spices", "tamarind", "bissap", "palm oil", "yassa marinade", "nététou", "dried hibiscus", "baobab"],
    description: "Senegalese grocery specialties - thieboudienne, yassa, and West African flavors",
    culturalContext: "Senegalese cuisine is considered West Africa's finest. Thieboudienne (fish and rice) is the national dish. French colonial influence appears in bread culture and café-drinking.",
    signatureDishes: ["Thieboudienne", "Yassa Chicken", "Mafé", "Ceebu Jën", "Pastels", "Bissap Drink"],
    shoppingTips: ["Dried hibiscus (bissap) makes refreshing drinks", "Nététou (fermented locust beans) adds depth to stews", "Tamarind should be seedless for easy use"],
    seasonalHighlights: "Tabaski (Eid) means lamb dishes; Magal pilgrimage features special foods"
  },
  {
    slug: "cameroonian",
    label: "Cameroonian",
    flag: "🇨🇲",
    region: "african",
    keywords: ["cameroonian grocery", "cameroonian food", "african grocery", "central african food"],
    popularItems: ["ndolé leaves", "eru", "garri", "white pepper", "njanga", "bobolo", "palm oil", "egusi"],
    description: "Cameroonian grocery favorites - ndolé, eru, and Central African ingredients",
    culturalContext: "Cameroonian cuisine varies from forest (ndolé, eru) to Sahel (grilled meats). 'Africa in miniature' means incredible food diversity. Ndolé (bitterleaf stew) is the national dish.",
    signatureDishes: ["Ndolé", "Eru", "Koki", "Poulet DG", "Sanga", "Achu Soup"],
    shoppingTips: ["Dried ndolé leaves need multiple washes to remove bitterness", "Eru (wild spinach) is different from regular greens", "White pepper is used more than black in Cameroon"],
    seasonalHighlights: "National Day (May 20) celebrates with traditional dishes; Christmas means poulet DG"
  },
  {
    slug: "south-african",
    label: "South African",
    flag: "🇿🇦",
    region: "african",
    keywords: ["south african grocery", "south african food", "biltong", "african grocery"],
    popularItems: ["biltong", "boerewors spices", "rooibos tea", "chakalaka", "peri-peri", "Mrs. Balls Chutney", "rusks", "koeksisters"],
    description: "South African grocery essentials - biltong, boerewors, and braai favorites",
    culturalContext: "South African 'rainbow nation' cuisine blends Dutch Afrikaner, British, Malay, and indigenous traditions. Braai (BBQ) culture is sacred; biltong is the beloved snack.",
    signatureDishes: ["Bobotie", "Boerewors", "Bunny Chow", "Peri-Peri Chicken", "Potjiekos", "Malva Pudding"],
    shoppingTips: ["Biltong should be slightly moist, not jerky-dry", "Boerewors needs the right spice blend and casings", "Rooibos is caffeine-free—brew longer than regular tea"],
    seasonalHighlights: "Heritage Day (September 24) is National Braai Day; Christmas is summer—outdoor grilling season"
  },
  {
    slug: "kenyan",
    label: "Kenyan",
    flag: "🇰🇪",
    region: "african",
    keywords: ["kenyan grocery", "kenyan food", "african grocery", "east african food"],
    popularItems: ["ugali flour", "sukuma wiki", "Kenyan tea", "nyama choma spices", "maize flour", "pilau spices", "chai masala"],
    description: "Kenyan grocery favorites - ugali, sukuma wiki, and East African staples",
    culturalContext: "Kenyan cuisine centers on ugali (maize porridge), the staple served with sukuma wiki (collard greens) or nyama choma (grilled meat). Tea culture is strong—Kenyan chai is legendary.",
    signatureDishes: ["Nyama Choma", "Ugali with Sukuma Wiki", "Pilau", "Githeri", "Samosas", "Chapati"],
    shoppingTips: ["Kenyan tea should be boiled with milk (chai)", "Ugali flour is finely ground maize", "Pilau spices include cumin, cardamom, and cinnamon"],
    seasonalHighlights: "Jamhuri Day (December 12) features nyama choma celebrations; harvest seasons bring fresh produce"
  },
  // Middle Eastern
  {
    slug: "middle-eastern",
    label: "Middle Eastern",
    flag: "🕌",
    region: "middle-eastern",
    keywords: ["middle eastern grocery", "arabic food", "halal grocery", "mediterranean market"],
    popularItems: ["hummus", "tahini", "pita bread", "za'atar", "olive oil", "halal meat", "falafel mix", "sumac"],
    description: "Middle Eastern groceries - hummus, tahini, halal products, and Mediterranean essentials",
    culturalContext: "Middle Eastern cuisine spans Arab, Persian, Turkish, and Israeli traditions. Mezze culture means sharing many small dishes. Hospitality is paramount—guests are honored with food.",
    signatureDishes: ["Hummus", "Falafel", "Shawarma", "Kebab", "Tabbouleh", "Baklava"],
    shoppingTips: ["Good tahini should be pourable, not stiff", "Pita should be soft and pocketable", "Za'atar blends vary by country—Lebanese, Palestinian, etc."],
    seasonalHighlights: "Ramadan iftar meals break daily fasts; Eid celebrations feature lamb and sweets"
  },
  {
    slug: "lebanese",
    label: "Lebanese",
    flag: "🇱🇧",
    region: "middle-eastern",
    keywords: ["lebanese grocery", "lebanese food", "mediterranean grocery", "middle eastern market"],
    popularItems: ["za'atar", "sumac", "labneh", "tahini", "pomegranate molasses", "bulgur", "rose water", "orange blossom water"],
    description: "Lebanese grocery essentials - za'atar, labneh, and Levantine ingredients",
    culturalContext: "Lebanese cuisine is the crown jewel of Middle Eastern cooking. Mezze culture—dozens of small dishes—defines dining. Fresh herbs, olive oil, and lemon are foundational.",
    signatureDishes: ["Hummus", "Tabbouleh", "Fattoush", "Kibbeh", "Kafta", "Shawarma", "Manakish"],
    shoppingTips: ["Lebanese za'atar has more sumac than Syrian", "Labneh should be thick and tangy", "Pomegranate molasses should be tart, not sweet"],
    seasonalHighlights: "Eid means ma'amoul cookies; kibbeh nayyeh is special occasion food; grape leaf season is spring"
  },
  {
    slug: "turkish",
    label: "Turkish",
    flag: "🇹🇷",
    region: "middle-eastern",
    keywords: ["turkish grocery", "turkish food", "mediterranean grocery", "turkish market"],
    popularItems: ["Turkish coffee", "baklava", "sucuk", "ayran", "Turkish delight", "pomegranate sauce", "isot pepper", "urfa biber"],
    description: "Turkish grocery favorites - coffee, baklava, and authentic Turkish ingredients",
    culturalContext: "Turkish cuisine bridges Europe and Asia. Ottoman palace cuisine influences modern cooking. Breakfast culture is elaborate; coffee fortune-telling is tradition.",
    signatureDishes: ["Döner Kebab", "Lahmacun", "Manti", "Iskender", "Pide", "Baklava", "Köfte"],
    shoppingTips: ["Turkish coffee requires extra-fine grind", "Sucuk is spicier than regular sausage", "Urfa biber and isot are similar—smoky, mild heat"],
    seasonalHighlights: "Ramadan means special pide bread; Şeker Bayramı (Sugar Festival) features sweets; pomegranate season is fall"
  },
  {
    slug: "persian",
    label: "Persian",
    flag: "🇮🇷",
    region: "middle-eastern",
    keywords: ["persian grocery", "iranian food", "middle eastern grocery", "persian market"],
    popularItems: ["saffron", "basmati rice", "dried limes", "barberries", "rosewater", "kashk", "pomegranate paste", "lavashak"],
    description: "Persian grocery essentials - premium saffron, dried fruits, and Iranian ingredients",
    culturalContext: "Persian cuisine is ancient and sophisticated—aromatic rice dishes, complex stews (khoresh), and the art of tahdig (crispy rice). Saffron, dried fruits, and nuts define the flavor.",
    signatureDishes: ["Tahdig", "Ghormeh Sabzi", "Zereshk Polo", "Joojeh Kabab", "Fesenjan", "Ash Reshteh"],
    shoppingTips: ["Iranian saffron is the world's best—a little goes far", "Dried limes (limoo amani) should be pierced before adding to stews", "Barberries should be tart and bright red"],
    seasonalHighlights: "Nowruz (Persian New Year) features sabzi polo mahi (herb rice with fish); Yalda night means pomegranates and poetry"
  },
  {
    slug: "israeli",
    label: "Israeli",
    flag: "🇮🇱",
    region: "middle-eastern",
    keywords: ["israeli grocery", "kosher grocery", "mediterranean grocery", "jewish food"],
    popularItems: ["hummus", "falafel mix", "tahini", "challah", "Israeli salad ingredients", "halva", "za'atar", "schug"],
    description: "Israeli grocery favorites - falafel, hummus, and kosher products",
    culturalContext: "Israeli cuisine blends Middle Eastern, Mediterranean, and Jewish diaspora traditions. Street food culture thrives; hummus and falafel debates are passionate. Shabbat meals are sacred.",
    signatureDishes: ["Hummus", "Falafel", "Shakshuka", "Sabich", "Israeli Salad", "Schnitzel", "Jachnun"],
    shoppingTips: ["Israeli tahini is runnier than other types", "Schug (s'chug) is Yemenite hot sauce—essential", "Challah should be eggy and slightly sweet"],
    seasonalHighlights: "Shabbat means challah and traditional meals; Passover requires specific kosher-for-Passover products; Hanukkah brings sufganiyot (donuts)"
  },
  {
    slug: "moroccan",
    label: "Moroccan",
    flag: "🇲🇦",
    region: "african",
    keywords: ["moroccan grocery", "moroccan food", "north african grocery", "moroccan spices"],
    popularItems: ["ras el hanout", "preserved lemons", "couscous", "harissa", "argan oil", "orange blossom water", "mint tea", "merguez spices"],
    description: "Moroccan grocery essentials - ras el hanout, couscous, and North African spices",
    culturalContext: "Moroccan cuisine is aromatic and complex. Tagine cooking, couscous Fridays, and mint tea ceremony define the culture. Fez and Marrakech have distinct culinary traditions.",
    signatureDishes: ["Tagine", "Couscous", "Bastilla", "Harira", "Msemen", "Rfissa"],
    shoppingTips: ["Ras el hanout means 'head of the shop'—best spice blend", "Preserved lemons should age at least a month", "Couscous is traditionally hand-rolled—instant is different"],
    seasonalHighlights: "Ramadan breaks fast with harira soup and dates; Eid means lamb tagine; mint tea is served year-round"
  },
  // European
  {
    slug: "italian",
    label: "Italian",
    flag: "🇮🇹",
    region: "european",
    keywords: ["italian grocery store", "italian market", "pasta", "italian deli"],
    popularItems: ["pasta", "olive oil", "San Marzano tomatoes", "prosciutto", "parmigiano reggiano", "balsamic vinegar", "arborio rice", "pancetta"],
    description: "Italian grocery essentials - pasta, olive oil, and authentic Italian imports",
    culturalContext: "Italian cuisine is regional—Neapolitan pizza, Bolognese ragù, Sicilian seafood. Quality ingredients matter more than complex techniques. 'La dolce vita' means savoring life through food.",
    signatureDishes: ["Pasta Carbonara", "Margherita Pizza", "Risotto", "Osso Buco", "Tiramisu", "Lasagna"],
    shoppingTips: ["DOP/DOC labels guarantee authentic regional products", "Extra virgin olive oil should taste peppery", "Parmigiano Reggiano is aged 24+ months—accept no imitations"],
    seasonalHighlights: "Christmas Eve means Feast of Seven Fishes; Easter brings colomba cake; truffle season is fall"
  },
  {
    slug: "greek",
    label: "Greek",
    flag: "🇬🇷",
    region: "european",
    keywords: ["greek grocery", "greek food", "mediterranean grocery", "greek market"],
    popularItems: ["feta cheese", "olive oil", "olives", "phyllo dough", "honey", "oregano", "grape leaves", "ouzo"],
    description: "Greek grocery favorites - feta, olives, and Mediterranean essentials",
    culturalContext: "Greek cuisine is ancient Mediterranean wisdom—olive oil, honey, wine, and simple preparations that highlight quality ingredients. Mezze culture means long, social meals.",
    signatureDishes: ["Moussaka", "Souvlaki", "Spanakopita", "Greek Salad", "Gyros", "Baklava"],
    shoppingTips: ["Greek feta should be PDO certified", "Kalamata olives are different from regular black olives", "Greek oregano is more potent than Italian"],
    seasonalHighlights: "Easter is the biggest holiday—lamb, tsoureki bread, red eggs; summer means fresh tomatoes and watermelon"
  },
  {
    slug: "polish",
    label: "Polish",
    flag: "🇵🇱",
    region: "european",
    keywords: ["polish grocery store", "polish deli", "european grocery", "eastern european food"],
    popularItems: ["kielbasa", "pierogies", "sauerkraut", "Polish pickles", "rye bread", "bigos ingredients", "horseradish", "beet soup supplies"],
    description: "Polish grocery essentials - kielbasa, pierogies, and Eastern European favorites",
    culturalContext: "Polish cuisine is hearty and comforting—pork, cabbage, mushrooms, and dumplings. Catholic traditions shape the food calendar. Hospitality means the table is always full.",
    signatureDishes: ["Pierogi", "Bigos", "Żurek", "Kotlet Schabowy", "Barszcz", "Gołąbki"],
    shoppingTips: ["Kielbasa varieties differ—weselna, krajana, śląska each have uses", "Polish pickles are naturally fermented, not vinegar", "Dried forest mushrooms add depth to sauces"],
    seasonalHighlights: "Wigilia (Christmas Eve) has 12 dishes, no meat; Easter means żurek soup and white sausage; mushroom picking is fall tradition"
  },
  {
    slug: "russian",
    label: "Russian",
    flag: "🇷🇺",
    region: "european",
    keywords: ["russian grocery store", "russian deli", "european grocery", "eastern european food"],
    popularItems: ["pelmeni", "kvass", "smetana", "buckwheat", "black bread", "pickled vegetables", "herring", "condensed milk"],
    description: "Russian grocery favorites - pelmeni, buckwheat, and Slavic essentials",
    culturalContext: "Russian cuisine is built for cold winters—hearty soups, pickled vegetables, and preserved foods. Tea culture with jam (varenye) is central. Zakuski (appetizers) accompany vodka.",
    signatureDishes: ["Pelmeni", "Borscht", "Beef Stroganoff", "Blini", "Olivier Salad", "Shchi"],
    shoppingTips: ["Buckwheat (grechka) should be toasted before cooking", "Smetana is sourer than regular sour cream", "Black bread should be dense and slightly sour"],
    seasonalHighlights: "New Year is bigger than Christmas—Olivier salad is mandatory; Maslenitsa (Butter Week) means blini before Lent"
  },
  // American Regional
  {
    slug: "southern",
    label: "Southern",
    flag: "🇺🇸",
    region: "american",
    keywords: ["southern grocery", "soul food", "southern cooking supplies", "comfort food"],
    popularItems: ["grits", "collard greens", "hot sauce", "cornmeal", "black-eyed peas", "buttermilk", "country ham", "sweet tea"],
    description: "Southern grocery essentials - grits, collards, and soul food favorites",
    culturalContext: "Southern cuisine blends African, Native American, and European traditions. Soul food emerged from African American kitchens. Hospitality is legendary; Sunday dinner is sacred.",
    signatureDishes: ["Fried Chicken", "Shrimp and Grits", "Collard Greens", "Cornbread", "Biscuits and Gravy", "Pecan Pie"],
    shoppingTips: ["Stone-ground grits have more flavor than instant", "Collards need long cooking—low and slow", "Cast iron is essential for cornbread"],
    seasonalHighlights: "New Year means black-eyed peas for luck; summer is BBQ season; Thanksgiving is the Super Bowl of Southern cooking"
  },
  {
    slug: "cajun",
    label: "Cajun",
    flag: "⚜️",
    region: "american",
    keywords: ["cajun grocery", "cajun food", "louisiana grocery", "creole cooking", "new orleans food"],
    popularItems: ["andouille sausage", "cajun seasoning", "crawfish", "file powder", "hot sauce", "trinity vegetables", "tasso", "boudin"],
    description: "Cajun grocery favorites - andouille, crawfish, and Louisiana essentials",
    culturalContext: "Cajun cuisine comes from French-Canadian Acadians who settled Louisiana. The 'holy trinity' (onion, celery, bell pepper) is the base of everything. Creole is the city cousin, Cajun is country.",
    signatureDishes: ["Gumbo", "Jambalaya", "Crawfish Étouffée", "Boudin", "Red Beans and Rice", "Beignets"],
    shoppingTips: ["Andouille should be smoked and spicy", "File powder is ground sassafras—add after cooking", "Louisiana hot sauce (Crystal, Tabasco) is different from other hot sauces"],
    seasonalHighlights: "Mardi Gras means king cake; crawfish season is spring; summer brings Sno-balls (not snow cones)"
  }
];

export const LOCATIONS: Location[] = [
  {
    slug: "south-florida",
    label: "South Florida",
    state: "FL",
    type: "region",
    neighborhoods: ["Miami", "Fort Lauderdale", "West Palm Beach", "Hialeah", "Hollywood", "Pembroke Pines", "Boca Raton"],
    demographicNote: "South Florida has one of the most diverse populations in the US, with large Caribbean, Latin American, and international communities.",
    deliveryInfo: "We deliver throughout the tri-county area with same-day and next-day options available."
  },
  {
    slug: "miami-dade",
    label: "Miami-Dade County",
    state: "FL",
    type: "county",
    neighborhoods: ["Downtown Miami", "Little Havana", "Little Haiti", "Hialeah", "Kendall", "Doral", "Homestead", "Miami Beach", "Coral Gables", "Wynwood"],
    demographicNote: "Miami-Dade is majority Hispanic, with the largest Cuban-American population in the US and significant Haitian, Venezuelan, and Colombian communities.",
    deliveryInfo: "Miami-Dade delivery available 7 days a week with express options in central Miami."
  },
  {
    slug: "broward",
    label: "Broward County",
    state: "FL",
    type: "county",
    neighborhoods: ["Fort Lauderdale", "Hollywood", "Pembroke Pines", "Miramar", "Lauderhill", "Plantation", "Coral Springs", "Davie", "Sunrise"],
    demographicNote: "Broward County features strong Jamaican, Haitian, and Caribbean communities, particularly in Lauderhill, Miramar, and North Lauderdale.",
    deliveryInfo: "Broward delivery covers all major cities with same-day available in most areas."
  },
  {
    slug: "palm-beach",
    label: "Palm Beach County",
    state: "FL",
    type: "county",
    neighborhoods: ["West Palm Beach", "Boca Raton", "Delray Beach", "Boynton Beach", "Lake Worth", "Palm Beach Gardens", "Jupiter", "Wellington"],
    demographicNote: "Palm Beach County has growing Caribbean and Latin communities, particularly in Lake Worth, Boynton Beach, and West Palm Beach.",
    deliveryInfo: "Palm Beach County delivery available with next-day standard and same-day in select areas."
  }
];

export const BUYER_CATEGORIES = [
  { slug: "caribbean-grocery", title: "Caribbean Grocery Delivery", cuisines: ["caribbean", "jamaican", "haitian", "trinidadian", "cuban", "puerto-rican", "dominican", "bahamian", "barbadian"], description: "Authentic Caribbean groceries from the islands" },
  { slug: "latin-grocery", title: "Latin & Hispanic Grocery", cuisines: ["mexican", "colombian", "venezuelan", "peruvian", "brazilian", "argentinian", "salvadoran", "guatemalan", "honduran"], description: "Latin American groceries from Mexico to South America" },
  { slug: "asian-grocery", title: "Asian Grocery Delivery", cuisines: ["chinese", "japanese", "korean", "vietnamese", "thai", "filipino", "indian", "pakistani", "indonesian", "malaysian"], description: "Asian groceries from East to South Asia" },
  { slug: "african-grocery", title: "African Grocery Store", cuisines: ["nigerian", "ghanaian", "ethiopian", "senegalese", "kenyan", "south-african", "cameroonian", "moroccan"], description: "African groceries from across the continent" },
  { slug: "halal-grocery", title: "Halal Grocery Delivery", cuisines: ["middle-eastern", "pakistani", "bangladeshi", "lebanese", "turkish", "moroccan", "indonesian", "malaysian"], description: "Halal-certified groceries and Middle Eastern foods" }
];

export function generateBuyerPageData(cuisineSlug: string, locationSlug: string) {
  const cuisine = CUISINES.find(c => c.slug === cuisineSlug);
  const location = LOCATIONS.find(l => l.slug === locationSlug);
  if (!cuisine || !location) return null;

  return {
    cuisine,
    location,
    title: `${cuisine.label} Grocery Delivery in ${location.label} | StoresGo`,
    metaDescription: `Order authentic ${cuisine.label} groceries online in ${location.label}. Shop ${cuisine.popularItems.slice(0, 3).join(", ")} and more. ${cuisine.signatureDishes.slice(0, 2).join(", ")} ingredients delivered.`,
    h1: `${cuisine.label} Grocery Delivery in ${location.label}`,
    heroSubtitle: `${cuisine.culturalContext.split('.')[0]}. Fresh ${cuisine.popularItems.slice(0, 3).join(", ")} delivered from local stores.`,
    benefits: [
      `Shop from trusted ${cuisine.label} grocery stores in ${location.label}`,
      "Same-day and next-day delivery available",
      "Support local ethnic grocery businesses",
      `Authentic ${cuisine.label} products you can't find in regular supermarkets`,
      "Easy online ordering with secure checkout"
    ],
    popularSearches: [
      `${cuisine.label.toLowerCase()} grocery near me`,
      `${cuisine.label.toLowerCase()} food delivery ${location.label.split(' ')[0].toLowerCase()}`,
      `buy ${cuisine.label.toLowerCase()} food online`,
      `${cuisine.label.toLowerCase()} supermarket ${location.state}`,
      ...cuisine.keywords.slice(0, 2)
    ],
    nearbyAreas: location.neighborhoods || [],
    faqs: [
      {
        question: `Where can I find ${cuisine.label} groceries in ${location.label}?`,
        answer: `StoresGo connects you with local ${cuisine.label} grocery stores in ${location.label}. Browse authentic products like ${cuisine.popularItems.slice(0, 4).join(", ")} from verified sellers. ${location.demographicNote}`
      },
      {
        question: `What ${cuisine.label} dishes can I make with ingredients from StoresGo?`,
        answer: `Our ${cuisine.label} grocery partners stock everything you need for ${cuisine.signatureDishes.slice(0, 4).join(", ")}, and more. ${cuisine.shoppingTips[0]}`
      },
      {
        question: `Do you deliver ${cuisine.label} food to my area in ${location.label}?`,
        answer: `Yes! ${location.deliveryInfo} We deliver to ${(location.neighborhoods || []).slice(0, 5).join(", ")}, and more neighborhoods throughout ${location.label}.`
      },
      {
        question: `What makes ${cuisine.label} cuisine unique?`,
        answer: `${cuisine.culturalContext} ${cuisine.seasonalHighlights}`
      }
    ],
    shoppingTips: cuisine.shoppingTips,
    signatureDishes: cuisine.signatureDishes,
    culturalContext: cuisine.culturalContext,
    seasonalHighlights: cuisine.seasonalHighlights,
    demographicNote: location.demographicNote,
    deliveryInfo: location.deliveryInfo
  };
}

export default { CUISINES, LOCATIONS, BUYER_CATEGORIES, generateBuyerPageData };
