-- AlterTable
ALTER TABLE "books" ADD COLUMN     "locations_per_section" JSONB,
ADD COLUMN     "total_locations" INTEGER;
