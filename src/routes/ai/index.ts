import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../../lib/prisma.js";

export default async function aiRoutes(app: FastifyInstance) {
  // GET /api/ai/recommendations - AI-powered product recommendations
  app.get("/recommendations", async (request: FastifyRequest, reply: FastifyReply) => {
    const { limit = "10" } = request.query as { limit?: string };
    
    // For now, return diverse products from all sellers (simulating AI picks)
    const sellers = await prisma.seller.findMany({ select: { id: true } });
    const sellerIds = sellers.map(s => s.id);
    const perSeller = Math.ceil(parseInt(limit) / sellerIds.length);
    
    const productPromises = sellerIds.map(sid =>
      prisma.product.findMany({
        where: { sellerId: sid, isActive: true, imageUrl: { not: null, notIn: [''] } },
        take: perSeller * 3,
        orderBy: { updatedAt: "desc" },
        include: {
          seller: { select: { id: true, storeName: true, slug: true } },
          category: { select: { id: true, name: true, slug: true } },
        },
      })
    );
    
    const results = await Promise.all(productPromises);
    
    // Interleave products from all sellers
    const products: any[] = [];
    const maxLen = Math.max(...results.map(r => r.length));
    for (let i = 0; i < maxLen && products.length < parseInt(limit); i++) {
      for (const sellerProducts of results) {
        if (sellerProducts[i] && products.length < parseInt(limit)) {
          products.push({
            ...sellerProducts[i],
            aiReason: "Popular in your area",
          });
        }
      }
    }
    
    return reply.send({ ok: true, data: products });
  });

  // GET /api/ai/trending - Trending products
  app.get("/trending", async (request: FastifyRequest, reply: FastifyReply) => {
    const { limit = "10" } = request.query as { limit?: string };
    
    const products = await prisma.product.findMany({
      where: { isActive: true, imageUrl: { not: null, notIn: [''] } },
      take: parseInt(limit),
      orderBy: { updatedAt: "desc" },
      include: {
        seller: { select: { id: true, storeName: true, slug: true } },
        category: { select: { id: true, name: true, slug: true } },
      },
    });
    
    return reply.send({ ok: true, data: products });
  });

  app.log.info("🤖 AI routes registered");
}
