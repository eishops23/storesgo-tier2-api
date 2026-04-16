import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma.js';

const DELIVERY_ZONES: Record<string, any> = {
  'miami-dade': { name: 'Miami-Dade County', sameDayAvailable: true, estimatedTime: '2-4 hours', deliveryFee: 0, minimumOrder: 25 },
  'broward': { name: 'Broward County', sameDayAvailable: true, estimatedTime: '2-4 hours', deliveryFee: 0, minimumOrder: 25 },
  'palm-beach': { name: 'Palm Beach County', sameDayAvailable: true, estimatedTime: '3-5 hours', deliveryFee: 4.99, minimumOrder: 35 },
  'nationwide': { name: 'United States', sameDayAvailable: false, estimatedTime: '3-7 business days', deliveryFee: 14.99, minimumOrder: 75 },
};

export default async function productSeoRoutes(fastify: FastifyInstance) {

  fastify.get<{ Params: { slug: string } }>('/:slug', async (request, reply) => {
    const { slug } = request.params;
    const deliveryInfo = DELIVERY_ZONES['miami-dade'];

    try {
      const products: any[] = await prisma.$queryRawUnsafe(`
        SELECT p.*, s."storeName" as seller_name, s.slug as seller_slug
        FROM "Product" p
        JOIN "Seller" s ON p."sellerId" = s.id
        WHERE p.slug = $1 AND p."isActive" = true
        LIMIT 1
      `, slug);

      if (products.length === 0) {
        return reply.status(404).send({ error: 'Product not found' });
      }

      const product = products[0];

      const relatedProducts: any[] = await prisma.$queryRawUnsafe(`
        SELECT p.id, p.name, p.slug, p."priceCents", p."imageUrl"
        FROM "Product" p
        WHERE p."isActive" = true AND p.id != $1 AND p."categoryId" = $2
        ORDER BY p."updatedAt" DESC
        LIMIT 8
      `, product.id, product.categoryId);

      const formattedRelated = relatedProducts.map(p => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: p.priceCents / 100,
        imageUrl: p.imageUrl,
      }));

      const price = product.priceCents / 100;
      const title = `${product.name} | StoresGo`;
      const description = `Order ${product.name} online. Same-day delivery. $${price.toFixed(2)}`;

      return {
        product: {
          id: product.id,
          name: product.name,
          slug: product.slug,
          description: product.description,
          price,
          imageUrl: product.imageUrl,
          seller: { name: product.seller_name, slug: product.seller_slug },
        },
        availability: 'in_stock',
        delivery: { ...deliveryInfo, message: `Same-day delivery to ${deliveryInfo.name} in ${deliveryInfo.estimatedTime}` },
        relatedProducts: formattedRelated,
        seo: { title, description, canonicalUrl: `https://storesgo.com/product/${slug}`, robots: 'index, follow' },
      };
    } catch (error) {
      console.error('Product page error:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });
}
