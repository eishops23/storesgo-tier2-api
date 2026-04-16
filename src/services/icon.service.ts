// ==========================================================
// STORESGO ICON SERVICE — MARKETPLACE-GRADE
// Automatic icon assignment for categories
// Features:
// - Keyword-based auto-assignment
// - Parent icon inheritance
// - Admin override support
// - Runs on category creation/update
// ==========================================================

import { prisma } from "../plugins/prisma.js";

// Default icon when nothing matches
const DEFAULT_ICON = "🛒";

// Keyword to icon mapping - ordered by specificity
const ICON_RULES: { keywords: string[]; icon: string }[] = [
  // Beverages
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
  
  // Bakery
  { keywords: ["bread", "loaf", "brioche", "ciabatta", "sourdough", "pumpernickel", "rye", "wheat"], icon: "🍞" },
  { keywords: ["bagel"], icon: "🥯" },
  { keywords: ["croissant", "danish", "pastry"], icon: "🥐" },
  { keywords: ["cake", "cupcake", "brownie"], icon: "🧁" },
  { keywords: ["donut", "doughnut", "eclair"], icon: "🍩" },
  { keywords: ["pie", "tart"], icon: "🥧" },
  { keywords: ["muffin"], icon: "🧁" },
  { keywords: ["tortilla", "wrap", "flatbread", "pita", "naan"], icon: "🫓" },
  
  // Snacks
  { keywords: ["chip", "crisp"], icon: "🥔" },
  { keywords: ["cookie", "biscuit"], icon: "🍪" },
  { keywords: ["candy", "chocolate", "sweet"], icon: "🍬" },
  { keywords: ["nut", "almond", "cashew", "peanut"], icon: "🥜" },
  { keywords: ["popcorn"], icon: "🍿" },
  { keywords: ["cracker"], icon: "🧇" },
  { keywords: ["pretzel"], icon: "🥨" },
  
  // Breakfast
  { keywords: ["cereal", "oat", "granola", "grits"], icon: "🥣" },
  { keywords: ["pancake", "waffle"], icon: "🧇" },
  { keywords: ["egg"], icon: "🥚" },
  { keywords: ["bacon"], icon: "🥓" },
  { keywords: ["jam", "jelly", "marmalade", "preserve", "compote", "spread"], icon: "🍯" },
  { keywords: ["syrup", "maple"], icon: "🥞" },
  
  // Deli & Meat
  { keywords: ["cheese", "cheddar", "swiss", "mozzarella", "parmesan", "gouda", "brie", "feta"], icon: "🧀" },
  { keywords: ["meat", "beef", "pork", "chicken", "turkey"], icon: "🥩" },
  { keywords: ["bologna", "pepperoni", "prosciutto", "salami", "ham"], icon: "🥩" },
  { keywords: ["sausage", "hot dog", "frank"], icon: "🌭" },
  { keywords: ["fish", "seafood", "salmon", "tuna", "shrimp"], icon: "🐟" },
  
  // Produce
  { keywords: ["apple"], icon: "🍎" },
  { keywords: ["banana"], icon: "🍌" },
  { keywords: ["orange", "citrus", "lemon", "lime"], icon: "🍊" },
  { keywords: ["grape"], icon: "🍇" },
  { keywords: ["berry", "strawberry", "blueberry"], icon: "🍓" },
  { keywords: ["melon", "watermelon"], icon: "🍉" },
  { keywords: ["tomato"], icon: "🍅" },
  { keywords: ["potato"], icon: "🥔" },
  { keywords: ["carrot"], icon: "🥕" },
  { keywords: ["corn"], icon: "🌽" },
  { keywords: ["onion", "garlic"], icon: "🧅" },
  { keywords: ["pepper", "chili"], icon: "🌶️" },
  { keywords: ["lettuce", "salad", "greens"], icon: "🥬" },
  { keywords: ["avocado"], icon: "🥑" },
  { keywords: ["mushroom"], icon: "🍄" },
  { keywords: ["vegetable", "veggie"], icon: "🥬" },
  { keywords: ["fruit"], icon: "🍎" },
  
  // Cooking
  { keywords: ["flour", "baking"], icon: "🌾" },
  { keywords: ["sugar"], icon: "🧂" },
  { keywords: ["oil", "olive"], icon: "🫒" },
  { keywords: ["sauce", "salsa", "ketchup", "mustard"], icon: "🍅" },
  { keywords: ["spice", "seasoning", "herb"], icon: "🌿" },
  { keywords: ["pasta", "noodle", "spaghetti"], icon: "🍝" },
  { keywords: ["rice"], icon: "🍚" },
  { keywords: ["soup", "broth"], icon: "🍲" },
  { keywords: ["canned", "can"], icon: "🥫" },
  { keywords: ["vinegar"], icon: "🍶" },
  { keywords: ["honey"], icon: "🍯" },
  
  // Frozen
  { keywords: ["frozen"], icon: "🧊" },
  { keywords: ["ice cream", "gelato", "sorbet"], icon: "🍦" },
  { keywords: ["pizza"], icon: "🍕" },
  
  // Household
  { keywords: ["clean", "cleaner", "detergent"], icon: "🧹" },
  { keywords: ["laundry", "fabric"], icon: "🧺" },
  { keywords: ["dish"], icon: "🍽️" },
  { keywords: ["paper towel", "napkin", "tissue", "toilet"], icon: "🧻" },
  { keywords: ["trash", "garbage", "bag"], icon: "🗑️" },
  { keywords: ["air fresh"], icon: "🌸" },
  { keywords: ["candle"], icon: "🕯️" },
  { keywords: ["battery"], icon: "🔋" },
  { keywords: ["light", "bulb"], icon: "💡" },
  
  // Personal Care
  { keywords: ["shampoo", "hair"], icon: "💇" },
  { keywords: ["soap", "body wash"], icon: "🧼" },
  { keywords: ["lotion", "moistur"], icon: "🧴" },
  { keywords: ["deodorant"], icon: "🧴" },
  { keywords: ["toothpaste", "dental", "oral"], icon: "🦷" },
  { keywords: ["razor", "shave"], icon: "🪒" },
  { keywords: ["makeup", "cosmetic"], icon: "💄" },
  { keywords: ["perfume", "cologne", "fragrance"], icon: "🌸" },
  { keywords: ["sunscreen"], icon: "☀️" },
  
  // Health
  { keywords: ["vitamin", "supplement", "medicine", "pain"], icon: "💊" },
  { keywords: ["cold", "flu", "cough", "allergy"], icon: "🤧" },
  { keywords: ["first aid", "bandage"], icon: "🩹" },
  
  // Baby
  { keywords: ["diaper", "nappy"], icon: "🧒" },
  { keywords: ["baby food", "infant", "formula"], icon: "🍼" },
  { keywords: ["baby wipe"], icon: "🧻" },
  
  // Pet
  { keywords: ["dog"], icon: "🐕" },
  { keywords: ["cat", "litter"], icon: "🐈" },
  { keywords: ["bird"], icon: "🐦" },
  { keywords: ["pet food", "pet treat"], icon: "🦴" },
  
  // Ethnic Foods
  { keywords: ["caribbean", "jamaican", "island"], icon: "🌴" },
  { keywords: ["latin", "mexican", "hispanic"], icon: "🌶️" },
  { keywords: ["asian", "chinese", "japanese", "korean", "thai"], icon: "🥢" },
  { keywords: ["indian", "curry"], icon: "🍛" },
  { keywords: ["italian"], icon: "🍝" },
  
  // Main categories (as fallback)
  { keywords: ["snack"], icon: "🍿" },
  { keywords: ["beverage", "drink"], icon: "🥤" },
  { keywords: ["baking", "cooking"], icon: "🧂" },
  { keywords: ["household", "home"], icon: "🏠" },
  { keywords: ["personal care"], icon: "🧴" },
  { keywords: ["health", "wellness"], icon: "💊" },
  { keywords: ["baby", "infant"], icon: "🍼" },
  { keywords: ["pet"], icon: "🐾" },
];

