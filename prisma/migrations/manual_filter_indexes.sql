-- ================================================================
-- STORESGO FILTER SYSTEM INDEXES - Production Scale Optimization
-- Designed for millions of products, sellers, buyers
-- ================================================================

-- ProductAttribute indexes for fast faceted filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_attribute_key_value 
ON "ProductAttribute" (key, value);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_attribute_product_key 
ON "ProductAttribute" ("productId", key);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_attribute_key 
ON "ProductAttribute" (key);

-- Product search and filter indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_category_active 
ON "Product" ("categoryId", "isActive") WHERE "isActive" = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_store_active 
ON "Product" ("storeId", "isActive") WHERE "isActive" = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_price_active 
ON "Product" ("priceCents", "isActive") WHERE "isActive" = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_seller_active 
ON "Product" ("sellerId", "isActive") WHERE "isActive" = true;

-- Full-text search index on product name and description
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_name_trgm 
ON "Product" USING gin (name gin_trgm_ops);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_search_vector 
ON "Product" USING gin (to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, '')));

-- Category hierarchy optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_category_parent_sort 
ON "Category" ("parentId", "sortOrder");

-- ProductCategoryAssignment for multi-category
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pca_category_status 
ON "ProductCategoryAssignment" ("categoryId", "reviewStatus");

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pca_product 
ON "ProductCategoryAssignment" ("productId");

-- FilterConfig quick lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_filter_config_category_active 
ON "FilterConfig" ("categorySlug", "isActive");
