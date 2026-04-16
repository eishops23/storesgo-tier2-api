/**
 * ======================================================
 * 🌱 STORESGO SEED SCRIPT — FINAL MERGED (PHASE 14C+)
 * Compatible with Prisma 6.18.0 + Node 18+
 * Idempotent | Loads Users, Sellers, Products, Wallets,
 * Payouts, Orders + AI Seasonal Deals
 * ======================================================
 */

import pkg from "@prisma/client";
const { PrismaClient } = pkg;
const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding StoresGo database (idempotent)…");

  // ----------------------------------------------------
  // 👤 USERS
  // ----------------------------------------------------
  const buyer = await prisma.user.upsert({
    where: { email: "buyer@storesgo.com" },
    update: {},
    create: { email: "buyer@storesgo.com", name: "Test Buyer", role: "buyer" },
  });

  const [userSeller1, userSeller2, userSeller3] = await Promise.all([
    prisma.user.upsert({
      where: { email: "islandgrocer@storesgo.com" },
      update: {},
      create: {
        email: "islandgrocer@storesgo.com",
        name: "Island Grocer Admin",
        role: "seller",
      },
    }),
    prisma.user.upsert({
      where: { email: "asianbazaar@storesgo.com" },
      update: {},
      create: {
        email: "asianbazaar@storesgo.com",
        name: "Asian Bazaar Admin",
        role: "seller",
      },
    }),
    prisma.user.upsert({
      where: { email: "latinexpress@storesgo.com" },
      update: {},
      create: {
        email: "latinexpress@storesgo.com",
        name: "Latin Express Admin",
        role: "seller",
      },
    }),
  ]);

  // ----------------------------------------------------
  // 🏪 SELLERS
  // ----------------------------------------------------
  const [islandGrocer, asianBazaar, latinExpress] = await Promise.all([
    prisma.seller.upsert({
      where: { slug: "island-grocer" },
      update: {},
      create: {
        userId: userSeller1.id,
        storeName: "Island Grocer",
        slug: "island-grocer",
        city: "Fort Lauderdale",
        state: "FL",
        country: "USA",
        about: "Authentic Caribbean groceries and snacks.",
        isApproved: true,
      },
    }),
    prisma.seller.upsert({
      where: { slug: "asian-bazaar" },
      update: {},
      create: {
        userId: userSeller2.id,
        storeName: "Asian Bazaar",
        slug: "asian-bazaar",
        city: "Miami",
        state: "FL",
        country: "USA",
        about: "Popular Asian condiments and spices.",
        isApproved: true,
      },
    }),
    prisma.seller.upsert({
      where: { slug: "latin-express" },
      update: {},
      create: {
        userId: userSeller3.id,
        storeName: "Latin Express",
        slug: "latin-express",
        city: "Orlando",
        state: "FL",
        country: "USA",
        about: "Latin American and Mexican staples.",
        isApproved: true,
      },
    }),
  ]);

  // ----------------------------------------------------
  // 🧭 CATEGORIES (Frontend Hero Grid)
  // ----------------------------------------------------
  const categoryData = [
    { name: "Caribbean", slug: "caribbean", icon: "🌴", tagline: "Island groceries & spices", color: "from-emerald-400/20 to-emerald-300/10" },
    { name: "Latin", slug: "latin", icon: "🌽", tagline: "Authentic Latin favorites", color: "from-yellow-400/20 to-amber-300/10" },
    { name: "Asian", slug: "asian", icon: "🍜", tagline: "Flavors from the Far East", color: "from-red-400/20 to-pink-300/10" },
    { name: "Fragrances", slug: "fragrances", icon: "💐", tagline: "Perfumes & body oils", color: "from-pink-400/20 to-rose-300/10" },
    { name: "Snacks", slug: "snacks", icon: "🍪", tagline: "Global treats & munchies", color: "from-orange-400/20 to-yellow-300/10" },
    { name: "Beverages", slug: "beverages", icon: "🥤", tagline: "Exotic drinks & juices", color: "from-cyan-400/20 to-sky-300/10" },
    { name: "Baking & Cooking", slug: "baking-cooking", icon: "🧂", tagline: "Cooking essentials & seasonings", color: "from-indigo-400/20 to-blue-300/10" },
    { name: "Household", slug: "household", icon: "🧼", tagline: "Everyday home care products", color: "from-gray-300/20 to-gray-200/10" },
    { name: "Personal Care", slug: "personal-care", icon: "🧴", tagline: "Skin, hair & beauty products", color: "from-purple-400/20 to-violet-300/10" },
    { name: "Health & Wellness", slug: "health-wellness", icon: "💊", tagline: "Vitamins, supplements & essentials", color: "from-teal-400/20 to-green-300/10" },
    { name: "Baby", slug: "baby", icon: "🍼", tagline: "Baby food, diapers & essentials", color: "from-pink-300/20 to-yellow-200/10" },
    { name: "Pet", slug: "pet", icon: "🐶", tagline: "Pet food & care products", color: "from-amber-400/20 to-orange-300/10" },
  ];

  const categories = [];
  for (const cat of categoryData) {
    const created = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: cat,
      create: cat,
    });
    categories.push(created);
  }
  const cat = (slug: string) => categories.find((c: any) => c.slug === slug)?.id;

  // ----------------------------------------------------
  // 🛍 PRODUCTS
  // ----------------------------------------------------
  await prisma.product.createMany({
    data: [
      {
        sellerId: islandGrocer.id,
        name: "Spicy Jerk Seasoning 100 g",
        description: "Authentic Caribbean jerk spice mix.",
        priceCents: 799,
        categoryId: cat("caribbean"),
        status: "active",
        isActive: true,
      },
      {
        sellerId: islandGrocer.id,
        name: "Tropical Sorrel Drink 1 L",
        description: "Traditional hibiscus-based Caribbean drink.",
        priceCents: 499,
        categoryId: cat("beverages"),
        status: "active",
        isActive: true,
      },
      {
        sellerId: asianBazaar.id,
        name: "Ramen Noodles Pack (5)",
        description: "Instant ramen with rich miso broth flavor.",
        priceCents: 599,
        categoryId: cat("asian"),
        status: "active",
        isActive: true,
      },
      {
        sellerId: latinExpress.id,
        name: "Plantain Chips Sea Salt 4 oz",
        description: "Crispy and lightly salted plantain chips.",
        priceCents: 299,
        categoryId: cat("latin"),
        status: "active",
        isActive: true,
      },
    ],
    skipDuplicates: true,
  });

  // ----------------------------------------------------
  // 💰 WALLETS
  // ----------------------------------------------------
  await prisma.wallet.createMany({
    data: [
      { sellerId: islandGrocer.id, balanceCents: 34025, currency: "USD" },
      { sellerId: asianBazaar.id, balanceCents: 21075, currency: "USD" },
      { sellerId: latinExpress.id, balanceCents: 41000, currency: "USD" },
    ],
    skipDuplicates: true,
  });

  // ----------------------------------------------------
  // 💸 PAYOUTS
  // ----------------------------------------------------
  await prisma.payoutRecord.createMany({
    data: [
      { sellerId: islandGrocer.id, amountCents: 34025, currency: "USD", status: "paid" },
      { sellerId: asianBazaar.id, amountCents: 21075, currency: "USD", status: "paid" },
      { sellerId: latinExpress.id, amountCents: 40950, currency: "USD", status: "paid" },
    ],
    skipDuplicates: true,
  });

  // ----------------------------------------------------
  // 🧾 ORDERS + TRANSACTIONS
  // ----------------------------------------------------
  await prisma.order
    .create({
      data: {
        buyerId: buyer.id,
        sellerId: islandGrocer.id,
        totalAmountCents: 1598,
        currency: "USD",
        status: "completed",
        transactions: {
          create: { amountCents: 1598, currency: "USD", status: "success" },
        },
      },
    })
    .catch(() => {});

  // ----------------------------------------------------
  // 🎉 SEASONAL DEALS (AI Recommendations)
  // ----------------------------------------------------
  const seasonalDeals = [
    {
      slug: "thanksgiving",
      title: "Thanksgiving Specials",
      description:
        "Celebrate the flavors of gratitude with Caribbean, Latin, and Asian ingredients for your Thanksgiving feast.",
      imageUrl: "https://cdn.storesgo.com/images/thanksgiving.jpg",
      keywords: ["thanksgiving", "turkey", "cranberry", "holiday"],
    },
    {
      slug: "blackfriday",
      title: "Black Friday Mega Sale",
      description:
        "Shop top ethnic groceries and save big! Exclusive deals on snacks, sauces, and spices this Black Friday.",
      imageUrl: "https://cdn.storesgo.com/images/blackfriday.jpg",
      keywords: ["black friday", "discount", "sale", "deal"],
    },
    {
      slug: "christmas",
      title: "Christmas Holiday Delights",
      description:
        "Bring the taste of home to your Christmas table with authentic ethnic treats, spices, and beverages.",
      imageUrl: "https://cdn.storesgo.com/images/christmas.jpg",
      keywords: ["christmas", "holiday", "ginger beer", "spice", "cookies"],
    },
  ];

  for (const deal of seasonalDeals) {
    const exists = await prisma.seasonalDeal.findUnique({ where: { slug: deal.slug } });
    if (!exists) {
      await prisma.seasonalDeal.create({ data: deal });
      console.log(`✅ Added Seasonal Deal: ${deal.title}`);
    } else {
      console.log(`↩️ Skipped (already exists): ${deal.title}`);
    }
  }

  console.log("✅ Seed completed successfully.");
}

// ----------------------------------------------------
// 🚦 EXECUTION HANDLER
// ----------------------------------------------------
main()
  .then(async () => await prisma.$disconnect())
  .catch(async (err) => {
    console.error("❌ Seed failed:", err);
    await prisma.$disconnect();
    process.exit(1);
  });
