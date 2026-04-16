// ==========================================================
// STORESGO ETHNIC TAG ENRICHMENT SCRIPT
// ==========================================================

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const ETHNIC_PATTERNS: Record<string, RegExp> = {
  "Caribbean Foods": /\b(grace|jamaican|caribbean|jerk|plantain|ackee|scotch\s*bonnet|walkerswood|calypso|haitian|trinidadian|guyanese|golden\s*krust|tower\s*isle|ting\s*grapefruit|sorrel|mauby)\b/i,
  "Latin Foods": /\b(goya|badia|iberia|la\s*fe|mexican|cuban|sofrito|adobo|sazon|mole|taco|tortilla|jalapeno|chipotle|empanada|tamale|pupusa|arepa|guava|platano|yuca|maseca|abuelita|jumex|jarritos|valentina|tajin|la\s*costena|el\s*mexicano)\b/i,
  "Asian Foods": /\b(kikkoman|sriracha|thai\b|vietnamese|korean|japanese|chinese|teriyaki|miso|ramen|udon|soba|kimchi|soy\s*sauce|hoisin|wasabi|wonton|dumpling|pho|pad\s*thai|gyoza|tempura|nori|seaweed|mochi|gochujang|bulgogi|bibimbap|szechuan|lo\s*mein|chow\s*mein|egg\s*roll|lee\s*kum\s*kee|thai\s*kitchen|annie\s*chun)\b/i,
};

async function dryRun(limit: number = 200) {
  console.log("=== DRY RUN - NO CHANGES ===");
  const products = await prisma.product.findMany({
    take: limit,
    select: { id: true, name: true, description: true, aiTags: true },
  });

  let c = 0, l = 0, a = 0;
  for (const p of products) {
    const text = `${p.name} ${p.description || ""}`.toLowerCase();
    for (const [cat, pattern] of Object.entries(ETHNIC_PATTERNS)) {
      if (pattern.test(text)) {
        console.log(`${cat.padEnd(18)} | ${p.name.slice(0, 50)}`);
        if (cat === "Caribbean Foods") c++;
        else if (cat === "Latin Foods") l++;
        else if (cat === "Asian Foods") a++;
        break;
      }
    }
  }
  console.log(`\nCaribbean: ${c} | Latin: ${l} | Asian: ${a}`);
  await prisma.$disconnect();
}

async function run() {
  console.log("=== ETHNIC TAG ENRICHMENT ===");
  const total = await prisma.product.count();
  let offset = 0, tagged = 0;

  while (offset < total) {
    const products = await prisma.product.findMany({
      skip: offset, take: 1000,
      select: { id: true, name: true, description: true, aiTags: true },
    });
    if (!products.length) break;

    for (const p of products) {
      const text = `${p.name} ${p.description || ""}`.toLowerCase();
      const tags: string[] = p.aiTags || [];
      if (tags.some(t => ["Caribbean Foods", "Latin Foods", "Asian Foods"].includes(t))) continue;

      for (const [cat, pattern] of Object.entries(ETHNIC_PATTERNS)) {
        if (pattern.test(text)) {
          await prisma.product.update({
            where: { id: p.id },
            data: { aiTags: [...tags, cat] },
          });
          tagged++;
          break;
        }
      }
    }
    offset += 1000;
    console.log(`Progress: ${offset}/${total} (tagged: ${tagged})`);
  }

  console.log(`\nDone! Tagged ${tagged} products.`);
  await prisma.$disconnect();
}

const arg = process.argv[2];
if (arg === "--dry-run") dryRun(parseInt(process.argv[3]) || 200);
else if (arg === "--run") run();
else console.log("Usage: npx ts-node addEthnicTags.ts --dry-run [limit] | --run");
