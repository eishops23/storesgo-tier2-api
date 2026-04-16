// ==========================================================
// STORESGO PAGINATION UTILITIES — ENHANCED FOR LARGE DATASETS
// Supports both offset-based and cursor-based pagination
// ==========================================================

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  maxPageSize?: number;
}

export interface PaginationResult {
  page: number;
  pageSize: number;
  skip: number;
  take: number;
}

/**
 * Standardized pagination info returned in API responses
 */
export interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/**
 * Standardized paginated response shape for all list endpoints
 * Format: { ok: true, page, pageSize, total, totalPages, data }
 */
export interface PaginatedResponse<T> {
  ok: true;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  data: T[];
}

// ==========================================================
// Cursor-based pagination for large datasets
// ==========================================================

export interface CursorPaginationParams {
  cursor?: string; // ID of the last item from previous page
  limit?: number;
  direction?: "forward" | "backward";
}

export interface CursorPaginationResult {
  take: number;
  cursor?: { id: number };
  skip?: number;
}

export interface CursorPaginationInfo {
  hasMore: boolean;
  nextCursor?: string;
  prevCursor?: string;
  limit: number;
}

export interface CursorPaginatedResponse<T> {
  data: T[];
  pagination: CursorPaginationInfo;
}

/**
 * Parse and validate pagination params from query string
 */
export function getPagination({
  page = 1,
  pageSize = 20,
  maxPageSize = 100,
}: PaginationParams): PaginationResult {
  const p = Number(page);
  const s = Number(pageSize);

  const safePage = Number.isFinite(p) && p > 0 ? Math.floor(p) : 1;
  let safeSize = Number.isFinite(s) && s > 0 ? Math.floor(s) : 20;

  if (maxPageSize && safeSize > maxPageSize) {
    safeSize = maxPageSize;
  }

  const skip = (safePage - 1) * safeSize;
  const take = safeSize;

  return { page: safePage, pageSize: safeSize, skip, take };
}

/**
 * Build standardized pagination info object
 */
export function buildPaginationInfo(
  page: number,
  pageSize: number,
  total: number
): PaginationInfo {
  return {
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize) || 1,
  };
}

/**
 * Build complete paginated response
 * Format: { ok: true, page, pageSize, total, totalPages, data }
 */
export function buildPaginatedResponse<T>(
  data: T[],
  page: number,
  pageSize: number,
  total: number
): PaginatedResponse<T> {
  return {
    ok: true,
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize) || 1,
    data,
  };
}

// ==========================================================
// CURSOR-BASED PAGINATION (for large datasets like 38K products)
// ==========================================================

/**
 * Parse cursor-based pagination params
 * @param params Query parameters
 * @param maxLimit Maximum items per request (default 100)
 */
export function getCursorPagination(
  params: CursorPaginationParams,
  maxLimit: number = 100
): CursorPaginationResult {
  const limit = Math.min(
    Math.max(1, Number(params.limit) || 20),
    maxLimit
  );

  const result: CursorPaginationResult = {
    take: limit + 1, // Take one extra to determine if there are more items
  };

  if (params.cursor) {
    const cursorId = parseInt(params.cursor, 10);
    if (!isNaN(cursorId) && cursorId > 0) {
      result.cursor = { id: cursorId };
      result.skip = 1; // Skip the cursor item itself
    }
  }

  return result;
}

/**
 * Build cursor-based paginated response
 * @param items Items returned from database (includes extra item for hasMore check)
 * @param limit Requested limit
 * @param getItemId Function to extract ID from an item
 */
export function buildCursorPaginatedResponse<T extends { id: number }>(
  items: T[],
  limit: number,
  getItemId: (item: T) => number = (item) => item.id
): CursorPaginatedResponse<T> {
  // Check if there are more items
  const hasMore = items.length > limit;
  
  // Remove the extra item if present
  const data = hasMore ? items.slice(0, limit) : items;
  
  // Get cursors
  const nextCursor = hasMore && data.length > 0 
    ? String(getItemId(data[data.length - 1]))
    : undefined;

  return {
    data,
    pagination: {
      hasMore,
      nextCursor,
      limit,
    },
  };
}

