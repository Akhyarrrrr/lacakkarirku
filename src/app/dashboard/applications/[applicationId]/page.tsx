import ApplicationDetailForm from "@/components/ApplicationDetailForm";
import { type ApplicationStatus, isApplicationStatus } from "@/lib/application-status";
import { db } from "@/lib/db";
import { calculateProfileFit } from "@/lib/profile-fit";
import { applications, careerProfiles, cvData, jobs, matches } from "@/lib/schema";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { ArrowLeft, Briefcase, CalendarClock, ExternalLink, FileText, MapPin, Target } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

type ApplicationDetailPageProps = {
  params: Promise<{
    applicationId: string;
  }>;
};

function formatDate(date?: Date | null) {
  if (!date) return "Belum diisi";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function normalizeStatus(status: string): ApplicationStatus {
  return isApplicationStatus(status) ? status : "Saved";
}

export default async function ApplicationDetailPage({ params }: ApplicationDetailPageProps) {
  const { userId } = await auth();
  if (!userId) return null;

  const { applicationId } = await params;
  const application = await db.query.applications.findFirst({
    where: and(eq(applications.id, applicationId), eq(applications.userId, userId)),
  });

  if (!application) notFound();

  const [job, cv, careerProfile] = await Promise.all([
    db.query.jobs.findFirst({ where: eq(jobs.id, application.jobId) }),
    db.query.cvData.findFirst({ where: eq(cvData.userId, userId) }),
    db.query.careerProfiles.findFirst({ where: eq(careerProfiles.userId, userId) }),
  ]);

  if (!job) notFound();

  const match = cv
    ? await db.query.matches.findFirst({
      where: and(eq(matches.jobId, job.id), eq(matches.cvId, cv.id)),
    })
    : null;
  const profileFit = calculateProfileFit(careerProfile, job);

  return (
    <div className="space-y-6 md:space-y-8">
      <Link href="/dashboard/applications" className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 transition-all hover:text-primary">
        <ArrowLeft size={16} />
        Kembali ke Applications
      </Link>

      <section className="card p-4 md:p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <span className="rounded-full bg-primary/5 px-3 py-1 text-xs font-black uppercase tracking-wider text-primary">
              {application.status}
            </span>
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

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:flex lg:flex-col">
            <Link
              href={`/dashboard/jobs/${job.id}`}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm font-bold text-primary transition-all hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              Detail Job
              <FileText size={16} />
            </Link>
            <a
              href={job.link}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary inline-flex min-h-11 items-center justify-center gap-2"
            >
              Buka Lowongan
              <ExternalLink size={16} />
            </a>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <div className="card flex items-center gap-3 p-4 md:gap-4 md:p-6">
          <div className="rounded-lg bg-primary/10 p-3 text-primary">
            <Target size={22} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">CV Match</p>
            <p className="text-2xl font-bold text-navy">{match?.matchScore ?? 0}%</p>
          </div>
        </div>
        <div className="card flex items-center gap-3 p-4 md:gap-4 md:p-6">
          <div className="rounded-lg bg-success/10 p-3 text-success">
            <Target size={22} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Profile Fit</p>
            <p className="text-2xl font-bold text-navy">{careerProfile ? profileFit.score : 0}%</p>
          </div>
        </div>
        <div className="card flex items-center gap-3 p-4 md:gap-4 md:p-6">
          <div className="rounded-lg bg-warning/10 p-3 text-warning">
            <CalendarClock size={22} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Applied</p>
            <p className="text-base font-bold text-navy md:text-lg">{formatDate(application.appliedAt)}</p>
          </div>
        </div>
        <div className="card flex items-center gap-3 p-4 md:gap-4 md:p-6">
          <div className="rounded-lg bg-primary/10 p-3 text-primary">
            <CalendarClock size={22} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Follow-up</p>
            <p className="text-base font-bold text-navy md:text-lg">{formatDate(application.followUpAt)}</p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
        <div className="lg:col-span-2">
          <ApplicationDetailForm
            application={{
              id: application.id,
              status: normalizeStatus(application.status),
              notes: application.notes,
              contactName: application.contactName,
              contactEmail: application.contactEmail,
              appliedAt: application.appliedAt,
              followUpAt: application.followUpAt,
            }}
          />
        </div>

        <aside className="space-y-6">
          <section className="card p-4 md:p-6">
            <h2 className="text-xl font-bold font-fraunces text-navy">Kontak</h2>
            <div className="mt-4 space-y-3 text-sm text-gray-600">
              <p>
                <span className="font-bold text-navy">Nama:</span>{" "}
                {application.contactName || "Belum diisi"}
              </p>
              <p>
                <span className="font-bold text-navy">Email:</span>{" "}
                {application.contactEmail || "Belum diisi"}
              </p>
            </div>
          </section>

          <section className="card p-4 md:p-6">
            <h2 className="text-xl font-bold font-fraunces text-navy">Next Step</h2>
            <p className="mt-3 text-sm leading-6 text-gray-600">
              Gunakan notes untuk mencatat sumber apply, follow-up, insight interview, atau versi CV yang dipakai.
            </p>
            <Link
              href={`/dashboard/suggestions?jobId=${job.id}`}
              className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm font-bold text-primary transition-all hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              Buka AI Analysis
            </Link>
          </section>
        </aside>
      </div>
    </div>
  );
}
