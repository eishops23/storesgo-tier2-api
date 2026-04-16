import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { authenticateSeller } from "../../middleware/authSeller.js";
import * as svc from "../../services/sellerDashboard.service.js";

export default async function sellerDashboardRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authenticateSeller);

  app.get("/", async (request: FastifyRequest, reply: FastifyReply) => {
    const sellerId = (request as any).seller?.id;
    if (!sellerId) return reply.code(403).send({ ok: false, error: "Seller ID not found" });
    try {
      return reply.send(await svc.getSellerDashboardSummary(sellerId));
    } catch (err: any) {
      app.log.error({ err }, "Failed to load seller dashboard");
      return reply.code(500).send({ ok: false, error: "Failed to load dashboard" });
    }
  });

  app.get("/orders", async (request: FastifyRequest, reply: FastifyReply) => {
    const sellerId = (request as any).seller?.id;
    if (!sellerId) return reply.code(403).send({ ok: false, error: "Seller ID not found" });
    const q = request.query as any;
    return reply.send(await svc.getSellerOrders(sellerId, Number(q.page) || 1, Number(q.pageSize) || 20, q.status));
  });

  app.get("/analytics", async (request: FastifyRequest, reply: FastifyReply) => {
    const sellerId = (request as any).seller?.id;
    if (!sellerId) return reply.code(403).send({ ok: false, error: "Seller ID not found" });
    const q = request.query as any;
    return reply.send(await svc.getSellerAnalytics(sellerId, Number(q.days) || 30));
  });

  app.get("/payouts", async (request: FastifyRequest, reply: FastifyReply) => {
    const sellerId = (request as any).seller?.id;
    if (!sellerId) return reply.code(403).send({ ok: false, error: "Seller ID not found" });
    const q = request.query as any;
    return reply.send(await svc.getSellerPayouts(sellerId, Number(q.page) || 1, Number(q.pageSize) || 20));
  });

  app.log.info("📊 Seller dashboard routes registered");
}
