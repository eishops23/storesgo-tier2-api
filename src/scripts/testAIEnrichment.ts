// ==========================================================
// 🤖 AI ENRICHMENT TEST SCRIPT — PHASE 12
// Test script to verify AI connection and enrichment flow
// Run with: npx tsx src/scripts/testAIEnrichment.ts
// ==========================================================

import OpenAI from "openai";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testAIConnection() {
  console.log("🧪 Testing AI Connection...\n");
  
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    console.error("❌ OPENAI_API_KEY not set in environment variables");
    return false;
  }
  
  console.log("✅ OPENAI_API_KEY is configured");
  
  try {
    const openai = new OpenAI({ apiKey });
    
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      max_tokens: 20,
      messages: [{ role: "user", content: "Say 'AI connection successful' in 5 words or less" }],
    });
    
    const response = completion.choices[0]?.message?.content || "";
    console.log(`✅ AI Response: "${response}"`);
    console.log(`✅ Model used: ${completion.model}`);
    console.log(`✅ Tokens used: ${completion.usage?.total_tokens}`);
    
    return true;
  } catch (error: any) {
    console.error("❌ AI connection failed:", error.message);
    return false;
  }
}

async function testDatabaseSchema() {
  console.log("\n🧪 Testing Database Schema...\n");
  
  try {
    // Check if AI enrichment fields exist in the database
    const product = await prisma.product.findFirst({
      select: {
        id: true,
        name: true,
        aiDescription: true,
        aiTags: true,
        aiSeoKeywords: true,
        aiBulletPoints: true,
        aiTargetAudience: true,
        aiEnrichmentStatus: true,
        aiEnrichedAt: true,
      },
    });
    
    if (product) {
      console.log("✅ AI enrichment fields exist in Product model");
      console.log(`   Sample product: ${product.name} (ID: ${product.id})`);
      console.log(`   AI Status: ${product.aiEnrichmentStatus || "not enriched"}`);
    } else {
      console.log("⚠️  No products found in database");
    }
    
    // Check AIEnrichmentLog model
    const logCount = await prisma.aIEnrichmentLog.count();
    console.log(`✅ AIEnrichmentLog model exists (${logCount} records)`);
    
    return true;
  } catch (error: any) {
    console.error("❌ Database schema test failed:", error.message);
    return false;
  }
}

async function testSampleEnrichment() {
  console.log("\n🧪 Testing Sample Product Enrichment...\n");
  
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
    
    // Get a sample product
    const product = await prisma.product.findFirst({
      where: { isActive: true },
      include: {
        category: { select: { name: true } },
        seller: { select: { storeName: true } },
      },
    });
    
    if (!product) {
      console.log("⚠️  No active products found for testing");
      return false;
    }
    
    console.log(`📦 Testing with product: ${product.name} (ID: ${product.id})`);
    console.log(`   Category: ${product.category?.name || "Uncategorized"}`);
    console.log(`   Seller: ${product.seller?.storeName || "Unknown"}`);
    
    // Generate a test description
    const prompt = `Generate a brief, compelling product description (2-3 sentences) for:
Product: ${product.name}
Category: ${product.category?.name || "General"}
Description: ${product.description || "No description available"}`;
    
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      max_tokens: 200,
      temperature: 0.7,
      messages: [{ role: "user", content: prompt }],
    });
    
    const aiDescription = completion.choices[0]?.message?.content?.trim() || "";
    
    console.log("\n✅ AI Generated Description:");
    console.log(`"${aiDescription}"`);
    console.log(`\n   Tokens used: ${completion.usage?.total_tokens}`);
    
    // Save the enrichment (optional - comment out if you don't want to modify data)
    // await prisma.product.update({
    //   where: { id: product.id },
    //   data: {
    //     aiDescription,
    //     aiEnrichedAt: new Date(),
    //     aiEnrichmentStatus: "completed",
    //   },
    // });
    // console.log("✅ Enrichment saved to database");
    
    return true;
  } catch (error: any) {
    console.error("❌ Sample enrichment test failed:", error.message);
    return false;
  }
}

async function main() {
  console.log("═".repeat(60));
  console.log("🤖 STORESGO AI ENRICHMENT ENGINE - PHASE 12 TEST");
  console.log("═".repeat(60));
  
  const results = {
    aiConnection: await testAIConnection(),
    databaseSchema: await testDatabaseSchema(),
    sampleEnrichment: await testSampleEnrichment(),
  };
  
  console.log("\n" + "═".repeat(60));
  console.log("📊 TEST RESULTS SUMMARY");
  console.log("═".repeat(60));
  console.log(`AI Connection:     ${results.aiConnection ? "✅ PASS" : "❌ FAIL"}`);
  console.log(`Database Schema:   ${results.databaseSchema ? "✅ PASS" : "❌ FAIL"}`);
  console.log(`Sample Enrichment: ${results.sampleEnrichment ? "✅ PASS" : "❌ FAIL"}`);
  console.log("═".repeat(60));
  
  const allPassed = Object.values(results).every(Boolean);
  if (allPassed) {
    console.log("\n🎉 All tests passed! AI Enrichment Engine is ready.");
  } else {
    console.log("\n⚠️  Some tests failed. Please check the errors above.");
  }
  
  await prisma.$disconnect();
  process.exit(allPassed ? 0 : 1);
}

main().catch(async (error) => {
  console.error("Fatal error:", error);
  await prisma.$disconnect();
  process.exit(1);
});

