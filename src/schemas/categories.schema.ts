// ==========================================================
// STORESGO CATEGORIES SCHEMA — PHASE 18
// Type definitions for category API responses
// ==========================================================

export interface CategoryResult {
  id: number | null;       // null for static categories
  name: string;
  slug: string;
  icon?: string | null;
  image?: string | null;
  tagline?: string | null;
  color?: string | null;
  sortOrder?: number | null;
  parentId?: number | null;
  type: "static" | "dynamic";
}

export interface CategoryWithChildren extends CategoryResult {
  children: CategoryResult[];
}

export interface CategoryDetail {
  category: CategoryResult;
  children: CategoryResult[];
  parentsBreadcrumb: CategoryResult[];
}
