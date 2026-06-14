import JobApplicationActions from "@/components/JobApplicationActions";
import JobsFilterBar from "@/components/JobsFilterBar";
import ManualJobForm from "@/components/ManualJobForm";
import { db } from "@/lib/db";
import { calculateProfileFit } from "@/lib/profile-fit";
import { applications, careerProfiles, cvData, jobs, matches } from "@/lib/schema";
import { auth } from "@clerk/nextjs/server";
import { and, count, desc, eq, sql } from "drizzle-orm";
import { Briefcase, Database, ExternalLink, Eye, MapPin, Target } from "lucide-react";
import Link from "next/link";

type JobsPageProps = {
  searchParams: Promise<{
    q?: string;
    source?: string;
    jobType?: string;
    minScore?: string;
    recommended?: string;
  }>;
};

function getSourceLogo(source: string) {
  const normalized = source.toLowerCase();
  const first = source.slice(0, 2).toUpperCase();

  if (normalized.includes("linkedin")) return { label: "in", bg: "#0A66C2", color: "#FFFFFF" };
  if (normalized.includes("jobstreet")) return { label: "JS", bg: "#E6F0FF", color: "#0B4EA2" };
  if (normalized.includes("glints")) return { label: "G", bg: "#00A3FF", color: "#FFFFFF" };
  if (normalized.includes("upwork")) return { label: "Up", bg: "#14A800", color: "#FFFFFF" };
  if (normalized.includes("remoteok")) return { label: "OK", bg: "#111827", color: "#FFFFFF" };
  if (normalized.includes("wework")) return { label: "WW", bg: "#4B5563", color: "#FFFFFF" };
  if (normalized.includes("remotive")) return { label: "Re", bg: "#F97316", color: "#FFFFFF" };
  if (normalized.includes("arbeitnow")) return { label: "Ar", bg: "#2563EB", color: "#FFFFFF" };
  if (normalized.includes("jobicy")) return { label: "Jy", bg: "#7C3AED", color: "#FFFFFF" };
  if (normalized.includes("manual")) return { label: "M", bg: "#0D7377", color: "#FFFFFF" };

  return { label: first || "J", bg: "#E8EFF5", color: "#1A1F3A" };
}

