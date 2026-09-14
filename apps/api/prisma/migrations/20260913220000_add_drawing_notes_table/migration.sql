-- CreateTable
CREATE TABLE "drawing_notes" (
    "id" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Desenho sem título',
    "folder" TEXT,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "pages_data" TEXT NOT NULL,
    "preview_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "drawing_notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "drawing_notes_user_id_updated_at_idx" ON "drawing_notes"("user_id", "updated_at");

-- CreateIndex
CREATE INDEX "drawing_notes_user_id_folder_idx" ON "drawing_notes"("user_id", "folder");

-- AddForeignKey
ALTER TABLE "drawing_notes" ADD CONSTRAINT "drawing_notes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
