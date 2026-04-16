import prisma from "../../lib/prisma.js";

export default async function sellerAnalyticsRoutes(app) {
  // 📊 Seller KPI Summary
  app.get("/api/analytics/seller/:sellerId", async (req, reply) => {
    const sellerId = Number(req.params.sellerId);
    if (!sellerId) return reply.code(400).send({ error: "Invalid sellerId" });

    // 🛒 Orders
    const orders = await prisma.order.findMany({
      where: { sellerId },
      include: { orderItems: true },
    });

    // 💵 Total GMV
    const gmv = orders.reduce((sum, o) => sum + o.totalAmountCents, 0);

    // 📦 Total Orders
    const totalOrders = orders.length;

    // ⭐ Reviews
    const reviews = await prisma.review.findMany({ where: { sellerId } });
    const avgRating =
      reviews.length === 0
        ? 0
        : reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;

    reply.send({
      sellerId,
      gmv,
      totalOrders,
      avgRating,
      reviewCount: reviews.length,
      generatedAt: new Date().toISOString(),
    });
  });
}
