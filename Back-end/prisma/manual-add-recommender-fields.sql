-- Recommender feature columns for vendor_profiles.
-- This project is managed with `prisma db push`, so the canonical way to apply
-- these is:  npx prisma db push
-- This file is provided for reference / manual application against a running DB:
--   psql "$DATABASE_URL" -f prisma/manual-add-recommender-fields.sql

ALTER TABLE "vendor_profiles" ADD COLUMN IF NOT EXISTS "latitude"      DOUBLE PRECISION;
ALTER TABLE "vendor_profiles" ADD COLUMN IF NOT EXISTS "longitude"     DOUBLE PRECISION;
ALTER TABLE "vendor_profiles" ADD COLUMN IF NOT EXISTS "completedJobs" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "vendor_profiles" ADD COLUMN IF NOT EXISTS "priceMin"      DOUBLE PRECISION;
ALTER TABLE "vendor_profiles" ADD COLUMN IF NOT EXISTS "priceMax"      DOUBLE PRECISION;
