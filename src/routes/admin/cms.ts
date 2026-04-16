/**
 * CMS Admin Routes
 * CRUD endpoints for homepage blocks and footer content
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { requireAdmin } from "../../utils/requireAdmin.js";
import * as cmsService from "../../services/cms.service.js";

export default async function adminCmsRoutes(app: FastifyInstance) {
  // ==========================================================
  // 📦 CMS BLOCKS
  // ==========================================================

  /**
   * GET /api/admin/cms/blocks
   * List all CMS blocks
   */
  app.get(
    "/blocks",
    { preHandler: requireAdmin },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const query = request.query as { type?: string; isActive?: string };
      
      const blocks = await cmsService.getAllBlocks({
        type: query.type,
        isActive: query.isActive === "true" ? true : query.isActive === "false" ? false : undefined,
      });

      return reply.send({ ok: true, data: blocks });
    }
  );

  /**
   * GET /api/admin/cms/blocks/:id
   * Get a single CMS block
   */
  app.get(
    "/blocks/:id",
    { preHandler: requireAdmin },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const id = parseInt(request.params.id, 10);
      if (isNaN(id)) {
        return reply.status(400).send({ ok: false, error: "Invalid block ID" });
      }

      const block = await cmsService.getBlockById(id);
      if (!block) {
        return reply.status(404).send({ ok: false, error: "Block not found" });
      }

      return reply.send({ ok: true, data: block });
    }
  );

  /**
   * POST /api/admin/cms/blocks
   * Create a new CMS block
   */
  app.post(
    "/blocks",
    { preHandler: requireAdmin },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = request.body as cmsService.CmsBlockInput;

      if (!body.key || !body.name || !body.type) {
        return reply.status(400).send({
          ok: false,
          error: "key, name, and type are required",
        });
      }

      try {
        const block = await cmsService.createBlock(body);
        return reply.status(201).send({
          ok: true,
          data: block,
          message: "Block created successfully",
        });
      } catch (err: any) {
        if (err.code === "P2002") {
          return reply.status(400).send({
            ok: false,
            error: "A block with this key already exists",
          });
        }
        throw err;
      }
    }
  );

  /**
   * PATCH /api/admin/cms/blocks/:id
   * Update a CMS block
   */
  app.patch(
    "/blocks/:id",
    { preHandler: requireAdmin },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const id = parseInt(request.params.id, 10);
      if (isNaN(id)) {
        return reply.status(400).send({ ok: false, error: "Invalid block ID" });
      }

      const body = request.body as cmsService.CmsBlockUpdate;

      try {
        const block = await cmsService.updateBlock(id, body);
        return reply.send({
          ok: true,
          data: block,
          message: "Block updated successfully",
        });
      } catch (err: any) {
        if (err.code === "P2025") {
          return reply.status(404).send({ ok: false, error: "Block not found" });
        }
        throw err;
      }
    }
  );

  /**
   * DELETE /api/admin/cms/blocks/:id
   * Delete a CMS block
   */
  app.delete(
    "/blocks/:id",
    { preHandler: requireAdmin },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const id = parseInt(request.params.id, 10);
      if (isNaN(id)) {
        return reply.status(400).send({ ok: false, error: "Invalid block ID" });
      }

      try {
        await cmsService.deleteBlock(id);
        return reply.send({
          ok: true,
          message: "Block deleted successfully",
        });
      } catch (err: any) {
        if (err.code === "P2025") {
          return reply.status(404).send({ ok: false, error: "Block not found" });
        }
        throw err;
      }
    }
  );

  /**
   * POST /api/admin/cms/blocks/reorder
   * Reorder CMS blocks
   */
  app.post(
    "/blocks/reorder",
    { preHandler: requireAdmin },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = request.body as { orders: Array<{ id: number; order: number }> };

      if (!body.orders || !Array.isArray(body.orders)) {
        return reply.status(400).send({
          ok: false,
          error: "orders array is required",
        });
      }

      await cmsService.reorderBlocks(body.orders);
      return reply.send({
        ok: true,
        message: "Blocks reordered successfully",
      });
    }
  );

  // ==========================================================
  // 🦶 FOOTER LINKS
  // ==========================================================

  /**
   * GET /api/admin/cms/footer/links
   * List all footer links
   */
  app.get(
    "/footer/links",
    { preHandler: requireAdmin },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const query = request.query as { section?: string; isActive?: string };
      
      const links = await cmsService.getAllFooterLinks({
        section: query.section,
        isActive: query.isActive === "true" ? true : query.isActive === "false" ? false : undefined,
      });

      return reply.send({ ok: true, data: links });
    }
  );

  /**
   * GET /api/admin/cms/footer/links/:id
   * Get a single footer link
   */
  app.get(
    "/footer/links/:id",
    { preHandler: requireAdmin },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const id = parseInt(request.params.id, 10);
      if (isNaN(id)) {
        return reply.status(400).send({ ok: false, error: "Invalid link ID" });
      }

      const link = await cmsService.getFooterLinkById(id);
      if (!link) {
        return reply.status(404).send({ ok: false, error: "Link not found" });
      }

      return reply.send({ ok: true, data: link });
    }
  );

  /**
   * POST /api/admin/cms/footer/links
   * Create a footer link
   */
  app.post(
    "/footer/links",
    { preHandler: requireAdmin },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = request.body as cmsService.FooterLinkInput;

      if (!body.title || !body.url) {
        return reply.status(400).send({
          ok: false,
          error: "title and url are required",
        });
      }

      const link = await cmsService.createFooterLink(body);
      return reply.status(201).send({
        ok: true,
        data: link,
        message: "Footer link created successfully",
      });
    }
  );

  /**
   * PATCH /api/admin/cms/footer/links/:id
   * Update a footer link
   */
  app.patch(
    "/footer/links/:id",
    { preHandler: requireAdmin },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const id = parseInt(request.params.id, 10);
      if (isNaN(id)) {
        return reply.status(400).send({ ok: false, error: "Invalid link ID" });
      }

      const body = request.body as cmsService.FooterLinkUpdate;

      try {
        const link = await cmsService.updateFooterLink(id, body);
        return reply.send({
          ok: true,
          data: link,
          message: "Footer link updated successfully",
        });
      } catch (err: any) {
        if (err.code === "P2025") {
          return reply.status(404).send({ ok: false, error: "Link not found" });
        }
        throw err;
      }
    }
  );

  /**
   * DELETE /api/admin/cms/footer/links/:id
   * Delete a footer link
   */
  app.delete(
    "/footer/links/:id",
    { preHandler: requireAdmin },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const id = parseInt(request.params.id, 10);
      if (isNaN(id)) {
        return reply.status(400).send({ ok: false, error: "Invalid link ID" });
      }

      try {
        await cmsService.deleteFooterLink(id);
        return reply.send({
          ok: true,
          message: "Footer link deleted successfully",
        });
      } catch (err: any) {
        if (err.code === "P2025") {
          return reply.status(404).send({ ok: false, error: "Link not found" });
        }
        throw err;
      }
    }
  );

  // ==========================================================
  // 📄 FOOTER CONTENT
  // ==========================================================

  /**
   * GET /api/admin/cms/footer/content
   * List all footer content
   */
  app.get(
    "/footer/content",
    { preHandler: requireAdmin },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const content = await cmsService.getAllFooterContent();
      return reply.send({ ok: true, data: content });
    }
  );

  /**
   * GET /api/admin/cms/footer/content/:key
   * Get footer content by key
   */
  app.get(
    "/footer/content/:key",
    { preHandler: requireAdmin },
    async (request: FastifyRequest<{ Params: { key: string } }>, reply: FastifyReply) => {
      const content = await cmsService.getFooterContentByKey(request.params.key);
      if (!content) {
        return reply.status(404).send({ ok: false, error: "Content not found" });
      }

      return reply.send({ ok: true, data: content });
    }
  );

  /**
   * PUT /api/admin/cms/footer/content
   * Create or update footer content
   */
  app.put(
    "/footer/content",
    { preHandler: requireAdmin },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = request.body as cmsService.FooterContentInput;

      if (!body.key || !body.content) {
        return reply.status(400).send({
          ok: false,
          error: "key and content are required",
        });
      }

      const content = await cmsService.upsertFooterContent(body);
      return reply.send({
        ok: true,
        data: content,
        message: "Footer content saved successfully",
      });
    }
  );

  /**
   * DELETE /api/admin/cms/footer/content/:key
   * Delete footer content
   */
  app.delete(
    "/footer/content/:key",
    { preHandler: requireAdmin },
    async (request: FastifyRequest<{ Params: { key: string } }>, reply: FastifyReply) => {
      try {
        await cmsService.deleteFooterContent(request.params.key);
        return reply.send({
          ok: true,
          message: "Footer content deleted successfully",
        });
      } catch (err: any) {
        if (err.code === "P2025") {
          return reply.status(404).send({ ok: false, error: "Content not found" });
        }
        throw err;
      }
    }
  );

  app.log.info("📝 Admin CMS routes registered");
}

