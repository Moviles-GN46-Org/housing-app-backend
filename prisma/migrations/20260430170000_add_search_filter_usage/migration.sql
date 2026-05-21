-- CreateTable
CREATE TABLE "SearchFilterUsage" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT NOT NULL,
    "filterCategory" TEXT NOT NULL,
    "filterValue" TEXT NOT NULL,
    "metadata" JSONB,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SearchFilterUsage_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SearchFilterUsage"
ADD CONSTRAINT "SearchFilterUsage_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "SearchFilterUsage_appliedAt_idx" ON "SearchFilterUsage"("appliedAt");

-- CreateIndex
CREATE INDEX "SearchFilterUsage_filterCategory_idx" ON "SearchFilterUsage"("filterCategory");

-- CreateIndex
CREATE INDEX "SearchFilterUsage_filterCategory_filterValue_idx" ON "SearchFilterUsage"("filterCategory", "filterValue");

-- CreateIndex
CREATE INDEX "SearchFilterUsage_sessionId_appliedAt_idx" ON "SearchFilterUsage"("sessionId", "appliedAt");

-- CreateIndex
CREATE INDEX "SearchFilterUsage_userId_appliedAt_idx" ON "SearchFilterUsage"("userId", "appliedAt");
