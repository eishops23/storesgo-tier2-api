import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { generateSeoPageForProduct } from "../ai/seo.js"; // ⬅️ .js

const prisma = new PrismaClient();

async function loop() {
  const task = await prisma.seoTask.findFirst({
    where: { status: "pending", entityType: "product" },
    orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
  });
  if (task) await generateSeoPageForProduct(task.entityId);
  setTimeout(loop, 1500);
}
loop();
console.log("SEO worker polling…");

