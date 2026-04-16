import { GoogleGenerativeAI } from "@google/generative-ai";
import slugify from "slugify";
import { prisma } from "../lib/prisma.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const gemini = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

const DEFAULT_CLUSTERS = [
  "Caribbean groceries", "Latin snacks", "Asian sauces",
  "Fragrance body oils", "Ethnic beverages", "Baking essentials"
];

export async function autoBlogOnce() {
  const langs = (process.env.BLOG_LANGS ?? "en").split(",").map(s => s.trim());
  const topic = DEFAULT_CLUSTERS[Math.floor(Math.random() * DEFAULT_CLUSTERS.length)];

  const titleResult = await gemini.generateContent(`Create a concise, catchy blog title (<=65 chars) about: ${topic}`);
  const title = titleResult.response.text().trim() || topic;
  const slug = slugify(title, { lower: true, strict: true });

  for (const lang of langs) {
    const contentResult = await gemini.generateContent(
      `Write a 800-1000 word ecommerce blog post in ${lang} about "${title}" with h2/h3 headings, internal links placeholders [[/category/xxx]], and a short intro + conclusion.`
    );
    const html = contentResult.response.text() || "";
    await prisma.blogPost.upsert({
      where: { slug_language: { slug, language: lang } as any },
      update: { title, contentHtml: html, published: true, source: "autoblog" },
      create: { title, slug: lang === "en" ? slug : `${slug}-${lang}`, contentHtml: html, published: true, source: "autoblog", language: lang },
    });
  }
  return { ok: true, slug };
}
