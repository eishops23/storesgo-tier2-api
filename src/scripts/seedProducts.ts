/* eslint-disable */
// ==========================================================
// 🧠 StoresGo AI Product Seeder — Phase 13 (Stable Final)
// Multilingual Taxonomy + Product Embeddings (OpenAI + Prisma)
// Compatible with Prisma 6.18.x + PostgreSQL 18
// ==========================================================
import { PrismaClient } from "@prisma/client";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

async function main() {
  console.log("🌱 Starting multilingual AI seeding...\n");

  // --------------------------------------------------------
  // 1️⃣ Seed Taxonomy (Categories)
  // --------------------------------------------------------
  const categories = [
    { title: "Snacks", title_es: "Aperitivos", title_ht: "Goute" },
    { title: "Grains", title_es: "Granos", title_ht: "Grenn" },
    { title: "Beverages", title_es: "Bebidas", title_ht: "Bwason" },
    { title: "Produce", title_es: "Productos Frescos", title_ht: "Pwodwi Fre" },
  ];

  for (const cat of categories) {
    await prisma.taxonomy.upsert({
      where: { slug: cat.title.toLowerCase() },
      update: {},
      create: {
        slug: cat.title.toLowerCase().replace(/\s+/g, "-"),
        title: cat.title,
      },
    });
  }

  console.log(`✅ Seeded ${categories.length} base categories\n`);

  // --------------------------------------------------------
  // 2️⃣ Define multilingual sample products
  // --------------------------------------------------------
  const products = [
    {
      name: "Plantain Chips",
      description: "Crispy fried plantain chips lightly salted.",
      language: "en",
      category: "Snacks",
    },
    {
      name: "Chips de Plátano",
      description: "Crujientes chips de plátano ligeramente salados.",
      language: "es",
      category: "Snacks",
    },
    {
      name: "Bannann Fri",
      description: "Bannann fri sale ak gou natirèl.",
      language: "ht",
      category: "Snacks",
    },
    {
      name: "White Rice",
      description: "Premium long grain white rice for everyday meals.",
      language: "en",
      category: "Grains",
    },
    {
      name: "Arroz Blanco",
      description: "Arroz blanco de grano largo de calidad premium.",
      language: "es",
      category: "Grains",
    },
    {
      name: "Diri Blan",
      description: "Diri blan long grenn kalite siperyè.",
      language: "ht",
      category: "Grains",
    },
  ];

  // --------------------------------------------------------
  // 3️⃣ Generate embeddings + insert products
  // --------------------------------------------------------
  for (const p of products) {
    try {
      const cat = await prisma.taxonomy.findFirst({
        where: { title: p.category },
      });

      if (!cat) {
        console.warn(`⚠️ Skipping ${p.name}: Category not found (${p.category})`);
        continue;
      }

      const textToEmbed = `${p.name}. ${p.description}`;
      const embeddingResponse = await openai.embeddings.create({
        model: process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-large",
        input: textToEmbed,
      });

      const vector = embeddingResponse.data[0].embedding;

      await prisma.product.upsert({
        where: { sku: `${p.name.toLowerCase().replace(/\s+/g, "-")}-${p.language}` },
        update: {},
        create: {
          sellerId: 1, // optional: assign to demo seller if applicable
          name: p.name,
          description: p.description,
          categoryId: cat.id,
          isActive: true,
          status: "active",
          currency: "USD",
          priceCents: 599,
          metaTitle: p.name,
          metaDescription: p.description.slice(0, 150),
          embedding: vector,
        },
      });

      console.log(`✅ Inserted product: ${p.name} (${p.language})`);
    } catch (err: any) {
      console.error(`❌ Failed to insert ${p.name}:`, err.message);
    }
  }

  console.log("\n🎉 Multilingual AI seeding completed successfully!");
}

// --------------------------------------------------------
// 🚦 Execute
// --------------------------------------------------------
main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
