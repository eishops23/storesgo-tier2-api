/**
 * Public CMS Routes
 * Read-only endpoints for homepage blocks and footer content
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import * as cmsService from "../../services/cms.service.js";

export default async function cmsRoutes(app: FastifyInstance) {
  /**
   * GET /api/cms/homepage
   * Get all homepage CMS content
   */
  app.get(
    "/homepage",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const content = await cmsService.getHomepageCmsContent();
      return reply.send({ ok: true, data: content });
    }
  );

  /**
   * GET /api/cms/blocks
   * Get active CMS blocks
   */
  app.get(
    "/blocks",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const query = request.query as { type?: string; keys?: string };
      
      const blocks = await cmsService.getActiveBlocks({
        type: query.type,
        keys: query.keys?.split(",").map(k => k.trim()),
      });

      return reply.send({ ok: true, data: blocks });
    }
  );

  /**
   * GET /api/cms/blocks/:key
   * Get a specific CMS block by key
   */
  app.get(
    "/blocks/:key",
    async (request: FastifyRequest<{ Params: { key: string } }>, reply: FastifyReply) => {
      const block = await cmsService.getBlockByKey(request.params.key);
      
      if (!block || !block.isActive) {
        return reply.status(404).send({ ok: false, error: "Block not found" });
      }

      // Check scheduling
      const now = new Date();
      if (block.startDate && block.startDate > now) {
        return reply.status(404).send({ ok: false, error: "Block not found" });
      }
      if (block.endDate && block.endDate < now) {
        return reply.status(404).send({ ok: false, error: "Block not found" });
      }

      return reply.send({ ok: true, data: block });
    }
  );

  /**
   * GET /api/cms/footer
   * Get all footer data (links and content)
   */
  app.get(
    "/footer",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const footer = await cmsService.getFooterData();
      return reply.send({ ok: true, data: footer });
    }
  );

  /**
   * GET /api/cms/footer/links
   * Get active footer links grouped by section
   */
  app.get(
    "/footer/links",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const links = await cmsService.getActiveFooterLinks();
      return reply.send({ ok: true, data: links });
    }
  );

  /**
   * GET /api/cms/footer/content
   * Get active footer content as key-value map
   */
  app.get(
    "/footer/content",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const content = await cmsService.getActiveFooterContent();
      return reply.send({ ok: true, data: content });
    }
  );

  app.log.info("📝 Public CMS routes registered");
}

