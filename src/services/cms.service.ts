/**
 * CMS Service
 * CRUD operations for homepage blocks and footer content
 */

import { prisma } from "../plugins/prisma.js";
import type { Prisma } from "@prisma/client";

// ==========================================================
// 📦 CMS Block Operations
// ==========================================================

export interface CmsBlockInput {
  key: string;
  name: string;
  type: "hero" | "banner" | "text" | "image" | "html" | "json";
  title?: string;
  subtitle?: string;
  content?: string;
  imageUrl?: string;
  linkUrl?: string;
  linkText?: string;
  metadata?: Record<string, any>;
  order?: number;
  isActive?: boolean;
  startDate?: Date;
  endDate?: Date;
}

export interface CmsBlockUpdate {
  name?: string;
  type?: string;
  title?: string;
  subtitle?: string;
  content?: string;
  imageUrl?: string;
  linkUrl?: string;
  linkText?: string;
  metadata?: Record<string, any>;
  order?: number;
  isActive?: boolean;
  startDate?: Date | null;
  endDate?: Date | null;
}

/**
 * Get all CMS blocks (for admin)
 */
export async function getAllBlocks(options?: {
  type?: string;
  isActive?: boolean;
}) {
  const where: Prisma.CmsBlockWhereInput = {};
  
  if (options?.type) {
    where.type = options.type;
  }
  
  if (options?.isActive !== undefined) {
    where.isActive = options.isActive;
  }

  return prisma.cmsBlock.findMany({
    where,
    orderBy: { order: "asc" },
  });
}

/**
 * Get active CMS blocks (for frontend)
 */
export async function getActiveBlocks(options?: {
  type?: string;
  keys?: string[];
}) {
  const now = new Date();
  
  const where: Prisma.CmsBlockWhereInput = {
    isActive: true,
    OR: [
      { startDate: null },
      { startDate: { lte: now } },
    ],
    AND: [
      {
        OR: [
          { endDate: null },
          { endDate: { gte: now } },
        ],
      },
    ],
  };

  if (options?.type) {
    where.type = options.type;
  }

  if (options?.keys && options.keys.length > 0) {
    where.key = { in: options.keys };
  }

  return prisma.cmsBlock.findMany({
    where,
    orderBy: { order: "asc" },
  });
}

/**
 * Get a single CMS block by key
 */
export async function getBlockByKey(key: string) {
  return prisma.cmsBlock.findUnique({
    where: { key },
  });
}

/**
 * Get a single CMS block by ID
 */
export async function getBlockById(id: number) {
  return prisma.cmsBlock.findUnique({
    where: { id },
  });
}

/**
 * Create a new CMS block
 */
export async function createBlock(input: CmsBlockInput) {
  return prisma.cmsBlock.create({
    data: {
      key: input.key,
      name: input.name,
      type: input.type,
      title: input.title,
      subtitle: input.subtitle,
      content: input.content,
      imageUrl: input.imageUrl,
      linkUrl: input.linkUrl,
      linkText: input.linkText,
      metadata: input.metadata || {},
      order: input.order ?? 0,
      isActive: input.isActive ?? true,
      startDate: input.startDate,
      endDate: input.endDate,
    },
  });
}

/**
 * Update a CMS block
 */
export async function updateBlock(id: number, input: CmsBlockUpdate) {
  return prisma.cmsBlock.update({
    where: { id },
    data: input,
  });
}

/**
 * Update a CMS block by key
 */
export async function updateBlockByKey(key: string, input: CmsBlockUpdate) {
  return prisma.cmsBlock.update({
    where: { key },
    data: input,
  });
}

/**
 * Delete a CMS block
 */
export async function deleteBlock(id: number) {
  return prisma.cmsBlock.delete({
    where: { id },
  });
}

/**
 * Reorder blocks
 */
export async function reorderBlocks(orders: Array<{ id: number; order: number }>) {
  const updates = orders.map(({ id, order }) =>
    prisma.cmsBlock.update({
      where: { id },
      data: { order },
    })
  );

  return prisma.$transaction(updates);
}

// ==========================================================
// 🦶 Footer Link Operations
// ==========================================================

export interface FooterLinkInput {
  title: string;
  url: string;
  section?: string;
  order?: number;
  isActive?: boolean;
  openInNewTab?: boolean;
  icon?: string;
}

