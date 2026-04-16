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
  } catch { return null; }
}

export default async function favoritesRoutes(app: FastifyInstance) {
  app.get("/", async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = getUserIdFromToken(request);
    if (!userId) return reply.code(401).send({ ok: false, error: "Unauthorized" });

    const favorites = await prisma.favorite.findMany({
      where: { userId },
      include: {
        product: {
          select: {
            id: true, name: true, slug: true, priceCents: true, imageUrl: true,
            seller: { select: { id: true, storeName: true, slug: true } }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });
    return { ok: true, data: favorites };
  });

  app.post("/", async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = getUserIdFromToken(request);
    if (!userId) return reply.code(401).send({ ok: false, error: "Unauthorized" });

    const { productId } = request.body as { productId: number };
    if (!productId) return reply.code(400).send({ ok: false, error: "productId required" });

    const existing = await prisma.favorite.findUnique({
      where: { userId_productId: { userId, productId } }
    });
    if (existing) return { ok: true, data: existing, message: "Already in favorites" };

    const favorite = await prisma.favorite.create({ data: { userId, productId } });
    return { ok: true, data: favorite };
  });

  app.delete("/:productId", async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = getUserIdFromToken(request);
    if (!userId) return reply.code(401).send({ ok: false, error: "Unauthorized" });

    const { productId } = request.params as { productId: string };
    await prisma.favorite.deleteMany({ where: { userId, productId: parseInt(productId) } });
    return { ok: true, message: "Removed from favorites" };
  });

  app.get("/check/:productId", async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = getUserIdFromToken(request);
    if (!userId) return reply.code(401).send({ ok: false, error: "Unauthorized" });

    const { productId } = request.params as { productId: string };
    const favorite = await prisma.favorite.findUnique({
      where: { userId_productId: { userId, productId: parseInt(productId) } }
    });
    return { ok: true, isFavorite: !!favorite };
  });
}
