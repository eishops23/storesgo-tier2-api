import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { generateMasterSitemap, getSitemapStats } from "../services/sitemap.service.js";

export default async function sitemapRoutes(app: FastifyInstance) {
  
  // GET /sitemap.xml - Master sitemap
  app.get("/sitemap.xml", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const xml = await generateMasterSitemap();
      return reply
        .header("Content-Type", "application/xml")
        .header("Cache-Control", "public, max-age=3600") // Cache 1 hour
        .send(xml);
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send("Error generating sitemap");
    }
  });

  // GET /sitemap-stats - Stats about what's in the sitemap
  app.get("/sitemap-stats", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const stats = await getSitemapStats();
      return reply.send({ ok: true, data: stats });
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({ ok: false, error: "Failed to get stats" });
    }
  });

  app.log.info("🗺️ Sitemap routes registered");
}
