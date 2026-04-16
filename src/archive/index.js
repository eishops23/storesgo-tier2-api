import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { apiRoutes } from "./routes/api.js";
import { accountRoutes } from "./routes/account.js";
import { sellerRoutes } from "./routes/seller.js";

const app = Fastify({ logger: true });
await app.register(cors, { origin: "*" });

await app.register(apiRoutes);
await app.register(accountRoutes);
await app.register(sellerRoutes);

app.get("/api/health", async () => ({ ok: true }));

const port = process.env.PORT ? Number(process.env.PORT) : 5000;
const host = process.env.HOST || "0.0.0.0";
app.listen({ port, host }).then(() => {
  console.log(`✅ StoresGo API running on http://${host}:${port}`);
}).catch((e)=>{
  console.error("Failed to start", e);
  process.exit(1);
});
