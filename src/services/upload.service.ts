/**
 * File Upload Service
 * Standardized file uploads with organized directory structure
 * 
 * UPDATED: Now uploads to OCI Object Storage first, with local fallback
 */

import { createWriteStream, existsSync, mkdirSync, unlinkSync, statSync } from "fs";
import { join, extname, basename } from "path";
import { pipeline } from "stream/promises";
import crypto from "crypto";

// =============================================================================
// OCI OBJECT STORAGE IMPORTS & CONFIG
// =============================================================================

let S3Client: any;
let PutObjectCommand: any;
let DeleteObjectCommand: any;
let s3ClientInstance: any = null;

const OCI_REGION = process.env.OCI_REGION || "";
const OCI_NAMESPACE = process.env.OCI_NAMESPACE || "";
const OCI_BUCKET = process.env.OCI_BUCKET || "";
const OCI_ACCESS_KEY = process.env.OCI_ACCESS_KEY || "";
const OCI_SECRET_KEY = process.env.OCI_SECRET_KEY || "";

const OCI_ENDPOINT = OCI_NAMESPACE ? `https://${OCI_NAMESPACE}.compat.objectstorage.${OCI_REGION}.oraclecloud.com` : "";
const OCI_PUBLIC_URL_BASE = OCI_NAMESPACE ? `https://objectstorage.${OCI_REGION}.oraclecloud.com/n/${OCI_NAMESPACE}/b/${OCI_BUCKET}/o` : "";

function isOciConfigured(): boolean {
  return !!(OCI_ACCESS_KEY && OCI_SECRET_KEY && OCI_NAMESPACE && OCI_BUCKET && OCI_REGION);
}

async function getS3Client() {
  if (!isOciConfigured()) {
    return null;
  }

  if (s3ClientInstance) {
    return s3ClientInstance;
  }

  try {
    const s3Module = await import("@aws-sdk/client-s3");
    S3Client = s3Module.S3Client;
    PutObjectCommand = s3Module.PutObjectCommand;
    DeleteObjectCommand = s3Module.DeleteObjectCommand;

    s3ClientInstance = new S3Client({
      region: OCI_REGION,
      endpoint: OCI_ENDPOINT,
      credentials: {
        accessKeyId: OCI_ACCESS_KEY,
        secretAccessKey: OCI_SECRET_KEY,
      },
      forcePathStyle: true,
    });

    console.log("✅ OCI S3 client initialized");
    return s3ClientInstance;
  } catch (error: any) {
    console.warn("⚠️ AWS SDK not available, using local storage only:", error.message);
    return null;
  }
}

// =============================================================================
// EXISTING TYPES & CONFIG
// =============================================================================

export type UploadType =
  | "products"
  | "sellers"
  | "banners"
  | "categories"
  | "blog"
  | "temp"
  | "avatars"
  | "documents";

const UPLOAD_BASE_DIR = process.env.UPLOAD_DIR || "./uploads";
const PUBLIC_URL_BASE = process.env.UPLOAD_URL_BASE || "/uploads";
const MAX_FILE_SIZE = parseInt(process.env.MAX_UPLOAD_SIZE || "10485760", 10);

const ALLOWED_MIME_TYPES: Record<UploadType, string[]> = {
  products: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  sellers: ["image/jpeg", "image/png", "image/webp"],
  banners: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  categories: ["image/jpeg", "image/png", "image/webp", "image/svg+xml"],
  blog: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  temp: ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"],
  avatars: ["image/jpeg", "image/png", "image/webp"],
  documents: ["application/pdf", "text/csv", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
};

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/svg+xml": ".svg",
  "application/pdf": ".pdf",
  "text/csv": ".csv",
  "application/vnd.ms-excel": ".xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
};

export interface UploadResult {
  success: boolean;
  filename?: string;
  path?: string;
  url?: string;
  size?: number;
  mimeType?: string;
  error?: string;
  storage?: "oci" | "local";
}

export interface FileInfo {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  stream: NodeJS.ReadableStream;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function ensureDirectory(type: UploadType): string {
  const dirPath = join(UPLOAD_BASE_DIR, type);
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }
  return dirPath;
}

