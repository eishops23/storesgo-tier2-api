"use strict";
/* eslint-disable */
// ==========================================================
// 🧠 StoresGo AI Embeddings — Phase 15A (Smart Search Core)
// PostgreSQL + pgvector • OpenAI text-embedding-3-small
// Generates & compares semantic product embeddings
// ==========================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.embed = embed;
exports.cosine = cosine;
exports.updateProductEmbeddingsBatch = updateProductEmbeddingsBatch;
exports.searchProductsByEmbedding = searchProductsByEmbedding;
const client_1 = require("@prisma/client");
const openai_1 = __importDefault(require("openai"));
const prisma = new client_1.PrismaClient();
const openai = new openai_1.default({ apiKey: process.env.OPENAI_API_KEY });
// ----------------------------------------------------------
// 🧩 Core Embed Function
// ----------------------------------------------------------
async function embed(text) {
    const res = await openai.embeddings.create({
        model: process.env.AI_EMBED_MODEL || "text-embedding-3-small",
        input: text,
    });
    return res.data[0].embedding;
}
// ----------------------------------------------------------
// 🧮 Cosine Similarity Helper
// ----------------------------------------------------------
function cosine(a, b) {
    let dot = 0, na = 0, nb = 0;
    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        na += a[i] * a[i];
        nb += b[i] * b[i];
    }
    return dot / (Math.sqrt(na) * Math.sqrt(nb));
}
// ----------------------------------------------------------
// 🧠 Update Product Embeddings (Batch or Single)
// ----------------------------------------------------------
async function updateProductEmbeddingsBatch(batchSize = 25) {
    const products = await prisma.product.findMany({
        where: { isActive: true },
        select: { id: true, name: true, description: true },
        take: batchSize,
    });
    if (products.length === 0) {
        console.log("⚠️ No products found for embedding update.");
        return;
    }
    console.log(`🧩 Generating embeddings for ${products.length} products...`);
    for (const p of products) {
        const text = `${p.name ?? ""} ${p.description ?? ""}`.trim();
        if (!text)
            continue;
        try {
            const vector = await embed(text);
            await prisma.productEmbedding.upsert({
                where: { productId: p.id },
                update: { vector },
                create: { productId: p.id, vector },
            });
            console.log(`✅ Embedded product #${p.id}: ${p.name}`);
        }
        catch (err) {
            console.error(`❌ Embedding failed for product #${p.id}:`, err.message);
        }
    }
    console.log(`🎯 Completed embedding batch of ${products.length} products.`);
    return { embedded: products.length };
}
// ----------------------------------------------------------
// 🔍 Semantic Search by Vector Similarity
// ----------------------------------------------------------
async function searchProductsByEmbedding(query, limit = 10) {
    const queryVector = await embed(query);
    // Requires pgvector extension
    const products = await prisma.$queryRawUnsafe(`
    SELECT p.id, p.name, p.price, p.image, 1 - (pe.vector <=> cube(array[${queryVector.join(",")}])) AS similarity
    FROM "Product" p
    JOIN "ProductEmbedding" pe ON pe."productId" = p.id
    WHERE p."isActive" = true
    ORDER BY similarity DESC
    LIMIT ${limit};
  `);
    return products;
}
