export type ProductSortOption =
  | "price_asc"
  | "price_desc"
  | "newest"
  | "name_asc"
  | "name_desc";

export interface ProductListQuery {
  page?: number;
  pageSize?: number;
  q?: string;
  sellerId?: number;
  categoryId?: number;
  taxonomyId?: number; // Alias for categoryId (frontend compatibility)
  minPrice?: number;
  maxPrice?: number;
  sort?: ProductSortOption;
}

export interface ProductSearchQuery {
  q: string;
  page?: number;
  pageSize?: number;
}

// ==========================================================
// PDP (Product Detail Page) Response Types
// Re-exported from products.service.ts for convenience
// ==========================================================
export type {
  ProductDetail,
  ProductDetailSeller,
  ProductDetailCategory,
  ProductDetailReview,
  RelatedProductItem,
} from "../services/products.service.js";