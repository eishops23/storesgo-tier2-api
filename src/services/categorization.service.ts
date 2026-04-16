// ==========================================================
// STORESGO AUTO-CATEGORIZATION SERVICE
// Marketplace-grade: runs on every product creation/import
// Handles: single products, bulk imports, API integrations
// ==========================================================

import { prisma } from "../plugins/prisma.js";

// Category keyword rules - expandable by admin
interface CategoryRule {
  categorySlug: string;
  keywords: string[];
  priority: number; // Higher = checked first
}

// Default rules - should eventually be stored in DB for admin management
const CATEGORY_RULES: CategoryRule[] = [
  // Baby Products
  { categorySlug: 'baby-products', priority: 100, keywords: [
    'baby food', 'baby yogurt', 'baby pouch', 'serenity kids', 'gerber', 
    'diaper', 'wipes', 'huggies', 'pampers', 'luvs', 'baby formula',
    'infant', 'toddler food', 'baby cereal', 'nursery', 'baby bath',
    'baby lotion', 'baby shampoo', 'baby powder', 'sippy cup', 'pacifier'
  ]},
  
  // Beverages
  { categorySlug: 'beverages', priority: 90, keywords: [
    'coffee', 'tea', 'juice', 'soda', 'water', 'drink', 'beverage',
    'creamer', 'coffee mate', 'espresso', 'latte', 'cola', 'pepsi',
    'coca-cola', 'sprite', 'gatorade', 'energy drink', 'smoothie',
    'wine', 'beer', 'liquor', 'champagne', 'kombucha', 'milk'
  ]},
  
  // Snacks
  { categorySlug: 'snacks', priority: 85, keywords: [
    'chips', 'snack', 'crackers', 'popcorn', 'pretzels', 'nuts',
    'candy', 'chocolate', 'gummy', 'cookies', 'granola bar',
    'trail mix', 'jerky', 'fruit snack', 'cheese puff', 'tortilla chip'
  ]},
  
  // Baking & Cooking
  { categorySlug: 'baking-and-cooking', priority: 80, keywords: [
    'bread', 'buns', 'bagel', 'muffin', 'croissant', 'flour',
    'sugar', 'baking', 'yeast', 'cake mix', 'frosting', 'cooking oil',
    'olive oil', 'vinegar', 'spice', 'seasoning', 'sauce', 'pasta',
    'rice', 'noodle', 'tortilla', 'wrap'
  ]},
  
  // Personal Care
  { categorySlug: 'personal-care', priority: 75, keywords: [
    'soap', 'shampoo', 'conditioner', 'lotion', 'deodorant', 'toothpaste',
    'toothbrush', 'mouthwash', 'razor', 'shaving', 'body wash',
    'face wash', 'moisturizer', 'sunscreen', 'lip balm', 'hair care'
  ]},
  
  // Health & Wellness
  { categorySlug: 'health-and-wellness', priority: 70, keywords: [
    'vitamin', 'supplement', 'medicine', 'pain relief', 'cold',
    'flu', 'allergy', 'first aid', 'bandage', 'thermometer',
    'probiotic', 'fiber', 'antacid', 'cough', 'sleep aid'
  ]},
  
  // Household Essentials
  { categorySlug: 'household-essentials', priority: 65, keywords: [
    'cleaner', 'detergent', 'paper towel', 'trash bag', 'tissue',
    'toilet paper', 'dish soap', 'laundry', 'fabric softener',
    'air freshener', 'candle', 'battery', 'light bulb', 'aluminum foil',
    'plastic wrap', 'storage bag', 'sponge', 'mop', 'broom'
  ]},
  
  // Pet Supplies
  { categorySlug: 'pet-supplies', priority: 60, keywords: [
    'dog food', 'cat food', 'pet food', 'pet treat', 'dog treat',
    'cat treat', 'pet toy', 'cat litter', 'dog bone', 'puppy',
    'kitten', 'bird food', 'fish food', 'pet bed', 'leash', 'collar'
  ]},
  
  // Caribbean Foods
  { categorySlug: 'caribbean-foods', priority: 55, keywords: [
    'jamaican', 'caribbean', 'jerk', 'plantain', 'scotch bonnet',
    'ackee', 'callaloo', 'sorrel', 'grace', 'walkerswood', 'reggae'
  ]},
  
  // Latin Foods
  { categorySlug: 'latin-foods', priority: 55, keywords: [
    'mexican', 'latin', 'hispanic', 'taco', 'burrito', 'salsa',
    'enchilada', 'tamale', 'goya', 'la costena', 'jalapeno',
    'chipotle', 'masa', 'mole', 'chorizo', 'queso'
  ]},
  
  // Asian Foods
  { categorySlug: 'asian-foods', priority: 55, keywords: [
    'asian', 'chinese', 'japanese', 'korean', 'thai', 'vietnamese',
    'soy sauce', 'teriyaki', 'sriracha', 'ramen', 'sushi', 'tofu',
    'miso', 'wasabi', 'kimchi', 'curry', 'coconut milk', 'rice noodle'
  ]},
  
  // Fragrances
  { categorySlug: 'fragrances', priority: 50, keywords: [
    'perfume', 'cologne', 'fragrance', 'eau de', 'body spray',
    'scent', 'aromatherapy', 'essential oil'
  ]},
];