function generateFilename(originalName: string, mimeType: string, type?: UploadType): string {
  const timestamp = Date.now();
  const random = crypto.randomBytes(8).toString("hex");
  const ext = MIME_TO_EXT[mimeType] || extname(originalName) || ".bin";

  const sanitizedName = basename(originalName, extname(originalName))
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 50);

  if (type) {
    return `storesgo-${type}-${sanitizedName}-${timestamp}-${random}${ext}`;
  }
  return `${sanitizedName}-${timestamp}-${random}${ext}`;
}

export function isAllowedFileType(mimeType: string, uploadType: UploadType): boolean {
  const allowedTypes = ALLOWED_MIME_TYPES[uploadType] || [];
  return allowedTypes.includes(mimeType);
}

async function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

function getOciPublicUrl(type: UploadType, filename: string): string {
  const objectKey = `${type}/${filename}`;
  return `${OCI_PUBLIC_URL_BASE}/${encodeURIComponent(objectKey)}`;
}

// =============================================================================
// OCI UPLOAD FUNCTION
// =============================================================================

async function uploadToOci(
  buffer: Buffer,
  filename: string,
  mimeType: string,
  type: UploadType
): Promise<UploadResult> {
  try {
    const client = await getS3Client();
    if (!client) {
      return { success: false, error: "OCI not configured" };
    }

    const objectKey = `${type}/${filename}`;

    const command = new PutObjectCommand({
      Bucket: OCI_BUCKET,
      Key: objectKey,
      Body: buffer,
      ContentType: mimeType,
    });

    await client.send(command);

    const publicUrl = getOciPublicUrl(type, filename);
    console.log(`✅ Uploaded to OCI: ${publicUrl}`);

    return {
      success: true,
      filename,
      url: publicUrl,
      size: buffer.length,
      mimeType,
      storage: "oci",
    };
  } catch (error: any) {
    console.error("❌ OCI upload error:", error.message);
    return {
      success: false,
      error: error.message || "OCI upload failed",
    };
  }
}

// =============================================================================
// MAIN UPLOAD FUNCTIONS
// =============================================================================

export async function uploadFile(
  file: FileInfo,
  type: UploadType,
  options: {
    customFilename?: string;
    maxSize?: number;
    forceLocal?: boolean;
  } = {}
): Promise<UploadResult> {
  try {
    if (!isAllowedFileType(file.mimeType, type)) {
      return {
        success: false,
        error: `File type ${file.mimeType} not allowed for ${type} uploads`,
      };
    }

    const buffer = await streamToBuffer(file.stream);

    const maxSize = options.maxSize || MAX_FILE_SIZE;
    if (buffer.length > maxSize) {
      return {
        success: false,
        error: `File size ${buffer.length} exceeds maximum of ${maxSize} bytes`,
      };
    }

    const filename = options.customFilename || generateFilename(file.originalName, file.mimeType, type);

    // Try OCI first
    if (!options.forceLocal && isOciConfigured()) {
      const ociResult = await uploadToOci(buffer, filename, file.mimeType, type);
      if (ociResult.success) {
        return ociResult;
      }
      console.warn("⚠️ OCI upload failed, falling back to local storage");
    }

    // Local storage fallback
    const directory = ensureDirectory(type);
    const filePath = join(directory, filename);
    const publicUrl = `${PUBLIC_URL_BASE}/${type}/${filename}`;

    const { writeFileSync } = await import("fs");
    writeFileSync(filePath, buffer);

    return {
      success: true,
      filename,
      path: filePath,
      url: publicUrl,
      size: buffer.length,
      mimeType: file.mimeType,
      storage: "local",
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Upload failed",
    };
  }
}

export async function uploadBuffer(
  buffer: Buffer,
  originalName: string,
  mimeType: string,
  type: UploadType,
  options: { forceLocal?: boolean } = {}
): Promise<UploadResult> {
  try {
    if (!isAllowedFileType(mimeType, type)) {
      return {
        success: false,
        error: `File type ${mimeType} not allowed for ${type} uploads`,
      };
    }

    if (buffer.length > MAX_FILE_SIZE) {
      return {
        success: false,
        error: `File size ${buffer.length} exceeds maximum of ${MAX_FILE_SIZE} bytes`,
      };
    }

    const filename = generateFilename(originalName, mimeType, type);

    if (!options.forceLocal && isOciConfigured()) {
      const ociResult = await uploadToOci(buffer, filename, mimeType, type);
      if (ociResult.success) {
        return ociResult;
      }
      console.warn("⚠️ OCI upload failed, falling back to local storage");
    }

    const directory = ensureDirectory(type);
    const filePath = join(directory, filename);
    const publicUrl = `${PUBLIC_URL_BASE}/${type}/${filename}`;

    const { writeFileSync } = await import("fs");
    writeFileSync(filePath, buffer);

    return {
      success: true,
      filename,
      path: filePath,
      url: publicUrl,
      size: buffer.length,
      mimeType,
      storage: "local",
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Upload failed",
    };
  }
}

