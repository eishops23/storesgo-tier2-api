import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Phase 3: recipes & collections...");
  // Cleanup prior phase3 data
  await prisma.recipeItem.deleteMany();
  await prisma.recipe.deleteMany();
  await prisma.collectionItem.deleteMany();
  await prisma.collection.deleteMany();

  const products = await prisma.product.findMany({});
  if (!products.length) {
    console.error("No products found. Run base seed first (npx prisma db seed).");
    process.exit(1);
  }

  // Helper to pick random products
  function picks(n) {
    return [...products].sort(() => 0.5 - Math.random()).slice(0, n);
  }

  const recipes = [
    { title: "Jollof Rice", imageUrl: "https://picsum.photos/seed/jollof/400/300", items: 4 },
    { title: "Curry Goat Plate", imageUrl: "https://picsum.photos/seed/currygoat/400/300", items: 3 },
    { title: "Chow Mein Night", imageUrl: "https://picsum.photos/seed/chowmein/400/300", items: 3 }
  ];

  for (const r of recipes) {
    const slug = r.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const recipe = await prisma.recipe.create({
      data: { title: r.title, slug, description: `${r.title} using StoresGo ingredients`, imageUrl: r.imageUrl }
    });
    for (const p of picks(r.items)) {
      await prisma.recipeItem.create({ data: { recipeId: recipe.id, productId: p.id, note: `Use ${p.name}` } });
    }
  }

  const collections = [
    { title: "Caribbean Essentials", imageUrl: "https://picsum.photos/seed/cari/400/300", items: 5 },
    { title: "Indian Kitchen Starter", imageUrl: "https://picsum.photos/seed/ind/400/300", items: 5 },
    { title: "Asian Night In", imageUrl: "https://picsum.photos/seed/asian/400/300", items: 5 }
  ];

  for (const c of collections) {
    const slug = c.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const coll = await prisma.collection.create({
      data: { title: c.title, slug, description: `${c.title} — curated picks`, imageUrl: c.imageUrl }
    });
    let pos = 0;
    for (const p of picks(c.items)) {
      await prisma.collectionItem.create({ data: { collectionId: coll.id, productId: p.id, position: pos++ } });
    }
  }

  console.log("Phase 3 seed complete.");
}

main()
  .then(async () => await prisma.$disconnect())
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
