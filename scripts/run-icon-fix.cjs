const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DEFAULT_ICON = "🛒";

const ICON_RULES = [
  { keywords: ["coffee"], icon: "☕" },
  { keywords: ["tea"], icon: "🍵" },
  { keywords: ["juice", "smoothie"], icon: "🧃" },
  { keywords: ["soda", "soft drink", "cola"], icon: "🥤" },
  { keywords: ["water"], icon: "💧" },
  { keywords: ["milk", "dairy"], icon: "🥛" },
  { keywords: ["beer", "ale", "lager"], icon: "🍺" },
  { keywords: ["wine"], icon: "🍷" },
  { keywords: ["liquor", "spirits", "vodka", "whiskey", "rum"], icon: "🥃" },
  { keywords: ["energy"], icon: "⚡" },
  { keywords: ["protein"], icon: "💪" },
  { keywords: ["bread", "loaf", "brioche", "ciabatta", "sourdough", "pumpernickel", "rye", "wheat"], icon: "🍞" },
  { keywords: ["bagel"], icon: "🥯" },
  { keywords: ["croissant", "danish", "pastry"], icon: "🥐" },
  { keywords: ["cake", "cupcake", "brownie"], icon: "🧁" },
  { keywords: ["donut", "doughnut", "eclair"], icon: "🍩" },
  { keywords: ["pie", "tart"], icon: "🥧" },
  { keywords: ["muffin"], icon: "🧁" },
  { keywords: ["tortilla", "wrap", "flatbread", "pita", "naan"], icon: "🫓" },
  { keywords: ["chip", "crisp"], icon: "🥔" },
  { keywords: ["cookie", "biscuit"], icon: "🍪" },
  { keywords: ["candy", "chocolate", "sweet"], icon: "🍬" },
  { keywords: ["nut", "almond", "cashew", "peanut"], icon: "🥜" },
  { keywords: ["popcorn"], icon: "🍿" },
  { keywords: ["cracker"], icon: "🧇" },
  { keywords: ["pretzel"], icon: "🥨" },
  { keywords: ["cereal", "oat", "granola", "grits"], icon: "🥣" },
  { keywords: ["pancake", "waffle"], icon: "🧇" },
  { keywords: ["egg"], icon: "🥚" },
  { keywords: ["bacon"], icon: "🥓" },
  { keywords: ["jam", "jelly", "marmalade", "preserve", "compote", "spread"], icon: "🍯" },
  { keywords: ["syrup", "maple"], icon: "🥞" },
  { keywords: ["cheese", "cheddar", "swiss", "mozzarella", "parmesan", "gouda", "brie", "feta"], icon: "🧀" },
  { keywords: ["meat", "beef", "pork", "chicken", "turkey"], icon: "🥩" },
  { keywords: ["bologna", "pepperoni", "prosciutto", "salami", "ham"], icon: "🥩" },
  { keywords: ["sausage", "hot dog", "frank"], icon: "🌭" },
  { keywords: ["fish", "seafood", "salmon", "tuna", "shrimp"], icon: "🐟" },
  { keywords: ["vegetable", "veggie", "lettuce", "salad", "greens"], icon: "🥬" },
  { keywords: ["fruit"], icon: "🍎" },
  { keywords: ["tomato"], icon: "🍅" },
  { keywords: ["potato"], icon: "🥔" },
  { keywords: ["carrot"], icon: "🥕" },
  { keywords: ["corn"], icon: "🌽" },
  { keywords: ["pepper", "chili"], icon: "🌶️" },
  { keywords: ["avocado"], icon: "🥑" },
  { keywords: ["mushroom"], icon: "🍄" },
  { keywords: ["flour", "baking"], icon: "🌾" },
  { keywords: ["oil", "olive"], icon: "🫒" },
  { keywords: ["sauce", "salsa", "ketchup", "mustard"], icon: "🍅" },
  { keywords: ["spice", "seasoning", "herb"], icon: "🌿" },
  { keywords: ["pasta", "noodle", "spaghetti"], icon: "🍝" },
  { keywords: ["rice"], icon: "🍚" },
  { keywords: ["soup", "broth"], icon: "🍲" },
  { keywords: ["canned", "can"], icon: "🥫" },
  { keywords: ["frozen"], icon: "🧊" },
  { keywords: ["ice cream", "gelato", "sorbet"], icon: "🍦" },
  { keywords: ["pizza"], icon: "🍕" },
  { keywords: ["clean", "cleaner", "detergent"], icon: "🧹" },
  { keywords: ["laundry", "fabric"], icon: "🧺" },
  { keywords: ["dish"], icon: "🍽️" },
  { keywords: ["paper", "napkin", "tissue", "toilet"], icon: "🧻" },
  { keywords: ["trash", "garbage"], icon: "🗑️" },
  { keywords: ["candle"], icon: "🕯️" },
  { keywords: ["shampoo", "hair"], icon: "💇" },
  { keywords: ["soap", "body wash"], icon: "🧼" },
  { keywords: ["lotion", "moistur"], icon: "🧴" },
  { keywords: ["toothpaste", "dental", "oral"], icon: "🦷" },
  { keywords: ["razor", "shave"], icon: "🪒" },
  { keywords: ["makeup", "cosmetic"], icon: "💄" },
  { keywords: ["perfume", "cologne", "fragrance"], icon: "🌸" },
  { keywords: ["vitamin", "supplement", "medicine", "pain"], icon: "💊" },
  { keywords: ["cold", "flu", "cough", "allergy"], icon: "🤧" },
  { keywords: ["first aid", "bandage"], icon: "🩹" },
  { keywords: ["diaper", "nappy"], icon: "🧒" },
  { keywords: ["baby", "infant", "formula"], icon: "🍼" },
  { keywords: ["dog"], icon: "🐕" },
  { keywords: ["cat", "litter"], icon: "🐈" },
  { keywords: ["pet"], icon: "🐾" },
  { keywords: ["caribbean", "jamaican", "island"], icon: "🌴" },
  { keywords: ["latin", "mexican", "hispanic"], icon: "🌶️" },
  { keywords: ["asian", "chinese", "japanese", "korean", "thai"], icon: "🥢" },
  { keywords: ["indian", "curry"], icon: "🍛" },
  { keywords: ["snack"], icon: "🍿" },
  { keywords: ["beverage", "drink"], icon: "🥤" },
  { keywords: ["baking", "cooking"], icon: "🧂" },
  { keywords: ["household", "home"], icon: "🏠" },
  { keywords: ["personal care"], icon: "🧴" },
  { keywords: ["health", "wellness"], icon: "💊" },
  // Catch-all by slug prefix
  { keywords: ["bakery-"], icon: "🥐" },
  { keywords: ["breakfast-"], icon: "🍳" },
  { keywords: ["deli-"], icon: "🥪" },
  { keywords: ["produce-"], icon: "🥬" },
  { keywords: ["frozen-"], icon: "🧊" },
  { keywords: ["pantry-"], icon: "🏪" },
  { keywords: ["dairy-"], icon: "🥛" },
  { keywords: ["meat-"], icon: "🥩" },
  { keywords: ["seafood-"], icon: "🐟" },
];

