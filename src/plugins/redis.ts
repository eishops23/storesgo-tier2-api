
import type { FastifyInstance } from "fastify";
import Redis from "ioredis";

declare module "fastify" {
  interface FastifyInstance {
    redis: Redis;
  }
}

export default async function registerRedis(app: FastifyInstance) {
  const url = process.env.REDIS_URL || "redis://localhost:6379";
  const client = new Redis(url);
  app.decorate("redis", client);

  app.addHook("onClose", async () => {
    await client.quit();
  });
}
