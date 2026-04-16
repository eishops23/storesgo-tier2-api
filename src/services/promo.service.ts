import { prisma } from "../lib/prisma.js";

interface ValidatePromoResult {
  valid: boolean;
  error?: string;
  discount?: { type: string; value: number; maxDiscount?: number };
  promoId?: number;
}

interface ApplyPromoResult {
  success: boolean;
  discountCents: number;
  message: string;
  promoCode?: any;
}

// Validate a promo code
export async function validatePromoCode(
  code: string,
  orderSubtotalCents: number,
  userId?: string,
  sellerId?: number
): Promise<ValidatePromoResult> {
  const promo = await prisma.promoCode.findUnique({ where: { code: code.toUpperCase() } });
  
  if (!promo) return { valid: false, error: "Invalid promo code" };
  if (!promo.isActive) return { valid: false, error: "This promo code is no longer active" };
  
  const now = new Date();
  if (promo.validFrom > now) return { valid: false, error: "This promo code is not yet valid" };
  if (promo.validUntil && promo.validUntil < now) return { valid: false, error: "This promo code has expired" };
  
  if (promo.usageLimit && promo.usageCount >= promo.usageLimit) {
    return { valid: false, error: "This promo code has reached its usage limit" };
  }
  
  if (promo.minOrderCents && orderSubtotalCents < promo.minOrderCents) {
    const minOrder = (promo.minOrderCents / 100).toFixed(2);
    return { valid: false, error: `Minimum order of $${minOrder} required` };
  }
  
  // Check seller-specific codes
  if (promo.sellerId && sellerId && promo.sellerId !== sellerId) {
    return { valid: false, error: "This promo code is not valid for this seller" };
  }
  
  // Check per-user limit
  if (userId && promo.perUserLimit) {
    const userUsages = await prisma.promoCodeUsage.count({
      where: { promoCodeId: promo.id, userId }
    });
    if (userUsages >= promo.perUserLimit) {
      return { valid: false, error: "You have already used this promo code" };
    }
  }
  
  return {
    valid: true,
    promoId: promo.id,
    discount: {
      type: promo.discountType,
      value: promo.discountValue,
      maxDiscount: promo.maxDiscountCents || undefined
    }
  };
}

// Calculate discount amount
export function calculateDiscount(
  subtotalCents: number,
  discountType: string,
  discountValue: number,
  maxDiscountCents?: number
): number {
  let discountCents = 0;
  
  if (discountType === "percentage") {
    discountCents = Math.round(subtotalCents * (discountValue / 100));
    if (maxDiscountCents && discountCents > maxDiscountCents) {
      discountCents = maxDiscountCents;
    }
  } else if (discountType === "fixed") {
    discountCents = Math.round(discountValue);
  } else if (discountType === "free_shipping") {
    // Return a flag value; actual shipping discount applied elsewhere
    return -1;
  }
  
  return Math.min(discountCents, subtotalCents); // Can't discount more than subtotal
}

// Apply promo code to order
export async function applyPromoCode(
  code: string,
  orderSubtotalCents: number,
  userId?: string,
  orderId?: number,
  visitorId?: string
): Promise<ApplyPromoResult> {
  const validation = await validatePromoCode(code, orderSubtotalCents, userId);
  
  if (!validation.valid) {
    return { success: false, discountCents: 0, message: validation.error || "Invalid code" };
  }
  
  const { discount, promoId } = validation;
  const discountCents = calculateDiscount(
    orderSubtotalCents,
    discount!.type,
    discount!.value,
    discount!.maxDiscount
  );
  
  // Record usage
  await prisma.promoCodeUsage.create({
    data: {
      promoCodeId: promoId!,
      userId,
      orderId,
      visitorId,
      discountCents
    }
  });
  
  // Increment usage count
  await prisma.promoCode.update({
    where: { id: promoId },
    data: { usageCount: { increment: 1 } }
  });
  
  const promo = await prisma.promoCode.findUnique({ where: { id: promoId } });
  
  return {
    success: true,
    discountCents,
    message: `Promo code applied! You saved $${(discountCents / 100).toFixed(2)}`,
    promoCode: promo
  };
}

// Create promo code (admin/seller)
export async function createPromoCode(data: {
  code: string;
  description?: string;
  discountType: "percentage" | "fixed" | "free_shipping";
  discountValue: number;
  minOrderCents?: number;
  maxDiscountCents?: number;
  usageLimit?: number;
  perUserLimit?: number;
  validFrom?: Date;
  validUntil?: Date;
  applicableTo?: string;
  applicableIds?: number[];
  sellerId?: number;
}) {
  return prisma.promoCode.create({
    data: {
      code: data.code.toUpperCase(),
      description: data.description,
      discountType: data.discountType,
      discountValue: data.discountValue,
      minOrderCents: data.minOrderCents,
      maxDiscountCents: data.maxDiscountCents,
      usageLimit: data.usageLimit,
      perUserLimit: data.perUserLimit || 1,
      validFrom: data.validFrom || new Date(),
      validUntil: data.validUntil,
      applicableTo: data.applicableTo || "all",
      applicableIds: data.applicableIds || [],
      sellerId: data.sellerId
    }
  });
}

// List promo codes
export async function listPromoCodes(options: {
  sellerId?: number;
  activeOnly?: boolean;
  page?: number;
  limit?: number;
}) {
  const { sellerId, activeOnly = false, page = 1, limit = 20 } = options;
  
  const where: any = {};
  if (sellerId) where.sellerId = sellerId;
  if (activeOnly) {
    where.isActive = true;
    where.validFrom = { lte: new Date() };
    where.OR = [
      { validUntil: null },
      { validUntil: { gte: new Date() } }
    ];
  }
  
  const [codes, total] = await Promise.all([
    prisma.promoCode.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: (page - 1) * limit,
      include: { _count: { select: { usages: true } } }
    }),
    prisma.promoCode.count({ where })
  ]);
  
  return { codes, total, page, limit };
}

// Update promo code
export async function updatePromoCode(id: number, data: Partial<{
  description: string;
  isActive: boolean;
  usageLimit: number;
  validUntil: Date;
  maxDiscountCents: number;
}>) {
  return prisma.promoCode.update({ where: { id }, data });
}

// Delete promo code
export async function deletePromoCode(id: number) {
  // Soft delete by deactivating
  return prisma.promoCode.update({
    where: { id },
    data: { isActive: false }
  });
}

// Get promo code stats
export async function getPromoCodeStats(id: number) {
  const promo = await prisma.promoCode.findUnique({
    where: { id },
    include: {
      usages: {
        orderBy: { usedAt: "desc" },
        take: 10
      },
      _count: { select: { usages: true } }
    }
  });
  
  if (!promo) return null;
  
  const totalSavings = await prisma.promoCodeUsage.aggregate({
    where: { promoCodeId: id },
    _sum: { discountCents: true }
  });
  
  return {
    ...promo,
    totalUsages: promo._count.usages,
    totalSavingsCents: totalSavings._sum.discountCents || 0
  };
}
