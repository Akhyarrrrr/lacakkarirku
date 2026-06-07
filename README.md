# LacakKarirku

LacakKarirku adalah aplikasi web untuk membantu pencari kerja menemukan lowongan, menganalisis CV, menghitung kecocokan CV dengan job description, dan mendapatkan saran optimasi CV berbasis AI.

Fokus utama sistem ini adalah membuat proses cari kerja lebih terarah:

1. Upload CV.
2. Scrape atau tambah lowongan manual.
3. Lihat sumber lowongan dan detail job.
4. Hitung match score.
5. Dapatkan saran AI untuk memperbaiki CV sebelum melamar.

## Fitur Utama

- Auth user dengan Clerk.
- Upload CV PDF dan ekstraksi teks.
- Parsing CV dengan AI untuk mengambil skills, pengalaman, pendidikan, sertifikasi, dan keywords.
- Scraping lowongan dari beberapa sumber.
- Tambah lowongan manual dari link apa pun.
- Match score antara CV dan lowongan.
- AI suggestions untuk optimasi CV per lowongan.
- Dashboard statistik lowongan, CV, dan match.
- Halaman Jobs dengan source badge, search, filter source, filter mode kerja, dan filter minimum match.
- Vercel cron untuk menjalankan scraping otomatis harian.

## Source Lowongan

Scraper saat ini mendukung beberapa source:

- LinkedIn
- WeWorkRemotely
- RemoteOK
- Glints
- JobStreet
- Upwork
- Remotive
- Arbeitnow
- Jobicy

Catatan: beberapa website seperti Glints dan JobStreet bisa memblokir request server dengan Cloudflare atau anti-bot. Karena itu sistem juga menyediakan source alternatif yang lebih stabil serta fitur tambah lowongan manual.

Untuk Glints, ada dukungan opsional `GLINTS_COOKIE` jika ingin mencoba scraping memakai cookie browser yang sudah lolos challenge.

## Tech Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Clerk
- Neon Postgres
- Drizzle ORM
- Groq AI
- Axios
- Cheerio
- pdf-parse
- pdfjs-dist
- Vercel Cron

## Struktur Penting

```txt
src/app
  api/
    cron/scrape       Cron scraping endpoint
    cv/upload         Upload dan parse CV
    jobs/manual       Tambah lowongan manual
    scrape            Manual scrape endpoint
  dashboard/
    cv                Halaman manajemen CV
    jobs              Halaman eksplorasi lowongan
    suggestions       Halaman AI suggestions

src/components
  CVUploadForm.tsx
  JobsFilterBar.tsx
  ManualJobForm.tsx
  ScrapeButton.tsx

src/lib
  ai.ts               Lazy Groq client
  cv-parser.ts        Parsing CV dengan AI
  db.ts               Lazy Neon/Drizzle client
  matcher.ts          Match score CV vs job
  pdf.ts              Ekstraksi teks PDF
  schema.ts           Schema database
  scrapers/           Semua scraper lowongan
```

## Environment Variables

Buat file `.env` di root project.

```env
DATABASE_URL=
GROQ_API_KEY=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Opsional untuk proteksi endpoint cron
CRON_SECRET=

# Opsional untuk mencoba scrape Glints dengan cookie browser
GLINTS_COOKIE=
```

## Menjalankan Lokal

Install dependency:

```bash
npm install
```

Jalankan development server:

```bash
npm run dev
```

Buka:

```txt
http://localhost:3000
```

## Verifikasi

Lint:

```bash
npm run lint
```

Type-check:

```bash
npx tsc --noEmit
```

Build:

```bash
npm run build
```

## Database

Schema database ada di:

```txt
src/lib/schema.ts
```

Migration awal ada di:

```txt
drizzle/0000_wonderful_swordsman.sql
```

Tabel utama:

- `jobs`
- `cv_data`
- `matches`

## Alur Sistem

### Upload CV

1. User upload file PDF.
2. Sistem mengekstrak teks PDF.
3. Teks dikirim ke Groq untuk diparse menjadi data terstruktur.
4. Data CV disimpan ke database.
5. Sistem menghitung ulang match score terhadap lowongan yang tersedia.

### Scraping Lowongan

1. User klik tombol scraper atau Vercel cron berjalan.
2. Sistem menjalankan semua scraper.
3. Setiap lowongan disimpan ke tabel `jobs`.
4. Duplicate dicegah berdasarkan kombinasi `link` dan `source`.
5. Match score dihitung ulang.

### Manual Job

Jika source tertentu diblokir atau user menemukan lowongan dari Google/website lain, user bisa tambah manual:

- title
- company
- link
- location
- job type
- description
- requirements

Source akan ditebak dari domain link, misalnya LinkedIn, JobStreet, Glints, atau Manual.

## Deployment

Project ini siap dideploy ke Vercel.

File cron:

```txt
vercel.json
```

Endpoint cron:

```txt
/api/cron/scrape
```

Jika `CRON_SECRET` diisi, cron request harus mengirim header:

```txt
Authorization: Bearer <CRON_SECRET>
```

## Catatan Limitasi

- Scraping website publik bisa berubah sewaktu-waktu karena HTML, API, Cloudflare, atau anti-bot.
- Glints dan JobStreet bisa terbuka di browser tetapi tetap menolak request dari server.
- PDF hasil scan gambar belum didukung OCR. Sistem saat ini mengekstrak teks digital dari PDF.
- Match score masih heuristic dan bisa ditingkatkan dengan embeddings atau AI scoring.

## Roadmap

- Application tracker: Saved, Applied, Interview, Offer, Rejected.
- OCR untuk CV hasil scan.
- AI cover letter per lowongan.
- Career profile: target role, salary, lokasi, remote preference, tech stack.
- Search API resmi untuk mencari lowongan dari Google secara lebih stabil.
- Notifikasi daily job digest.
