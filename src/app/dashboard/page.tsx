import ScrapeButton from "@/components/ScrapeButton";
import { db } from "@/lib/db";
import { cvData, jobs, matches } from "@/lib/schema";
import { currentUser } from "@clerk/nextjs/server";
import { count, desc, gt } from "drizzle-orm";
import { Briefcase, FileCheck, History, PlusCircle, Target } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const user = await currentUser();

  const [jobCount] = await db.select({ value: count() }).from(jobs);
  const [cvCount] = await db.select({ value: count() }).from(cvData);
  const [highMatchCount] = await db.select({ value: count() }).from(matches).where(gt(matches.matchScore, 80));

  const lastScrapedJob = await db.query.jobs.findFirst({
    orderBy: [desc(jobs.scrapedAt)],
  });

  const latestJobs = await db.query.jobs.findMany({
    limit: 5,
    orderBy: [desc(jobs.scrapedAt)],
  });

  const stats = [
    { label: "Total Jobs", value: jobCount.value.toString(), icon: Briefcase, color: "text-primary" },
    { label: "High Match (>80%)", value: highMatchCount.value.toString(), icon: Target, color: "text-success" },
    { label: "CV Uploaded", value: cvCount.value > 0 ? "Yes" : "No", icon: FileCheck, color: "text-warning" },
    {
      label: "Last Scraped",
      value: lastScrapedJob ? new Date(lastScrapedJob.scrapedAt!).toLocaleDateString() : "Never",
      icon: History,
      color: "text-gray-600",
    },
  ];

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-bold font-fraunces text-navy">
            Halo, {user?.firstName || "Pejuang Karir"}!
          </h1>
          <p className="text-gray-600 mt-2">
            Ayo mulai optimalkan lamaran kerja Anda hari ini.
          </p>
        </div>
        <ScrapeButton />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="card flex items-center gap-4">
            <div className={`p-3 rounded-lg bg-gray-100 ${stat.color}`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
              <p className="text-2xl font-bold text-navy">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {jobCount.value === 0 ? (
          <div className="card flex flex-col items-center justify-center text-center py-12 space-y-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary">
              <PlusCircle size={32} />
            </div>
            <div>
              <h3 className="text-xl font-bold font-fraunces">Belum Ada Lowongan</h3>
              <p className="text-gray-500 mt-2 max-w-xs">
                Gunakan Job Scraper untuk mulai melacak lowongan dari platform favorit Anda.
              </p>
            </div>
            <ScrapeButton />
          </div>
        ) : (
          <div className="card space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold font-fraunces text-navy">Lowongan Terbaru</h3>
              <Link href="/dashboard/jobs" className="text-primary font-semibold text-sm">Lihat Semua</Link>
            </div>
            <div className="space-y-4">
              {latestJobs.map((job) => (
                <div key={job.id} className="flex justify-between items-center border-b border-gray-100 pb-3 last:border-0">
                  <div>
                    <p className="font-bold text-navy line-clamp-1">{job.title}</p>
                    <p className="text-xs text-gray-500">{job.company} - {job.source}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold bg-gray-100 px-2 py-1 rounded text-gray-600">
                      {job.jobType || "Remote"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="card flex flex-col items-center justify-center text-center py-12 space-y-6">
          <div className="w-16 h-16 bg-warning/10 rounded-full flex items-center justify-center text-warning">
            <FileCheck size={32} />
          </div>
          <div>
            <h3 className="text-xl font-bold font-fraunces">
              {cvCount.value > 0 ? "CV Sudah Terunggah" : "Unggah CV Anda"}
            </h3>
            <p className="text-gray-500 mt-2 max-w-xs">
              {cvCount.value > 0
                ? "Dapatkan skor kecocokan otomatis untuk setiap lowongan yang baru discrape."
                : "Dapatkan analisis mendalam dan skor kecocokan otomatis untuk setiap lowongan."}
            </p>
          </div>
          <Link
            href="/dashboard/cv"
            className="px-6 py-3 border-2 border-warning text-warning rounded-lg font-bold hover:bg-warning/5 transition-all text-center"
          >
            {cvCount.value > 0 ? "Update CV" : "Upload CV Sekarang"}
          </Link>
        </div>
      </div>
    </div>
  );
}
