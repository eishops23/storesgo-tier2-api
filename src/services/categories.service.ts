// ==========================================================
// STORESGO CATEGORIES SERVICE — PHASE 18 ENHANCED
// Full support for hierarchical categories, breadcrumbs, and products
// ==========================================================

import { prisma } from "../plugins/prisma.js";
import { cached, TTL } from "../lib/cache.js";
import type { Category } from "@prisma/client";

// Types
export interface CategoryResult {
  id: number | null;
  name: string;
  slug: string;
  icon?: string | null;
  image?: string | null;
  tagline?: string | null;
  color?: string | null;
  sortOrder?: number | null;
  parentId?: number | null;
  type: "static" | "dynamic";
  seo_title?: string | null;
  seo_description?: string | null;
  seo_content?: string | null;
  productCount?: number;
}

export interface CategoryWithChildren extends CategoryResult {
  children: CategoryResult[];
}

export interface CategoryDetail {
  category: CategoryResult;
  children: CategoryResult[];
  parentsBreadcrumb: CategoryResult[];
}

export interface CategoryProductsResult {
  products: any[];
  total: number;
  page: number;
  pageSize: number;
}

// STATIC STORESGO CATEGORIES (your 12 main homepage categories)
const STATIC_CATEGORIES: CategoryResult[] = [
  { id: null, name: "Fresh Groceries", slug: "fresh-groceries", type: "static" },
  { id: null, name: "Latin & Caribbean Foods", slug: "latin-caribbean-foods", type: "static" },
  { id: null, name: "Asian Foods", slug: "asian-foods", type: "static" },
  { id: null, name: "Fragrances", slug: "fragrances", type: "static" },
  { id: null, name: "Snacks", slug: "snacks", type: "static" },
  { id: null, name: "Beverages", slug: "beverages", type: "static" },
  { id: null, name: "Baking & Cooking", slug: "baking-cooking", type: "static" },
  { id: null, name: "Household", slug: "household", type: "static" },
  { id: null, name: "Personal Care", slug: "personal-care", type: "static" },
  { id: null, name: "Health & Wellness", slug: "health-wellness", type: "static" },
  { id: null, name: "Baby Products", slug: "baby-products", type: "static" },
  { id: null, name: "Pet Supplies", slug: "pet-supplies", type: "static" },
];

// Convert DB category to CategoryResult
function toResult(c: Category): CategoryResult {
  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    icon: c.icon,
    image: c.image,
    tagline: c.tagline,
    color: c.color,
    sortOrder: c.sortOrder,
    parentId: c.parentId,
    type: "dynamic",
    seo_title: c.seo_title,
    seo_description: c.seo_description,
    seo_content: c.seo_content,
  };
}

// ---------------------------------------------------------
// GET ALL CATEGORIES (with children grouped)
// Returns parent categories with their subcategories
// ---------------------------------------------------------
export async function getAllCategories(): Promise<CategoryWithChildren[]> {
  const allCategories = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  const categoryMap = new Map<number, Category>();
  const childrenMap = new Map<number, Category[]>();

  // Build maps
  for (const cat of allCategories) {
    categoryMap.set(cat.id, cat);
    if (cat.parentId) {
      const children = childrenMap.get(cat.parentId) || [];
      children.push(cat);
      childrenMap.set(cat.parentId, children);
    }
  }

  // Get parent categories (no parentId)
  const parents = allCategories.filter((c) => !c.parentId);

  // Build result with children
  const result: CategoryWithChildren[] = parents.map((parent) => ({
    ...toResult(parent),
    children: (childrenMap.get(parent.id) || []).map(toResult),
  }));

  // Add static categories that don't exist in DB (with empty children)
  const staticFiltered = STATIC_CATEGORIES.filter(
    (sc) => !result.find((dc) => dc.slug === sc.slug)
  );

  for (const sc of staticFiltered) {
    result.push({
      ...sc,
      children: [],
    });
  }

  return result;
}

