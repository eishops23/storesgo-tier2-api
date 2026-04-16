// ==========================================================
// STORESGO ADMIN ROUTES — PHASE 7
// Admin authentication and management API endpoints
// ==========================================================

import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { buildPaginatedResponse } from "../../utils/pagination.js";
import * as adminService from "../../services/admin.service.js";

// ⭐ Admin Auth Routes (Phase 7A)
import adminAuthRoutes from "./auth.js";

// ⭐ Admin Products Routes (Phase 7B)
import adminProductsRoutes from "./products.js";

// ⭐ Admin Sellers Routes (Phase 7C)
import adminSellersRoutes from "./sellers.js";

// ⭐ Admin Categories Routes (Phase 7D)
import adminCategoriesRoutes from "./categories.js";

// ⭐ Admin SEO Routes (Phase 7D)
import adminSeoRoutes from "./seo.js";

// 🤖 Admin Agent — SEO Routes (Phase 9 Prompt 4)
import adminAgentSeoRoutes from "./agent-seo.js";

// 🤖 Admin Agent — Merchandising Routes (Phase 12 Prompt 2)
import adminAgentMerchandisingRoutes from "./agent-merchandising.js";

// ⭐ Admin Dashboard Routes (Phase 7E)
import adminDashboardRoutes from "./dashboard.js";

// ⭐ Admin AI Enrichment Routes (Phase 12)
import adminAIRoutes from "./ai.js";

// 📝 Admin Blog Routes (Phase 16)
import adminBlogRoutes from "./blog.js";

// 📤 Admin Bulk Upload Routes
import adminBulkUploadRoutes from "./bulkUpload.js";

// 📝 Admin CMS Routes
import adminCmsRoutes from "./cms.js";

// 📄 Admin Homepage Routes (Phase 18)
import adminHomepageRoutes from "./homepage.js";
// 🤖 Admin AI Categorization Routes
import aiCategorizationRoutes from "./aiCategorization.js";
import categoryAssignmentRoutes from "./categoryAssignment.js";
import adminFilterRoutes from "./filters.js";

