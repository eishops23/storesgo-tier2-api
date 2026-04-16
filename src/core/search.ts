/* eslint-disable */
// ============================================================
// 🧭 STORESGO BACKEND — SEARCH ROUTE (Render-safe Minimal)
// - Clean version for Render (no AI, no OpenAI, no embeddings)
// ============================================================

import { FastifyInstance } from "fastify";

// ============================================================
// 🧠 Safe Stub Functions for Render-only Build
// These replace AI-powered functions temporarily so that
// the backend compiles cleanly on Render without OpenAI or
// external dependencies.
// ============================================================

const searchProductsByEmbedding = async (query?: string, limit?: number) => {
  // Placeholder: return empty array to mimic AI search result
  return [];
};

const translateToEnglish = (text: string) => {
  // Placeholder: return same text (no translation)
  return text;
};

const transcribeAudio = async (file: any) => {
  // Placeholder: no audio transcription in minimal build
  return "";
};

// ============================================================
// ⚙️ Search Route Definition
// ============================================================

export default async function searchRoutes(app: FastifyInstance) {
  app.get("/api/search", async (req, reply) => {
    try {
      const query = (req.query as any)?.q || "";
      const language = (req.query as any)?.lang || "en";

      // Translate query to English (stubbed)
      const englishQuery = translateToEnglish(query);

      // Perform a basic search (stubbed for now)
      const semanticResults = await searchProductsByEmbedding(englishQuery, 15);

      // Fallback if nothing found
      const results = semanticResults.length
        ? semanticResults
        : [{ id: 1, name: `Sample result for "${englishQuery}"`, price: 0 }];

      return reply.send({
        success: true,
        query,
        results,
        total: results.length,
      });
    } catch (error: any) {
      app.log.error({ err: error }, "Search failed");
      return reply.code(500).send({
        success: false,
        message: "Search failed",
      });
    }
  });

  // Example POST search route for voice input (stubbed)
  app.post("/api/search/voice", async (req, reply) => {
    try {
      const transcript = await transcribeAudio((req as any).file);
      const results = await searchProductsByEmbedding(transcript, 10);
      return reply.send({ success: true, transcript, results });
    } catch (error: any) {
      app.log.error({ err: error }, "Voice search failed");
      return reply.code(500).send({
        success: false,
        message: "Voice search failed",
      });
    }
  });
}
