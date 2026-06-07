CREATE TABLE "cv_data" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"full_text" text NOT NULL,
	"skills" jsonb,
	"experience" jsonb,
	"education" jsonb,
	"certifications" jsonb,
	"keywords" text[],
	"parsed_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "cv_data_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"company" text NOT NULL,
	"description" text,
	"requirements" text,
	"location" text,
	"job_type" text,
	"salary_min" integer,
	"salary_max" integer,
	"currency" text DEFAULT 'IDR',
	"link" text NOT NULL,
	"source" text NOT NULL,
	"scraped_at" timestamp DEFAULT now(),
	"posted_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "unique_link_source" UNIQUE("link","source")
);
--> statement-breakpoint
CREATE TABLE "matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"cv_id" uuid NOT NULL,
	"match_score" integer,
	"skills_match" integer,
	"experience_match" integer,
	"keywords_match" integer,
	"breakdown" jsonb,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "unique_job_cv" UNIQUE("job_id","cv_id")
);
--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_cv_id_cv_data_id_fk" FOREIGN KEY ("cv_id") REFERENCES "public"."cv_data"("id") ON DELETE no action ON UPDATE no action;