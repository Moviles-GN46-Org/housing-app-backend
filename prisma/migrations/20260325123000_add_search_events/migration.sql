-- CreateEnum
CREATE TYPE "SearchEventSource" AS ENUM ('house_list', 'map');

-- CreateTable
CREATE TABLE "SearchEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT NOT NULL,
    "query" TEXT,
    "city" TEXT NOT NULL,
    "neighborhood" TEXT,
    "canonicalZone" TEXT NOT NULL,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "radiusKm" DOUBLE PRECISION,
    "filters" JSONB,
    "filtersHash" TEXT NOT NULL,
    "source" "SearchEventSource" NOT NULL,
    "searchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SearchEvent_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SearchEvent"
ADD CONSTRAINT "SearchEvent_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "SearchEvent_searchedAt_idx" ON "SearchEvent"("searchedAt");

-- CreateIndex
CREATE INDEX "SearchEvent_city_canonicalZone_idx" ON "SearchEvent"("city", "canonicalZone");

-- CreateIndex
CREATE INDEX "SearchEvent_city_canonicalZone_searchedAt_idx" ON "SearchEvent"("city", "canonicalZone", "searchedAt");

-- CreateIndex
CREATE INDEX "SearchEvent_sessionId_searchedAt_idx" ON "SearchEvent"("sessionId", "searchedAt");

-- CreateIndex
CREATE INDEX "SearchEvent_userId_searchedAt_idx" ON "SearchEvent"("userId", "searchedAt");

-- CreateIndex
CREATE INDEX "SearchEvent_filtersHash_idx" ON "SearchEvent"("filtersHash");