export default async function adminRoutes(app: FastifyInstance) {
  // ---------------------------------------------------------
  // AUTH ROUTES (separate module — Phase 7A)
  // ---------------------------------------------------------
  await app.register(adminAuthRoutes, { prefix: "/auth" });

  // ---------------------------------------------------------
  // PRODUCTS ROUTES (separate module — Phase 7B)
  // ---------------------------------------------------------
  await app.register(adminProductsRoutes, { prefix: "/products" });

  // ---------------------------------------------------------
  // SELLERS ROUTES (separate module — Phase 7C)
  // ---------------------------------------------------------
  await app.register(adminSellersRoutes, { prefix: "/sellers" });

  // ---------------------------------------------------------
  // CATEGORIES ROUTES (separate module — Phase 7D)
  // ---------------------------------------------------------
  await app.register(adminCategoriesRoutes, { prefix: "/categories" });

  // ---------------------------------------------------------
  // SEO ROUTES (separate module — Phase 7D)
  // ---------------------------------------------------------
  await app.register(adminSeoRoutes, { prefix: "/seo" });

  // ---------------------------------------------------------
  // AGENT — SEO ROUTES (Phase 9 Prompt 4)
  // Operator-facing AI agent for SEO audits, content gap
  // analysis, and blog post outline drafting. Gated by
  // requireAdmin and isFeatureAllowed('seo'). Mounts at
  // POST /api/admin/agent/seo.
  // ---------------------------------------------------------
  await app.register(adminAgentSeoRoutes, { prefix: "/agent/seo" });

  // ---------------------------------------------------------
  // AGENT — MERCHANDISING ROUTES (Phase 12 Prompt 2)
  // Operator-facing AI agent for homepage merchandising audits,
  // featured-slot performance, and CMS block scheduling review.
  // Gated by requireAdmin and isFeatureAllowed('merchandising').
  // Read-only by design — the agent proposes changes the operator
  // applies manually in the admin UI. Mounts at
  // POST /api/admin/agent/merchandising.
  // ---------------------------------------------------------
  await app.register(adminAgentMerchandisingRoutes, { prefix: "/agent/merchandising" });

  // ---------------------------------------------------------
  // DASHBOARD ROUTES (separate module — Phase 7E)
  // ---------------------------------------------------------
  await app.register(adminDashboardRoutes, { prefix: "/dashboard" });

  // ---------------------------------------------------------
  // AI ENRICHMENT ROUTES (separate module — Phase 12)
  // ---------------------------------------------------------
  await app.register(adminAIRoutes, { prefix: "/ai" });
  // ⭐ Admin Customers

  // ---------------------------------------------------------
  // BLOG ROUTES (separate module — Phase 16)
  // ---------------------------------------------------------
  await app.register(adminBlogRoutes, { prefix: "/blog" });

  // ---------------------------------------------------------
  // BULK UPLOAD ROUTES
  // ---------------------------------------------------------
  await app.register(adminBulkUploadRoutes, { prefix: "/" });

  // ---------------------------------------------------------
  // CMS ROUTES (homepage blocks, footer content)
  // ---------------------------------------------------------
  await app.register(adminCmsRoutes, { prefix: "/cms" });

  // ---------------------------------------------------------
  // HOMEPAGE ROUTES (Phase 18 - homepage config)
  // ---------------------------------------------------------
  await app.register(adminHomepageRoutes, { prefix: "/homepage" });
  await app.register(aiCategorizationRoutes, { prefix: "" });
  await app.register(categoryAssignmentRoutes, { prefix: "/assignments" });

  // 🎛️ Admin Filter Config Routes
  await app.register(adminFilterRoutes, { prefix: "/filters" });

  // ---------------------------------------------------------
  // LEGACY DASHBOARD ROUTES (backward compatibility)
  // ---------------------------------------------------------

  /**
   * GET /api/admin/dashboard
   * Get comprehensive admin dashboard stats
   */
  app.get(
    "/dashboard",
    { preHandler: app.authenticateAdmin },
    async (_request: FastifyRequest, reply: FastifyReply) => {
      const stats = await adminService.getDashboardStats();
      return reply.send({ ok: true, data: stats });
    }
  );

  /**
   * GET /api/admin/stats
   * Alias for dashboard (backward compatibility)
   */
  app.get(
    "/stats",
    { preHandler: app.authenticateAdmin },
    async (_request: FastifyRequest, reply: FastifyReply) => {
      const stats = await adminService.getDashboardStats();
      return reply.send({ ok: true, data: stats });
    }
  );

  // ---------------------------------------------------------
  // PRODUCT MANAGEMENT — Now handled by Phase 7B module
  // Routes moved to ./products.ts (registered above with prefix /products)
  // ---------------------------------------------------------

  // ---------------------------------------------------------
  // SELLER MANAGEMENT — Now handled by Phase 7C module
  // Routes moved to ./sellers.ts (registered above with prefix /sellers)
  // ---------------------------------------------------------

  // ---------------------------------------------------------
  // CATEGORY MANAGEMENT — Moved to Phase 7D module
  // Routes now at /api/admin/categories (see ./categories.ts)
  // ---------------------------------------------------------

  // ---------------------------------------------------------
  // SEO PAGE MANAGEMENT — Moved to Phase 7D module
  // Routes now at /api/admin/seo (see ./seo.ts)
  // ---------------------------------------------------------

  // ---------------------------------------------------------
  // ORDER MANAGEMENT
  // ---------------------------------------------------------

  /**
   * GET /api/admin/orders
   * List all orders with filters
   */
  app.get(
    "/orders",
    { preHandler: app.authenticateAdmin },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const result = await adminService.listOrdersAdmin(request.query as any);
      return reply.send(
        buildPaginatedResponse(result.items, result.page, result.pageSize, result.total)
      );
    }
  );

  /**
   * GET /api/admin/orders/:id
   * Get order details
   */
  app.get(
    "/orders/:id",
    { preHandler: app.authenticateAdmin },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string };
      const order = await adminService.getOrderAdmin(Number(id));

      if (!order) {
        return reply.status(404).send({ ok: false, error: "Order not found" });
      }

      return reply.send({ ok: true, data: order });
    }
  );

  /**
   * PUT /api/admin/orders/:id/status
   * Update order status
   */
  app.put(
    "/orders/:id/status",
    { preHandler: app.authenticateAdmin },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string };
      const { status } = request.body as { status?: string };

      if (!status) {
        return reply.status(400).send({ ok: false, error: "Status is required" });
      }

      try {
        const order = await adminService.updateOrderStatus(Number(id), status);
        return reply.send({ ok: true, data: order, message: `Order status updated to ${status}` });
      } catch (err) {
        return reply.status(400).send({ ok: false, error: "Failed to update order status" });
      }
    }
  );

  app.log.info("📄 Admin routes registered");

