import { prisma } from "../lib/prisma.js";

// Get inventory for a product
export async function getProductInventory(productId: number) {
  return prisma.productInventory.findUnique({
    where: { productId },
    include: {
      product: { select: { id: true, name: true, imageUrl: true } }
    }
  });
}

// Initialize inventory for a product
export async function initializeInventory(productId: number, initialStock: number = 0) {
  const existing = await prisma.productInventory.findUnique({ where: { productId } });
  if (existing) return existing;
  
  return prisma.productInventory.create({
    data: {
      productId,
      stockQuantity: initialStock,
      reservedQuantity: 0,
      lowStockThreshold: 10,
      trackInventory: true,
      allowBackorder: false
    }
  });
}

// Update stock quantity
export async function updateStock(
  productId: number,
  quantity: number,
  movementType: "restock" | "adjustment" | "sale" | "return" | "reservation" | "release",
  reason?: string,
  referenceType?: string,
  referenceId?: number,
  createdBy?: number
) {
  const inventory = await prisma.productInventory.findUnique({ where: { productId } });
  
  if (!inventory) {
    throw new Error("Inventory not found for this product");
  }
  
  const previousStock = inventory.stockQuantity;
  const newStock = previousStock + quantity;
  
  if (newStock < 0 && !inventory.allowBackorder) {
    throw new Error("Insufficient stock");
  }
  
  // Update inventory
  const updated = await prisma.productInventory.update({
    where: { productId },
    data: {
      stockQuantity: newStock,
      lastRestockedAt: movementType === "restock" ? new Date() : undefined
    }
  });
  
  // Record movement
  await prisma.inventoryMovement.create({
    data: {
      inventoryId: inventory.id,
      movementType,
      quantity,
      previousStock,
      newStock,
      reason,
      referenceType,
      referenceId,
      createdBy
    }
  });
  
  return updated;
}

// Reserve stock (when adding to cart or starting checkout)
export async function reserveStock(productId: number, quantity: number): Promise<boolean> {
  const inventory = await prisma.productInventory.findUnique({ where: { productId } });
  
  if (!inventory || !inventory.trackInventory) return true; // No tracking = always available
  
  const availableStock = inventory.stockQuantity - inventory.reservedQuantity;
  
  if (availableStock < quantity && !inventory.allowBackorder) {
    return false;
  }
  
  await prisma.productInventory.update({
    where: { productId },
    data: { reservedQuantity: { increment: quantity } }
  });
  
  return true;
}

// Release reserved stock (when removing from cart or checkout fails)
export async function releaseReservedStock(productId: number, quantity: number) {
  const inventory = await prisma.productInventory.findUnique({ where: { productId } });
  if (!inventory) return;
  
  const newReserved = Math.max(0, inventory.reservedQuantity - quantity);
  
  await prisma.productInventory.update({
    where: { productId },
    data: { reservedQuantity: newReserved }
  });
}

// Commit reserved stock (when order is confirmed)
export async function commitReservedStock(productId: number, quantity: number, orderId: number) {
  return updateStock(productId, -quantity, "sale", "Order confirmed", "order", orderId);
}

// Check stock availability
export async function checkAvailability(productId: number, quantity: number = 1): Promise<{
  available: boolean;
  inStock: number;
  reserved: number;
  availableNow: number;
  allowBackorder: boolean;
}> {
  const inventory = await prisma.productInventory.findUnique({ where: { productId } });
  
  if (!inventory || !inventory.trackInventory) {
    return { available: true, inStock: 999, reserved: 0, availableNow: 999, allowBackorder: true };
  }
  
  const availableNow = inventory.stockQuantity - inventory.reservedQuantity;
  
  return {
    available: availableNow >= quantity || inventory.allowBackorder,
    inStock: inventory.stockQuantity,
    reserved: inventory.reservedQuantity,
    availableNow,
    allowBackorder: inventory.allowBackorder
  };
}

