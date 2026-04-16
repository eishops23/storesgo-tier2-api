// ---------------------------------------------------------
// 🤖 AI SEO Internal Link Builder — Phase 9.6
// ---------------------------------------------------------
import { PrismaClient } from "@prisma/client";
import OpenAI from "openai";
const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function generateInternalLinks(batch = 10) {
  console.log("🔗 Starting AI Internal Link Builder...");

  // 1️⃣ Fetch SEO pages needing links
  const pages = await prisma.seoPage.findMany({
    take: batch,
    orderBy: { updatedAt: "desc" },
  });

  // 2️⃣ Fetch product & seller slugs
  const products = await prisma.product.findMany({ select: { slug: true, name: true } });
  const sellers  = await prisma.seller.findMany({ select: { slug: true, name: true } });

  const entities = [...products, ...sellers];

  for (const page of pages) {
    const prompt = `
You are an SEO strategist. Suggest 3 internal links for the page "${page.title}".
Link candidates: ${entities.map(e => e.name).join(", ")}.
Return a JSON array like:
[{"toSlug":"product-xyz","anchorText":"Buy XYZ now"}]
`;
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });

    try {
      const suggestions = JSON.parse(completion.choices[0].message.content);
      for (const s of suggestions) {
        await prisma.internalLink.upsert({
          where: { fromSlug_toSlug: { fromSlug: page.slug, toSlug: s.toSlug } },
          update: {},
          create: { fromSlug: page.slug, toSlug: s.toSlug, anchorText: s.anchorText },
        });
      }
      console.log(`✅ Linked ${page.slug} → ${suggestions.length} targets`);
    } catch (err) {
      console.error(`❌ Failed parsing links for ${page.slug}:`, err);
    }
  }
}