// ==========================================================
// STREAMING / BATCH PROCESSING (for very large imports)
// ==========================================================

export interface BatchProcessingOptions {
  batchSize?: number;
  onProgress?: (processed: number, total?: number) => void;
}

/**
 * Process items in batches (useful for large imports)
 */
export async function processBatches<T, R>(
  items: T[],
  processor: (batch: T[]) => Promise<R[]>,
  options: BatchProcessingOptions = {}
): Promise<R[]> {
  const { batchSize = 100, onProgress } = options;
  const results: R[] = [];
  let processed = 0;

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await processor(batch);
    results.push(...batchResults);
    
    processed += batch.length;
    if (onProgress) {
      onProgress(processed, items.length);
    }
  }

  return results;
}

/**
 * Create a generator for streaming large datasets
 */
export async function* streamPaginatedData<T>(
  fetcher: (cursor: string | undefined, limit: number) => Promise<{ data: T[]; nextCursor?: string }>,
  options: { batchSize?: number; maxItems?: number } = {}
): AsyncGenerator<T[], void, unknown> {
  const { batchSize = 100, maxItems } = options;
  let cursor: string | undefined;
  let totalFetched = 0;

  while (true) {
    const { data, nextCursor } = await fetcher(cursor, batchSize);
    
    if (data.length === 0) {
      break;
    }

    yield data;
    totalFetched += data.length;

    if (!nextCursor || (maxItems && totalFetched >= maxItems)) {
      break;
    }

    cursor = nextCursor;
  }
}

// ==========================================================
// QUERY OPTIMIZATION HELPERS
// ==========================================================

/**
 * Build efficient where clause for ID-based cursor pagination
 * This is more efficient than offset for large datasets
 */
export function buildCursorWhereClause(
  cursor: string | undefined,
  direction: "forward" | "backward" = "forward"
): { id?: { gt?: number; lt?: number } } {
  if (!cursor) {
    return {};
  }

  const cursorId = parseInt(cursor, 10);
  if (isNaN(cursorId)) {
    return {};
  }

  return direction === "forward"
    ? { id: { gt: cursorId } }
    : { id: { lt: cursorId } };
}

/**
 * Estimate page from cursor for display purposes
 * (Provides approximate page number for cursor-based pagination)
 */
export async function estimatePageFromCursor(
  totalCount: number,
  pageSize: number,
  currentCursorId: number,
  countBeforeCursor: () => Promise<number>
): Promise<{ estimatedPage: number; totalPages: number }> {
  const itemsBefore = await countBeforeCursor();
  const estimatedPage = Math.floor(itemsBefore / pageSize) + 1;
  const totalPages = Math.ceil(totalCount / pageSize);

  return { estimatedPage, totalPages };
}

// ==========================================================
// LARGE DATASET QUERY HELPERS
// ==========================================================

/**
 * Optimized query builder for large product datasets
 * Uses cursor-based pagination with efficient indexing
 */
export function buildLargeDatasetQuery(params: {
  cursor?: string;
  limit?: number;
  orderBy?: "id" | "createdAt" | "name" | "price";
  orderDirection?: "asc" | "desc";
  filters?: Record<string, any>;
}) {
  const {
    cursor,
    limit = 20,
    orderBy = "id",
    orderDirection = "asc",
    filters = {},
  } = params;

  // Build where clause with cursor
  const cursorWhere = cursor
    ? buildCursorWhereClause(cursor, orderDirection === "asc" ? "forward" : "backward")
    : {};

  // Merge with existing filters
  const where = {
    ...filters,
    ...cursorWhere,
  };

  // Build order by clause
  const orderByClause: Record<string, "asc" | "desc"> = {};
  orderByClause[orderBy] = orderDirection;

  // Always add id as secondary sort for consistency
  if (orderBy !== "id") {
    orderByClause.id = orderDirection;
  }

  return {
    where,
    orderBy: orderByClause,
    take: Math.min(limit + 1, 101), // Max 100 items, +1 for hasMore check
  };
}
