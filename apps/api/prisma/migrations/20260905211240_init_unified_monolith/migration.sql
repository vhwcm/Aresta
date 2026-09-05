-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "current_streak" INTEGER NOT NULL DEFAULT 0,
    "longest_streak" INTEGER NOT NULL DEFAULT 0,
    "streak_freeze_count" INTEGER NOT NULL DEFAULT 0,
    "target_streak_days" INTEGER NOT NULL DEFAULT 7,
    "last_active_date" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_settings" (
    "user_id" INTEGER NOT NULL,
    "page_animation_enabled" BOOLEAN NOT NULL DEFAULT true,
    "page_crease_enabled" BOOLEAN NOT NULL DEFAULT true,
    "language" TEXT NOT NULL DEFAULT 'pt-BR',
    "native_language" TEXT NOT NULL DEFAULT 'pt-BR',
    "target_translation_language" TEXT NOT NULL DEFAULT 'en',
    "epub_font_size" INTEGER NOT NULL DEFAULT 18,
    "epub_font_family" TEXT NOT NULL DEFAULT 'newsreader',
    "theme_mode" TEXT NOT NULL DEFAULT 'dark',
    "desktop_home_graph_open" BOOLEAN NOT NULL DEFAULT false,
    "desktop_reader_graph_open" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_settings_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "app_config" (
    "key" TEXT NOT NULL,
    "value" TEXT,

    CONSTRAINT "app_config_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "daily_activities" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "date" TEXT NOT NULL,
    "reading_seconds" INTEGER NOT NULL DEFAULT 0,
    "flashcards_reviewed" INTEGER NOT NULL DEFAULT 0,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "is_frozen" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "books" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "cover_path" TEXT,
    "file_type" TEXT NOT NULL DEFAULT 'epub',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "books_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "book_public_infos" (
    "id" SERIAL NOT NULL,
    "book_id" INTEGER NOT NULL,
    "author" TEXT NOT NULL,
    "summary" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "book_public_infos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_books" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "book_id" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'QUERO_LER',
    "current_page" INTEGER NOT NULL DEFAULT 0,
    "last_accessed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_books_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "themes" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT DEFAULT '#E57B55',
    "description" TEXT,
    "embedding" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "themes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "theme_hierarchies" (
    "id" SERIAL NOT NULL,
    "parent_theme_id" INTEGER NOT NULL,
    "child_theme_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "theme_hierarchies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "book_themes" (
    "id" SERIAL NOT NULL,
    "book_id" INTEGER NOT NULL,
    "theme_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "book_themes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "annotations" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "book_id" INTEGER NOT NULL,
    "cfi" TEXT,
    "selected_text" TEXT,
    "note" TEXT,
    "chapter_title" TEXT,
    "progress" DOUBLE PRECISION DEFAULT 0.0,
    "embedding" vector(1536),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "annotations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "annotation_themes" (
    "id" SERIAL NOT NULL,
    "annotation_id" INTEGER NOT NULL,
    "theme_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "annotation_themes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flashcards" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "annotation_id" INTEGER NOT NULL,
    "book_id" INTEGER NOT NULL,
    "card_type" TEXT NOT NULL DEFAULT 'CONCEPT_RECALL',
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "context_summary" TEXT,
    "repetition_level" INTEGER NOT NULL DEFAULT 1,
    "next_review_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_reviewed_at" TIMESTAMP(3),
    "review_count" INTEGER NOT NULL DEFAULT 0,
    "difficulty" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "flashcards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_deck_cards" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "deck_date" TEXT NOT NULL,
    "flashcard_id" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "is_reviewed" BOOLEAN NOT NULL DEFAULT false,
    "rating" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_deck_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "didactic_booklets" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "book_id" INTEGER NOT NULL,
    "theme_id" INTEGER,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "target_audience" TEXT NOT NULL DEFAULT 'student',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "didactic_booklets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "didactic_booklet_chapters" (
    "id" SERIAL NOT NULL,
    "booklet_id" INTEGER NOT NULL,
    "order_index" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "flashcard_id" INTEGER,
    "annotation_id" INTEGER,
    "raw_markdown" TEXT NOT NULL,
    "diagram_count" INTEGER NOT NULL DEFAULT 0,
    "depth_level" TEXT NOT NULL DEFAULT 'standard',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "didactic_booklet_chapters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "canvases" (
    "id" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Quadro sem título',
    "description" TEXT,
    "folder" TEXT,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "data" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "canvases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notes" (
    "id" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Nota sem título',
    "content" TEXT NOT NULL DEFAULT '',
    "folder" TEXT,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "note_links" (
    "id" SERIAL NOT NULL,
    "source_note_id" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "note_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "daily_activities_user_id_date_key" ON "daily_activities"("user_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "book_public_infos_book_id_key" ON "book_public_infos"("book_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_books_user_id_book_id_key" ON "user_books"("user_id", "book_id");

-- CreateIndex
CREATE UNIQUE INDEX "themes_name_key" ON "themes"("name");

-- CreateIndex
CREATE UNIQUE INDEX "theme_hierarchies_parent_theme_id_child_theme_id_key" ON "theme_hierarchies"("parent_theme_id", "child_theme_id");

-- CreateIndex
CREATE UNIQUE INDEX "book_themes_book_id_theme_id_key" ON "book_themes"("book_id", "theme_id");

-- CreateIndex
CREATE INDEX "annotations_user_id_book_id_idx" ON "annotations"("user_id", "book_id");

-- CreateIndex
CREATE UNIQUE INDEX "annotation_themes_annotation_id_theme_id_key" ON "annotation_themes"("annotation_id", "theme_id");

-- CreateIndex
CREATE UNIQUE INDEX "flashcards_annotation_id_key" ON "flashcards"("annotation_id");

-- CreateIndex
CREATE INDEX "flashcards_user_id_next_review_at_idx" ON "flashcards"("user_id", "next_review_at");

-- CreateIndex
CREATE INDEX "daily_deck_cards_user_id_deck_date_position_idx" ON "daily_deck_cards"("user_id", "deck_date", "position");

-- CreateIndex
CREATE UNIQUE INDEX "daily_deck_cards_user_id_deck_date_flashcard_id_key" ON "daily_deck_cards"("user_id", "deck_date", "flashcard_id");

-- CreateIndex
CREATE INDEX "didactic_booklets_user_id_idx" ON "didactic_booklets"("user_id");

-- CreateIndex
CREATE INDEX "didactic_booklet_chapters_booklet_id_idx" ON "didactic_booklet_chapters"("booklet_id");

-- CreateIndex
CREATE UNIQUE INDEX "didactic_booklet_chapters_booklet_id_order_index_key" ON "didactic_booklet_chapters"("booklet_id", "order_index");

-- CreateIndex
CREATE INDEX "canvases_user_id_updated_at_idx" ON "canvases"("user_id", "updated_at");

-- CreateIndex
CREATE INDEX "canvases_user_id_folder_idx" ON "canvases"("user_id", "folder");

-- CreateIndex
CREATE INDEX "notes_user_id_updated_at_idx" ON "notes"("user_id", "updated_at");

-- CreateIndex
CREATE INDEX "note_links_source_note_id_target_type_target_id_idx" ON "note_links"("source_note_id", "target_type", "target_id");

-- AddForeignKey
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_activities" ADD CONSTRAINT "daily_activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "book_public_infos" ADD CONSTRAINT "book_public_infos_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_books" ADD CONSTRAINT "user_books_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_books" ADD CONSTRAINT "user_books_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "theme_hierarchies" ADD CONSTRAINT "theme_hierarchies_parent_theme_id_fkey" FOREIGN KEY ("parent_theme_id") REFERENCES "themes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "theme_hierarchies" ADD CONSTRAINT "theme_hierarchies_child_theme_id_fkey" FOREIGN KEY ("child_theme_id") REFERENCES "themes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "book_themes" ADD CONSTRAINT "book_themes_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "book_themes" ADD CONSTRAINT "book_themes_theme_id_fkey" FOREIGN KEY ("theme_id") REFERENCES "themes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "annotations" ADD CONSTRAINT "annotations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "annotations" ADD CONSTRAINT "annotations_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "annotation_themes" ADD CONSTRAINT "annotation_themes_annotation_id_fkey" FOREIGN KEY ("annotation_id") REFERENCES "annotations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "annotation_themes" ADD CONSTRAINT "annotation_themes_theme_id_fkey" FOREIGN KEY ("theme_id") REFERENCES "themes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flashcards" ADD CONSTRAINT "flashcards_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flashcards" ADD CONSTRAINT "flashcards_annotation_id_fkey" FOREIGN KEY ("annotation_id") REFERENCES "annotations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flashcards" ADD CONSTRAINT "flashcards_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_deck_cards" ADD CONSTRAINT "daily_deck_cards_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_deck_cards" ADD CONSTRAINT "daily_deck_cards_flashcard_id_fkey" FOREIGN KEY ("flashcard_id") REFERENCES "flashcards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "didactic_booklets" ADD CONSTRAINT "didactic_booklets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "didactic_booklets" ADD CONSTRAINT "didactic_booklets_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "didactic_booklets" ADD CONSTRAINT "didactic_booklets_theme_id_fkey" FOREIGN KEY ("theme_id") REFERENCES "themes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "didactic_booklet_chapters" ADD CONSTRAINT "didactic_booklet_chapters_booklet_id_fkey" FOREIGN KEY ("booklet_id") REFERENCES "didactic_booklets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "didactic_booklet_chapters" ADD CONSTRAINT "didactic_booklet_chapters_flashcard_id_fkey" FOREIGN KEY ("flashcard_id") REFERENCES "flashcards"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "didactic_booklet_chapters" ADD CONSTRAINT "didactic_booklet_chapters_annotation_id_fkey" FOREIGN KEY ("annotation_id") REFERENCES "annotations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "canvases" ADD CONSTRAINT "canvases_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "note_links" ADD CONSTRAINT "note_links_source_note_id_fkey" FOREIGN KEY ("source_note_id") REFERENCES "notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
