import { pgTable, uuid, text, integer, jsonb, timestamp, unique } from 'drizzle-orm/pg-core';

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
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => [
  unique('unique_link_source').on(table.link, table.source),
]);

export const cvData = pgTable('cv_data', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().unique(),
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
