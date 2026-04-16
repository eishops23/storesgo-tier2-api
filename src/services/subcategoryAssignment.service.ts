// ==========================================================
// STORESGO SUBCATEGORY ASSIGNMENT SERVICE — MARKETPLACE-GRADE
// Automatically assigns products to most appropriate subcategory
// ==========================================================

import { prisma } from "../plugins/prisma.js";

let subcategoryCache: Map<number, { id: number; name: string; slug: string; keywords: string[] }[]> | null = null;

async function getSubcategoryCache() {
  if (subcategoryCache) return subcategoryCache;
  
  subcategoryCache = new Map();
  
  const allCategories = await prisma.category.findMany({
    where: { parentId: { not: null } },
    select: { id: true, name: true, slug: true, parentId: true }
  });
  
  for (const cat of allCategories) {
    if (!cat.parentId) continue;
    
    const keywords = extractKeywords(cat.name, cat.slug);
    
    if (!subcategoryCache.has(cat.parentId)) {
      subcategoryCache.set(cat.parentId, []);
    }
    
    subcategoryCache.get(cat.parentId)!.push({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      keywords
    });
  }
  
  return subcategoryCache;
}

function extractKeywords(name: string, slug: string): string[] {
  const combined = `${name} ${slug}`.toLowerCase();
  const words = combined
    .replace(/[-_]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2)
    .filter(w => !['and', 'the', 'for', 'with', 'more', 'other', 'general'].includes(w));
  
  return [...new Set(words)];
}

export async function findBestSubcategory(
  productName: string,
  productDescription: string | null,
  currentCategoryId: number
): Promise<{ subcategoryId: number | null; confidence: 'high' | 'medium' | 'low' | 'none'; matchedSubcategory?: string }> {
  
  const childCount = await prisma.category.count({ where: { parentId: currentCategoryId } });
  
  if (childCount === 0) {
    return { subcategoryId: null, confidence: 'none' };
  }
  
  const cache = await getSubcategoryCache();
  const subcategories = cache.get(currentCategoryId);
  
  if (!subcategories || subcategories.length === 0) {
    return { subcategoryId: null, confidence: 'none' };
  }
  
  const searchText = `${productName} ${productDescription || ''}`.toLowerCase();
  
  const scores: { subcategory: typeof subcategories[0]; score: number }[] = [];
  
  for (const subcat of subcategories) {
    let score = 0;
    
    for (const keyword of subcat.keywords) {
      if (searchText.includes(keyword)) {
        score += keyword.length;
        if (productName.toLowerCase().includes(keyword)) {
          score += 5;
        }
      }
    }
    
    if (score > 0) {
      scores.push({ subcategory: subcat, score });
    }
  }
  
  scores.sort((a, b) => b.score - a.score);
  
  if (scores.length === 0) {
    return { subcategoryId: null, confidence: 'none' };
  }
  
  const best = scores[0];
  const confidence = best.score >= 10 ? 'high' : best.score >= 5 ? 'medium' : 'low';
  
  return {
    subcategoryId: best.subcategory.id,
    confidence,
    matchedSubcategory: best.subcategory.name
  };
}

export async function assignProductToSubcategory(productId: number): Promise<{
  moved: boolean;
  fromCategory?: string;
  toSubcategory?: string;
  confidence?: string;
}> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, name: true, description: true, categoryId: true }
  });
  
  if (!product || !product.categoryId) {
    return { moved: false };
  }
  
  const result = await findBestSubcategory(
    product.name,
    product.description,
    product.categoryId
  );
  
  if (result.subcategoryId && result.confidence !== 'none') {
    const oldCategory = await prisma.category.findUnique({
      where: { id: product.categoryId },
      select: { name: true }
    });
    
    await prisma.product.update({
      where: { id: productId },
      data: { categoryId: result.subcategoryId }
    });
    
    return {
      moved: true,
      fromCategory: oldCategory?.name,
      toSubcategory: result.matchedSubcategory,
      confidence: result.confidence
    };
  }
  
  return { moved: false };
}

export async function getOrCreateGeneralSubcategory(parentId: number): Promise<number> {
  const parent = await prisma.category.findUnique({
    where: { id: parentId },
    select: { id: true, name: true, slug: true, icon: true }
  });
  
  if (!parent) throw new Error('Parent category not found');
  
  const generalSlug = `${parent.slug}-general`;
  
  let general = await prisma.category.findUnique({ where: { slug: generalSlug } });
  
  if (!general) {
    general = await prisma.category.create({
      data: {
        name: `General ${parent.name}`,
        slug: generalSlug,
        icon: parent.icon,
        tagline: `More ${parent.name.toLowerCase()} products`,
        parentId: parent.id,
        sortOrder: 999
      }
    });
  }
  
  return general.id;
}

export async function reassignAllOrphanedProducts(): Promise<{
  total: number;
  reassigned: number;
  toGeneral: number;
}> {
  const results = { total: 0, reassigned: 0, toGeneral: 0 };
  
  const childCategories = await prisma.category.findMany({
    where: { parentId: { not: null } },
    select: { parentId: true },
    distinct: ["parentId"]
  });
  
  const parentIds = childCategories.map(c => c.parentId).filter((id): id is number => id !== null);
  
  const parents = await prisma.category.findMany({
    where: { id: { in: parentIds } },
    select: { id: true, name: true }
  });
  
  for (const parent of parents) {
    const products = await prisma.product.findMany({
      where: { categoryId: parent.id },
      select: { id: true, name: true, description: true }
    });
    
    results.total += products.length;
    
    for (const product of products) {
      const match = await findBestSubcategory(product.name, product.description, parent.id);
      
      if (match.subcategoryId && match.confidence !== "none") {
        await prisma.product.update({ where: { id: product.id }, data: { categoryId: match.subcategoryId } });
        results.reassigned++;
      } else {
        const generalId = await getOrCreateGeneralSubcategory(parent.id);
        await prisma.product.update({ where: { id: product.id }, data: { categoryId: generalId } });
        results.toGeneral++;
      }
    }
  }
  
  return results;
}

export function clearSubcategoryCache(): void {
  subcategoryCache = null;
}

export default {
  findBestSubcategory,
  assignProductToSubcategory,
  getOrCreateGeneralSubcategory,
  reassignAllOrphanedProducts,
  clearSubcategoryCache
};
