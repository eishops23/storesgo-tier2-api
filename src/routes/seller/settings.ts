import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { authenticateSeller } from "../../middleware/authSeller.js";
import { prisma } from "../../lib/prisma.js";

export default async function sellerSettingsRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authenticateSeller);

  app.get("/", async (request: FastifyRequest, reply: FastifyReply) => {
    const sellerId = (request as any).seller?.id;
    if (!sellerId) return reply.code(403).send({ ok: false, error: "Seller ID not found" });
    try {
      const seller = await prisma.seller.findUnique({
        where: { id: sellerId },
        select: { id: true, storeName: true, slug: true, street: true, city: true, state: true, zipCode: true, country: true, about: true, user: { select: { email: true } } }
      });
      if (!seller) return reply.code(404).send({ ok: false, error: "Seller not found" });
      return reply.send({ ok: true, seller: { ...seller, email: seller.user?.email || "" } });
    } catch (err: any) {
      return reply.code(500).send({ ok: false, error: "Failed to load settings" });
    }
  });

  app.put("/", async (request: FastifyRequest, reply: FastifyReply) => {
    const sellerId = (request as any).seller?.id;
    if (!sellerId) return reply.code(403).send({ ok: false, error: "Seller ID not found" });
    const body = request.body as any;
    try {
      const seller = await prisma.seller.update({
        where: { id: sellerId },
        data: { storeName: body.storeName, slug: body.slug, street: body.street, city: body.city, state: body.state, zipCode: body.zipCode, about: body.about }
      });
      return reply.send({ ok: true, seller });
    } catch (err: any) {
      return reply.code(500).send({ ok: false, error: "Failed to save settings" });
    }
  });
}
