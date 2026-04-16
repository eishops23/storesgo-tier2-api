import { prisma } from "../plugins/prisma.js";

const BASE_URL = process.env.BASE_URL || "https://storesgo.com";

// ═══════════════════════════════════════════════════════════════════════════
// STATIC PAGES
// ═══════════════════════════════════════════════════════════════════════════

const staticPages = [
  { path: "/", priority: "1.0", changefreq: "daily" },
  { path: "/about", priority: "0.6", changefreq: "monthly" },
  { path: "/contact", priority: "0.6", changefreq: "monthly" },
  { path: "/faq", priority: "0.6", changefreq: "monthly" },
  { path: "/how-it-works", priority: "0.7", changefreq: "monthly" },
  { path: "/privacy", priority: "0.3", changefreq: "yearly" },
  { path: "/terms", priority: "0.3", changefreq: "yearly" },
  { path: "/shipping", priority: "0.5", changefreq: "monthly" },
  { path: "/products", priority: "0.9", changefreq: "daily" },
  { path: "/categories", priority: "0.8", changefreq: "weekly" },
  { path: "/collections", priority: "0.7", changefreq: "weekly" },
  { path: "/trending", priority: "0.8", changefreq: "daily" },
  { path: "/recipes", priority: "0.6", changefreq: "weekly" },
  { path: "/blog", priority: "0.7", changefreq: "daily" },
  { path: "/sell-with-us", priority: "0.8", changefreq: "monthly" },
  { path: "/sell", priority: "0.8", changefreq: "weekly" },
  { path: "/login", priority: "0.4", changefreq: "yearly" },
  { path: "/register", priority: "0.5", changefreq: "yearly" },
  { path: "/seller/register", priority: "0.7", changefreq: "monthly" },
];

// ═══════════════════════════════════════════════════════════════════════════
// SELLER SEO DATA (from sellerSeoData)
// ═══════════════════════════════════════════════════════════════════════════

const cuisines = [
  "caribbean", "jamaican", "haitian", "cuban", "trinidadian", "puerto-rican",
  "dominican", "guyanese", "bahamian", "barbadian", "vincentian", "grenadian",
  "hispanic", "mexican", "colombian", "venezuelan", "peruvian", "salvadoran",
  "guatemalan", "honduran", "nicaraguan", "brazilian", "argentinian", "ecuadorian",
  "african", "nigerian", "ghanaian", "ethiopian", "senegalese", "cameroonian",
  "kenyan", "somali", "south-african", "congolese",
  "asian", "indian", "pakistani", "bangladeshi", "filipino", "vietnamese",
  "chinese", "korean", "japanese", "thai", "indonesian", "malaysian",
  "middle-eastern", "lebanese", "persian", "turkish", "moroccan", "egyptian"
];

const locations = ["south-florida", "miami-dade", "broward", "palm-beach"];

const solutions = ["local-delivery", "reach-diaspora-customers", "compete-big-players", "get-online-fast"];
const competitors = ["caribshopper", "shopify", "instacart"];
const guides = ["start-ethnic-food-business-online", "ethnic-grocery-market-trends-2025"];

// ═══════════════════════════════════════════════════════════════════════════
// GENERATE SITEMAP
// ═══════════════════════════════════════════════════════════════════════════

export async function generateMasterSitemap(): Promise<string> {
  const urls: string[] = [];
  const today = new Date().toISOString().split("T")[0];

  // Static pages
  for (const page of staticPages) {
    urls.push(`
  <url>
    <loc>${BASE_URL}${page.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // BUYER PAGES: Categories from database
  // ─────────────────────────────────────────────────────────────────────────
  try {
    const categories = await prisma.category.findMany({
      
      select: { slug: true, updatedAt: true },
    });
    for (const cat of categories) {
      const lastmod = cat.updatedAt?.toISOString().split("T")[0] || today;
      urls.push(`
  <url>
    <loc>${BASE_URL}/categories/${cat.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`);
    }
  } catch (e) {
    console.log("Could not fetch categories for sitemap");
  }

  // ─────────────────────────────────────────────────────────────────────────
  // BUYER PAGES: Products from database (limit to avoid huge sitemap)
  // ─────────────────────────────────────────────────────────────────────────
  try {
    const products = await prisma.product.findMany({
      
      select: { slug: true, updatedAt: true },
      take: 10000, // Limit to 10k products
      orderBy: { updatedAt: "desc" },
    });
    for (const product of products) {
      const lastmod = product.updatedAt?.toISOString().split("T")[0] || today;
      urls.push(`
  <url>
    <loc>${BASE_URL}/products/${product.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`);
    }
  } catch (e) {
    console.log("Could not fetch products for sitemap");
  }

  // ─────────────────────────────────────────────────────────────────────────
  // BUYER PAGES: Sellers/Stores from database
  // ─────────────────────────────────────────────────────────────────────────
  try {
  const sellers = await prisma.seller.findMany({
    select: { slug: true, updatedAt: true },
  });
  for (const seller of sellers) {
    const lastmod = seller.updatedAt?.toISOString().split("T")[0] || today;
    urls.push(`
  <url>
    <loc>${BASE_URL}/sellers/${seller.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`);
    }
  } catch (e) {
    console.log("Could not fetch sellers for sitemap");
  }

  // ─────────────────────────────────────────────────────────────────────────
  // BLOG POSTS
  // ─────────────────────────────────────────────────────────────────────────
  try {
    const posts = await prisma.blogPost.findMany({
  select: { slug: true, updatedAt: true },
});
    for (const post of posts) {
      const lastmod = post.updatedAt?.toISOString().split("T")[0] || today;
      urls.push(`
  <url>
    <loc>${BASE_URL}/blog/${post.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`);
    }
  } catch (e) {
    console.log("Could not fetch blog posts for sitemap");
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SELLER SEO PAGES
  // ─────────────────────────────────────────────────────────────────────────
  
  // Cuisine + Location pages (208)
  for (const cuisine of cuisines) {
    for (const location of locations) {
      urls.push(`
  <url>
    <loc>${BASE_URL}/sell/${cuisine}/${location}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`);
    }
  }

  // Solution pages
  for (const solution of solutions) {
    urls.push(`
  <url>
    <loc>${BASE_URL}/sell/solutions/${solution}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`);
  }

  // Comparison pages
  for (const competitor of competitors) {
    urls.push(`
  <url>
    <loc>${BASE_URL}/sell/compare/${competitor}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`);
  }

  // Guide pages
  for (const guide of guides) {
    urls.push(`
  <url>
    <loc>${BASE_URL}/sell/guides/${guide}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`);
  }

  // Build XML
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join("")}
</urlset>`;

  return xml;
}

export async function getSitemapStats() {
  let productCount = 0;
  let categoryCount = 0;
  let sellerCount = 0;
  let blogCount = 0;

  try { productCount = await prisma.product.count(); } catch {}
  try { categoryCount = await prisma.category.count(); } catch {}
  try { sellerCount = await prisma.seller.count(); } catch {}
  try { blogCount = await prisma.blogPost.count(); } catch {}

  const sellerSeoPages = cuisines.length * locations.length + solutions.length + competitors.length + guides.length;

  return {
    staticPages: staticPages.length,
    categories: categoryCount,
    products: productCount,
    sellers: sellerCount,
    blogPosts: blogCount,
    sellerSeoPages,
    total: staticPages.length + categoryCount + productCount + sellerCount + blogCount + sellerSeoPages,
  };
}
