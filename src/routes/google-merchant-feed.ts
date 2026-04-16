import { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";

const EXCLUDED_CATEGORY_IDS = [3582, 3616, 3756];
const ALCOHOL_KEYWORDS = ['wine', 'beer', 'vodka', 'whiskey', 'rum', 'tequila', 'gin', 'brandy', 'cognac', 'liquor', 'champagne', 'bourbon', 'scotch', 'sake', 'hard seltzer', 'hard cider', 'merlot', 'cabernet', 'chardonnay', 'pinot', 'sangria', 'moscato'];
const OTC_MEDICINE_KEYWORDS = ['tylenol', 'acetaminophen', 'ibuprofen', 'aspirin', 'advil', 'motrin', 'aleve', 'naproxen', 'benadryl', 'diphenhydramine', 'zyrtec', 'claritin', 'allegra', 'pepto bismol', 'tums', 'robitussin', 'mucinex', 'nyquil', 'dayquil', 'excedrin', 'midol', 'pepcid', 'prilosec', 'nexium', 'sudafed', 'flonase', 'dramamine'];

function escapeXml(str: string | null | undefined): string {
  if (!str) return '';
  return str
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function stripHtml(str: string | null | undefined): string {
  if (!str) return '';
  return str.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function isAlcohol(name: string, desc: string | null): boolean {
  const text = `${name} ${desc || ''}`.toLowerCase();
  return ALCOHOL_KEYWORDS.some(k => new RegExp('\\b' + k + '\\b', 'i').test(text));
}

function isOTCMedicine(name: string): boolean {
  const text = name.toLowerCase();
  return OTC_MEDICINE_KEYWORDS.some(k => new RegExp('\\b' + k + '\\b', 'i').test(text));
}

export default async function googleMerchantFeedRoutes(app: FastifyInstance) {
  app.get("/products.xml", async (request, reply) => {
    const products = await prisma.product.findMany({
      where: { isActive: true, status: 'approved', OR: [{ categoryId: null }, { categoryId: { notIn: EXCLUDED_CATEGORY_IDS } }], priceCents: { gt: 0 } },
      include: { category: true, seller: true },

    });
    const filtered = products.filter(p => !isAlcohol(p.name, p.description) && !isOTCMedicine(p.name));
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">\n<channel>\n<title>StoresGo</title>\n<link>https://storesgo.com</link>\n<description>Ethnic groceries</description>\n`;
    for (const p of filtered) {
      const price = (p.priceCents / 100).toFixed(2);
      const title = escapeXml(p.name.substring(0,150));
      const desc = escapeXml(stripHtml(p.description).substring(0,5000));
      const img = escapeXml(p.imageUrl || '');
      const brand = escapeXml(p.seller?.storeName || 'StoresGo');
      const cat = escapeXml(p.category?.name || 'Grocery');
      const sourceImg = escapeXml(p.sourceImageUrl || '');
      const additionalImg = (sourceImg && sourceImg !== img) ? `<g:additional_image_link>${sourceImg}</g:additional_image_link>\n` : '';
      const ageGroup = 'adult';
      xml += `<item>\n<g:id>${p.id}</g:id>\n<g:title>${title}</g:title>\n<g:description>${desc}</g:description>\n<g:link>https://storesgo.com/products/${p.slug}</g:link>\n<g:image_link>${img}</g:image_link>\n${additionalImg}<g:price>${price} USD</g:price>\n<g:availability>in_stock</g:availability>\n<g:condition>new</g:condition>\n<g:brand>${brand}</g:brand>\n<g:product_type>${cat}</g:product_type>\n<g:age_group>${ageGroup}</g:age_group>\n<g:gender>unisex</g:gender>\n</item>\n`;
    }
    xml += `</channel>\n</rss>`;
    reply.header('Content-Type', 'application/xml');
    return xml;
  });

  app.get("/stats", async () => {
    const total = await prisma.product.count({ where: { isActive: true, status: 'approved' } });
    const excluded = await prisma.product.count({ where: { isActive: true, status: 'approved', categoryId: { in: EXCLUDED_CATEGORY_IDS } } });
    return { ok: true, total, excluded_alcohol: excluded, in_feed: total - excluded, feed_url: "https://storesgo.com/api/feeds/google-merchant/products.xml" };
  });
}
