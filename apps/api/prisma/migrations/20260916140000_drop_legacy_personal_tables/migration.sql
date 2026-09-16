-- Migration: Drop Legacy Personal Data Tables
-- Preserves: users, accounts, app_config, books, book_public_infos, feedbacks

-- Drop Dependent Foreign Key Tables First
DROP TABLE IF EXISTS "note_links" CASCADE;
DROP TABLE IF EXISTS "didactic_booklet_chapters" CASCADE;
DROP TABLE IF EXISTS "didactic_booklets" CASCADE;
DROP TABLE IF EXISTS "daily_deck_cards" CASCADE;
DROP TABLE IF EXISTS "flashcards" CASCADE;
DROP TABLE IF EXISTS "annotation_themes" CASCADE;
DROP TABLE IF EXISTS "annotations" CASCADE;
DROP TABLE IF EXISTS "book_themes" CASCADE;
DROP TABLE IF EXISTS "theme_hierarchies" CASCADE;
DROP TABLE IF EXISTS "themes" CASCADE;
DROP TABLE IF EXISTS "drawing_notes" CASCADE;
DROP TABLE IF EXISTS "notes" CASCADE;
DROP TABLE IF EXISTS "canvases" CASCADE;
DROP TABLE IF EXISTS "daily_activities" CASCADE;
DROP TABLE IF EXISTS "user_books" CASCADE;
DROP TABLE IF EXISTS "user_settings" CASCADE;

-- Remove legacy columns from users if present
ALTER TABLE "users" DROP COLUMN IF EXISTS "current_streak";
ALTER TABLE "users" DROP COLUMN IF EXISTS "longest_streak";
ALTER TABLE "users" DROP COLUMN IF EXISTS "streak_freeze_count";
ALTER TABLE "users" DROP COLUMN IF EXISTS "target_streak_days";
ALTER TABLE "users" DROP COLUMN IF EXISTS "last_active_date";
