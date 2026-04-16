import type { FastifyRequest, FastifyReply } from "fastify";
import * as dashboardService from "../services/adminDashboard.service.js";

export async function getDashboardSummary(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const data = await dashboardService.getDashboardSummary();
  return reply.send(data);
}
