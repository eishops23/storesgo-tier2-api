import fs from "fs";
import path from "path";
import axios from "axios";
import { prisma } from "../plugins/prisma.js";

// Root folder containing Bravo, Publix, Key Food, Gala Fresh
const SCRAPE_ROOT =
  "C:/Users/ethni/Downloads/output_extract/output-9-11-2025/2025-10-15";

// Hard-coded sellerId mapping based on seed script
const SELLER_MAP: Record<string, number> = {
  Bravo: 12,
  "Gala Fresh": 14,
  "Key Food": 19,
  Publix: 22,
};

async function ensureUploadFolder() {
  const uploadPath = path.join(process.cwd(), "uploads", "products");
  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
  }
  return uploadPath;
}

// Convert HTML blocks into a single string
function extractDescription(details: any[]): string {
  if (!Array.isArray(details)) return "";
  return details
    .map((d) => `<h3>${d.title ?? ""}</h3>${d.html ?? ""}`)
    .join("<br/><br/>");
}

async function importProductsForSeller(folderName: string, sellerId: number) {
  const folder = path.join(SCRAPE_ROOT, folderName);
  const jsonFile = path.join(folder, "store_products_with_dets.json");

  if (!fs.existsSync(jsonFile)) {
    console.warn(`⚠ Missing JSON for ${folderName}`);
    return;
  }

  // Load file
  const raw = JSON.parse(fs.readFileSync(jsonFile, "utf8"));

  if (!raw.products || !Array.isArray(raw.products)) {
    console.warn(`⚠ Invalid format in ${folderName}: expected products[]`);
    return;
  }

  const uploadDir = await ensureUploadFolder();

  console.log(`\n📥 Importing ${raw.products.length} products for ${folderName}`);

  for (const p of raw.products) {
    const externalId = p.id;
    if (!externalId) {
      console.warn("⚠ Missing externalId for product. Skipping.");
      continue;
    }

    // Skip duplicates
    const exists = await prisma.product.findUnique({
      where: { externalId },
    });

    if (exists) {
      console.log(`↪ Skipped duplicate: ${externalId}`);
      continue;
    }

    // Extract main fields
    const name = p.name ?? "Unnamed Product";
    const price = p.pricing?.currentPrice ?? 0;
    const priceCents = Math.round(Number(price) * 100 * 1.2); // 20% markup

    // HTML description
    const description = extractDescription(p.details ?? []);

    // Primary image
    const imageUrlSrc = p.img;
    let savedImageUrl: string | null = null;

    if (imageUrlSrc && imageUrlSrc.startsWith("http")) {
      const fileName = `${externalId.replace(/[^a-zA-Z0-9-_]/g, "_")}.jpg`;
      const filePath = path.join(uploadDir, fileName);

      try {
        const response = await axios({
          url: imageUrlSrc,
          method: "GET",
          responseType: "stream",
        });

        const writer = fs.createWriteStream(filePath);
        response.data.pipe(writer);

        await new Promise((resolve, reject) => {
          writer.on("finish", resolve);
          writer.on("error", reject);
        });

        savedImageUrl = `/uploads/products/${fileName}`;
      } catch (err) {
        console.warn(`⚠ Failed to download image for ${externalId}`);
      }
    }

    // Insert into DB
    await prisma.product.create({
      data: {
        externalId,
        name,
        description,
        priceCents,
        imageUrl: savedImageUrl,
        sellerId,
        status: "active",
      },
    });

    console.log(`✔ Imported: ${externalId}`);
  }
}

async function main() {
  for (const [sellerName, sellerId] of Object.entries(SELLER_MAP)) {
    await importProductsForSeller(sellerName, sellerId);
  }

  console.log("\n🎉 Import completed for all sellers.");
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
