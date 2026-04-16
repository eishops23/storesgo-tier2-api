
// src/plugins/websocket.ts
// ------------------------------------------------------
// 🔌 Fastify WebSocket Hub (broadcast SEO task events)
// ------------------------------------------------------
import fp from "fastify-plugin";
import websocket from "@fastify/websocket";
import type { FastifyInstance } from "fastify";

declare module "fastify" {
  interface FastifyInstance {
    wsClients: Set<any>;
    wsBroadcast: (event: string, payload?: any) => void;
  }
}

export default fp(async function registerWS(app: FastifyInstance) {
  await app.register(websocket);

  const clients = new Set<any>();
  app.decorate("wsClients", clients);

  app.decorate("wsBroadcast", (event: string, payload?: any) => {
    const msg = JSON.stringify({ type: event, payload });
    for (const client of clients) {
      try {
        client.socket.send(msg);
      } catch {}
    }
  });

  app.get("/ws", { websocket: true }, (conn) => {
    clients.add(conn);
    conn.socket.on("close", () => clients.delete(conn));
  });

  app.log.info("🔌 WebSocket hub ready at /ws");
});
