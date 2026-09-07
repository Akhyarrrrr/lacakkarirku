ALTER TABLE "jobs" ADD COLUMN "last_checked_at" timestamp DEFAULT now();
ALTER TABLE "jobs" ADD COLUMN "expires_at" timestamp;
ALTER TABLE "jobs" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;
ALTER TABLE "jobs" ADD COLUMN "source_reliability" text DEFAULT 'unverified' NOT NULL;
ALTER TABLE "cv_data" DROP CONSTRAINT IF EXISTS "cv_data_user_id_unique";
ALTER TABLE "cv_data" ADD COLUMN "name" text DEFAULT 'CV Utama' NOT NULL;
ALTER TABLE "cv_data" ADD COLUMN "target_role" text;
ALTER TABLE "cv_data" ADD COLUMN "is_default" boolean DEFAULT false NOT NULL;
UPDATE "cv_data" SET "is_default" = true
WHERE "id" IN (SELECT DISTINCT ON ("user_id") "id" FROM "cv_data" ORDER BY "user_id", "updated_at" DESC);
CREATE UNIQUE INDEX "cv_data_one_default_per_user" ON "cv_data" ("user_id") WHERE "is_default" = true;
CREATE INDEX "jobs_active_checked_idx" ON "jobs" ("is_active", "last_checked_at" DESC);
