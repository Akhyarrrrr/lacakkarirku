import { pgTable, uuid, text, integer, jsonb, timestamp, unique, boolean, index } from 'drizzle-orm/pg-core';

export const authUsers = pgTable('auth_users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const authSessions = pgTable('auth_sessions', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id').notNull().references(() => authUsers.id, { onDelete: 'cascade' }),
}, (table) => [index('auth_sessions_user_idx').on(table.userId)]);

export const authAccounts = pgTable('auth_accounts', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id').notNull().references(() => authUsers.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => [index('auth_accounts_user_idx').on(table.userId)]);

export const authVerifications = pgTable('auth_verifications', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => [index('auth_verifications_identifier_idx').on(table.identifier)]);

export const jobs = pgTable('jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  company: text('company').notNull(),
  description: text('description'),
  requirements: text('requirements'),
  location: text('location'),
  jobType: text('job_type'),
  salaryMin: integer('salary_min'),
  salaryMax: integer('salary_max'),
  currency: text('currency').default('IDR'),
  link: text('link').notNull(),
  source: text('source').notNull(),
  scrapedAt: timestamp('scraped_at').defaultNow(),
  postedAt: timestamp('posted_at'),
  lastCheckedAt: timestamp('last_checked_at').defaultNow(),
  expiresAt: timestamp('expires_at'),
  isActive: boolean('is_active').notNull().default(true),
  sourceReliability: text('source_reliability').notNull().default('unverified'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => [
  unique('unique_link_source').on(table.link, table.source),
]);

export const cvData = pgTable('cv_data', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  name: text('name').notNull().default('CV Utama'),
  targetRole: text('target_role'),
  isDefault: boolean('is_default').notNull().default(false),
  fullText: text('full_text').notNull(),
  skills: jsonb('skills'),
  experience: jsonb('experience'),
  education: jsonb('education'),
  certifications: jsonb('certifications'),
  keywords: text('keywords').array(),
  parsedAt: timestamp('parsed_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const careerProfiles = pgTable('career_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().unique(),
  targetRole: text('target_role'),
  targetLevel: text('target_level'),
  preferredLocation: text('preferred_location'),
  workModes: text('work_modes').array(),
  salaryMin: integer('salary_min'),
  salaryMax: integer('salary_max'),
  currency: text('currency').default('IDR'),
  skills: text('skills').array(),
  industries: text('industries').array(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const matches = pgTable('matches', {
  id: uuid('id').primaryKey().defaultRandom(),
  jobId: uuid('job_id').notNull().references(() => jobs.id),
  cvId: uuid('cv_id').notNull().references(() => cvData.id),
  matchScore: integer('match_score'),
  skillsMatch: integer('skills_match'),
  experienceMatch: integer('experience_match'),
  keywordsMatch: integer('keywords_match'),
  breakdown: jsonb('breakdown'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => [
  unique('unique_job_cv').on(table.jobId, table.cvId),
]);

export const applications = pgTable('applications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  jobId: uuid('job_id').notNull().references(() => jobs.id),
  cvId: uuid('cv_id').references(() => cvData.id),
  status: text('status').notNull().default('Saved'),
  notes: text('notes'),
  contactName: text('contact_name'),
  contactEmail: text('contact_email'),
  appliedAt: timestamp('applied_at'),
  followUpAt: timestamp('follow_up_at'),
  lastStatusChangedAt: timestamp('last_status_changed_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => [
  unique('unique_user_job_application').on(table.userId, table.jobId),
]);
