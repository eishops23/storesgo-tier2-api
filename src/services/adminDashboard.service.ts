import { prisma } from "../plugins/prisma.js";

export async function getDashboardSummary() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    totalProducts, activeProducts, pendingProducts,
    totalSellers, activeSellers, pendingSellers,
    totalOrders, pendingOrders, completedOrders,
    totalRevenue, last30DaysRevenue,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { OR: [{ status: "active" }, { status: "approved" }], isActive: true } }),
    prisma.product.count({ where: { status: "pending" } }),
    prisma.seller.count(),
    prisma.seller.count({ where: { isApproved: true } }),
    prisma.seller.count({ where: { isApproved: false } }),
    prisma.order.count(),
    prisma.order.count({ where: { status: "pending" } }),
    prisma.order.count({ where: { status: { in: ["delivered", "completed", "shipped"] } } }),
    prisma.order.aggregate({ _sum: { totalAmountCents: true } }),
    prisma.order.aggregate({ _sum: { totalAmountCents: true }, where: { createdAt: { gte: thirtyDaysAgo } } }),
  ]);

  return {
    ok: true,
    products: { total: totalProducts, active: activeProducts, pending: pendingProducts },
    sellers: { total: totalSellers, active: activeSellers, pending: pendingSellers },
    orders: { total: totalOrders, pending: pendingOrders, completed: completedOrders },
    revenue: { total: totalRevenue._sum.totalAmountCents ?? 0, last30Days: last30DaysRevenue._sum.totalAmountCents ?? 0, currency: "USD" },
  };
}
