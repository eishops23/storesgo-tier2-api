import { FastifyPluginAsync } from "fastify";
import * as shipping from "../services/shipping.service.js";
import { prisma } from "../lib/prisma.js";

// Helper: Calculate actual weight from product IDs and quantities
async function getActualWeight(productIds: number[], quantities: number[]): Promise<number> {
  if (!productIds.length) return 1; // Minimum 1 lb for empty/unknown
  
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, shippingWeightGrams: true }
  });
  
  const weightMap = new Map(products.map(p => [p.id, p.shippingWeightGrams || 0]));
  
  let totalGrams = 0;
  for (let i = 0; i < productIds.length; i++) {
    const productId = productIds[i];
    const quantity = quantities[i] || 1;
    const weightGrams = weightMap.get(productId) || 454; // Default 1 lb if not found
    totalGrams += weightGrams * quantity;
  }
  
  // Convert grams to lbs (minimum 1 lb)
  const lbs = Math.max(1, totalGrams / 453.6);
  return Math.round(lbs * 100) / 100; // Round to 2 decimals
}

const shippingRoutes: FastifyPluginAsync = async (app) => {
  // Single seller shipping calculation
  app.post("/calculate", async (request) => {
    const { buyerZip, sellerIds, productIds, quantities, sellerId } = request.body as any;
    if (!buyerZip) return { ok: false, error: "Buyer ZIP required" };
    
    try {
      // Calculate actual weight from products
      const productIdList = productIds || [];
      const quantityList = quantities || productIdList.map(() => 1);
      const totalWeight = await getActualWeight(productIdList, quantityList);
      
      const result = await shipping.calculateShippingOptions({
        buyerZip,
        sellerIds: sellerIds || (sellerId ? [sellerId] : [1]),
        productIds: productIdList,
        totalWeight,
        sellerId
      });
      return { ok: true, data: result };
    } catch (error: any) {
      return { ok: false, error: error.message };
    }
  });

  // Multi-seller shipping calculation
  app.post("/calculate-multi", async (request) => {
    const { buyerZip, items } = request.body as any;
    if (!buyerZip) return { ok: false, error: "Buyer ZIP required" };
    if (!items?.length) return { ok: false, error: "Items required" };

    try {
      // Group items by seller with quantities
      const sellerGroups = new Map<number, { productIds: number[]; quantities: number[] }>();

      for (const item of items) {
        const sellerId = item.sellerId || 1;
        if (!sellerGroups.has(sellerId)) {
          sellerGroups.set(sellerId, { productIds: [], quantities: [] });
        }
        const group = sellerGroups.get(sellerId)!;
        group.productIds.push(item.productId);
        group.quantities.push(item.quantity || 1);
      }

      // Get seller info
      const sellerIds = Array.from(sellerGroups.keys());
      const sellers = await prisma.seller.findMany({
        where: { id: { in: sellerIds } },
        select: { id: true, storeName: true, city: true, state: true, zipCode: true }
      });

      const sellerMap = new Map(sellers.map(s => [s.id, s]));

      // Calculate shipping for each seller
      const sellerShipping = [];
      let hasCold = false;
      let coldRestriction = false;
      const coldProducts: any[] = [];
      let hasAlcohol = false;
      const alcoholProducts: any[] = [];

      for (const [sellerId, group] of sellerGroups) {
        const seller = sellerMap.get(sellerId);
        
        // Get ACTUAL weight from database
        const totalWeight = await getActualWeight(group.productIds, group.quantities);

        const result = await shipping.calculateShippingOptions({
          buyerZip,
          sellerIds: [sellerId],
          productIds: group.productIds,
          totalWeight,
          sellerId
        });

        // Check for cold products
        const coldInGroup = await shipping.getColdProductsInCart(group.productIds);
        // Check for alcohol products
        const alcoholResult = await shipping.checkAlcoholProducts(group.productIds);
        if (alcoholResult.hasAlcohol) {
          hasAlcohol = true;
          alcoholProducts.push(...alcoholResult.alcoholProducts);
        }
        if (coldInGroup.length > 0) {
          hasCold = true;
          coldProducts.push(...coldInGroup);
          if (result.distance > 50) {
            coldRestriction = true;
          }
        }

        sellerShipping.push({
          sellerId,
          sellerName: seller?.storeName || "StoresGo Marketplace",
          sellerCity: seller?.city,
          sellerState: seller?.state,
          distance: result.distance || 0,
          localAvailable: result.localDeliveryAvailable || false,
          options: result.options || [],
          hasColdProducts: coldInGroup.length > 0,
          totalWeightLbs: totalWeight // Include for transparency
        });
      }

      return {
        ok: true,
        data: {
          sellers: sellerShipping,
          hasCold,
          coldRestriction,
          coldProducts,
          hasAlcohol,
          alcoholProducts
        }
      };
    } catch (error: any) {
      console.error("Multi-seller shipping error:", error);
      return { ok: false, error: error.message };
    }
  });

  app.post("/cold-products", async (request) => {
    const { productIds } = request.body as any;
    if (!productIds?.length) return { ok: true, data: [] };
    const coldProducts = await shipping.getColdProductsInCart(productIds);
    return { ok: true, data: coldProducts };
  });
};

export default shippingRoutes;
