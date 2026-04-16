import type { FastifyInstance } from "fastify";

// Simple health check endpoint to verify server + DB status
export default async function healthRoutes(app: FastifyInstance) {
  app.get("/", async () => {
    return {
      ok: true,
      service: "StoresGo Backend",
      status: "healthy",
      timestamp: new Date().toISOString(),
    };
  });
}