function getIcon(name, slug) {
  const searchText = (name + " " + slug).toLowerCase();
  for (const rule of ICON_RULES) {
    for (const kw of rule.keywords) {
      if (searchText.includes(kw)) return rule.icon;
    }
  }
  return null;
}

async function main() {
  console.log("=== FIXING ALL CATEGORY ICONS ===\n");
  
  // Get all categories with generic icons
  const cats = await prisma.category.findMany({
    where: { icon: "📦" },
    select: { id: true, name: true, slug: true, parentId: true },
    orderBy: { parentId: "asc" }
  });
  
  console.log("Categories with 📦:", cats.length);
  
  // Build parent icon cache
  const parentIcons = {};
  const allCats = await prisma.category.findMany({ select: { id: true, icon: true } });
  allCats.forEach(c => { parentIcons[c.id] = c.icon; });
  
  let updated = 0;
  for (const cat of cats) {
    let icon = getIcon(cat.name, cat.slug);
    
    // Inherit from parent if no match
    if (!icon && cat.parentId && parentIcons[cat.parentId] && parentIcons[cat.parentId] !== "📦") {
      icon = parentIcons[cat.parentId];
    }
    
    if (icon) {
      await prisma.category.update({ where: { id: cat.id }, data: { icon } });
      parentIcons[cat.id] = icon; // Update cache for children
      updated++;
    }
  }
  
  console.log("Updated:", updated);
  
  // Final count
  const remaining = await prisma.category.count({ where: { icon: "📦" } });
  console.log("Still with 📦:", remaining);
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
