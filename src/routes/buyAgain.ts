// Buy Again API Routes
import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../lib/prisma.js";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "storesgo-secret";

function getUserIdFromToken(request: FastifyRequest): string | null {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  try {
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return decoded.id || null;
  } catch {
    return null;
  }
}

export default async function buyAgainRoutes(app: FastifyInstance) {
  app.get("/", async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = getUserIdFromToken(request);
    if (!userId) return reply.code(401).send({ ok: false, error: "Unauthorized" });

    try {
      const orderItems = await prisma.orderItem.findMany({
        where: {
          order: {
            buyerId: userId,
            status: { in: ["delivered", "shipped", "processing", "pending", "DELIVERED", "SHIPPED", "PROCESSING", "PENDING"] },
          },
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              priceCents: true,
              imageUrl: true,
              seller: { select: { id: true, storeName: true, slug: true } },
            },
          },
          order: { select: { createdAt: true } },
        },
        orderBy: { order: { createdAt: "desc" } },
      });

      const seenProductIds = new Set<number>();
      const uniqueProducts = [];

      for (const item of orderItems) {
        if (!seenProductIds.has(item.productId) && item.product) {
          seenProductIds.add(item.productId);
          uniqueProducts.push({
            id: item.product.id,
            name: item.product.name,
            slug: item.product.slug,
            priceCents: item.product.priceCents,
            imageUrl: item.product.imageUrl,
            seller: item.product.seller,
            lastOrderedAt: item.order.createdAt,
            quantity: item.quantity,
          });
        }
      }

      return { ok: true, data: uniqueProducts };
    } catch (error) {
      console.error("Buy again error:", error);
      return reply.code(500).send({ ok: false, error: "Failed to fetch buy again items" });
    }
  });
}
