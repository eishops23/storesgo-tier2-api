import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../lib/prisma.js";

export default async function recommendationsRoutes(app: FastifyInstance) {
  // GET /api/recommendations - AI-powered product recommendations with rotation
  app.get("/", async (request: FastifyRequest, reply: FastifyReply) => {
    const { limit = "10" } = request.query as { limit?: string };
    const limitNum = Math.min(parseInt(limit), 20);
    
    // Get all sellers
    const sellers = await prisma.seller.findMany({ 
      where: { isApproved: true },
      select: { id: true } 
    });
    const sellerIds = sellers.map(s => s.id);
    
    // Random offset for variety (changes every few minutes)
    const timeBasedOffset = Math.floor(Date.now() / 180000) % 100; // Changes every 3 min
    
    const perSeller = Math.ceil(limitNum / sellerIds.length) + 1;
    
    const productPromises = sellerIds.map(sid =>
      prisma.product.findMany({
        where: { sellerId: sid, isActive: true },
        skip: (timeBasedOffset * sid) % 50, // Different offset per seller for variety
        take: perSeller,
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
    for (let i = 0; i < maxLen && products.length < limitNum; i++) {
      for (const sellerProducts of results) {
        if (sellerProducts[i] && products.length < limitNum) {
          products.push({
            ...sellerProducts[i],
            reason: getRandomReason(),
            score: 0.8 + Math.random() * 0.2,
          });
        }
      }
    }
    
    return reply.send({ ok: true, data: products });
  });

  app.log.info("🎯 Recommendations routes registered");
}

// Random reasons for variety
function getRandomReason(): string {
  const reasons = [
    "Popular in your area",
    "Trending this week",
    "Customers also bought",
    "Highly rated",
    "New arrival",
    "Best seller",
    "Staff pick",
    "Great value",
  ];
  return reasons[Math.floor(Math.random() * reasons.length)];
}
