import { prisma } from "../plugins/prisma.js";

const CATEGORIES = [
  { name: "Caribbean Foods", slug: "caribbean-foods" },
  { name: "Latin Foods", slug: "latin-foods" },
  { name: "Asian Foods", slug: "asian-foods" },
  { name: "Fragrances", slug: "fragrances" },
  { name: "Snacks", slug: "snacks" },
  { name: "Beverages", slug: "beverages" },
  { name: "Baking & Cooking", slug: "baking-and-cooking" },
  { name: "Household Essentials", slug: "household-essentials" },
  { name: "Personal Care", slug: "personal-care" },
  { name: "Health & Wellness", slug: "health-and-wellness" },
  { name: "Baby Products", slug: "baby-products" },
  { name: "Pet Supplies", slug: "pet-supplies" },
];

async function main() {
  for (const cat of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name },
      create: {
        name: cat.name,
        slug: cat.slug,
      },
    });
  }

  console.log("✅ Seeded base 12 categories");
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
