// ═══════════════════════════════════════════════════════════════════════════════
// STORESGO ENCYCLOPEDIA - AUTHORITY CONTENT FOR SEO
// ═══════════════════════════════════════════════════════════════════════════════

export interface EncyclopediaArticle {
  slug: string;
  title: string;
  category: "culture" | "history" | "technique" | "science" | "tradition" | "regional";
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

export const encyclopediaArticles: EncyclopediaArticle[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // CARIBBEAN CULTURE
  // ═══════════════════════════════════════════════════════════════════════════
  {
    slug: "history-of-haitian-cuisine",
    title: "The History of Haitian Cuisine: From Taíno Roots to Modern Diaspora",
    category: "history",
    region: "caribbean",
    metaDescription: "Explore the rich history of Haitian cuisine, from indigenous Taíno ingredients through French colonial influence to the vibrant diaspora kitchens of today.",
    introduction: "Haitian cuisine tells the story of a nation through flavor. Every dish carries echoes of the Taíno people who first cultivated these lands, the French colonizers who built plantations on their graves, and the African ancestors who transformed suffering into celebration through food. To understand Haitian cooking is to understand Haiti itself—resilient, complex, and profoundly delicious.",
    sections: [
      {
        heading: "Taíno Foundations",
        content: "Before Columbus arrived in 1492, the Taíno people had developed sophisticated agricultural systems across Hispaniola. They cultivated cassava (manioc), sweet potatoes, corn, and peppers—ingredients that remain central to Haitian cooking today. The Taíno technique of slow-roasting meat over wooden frames, called 'barbacoa,' gave the world the word 'barbecue' and influenced Haitian grilling traditions."
      },
      {
        heading: "French Colonial Influence",
        content: "Saint-Domingue, as Haiti was known under French rule, became the wealthiest colony in the Caribbean. French colonizers brought their culinary traditions: stocks and sauces, refined techniques, and a preference for presentation. These merged with African and indigenous traditions in the plantation kitchens, where enslaved cooks created something entirely new. Dishes like griot (fried pork) show African frying techniques applied to European-style marinades."
      },
      {
        heading: "African Soul",
        content: "The majority of Haitian culinary DNA comes from West and Central Africa. Enslaved peoples brought not just cooking techniques but entire food philosophies: the importance of one-pot cooking, the use of leafy greens, the transformative power of slow-cooked stews, and the central role of rice and legumes. Haitian sos pwa (bean sauce) directly echoes West African bean preparations."
      },
      {
        heading: "Independence and Identity",
        content: "After the Haitian Revolution (1791-1804), the world's first successful slave revolt, Haitian cuisine became a marker of national identity. Soup joumou—a pumpkin soup forbidden to enslaved people under French rule—became the ceremonial dish of independence, served every January 1st to celebrate freedom."
      },
      {
        heading: "The Diaspora Kitchen",
        content: "Today, Haitian cuisine thrives in diaspora communities from Miami to Montreal, Brooklyn to Boston. These communities have preserved traditional recipes while adapting to available ingredients. Little Haiti in Miami has become a culinary destination, where restaurants serve authentic griot, tassot, and legim to homesick Haitians and curious newcomers alike."
      },
      {
        heading: "Modern Revival",
        content: "A new generation of Haitian chefs is bringing the cuisine to fine dining while honoring its roots. They're documenting grandmother's recipes, sourcing traditional ingredients, and telling the stories behind each dish. Haitian cuisine is finally receiving the global recognition it deserves—not as exotic curiosity but as one of the world's great culinary traditions."
      }
    ],
    keyFacts: [
      "Haitian cuisine blends Taíno, French, and African influences",
      "Soup joumou is served every January 1st to celebrate independence",
      "The word 'barbecue' comes from the Taíno 'barbacoa'",
      "Little Haiti in Miami is a major center of diaspora cuisine",
      "Epis (seasoning base) is the foundation of most Haitian dishes"
    ],
    relatedArticles: ["african-diaspora-cooking-techniques", "caribbean-spice-traditions"],
    relatedIngredients: ["epis", "pikliz", "scotch-bonnet-pepper", "cassava"],
    relatedRecipes: ["griot", "soup-joumou", "diri-ak-pwa", "tassot"],
    lastUpdated: "2024-12-19"
  },

  {
    slug: "jamaican-jerk-tradition",
    title: "The Jamaican Jerk Tradition: Fire, Smoke, and Heritage",
    category: "tradition",
    region: "caribbean",
    metaDescription: "Discover the origins and techniques of Jamaican jerk cooking, from Maroon freedom fighters to Boston Beach's famous jerk pits.",
    introduction: "Jerk isn't just a cooking method—it's a symbol of resistance, survival, and cultural pride. Born in the mountains of Jamaica among escaped enslaved peoples known as Maroons, jerk cooking represents one of the Caribbean's most significant culinary contributions to the world.",
    sections: [
      {
        heading: "Maroon Origins",
        content: "The Maroons were Africans who escaped slavery and established free communities in Jamaica's Blue Mountains. To survive, they developed preservation and cooking techniques suited to guerrilla life. Jerk cooking—using local pimento (allspice) wood and Scotch bonnet peppers—allowed them to cook without visible smoke that might reveal their position to colonial soldiers."
      },
      {
        heading: "The Essential Ingredients",
        content: "Authentic jerk requires three non-negotiables: Scotch bonnet peppers for heat, allspice (called 'pimento' in Jamaica) for its warm, complex flavor, and thyme for earthiness. The fresh allspice berries and leaves are as important as the dried spice. Additional ingredients vary by cook but often include scallions, garlic, ginger, and soy sauce—this last ingredient reflecting later Chinese-Jamaican influences."
      },
      {
        heading: "Boston Beach: The Jerk Capital",
        content: "Portland parish's Boston Beach is recognized as the birthplace of commercial jerk. Here, in the 1930s, locals began selling jerk pork to travelers. Today, the beach road is lined with jerk pits where pimento wood smoke perfumes the air. Purists insist real jerk must be cooked over pimento wood—anything else is just grilled meat with jerk seasoning."
      },
      {
        heading: "Technique Matters",
        content: "Traditional jerk is not grilled—it's smoke-roasted. Meat is placed on a grate of green pimento wood sticks over coals, then covered with zinc sheets to create an oven effect. The pimento wood releases essential oils that penetrate the meat. This low-and-slow method can take 4-6 hours for a whole chicken, resulting in meat that's smoky throughout, not just on the surface."
      },
      {
        heading: "Beyond Pork and Chicken",
        content: "While jerk chicken and pork are most famous, Jamaicans apply jerk seasoning to everything: fish, lobster, sausages, even vegetables. Jerk seasoning has become a global phenomenon, appearing on wings in American sports bars and on fusion menus from London to Tokyo."
      }
    ],
    keyFacts: [
      "Jerk cooking was developed by Maroons (escaped enslaved peoples)",
      "Boston Beach in Portland parish is the traditional jerk capital",
      "Authentic jerk requires pimento (allspice) wood for smoking",
      "The technique was originally used for preservation and stealth cooking",
      "True jerk is smoke-roasted, not grilled"
    ],
    relatedArticles: ["history-of-haitian-cuisine", "caribbean-pepper-traditions"],
    relatedIngredients: ["scotch-bonnet-pepper", "allspice", "thyme", "scallions"],
    relatedRecipes: ["jerk-chicken", "jerk-pork", "jerk-fish"],
    lastUpdated: "2024-12-19"
  },

  {
    slug: "african-diaspora-cooking-techniques",
    title: "African Diaspora Cooking Techniques: The Foundations of Caribbean and Southern Cuisine",
    category: "technique",
    region: "caribbean",
    metaDescription: "Explore how African cooking techniques transformed Caribbean and American Southern cuisines, from one-pot cooking to the art of the aromatic base.",
    introduction: "When enslaved Africans were forcibly brought to the Americas, they carried more than memories—they carried an entire culinary knowledge system. These techniques didn't just survive; they transformed the cuisines of the Caribbean, Brazil, and the American South into some of the world's most beloved food traditions.",
    sections: [
      {
        heading: "The Aromatic Base",
        content: "Perhaps the most significant African contribution is the concept of building flavor through an aromatic base. In Haiti, it's epis; in Puerto Rico, sofrito; in Louisiana, the holy trinity. All trace back to West African cooking traditions where onions, peppers, and aromatics are cooked together first to create a flavor foundation. This technique produces depth impossible to achieve by simply adding ingredients to a pot."
      },
      {
        heading: "One-Pot Wisdom",
        content: "African cooks perfected the one-pot meal out of necessity and genius. Whether it's Jamaican rice and peas, Haitian diri ak pwa, or Louisiana jambalaya, these dishes follow the same logic: starches and proteins cooked together in seasoned liquid, each ingredient contributing to and benefiting from the communal pot. This isn't just practical—it creates layers of flavor as ingredients exchange essences."
      },
      {
        heading: "The Art of Frying",
        content: "Deep frying in palm oil and other fats was well-established in West Africa before the transatlantic slave trade. This knowledge gave the Caribbean its beloved fried foods: Jamaican festivals, Haitian griot, Cuban chicharrones. African cooks understood how to achieve crispy exteriors while keeping interiors moist—a skill evident in every batch of perfect fried plantains."
      },
      {
        heading: "Fermentation and Preservation",
        content: "African fermentation traditions produced some of the most distinctive flavors in diaspora cooking. Techniques for fermenting cassava, beans, and condiments survived and evolved. The funky, complex flavors in traditional Caribbean seasonings owe much to these preservation methods developed in tropical climates where refrigeration was impossible."
      },
      {
        heading: "Rice Culture",
        content: "West Africans from the 'Rice Coast' (modern Senegal to Liberia) brought sophisticated rice cultivation and cooking knowledge. This expertise was so valued that rice-growing Africans commanded higher prices at slave markets. Their techniques—washing rice until water runs clear, precise water ratios, knowing when to cover and when to let steam escape—define how rice is cooked across the Caribbean and American South."
      },
      {
        heading: "Leafy Greens Philosophy",
        content: "The African approach to leafy greens transformed American Southern cooking and influenced Caribbean cuisine. In Africa, greens were never an afterthought—they were central to meals, cooked with care, seasoned boldly, and valued for both nutrition and flavor. Collard greens, callaloo, and countless Caribbean green preparations follow this philosophy."
      }
    ],
    keyFacts: [
      "Sofrito, epis, and the Cajun trinity all derive from African aromatic base techniques",
      "One-pot cooking from Africa became Caribbean rice dishes and Southern jambalaya",
      "West African rice cultivation expertise shaped American rice culture",
      "Deep frying techniques came to the Caribbean via African cooks",
      "The African approach to greens transformed Southern American cooking"
    ],
    relatedArticles: ["history-of-haitian-cuisine", "west-african-cooking-foundations"],
    relatedIngredients: ["palm-oil", "scotch-bonnet-pepper", "okra", "black-eyed-peas"],
    relatedRecipes: ["jollof-rice", "griot", "callaloo", "rice-and-peas"],
    lastUpdated: "2024-12-19"
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // LATIN AMERICAN CULTURE
  // ═══════════════════════════════════════════════════════════════════════════
  {
    slug: "mexican-corn-culture",
    title: "Mexican Corn Culture: 9,000 Years of Maize",
    category: "culture",
    region: "latin",
    metaDescription: "Discover how corn shaped Mexican civilization, cuisine, and identity over nine millennia, from ancient nixtamalization to modern tortillerías.",
    introduction: "In Mexican cosmology, humans were created from corn. This isn't mere mythology—it reflects a truth about Mexican civilization. For nine thousand years, corn has been the center of Mexican life: the basis of the economy, the foundation of the diet, and a sacred symbol of identity. To understand Mexican food is to understand corn.",
    sections: [
      {
        heading: "Origins of Domestication",
        content: "Corn as we know it doesn't exist in the wild. Around 9,000 years ago in the Balsas River valley of Mexico, ancient peoples began domesticating teosinte, a grass with tiny, hard seeds. Through millennia of selective breeding, they transformed it into maize—one of humanity's greatest agricultural achievements. Every kernel of corn eaten anywhere in the world descends from this Mexican innovation."
      },
      {
        heading: "The Nixtamalization Revolution",
        content: "Between 1500 and 1200 BCE, Mesoamerican cooks discovered nixtamalization: cooking corn in alkaline solution (originally wood ash, now cal/lime). This process, whose Aztec name means 'ash-corn,' unlocks niacin, improves protein availability, and transforms texture. Without this technique, civilizations depending on corn would have suffered pellagra. It's one of history's most important food science discoveries."
      },
      {
        heading: "Corn Diversity",
        content: "Mexico is home to 59 native races of corn in every color imaginable: red, blue, black, white, yellow, pink, and multicolored. Each has specific uses—some for tortillas, some for tamales, some for pozole, some for atole. This diversity is a living genetic treasury, developed over millennia by farming communities. Industrial agriculture threatens this heritage, but traditional farmers continue cultivating heirloom varieties."
      },
      {
        heading: "The Tortilla: Daily Bread",
        content: "The tortilla is Mexico's daily bread—consumed at every meal, in every region, by every social class. A fresh tortilla from a tortillería, made from nixtamalized corn ground that morning, bears little resemblance to industrial versions. The aroma, the slight chew, the way it holds together yet yields when bitten—this is a food refined over thousands of years."
      },
      {
        heading: "Beyond the Tortilla",
        content: "Corn appears in Mexican cuisine in countless forms: tamales wrapped in corn husks, atole beverages, pozole stews with hominy, elote (street corn), esquites (corn salad), corn-based desserts, and fermented corn drinks. Each preparation showcases different properties of this versatile grain."
      },
      {
        heading: "Modern Challenges",
        content: "Mexican corn culture faces threats from industrial agriculture, NAFTA-driven cheap corn imports, and the loss of traditional farming knowledge. Yet resistance persists: artisan tortillerías are reviving, chefs are championing heirloom corn, and farming communities are protecting their seed heritage. The future of Mexican corn culture depends on valuing tradition alongside innovation."
      }
    ],
    keyFacts: [
      "Corn was domesticated in Mexico approximately 9,000 years ago",
      "Nixtamalization unlocks nutrients and was discovered around 1500-1200 BCE",
      "Mexico has 59 native corn races in multiple colors",
      "The average Mexican consumes about 200 pounds of corn annually",
      "Fresh nixtamalized tortillas differ dramatically from industrial versions"
    ],
    relatedArticles: ["nixtamalization-science", "oaxacan-mole-traditions"],
    relatedIngredients: ["masa-harina", "hominy", "blue-corn", "corn-husks"],
    relatedRecipes: ["tortillas", "tamales", "pozole", "elote"],
    lastUpdated: "2024-12-19"
  },

  {
    slug: "peruvian-cuisine-global-influence",
    title: "Peruvian Cuisine's Global Rise: From Lima to the World",
    category: "culture",
    region: "latin",
    metaDescription: "How Peruvian cuisine became a global phenomenon through fusion, innovation, and a deep respect for ancestral ingredients.",
    introduction: "In the span of two decades, Peruvian cuisine went from regional obscurity to global acclaim. Lima now rivals Tokyo and Paris as a culinary destination. This isn't accidental—it's the result of geographic blessing, cultural fusion, and a generation of chefs who insisted the world pay attention to Peru's culinary treasures.",
    sections: [
      {
        heading: "Geographic Diversity",
        content: "Peru contains 84 of the world's 117 life zones, from coastal desert to Amazonian jungle to Andean peaks. This biodiversity translates directly to culinary diversity: 3,000+ potato varieties, countless peppers, tropical fruits unknown outside Peru, and seafood from the cold Humboldt Current. No country this size has such ingredient wealth."
      },
      {
        heading: "The Fusion Foundation",
        content: "Peruvian cuisine is inherently fusion. Indigenous ingredients met Spanish colonial cooking. Japanese immigrants created Nikkei cuisine. Chinese immigrants developed Chifa. Italian, African, and other influences added layers. This wasn't planned—it was necessity and adaptation. The result is a cuisine comfortable with complexity and combination."
      },
      {
        heading: "The Gastón Acurio Effect",
        content: "Chef Gastón Acurio, more than any individual, brought Peruvian cuisine to global attention. His restaurant Astrid y Gastón became a pilgrimage site for food lovers. More importantly, he democratized fine Peruvian cooking, opened culinary schools, and relentlessly promoted Peru as a food destination. His work created a culinary movement, not just a restaurant empire."
      },
      {
        heading: "Ceviche: The Ambassador Dish",
        content: "Ceviche—raw fish 'cooked' in citrus juice—existed in Peru for millennia but became the cuisine's global ambassador. Its freshness, brightness, and apparent simplicity (hiding careful technique) captured international imagination. Variations like tiradito (Japanese-influenced thin-sliced ceviche) show how Peru absorbs and transforms influences."
      },
      {
        heading: "The Potato Homeland",
        content: "Potatoes were domesticated in Peru 8,000 years ago. While the world knows maybe a dozen varieties, Peruvian markets sell hundreds. Dishes like causa (layered potato terrine) and papa a la huancaína showcase what's possible when a cuisine has had millennia to explore a single ingredient."
      },
      {
        heading: "Sustainability Challenges",
        content: "Success brings challenges. Overfishing threatens ceviche's supply chain. Climate change affects Andean agriculture. Tourist demand strains traditional food systems. Peru's culinary leaders increasingly advocate for sustainability, recognizing that without healthy ecosystems, there is no Peruvian cuisine."
      }
    ],
    keyFacts: [
      "Peru has 84 of the world's 117 life zones",
      "There are over 3,000 potato varieties native to Peru",
      "Lima has been named the world's leading culinary destination multiple times",
      "Ceviche has been Peru's national dish since 2004 (official declaration)",
      "Chifa (Chinese-Peruvian) and Nikkei (Japanese-Peruvian) are distinct fusion cuisines"
    ],
    relatedArticles: ["ceviche-history-techniques", "andean-superfoods"],
    relatedIngredients: ["aji-amarillo", "lucuma", "quinoa", "purple-corn"],
    relatedRecipes: ["ceviche", "lomo-saltado", "causa", "aji-de-gallina"],
    lastUpdated: "2024-12-19"
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ASIAN CULTURE
  // ═══════════════════════════════════════════════════════════════════════════
  {
    slug: "chinese-regional-cuisines",
    title: "The Eight Great Traditions: Understanding Chinese Regional Cuisines",
    category: "culture",
    region: "asian",
    metaDescription: "Discover the eight major regional cuisines of China and how geography shaped the most diverse culinary tradition on earth.",
    introduction: "When people outside China think of 'Chinese food,' they're usually imagining something that exists nowhere in China. Real Chinese cuisine isn't a single tradition but eight regional cuisines as different from each other as French is from Italian. A chef trained in Sichuan cooking requires years to master Cantonese techniques—they're essentially different professions.",
    sections: [
      {
        heading: "The Geographic Logic",
        content: "China's size produces regional cuisines. Four factors shaped cooking: latitude (rice south, wheat north), climate (Sichuan's humidity required spices), water access (coastal seafood vs. inland pork), and trade routes. Northern cuisines use wheat, more lamb, garlic; Southern use rice, seafood, ginger."
      },
      {
        heading: "Sichuan: The Numbing Heat",
        content: "Sichuan's málà flavor—Sichuan peppercorn numbing with chile heat—defines the cuisine, but it recognizes 24 flavor profiles. The foundation is doubanjiang (fermented bean paste). Sichuan's humid climate made strong seasonings practical for preservation. Techniques include dry-frying and hot oil pouring."
      },
      {
        heading: "Cantonese: The Art of Freshness",
        content: "Cantonese cuisine privileges freshness—ingredients should taste of themselves. Sauces are light, cooking times brief. The ideal 'wok hei' (breath of the wok) comes from high-heat rapid cooking. Dim sum showcases technical range across dozens of preparations."
      },
      {
        heading: "Shandong: The Imperial Tradition",
        content: "Called the 'mother cuisine' of northern China, Shandong influenced imperial court cooking. The cuisine uses onion, garlic, fermented seasonings, and expert stock-making. Braising methods spread from Shandong throughout China."
      },
      {
        heading: "Huaiyang: The Elegant Cuisine",
        content: "Huaiyang from the Yangtze delta is China's most refined tradition. Light, natural flavors with elegance over intensity. Knife work produces hundreds of identical cuts. 'Red cooking' (hong shao) originated here."
      }
    ],
    keyFacts: [
      "China has eight officially recognized regional cuisines",
      "Sichuan cuisine recognizes 24 distinct flavor profiles, not just 'spicy'",
      "Cantonese is most influential internationally but often misrepresented",
      "Huaiyang cuisine is considered China's most refined tradition"
    ],
    relatedArticles: ["wok-cooking-technique", "dim-sum-history"],
    relatedIngredients: ["sichuan-peppercorn", "doubanjiang", "oyster-sauce", "shaoxing-wine"],
    relatedRecipes: ["mapo-tofu", "kung-pao-chicken", "char-siu", "xiao-long-bao"],
    lastUpdated: "2024-12-19"
  },

  {
    slug: "vietnamese-food-philosophy",
    title: "The Five Elements: Understanding Vietnamese Food Philosophy",
    category: "culture",
    region: "asian",
    metaDescription: "Explore the philosophy behind Vietnamese cuisine and why it's among the world's healthiest.",
    introduction: "Vietnamese cuisine operates on principles balancing flavors, textures, and colors according to traditional beliefs. The framework from Chinese five-element theory means every dish balances five flavors (spicy, sour, bitter, salty, sweet), five colors, and five nutrients. This creates harmony—food that satisfies without overwhelming.",
    sections: [
      {
        heading: "The Five Flavors in Practice",
        content: "Spiciness from chiles is restrained, appearing mainly in dipping sauces. Sourness from lime and pickles cuts richness. Bitterness is valued for cooling properties. Saltiness comes from fish sauce (nước mắm). Sweetness appears subtly through caramelization."
      },
      {
        heading: "Color as Nutritional Guide",
        content: "White foods provide starch, green supply vitamins, yellow aid digestion, red support circulation, black benefit kidneys. This explains elaborate herb plates—completing nutritional balance. Eating diverse colored vegetables does provide broader nutrients."
      },
      {
        heading: "Phở and Balance",
        content: "Phở demonstrates balance philosophy. The broth provides savory-salty foundation, intentionally restrained. The herb plate provides balance: Thai basil for sweetness, lime for sourness, Sriracha for heat. Diners construct their own harmony."
      },
      {
        heading: "Fish Sauce: The Fifth Essence",
        content: "Fish sauce (nước mắm) defines Vietnamese cuisine. Traditional production ages anchovies with salt 12-24 months. It provides umami foundation for virtually every savory dish. Quality dramatically affects dish quality."
      }
    ],
    keyFacts: [
      "Vietnamese cooking balances five flavors: spicy, sour, bitter, salty, sweet",
      "Fish sauce (nước mắm) is the defining ingredient",
      "Vietnamese cooking uses more fresh herbs than almost any other cuisine",
      "The diner creates final balance through adding condiments"
    ],
    relatedArticles: ["fish-sauce-production", "vietnamese-herbs-guide"],
    relatedIngredients: ["fish-sauce", "vietnamese-coriander", "rice-noodles", "star-anise"],
    relatedRecipes: ["pho", "banh-mi", "spring-rolls", "bun-cha"],
    lastUpdated: "2024-12-19"
  },

  {
    slug: "korean-fermentation-tradition",
    title: "The Art of Korean Fermentation: From Kimchi to Doenjang",
    category: "technique",
    region: "asian",
    metaDescription: "Discover how fermentation defines Korean cuisine and why these ancient preservation techniques are gaining global recognition.",
    introduction: "Korean cuisine is fundamentally a fermented cuisine. While other cultures ferment particular foods, Korea fermented everything—vegetables, seafood, soybeans, even drinks. This wasn't mere preservation but transformation, creating the deep, complex flavors that define Korean cooking.",
    sections: [
      {
        heading: "Kimchi: More Than Cabbage",
        content: "Kimchi encompasses hundreds of preparations, not just napa cabbage. Making kimchi (kimjang) was traditionally a community activity. UNESCO recognized kimjang as Intangible Cultural Heritage."
      },
      {
        heading: "The Jang Trilogy",
        content: "Korean cuisine rests on three fermented sauces: doenjang (fermented soybean paste), gochujang (fermented chile paste), and ganjang (soy sauce). All begin with meju, blocks of fermented soybeans."
      },
      {
        heading: "Jeotgal: Fermented Seafood",
        content: "Jeotgal—fermented seafood—ranges from small shrimp to fish intestines. These provide umami backbone to kimchi and many dishes."
      },
      {
        heading: "The Health Renaissance",
        content: "Korean fermented foods gained global attention when research identified their probiotic benefits. Kimchi contains diverse lactobacillus strains linked to gut health."
      }
    ],
    keyFacts: [
      "Korean kimchi exists in hundreds of varieties",
      "UNESCO recognized kimjang (kimchi-making) as Intangible Cultural Heritage",
      "The three jang sauces form Korean cuisine's foundation",
      "Korean fermented foods are scientifically proven probiotic sources"
    ],
    relatedArticles: ["kimchi-history", "gochujang-guide"],
    relatedIngredients: ["gochugaru", "doenjang", "gochujang", "kimchi"],
    relatedRecipes: ["kimchi", "kimchi-jjigae", "bibimbap", "bulgogi"],
    lastUpdated: "2024-12-19"
  },

  {
    slug: "indian-spice-mastery",
    title: "The Science of Indian Spices: Masala, Tempering, and Flavor Building",
    category: "technique",
    region: "asian",
    metaDescription: "Understand the sophisticated system behind Indian spice use, from whole spice tempering to complex masala blends.",
    introduction: "Indian cuisine employs spices with more sophistication than any other tradition. This isn't about heat or complexity for its own sake but a systematic approach to building flavor layers. Understanding tadka (tempering), masala construction, and spice sequence transforms Indian cooking.",
    sections: [
      {
        heading: "Tadka: The Flavor Foundation",
        content: "Tadka involves blooming whole spices in hot oil or ghee, then adding this aromatic base to dishes. The technique extracts fat-soluble flavor compounds unavailable through other methods. Order matters: hardy spices first, delicate ones last."
      },
      {
        heading: "Masala: The Art of Blending",
        content: "Masala means spice blend, but there's no single 'curry powder' in Indian cooking. Garam masala varies by region and family. Each dish may have its own blend, toasted and ground fresh."
      },
      {
        heading: "Layered Spicing",
        content: "Indian dishes often add spices at multiple stages. Whole spices tempered in oil begin. Ground spices added to paste create a different effect. Finishing spices add aromatic top notes."
      },
      {
        heading: "Regional Traditions",
        content: "South Indian cooking emphasizes mustard seeds and curry leaves. Northern cuisine uses more garam masala aromatics. Bengali cooking features panch phoron (five-spice blend)."
      }
    ],
    keyFacts: [
      "Tadka (tempering) extracts fat-soluble compounds unavailable otherwise",
      "There's no single 'curry powder' in authentic Indian cooking",
      "Indian dishes often add spices at multiple stages for layered flavor",
      "Each region has distinct spice traditions and signature blends"
    ],
    relatedArticles: ["garam-masala-guide", "south-indian-spices"],
    relatedIngredients: ["cumin-seeds", "coriander-seeds", "turmeric", "garam-masala"],
    relatedRecipes: ["butter-chicken", "biryani", "dal", "samosas"],
    lastUpdated: "2024-12-19"
  },

  {
    slug: "japanese-umami-tradition",
    title: "Umami and Japanese Cuisine: The Fifth Taste",
    category: "science",
    region: "asian",
    metaDescription: "Explore how Japan discovered umami and built an entire cuisine around this fifth taste sensation.",
    introduction: "Japan didn't just discover umami—Japanese scientists identified it, Japanese cooks had been maximizing it for centuries, and Japanese cuisine remains the world's most umami-rich tradition.",
    sections: [
      {
        heading: "The Discovery of Umami",
        content: "In 1908, chemist Kikunae Ikeda identified glutamate as the source of dashi's distinctive taste, coining 'umami' (delicious taste). He isolated it from kombu seaweed."
      },
      {
        heading: "Dashi: Umami in Action",
        content: "Dashi—kelp-and-bonito stock—is an umami delivery system. Kombu provides glutamate; katsuobushi provides inosinate. Combined, they create umami synergy."
      },
      {
        heading: "Umami Sources in Japanese Cooking",
        content: "Japanese cuisine stacks umami sources: soy sauce, miso, dried fish, kombu, shiitake. Even ingredients not obviously umami are prepared with umami-rich seasonings."
      },
      {
        heading: "The Minimalist Expression",
        content: "Japanese cuisine's apparent simplicity serves umami expression. Without competing flavors, umami's subtle depth becomes apparent."
      }
    ],
    keyFacts: [
      "Japanese scientist Kikunae Ikeda discovered and named umami in 1908",
      "Dashi combines kombu and katsuobushi for umami synergy",
      "Japanese cuisine systematically layers multiple umami sources",
      "Japanese food's simplicity serves to highlight umami perception"
    ],
    relatedArticles: ["dashi-making-guide", "miso-varieties"],
    relatedIngredients: ["kombu", "katsuobushi", "miso", "soy-sauce"],
    relatedRecipes: ["miso-soup", "ramen", "teriyaki", "sukiyaki"],
    lastUpdated: "2024-12-19"
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // AFRICAN CULTURE
  // ═══════════════════════════════════════════════════════════════════════════
  {
    slug: "west-african-cooking-foundations",
    title: "The Foundations of West African Cooking: Techniques That Built a Diaspora",
    category: "technique",
    region: "african",
    metaDescription: "Explore the fundamental cooking techniques of West Africa that spread throughout the Americas and Caribbean.",
    introduction: "West African cooking techniques didn't just influence global cuisine—they created it. When millions of Africans were forcibly transported to the Americas, they carried culinary knowledge that would reshape how entire continents cook.",
    sections: [
      {
        heading: "The One-Pot Tradition",
        content: "West African cooking centers on one-pot dishes: stews, soups, and sauces served over starches. This isn't mere simplicity but sophisticated cuisine building complex flavors through layered additions."
      },
      {
        heading: "Palm Oil: The Red Gold",
        content: "Palm oil is West African cooking's essential fat, as fundamental as olive oil to Mediterranean cuisine. Its distinctive red-orange color and slightly sweet, earthy flavor define countless dishes."
      },
      {
        heading: "Fermentation and Preservation",
        content: "West African cooks developed sophisticated fermentation techniques. Dawadawa (fermented locust beans) provides umami depth comparable to soy products."
      },
      {
        heading: "The Fritter Tradition",
        content: "Nigerian akara (black-eyed pea fritters), virtually identical to Brazilian acarajé, demonstrates direct transmission across the Atlantic."
      },
      {
        heading: "Leafy Greens Philosophy",
        content: "West African cuisines emphasize leafy greens more than most traditions. Every meal traditionally includes greens—whether palaver sauce in Ghana or efo in Nigeria."
      }
    ],
    keyFacts: [
      "West African one-pot techniques spread throughout the Americas",
      "Palm oil is the essential fat of West African cooking",
      "Nigerian akara and Brazilian acarajé are virtually identical fritters",
      "Fermented seasonings like dawadawa provide umami depth"
    ],
    relatedArticles: ["african-diaspora-cooking-techniques", "palm-oil-guide"],
    relatedIngredients: ["palm-oil", "egusi", "dawadawa", "african-peppers"],
    relatedRecipes: ["jollof-rice", "egusi-soup", "groundnut-stew", "fufu"],
    lastUpdated: "2024-12-19"
  },

  {
    slug: "ethiopian-cuisine-tradition",
    title: "Ethiopian Cuisine: Africa's Most Ancient Culinary Tradition",
    category: "culture",
    region: "african",
    metaDescription: "Discover Ethiopian cuisine, one of the world's oldest culinary traditions, featuring injera bread, complex spice blends, and unique eating customs.",
    introduction: "Ethiopian cuisine stands apart from all other African traditions in its antiquity, sophistication, and distinctiveness. The country's isolation, never colonized by European powers, allowed culinary traditions to develop for millennia without disruption.",
    sections: [
      {
        heading: "Injera: The Edible Plate",
        content: "Injera, the spongy, slightly sour flatbread made from teff flour, is both food and tableware. Dishes are served directly on a large injera, with additional rolled injera for scooping."
      },
      {
        heading: "Berbere and Mitmita",
        content: "Ethiopian cooking relies on two primary spice blends. Berbere, a complex red powder, can incorporate up to 20 spices. Mitmita, hotter and simpler, features chiles with cardamom."
      },
      {
        heading: "Fasting Cuisine",
        content: "Ethiopian Orthodox Christianity requires fasting (abstaining from animal products) for over 200 days per year, making Ethiopian cuisine one of the world's great vegetarian traditions."
      },
      {
        heading: "Coffee Ceremony",
        content: "Ethiopia, coffee's birthplace, maintains elaborate coffee ceremonies that function as social institutions involving roasting, grinding, and brewing three times."
      }
    ],
    keyFacts: [
      "Ethiopia was never colonized, preserving ancient cuisine",
      "Teff for injera is indigenous to Ethiopia",
      "Orthodox fasting creates a great vegetarian cuisine",
      "Ethiopia is coffee's birthplace"
    ],
    relatedArticles: ["teff-grain-guide", "ethiopian-coffee-history"],
    relatedIngredients: ["teff-flour", "berbere", "niter-kibbeh", "mitmita"],
    relatedRecipes: ["doro-wat", "kitfo", "injera", "shiro"],
    lastUpdated: "2024-12-19"
  },

  {
    slug: "nigerian-cuisine-diversity",
    title: "Nigerian Cuisine: Africa's Most Diverse Food Culture",
    category: "culture",
    region: "african",
    metaDescription: "Explore Nigeria's incredibly diverse cuisine, from jollof rice rivalries to regional specialties across 250+ ethnic groups.",
    introduction: "With over 250 ethnic groups and 500 languages, Nigeria possesses arguably Africa's most diverse cuisine. Each region, each ethnic group, has distinctive preparations, ingredients, and traditions.",
    sections: [
      {
        heading: "Regional Foundations",
        content: "Nigerian cuisine divides into southern (Yoruba, Igbo) and northern (Hausa-Fulani) traditions. Southern cooking emphasizes soups with pounded starches; Northern features grilled meats and rice."
      },
      {
        heading: "The Soup Tradition",
        content: "Nigerian 'soups' aren't liquid soups but thick sauces served over starches. Egusi, ogbono, edikaikong provide protein and vegetables while the starch provides bulk."
      },
      {
        heading: "Jollof Rice",
        content: "Jollof rice—rice cooked in tomato-based sauce—is Nigeria's most famous dish and subject of fierce international rivalry with Ghana."
      },
      {
        heading: "Street Food Culture",
        content: "Nigerian street food rivals any in the world. Suya vendors line streets at night; akara and puff-puff provide breakfast; roasted plantains offer afternoon snacks."
      }
    ],
    keyFacts: [
      "Nigeria has over 250 ethnic groups with distinct food traditions",
      "Nigerian 'soups' are thick sauces eaten with starches",
      "The Nigeria-Ghana 'Jollof Wars' are a serious cultural rivalry",
      "Suya vendors are ubiquitous on Nigerian streets"
    ],
    relatedArticles: ["jollof-rice-history", "west-african-cooking-foundations"],
    relatedIngredients: ["egusi", "palm-oil", "dawadawa", "scotch-bonnet-pepper"],
    relatedRecipes: ["jollof-rice", "egusi-soup", "suya", "puff-puff"],
    lastUpdated: "2024-12-19"
  }
];

// Helper functions
export function getArticleBySlug(slug: string): EncyclopediaArticle | undefined {
  return encyclopediaArticles.find(a => a.slug === slug);
}

export function getArticlesByRegion(region: string): EncyclopediaArticle[] {
  return encyclopediaArticles.filter(a => a.region === region);
}

export function getArticlesByCategory(category: string): EncyclopediaArticle[] {
  return encyclopediaArticles.filter(a => a.category === category);
}

export function getAllArticleSlugs(): string[] {
  return encyclopediaArticles.map(a => a.slug);
}

export const totalEncyclopediaArticles = encyclopediaArticles.length;