// ---------------------------------------------------------
// GET PARENT CATEGORIES ONLY (for navigation)
// ---------------------------------------------------------
export async function getParentCategories(): Promise<CategoryResult[]> {
  const categories = await prisma.category.findMany({
    where: { parentId: null },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  const dynamicCategories = categories.map(toResult);

  // Add static categories that don't exist in DB
  const staticFiltered = STATIC_CATEGORIES.filter(
    (sc) => !dynamicCategories.find((dc) => dc.slug === sc.slug)
  );

  return [...dynamicCategories, ...staticFiltered];
}

// ---------------------------------------------------------
// GET CATEGORY BY SLUG (with children and breadcrumbs)
// ---------------------------------------------------------
export async function getCategoryBySlug(slug: string): Promise<CategoryDetail | null> {
  return cached(`categories:slug:${slug}`, TTL.MEDIUM, async () => {
  // Check DB first (dynamic categories have real data with children)
  const category = await prisma.category.findUnique({
    where: { slug },
  });
  
  // If found in DB, get children and breadcrumb
  if (category) {
    // Get children with product counts
    const children = await prisma.category.findMany({
      where: { parentId: category.id },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
    
    // Add product counts to children (including their sub-children)
    const childrenWithCounts = await Promise.all(
      children.map(async (child) => {
        // Get child's children (grandchildren)
        const grandchildren = await prisma.category.findMany({
          where: { parentId: child.id },
          select: { id: true },
        });
        const grandchildIds = grandchildren.map(gc => gc.id);
        const allIds = [child.id, ...grandchildIds];
        
        // Count direct categoryId products
        const directCount = await prisma.product.count({
          where: { categoryId: { in: allIds }, isActive: true },
        });
        
        const assignedCount = await prisma.product.count({
          where: { isActive: true, OR: [{ categoryId: null }, { categoryId: { notIn: allIds } }], categoryAssignments: { some: { categoryId: { in: allIds } } } },
        });
        
        const productCount = directCount + assignedCount;
        return { ...toResult(child), productCount };
      })
    );
    
    // Build breadcrumb (ancestors)
    const parentsBreadcrumb: CategoryResult[] = [];
    let currentParentId = category.parentId;
    while (currentParentId) {
      const parent = await prisma.category.findUnique({
        where: { id: currentParentId },
      });
      if (parent) {
        parentsBreadcrumb.unshift(toResult(parent));
        currentParentId = parent.parentId;
      } else {
        break;
      }
    }
    
    // Get total product count for this category (including subcategories)
    const descendantIds = await getAllDescendantIds(category.id);
    const allCategoryIds = [category.id, ...descendantIds];
    
    // Count direct categoryId products
    const directCount = await prisma.product.count({
      where: { categoryId: { in: allCategoryIds }, isActive: true },
    });
    
    const assignedCount = await prisma.product.count({
      where: { isActive: true, OR: [{ categoryId: null }, { categoryId: { notIn: allCategoryIds } }], categoryAssignments: { some: { categoryId: { in: allCategoryIds } } } },
    });
    
    const totalProductCount = directCount + assignedCount;
    
    return {
      category: { ...toResult(category), productCount: totalProductCount },
      children: childrenWithCounts,
      parentsBreadcrumb,
    };
  }
  
  // Fallback to static categories
  const staticCat = STATIC_CATEGORIES.find((c) => c.slug === slug);
  if (staticCat) {
    return {
      category: staticCat,
      children: [],
      parentsBreadcrumb: [],
    };
  }
  
  return null;
  }); // end cached()
}

// ---------------------------------------------------------
// GET PRODUCTS BY CATEGORY SLUG (paginated)
// Includes images, seller, taxonomy (category)
// ---------------------------------------------------------

// ============================================
// GET PRODUCTS BY CATEGORY SLUG - INTERLEAVED
// Ensures ALL sellers appear on every page
// ============================================
export async function getProductsByCategorySlug(
  slug: string,
  options: {
    page?: number;
    pageSize?: number;
    sort?: string;
    minPrice?: number;
    maxPrice?: number;
  } = {}
): Promise<CategoryProductsResult | null> {
  const category = await prisma.category.findUnique({
    where: { slug },
  });

  if (!category) {
    const staticCat = STATIC_CATEGORIES.find((c) => c.slug === slug);
    if (!staticCat) return null;
    return { products: [], total: 0, page: 1, pageSize: options.pageSize || 20 };
  }

  const page = Number(options.page) || 1;
  const pageSize = Math.min(Number(options.pageSize) || 20, 100);

  // Build base where clause
  const baseWhere: any = { isActive: true };

  // Price filter
  if (options.minPrice || options.maxPrice) {
    baseWhere.priceCents = {};
    if (options.minPrice) baseWhere.priceCents.gte = Math.round(options.minPrice * 100);
    if (options.maxPrice) baseWhere.priceCents.lte = Math.round(options.maxPrice * 100);
  }

  // Build order by
  let orderBy: any = { name: "asc" };
  switch (options.sort) {
    case "price_asc": orderBy = { priceCents: "asc" }; break;
    case "price_desc": orderBy = { priceCents: "desc" }; break;
    case "name_asc": orderBy = { name: "asc" }; break;
    case "name_desc": orderBy = { name: "desc" }; break;
    case "newest": orderBy = { createdAt: "desc" }; break;
  }

  // Include subcategory products (children and grandchildren)
  let categoryIds = [category.id];
  const subcategories = await prisma.category.findMany({
    where: { parentId: category.id },
    select: { id: true },
  });
  if (subcategories.length > 0) {
    categoryIds.push(...subcategories.map((c) => c.id));
    const grandchildren = await prisma.category.findMany({
      where: { parentId: { in: subcategories.map(c => c.id) } },
      select: { id: true },
    });
    categoryIds.push(...grandchildren.map(g => g.id));
  }

  // Get product IDs from multi-category assignments (for ethnic/cross-category products)
  const assignedProducts = await prisma.productCategoryAssignment.findMany({
    where: { categoryId: { in: categoryIds } },
  });
  const assignedProductIds = assignedProducts.map(a => a.productId);

  // Build where clause: either direct categoryId OR in assignments
  const where: any = {
    ...baseWhere,
    OR: [
      { categoryId: { in: categoryIds } },
      { categoryAssignments: { some: { categoryId: { in: categoryIds } } } },
    ],
  };

  // Get all unique sellers with products in this category
  const sellersWithProducts = await prisma.product.groupBy({
    by: ['sellerId'],
    where,
    _count: true,
  });

  if (sellersWithProducts.length === 0) {
    return { products: [], total: 0, page, pageSize };
  }

  const sellerIds = sellersWithProducts.map(s => s.sellerId);
  const totalCount = sellersWithProducts.reduce((sum, s) => sum + s._count, 0);

  // Calculate products per seller for interleaving
  const productsPerSeller = Math.ceil(pageSize / sellerIds.length);
  const sellerOffset = (page - 1) * productsPerSeller;

  // Fetch products from each seller
  const sellerProducts = await Promise.all(
    sellerIds.map(sellerId =>
      prisma.product.findMany({
        where: { ...where, sellerId },
        orderBy,
        skip: sellerOffset,
        take: productsPerSeller + 1,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          seller: { select: { id: true, storeName: true, slug: true } },
        },
      })
    )
  );

  // Interleave products (round-robin from all sellers)
  const interleaved: any[] = [];
  const maxLen = Math.max(...sellerProducts.map(arr => arr.length));
  for (let i = 0; i < maxLen && interleaved.length < pageSize; i++) {
    for (const products of sellerProducts) {
      if (products[i] && interleaved.length < pageSize) {
        interleaved.push(products[i]);
      }
    }
  }

  return { products: interleaved, total: totalCount, page, pageSize };
}

export async function getDynamicCategories(): Promise<CategoryResult[]> {
  const rows = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });

  return rows.map(toResult);
}

// ==========================================================
// RECURSIVE CATEGORY HELPERS — MARKETPLACE-GRADE
// Handles unlimited depth hierarchy for millions of products
// ==========================================================

async function getAllDescendantIds(categoryId: number): Promise<number[]> {
  const descendants: number[] = [];
  let currentLevel = [categoryId];
  
  while (currentLevel.length > 0) {
    const children = await prisma.category.findMany({
      where: { parentId: { in: currentLevel } },
      select: { id: true },
    });
    
    const childIds = children.map(c => c.id);
    descendants.push(...childIds);
    currentLevel = childIds;
  }
  
  return descendants;
}

export async function getRecursiveProductCount(categoryId: number): Promise<number> {
  const descendantIds = await getAllDescendantIds(categoryId);
  const allIds = [categoryId, ...descendantIds];
  
  return prisma.product.count({
    where: { 
      categoryId: { in: allIds },
      isActive: true 
    },
  });
}

export async function getAllCategoriesWithCounts(): Promise<CategoryWithChildren[]> {
  return cached("categories:all_with_counts", TTL.MEDIUM, async () => {
  const allCategories = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  
  const childrenMap = new Map<number, Category[]>();
  for (const cat of allCategories) {
    if (cat.parentId) {
      const children = childrenMap.get(cat.parentId) || [];
      children.push(cat);
      childrenMap.set(cat.parentId, children);
    }
  }
  
  const parents = allCategories.filter(c => !c.parentId);
  
  const productCounts = await prisma.product.groupBy({
    by: ['categoryId'],
    where: { isActive: true },
    _count: true,
  });
  
  const countMap = new Map<number, number>();
  for (const pc of productCounts) {
    if (pc.categoryId) countMap.set(pc.categoryId, pc._count);
  }
  
  // Ethnic category IDs that use assignment-based counting
  // Ethnic categories detected dynamically below
  
  // Count assignments only for ethnic categories
  const ethnicAssignments = await prisma.productCategoryAssignment.groupBy({
    by: ['categoryId'],
    where: { assignedBy: { startsWith: 'ai-ethnic' } },
    _count: true,
  });
  const assignmentMap = new Map<number, number>();
  for (const ac of ethnicAssignments) {
    assignmentMap.set(ac.categoryId, ac._count);
  }
  const ethnicCategoryIds = new Set(ethnicAssignments.map(ea => ea.categoryId));
  
  function getRecursiveCount(catId: number, isEthnic: boolean = false): number {
    let total = countMap.get(catId) || 0;
    // For ethnic categories, use assignment counts instead
    if (isEthnic || ethnicCategoryIds.has(catId)) {
      total = assignmentMap.get(catId) || 0;
      isEthnic = true;
    }
    const children = childrenMap.get(catId) || [];
    for (const child of children) {
      total += getRecursiveCount(child.id, isEthnic);
    }
    return total;
  }
  
  const result: CategoryWithChildren[] = parents.map(parent => {
    const children = (childrenMap.get(parent.id) || []).map(child => ({
      ...toResult(child),
      productCount: getRecursiveCount(child.id),
    }));
    
    return {
      ...toResult(parent),
      productCount: getRecursiveCount(parent.id),
      children,
    };
  });
  
  return result;
  }); // end cached()
}
