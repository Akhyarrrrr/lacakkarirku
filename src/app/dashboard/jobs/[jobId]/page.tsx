import JobApplicationActions from "@/components/JobApplicationActions";
import { readMatchBreakdown } from "@/lib/match-breakdown";
import { db } from "@/lib/db";
import { calculateProfileFit } from "@/lib/profile-fit";
import { applications, careerProfiles, cvData, jobs, matches } from "@/lib/schema";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { ArrowLeft, Briefcase, CheckCircle2, ExternalLink, Lightbulb, MapPin, Target } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

type JobDetailPageProps = {
  params: Promise<{
    jobId: string;
  }>;
};

function formatDate(date?: Date | null) {
  if (!date) return "Belum tersedia";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function ScoreCard({
  label,
  value,
  description,
  tone = "primary",
}: {
  label: string;
  value: number | null;
  description: string;
  tone?: "primary" | "success" | "warning";
}) {
  const color = tone === "success" ? "text-success" : tone === "warning" ? "text-warning" : "text-primary";
  const bg = tone === "success" ? "bg-success/10" : tone === "warning" ? "bg-warning/10" : "bg-primary/10";

  return (
    <div className="rounded-lg border border-gray-100 bg-white p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-gray-500">{label}</p>
      <div className="mt-3 flex items-end gap-1">
        <span className={`text-3xl font-black md:text-4xl ${color}`}>{value ?? 0}</span>
        <span className="pb-1 text-sm font-bold text-gray-500">%</span>
      </div>
      <div className={`mt-3 h-2 overflow-hidden rounded-full ${bg}`}>
        <div
          className={`h-full rounded-full ${tone === "success" ? "bg-success" : tone === "warning" ? "bg-warning" : "bg-primary"}`}
          style={{ width: `${Math.max(0, Math.min(value ?? 0, 100))}%` }}
        />
      </div>
      <p className="mt-3 text-sm text-gray-600">{description}</p>
    </div>
  );
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const { userId } = await auth();
  if (!userId) return null;

  const { jobId } = await params;
  const [job, cv, careerProfile, application] = await Promise.all([
    db.query.jobs.findFirst({ where: eq(jobs.id, jobId) }),
    db.query.cvData.findFirst({ where: eq(cvData.userId, userId) }),
    db.query.careerProfiles.findFirst({ where: eq(careerProfiles.userId, userId) }),
    db.query.applications.findFirst({
      where: and(eq(applications.userId, userId), eq(applications.jobId, jobId)),
    }),
  ]);

  if (!job) notFound();

  const match = cv
    ? await db.query.matches.findFirst({
      where: and(eq(matches.jobId, job.id), eq(matches.cvId, cv.id)),
    })
    : null;
  const breakdown = readMatchBreakdown(match?.breakdown);
  const profileFit = calculateProfileFit(careerProfile, job);
  const description = job.description || "Deskripsi belum tersedia. Buka link asli untuk membaca informasi lengkap dari sumber lowongan.";
  const requirements = job.requirements || "Requirements belum tersedia dari scraper. Anda tetap bisa memakai AI analysis jika deskripsi job cukup lengkap.";

  return (
    <div className="space-y-6 md:space-y-8">
      <Link href="/dashboard/jobs" className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 transition-all hover:text-primary">
        <ArrowLeft size={16} />
        Kembali ke Jobs
      </Link>

      <section className="card p-4 md:p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-black uppercase tracking-wider text-gray-500">
                {job.source}
              </span>
              <span className="rounded-full bg-primary/5 px-3 py-1 text-xs font-bold text-primary">
                {job.jobType || "Mode tidak disebutkan"}
              </span>
            </div>
            <h1 className="mt-4 text-2xl font-bold font-fraunces text-navy md:text-3xl">{job.title}</h1>
            <p className="mt-2 text-lg font-semibold text-primary">{job.company}</p>
            <div className="mt-5 flex flex-wrap gap-3 text-sm font-semibold text-gray-600">
              <span className="inline-flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2">
                <MapPin size={16} className="text-primary" />
                {job.location || "Lokasi tidak disebutkan"}
              </span>
              <span className="inline-flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2">
                <Briefcase size={16} className="text-primary" />
                {job.jobType || "Tipe kerja tidak disebutkan"}
              </span>
            </div>
          </div>

          <a
            href={job.link}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary inline-flex shrink-0 items-center justify-center gap-2"
          >
            Buka Lowongan Asli
            <ExternalLink size={16} />
          </a>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
        <main className="space-y-6 lg:col-span-2">
          <section className="card p-4 md:p-6">
            <h2 className="text-xl font-bold font-fraunces text-navy">Deskripsi Lowongan</h2>
            <div className="mt-4 whitespace-pre-line text-sm leading-7 text-gray-600">
              {description}
            </div>
          </section>

          <section className="card p-4 md:p-6">
            <h2 className="text-xl font-bold font-fraunces text-navy">Requirements</h2>
            <div className="mt-4 whitespace-pre-line text-sm leading-7 text-gray-600">
              {requirements}
            </div>
          </section>

          <section className="card p-4 md:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold font-fraunces text-navy">Match Breakdown</h2>
                <p className="mt-1 text-sm text-gray-600">Ringkasan cepat skill dan keyword dari CV yang cocok dengan job ini.</p>
              </div>
              <Target className="text-primary" size={24} />
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-success/10 bg-success/5 p-4">
                <h3 className="flex items-center gap-2 font-bold text-success">
                  <CheckCircle2 size={18} />
                  Skill cocok
                </h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {breakdown.matchedSkills.length > 0 ? breakdown.matchedSkills.map((skill) => (
                    <span key={skill} className="rounded-full bg-white px-3 py-1 text-xs font-bold text-success">
                      {skill}
                    </span>
                  )) : (
                    <p className="text-sm text-gray-600">Belum ada skill yang cocok dari hasil matching.</p>
                  )}
                </div>
              </div>

              <div className="rounded-lg border border-warning/10 bg-warning/5 p-4">
                <h3 className="font-bold text-warning">Skill yang perlu ditonjolkan</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {breakdown.missingSkills.slice(0, 8).length > 0 ? breakdown.missingSkills.slice(0, 8).map((skill) => (
                    <span key={skill} className="rounded-full bg-white px-3 py-1 text-xs font-bold text-warning">
                      {skill}
                    </span>
                  )) : (
                    <p className="text-sm text-gray-600">Tidak ada gap skill yang terbaca dari data saat ini.</p>
                  )}
                </div>
              </div>
            </div>
          </section>
        </main>

        <aside className="space-y-6">
          <section className="card grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:block lg:space-y-4 lg:p-6">
            <ScoreCard
              label="CV Match"
              value={match?.matchScore ?? null}
              description={cv ? "Kecocokan CV aktif dengan lowongan ini." : "Upload CV agar skor ini bisa dihitung."}
              tone={(match?.matchScore || 0) >= 80 ? "success" : (match?.matchScore || 0) >= 50 ? "warning" : "primary"}
            />
            <ScoreCard
              label="Profile Fit"
              value={careerProfile ? profileFit.score : null}
              description={careerProfile ? "Kecocokan dengan target role dan preferensi kerja Anda." : "Isi Career Profile agar fit ini aktif."}
            />
          </section>

          <section className="card space-y-4 p-4 md:p-6">
            <h2 className="text-xl font-bold font-fraunces text-navy">Tracker</h2>
            <div className="rounded-lg bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-600">
              Status: <span className="text-navy">{application?.status || "Belum dilacak"}</span>
              <span className="mt-1 block text-xs text-gray-500">
                Update terakhir: {formatDate(application?.updatedAt)}
              </span>
            </div>
            <JobApplicationActions
              jobId={job.id}
              applicationStatus={application?.status}
            />
          </section>

          <section className="card space-y-4 p-4 md:p-6">
            <h2 className="flex items-center gap-2 text-xl font-bold font-fraunces text-navy">
              <Lightbulb size={20} className="text-primary" />
              Next Best Action
            </h2>
            <p className="text-sm leading-6 text-gray-600">
              Baca detail job, simpan ke tracker, lalu buka AI Analysis untuk mendapatkan saran optimasi CV sebelum melamar.
            </p>
            <Link
              href={`/dashboard/suggestions?jobId=${job.id}`}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm font-bold text-primary transition-all hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              Buka AI Analysis
            </Link>
          </section>
        </aside>
      </div>
    </div>
  );
}
