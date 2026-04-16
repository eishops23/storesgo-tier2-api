import { FastifyPluginAsync } from "fastify";
import * as aiSearch from "../services/aiSearch.service.js";

const aiSearchRoutes: FastifyPluginAsync = async (app) => {
  
  // Main AI Smart Search
  app.get("/", async (request) => {
    const q = request.query as any;
    const result = await aiSearch.aiSmartSearch({
      query: q.q || "",
      page: parseInt(q.page) || 1,
      pageSize: parseInt(q.pageSize) || 24,
      categoryId: q.categoryId ? parseInt(q.categoryId) : undefined,
      sellerId: q.sellerId ? parseInt(q.sellerId) : undefined,
      sessionId: q.sessionId,
      filters: {
        brands: q.brands?.split(",").filter(Boolean),
        dietary: q.dietary?.split(",").filter(Boolean),
        
        priceMin: q.priceMin ? parseFloat(q.priceMin) : undefined,
        priceMax: q.priceMax ? parseFloat(q.priceMax) : undefined,
        sort: q.sort,
      }
    });
    return { ok: true, data: result };
  });

  // Autocomplete suggestions
  app.get("/suggestions", async (request) => {
    const { q, limit } = request.query as any;
    const data = await aiSearch.getSmartSuggestions(q || "", parseInt(limit) || 8);
    return { ok: true, data };
  });

  // Related searches
  app.get("/related", async (request) => {
    const { q } = request.query as any;
    const data = await aiSearch.getRelatedSearches(q || "");
    return { ok: true, data };
  });

  // Spell check / Did you mean
  app.get("/spellcheck", async (request) => {
    const { q } = request.query as any;
    const suggestion = await aiSearch.getSpellingSuggestions(q || "");
    return { ok: true, data: { original: q, suggestion } };
  });

  // Filter presets
  app.get("/presets", async (request) => {
    const { categoryId } = request.query as any;
    const data = await aiSearch.getFilterPresets(categoryId ? parseInt(categoryId) : undefined);
    return { ok: true, data };
  });

  // Frequently bought together
  app.get("/related-products/:productId", async (request) => {
    const { productId } = request.params as any;
    const { limit } = request.query as any;
    const data = await aiSearch.getFrequentlyBoughtTogether(parseInt(productId), parseInt(limit) || 6);
    return { ok: true, data };
  });

  // Recently viewed
  app.get("/recently-viewed", async (request) => {
    const { sessionId, limit } = request.query as any;
    if (!sessionId) return { ok: false, error: "sessionId required" };
    const data = await aiSearch.getRecentlyViewed(sessionId, parseInt(limit) || 10);
    return { ok: true, data };
  });

  // Track product view
  app.post("/track-view", async (request) => {
    const { sessionId, productId, userId } = request.body as any;
    if (!sessionId || !productId) return { ok: false, error: "sessionId and productId required" };
    await aiSearch.trackProductView(sessionId, parseInt(productId), userId ? parseInt(userId) : undefined);
    return { ok: true };
  });
};

export default aiSearchRoutes;
