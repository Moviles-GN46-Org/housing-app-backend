CREATE TABLE IF NOT EXISTS "University" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "normalizedName" TEXT NOT NULL,
  "aliases" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "city" TEXT,
  "latitude" DOUBLE PRECISION NOT NULL,
  "longitude" DOUBLE PRECISION NOT NULL,
  "defaultRadiusKm" DOUBLE PRECISION NOT NULL DEFAULT 2,
  "isDefault" BOOLEAN NOT NULL DEFAULT FALSE,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "University_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "University_normalizedName_key" ON "University"("normalizedName");
CREATE INDEX IF NOT EXISTS "University_isActive_idx" ON "University"("isActive");
CREATE INDEX IF NOT EXISTS "University_isDefault_idx" ON "University"("isDefault");

INSERT INTO "University" (
  "id",
  "name",
  "normalizedName",
  "aliases",
  "city",
  "latitude",
  "longitude",
  "defaultRadiusKm",
  "isDefault",
  "isActive"
)
VALUES (
  'uniandes',
  'Universidad de los Andes',
  'uniandes',
  '["universidad de los andes", "los andes", "uniandes"]'::jsonb,
  'Bogotá',
  4.6014,
  -74.0661,
  2,
  TRUE,
  TRUE
)
ON CONFLICT ("normalizedName") DO NOTHING;