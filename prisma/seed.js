import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // --- Users ---
  const users = await prisma.user.createMany({
    data: [
      { email: 'buyer1@example.com', name: 'Alice Johnson', role: 'buyer' },
      { email: 'buyer2@example.com', name: 'Carlos Rivera', role: 'buyer' },
      { email: 'buyer3@example.com', name: 'Priya Patel', role: 'buyer' },
    ],
  })

  // --- Sellers ---
  const seller1 = await prisma.seller.create({
    data: {
      name: 'Green Market',
      email: 'seller1@example.com',
      storeName: 'Green Market Grocery',
      wallet: { create: { balance: 0 } },
    },
  })

  const seller2 = await prisma.seller.create({
    data: {
      name: 'Island Foods',
      email: 'seller2@example.com',
      storeName: 'Island Foods Store',
      wallet: { create: { balance: 0 } },
    },
  })

  // --- Orders + Payments ---
  const orders = await prisma.order.createMany({
    data: [
      { buyerId: 1, sellerId: seller1.id, totalAmount: 85.5, status: 'completed' },
      { buyerId: 2, sellerId: seller2.id, totalAmount: 42.0, status: 'completed' },
      { buyerId: 3, sellerId: seller1.id, totalAmount: 129.99, status: 'pending' },
    ],
  })

  await prisma.paymentTransaction.createMany({
    data: [
      { orderId: 1, amount: 85.5, status: 'paid' },
      { orderId: 2, amount: 42.0, status: 'paid' },
      { orderId: 3, amount: 129.99, status: 'pending' },
    ],
  })

  // --- Wallet Balances ---
  await prisma.wallet.update({
    where: { sellerId: seller1.id },
    data: { balance: 85.5 + 129.99 },
  })
  await prisma.wallet.update({
    where: { sellerId: seller2.id },
    data: { balance: 42.0 },
  })

  // --- Payout Batch Example ---
  const batch = await prisma.payoutBatch.create({
    data: {
      totalAmount: 85.5 + 42.0,
      status: 'queued',
      records: {
        create: [
          { sellerId: seller1.id, amount: 85.5, status: 'queued' },
          { sellerId: seller2.id, amount: 42.0, status: 'queued' },
        ],
      },
    },
  })

  console.log('✅ Seed complete! Example PayoutBatch ID:', batch.id)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
