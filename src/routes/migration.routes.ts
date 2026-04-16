import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../plugins/prisma.js";

interface Log404Body {
  path: string;
  userAgent?: string;
  referer?: string;
}

export default async function migrationRoutes(app: FastifyInstance) {
  
  /**
   * POST /api/migration/log-404
   * Log 404 errors for analysis
   */
  app.post("/log-404", async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as Log404Body;
    
    if (!body.path) {
      return reply.status(400).send({ ok: false, error: "Path required" });
    }
    
    // Log to console (can be captured by PM2 logs)
    console.log(JSON.stringify({
      event: "404_error",
      timestamp: new Date().toISOString(),
      path: body.path,
      userAgent: body.userAgent,
      referer: body.referer,
    }));
    
    // Optionally store in database for analysis
    // await prisma.migrationLog.create({ data: { ... } });
    
    return reply.send({ ok: true });
  });

  /**
   * GET /api/migration/health
   * Check if migration routes are active
   */
  app.get("/health", async (request: FastifyRequest, reply: FastifyReply) => {
    return reply.send({
      ok: true,
      message: "Migration routes active",
      timestamp: new Date().toISOString(),
    });
  });

  app.log.info("🔄 Migration routes registered at /api/migration");
}
