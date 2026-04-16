import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('📊 Seeding daily analytics and payouts...')

  const commissionRate = 0.2 // 20% platform fee
  const today = new Date()
  const random = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min

  // Get all sellers and their products
  const sellers = await prisma.seller.findMany({
    include: { products: true }
  })

  // Track global totals
  let platformTotal = 0
  let sellerTotals = {}

  for (const seller of sellers) {
    let sellerTotal = 0
    const numTransactions = random(2, 6)

    for (let i = 0; i < numTransactions; i++) {
      const product = seller.products[random(0, seller.products.length - 1)]
      if (!product) continue

      const quantity = random(1, 5)
      const total = product.price * quantity
      const commission = total * commissionRate
      const payout = total - commission

      sellerTotal += total
      platformTotal += commission

      await prisma.transaction.create({
        data: {
          sellerId: seller.id,
          productId: product.id,
          quantity,
          total,
          commission,
          payout,
          status: 'COMPLETED',
          createdAt: new Date(today.getTime() - random(0, 6) * 86400000) // within past 7 days
        }
      })
    }

    sellerTotals[seller.name] = sellerTotal
  }

  // Create summary log entries
  const analytics = []
  for (const [seller, total] of Object.entries(sellerTotals)) {
    analytics.push({
      seller,
      total: total.toFixed(2),
      commission: (total * commissionRate).toFixed(2),
      payout: (total * (1 - commissionRate)).toFixed(2)
    })
  }

  console.table(analytics)
  console.log('✅ Phase 5B seed complete — analytics and payouts generated!')
  console.log(`💰 Platform earned $${platformTotal.toFixed(2)} in total commissions.`)
}

main()
  .catch((e) => {
    console.error('❌ Error seeding analytics:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
