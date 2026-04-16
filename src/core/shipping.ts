/* eslint-disable */
import { FastifyInstance, FastifyPluginOptions } from "fastify";
import fp from "fastify-plugin";

async function shippingPlugin(app: FastifyInstance, _opts: FastifyPluginOptions) {
  app.get("/shipping/ping", async () => {
    return { ok: true, message: "shipping online" };
  });

  app.post("/shipping/calculate", async (request, reply) => {
    return { ok: true, message: "calculate working" };
  });
}

export default fp(shippingPlugin, { name: "shipping-routes" });
