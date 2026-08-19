-- Migration: Move Deliverable base64 content to Supabase Storage
-- Step 1: Add storageUrl column (if not exists)
ALTER TABLE "Deliverable" ADD COLUMN "storageUrl" TEXT;

-- Step 2 (manual): Migrate existing base64 data to storage and populate storageUrl.
-- After migration, the `content` column can be dropped in a subsequent migration.
-- NOTE: In production, run a data-migration script before dropping `content`.

-- Step 3 (future): Once all rows are migrated, run:
-- ALTER TABLE "Deliverable" DROP COLUMN "content";
-- ALTER TABLE "Deliverable" DROP COLUMN "contentEncoding";
-- ALTER TABLE "Deliverable" DROP COLUMN "mimeType";