/**
 * Get icon for a category based on name/slug
 */
export function getIconForCategory(name: string, slug: string): string {
  const searchText = `${name} ${slug}`.toLowerCase();
  
  for (const rule of ICON_RULES) {
    for (const keyword of rule.keywords) {
      if (searchText.includes(keyword.toLowerCase())) {
        return rule.icon;
      }
    }
  }
  
  return DEFAULT_ICON;
}

/**
 * Get icon with parent inheritance
 * If no match found, inherit from parent category
 */
export async function getIconWithInheritance(
  name: string,
  slug: string,
  parentId: number | null
): Promise<string> {
  // First try keyword match
  const keywordIcon = getIconForCategory(name, slug);
  if (keywordIcon !== DEFAULT_ICON) {
    return keywordIcon;
  }
  
  // If no match and has parent, inherit parent's icon
  if (parentId) {
    const parent = await prisma.category.findUnique({
      where: { id: parentId },
      select: { icon: true }
    });
    if (parent?.icon && parent.icon !== DEFAULT_ICON) {
      return parent.icon;
    }
  }
  
  return DEFAULT_ICON;
}

/**
 * Auto-assign icon when creating a category
 * Call this in category creation routes/services
 */
export async function assignIconToCategory(categoryId: number): Promise<string> {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { id: true, name: true, slug: true, icon: true, parentId: true }
  });
  
  if (!category) return DEFAULT_ICON;
  
  // Skip if already has a non-default icon (admin set)
  if (category.icon && category.icon !== DEFAULT_ICON && category.icon !== "📦") {
    return category.icon;
  }
  
  const newIcon = await getIconWithInheritance(
    category.name,
    category.slug,
    category.parentId
  );
  
  if (newIcon !== category.icon) {
    await prisma.category.update({
      where: { id: categoryId },
      data: { icon: newIcon }
    });
  }
  
  return newIcon;
}

/**
 * Batch assign icons to all categories missing proper icons
 * Use for migrations and admin tools
 */
export async function assignIconsToAllCategories(): Promise<{
  total: number;
  updated: number;
  skipped: number;
}> {
  const categories = await prisma.category.findMany({
    where: {
      OR: [
        { icon: DEFAULT_ICON },
        { icon: "📦" },
        { icon: null }
      ]
    },
    select: { id: true, name: true, slug: true, parentId: true, icon: true },
    orderBy: { parentId: "asc" } // Process parents first for inheritance
  });
  
  const results = { total: categories.length, updated: 0, skipped: 0 };
  
  for (const cat of categories) {
    const newIcon = await getIconWithInheritance(cat.name, cat.slug, cat.parentId);
    
    if (newIcon !== cat.icon) {
      await prisma.category.update({
        where: { id: cat.id },
        data: { icon: newIcon }
      });
      results.updated++;
    } else {
      results.skipped++;
    }
  }
  
  return results;
}

export default {
  getIconForCategory,
  getIconWithInheritance,
  assignIconToCategory,
  assignIconsToAllCategories,
  DEFAULT_ICON
};
