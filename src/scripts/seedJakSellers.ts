import { prisma } from "../plugins/prisma.js";

async function main() {
  const sellers = [
    { id: 12, storeName: "Bravo", slug: "bravo", userId: "bravo-user" },
    { id: 14, storeName: "Gala Fresh", slug: "gala-fresh", userId: "gala-user" },
    { id: 19, storeName: "Key Food", slug: "key-food", userId: "keyfood-user" },
    { id: 22, storeName: "Publix", slug: "publix", userId: "publix-user" },
  ];

  for (const s of sellers) {
    // Create User (required)
    await prisma.user.upsert({
      where: { id: s.userId },
      update: {},
      create: {
        id: s.userId,
        email: `${s.slug}@storesgo.com`,
        password: "TempPassword123!",
        role: "SELLER",
      },
    });

    // Create Seller
    await prisma.seller.upsert({
      where: { id: s.id },
      update: {},
      create: {
        id: s.id,
        userId: s.userId,
        storeName: s.storeName,
        slug: s.slug,
        isApproved: true,
      },
    });
  }

  console.log("✔ Sellers created successfully.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
