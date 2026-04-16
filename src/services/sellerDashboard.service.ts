import { prisma } from "../lib/prisma.js";

export async function getSellerDashboardSummary(sellerId: number) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [revenueResult, orderCount, activeProducts, walletBalance] = await Promise.all([
    prisma.order.aggregate({
      _sum: { totalAmountCents: true },
      where: { sellerId, createdAt: { gte: thirtyDaysAgo }, status: { notIn: ["cancelled", "refunded"] } },
    }),
    prisma.order.count({ where: { sellerId } }),
    prisma.product.count({ where: { sellerId, isActive: true } }),
    prisma.transaction.aggregate({
      _sum: { amountCents: true },
      where: { sellerId, status: "completed" },
    }),
  ]);

  const totalEarnings = revenueResult._sum.totalAmountCents ?? 0;
  const balance = walletBalance._sum.amountCents ?? Math.floor(totalEarnings * 0.85);

  return {
    ok: true,
    revenue: totalEarnings / 100,
    orders: orderCount,
    products: activeProducts,
    balance: balance / 100,
  };
}

export async function getSellerOrders(sellerId: number, page = 1, pageSize = 20, status?: string) {
  const where: any = { sellerId };
  if (status) where.status = status;
  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where, skip: (page - 1) * pageSize, take: pageSize, orderBy: { createdAt: "desc" },
      include: { orderItems: { include: { product: { select: { id: true, name: true, imageUrl: true } } } } },
    }),
    prisma.order.count({ where }),
  ]);
  return { ok: true, orders, total, page, pageSize };
}

export async function getSellerAnalytics(sellerId: number, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const [totalRevenue, ordersByStatus] = await Promise.all([
    prisma.order.aggregate({
      _sum: { totalAmountCents: true }, _count: true,
      where: { sellerId, createdAt: { gte: startDate }, status: { notIn: ["cancelled", "refunded"] } },
    }),
    prisma.order.groupBy({ by: ["status"], _count: true, where: { sellerId, createdAt: { gte: startDate } } }),
  ]);
  return {
    ok: true,
    revenue: { total: (totalRevenue._sum.totalAmountCents ?? 0) / 100, orderCount: totalRevenue._count },
    ordersByStatus: ordersByStatus.map((s) => ({ status: s.status, count: s._count })),
  };
}

export async function getSellerPayouts(sellerId: number, page = 1, pageSize = 20) {
  const [transactions, total, totals] = await Promise.all([
    prisma.transaction.findMany({ where: { sellerId }, skip: (page - 1) * pageSize, take: pageSize, orderBy: { createdAt: "desc" } }),
    prisma.transaction.count({ where: { sellerId } }),
    prisma.transaction.aggregate({ _sum: { amountCents: true }, where: { sellerId, status: "completed" } }),
  ]);
  return { ok: true, transactions, total, page, pageSize, availableBalance: (totals._sum.amountCents ?? 0) / 100 };
}
