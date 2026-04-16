// ==========================================================
// STORESGO ADMIN SEO SERVICE — PHASE 7D
// Admin-only SEO page management services
// ==========================================================

import { prisma } from "../plugins/prisma.js";
import { getPagination } from "../utils/pagination.js";

// ---------------------------------------------------------
// TYPES
// ---------------------------------------------------------

export type SeoPageType = "page" | "blog" | "guide" | "deal" | "landing";

export interface AdminSeoPageListQuery {
  page?: number;
  pageSize?: number;
  type?: string;
  published?: boolean;
  q?: string;
}

export interface AdminSeoPageCreateData {
  type?: string;
  slug: string;
  title: string;
  content?: string;
  metaTitle?: string;
  metaDescription?: string;
  published?: boolean;
  publishedAt?: Date;
}

export interface AdminSeoPageUpdateData {
  type?: string;
  slug?: string;
  title?: string;
  content?: string;
  metaTitle?: string;
  metaDescription?: string;
  published?: boolean;
  publishedAt?: Date | null;
}

interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

// ---------------------------------------------------------
// LIST SEO PAGES (ADMIN)
// ---------------------------------------------------------

/**
 * List all SEO pages for admin with filtering and pagination
 * Includes unpublished pages
 */
export async function listAdminSeoPages(
  query: AdminSeoPageListQuery
): Promise<PaginatedResult<any>> {
  const { page, pageSize, skip, take } = getPagination({
    page: query.page,
    pageSize: query.pageSize,
  });

  const where: any = {};

  // Filter by type
  if (query.type) {
    where.type = query.type;
  }

  // Filter by published status
  if (query.published !== undefined) {
    where.published = query.published;
  }

  // Search by title or slug
  if (query.q) {
    where.OR = [
      { title: { contains: query.q, mode: "insensitive" } },
      { slug: { contains: query.q, mode: "insensitive" } },
      { metaDescription: { contains: query.q, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.seoPage.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        type: true,
        title: true,
        slug: true,
        metaTitle: true,
        metaDescription: true,
        published: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
        // Exclude contentHtml and embedding from list for performance
      },
    }),
    prisma.seoPage.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

// ---------------------------------------------------------
// GET SEO PAGE BY ID (ADMIN)
// ---------------------------------------------------------

/**
 * Get SEO page by ID with full content
 */
export async function getAdminSeoPageById(id: number) {
  return prisma.seoPage.findUnique({
    where: { id },
    select: {
      id: true,
      type: true,
      title: true,
      slug: true,
      metaTitle: true,
      metaDescription: true,
      contentHtml: true,
      published: true,
      publishedAt: true,
      createdAt: true,
      updatedAt: true,
      // Exclude embedding vector for API response
    },
  });
}

// ---------------------------------------------------------
// CREATE SEO PAGE (ADMIN)
// ---------------------------------------------------------

/**
 * Create a new SEO page
 */
export async function createAdminSeoPage(data: AdminSeoPageCreateData) {
  return prisma.seoPage.create({
    data: {
      type: data.type ?? "page",
      slug: data.slug,
      title: data.title,
      contentHtml: data.content,
      metaTitle: data.metaTitle,
      metaDescription: data.metaDescription,
      published: data.published ?? false,
      publishedAt: data.publishedAt,
      embedding: [], // Required field, default empty
    },
    select: {
      id: true,
      type: true,
      title: true,
      slug: true,
      metaTitle: true,
      metaDescription: true,
      contentHtml: true,
      published: true,
      publishedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

// ---------------------------------------------------------
// UPDATE SEO PAGE (ADMIN)
// ---------------------------------------------------------

/**
 * Allowed fields for admin SEO page updates
 */
const ALLOWED_UPDATE_FIELDS = [
  "type",
  "slug",
  "title",
  "metaTitle",
  "metaDescription",
  "contentHtml",
  "published",
  "publishedAt",
];

/**
 * Update SEO page with safe field validation
 */
export async function updateAdminSeoPage(
  id: number,
  data: AdminSeoPageUpdateData
) {
  // Filter to only allowed fields
  const safeData: Record<string, any> = {};

  // Handle content field mapping
  if (data.content !== undefined) {
    safeData.contentHtml = data.content;
  }

  for (const field of ALLOWED_UPDATE_FIELDS) {
    const key = field as keyof AdminSeoPageUpdateData;
    if (key !== "content" && data[key] !== undefined) {
      safeData[field] = data[key];
    }
  }

  // If setting published=true and no publishedAt, set it to now
  if (safeData.published === true && !safeData.publishedAt) {
    const existing = await prisma.seoPage.findUnique({
      where: { id },
      select: { publishedAt: true },
    });
    if (!existing?.publishedAt) {
      safeData.publishedAt = new Date();
    }
  }

  return prisma.seoPage.update({
    where: { id },
    data: safeData,
    select: {
      id: true,
      type: true,
      title: true,
      slug: true,
      metaTitle: true,
      metaDescription: true,
      contentHtml: true,
      published: true,
      publishedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

// ---------------------------------------------------------
// DELETE SEO PAGE (ADMIN)
// ---------------------------------------------------------

/**
 * Delete SEO page (hard delete)
 * Note: No soft delete field exists in the current schema
 */
export async function deleteAdminSeoPage(id: number) {
  return prisma.seoPage.delete({ where: { id } });
}

