import ScrapeButton from "@/components/ScrapeButton";
import { APPLICATION_STATUSES, type ApplicationStatus, isApplicationStatus } from "@/lib/application-status";
import { db } from "@/lib/db";
import { calculateProfileFit } from "@/lib/profile-fit";
import { applications, careerProfiles, cvData, jobs, matches } from "@/lib/schema";
import { currentUser } from "@clerk/nextjs/server";
import { and, count, desc, eq, gt, ne, sql } from "drizzle-orm";
import {
  ArrowRight,
  Briefcase,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  FileCheck,
  History,
  PlusCircle,
  Target,
  UserRound,
} from "lucide-react";
import Link from "next/link";

type TopJob = {
  id: string;
  title: string;
  company: string;
  source: string;
  location: string | null;
  jobType: string | null;
  matchScore: number | null;
  profileFitScore: number;
};

type FollowUpItem = {
  id: string;
  status: string;
  followUpAt: Date | null;
  job: {
    title: string;
    company: string;
  };
};

function formatDate(date?: Date | null) {
  if (!date) return "Belum ada";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function normalizeStatus(status: string): ApplicationStatus {
  return isApplicationStatus(status) ? status : "Saved";
}

function getStatusTone(status: ApplicationStatus) {
  if (status === "Offer") return "text-success bg-success/10";
  if (status === "Rejected" || status === "Archived") return "text-gray-600 bg-gray-100";
  if (status === "Interview" || status === "Assessment") return "text-warning bg-warning/10";

  return "text-primary bg-primary/10";
}

export default async function DashboardPage() {
  const user = await currentUser();
  const userId = user?.id;

  const [jobCount] = await db.select({ value: count() }).from(jobs);
  const currentCV = userId
    ? await db.query.cvData.findFirst({ where: eq(cvData.userId, userId) })
    : null;
  const careerProfile = userId
    ? await db.query.careerProfiles.findFirst({ where: eq(careerProfiles.userId, userId) })
    : null;

  const [applicationCount] = userId
    ? await db.select({ value: count() }).from(applications).where(eq(applications.userId, userId))
    : [{ value: 0 }];
  const [activeApplicationCount] = userId
    ? await db.select({ value: count() }).from(applications).where(and(
      eq(applications.userId, userId),
      ne(applications.status, "Archived"),
    ))
    : [{ value: 0 }];
  const [highMatchCount] = currentCV
    ? await db.select({ value: count() }).from(matches).where(and(
      eq(matches.cvId, currentCV.id),
      gt(matches.matchScore, 80),
    ))
    : [{ value: 0 }];

  const lastScrapedJob = await db.query.jobs.findFirst({
    orderBy: [desc(jobs.scrapedAt)],
  });

  const statusRows = userId
    ? await db.select({
      status: applications.status,
      value: count(),
    })
      .from(applications)
      .where(eq(applications.userId, userId))
      .groupBy(applications.status)
    : [];
  const statusCounts = new Map(statusRows.map((row) => [normalizeStatus(row.status), row.value]));

  const followUps = userId
    ? await db.select({
      id: applications.id,
      status: applications.status,
      followUpAt: applications.followUpAt,
      job: {
        title: jobs.title,
        company: jobs.company,
      },
    })
      .from(applications)
      .innerJoin(jobs, eq(applications.jobId, jobs.id))
      .where(and(
        eq(applications.userId, userId),
        ne(applications.status, "Archived"),
        sql`${applications.followUpAt} IS NOT NULL`,
      ))
      .orderBy(applications.followUpAt)
      .limit(4)
    : [];

  const latestJobs = currentCV
    ? await db.select({
      id: jobs.id,
      title: jobs.title,
      company: jobs.company,
      source: jobs.source,
      location: jobs.location,
      jobType: jobs.jobType,
      description: jobs.description,
      requirements: jobs.requirements,
      matchScore: matches.matchScore,
    })
      .from(jobs)
      .leftJoin(matches, and(eq(jobs.id, matches.jobId), eq(matches.cvId, currentCV.id)))
      .orderBy(desc(matches.matchScore), desc(jobs.scrapedAt))
      .limit(12)
    : await db.select({
      id: jobs.id,
      title: jobs.title,
      company: jobs.company,
      source: jobs.source,
      location: jobs.location,
      jobType: jobs.jobType,
      description: jobs.description,
      requirements: jobs.requirements,
      matchScore: sql<number | null>`null`,
    })
      .from(jobs)
      .orderBy(desc(jobs.scrapedAt))
      .limit(12);

  const topJobs: TopJob[] = latestJobs
    .map((job) => ({
      id: job.id,
      title: job.title,
      company: job.company,
      source: job.source,
      location: job.location,
      jobType: job.jobType,
      matchScore: job.matchScore,
      profileFitScore: calculateProfileFit(careerProfile, job).score,
    }))
    .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0) || b.profileFitScore - a.profileFitScore)
    .slice(0, 4);

  const setupItems = [
    {
      label: "Career Profile",
      done: Boolean(careerProfile),
      href: "/dashboard/profile",
      action: careerProfile ? "Edit" : "Setup",
    },
    {
      label: "CV Analyzer",
      done: Boolean(currentCV),
      href: "/dashboard/cv",
      action: currentCV ? "Update" : "Upload",
    },
    {
      label: "Application Tracker",
      done: applicationCount.value > 0,
      href: "/dashboard/jobs",
      action: applicationCount.value > 0 ? "View" : "Save job",
    },
  ];
  const setupProgress = Math.round((setupItems.filter((item) => item.done).length / setupItems.length) * 100);

  const stats = [
    { label: "Jobs Tersedia", value: jobCount.value.toString(), icon: Briefcase, color: "text-primary" },
    { label: "Lamaran Aktif", value: activeApplicationCount.value.toString(), icon: ClipboardList, color: "text-primary" },
    { label: "High Match", value: highMatchCount.value.toString(), icon: Target, color: "text-success" },
    {
      label: "Last Scraped",
      value: lastScrapedJob ? formatDate(lastScrapedJob.scrapedAt) : "Never",
      icon: History,
      color: "text-gray-600",
    },
  ];

  const todayFocus = !careerProfile
    ? {
      title: "Lengkapi Career Profile",
      body: "Isi target role, skill, dan preferensi kerja agar rekomendasi job lebih tajam.",
      href: "/dashboard/profile",
      action: "Setup Profile",
      icon: UserRound,
    }
    : !currentCV
      ? {
        title: "Upload CV utama",
        body: "CV dibutuhkan untuk menghitung match score dan memberi saran optimasi sebelum apply.",
        href: "/dashboard/cv",
        action: "Upload CV",
        icon: FileCheck,
      }
      : followUps.length > 0
        ? {
          title: "Cek follow-up lamaran",
          body: `${followUps.length} lamaran punya jadwal follow-up. Mulai dari yang paling dekat.`,
          href: "/dashboard/applications",
          action: "Lihat Tracker",
          icon: CalendarClock,
        }
        : {
          title: "Cari job paling worth applying",
          body: "Gunakan filter Sesuai Profile dan simpan lowongan dengan match tertinggi.",
          href: "/dashboard/jobs?recommended=1",
          action: "Lihat Rekomendasi",
          icon: Target,
        };
  const TodayIcon = todayFocus.icon;

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-primary/20 bg-primary/5 p-6 text-navy">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-wider text-primary">Action Center</p>
            <h1 className="mt-2 text-3xl font-bold font-fraunces text-navy">
              Halo, {user?.firstName || "Pejuang Karir"}.
            </h1>
            <p className="mt-2 text-gray-600">
              Fokus hari ini: rapikan tracker, pilih job terbaik, dan follow-up lamaran yang sudah berjalan.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <ScrapeButton />
            <Link href="/dashboard/jobs?recommended=1" className="inline-flex items-center justify-center gap-2 rounded-lg border border-primary/20 bg-white px-5 py-3 font-bold text-primary transition-all hover:bg-primary/10">
              Job Rekomendasi
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="card flex items-center gap-4">
            <div className={`rounded-lg bg-gray-100 p-3 ${stat.color}`}>
              <stat.icon size={22} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{stat.label}</p>
              <p className="text-2xl font-bold text-navy">{stat.value}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="card xl:col-span-2">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-primary/10 p-3 text-primary">
                <TodayIcon size={26} />
              </div>
              <div>
                <p className="text-sm font-bold uppercase tracking-wider text-gray-500">Today&apos;s Focus</p>
                <h2 className="mt-1 text-2xl font-bold font-fraunces text-navy">{todayFocus.title}</h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-gray-600">{todayFocus.body}</p>
              </div>
            </div>
            <Link href={todayFocus.href} className="btn-primary inline-flex shrink-0 items-center justify-center gap-2">
              {todayFocus.action}
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-gray-500">Setup Progress</p>
              <h2 className="mt-1 text-2xl font-bold font-fraunces text-navy">{setupProgress}%</h2>
            </div>
            <div className="rounded-lg bg-success/10 p-3 text-success">
              <CheckCircle2 size={24} />
            </div>
          </div>
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-gray-100">
            <div className="h-full rounded-full bg-success" style={{ width: `${setupProgress}%` }} />
          </div>
          <div className="mt-5 space-y-3">
            {setupItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 bg-white px-3 py-2 text-sm transition-all hover:border-primary/30"
              >
                <span className="flex items-center gap-2 font-bold text-navy">
                  <CheckCircle2 size={16} className={item.done ? "text-success" : "text-gray-300"} />
                  {item.label}
                </span>
                <span className="text-xs font-bold text-primary">{item.action}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="card xl:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold font-fraunces text-navy">Top Job Candidates</h2>
              <p className="mt-1 text-sm text-gray-600">Lowongan paling layak dicek dari match CV dan profile fit.</p>
            </div>
            <Link href="/dashboard/jobs" className="text-sm font-bold text-primary">Lihat Semua</Link>
          </div>

          {topJobs.length === 0 ? (
            <div className="mt-6 rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center">
              <PlusCircle size={32} className="mx-auto text-primary" />
              <h3 className="mt-3 font-fraunces text-lg font-bold text-navy">Belum ada lowongan</h3>
              <p className="mt-1 text-sm text-gray-600">Jalankan scraper atau tambah job manual dari halaman Jobs.</p>
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {topJobs.map((job) => (
                <Link
                  key={job.id}
                  href={`/dashboard/jobs/${job.id}`}
                  className="flex flex-col gap-4 rounded-lg border border-gray-100 bg-white p-4 transition-all hover:border-primary/40 md:flex-row md:items-center md:justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500">{job.source}</p>
                    <h3 className="mt-1 line-clamp-1 font-fraunces text-lg font-bold text-navy">{job.title}</h3>
                    <p className="mt-1 text-sm font-semibold text-primary">{job.company}</p>
                    <p className="mt-2 text-xs font-medium text-gray-500">
                      {[job.location, job.jobType].filter(Boolean).join(" - ") || "Detail kerja belum lengkap"}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-center md:w-40">
                    <div className="rounded-lg bg-success/5 px-3 py-2">
                      <p className="text-xs font-bold text-gray-500">Match</p>
                      <p className="font-black text-success">{job.matchScore ?? 0}%</p>
                    </div>
                    <div className="rounded-lg bg-primary/5 px-3 py-2">
                      <p className="text-xs font-bold text-gray-500">Fit</p>
                      <p className="font-black text-primary">{job.profileFitScore}%</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold font-fraunces text-navy">Follow-up Queue</h2>
              <p className="mt-1 text-sm text-gray-600">Lamaran yang perlu disentuh lagi.</p>
            </div>
            <CalendarClock size={22} className="text-warning" />
          </div>

          {followUps.length === 0 ? (
            <div className="mt-6 rounded-lg border border-dashed border-gray-300 bg-white p-6 text-center">
              <p className="text-sm font-semibold text-gray-600">Belum ada follow-up terjadwal.</p>
              <Link href="/dashboard/applications" className="mt-3 inline-flex text-sm font-bold text-primary">
                Atur di tracker
              </Link>
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {(followUps as FollowUpItem[]).map((item) => {
                const status = normalizeStatus(item.status);

                return (
                  <Link
                    key={item.id}
                    href={`/dashboard/applications/${item.id}`}
                    className="block rounded-lg border border-gray-100 bg-white p-3 transition-all hover:border-primary/40"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="line-clamp-1 text-sm font-bold text-navy">{item.job.title}</h3>
                        <p className="mt-1 text-xs font-semibold text-gray-500">{item.job.company}</p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2 py-1 text-xs font-bold ${getStatusTone(status)}`}>
                        {status}
                      </span>
                    </div>
                    <p className="mt-3 text-xs font-bold text-warning">
                      Follow-up: {formatDate(item.followUpAt)}
                    </p>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="card">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold font-fraunces text-navy">Pipeline Snapshot</h2>
            <p className="mt-1 text-sm text-gray-600">Ringkasan status lamaran Anda saat ini.</p>
          </div>
          <Link href="/dashboard/applications" className="text-sm font-bold text-primary">Buka Tracker</Link>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
          {APPLICATION_STATUSES.map((status) => (
            <div key={status} className="rounded-lg border border-gray-100 bg-white p-3 text-center">
              <p className="text-2xl font-black text-navy">{statusCounts.get(status) || 0}</p>
              <p className="mt-1 text-xs font-bold text-gray-500">{status}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