/**
   * GET /api/admin/orders/:id/invoice
   * Generate PDF invoice for order (with product images)
   */
  app.get(
    "/orders/:id/invoice",
    { preHandler: app.authenticateAdmin },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string };
      try {
        const order = await adminService.getOrderAdmin(Number(id));
        if (!order) {
          return reply.status(404).send({ ok: false, error: "Order not found" });
        }

        const PDFDocument = (await import("pdfkit")).default;
        const doc = new PDFDocument({ margin: 50 });

        reply.header("Content-Type", "application/pdf");
        reply.header("Content-Disposition", `attachment; filename="invoice-${order.id}.pdf"`);

        doc.pipe(reply.raw);

        // Helper to fetch image as buffer
        const fetchImageBuffer = async (url: string): Promise<Buffer | null> => {
          try {
            const response = await fetch(url);
            if (!response.ok) return null;
            const arrayBuffer = await response.arrayBuffer();
            return Buffer.from(arrayBuffer);
          } catch {
            return null;
          }
        };

        // Pre-fetch all product images
        const imageBuffers: Map<number, Buffer | null> = new Map();
        for (const item of order.orderItems || []) {
          if (item.product?.imageUrl) {
            const buffer = await fetchImageBuffer(item.product.imageUrl);
            imageBuffers.set(item.productId, buffer);
          }
        }

        // Header
        doc.fontSize(24).fillColor("#10B981").text("StoresGo", 50, 50);
        doc.fontSize(10).fillColor("#666").text("Ethnic Grocery Marketplace", 50, 78);

        // Invoice title
        doc.fontSize(20).fillColor("#000").text("INVOICE", 400, 50, { align: "right" });
        doc.fontSize(10).fillColor("#666").text(`#${order.id}`, 400, 75, { align: "right" });
        doc.text(new Date(order.createdAt).toLocaleDateString(), 400, 90, { align: "right" });

        // Customer info
        doc.fontSize(12).fillColor("#000").text("Bill To:", 50, 130);
        const customerName = order.buyer?.buyerProfile?.firstName
          ? `${order.buyer.buyerProfile.firstName} ${order.buyer.buyerProfile.lastName || ""}`.trim()
          : (order.shippingName && order.shippingName !== "New Address")
            ? order.shippingName
            : order.buyer?.email?.split("@")[0] || "Customer";
        doc.fontSize(11).fillColor("#333").text(customerName, 50, 148);
        doc.text(order.buyer?.email || "", 50, 163);
        if (order.shippingStreet) doc.text(order.shippingStreet, 50, 178);
        if (order.shippingCity) doc.text(`${order.shippingCity}, ${order.shippingState || ""} ${order.shippingZip || ""}`, 50, 193);
        if (order.shippingPhone) doc.text(order.shippingPhone, 50, 208);

        // Seller info
        doc.fontSize(12).fillColor("#000").text("Seller:", 300, 130);
        doc.fontSize(11).fillColor("#333").text(order.seller?.storeName || "StoresGo Seller", 300, 148);

        // Items table header
        const tableTop = 240;
        doc.fontSize(10).fillColor("#666");
        doc.text("Image", 50, tableTop);
        doc.text("Item", 100, tableTop);
        doc.text("Qty", 340, tableTop);
        doc.text("Price", 390, tableTop);
        doc.text("Total", 460, tableTop, { align: "right" });
        doc.moveTo(50, tableTop + 15).lineTo(545, tableTop + 15).stroke("#ddd");

        // Items with images
        let y = tableTop + 25;
        const imgSize = 40;
        const rowHeight = 50;

        for (const item of order.orderItems || []) {
          // Draw product image
          const imgBuffer = imageBuffers.get(item.productId);
          if (imgBuffer) {
            try {
              doc.image(imgBuffer, 50, y, { width: imgSize, height: imgSize, fit: [imgSize, imgSize] });
            } catch {
              doc.rect(50, y, imgSize, imgSize).stroke("#ddd");
              doc.fontSize(6).fillColor("#999").text("No img", 52, y + 16);
            }
          } else {
            doc.rect(50, y, imgSize, imgSize).stroke("#ddd");
            doc.fontSize(6).fillColor("#999").text("No img", 52, y + 16);
          }

          // Item details
          const itemName = item.product?.name || `Product #${item.productId}`;
          const truncatedName = itemName.length > 35 ? itemName.substring(0, 35) + "..." : itemName;
          doc.fontSize(10).fillColor("#333");
          doc.text(truncatedName, 100, y + 12, { width: 230 });
          doc.text(String(item.quantity), 340, y + 12);
          doc.text(`$${(item.priceCents / 100).toFixed(2)}`, 390, y + 12);
          doc.text(`$${((item.priceCents * item.quantity) / 100).toFixed(2)}`, 460, y + 12, { align: "right" });

          y += rowHeight;

          if (y > 650) {
            doc.addPage();
            y = 50;
          }
        }

        // Totals
        y += 20;
        doc.moveTo(350, y).lineTo(545, y).stroke("#ddd");
        y += 10;

        if (order.shippingPriceCents) {
          doc.fontSize(10).fillColor("#333").font("Helvetica");
          doc.text("Shipping:", 350, y);
          doc.text(`$${(order.shippingPriceCents / 100).toFixed(2)}`, 460, y, { align: "right" });
          y += 18;
        }
        if (order.taxCents) {
          doc.fontSize(10).fillColor("#333").font("Helvetica");
          doc.text("Tax:", 350, y);
          doc.text(`$${(order.taxCents / 100).toFixed(2)}`, 460, y, { align: "right" });
          y += 18;
        }
        doc.fontSize(12).fillColor("#10B981").font("Helvetica-Bold");
        doc.text("Total:", 350, y);
        doc.text(`$${(order.totalAmountCents / 100).toFixed(2)}`, 460, y, { align: "right" });

        // Footer
        const footerY = Math.max(y + 50, 700);
        doc.fontSize(9).fillColor("#999").font("Helvetica");
        doc.text("Thank you for shopping with StoresGo!", 50, footerY, { align: "center", width: 495 });
        doc.text("Questions? Contact support@storesgo.com", 50, footerY + 15, { align: "center", width: 495 });

        doc.end();
        return reply;
      } catch (err) {
        console.error("Invoice generation error:", err);
        return reply.status(500).send({ ok: false, error: "Failed to generate invoice" });
      }
    }
  );
}