// Get low stock products
export async function getLowStockProducts(sellerId?: number) {
  const where: any = {};
  
  const inventories = await prisma.$queryRaw`
    SELECT pi.*, p.name, p."imageUrl", p."sellerId", s."storeName"
    FROM product_inventory pi
    JOIN products p ON pi."productId" = p.id
    LEFT JOIN sellers s ON p."sellerId" = s.id
    WHERE pi."stockQuantity" <= pi."lowStockThreshold"
    AND pi."trackInventory" = true
    ${sellerId ? prisma.$queryRaw`AND p."sellerId" = ${sellerId}` : prisma.$queryRaw``}
    ORDER BY pi."stockQuantity" ASC
    LIMIT 50
  `;
  
  return inventories;
}

// Get inventory movements history
export async function getInventoryMovements(productId: number, options: {
  page?: number;
  limit?: number;
  type?: string;
}) {
  const { page = 1, limit = 20, type } = options;
  
  const inventory = await prisma.productInventory.findUnique({ where: { productId } });
  if (!inventory) return { movements: [], total: 0 };
  
  const where: any = { inventoryId: inventory.id };
  if (type) where.movementType = type;
  
  const [movements, total] = await Promise.all([
    prisma.inventoryMovement.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: (page - 1) * limit
    }),
    prisma.inventoryMovement.count({ where })
  ]);
  
  return { movements, total, page, limit };
}

// Bulk update inventory (for imports)
export async function bulkUpdateInventory(updates: Array<{
  productId: number;
  stockQuantity: number;
  lowStockThreshold?: number;
}>) {
  const results = [];
  
  for (const update of updates) {
    try {
      const existing = await prisma.productInventory.findUnique({
        where: { productId: update.productId }
      });
      
      if (existing) {
        const diff = update.stockQuantity - existing.stockQuantity;
        if (diff !== 0) {
          await updateStock(
            update.productId,
            diff,
            "adjustment",
            "Bulk inventory update"
          );
        }
        if (update.lowStockThreshold) {
          await prisma.productInventory.update({
            where: { productId: update.productId },
            data: { lowStockThreshold: update.lowStockThreshold }
          });
        }
      } else {
        await initializeInventory(update.productId, update.stockQuantity);
      }
      
      results.push({ productId: update.productId, success: true });
    } catch (error: any) {
      results.push({ productId: update.productId, success: false, error: error.message });
    }
  }
  
  return results;
}

// Get inventory summary for seller/admin
export async function getInventorySummary(sellerId?: number) {
  const baseQuery = sellerId 
    ? prisma.$queryRaw`
        SELECT 
          COUNT(*)::int as "totalProducts",
          SUM(CASE WHEN pi."stockQuantity" <= pi."lowStockThreshold" THEN 1 ELSE 0 END)::int as "lowStockCount",
          SUM(CASE WHEN pi."stockQuantity" = 0 THEN 1 ELSE 0 END)::int as "outOfStockCount",
          SUM(pi."stockQuantity")::int as "totalStock",
          SUM(pi."reservedQuantity")::int as "totalReserved"
        FROM product_inventory pi
        JOIN products p ON pi."productId" = p.id
        WHERE p."sellerId" = ${sellerId}
      `
    : prisma.$queryRaw`
        SELECT 
          COUNT(*)::int as "totalProducts",
          SUM(CASE WHEN pi."stockQuantity" <= pi."lowStockThreshold" THEN 1 ELSE 0 END)::int as "lowStockCount",
          SUM(CASE WHEN pi."stockQuantity" = 0 THEN 1 ELSE 0 END)::int as "outOfStockCount",
          SUM(pi."stockQuantity")::int as "totalStock",
          SUM(pi."reservedQuantity")::int as "totalReserved"
        FROM product_inventory pi
      `;
  
  const result = await baseQuery as any[];
  return result[0] || {
    totalProducts: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    totalStock: 0,
    totalReserved: 0
  };
}
