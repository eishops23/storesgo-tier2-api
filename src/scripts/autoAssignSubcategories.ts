import { prisma } from "../plugins/prisma.js";

async function main() {
  const subcats = await prisma.taxonomy.findMany({
    where: { parentId: { not: null } },
    include: { parent: true },
  });

  const subBySlug: Record<string, any> = {};
  for (const s of subcats) subBySlug[s.slug] = s;

  console.log(`Loaded ${subcats.length} subcategories`);

  const batchSize = 200;

  while (true) {
    const products = await prisma.product.findMany({
      where: {
        categoryId: { not: null },
        // products that belong to category but not subcategory
        NOT: [
          {
            categoryId: {
              in: subcats.map((s) => s.id),
            },
          },
        ],
      },
      select: { id: true, name: true, categoryId: true },
      take: batchSize,
    });

    if (!products.length) {
      console.log("✔ No products left needing subcategory assignment.");
      break;
    }

    for (const p of products) {
      const n = p.name.toLowerCase();
      let targetSlug: string | null = null;

      // beverages
      if (n.includes("wine") || n.includes("sauvignon") || n.includes("cabernet")) {
        targetSlug = "wine";
      } else if (n.includes("juice") || n.includes("drink")) {
        targetSlug = "juice";
      } else if (n.includes("water") || n.includes("spring water") || n.includes("seltzer")) {
        targetSlug = "water";
      }

      // pet supplies
      if (!targetSlug && (n.includes("dog food") || n.includes("kibble"))) {
        targetSlug = "dog-food";
      } else if (!targetSlug && (n.includes("cat food") || n.includes("kitten"))) {
        targetSlug = "cat-food";
      }

      if (!targetSlug) continue;

      const sub = subBySlug[targetSlug];
      if (!sub) continue;

      // must match same parent category
      if (sub.parentId !== p.categoryId) continue;

      await prisma.product.update({
        where: { id: p.id },
        data: { categoryId: sub.id },
      });

      console.log(`✔ Product ${p.id} → subcategory: ${targetSlug}`);
    }
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
  });
