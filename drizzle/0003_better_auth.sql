CREATE TABLE "auth_users" (
  "id" text PRIMARY KEY NOT NULL, "name" text NOT NULL, "email" text NOT NULL UNIQUE,
  "email_verified" boolean DEFAULT false NOT NULL, "image" text,
  "created_at" timestamp DEFAULT now() NOT NULL, "updated_at" timestamp DEFAULT now() NOT NULL
);
CREATE TABLE "auth_sessions" (
  "id" text PRIMARY KEY NOT NULL, "expires_at" timestamp NOT NULL, "token" text NOT NULL UNIQUE,
  "created_at" timestamp DEFAULT now() NOT NULL, "updated_at" timestamp DEFAULT now() NOT NULL,
  "ip_address" text, "user_agent" text, "user_id" text NOT NULL REFERENCES "auth_users"("id") ON DELETE CASCADE
);
CREATE INDEX "auth_sessions_user_idx" ON "auth_sessions" ("user_id");
CREATE TABLE "auth_accounts" (
  "id" text PRIMARY KEY NOT NULL, "account_id" text NOT NULL, "provider_id" text NOT NULL,
  "user_id" text NOT NULL REFERENCES "auth_users"("id") ON DELETE CASCADE,
  "access_token" text, "refresh_token" text, "id_token" text,
  "access_token_expires_at" timestamp, "refresh_token_expires_at" timestamp, "scope" text, "password" text,
  "created_at" timestamp DEFAULT now() NOT NULL, "updated_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX "auth_accounts_user_idx" ON "auth_accounts" ("user_id");
CREATE TABLE "auth_verifications" (
  "id" text PRIMARY KEY NOT NULL, "identifier" text NOT NULL, "value" text NOT NULL, "expires_at" timestamp NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL, "updated_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX "auth_verifications_identifier_idx" ON "auth_verifications" ("identifier");
DELETE FROM "matches" WHERE "cv_id" IN (SELECT "id" FROM "cv_data");
DELETE FROM "applications";
DELETE FROM "career_profiles";
DELETE FROM "cv_data";
