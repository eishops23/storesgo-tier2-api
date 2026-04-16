import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import fs from "fs";
import path from "path";
import https from "https";
import http from "http";

const IMAGE_CACHE_DIR = process.env.IMAGE_CACHE_DIR || "/home/ubuntu/frontend/storesgo-frontend-v1/public/images/products";
const PLACEHOLDER_PATH = "/home/ubuntu/frontend/storesgo-frontend-v1/public/placeholder.png";

// Ensure cache directory exists
if (!fs.existsSync(IMAGE_CACHE_DIR)) {
  fs.mkdirSync(IMAGE_CACHE_DIR, { recursive: true });
}

async function downloadImage(url: string, filepath: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith("https") ? https : http;
    
    const request = protocol.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "Accept": "image/*",
        "Referer": "https://www.google.com/",
      }
    }, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302 || response.statusCode === 307) {
        const redirectUrl = response.headers.location;
        if (redirectUrl) {
          downloadImage(redirectUrl, filepath).then(resolve).catch(reject);
          return;
        }
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }
      
      const chunks: Buffer[] = [];
      response.on("data", (chunk: Buffer) => chunks.push(chunk));
      response.on("end", () => {
        const buffer = Buffer.concat(chunks);
        const isJpeg = buffer[0] === 0xFF && buffer[1] === 0xD8;
        const isPng = buffer[0] === 0x89 && buffer[1] === 0x50;
        
        if (!isJpeg && !isPng && buffer.length < 5000) {
          reject(new Error("Invalid image"));
          return;
        }
        
        fs.writeFileSync(filepath, buffer);
        resolve(true);
      });
      response.on("error", reject);
    });
    
    request.on("error", reject);
    request.setTimeout(15000, () => {
      request.destroy();
      reject(new Error("Timeout"));
    });
  });
}

export default async function imageProxyRoutes(app: FastifyInstance) {
  // GET /images/products/:id - serve cached or download on demand
  app.get<{ Params: { id: string } }>("/products/:id", async (request, reply) => {
    const productId = parseInt(request.params.id);
    if (isNaN(productId)) {
      return reply.status(400).send({ error: "Invalid product ID" });
    }
    
    // Check for cached image
    const extensions = ["jpg", "jpeg", "png", "webp"];
    for (const ext of extensions) {
      const cachedPath = path.join(IMAGE_CACHE_DIR, `${productId}.${ext}`);
      if (fs.existsSync(cachedPath) && fs.statSync(cachedPath).size > 5000) {
        reply.header("Cache-Control", "public, max-age=31536000");
        reply.header("Content-Type", `image/${ext === "jpg" ? "jpeg" : ext}`);
        return reply.send(fs.readFileSync(cachedPath));
      }
    }
    
    // Get product from database
    const product = await app.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, sourceImageUrl: true, imageUrl: true }
    });
    
    if (!product?.sourceImageUrl) {
      reply.header("Content-Type", "image/png");
      return reply.send(fs.readFileSync(PLACEHOLDER_PATH));
    }
    
    // Try to download
    const ext = product.sourceImageUrl.includes(".png") ? "png" : "jpg";
    const filepath = path.join(IMAGE_CACHE_DIR, `${productId}.${ext}`);
    
    try {
      await downloadImage(product.sourceImageUrl, filepath);
      await app.prisma.product.update({
        where: { id: productId },
        data: { imageUrl: `/images/products/${productId}.${ext}` }
      });
      
      reply.header("Cache-Control", "public, max-age=31536000");
      reply.header("Content-Type", `image/${ext === "jpg" ? "jpeg" : ext}`);
      return reply.send(fs.readFileSync(filepath));
    } catch (err) {
      reply.header("Content-Type", "image/png");
      return reply.send(fs.readFileSync(PLACEHOLDER_PATH));
    }
  });

  // POST /batch-download - download images in background
  app.post<{ Querystring: { limit?: string } }>("/batch-download", async (request, reply) => {
    const limit = parseInt(request.query.limit || "100");
    
    const products = await app.prisma.product.findMany({
      where: { sourceImageUrl: { not: null } },
      select: { id: true, sourceImageUrl: true },
      take: limit
    });
    
    let downloaded = 0, failed = 0, skipped = 0;
    
    for (const product of products) {
      if (!product.sourceImageUrl) continue;
      
      const ext = product.sourceImageUrl.includes(".png") ? "png" : "jpg";
      const filepath = path.join(IMAGE_CACHE_DIR, `${product.id}.${ext}`);
      
      if (fs.existsSync(filepath) && fs.statSync(filepath).size > 5000) {
        skipped++;
        continue;
      }
      
      try {
        await downloadImage(product.sourceImageUrl, filepath);
        await app.prisma.product.update({
          where: { id: product.id },
          data: { imageUrl: `/images/products/${product.id}.${ext}` }
        });
        downloaded++;
      } catch {
        failed++;
      }
      
      await new Promise(r => setTimeout(r, 200));
    }
    
    return { downloaded, failed, skipped, total: products.length };
  });
}