// =============================================================================
// DELETE FUNCTIONS
// =============================================================================

export function deleteFile(type: UploadType, filename: string): boolean {
  try {
    const filePath = join(UPLOAD_BASE_DIR, type, filename);
    if (existsSync(filePath)) {
      unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
}

async function deleteFromOci(url: string): Promise<boolean> {
  try {
    const client = await getS3Client();
    if (!client) {
      return false;
    }

    const match = url.match(/\/o\/(.+)$/);
    if (!match) {
      return false;
    }

    const objectKey = decodeURIComponent(match[1]);

    const command = new DeleteObjectCommand({
      Bucket: OCI_BUCKET,
      Key: objectKey,
    });

    await client.send(command);
    console.log(`🗑️ Deleted from OCI: ${objectKey}`);
    return true;
  } catch (error: any) {
    console.error("❌ OCI delete error:", error.message);
    return false;
  }
}

export async function deleteFileByUrl(url: string): Promise<boolean> {
  try {
    if (url.includes("objectstorage") && url.includes("oraclecloud.com")) {
      return await deleteFromOci(url);
    }

    const match = url.match(/\/uploads\/([^/]+)\/(.+)$/);
    if (!match) {
      return false;
    }

    const [, type, filename] = match;
    return deleteFile(type as UploadType, filename);
  } catch (error) {
    return false;
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

export function getFilePathFromUrl(url: string): string | null {
  const match = url.match(/\/uploads\/([^/]+)\/(.+)$/);
  if (!match) {
    return null;
  }
  const [, type, filename] = match;
  return join(UPLOAD_BASE_DIR, type, filename);
}

export function fileExists(type: UploadType, filename: string): boolean {
  const filePath = join(UPLOAD_BASE_DIR, type, filename);
  return existsSync(filePath);
}

export function getSupportedTypes(type: UploadType): string[] {
  return ALLOWED_MIME_TYPES[type] || [];
}

export function getUploadConfig() {
  return {
    baseDir: UPLOAD_BASE_DIR,
    urlBase: PUBLIC_URL_BASE,
    maxSize: MAX_FILE_SIZE,
    types: Object.keys(ALLOWED_MIME_TYPES) as UploadType[],
    mimeTypes: ALLOWED_MIME_TYPES,
    ociConfigured: isOciConfigured(),
    ociPublicUrlBase: OCI_PUBLIC_URL_BASE || null,
  };
}

export function initializeUploadDirectories(): void {
  const types: UploadType[] = [
    "products",
    "sellers",
    "banners",
    "categories",
    "blog",
    "temp",
    "avatars",
    "documents",
  ];

  for (const type of types) {
    ensureDirectory(type);
  }

  console.log(`✅ Upload directories initialized at ${UPLOAD_BASE_DIR}`);
  
  if (isOciConfigured()) {
    console.log(`✅ OCI Object Storage configured: ${OCI_BUCKET}`);
  } else {
    console.log(`⚠️ OCI not configured - using local storage only`);
  }
}

export async function cleanupTempFiles(maxAgeMs: number = 24 * 60 * 60 * 1000): Promise<number> {
  const { readdir, stat, unlink } = await import("fs/promises");
  const tempDir = join(UPLOAD_BASE_DIR, "temp");

  if (!existsSync(tempDir)) {
    return 0;
  }

  const now = Date.now();
  let deletedCount = 0;

  try {
    const files = await readdir(tempDir);

    for (const file of files) {
      const filePath = join(tempDir, file);
      const fileStat = await stat(filePath);

      if (now - fileStat.mtimeMs > maxAgeMs) {
        await unlink(filePath);
        deletedCount++;
      }
    }
  } catch (error) {
    console.error("Error cleaning up temp files:", error);
  }

  return deletedCount;
}
