import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { encyclopediaArticles } from "../data/encyclopedia-data.js";
import { expandedEncyclopediaArticles } from "../data/encyclopedia-expanded.js";

// Combine all articles
const allArticles = [...encyclopediaArticles, ...expandedEncyclopediaArticles];

export default async function encyclopediaRoutes(app: FastifyInstance) {
  
  // Get all articles (paginated)
  app.get("/", async (request: FastifyRequest, reply: FastifyReply) => {
    const { region, category, page = "1", limit = "20" } = request.query as any;
    
    let articles = allArticles;
    
    if (region) {
      articles = articles.filter(a => a.region === region);
    }
    if (category) {
      articles = articles.filter(a => a.category === category);
    }
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const start = (pageNum - 1) * limitNum;
    const paginatedArticles = articles.slice(start, start + limitNum);
    
    return reply.send({
      ok: true,
      data: paginatedArticles,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: articles.length,
        totalPages: Math.ceil(articles.length / limitNum)
      }
    });
  });
  
  // Get article by slug
  app.get("/:slug", async (request: FastifyRequest, reply: FastifyReply) => {
    const { slug } = request.params as { slug: string };
    const article = allArticles.find(a => a.slug === slug);
    
    if (!article) {
      return reply.status(404).send({ ok: false, error: "Article not found" });
    }
    
    return reply.send({ ok: true, data: article });
  });
  
  // Get all slugs (for sitemap)
  app.get("/sitemap/slugs", async (request: FastifyRequest, reply: FastifyReply) => {
    return reply.send({
      ok: true,
      data: allArticles.map(a => a.slug),
      total: allArticles.length
    });
  });
  
  // Get stats
  app.get("/stats", async (request: FastifyRequest, reply: FastifyReply) => {
    const regions = [...new Set(allArticles.map(a => a.region))];
    const categories = [...new Set(allArticles.map(a => a.category))];
    
    return reply.send({
      ok: true,
      data: {
        totalArticles: allArticles.length,
        regions: regions.map(r => ({
          name: r,
          count: allArticles.filter(a => a.region === r).length
        })),
        categories: categories.map(c => ({
          name: c,
          count: allArticles.filter(a => a.category === c).length
        }))
      }
    });
  });
}
