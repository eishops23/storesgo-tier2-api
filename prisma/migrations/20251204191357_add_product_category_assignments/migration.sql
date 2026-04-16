-- CreateTable
CREATE TABLE "product_category_assignments" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "assignedBy" TEXT NOT NULL DEFAULT 'system',
    "reviewStatus" TEXT NOT NULL DEFAULT 'auto',
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_category_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "product_category_assignments_productId_idx" ON "product_category_assignments"("productId");

-- CreateIndex
CREATE INDEX "product_category_assignments_categoryId_idx" ON "product_category_assignments"("categoryId");

-- CreateIndex
CREATE INDEX "product_category_assignments_reviewStatus_idx" ON "product_category_assignments"("reviewStatus");

-- CreateIndex
CREATE INDEX "product_category_assignments_confidence_idx" ON "product_category_assignments"("confidence");

-- CreateIndex
CREATE UNIQUE INDEX "product_category_assignments_productId_categoryId_key" ON "product_category_assignments"("productId", "categoryId");

-- AddForeignKey
ALTER TABLE "product_category_assignments" ADD CONSTRAINT "product_category_assignments_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_category_assignments" ADD CONSTRAINT "product_category_assignments_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
