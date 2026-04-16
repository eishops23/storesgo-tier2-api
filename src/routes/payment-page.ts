import { FastifyPluginAsync } from "fastify";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const paymentPageRoute: FastifyPluginAsync = async (app) => {
  app.get("/mobile-payment", async (request, reply) => {
    const htmlPath = path.join(__dirname, "..", "..", "public", "mobile-payment.html");
    
    if (fs.existsSync(htmlPath)) {
      const html = fs.readFileSync(htmlPath, "utf-8");
      reply.type("text/html").send(html);
    } else {
      reply.status(404).send({ error: "Payment page not found" });
    }
  });
};

export default paymentPageRoute;
