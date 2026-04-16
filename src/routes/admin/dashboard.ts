// ==========================================================
// STORESGO ADMIN DASHBOARD ROUTES — PHASE 7E
// Admin dashboard summary API endpoint
// ==========================================================

import type { FastifyInstance } from "fastify";
import { requireAdmin } from "../../utils/requireAdmin.js";
import * as dashboardController from "../../controllers/adminDashboard.controller.js";

export default async function adminDashboardRoutes(app: FastifyInstance) {
  // ---------------------------------------------------------
  // GET /api/admin/dashboard/summary
  // Returns high-level stats for the admin dashboard
  // ---------------------------------------------------------
  app.get(
    "/summary",
    { preHandler: requireAdmin },
    dashboardController.getDashboardSummary
  );

  app.log.info("📊 Admin dashboard routes registered");
}

