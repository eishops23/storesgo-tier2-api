import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma.js';
import { getAllLocations, getLocationBySlug, getCategoryBySlug, generateHubPages, ETHNIC_CATEGORIES, TIER1_CITIES, TIER2_CITIES, ETHNIC_NEIGHBORHOODS } from '../config/seo-config.js';

interface HubParams { location: string; category: string; }

export default async function hubRoutes(fastify: FastifyInstance) {

  fastify.get<{ Params: HubParams }>('/:location/:category', async (request, reply) => {
    const { location: locationSlug, category: categorySlug } = request.params;
    const location = getLocationBySlug(locationSlug);
    if (!location) return reply.status(404).send({ error: 'Location not found' });
    const category = getCategoryBySlug(categorySlug);
    if (!category) return reply.status(404).send({ error: 'Category not found' });

    try {
      const searchTerms = category.keywords.map(k => `%${k.split(' ')[0]}%`);
      const brandTerms = category.topBrands.map(b => `%${b}%`);
      
      const products: any[] = await prisma.$queryRawUnsafe(`
        SELECT p.id, p.name, p.slug, p."priceCents", p."imageUrl",
               s."storeName" as seller_name, s.slug as seller_slug
        FROM products p
        JOIN sellers s ON p."sellerId" = s.id
        WHERE p."isActive" = true
          AND (p.name ILIKE ANY($1::text[]) OR p.name ILIKE ANY($2::text[]))
        ORDER BY p."updatedAt" DESC
        LIMIT 50
      `, searchTerms, brandTerms);

      const formattedProducts = products.map(p => ({
        id: p.id, name: p.name, slug: p.slug, price: p.priceCents / 100, imageUrl: p.imageUrl, seller_name: p.seller_name, seller_slug: p.seller_slug,
      }));

      const allLocations = getAllLocations();
      const nearbyLocations = allLocations.filter(l => l.slug !== locationSlug && l.county === location.county).slice(0, 5);
      const relatedCategories = ETHNIC_CATEGORIES.filter(c => c.slug !== categorySlug && c.cuisine === category.cuisine).slice(0, 5);

      return {
        location: { slug: location.slug, name: location.name, county: location.county, type: (location as any).type },
        category: { slug: category.slug, name: category.name, cuisine: category.cuisine, description: category.description },
        products: formattedProducts,
        productCount: formattedProducts.length,
        topBrands: category.topBrands.map(b => ({ brand: b })),
        seo: { title: `${category.name} Delivery in ${location.name} | StoresGo`, h1: `${category.name} Delivery in ${location.name}`, canonicalUrl: `https://storesgo.com/${locationSlug}/${categorySlug}` },
        nearbyLocations: nearbyLocations.map(l => ({ slug: l.slug, name: l.name, url: `/${l.slug}/${categorySlug}` })),
        relatedCategories: relatedCategories.map(c => ({ slug: c.slug, name: c.name, url: `/${locationSlug}/${c.slug}` })),
        delivery: { sameDayAvailable: true, estimatedTime: '2-4 hours', minimumOrder: 25, deliveryFee: 'Free over $50' },
      };
    } catch (error) {
      console.error('Hub page error:', error);
      return reply.status(500).send({ error: 'Internal server error', details: String(error) });
    }
  });

  fastify.get('/locations', async () => ({ tier1: TIER1_CITIES, tier2: TIER2_CITIES, neighborhoods: ETHNIC_NEIGHBORHOODS, total: getAllLocations().length }));
  fastify.get('/categories', async () => ({ categories: ETHNIC_CATEGORIES, total: ETHNIC_CATEGORIES.length }));
  fastify.get('/sitemap', async () => { const hubs = generateHubPages(); return { urls: hubs.map(h => ({ loc: `https://storesgo.com${h.url}`, priority: h.priority })), total: hubs.length }; });
  fastify.get('/stats', async () => { const hubs = generateHubPages(); return { hubPages: hubs.length, locations: getAllLocations().length, categories: ETHNIC_CATEGORIES.length }; });
}
