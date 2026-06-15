import { getGroqClient } from "@/lib/ai";
import { asExperienceArray, asStringArray } from "@/lib/cv-types";
import { db } from "@/lib/db";
import { readMatchBreakdown } from "@/lib/match-breakdown";
import { cvData, jobs, matches } from "@/lib/schema";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { AlertCircle, ArrowLeft, CheckCircle, FileSearch, Lightbulb, Sparkles, Target } from "lucide-react";
import Link from "next/link";

type SuggestionsPageProps = {
  searchParams: Promise<{
    jobId?: string;
  }>;
};

type AISuggestions = {
  suggestions: string[];
  match_analysis: string;
};

function normalizeAISuggestions(value: unknown): AISuggestions {
  const data = Boolean(value) && typeof value === "object" ? value as Record<string, unknown> : {};

  return {
    suggestions: asStringArray(data.suggestions).slice(0, 5),
    match_analysis: typeof data.match_analysis === "string"
      ? data.match_analysis
      : "Analisis belum tersedia.",
  };
}

export default async function SuggestionsPage({ searchParams }: SuggestionsPageProps) {
  const { userId } = await auth();
  if (!userId) return null;

  const { jobId } = await searchParams;
  const cv = await db.query.cvData.findFirst({ where: eq(cvData.userId, userId) });

  if (!cv) {
    return (
      <div className="card mx-auto flex max-w-2xl flex-col items-center justify-center py-14 text-center md:py-20">
        <div className="mb-5 rounded-full bg-warning/10 p-4 text-warning">
          <AlertCircle size={42} />
        </div>
        <h2 className="text-2xl font-bold font-fraunces text-navy">CV Belum Tersedia</h2>
        <p className="mt-2 max-w-md text-gray-600">
          Unggah CV terlebih dahulu agar AI bisa memberi saran yang sesuai dengan skill dan pengalaman Anda.
        </p>
        <Link href="/dashboard/cv" className="btn-primary mt-6 inline-flex min-h-12 items-center justify-center gap-2 px-8">
          <FileSearch size={18} />
          Upload CV
        </Link>
      </div>
    );
  }

  if (!jobId) {
    return (
      <div className="space-y-8">
        <section className="rounded-xl border border-primary/20 bg-primary/5 p-5 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-primary">AI Career Coach</p>
              <h1 className="mt-2 text-3xl font-bold font-fraunces text-navy">AI Smart Suggestions</h1>
              <p className="mt-3 max-w-2xl text-gray-600">
                Pilih satu lowongan agar AI bisa membandingkan isi CV Anda dengan requirement job tersebut.
              </p>
            </div>
            <div className="rounded-lg bg-primary/10 p-4 text-primary">
              <Sparkles size={28} />
            </div>
          </div>
        </section>

        <div className="card flex flex-col items-center justify-center py-14 text-center md:py-20">
          <div className="mb-5 rounded-full bg-primary/10 p-4 text-primary">
            <Target size={40} />
          </div>
          <h2 className="text-2xl font-bold font-fraunces text-navy">Pilih job untuk dianalisis</h2>
          <p className="mt-2 max-w-md text-gray-600">
            Buka halaman lowongan, lalu klik saran AI pada job yang ingin Anda optimalkan.
          </p>
          <Link href="/dashboard/jobs" className="btn-primary mt-6 inline-flex min-h-12 items-center justify-center px-8">
            Lihat Lowongan
          </Link>
        </div>
      </div>
    );
  }

  const job = await db.query.jobs.findFirst({ where: eq(jobs.id, jobId) });
  const match = await db.query.matches.findFirst({
    where: and(eq(matches.jobId, jobId), eq(matches.cvId, cv.id)),
  });

  if (!job) {
    return (
      <div className="card mx-auto max-w-xl py-14 text-center">
        <AlertCircle size={42} className="mx-auto text-warning" />
        <h2 className="mt-4 text-2xl font-bold font-fraunces text-navy">Lowongan tidak ditemukan</h2>
        <p className="mt-2 text-gray-600">Job ini mungkin sudah dihapus atau tidak tersedia lagi.</p>
        <Link href="/dashboard/jobs" className="btn-primary mt-6 inline-flex min-h-12 items-center justify-center px-8">
          Kembali ke Jobs
        </Link>
      </div>
    );
  }

  const prompt = `
    Kamu adalah career coach untuk pencari kerja software/web developer di Indonesia.
    Analisis CV user terhadap lowongan berikut, lalu berikan saran yang langsung bisa dipakai.

    Job Title: ${job.title}
    Company: ${job.company}
    Source: ${job.source}
    Job Description: ${job.description}
    Job Requirements: ${job.requirements}

    User CV Skills: ${asStringArray(cv.skills).join(", ")}
    User CV Experience: ${JSON.stringify(asExperienceArray(cv.experience))}

    Format JSON saja:
    {
      "suggestions": [
        "saran konkret 1",
        "saran konkret 2",
        "saran konkret 3"
      ],
      "match_analysis": "ringkasan singkat kenapa cocok/tidak cocok"
    }
  `;

  let aiSuggestions: AISuggestions = {
    suggestions: [],
    match_analysis: "Analisis sedang diproses...",
  };

  try {
    const groq = getGroqClient();
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" },
    });
    aiSuggestions = normalizeAISuggestions(JSON.parse(chatCompletion.choices[0].message.content || "{}"));
  } catch (error) {
    console.error("AI Suggestion Error:", error);
    aiSuggestions = {
      suggestions: [
        "Tambahkan keyword utama dari deskripsi lowongan ke bagian skills dan pengalaman yang relevan.",
        "Tulis ulang bullet pengalaman kerja agar menonjolkan hasil, tools, dan tanggung jawab yang sama dengan job ini.",
        "Pastikan judul role target di CV mendekati posisi yang dilamar agar lebih mudah terbaca ATS.",
      ],
      match_analysis: "Saran fallback ditampilkan karena AI belum bisa memproses analisis saat ini.",
    };
  }

  const matchedSkills = readMatchBreakdown(match?.breakdown).matchedSkills;

  return (
    <div className="space-y-8">
      <Link href="/dashboard/jobs" className="inline-flex min-h-10 items-center gap-2 text-sm font-bold text-gray-500 transition-all hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
        <ArrowLeft size={16} />
        Kembali ke Jobs
      </Link>

      <section className="rounded-xl border border-primary/20 bg-primary/5 p-5 md:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-primary">AI Smart Suggestions</p>
            <h1 className="mt-2 text-2xl font-bold font-fraunces text-navy md:text-3xl">
              Optimasi CV untuk {job.title}
            </h1>
            <p className="mt-3 max-w-3xl text-gray-600">
              Rekomendasi ini dibuat dari isi CV Anda, requirement lowongan, dan hasil matching yang tersimpan.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:w-96">
            <div className="rounded-lg bg-cream p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Match</p>
              <p className="mt-1 text-2xl font-black text-success">{match?.matchScore || 0}%</p>
            </div>
            <div className="rounded-lg bg-cream p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Skills</p>
              <p className="mt-1 text-2xl font-black text-primary">{matchedSkills.length}</p>
            </div>
            <div className="col-span-2 rounded-lg bg-cream p-4 sm:col-span-1">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Source</p>
              <p className="mt-1 truncate text-sm font-black text-navy">{job.source}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <div className="card">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-xl font-bold font-fraunces text-navy md:text-2xl">{job.title}</h2>
                <p className="mt-2 text-base font-semibold text-primary md:text-lg">{job.company}</p>
              </div>
              <span className="shrink-0 rounded bg-gray-100 px-2 py-1 text-xs font-bold uppercase tracking-wider text-gray-500">
                Dari {job.source}
              </span>
            </div>
            <div className="mt-6 max-h-72 overflow-y-auto rounded-lg bg-gray-50 p-4 text-sm leading-6 text-gray-600">
              {job.description || job.requirements || "Detail tidak tersedia."}
            </div>
          </div>

          <div className="card border-primary/20 bg-primary/5">
            <h3 className="mb-6 flex items-center gap-2 text-xl font-bold font-fraunces text-navy">
              <Lightbulb size={24} className="text-primary" />
              Rekomendasi Optimalisasi CV
            </h3>
            <div className="space-y-4">
              {aiSuggestions.suggestions.map((suggestion, index) => (
                <div key={`${suggestion}-${index}`} className="flex gap-4 rounded-xl border border-primary/10 bg-white p-4 shadow-sm">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                    {index + 1}
                  </div>
                  <p className="font-medium leading-relaxed text-navy">{suggestion}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="card text-center py-10">
            <div className="relative inline-block mb-4">
              <svg className="h-32 w-32 -rotate-90">
                <circle className="text-gray-100" strokeWidth="8" stroke="currentColor" fill="transparent" r="56" cx="64" cy="64" />
                <circle className="text-primary" strokeWidth="8" strokeDasharray={351.85} strokeDashoffset={351.85 - (351.85 * (match?.matchScore || 0)) / 100} strokeLinecap="round" stroke="currentColor" fill="transparent" r="56" cx="64" cy="64" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-bold font-fraunces text-navy">{match?.matchScore || 0}%</span>
              </div>
            </div>
            <p className="font-bold text-navy">Match Score</p>
            <p className="text-sm text-gray-500 mt-2 px-4">{aiSuggestions.match_analysis}</p>
          </div>

          <div className="card">
            <h4 className="mb-4 flex items-center gap-2 font-bold text-navy">
              <CheckCircle size={18} className="text-success" />
              Skill yang Cocok
            </h4>
            <div className="flex flex-wrap gap-2">
              {matchedSkills.length > 0 ? matchedSkills.map((skill) => (
                <span key={skill} className="rounded-md border border-success/10 bg-success/5 px-2 py-1 text-xs font-bold text-success">
                  {skill}
                </span>
              )) : (
                <p className="text-sm text-gray-500">Belum ada skill yang cocok dari hasil matching.</p>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
