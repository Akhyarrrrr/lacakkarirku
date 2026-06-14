CREATE TABLE "career_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"target_role" text,
	"target_level" text,
	"preferred_location" text,
	"work_modes" text[],
	"salary_min" integer,
	"salary_max" integer,
	"currency" text DEFAULT 'IDR',
	"skills" text[],
	"industries" text[],
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "career_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"job_id" uuid NOT NULL,
	"cv_id" uuid,
	"status" text DEFAULT 'Saved' NOT NULL,
	"notes" text,
	"contact_name" text,
	"contact_email" text,
	"applied_at" timestamp,
	"follow_up_at" timestamp,
	"last_status_changed_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "unique_user_job_application" UNIQUE("user_id","job_id")
);
--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_cv_id_cv_data_id_fk" FOREIGN KEY ("cv_id") REFERENCES "public"."cv_data"("id") ON DELETE no action ON UPDATE no action;