// Cache category IDs for performance
let categoryCache: Map<string, number> | null = null;

async function getCategoryCache(): Promise<Map<string, number>> {
  if (categoryCache) return categoryCache;
  
  categoryCache = new Map();
  const categories = await prisma.category.findMany({
    where: { parentId: null },
    select: { id: true, slug: true }
  });
  
  for (const cat of categories) {
    categoryCache.set(cat.slug, cat.id);
  }
  
  return categoryCache;
}

/**
 * Auto-categorize a single product based on name/description
 * Returns category ID or null if no match
 */
export async function autoCategorizeProduct(
  name: string,
  description?: string | null
): Promise<{ categoryId: number | null; confidence: 'high' | 'medium' | 'low' | 'none'; matchedKeyword?: string }> {
  const cache = await getCategoryCache();
  const searchText = `${name} ${description || ''}`.toLowerCase();
  
  // Sort rules by priority
  const sortedRules = [...CATEGORY_RULES].sort((a, b) => b.priority - a.priority);
  
  for (const rule of sortedRules) {
    for (const keyword of rule.keywords) {
      if (searchText.includes(keyword.toLowerCase())) {
        const categoryId = cache.get(rule.categorySlug);
        if (categoryId) {
          // Determine confidence based on match quality
          const confidence = name.toLowerCase().includes(keyword.toLowerCase()) ? 'high' : 'medium';
          return { categoryId, confidence, matchedKeyword: keyword };
        }
      }
    }
  }
  
  return { categoryId: null, confidence: 'none' };
}

/**
 * Auto-categorize and update a product in the database
 * Used by: product creation, bulk import, migration scripts
 */
export async function categorizeAndUpdateProduct(productId: number): Promise<{
  success: boolean;
  categoryId: number | null;
  confidence: string;
}> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, name: true, description: true, categoryId: true }
  });
  
  if (!product) {
    return { success: false, categoryId: null, confidence: 'none' };
  }
  
  // Skip if already categorized
  if (product.categoryId) {
    return { success: true, categoryId: product.categoryId, confidence: 'existing' };
  }
  
  const result = await autoCategorizeProduct(product.name, product.description);
  
  if (result.categoryId) {
    await prisma.product.update({
      where: { id: productId },
      data: { categoryId: result.categoryId }
    });
  }
  
  return {
    success: result.categoryId !== null,
    categoryId: result.categoryId,
    confidence: result.confidence
  };
}

/**
 * Batch categorize products (for bulk imports)
 * Processes in batches for performance
 */
export async function batchCategorizeProducts(productIds: number[]): Promise<{
  total: number;
  categorized: number;
  skipped: number;
  failed: number;
}> {
  const results = { total: productIds.length, categorized: 0, skipped: 0, failed: 0 };
  
  for (const id of productIds) {
    const result = await categorizeAndUpdateProduct(id);
    if (result.confidence === 'existing') {
      results.skipped++;
    } else if (result.success) {
      results.categorized++;
    } else {
      results.failed++;
    }
  }
  
  return results;
}

/**
 * Categorize all uncategorized products
 * Used by: admin tools, scheduled jobs
 */
export async function categorizeAllUncategorized(): Promise<{
  total: number;
  categorized: number;
  failed: number;
}> {
  const uncategorized = await prisma.product.findMany({
    where: { categoryId: null, isActive: true },
    select: { id: true }
  });
  
  const results = { total: uncategorized.length, categorized: 0, failed: 0 };
  
  for (const product of uncategorized) {
    const result = await categorizeAndUpdateProduct(product.id);
    if (result.success) {
      results.categorized++;
    } else {
      results.failed++;
    }
  }
  
  return results;
}

/**
 * Get fallback category for products that can't be auto-categorized
 */
export async function getFallbackCategoryId(): Promise<number> {
  const cache = await getCategoryCache();
  // Use Household Essentials as fallback
  return cache.get('household-essentials') || 1;
}

/**
 * Clear category cache (call when categories are updated)
 */
export function clearCategoryCache(): void {
  categoryCache = null;
}

export default {
  autoCategorizeProduct,
  categorizeAndUpdateProduct,
  batchCategorizeProducts,
  categorizeAllUncategorized,
  getFallbackCategoryId,
  clearCategoryCache
};
