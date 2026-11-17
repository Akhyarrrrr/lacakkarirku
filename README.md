# LacakKarirku

LacakKarirku is an AI-assisted job-search workspace that turns a PDF resume and scattered job links into one reviewable application pipeline. It combines CV parsing, multi-source job aggregation, CV-to-job matching, application tracking, and follow-up planning.

[Open LacakKarirku](https://lacakkarirku.vercel.app/)

## Recruiter Walkthrough

1. **Upload a text-based PDF CV** - the system extracts the document text and asks the AI parser for structured skills, experience, education, certifications, and keywords.
2. **Build a job workspace** - import jobs from supported public sources or add a job manually when a source is unavailable.
3. **Review the match** - compare the selected CV with a job description, inspect matched skills and gaps, then generate focused improvement suggestions.
4. **Track the application** - move an opportunity through Saved, Applied, Assessment, Interview, Offer, or Rejected, with notes and follow-up dates.
5. **Use the dashboard** - review counts, priorities, and upcoming actions without maintaining a separate spreadsheet.

The public landing page contains demo data only. Authenticated records are scoped to the signed-in user and should not be used to expose a recruiter's or candidate's personal data.

## Product Scope

- Email and password authentication with Better Auth and email verification.
- PDF text extraction and AI-assisted CV parsing.
- Multi-source job aggregation plus manual job entry.
- Heuristic CV-to-job match scoring and AI suggestions.
- Search and filtering by source, work mode, and match score.
- Application status, notes, dates, and follow-up tracking.
- Career profile preferences for role, salary, location, remote work, and stack.
- Weekly scheduled aggregation through Vercel Cron.

## Architecture

```text
Next.js App Router + Better Auth
        |
        +-- CV upload -> PDF extraction -> Groq structured parsing
        +-- Job sources/manual import -> normalization -> Neon Postgres
        +-- CV + job -> heuristic matcher -> AI suggestions
        +-- Application tracker -> status, notes, dates, follow-up
```

- **Web:** Next.js, React, TypeScript, Tailwind CSS
- **Auth:** Better Auth with Resend for verification and password reset emails
- **Data:** Neon Postgres, Drizzle ORM
- **AI and document processing:** Groq, `pdf-parse`, `pdfjs-dist`
- **Aggregation:** Axios, Cheerio, scheduled Vercel function

## Source Reliability and Responsible Use

Source availability changes when public HTML, APIs, rate limits, or site terms change. LacakKarirku therefore describes this capability as **multi-source job aggregation**, not as a guaranteed fixed number of integrations.

- Prefer public or documented feeds where available.
- Keep manual job entry as the reliable fallback.
- Treat HTML scrapers as adapters that require periodic verification.
- Do not promote or enable a blocked source until its current behavior and terms have been reviewed.
- Never place browser cookies or private account data in a public demo.

## Local Setup

Install the locked dependencies with Node.js 24.

```bash
npm ci
```

Create a fresh development database in Neon and put its connection string in `.env.local`. Generate a value for `BETTER_AUTH_SECRET` with `node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"`.

```env
DATABASE_URL=
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=
RESEND_API_KEY=
EMAIL_FROM=
GROQ_API_KEY=
CRON_SECRET=
```

Set `EMAIL_FROM` to a sender on a domain verified in Resend. Signup and password reset require working email delivery. `GROQ_API_KEY` enables CV parsing and AI suggestions. Set `CRON_SECRET` if you use the scheduled aggregation endpoint.

Initialize the **empty development database** with PostgreSQL's `psql` client. Replace `<development DATABASE_URL>` with its connection string. The last migration resets data tied to the former authentication system and can delete existing CVs, applications, and career profiles.

```bash
psql "<development DATABASE_URL>" -v ON_ERROR_STOP=1 --single-transaction -f drizzle/0000_wonderful_swordsman.sql -f drizzle/0001_career_application_tracker.sql -f drizzle/0002_product_trust.sql -f drizzle/0003_better_auth.sql
npm run dev
```

Open `http://localhost:3000`.

## Verification

```bash
npm run lint
npx tsc --noEmit
npm run build
```

## Key Paths

```text
src/app/api/cv/upload       CV upload and parsing
src/app/api/jobs/manual     Manual job entry
src/app/api/scrape          Aggregation trigger
src/app/api/cron/scrape     Scheduled aggregation
src/app/dashboard           Authenticated workspace
src/lib/cv-parser.ts        Structured CV parsing
src/lib/matcher.ts          CV-to-job scoring
src/lib/schema.ts           Drizzle schema
src/lib/scrapers            Source adapters
```

## Known Limitations

- Image-only PDFs require OCR and are not supported yet.
- Match scores are decision support, not a hiring prediction.
- AI suggestions can be incomplete and must be reviewed before a CV is changed.
- Public-source aggregation can stop working when upstream sites change.
- The recruiter demo must use isolated demo data; personal applications and CV contents are not portfolio content.

## Screenshots

- `docs/screenshots/landing.png` - public product overview.
- `docs/screenshots/recruiter-workflow.png` - safe recruiter-facing workflow view.

## Next Focus

- OCR for scanned resumes.
- Stable documented job-source APIs where practical.
- Safer isolated recruiter demo data.
- Daily digest and optional cover-letter assistance after the core workflow is stable.
