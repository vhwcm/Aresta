-- DropIndex
DROP INDEX IF EXISTS "themes_name_key";

-- AlterTable
ALTER TABLE "themes" ADD COLUMN IF NOT EXISTS "user_id" INTEGER;

-- Backfill existing themes to the first registered user if any exists
UPDATE "themes"
SET "user_id" = (SELECT id FROM "users" ORDER BY id ASC LIMIT 1)
WHERE "user_id" IS NULL AND EXISTS (SELECT 1 FROM "users");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "themes_user_id_idx" ON "themes"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "themes_user_id_name_key" ON "themes"("user_id", "name");

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'themes_user_id_fkey'
  ) THEN
    ALTER TABLE "themes" ADD CONSTRAINT "themes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