export interface FooterLinkUpdate {
  title?: string;
  url?: string;
  section?: string;
  order?: number;
  isActive?: boolean;
  openInNewTab?: boolean;
  icon?: string;
}

/**
 * Get all footer links (for admin)
 */
export async function getAllFooterLinks(options?: {
  section?: string;
  isActive?: boolean;
}) {
  const where: Prisma.FooterLinkWhereInput = {};
  
  if (options?.section) {
    where.section = options.section;
  }
  
  if (options?.isActive !== undefined) {
    where.isActive = options.isActive;
  }

  return prisma.footerLink.findMany({
    where,
    orderBy: [{ section: "asc" }, { order: "asc" }],
  });
}

/**
 * Get active footer links (for frontend)
 */
export async function getActiveFooterLinks() {
  const links = await prisma.footerLink.findMany({
    where: { isActive: true },
    orderBy: [{ section: "asc" }, { order: "asc" }],
  });

  // Group by section
  const grouped: Record<string, typeof links> = {};
  for (const link of links) {
    const section = link.section || "main";
    if (!grouped[section]) {
      grouped[section] = [];
    }
    grouped[section].push(link);
  }

  return grouped;
}

/**
 * Get footer link by ID
 */
export async function getFooterLinkById(id: number) {
  return prisma.footerLink.findUnique({
    where: { id },
  });
}

/**
 * Create a footer link
 */
export async function createFooterLink(input: FooterLinkInput) {
  return prisma.footerLink.create({
    data: {
      title: input.title,
      url: input.url,
      section: input.section ?? "main",
      order: input.order ?? 0,
      isActive: input.isActive ?? true,
      openInNewTab: input.openInNewTab ?? false,
      icon: input.icon,
    },
  });
}

/**
 * Update a footer link
 */
export async function updateFooterLink(id: number, input: FooterLinkUpdate) {
  return prisma.footerLink.update({
    where: { id },
    data: input,
  });
}

/**
 * Delete a footer link
 */
export async function deleteFooterLink(id: number) {
  return prisma.footerLink.delete({
    where: { id },
  });
}

// ==========================================================
// 📄 Footer Content Operations
// ==========================================================

export interface FooterContentInput {
  key: string;
  content: string;
  isActive?: boolean;
}

export interface FooterContentUpdate {
  content?: string;
  isActive?: boolean;
}

/**
 * Get all footer content (for admin)
 */
export async function getAllFooterContent() {
  return prisma.footerContent.findMany({
    orderBy: { key: "asc" },
  });
}

/**
 * Get active footer content (for frontend)
 */
export async function getActiveFooterContent() {
  const content = await prisma.footerContent.findMany({
    where: { isActive: true },
  });

  // Convert to key-value map
  const contentMap: Record<string, string> = {};
  for (const item of content) {
    contentMap[item.key] = item.content ?? '';
  }

  return contentMap;
}

/**
 * Get footer content by key
 */
export async function getFooterContentByKey(key: string) {
  return prisma.footerContent.findUnique({
    where: { key },
  });
}

/**
 * Create or update footer content
 */
export async function upsertFooterContent(input: FooterContentInput) {
  return prisma.footerContent.upsert({
    where: { key: input.key },
    update: {
      content: input.content,
      isActive: input.isActive ?? true,
    },
    create: {
      key: input.key,
      content: input.content,
      isActive: input.isActive ?? true,
    },
  });
}

/**
 * Delete footer content
 */
export async function deleteFooterContent(key: string) {
  return prisma.footerContent.delete({
    where: { key },
  });
}

// ==========================================================
// 🏠 Homepage Feed (combines blocks for frontend)
// ==========================================================

export async function getHomepageCmsContent() {
  const [blocks, heroSlides] = await Promise.all([
    getActiveBlocks(),
    prisma.heroSlide.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  // Organize blocks by type
  const hero = blocks.filter(b => b.type === "hero");
  const banners = blocks.filter(b => b.type === "banner");
  const textModules = blocks.filter(b => b.type === "text" || b.type === "html");
  const promotions = blocks.filter(b => b.type === "json" && b.key.includes("promo"));

  return {
    heroSlides,
    hero,
    banners,
    textModules,
    promotions,
    allBlocks: blocks,
  };
}

/**
 * Get complete footer data for frontend
 */
export async function getFooterData() {
  const [links, content] = await Promise.all([
    getActiveFooterLinks(),
    getActiveFooterContent(),
  ]);

  return {
    links,
    content,
  };
}