export default async function JobsPage({ searchParams }: JobsPageProps) {
  const { userId } = await auth();
  if (!userId) return null;

  const filters = await searchParams;
  const query = (filters.q || "").trim().toLowerCase();
  const sourceFilter = filters.source || "all";
  const jobTypeFilter = filters.jobType || "all";
  const minScore = Number.parseInt(filters.minScore || "0", 10) || 0;

  const cv = await db.query.cvData.findFirst({ where: eq(cvData.userId, userId) });
  const careerProfile = await db.query.careerProfiles.findFirst({ where: eq(careerProfiles.userId, userId) });
  const recommendedOnly = filters.recommended === "1" && Boolean(careerProfile);

  const sourceCounts = await db.select({
    source: jobs.source,
    value: count(),
  }).from(jobs).groupBy(jobs.source);

  const allJobs = cv
    ? await db.select({
      id: jobs.id,
      title: jobs.title,
      company: jobs.company,
      location: jobs.location,
      jobType: jobs.jobType,
      source: jobs.source,
      link: jobs.link,
      description: jobs.description,
      requirements: jobs.requirements,
      matchScore: matches.matchScore,
      applicationId: applications.id,
      applicationStatus: applications.status,
    })
      .from(jobs)
      .leftJoin(matches, and(eq(jobs.id, matches.jobId), eq(matches.cvId, cv.id)))
      .leftJoin(applications, and(eq(jobs.id, applications.jobId), eq(applications.userId, userId)))
      .orderBy(desc(matches.matchScore), desc(jobs.scrapedAt))
    : await db.select({
      id: jobs.id,
      title: jobs.title,
      company: jobs.company,
      location: jobs.location,
      jobType: jobs.jobType,
      source: jobs.source,
      link: jobs.link,
      description: jobs.description,
      requirements: jobs.requirements,
      matchScore: sql<number | null>`null`,
      applicationId: applications.id,
      applicationStatus: applications.status,
    })
      .from(jobs)
      .leftJoin(applications, and(eq(jobs.id, applications.jobId), eq(applications.userId, userId)))
      .orderBy(desc(jobs.scrapedAt));

  const sourceOptions = sourceCounts.map((source) => source.source).sort();
  const jobTypeOptions = Array.from(
    new Set(allJobs.map((job) => job.jobType).filter((jobType): jobType is string => Boolean(jobType))),
  ).sort();

  const jobsWithProfileFit = allJobs
    .map((job) => ({
      ...job,
      profileFit: calculateProfileFit(careerProfile, job),
    }))
    .sort((a, b) => {
      if (recommendedOnly || careerProfile) {
        return b.profileFit.score - a.profileFit.score || (b.matchScore || 0) - (a.matchScore || 0);
      }

      return 0;
    });

  const filteredJobs = jobsWithProfileFit.filter((job) => {
    const searchableText = `${job.title} ${job.company} ${job.description} ${job.requirements} ${job.location}`.toLowerCase();
    const matchesQuery = !query || searchableText.includes(query);
    const matchesSource = sourceFilter === "all" || job.source === sourceFilter;
    const matchesJobType = jobTypeFilter === "all" || job.jobType === jobTypeFilter;
    const matchesScore = !minScore || (job.matchScore || 0) >= minScore;
    const matchesProfile = !recommendedOnly || job.profileFit.score >= 50;

    return matchesQuery && matchesSource && matchesJobType && matchesScore && matchesProfile;
  });

  const highestMatch = Math.max(0, ...filteredJobs.map((job) => job.matchScore || 0));
  const highestProfileFit = Math.max(0, ...filteredJobs.map((job) => job.profileFit.score));

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold font-fraunces text-navy">Eksplorasi Lowongan</h1>
          <p className="text-gray-600 mt-2">
            Lihat job, sumber lowongan, dan kecocokannya dengan CV Anda.
          </p>
        </div>
      </div>

      <ManualJobForm />

      <JobsFilterBar
        sourceOptions={sourceOptions}
        jobTypeOptions={jobTypeOptions}
        current={{
          q: filters.q || "",
          source: sourceFilter,
          jobType: jobTypeFilter,
          minScore: filters.minScore || "0",
          recommended: filters.recommended || "0",
        }}
        totalJobs={allJobs.length}
        filteredJobs={filteredJobs.length}
        hasCareerProfile={Boolean(careerProfile)}
      />

      {!careerProfile && (
        <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg flex items-center gap-3 text-navy">
          <Target size={20} className="text-primary" />
          <p className="text-sm font-medium">
            Lengkapi Career Profile untuk mengaktifkan rekomendasi lowongan yang lebih personal.
            <Link href="/dashboard/profile" className="ml-2 underline font-bold text-primary">Setup Profile</Link>
          </p>
        </div>
      )}

      {!cv && (
        <div className="bg-warning/10 border border-warning/20 p-4 rounded-lg flex items-center gap-3 text-warning-700">
          <Target size={20} />
          <p className="text-sm font-medium">
            Unggah CV Anda untuk melihat skor kecocokan otomatis pada setiap lowongan.
            <Link href="/dashboard/cv" className="ml-2 underline font-bold">Upload Sekarang</Link>
          </p>
        </div>
      )}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="card flex items-center gap-4">
          <div className="rounded-lg bg-primary/10 p-3 text-primary">
            <Briefcase size={22} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Jobs</p>
            <p className="text-2xl font-bold text-navy">{filteredJobs.length}</p>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div className="rounded-lg bg-success/10 p-3 text-success">
            <Target size={22} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Match Tertinggi</p>
            <p className="text-2xl font-bold text-navy">{highestMatch}%</p>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div className="rounded-lg bg-warning/10 p-3 text-warning">
            <Database size={22} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Sumber Aktif</p>
            <p className="text-2xl font-bold text-navy">{sourceCounts.length}</p>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div className="rounded-lg bg-primary/10 p-3 text-primary">
            <Target size={22} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Profile Fit Tertinggi</p>
            <p className="text-2xl font-bold text-navy">{highestProfileFit}%</p>
          </div>
        </div>
      </section>

      {sourceCounts.length > 0 && (
        <section className="card">
          <div className="flex flex-wrap gap-3">
            {sourceCounts.map((source) => (
              <span
                key={source.source}
                className="rounded-full border border-gray-100 bg-white px-3 py-2 text-sm font-bold text-navy"
              >
                {source.source}: <span className="text-primary">{source.value}</span>
              </span>
            ))}
          </div>
        </section>
      )}

      {filteredJobs.length === 0 ? (
        <div className="card py-14 text-center">
          <h2 className="text-2xl font-bold font-fraunces text-navy">Lowongan tidak ditemukan</h2>
          <p className="mt-2 text-gray-600">
            Jalankan scraper, tambah lowongan manual, atau reset filter untuk melihat semua job.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredJobs.map((job) => {
            const detailText = job.description || job.requirements;
            const sourceLogo = getSourceLogo(job.source);

            return (
              <div key={job.id} className="card group hover:border-primary/50 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start gap-3 mb-4">
                    <div className="flex items-center gap-2">
                      <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-black"
                        style={{ backgroundColor: sourceLogo.bg, color: sourceLogo.color }}
                      >
                        {sourceLogo.label}
                      </div>
                      <span className="text-xs font-bold px-2 py-1 bg-gray-100 rounded text-gray-500 uppercase tracking-wider">
                        Dari {job.source}
                      </span>
                    </div>
                    {job.matchScore !== null && (
                      <div className={`flex items-center gap-1 font-bold text-sm ${
                        job.matchScore >= 80 ? "text-success" :
                          job.matchScore >= 50 ? "text-warning" : "text-gray-400"
                      }`}>
                        <Target size={16} />
                        {job.matchScore}% Match
                      </div>
                    )}
                  </div>

                  {careerProfile && (
                    <div className="mb-4 rounded-lg border border-primary/10 bg-primary/5 px-3 py-2">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Profile Fit</span>
                        <span className="text-sm font-black text-primary">{job.profileFit.score}%</span>
                      </div>
                      {job.profileFit.matchedSignals.length > 0 && (
                        <p className="mt-1 text-xs font-semibold text-gray-600">
                          {job.profileFit.matchedSignals.slice(0, 2).join(" - ")}
                        </p>
                      )}
                    </div>
                  )}

                  <Link href={`/dashboard/jobs/${job.id}`} className="block">
                    <h3 className="text-xl font-bold font-fraunces text-navy group-hover:text-primary transition-colors line-clamp-2 min-h-[3.5rem]">
                      {job.title}
                    </h3>
                  </Link>
                  <p className="text-primary font-semibold mt-1">{job.company}</p>

                  <div className="mt-4 text-sm text-gray-600 line-clamp-4 min-h-[5rem] leading-relaxed">
                    {detailText
                      ? detailText
                      : "Deskripsi detail tidak tersedia untuk lowongan ini. Klik Lamar Sekarang untuk melihat informasi selengkapnya di situs asli."}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 mt-6 text-sm text-gray-500">
                    <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded">
                      <MapPin size={14} className="text-primary" />
                      {job.location || "Remote"}
                    </div>
                    <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded">
                      <Briefcase size={14} className="text-primary" />
                      {job.jobType || "Full-time"}
                    </div>
                  </div>
                </div>

                <div className="mt-8 space-y-3">
                  <JobApplicationActions
                    jobId={job.id}
                    applicationStatus={job.applicationStatus}
                  />

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <Link
                      href={`/dashboard/jobs/${job.id}`}
                      className="flex items-center justify-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 font-bold text-primary transition-all hover:bg-primary/10"
                    >
                      Detail
                      <Eye size={16} />
                    </Link>
                    <a
                      href={job.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary flex items-center justify-center gap-2 py-3"
                    >
                      Lamar
                      <ExternalLink size={16} />
                    </a>
                    <Link
                      href={`/dashboard/suggestions?jobId=${job.id}`}
                      className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-3 font-bold text-navy transition-all hover:bg-gray-50"
                    >
                      AI
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
