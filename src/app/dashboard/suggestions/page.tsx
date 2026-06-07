import { getGroqClient } from "@/lib/ai";
import { asExperienceArray, asStringArray } from "@/lib/cv-types";
import { db } from "@/lib/db";
import { cvData, jobs, matches } from "@/lib/schema";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { AlertCircle, ArrowLeft, CheckCircle, Lightbulb } from "lucide-react";
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

function getMatchedSkills(value: unknown) {
  const breakdown = Boolean(value) && typeof value === "object" ? value as Record<string, unknown> : {};

  return asStringArray(breakdown.matchedSkills);
}

export default async function SuggestionsPage({ searchParams }: SuggestionsPageProps) {
  const { userId } = await auth();
  if (!userId) return null;

  const { jobId } = await searchParams;
  const cv = await db.query.cvData.findFirst({ where: eq(cvData.userId, userId) });

  if (!cv) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle size={48} className="text-warning mb-4" />
        <h2 className="text-2xl font-bold font-fraunces text-navy">CV Belum Tersedia</h2>
        <p className="text-gray-500 mt-2">Unggah CV Anda terlebih dahulu untuk mendapatkan saran AI.</p>
        <Link href="/dashboard/cv" className="btn-primary mt-6 px-8">Upload CV</Link>
      </div>
    );
  }

  if (!jobId) {
    return (
      <div className="space-y-10">
        <h1 className="text-3xl font-bold font-fraunces text-navy">AI Smart Suggestions</h1>
        <div className="card text-center py-20">
          <p className="text-gray-500">
            Pilih lowongan dari menu <Link href="/dashboard/jobs" className="text-primary font-bold">Jobs</Link> untuk melihat saran spesifik.
          </p>
        </div>
      </div>
    );
  }

  const job = await db.query.jobs.findFirst({ where: eq(jobs.id, jobId) });
  const match = await db.query.matches.findFirst({
    where: and(eq(matches.jobId, jobId), eq(matches.cvId, cv.id)),
  });

  if (!job) return <div>Lowongan tidak ditemukan.</div>;

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

  const matchedSkills = getMatchedSkills(match?.breakdown);

  return (
    <div className="space-y-10">
      <Link href="/dashboard/jobs" className="flex items-center gap-2 text-gray-500 hover:text-primary transition-all">
        <ArrowLeft size={16} />
        Kembali ke Jobs
      </Link>

      <div className="flex flex-col md:flex-row gap-8">
        <div className="flex-1 space-y-6">
          <div className="card">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold font-fraunces text-navy mb-4">{job.title}</h2>
                <p className="text-primary font-semibold text-lg">{job.company}</p>
              </div>
              <span className="text-xs font-bold px-2 py-1 bg-gray-100 rounded text-gray-500 uppercase tracking-wider">
                Dari {job.source}
              </span>
            </div>
            <div className="mt-6 p-4 bg-gray-50 rounded-lg text-sm text-gray-600 max-h-60 overflow-y-auto">
              {job.description || job.requirements || "Detail tidak tersedia."}
            </div>
          </div>

          <div className="card border-primary/20 bg-primary/5">
            <h3 className="flex items-center gap-2 text-xl font-bold font-fraunces text-navy mb-6">
              <Lightbulb size={24} className="text-primary" />
              Rekomendasi Optimalisasi CV
            </h3>
            <div className="space-y-4">
              {aiSuggestions.suggestions.map((suggestion, index) => (
                <div key={`${suggestion}-${index}`} className="flex gap-4 p-4 bg-white rounded-xl shadow-sm border border-primary/10">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold">
                    {index + 1}
                  </div>
                  <p className="text-navy font-medium leading-relaxed">{suggestion}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="w-full md:w-80 space-y-6">
          <div className="card text-center py-10">
            <div className="relative inline-block mb-4">
              <svg className="w-32 h-32 transform -rotate-90">
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
            <h4 className="font-bold text-navy mb-4 flex items-center gap-2">
              <CheckCircle size={18} className="text-success" />
              Skill yang Cocok
            </h4>
            <div className="flex flex-wrap gap-2">
              {matchedSkills.length > 0 ? matchedSkills.map((skill) => (
                <span key={skill} className="px-2 py-1 bg-success/5 text-success text-xs font-bold rounded-md border border-success/10">
                  {skill}
                </span>
              )) : (
                <p className="text-sm text-gray-500">Belum ada skill yang cocok dari hasil matching.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
