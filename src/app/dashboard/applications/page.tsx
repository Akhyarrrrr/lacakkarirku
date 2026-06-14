import ApplicationStatusSelect from "@/components/ApplicationStatusSelect";
import { APPLICATION_STATUSES, type ApplicationStatus } from "@/lib/application-status";
import { db } from "@/lib/db";
import { applications, cvData, jobs, matches } from "@/lib/schema";
import { auth } from "@clerk/nextjs/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { Briefcase, CalendarClock, ExternalLink, FileText, Pencil, Target } from "lucide-react";
import Link from "next/link";

type ApplicationRow = {
  id: string;
  status: string;
  notes: string | null;
  appliedAt: Date | null;
  followUpAt: Date | null;
  updatedAt: Date | null;
  job: {
    id: string;
    title: string;
    company: string;
    source: string;
    link: string;
    location: string | null;
    jobType: string | null;
  };
  matchScore: number | null;
};

function toApplicationStatus(status: string): ApplicationStatus {
  return APPLICATION_STATUSES.includes(status as ApplicationStatus)
    ? status as ApplicationStatus
    : "Saved";
}

function formatDate(date?: Date | null) {
  if (!date) return null;

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default async function ApplicationsPage() {
  const { userId } = await auth();
  if (!userId) return null;

  const cv = await db.query.cvData.findFirst({
    where: eq(cvData.userId, userId),
  });

  const rows = await db.select({
    id: applications.id,
    status: applications.status,
    notes: applications.notes,
    appliedAt: applications.appliedAt,
    followUpAt: applications.followUpAt,
    updatedAt: applications.updatedAt,
    job: {
      id: jobs.id,
      title: jobs.title,
      company: jobs.company,
      source: jobs.source,
      link: jobs.link,
      location: jobs.location,
      jobType: jobs.jobType,
    },
    matchScore: matches.matchScore,
  })
    .from(applications)
    .innerJoin(jobs, eq(applications.jobId, jobs.id))
    .leftJoin(matches, cv ? and(eq(matches.jobId, jobs.id), eq(matches.cvId, cv.id)) : sql`false`)
    .where(eq(applications.userId, userId))
    .orderBy(desc(applications.updatedAt), desc(applications.createdAt));

  const applicationRows = rows as ApplicationRow[];
  const grouped = APPLICATION_STATUSES.map((status) => ({
    status,
    items: applicationRows.filter((item) => toApplicationStatus(item.status) === status),
  }));
  const activeCount = applicationRows.filter((item) => toApplicationStatus(item.status) !== "Archived").length;
  const interviewCount = applicationRows.filter((item) => toApplicationStatus(item.status) === "Interview").length;
  const offerCount = applicationRows.filter((item) => toApplicationStatus(item.status) === "Offer").length;

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold font-fraunces text-navy">Application Tracker</h1>
          <p className="text-gray-600 mt-2">
            Pantau semua lowongan yang Anda simpan, lamar, dan follow-up.
          </p>
        </div>
        <Link href="/dashboard/jobs" className="btn-primary flex items-center justify-center gap-2">
          <Briefcase size={18} />
          Cari Lowongan
        </Link>
      </div>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="card flex items-center gap-4">
          <div className="rounded-lg bg-primary/10 p-3 text-primary">
            <FileText size={22} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Tracked</p>
            <p className="text-2xl font-bold text-navy">{applicationRows.length}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="rounded-lg bg-success/10 p-3 text-success">
            <Target size={22} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Aktif</p>
            <p className="text-2xl font-bold text-navy">{activeCount}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="rounded-lg bg-warning/10 p-3 text-warning">
            <CalendarClock size={22} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Interview</p>
            <p className="text-2xl font-bold text-navy">{interviewCount}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="rounded-lg bg-primary/10 p-3 text-primary">
            <Target size={22} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Offer</p>
            <p className="text-2xl font-bold text-navy">{offerCount}</p>
          </div>
        </div>
      </section>

      {applicationRows.length === 0 ? (
        <section className="card py-14 text-center">
          <h2 className="text-2xl font-bold font-fraunces text-navy">Belum ada job yang dilacak</h2>
          <p className="mt-2 text-gray-600">
            Simpan lowongan dari halaman Jobs agar pipeline lamaran Anda mulai terbentuk.
          </p>
          <Link href="/dashboard/jobs" className="btn-primary mt-6 inline-flex">
            Mulai dari Jobs
          </Link>
        </section>
      ) : (
        <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          {grouped.map(({ status, items }) => (
            <div key={status} className="card space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-fraunces text-xl font-bold text-navy">{status}</h2>
                <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-bold text-gray-600">
                  {items.length}
                </span>
              </div>

              {items.length === 0 ? (
                <p className="rounded-lg border border-dashed border-gray-300 bg-white px-4 py-6 text-sm font-medium text-gray-500">
                  Belum ada lamaran di tahap ini.
                </p>
              ) : (
                <div className="space-y-3">
                  {items.map((item) => {
                    const appliedAt = formatDate(item.appliedAt);
                    const followUpAt = formatDate(item.followUpAt);

                    return (
                      <article key={item.id} className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                          <div className="min-w-0">
                            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                              {item.job.source}
                            </p>
                            <h3 className="mt-1 line-clamp-2 font-fraunces text-lg font-bold text-navy">
                              {item.job.title}
                            </h3>
                            <p className="mt-1 text-sm font-semibold text-primary">{item.job.company}</p>
                            <p className="mt-2 text-xs font-medium text-gray-500">
                              {[item.job.location, item.job.jobType].filter(Boolean).join(" - ") || "Detail kerja belum lengkap"}
                            </p>
                          </div>

                          {item.matchScore !== null && (
                            <div className="shrink-0 rounded-lg bg-success/5 px-3 py-2 text-sm font-black text-success">
                              {item.matchScore}% Match
                            </div>
                          )}
                        </div>

                        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                          <ApplicationStatusSelect
                            applicationId={item.id}
                            currentStatus={toApplicationStatus(item.status)}
                          />
                          <div className="rounded-lg bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-600">
                            {appliedAt ? `Applied: ${appliedAt}` : "Belum ditandai applied"}
                            {followUpAt ? <span className="block text-warning">Follow-up: {followUpAt}</span> : null}
                          </div>
                        </div>

                        {item.notes && (
                          <p className="mt-3 rounded-lg bg-cream px-3 py-2 text-sm text-gray-600">
                            {item.notes}
                          </p>
                        )}

                        <div className="mt-4 flex flex-wrap gap-2">
                          <Link
                            href={`/dashboard/applications/${item.id}`}
                            className="inline-flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm font-bold text-primary transition-all hover:bg-primary/10"
                          >
                            Edit Detail
                            <Pencil size={14} />
                          </Link>
                          <Link
                            href={`/dashboard/jobs/${item.job.id}`}
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-bold text-navy transition-all hover:border-primary/50 hover:text-primary"
                          >
                            Detail Job
                          </Link>
                          <a
                            href={item.job.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-bold text-navy transition-all hover:border-primary/50 hover:text-primary"
                          >
                            Buka Job
                            <ExternalLink size={14} />
                          </a>
                          <Link
                            href={`/dashboard/suggestions?jobId=${item.job.id}`}
                            className="inline-flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm font-bold text-primary transition-all hover:bg-primary/10"
                          >
                            Analisis AI
                          </Link>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
