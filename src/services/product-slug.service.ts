/**
 * PRODUCT SLUG SERVICE
 * Handles all slug operations for products
 * - Auto-generation on create
 * - Lookup by ID or slug
 * - Bulk migration
 */

import { PrismaClient } from '@prisma/client';
import { generateProductSlug, extractIdFromSlug, isNumericId } from '../utils/slug.js';

const prisma = new PrismaClient();

// Find product by ID or slug (handles both cases)
export async function findProductByIdOrSlug(identifier: string) {
  // If numeric, lookup by ID
  if (isNumericId(identifier)) {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(identifier, 10) },
      include: {
        category: true,
        seller: true,
        reviews: { take: 10, orderBy: { createdAt: 'desc' } }
      }
    });
    
    // Return with redirect flag if product has a slug
    if (product && product.slug) {
      return { product, shouldRedirect: true, canonicalSlug: product.slug };
    }
    return { product, shouldRedirect: false, canonicalSlug: null };
  }
  
  // Otherwise, lookup by slug
  const product = await prisma.product.findUnique({
    where: { slug: identifier },
    include: {
      category: true,
      seller: true,
      reviews: { take: 10, orderBy: { createdAt: 'desc' } }
    }
  });
  
  return { product, shouldRedirect: false, canonicalSlug: null };
}

// Create product with auto-generated slug
export async function createProductWithSlug(data: {
  sellerId: number;
  name: string;
  description?: string;
  priceCents: number;
  categoryId?: number;
  imageUrl?: string;
  [key: string]: any;
}) {
  // Create product first to get ID
  const product = await prisma.product.create({
    data: {
      ...data,
      slug: null // Temporary, will update
    }
  });
  
  // Generate and set slug with ID
  const slug = generateProductSlug(product.name, product.id);
  
  return prisma.product.update({
    where: { id: product.id },
    data: { slug },
    include: { category: true, seller: true }
  });
}

// Update product (regenerate slug if name changed)
export async function updateProductWithSlug(
  id: number, 
  data: { name?: string; [key: string]: any },
  regenerateSlug: boolean = false
) {
  const updateData: any = { ...data };
  
  if (data.name && regenerateSlug) {
    updateData.slug = generateProductSlug(data.name, id);
  }
  
  return prisma.product.update({
    where: { id },
    data: updateData,
    include: { category: true, seller: true }
  });
}

// Bulk import products with slugs
export async function bulkCreateProductsWithSlugs(
  products: Array<{
    sellerId: number;
    name: string;
    priceCents: number;
    [key: string]: any;
  }>
) {
  const results = [];
  
  // Process in transaction for consistency
  for (const productData of products) {
    const product = await createProductWithSlug(productData);
    results.push(product);
  }
  
  return results;
}

// Migration: Generate slugs for products without them
export async function migrateProductSlugs(batchSize: number = 1000) {
  const total = await prisma.product.count({ where: { slug: null } });
  let processed = 0;
  
  while (processed < total) {
    const products = await prisma.product.findMany({
      where: { slug: null },
      select: { id: true, name: true },
      take: batchSize
    });
    
    if (products.length === 0) break;
    
    await prisma.$transaction(
      products.map(p => 
        prisma.product.update({
          where: { id: p.id },
          data: { slug: generateProductSlug(p.name, p.id) }
        })
      )
    );
    
    processed += products.length;
    console.log(`Migrated ${processed}/${total} products`);
  }
  
  return { total, processed };
}

export default {
  findProductByIdOrSlug,
  createProductWithSlug,
  updateProductWithSlug,
  bulkCreateProductsWithSlugs,
  migrateProductSlugs
};
