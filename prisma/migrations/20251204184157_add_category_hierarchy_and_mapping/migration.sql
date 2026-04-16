-- CreateTable
CREATE TABLE "category_mappings" (
    "id" SERIAL NOT NULL,
    "targetCategory" TEXT NOT NULL,
    "matchType" TEXT NOT NULL,
    "matchValue" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "category_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "category_mappings_matchType_isActive_idx" ON "category_mappings"("matchType", "isActive");

-- CreateIndex
CREATE INDEX "category_mappings_targetCategory_idx" ON "category_mappings"("targetCategory");

-- CreateIndex
CREATE UNIQUE INDEX "category_mappings_targetCategory_matchType_matchValue_key" ON "category_mappings"("targetCategory", "matchType", "matchValue");

-- CreateIndex
CREATE INDEX "categories_parentId_idx" ON "categories"("parentId");

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
