// ---------------------------------------------------------
// 🤖 SEO Worker — AI Meta Generator
// ---------------------------------------------------------
import { Worker } from "bullmq";
import Redis from "ioredis";
import OpenAI from "openai";
import { PrismaClient, SeoEntityType } from "@prisma/client";

const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const connection = new Redis(process.env.REDIS_URL || "redis://127.0.0.1:6379");

new Worker(
  "seo-tasks",
  async (job) => {
    const { entityType, entityId } = job.data;
    console.log(`🧠 Processing SEO task: ${entityType} → ${entityId}`);

    const entity =
      entityType === "product"
        ? await prisma.product.findUnique({ where: { id: entityId } })
        : await prisma.seller.findUnique({ where: { id: entityId } });

    if (!entity) throw new Error(`Entity not found: ${entityType}#${entityId}`);

    const prompt = `
      Generate optimized SEO metadata for this ${entityType}:
      Name: ${entity.name}
      Description: ${entity.description || "No description provided."}
      Return JSON with: { metaTitle, metaDescription, keywords }
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });

    const text = completion.choices[0].message?.content || "{}";
    const data = JSON.parse(text);

    if (entityType === "product") {
      await prisma.product.update({
        where: { id: entityId },
        data: {
          metaTitle: data.metaTitle,
          metaDescription: data.metaDescription,
          metaKeywords: data.keywords,
          seoScore: 90,
        },
      });
    } else {
      await prisma.seller.update({
        where: { id: entityId },
        data: {
          metaTitle: data.metaTitle,
          metaDescription: data.metaDescription,
          metaKeywords: data.keywords,
          seoScore: 90,
        },
      });
    }

    await prisma.seoTask.update({
      where: { id: job.data.taskId },
      data: { status: "done", updatedAt: new Date() },
    });

    console.log(`✅ SEO updated for ${entityType}#${entityId}`);
  },
  { connection }
);

console.log("🚀 SEO Worker started — listening for jobs...");
