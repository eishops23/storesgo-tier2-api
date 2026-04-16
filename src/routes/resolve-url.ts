/**
 * URL Resolution API
 * Enterprise-grade: Database-backed URL resolution for legacy redirects
 */

import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Category slug mappings (legacy → current)
const CATEGORY_ALIASES: Record<string, string> = {
  'caribbean': 'caribbean-foods',
  'latin': 'latin-foods', 
  'asian': 'asian-foods',
  'african': 'african-foods',
  'baby': 'baby-products',
  'pet': 'pet-supplies',
  'pets': 'pet-supplies',
  'health': 'health-wellness',
  'wellness': 'health-wellness',
  'household': 'household-essentials',
  'home': 'household-essentials',
  'baking': 'baking-cooking',
  'cooking': 'baking-cooking',
  'personal': 'personal-care',
  'beauty': 'personal-care',
  'fragrance': 'fragrances',
  'perfume': 'fragrances',
  'snack': 'snacks',
  'beverage': 'beverages',
  'drink': 'beverages',
  'drinks': 'beverages',
};

interface ResolveResult {
  found: boolean;
  type?: 'product' | 'category' | 'seller' | 'search';
  redirect?: string;
  confidence: 'high' | 'medium' | 'low';
}

export default async function resolveUrlRoutes(app: FastifyInstance) {
  
  // GET /api/resolve-url?path=/product/something
  app.get('/resolve-url', async (request, reply) => {
    const { path } = request.query as { path?: string };
    
    if (!path) {
      return reply.status(400).send({ error: 'path parameter required' });
    }

    const result = await resolveUrl(path);
    return reply.send(result);
  });
}

async function resolveUrl(path: string): Promise<ResolveResult> {
  const normalized = path.toLowerCase().trim();

  // ─────────────────────────────────────────────────────────────────
  // PRODUCT: /product/123 or /product/slug/SKU or /item/...
  // ─────────────────────────────────────────────────────────────────
  const productMatch = normalized.match(/^\/(product|item)\/(.+)$/);
  if (productMatch) {
    const identifier = productMatch[2].split('/')[0]; // Remove SKU suffix
    
    // Try numeric ID first
    if (/^\d+$/.test(identifier)) {
      const product = await prisma.product.findUnique({
        where: { id: parseInt(identifier, 10) },
        select: { id: true, slug: true }
      });
      if (product) {
        return {
          found: true,
          type: 'product',
          redirect: `/products/${product.slug || product.id}`,
          confidence: 'high'
        };
      }
    }
    
    // Try slug match
    const bySlug = await prisma.product.findFirst({
      where: { 
        slug: { contains: identifier.replace(/[-_]/g, '-'), mode: 'insensitive' }
      },
      select: { id: true, slug: true }
    });
    if (bySlug) {
      return {
        found: true,
        type: 'product',
        redirect: `/products/${bySlug.slug || bySlug.id}`,
        confidence: 'high'
      };
    }

    // Try name search
    const keywords = identifier.replace(/[-_]/g, ' ').trim();
    if (keywords.length > 2) {
      const byName = await prisma.product.findFirst({
        where: { name: { contains: keywords, mode: 'insensitive' } },
        select: { id: true, slug: true }
      });
      if (byName) {
        return {
          found: true,
          type: 'product',
          redirect: `/products/${byName.slug || byName.id}`,
          confidence: 'medium'
        };
      }
      
      // Fallback to search
      return {
        found: false,
        type: 'search',
        redirect: `/search?q=${encodeURIComponent(keywords)}`,
        confidence: 'low'
      };
    }
    
    return { found: false, type: 'search', redirect: '/products', confidence: 'low' };
  }

  // ─────────────────────────────────────────────────────────────────
  // CATEGORY: /category/... or /shop/... or /browse/...
  // ─────────────────────────────────────────────────────────────────
  const categoryMatch = normalized.match(/^\/(category|shop|browse)\/(.+)$/);
  if (categoryMatch) {
    const slug = categoryMatch[2].replace(/[^a-z0-9-]/g, '');
    
    // Check alias first
    const aliasedSlug = CATEGORY_ALIASES[slug] || slug;
    
    // Try exact match
    const category = await prisma.category.findFirst({
      where: { slug: aliasedSlug },
      select: { id: true, slug: true }
    });
    if (category) {
      return {
        found: true,
        type: 'category',
        redirect: `/categories/${category.slug}`,
        confidence: 'high'
      };
    }
    
    // Try partial match (e.g., "caribbean" matches "caribbean-foods")
    const partial = await prisma.category.findFirst({
      where: { 
        slug: { startsWith: slug, mode: 'insensitive' },
        parentId: null // Top-level only
      },
      select: { id: true, slug: true }
    });
    if (partial) {
      return {
        found: true,
        type: 'category',
        redirect: `/categories/${partial.slug}`,
        confidence: 'medium'
      };
    }

    // Fallback to search
    return {
      found: false,
      type: 'search', 
      redirect: `/search?q=${encodeURIComponent(slug.replace(/-/g, ' '))}`,
      confidence: 'low'
    };
  }

  // ─────────────────────────────────────────────────────────────────
  // SELLER: /store/... or /vendor/... or /seller/...
  // ─────────────────────────────────────────────────────────────────
  const sellerMatch = normalized.match(/^\/(store|vendor|seller)\/(.+)$/);
  if (sellerMatch) {
    const slug = sellerMatch[2];
    
    const seller = await prisma.seller.findFirst({
      where: { 
        OR: [
          { slug: { equals: slug, mode: 'insensitive' } },
          { storeName: { contains: slug.replace(/-/g, ' '), mode: 'insensitive' } }
        ]
      },
      select: { id: true, slug: true }
    });
    
    if (seller) {
      return {
        found: true,
        type: 'seller',
        redirect: `/sellers/${seller.slug || seller.id}`,
        confidence: 'high'
      };
    }
    
    return {
      found: false,
      type: 'search',
      redirect: `/sellers`,
      confidence: 'low'
    };
  }

  // ─────────────────────────────────────────────────────────────────
  // NO MATCH
  // ─────────────────────────────────────────────────────────────────
  return { found: false, confidence: 'low' };
}
