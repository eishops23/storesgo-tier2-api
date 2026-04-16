import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { generateB2BWholesalePages, generateB2BPartnerPages, B2B_REGIONS } from "../data/b2b-seo-data.js";

export default async function sitemapB2bRoutes(app: FastifyInstance) {
  
  // GET /api/sitemap/b2b-wholesale.xml
  app.get("/b2b-wholesale.xml", async (request: FastifyRequest, reply: FastifyReply) => {
    const pages = generateB2BWholesalePages();
    const today = new Date().toISOString().split('T')[0];
    
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    
    // Index page
    xml += `  <url>\n    <loc>https://storesgo.com/wholesale</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.9</priority>\n  </url>\n`;
    
    // Region pages
    for (const region of B2B_REGIONS) {
      xml += `  <url>\n    <loc>https://storesgo.com/wholesale/${region.slug}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.85</priority>\n  </url>\n`;
    }
    
    // Cuisine/location pages
    for (const page of pages) {
      xml += `  <url>\n    <loc>https://storesgo.com/wholesale/${page.cuisine}/${page.location}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
    }
    
    xml += '</urlset>';
    
    reply.header('Content-Type', 'application/xml');
    return reply.send(xml);
  });
  
  // GET /api/sitemap/b2b-partners.xml
  app.get("/b2b-partners.xml", async (request: FastifyRequest, reply: FastifyReply) => {
    const pages = generateB2BPartnerPages();
    const today = new Date().toISOString().split('T')[0];
    
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    
    // Index page
    xml += `  <url>\n    <loc>https://storesgo.com/partners</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.9</priority>\n  </url>\n`;
    
    // Region pages
    for (const region of B2B_REGIONS) {
      xml += `  <url>\n    <loc>https://storesgo.com/partners/${region.slug}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.85</priority>\n  </url>\n`;
    }
    
    // Cuisine/location pages
    for (const page of pages) {
      xml += `  <url>\n    <loc>https://storesgo.com/partners/${page.cuisine}/${page.location}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
    }
    
    xml += '</urlset>';
    
    reply.header('Content-Type', 'application/xml');
    return reply.send(xml);
  });
}
