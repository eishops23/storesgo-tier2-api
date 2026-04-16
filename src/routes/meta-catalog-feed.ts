import { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";

/**
 * Meta Commerce Manager Product Feed for StoresGo
 * 
 * Serves a TSV feed at /products.tsv for Meta catalog sync.
 * Register alongside google-merchant-feed in your Fastify app.
 * 
 * Feed URL: https://storesgo.com/api/feeds/meta-catalog/products.tsv
 */

const EXCLUDED_CATEGORY_IDS = [3582, 3616, 3756];
const ALCOHOL_KEYWORDS = ['wine', 'beer', 'vodka', 'whiskey', 'rum', 'tequila', 'gin', 'brandy', 'cognac', 'liquor', 'champagne', 'bourbon', 'scotch', 'sake', 'hard seltzer', 'hard cider', 'merlot', 'cabernet', 'chardonnay', 'pinot', 'sangria', 'moscato'];
const OTC_MEDICINE_KEYWORDS = ['tylenol', 'acetaminophen', 'ibuprofen', 'aspirin', 'advil', 'motrin', 'aleve', 'naproxen', 'benadryl', 'diphenhydramine', 'zyrtec', 'claritin', 'allegra', 'pepto bismol', 'tums', 'robitussin', 'mucinex', 'nyquil', 'dayquil', 'excedrin', 'midol', 'pepcid', 'prilosec', 'nexium', 'sudafed', 'flonase', 'dramamine'];

function cleanText(str: string | null | undefined): string {
  if (!str) return '';
  return str
    .replace(/[\t\n\r]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/"/g, "'")
    .replace(/<[^>]*>/g, ' ')
    .trim();
}

function escapeTSV(value: string | null | undefined): string {
  if (!value) return '';
  return String(value).replace(/[\t\n\r]/g, ' ').trim();
}

function isAlcohol(name: string, desc: string | null): boolean {
  const text = `${name} ${desc || ''}`.toLowerCase();
  return ALCOHOL_KEYWORDS.some(k => new RegExp('\\b' + k + '\\b', 'i').test(text));
}

function isOTCMedicine(name: string): boolean {
  const text = name.toLowerCase();
  return OTC_MEDICINE_KEYWORDS.some(k => new RegExp('\\b' + k + '\\b', 'i').test(text));
}

function getPriceBucket(cents: number): string {
  if (cents < 500) return 'Under $5';
  if (cents < 1000) return '$5-$10';
  if (cents < 2000) return '$10-$20';
  if (cents < 5000) return '$20-$50';
  return '$50+';
}

export default async function metaCatalogFeedRoutes(app: FastifyInstance) {

  // Main feed endpoint - Meta Commerce Manager fetches this URL
  app.get("/products.tsv", async (request, reply) => {

    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        status: 'approved',
        categoryId: { notIn: EXCLUDED_CATEGORY_IDS },
        priceCents: { gt: 0 },
      },
      include: {
        category: true,
        seller: true,
        images: {
          orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
          take: 10,
        },
      },
      
    });

    // Filter out alcohol and OTC medicine (same as Google feed)
    const filtered = products.filter(p =>
      !isAlcohol(p.name, p.description) &&
      !isOTCMedicine(p.name)
    );

    // TSV header row - Meta Commerce Manager required + recommended fields
    const headers = [
      'id',
      'title',
      'description',
      'availability',
      'condition',
      'price',
      'link',
      'image_link',
      'brand',
      'google_product_category',
      'product_type',
      'additional_image_link',
      'custom_label_0',
      'custom_label_1',
      'custom_label_2',
    ];

    let tsv = headers.join('\t') + '\n';

    for (const p of filtered) {
      // Get best image
      const primaryImg = p.images?.find(img => img.isPrimary)?.url
        || p.images?.[0]?.url
        || p.imageUrl
        || p.sourceImageUrl
        || '';

      if (!primaryImg) continue; // Skip products without images

      // Get additional images (up to 9, comma-separated)
      const additionalImages = p.images
        ?.slice(1, 10)
        .map(img => img.url)
        .filter(Boolean)
        .join(',') || '';

      // Add sourceImageUrl as additional if it's different from primary
      const extraImg = (p.sourceImageUrl && p.sourceImageUrl !== primaryImg)
        ? (additionalImages ? `${additionalImages},${p.sourceImageUrl}` : p.sourceImageUrl)
        : additionalImages;

      const title = cleanText(p.aiSeoTitle || p.name).substring(0, 150);
      const desc = cleanText(p.aiDescription || p.description || p.name).substring(0, 5000);
      const price = `${(p.priceCents / 100).toFixed(2)} USD`;
      const link = `https://storesgo.com/products/${p.slug}`;
      const brand = cleanText(p.aiBrand || p.seller?.storeName || 'StoresGo');
      const category = p.category?.name || 'Grocery';

      const row = [
        p.id.toString(),                               // id
        escapeTSV(title),                               // title
        escapeTSV(desc),                                // description
        'in stock',                                     // availability
        'new',                                          // condition
        price,                                          // price
        link,                                           // link
        primaryImg,                                     // image_link
        escapeTSV(brand),                               // brand
        'Food, Beverages & Tobacco > Food Items',       // google_product_category
        escapeTSV(`StoresGo > ${category}`),            // product_type
        escapeTSV(extraImg),                            // additional_image_link
        escapeTSV(p.seller?.storeName || ''),           // custom_label_0: seller
        escapeTSV(category),                            // custom_label_1: category
        getPriceBucket(p.priceCents),                   // custom_label_2: price range
      ];

      tsv += row.join('\t') + '\n';
    }

    reply.header('Content-Type', 'text/tab-separated-values; charset=utf-8');
    reply.header('Content-Disposition', 'attachment; filename="storesgo-meta-catalog.tsv"');
    return tsv;
  });

  // Stats endpoint
  app.get("/stats", async () => {
    const total = await prisma.product.count({
      where: { isActive: true, status: 'approved' },
    });
    const excluded = await prisma.product.count({
      where: { isActive: true, status: 'approved', categoryId: { in: EXCLUDED_CATEGORY_IDS } },
    });
    return {
      ok: true,
      total,
      excluded_alcohol: excluded,
      in_feed: total - excluded,
      feed_url: "https://storesgo.com/api/feeds/meta-catalog/products.tsv",
    };
  });
}
