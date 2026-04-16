import type { FastifyInstance } from "fastify";
import { requireAdmin } from "../../utils/requireAdmin.js";
import * as svc from "../../services/categoryAssignment.service.js";

export default async function categoryAssignmentRoutes(app: FastifyInstance) {
  app.get("/mapping-rules", { preHandler: requireAdmin }, async (req, reply) => {
    return reply.send({ ok: true, data: await svc.getMappingRules() });
  });

  app.post("/mapping-rules", { preHandler: requireAdmin }, async (req: any, reply) => {
    const { targetCategory, matchType, matchValue, priority } = req.body;
    if (!targetCategory || !matchType || !matchValue) return reply.status(400).send({ ok: false, error: "Missing fields" });
    const rule = await svc.createMappingRule({ targetCategory, matchType, matchValue, priority });
    return reply.status(201).send({ ok: true, data: rule });
  });

  app.patch("/mapping-rules/:id", { preHandler: requireAdmin }, async (req: any, reply) => {
    const rule = await svc.updateMappingRule(Number(req.params.id), req.body);
    return reply.send({ ok: true, data: rule });
  });

  app.delete("/mapping-rules/:id", { preHandler: requireAdmin }, async (req: any, reply) => {
    await svc.deleteMappingRule(Number(req.params.id));
    return reply.send({ ok: true });
  });

  app.post("/categorize", { preHandler: requireAdmin }, async (req: any, reply) => {
    const { productIds, limit, dryRun } = req.body || {};
    const stats = await svc.categorizeProducts({ productIds, limit: limit || 1000, dryRun: !!dryRun });
    return reply.send({ ok: true, data: stats });
  });

  app.get("/review-queue", { preHandler: requireAdmin }, async (req: any, reply) => {
    const result = await svc.getPendingReviews(Number(req.query.page) || 1, Number(req.query.pageSize) || 20);
    return reply.send({ ok: true, ...result });
  });

  app.post("/review/:id", { preHandler: requireAdmin }, async (req: any, reply) => {
    const { action } = req.body;
    const assignment = await svc.reviewAssignment(Number(req.params.id), action, req.admin?.id || 1);
    return reply.send({ ok: true, data: assignment });
  });

  app.post("/review-bulk", { preHandler: requireAdmin }, async (req: any, reply) => {
    const { ids, action } = req.body;
    const result = await svc.bulkReviewAssignments(ids, action, req.admin?.id || 1);
    return reply.send({ ok: true, updated: result.count });
  });

  app.get("/product/:productId/assignments", { preHandler: requireAdmin }, async (req: any, reply) => {
    const assignments = await svc.getProductAssignments(Number(req.params.productId));
    return reply.send({ ok: true, data: assignments });
  });

  app.put("/product/:productId/assignments", { preHandler: requireAdmin }, async (req: any, reply) => {
    const { categoryIds } = req.body;
    const assignments = await svc.manualAssign(Number(req.params.productId), categoryIds, req.admin?.id || 1);
    return reply.send({ ok: true, data: assignments });
  });

  app.get("/stats", { preHandler: requireAdmin }, async (req, reply) => {
    return reply.send({ ok: true, data: await svc.getAssignmentStats() });
  });

  app.get("/category-tree", { preHandler: requireAdmin }, async (req, reply) => {
    return reply.send({ ok: true, data: await svc.getCategoryTree() });
  });

  app.put("/category-reorder", { preHandler: requireAdmin }, async (req: any, reply) => {
    const tree = await svc.reorderCategories(req.body.updates);
    return reply.send({ ok: true, data: tree });
  });

  app.log.info("Category assignment routes registered");
}
