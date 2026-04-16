/**
 * SELLER PRODUCT IMAGES ROUTES
 * Multi-image support for products
 */
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { authenticateSeller } from "../../middleware/authSeller.js";
import { prisma } from "../../lib/prisma.js";

interface AddImageBody {
  url: string;
  altText?: string;
  isPrimary?: boolean;
}

interface UpdateImageBody {
  altText?: string;
  sortOrder?: number;
  isPrimary?: boolean;
}

interface ReorderBody {
  imageIds: number[];
}

export default async function sellerProductImagesRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authenticateSeller);

  // GET PRODUCT IMAGES - GET /api/seller/products/:productId/images
  app.get("/:productId/images", async (request: FastifyRequest, reply: FastifyReply) => {
    const sellerId = (request.user as any)?.sellerId;
    const { productId } = request.params as { productId: string };

    const product = await prisma.product.findFirst({
      where: { id: Number(productId), sellerId },
    });
    if (!product) return reply.code(404).send({ ok: false, error: "Product not found" });

    const images = await prisma.productImage.findMany({
      where: { productId: Number(productId) },
      orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
    });

    return reply.send({ ok: true, data: images });
  });

  // ADD IMAGE - POST /api/seller/products/:productId/images
  app.post("/:productId/images", async (request: FastifyRequest, reply: FastifyReply) => {
    const sellerId = (request.user as any)?.sellerId;
    const { productId } = request.params as { productId: string };
    const body = request.body as AddImageBody;

    if (!body.url) {
      return reply.code(400).send({ ok: false, error: "URL is required" });
    }

    const product = await prisma.product.findFirst({
      where: { id: Number(productId), sellerId },
    });
    if (!product) return reply.code(404).send({ ok: false, error: "Product not found" });

    // Get current max sortOrder
    const maxSort = await prisma.productImage.aggregate({
      where: { productId: Number(productId) },
      _max: { sortOrder: true },
    });
    const nextSort = (maxSort._max.sortOrder ?? -1) + 1;

    // If this is first image or marked as primary, handle primary flag
    const existingImages = await prisma.productImage.count({
      where: { productId: Number(productId) },
    });
    const shouldBePrimary = body.isPrimary || existingImages === 0;

    // If setting as primary, unset others
    if (shouldBePrimary) {
      await prisma.productImage.updateMany({
        where: { productId: Number(productId) },
        data: { isPrimary: false },
      });
    }

    const image = await prisma.productImage.create({
      data: {
        productId: Number(productId),
        url: body.url,
        altText: body.altText || null,
        sortOrder: nextSort,
        isPrimary: shouldBePrimary,
      },
    });

    // Update product's main imageUrl if this is primary
    if (shouldBePrimary) {
      await prisma.product.update({
        where: { id: Number(productId) },
        data: { imageUrl: body.url },
      });
    }

    app.log.info(`🖼️ Added image to product ${productId}`);
    return reply.send({ ok: true, data: image });
  });

  // UPDATE IMAGE - PATCH /api/seller/products/:productId/images/:imageId
  app.patch("/:productId/images/:imageId", async (request: FastifyRequest, reply: FastifyReply) => {
    const sellerId = (request.user as any)?.sellerId;
    const { productId, imageId } = request.params as { productId: string; imageId: string };
    const body = request.body as UpdateImageBody;

    const product = await prisma.product.findFirst({
      where: { id: Number(productId), sellerId },
    });
    if (!product) return reply.code(404).send({ ok: false, error: "Product not found" });

    const existing = await prisma.productImage.findFirst({
      where: { id: Number(imageId), productId: Number(productId) },
    });
    if (!existing) return reply.code(404).send({ ok: false, error: "Image not found" });

    const updateData: any = {};
    if (body.altText !== undefined) updateData.altText = body.altText;
    if (body.sortOrder !== undefined) updateData.sortOrder = body.sortOrder;

    // Handle primary flag
    if (body.isPrimary === true) {
      await prisma.productImage.updateMany({
        where: { productId: Number(productId) },
        data: { isPrimary: false },
      });
      updateData.isPrimary = true;

      // Update product's main imageUrl
      await prisma.product.update({
        where: { id: Number(productId) },
        data: { imageUrl: existing.url },
      });
    }

    const image = await prisma.productImage.update({
      where: { id: Number(imageId) },
      data: updateData,
    });

    return reply.send({ ok: true, data: image });
  });

  // DELETE IMAGE - DELETE /api/seller/products/:productId/images/:imageId
  app.delete("/:productId/images/:imageId", async (request: FastifyRequest, reply: FastifyReply) => {
    const sellerId = (request.user as any)?.sellerId;
    const { productId, imageId } = request.params as { productId: string; imageId: string };

    const product = await prisma.product.findFirst({
      where: { id: Number(productId), sellerId },
    });
    if (!product) return reply.code(404).send({ ok: false, error: "Product not found" });

    const existing = await prisma.productImage.findFirst({
      where: { id: Number(imageId), productId: Number(productId) },
    });
    if (!existing) return reply.code(404).send({ ok: false, error: "Image not found" });

    await prisma.productImage.delete({ where: { id: Number(imageId) } });

    // If deleted image was primary, set next image as primary
    if (existing.isPrimary) {
      const nextImage = await prisma.productImage.findFirst({
        where: { productId: Number(productId) },
        orderBy: { sortOrder: "asc" },
      });
      if (nextImage) {
        await prisma.productImage.update({
          where: { id: nextImage.id },
          data: { isPrimary: true },
        });
        await prisma.product.update({
          where: { id: Number(productId) },
          data: { imageUrl: nextImage.url },
        });
      } else {
        // No more images, clear product imageUrl
        await prisma.product.update({
          where: { id: Number(productId) },
          data: { imageUrl: null },
        });
      }
    }

    app.log.info(`🗑️ Deleted image ${imageId} from product ${productId}`);
    return reply.send({ ok: true, message: "Image deleted" });
  });

  // REORDER IMAGES - PATCH /api/seller/products/:productId/images/reorder
  app.patch("/:productId/images/reorder", async (request: FastifyRequest, reply: FastifyReply) => {
    const sellerId = (request.user as any)?.sellerId;
    const { productId } = request.params as { productId: string };
    const body = request.body as ReorderBody;

    if (!body.imageIds || !Array.isArray(body.imageIds)) {
      return reply.code(400).send({ ok: false, error: "imageIds array required" });
    }

    const product = await prisma.product.findFirst({
      where: { id: Number(productId), sellerId },
    });
    if (!product) return reply.code(404).send({ ok: false, error: "Product not found" });

    // Update sort order for each image
    await Promise.all(
      body.imageIds.map((imageId, index) =>
        prisma.productImage.updateMany({
          where: { id: imageId, productId: Number(productId) },
          data: { sortOrder: index },
        })
      )
    );

    const images = await prisma.productImage.findMany({
      where: { productId: Number(productId) },
      orderBy: { sortOrder: "asc" },
    });

    return reply.send({ ok: true, data: images });
  });

  app.log.info("🖼️ Seller product images routes registered");
}
