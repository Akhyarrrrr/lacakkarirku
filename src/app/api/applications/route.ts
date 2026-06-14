import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { and, desc, eq } from "drizzle-orm";
import { APPLICATION_STATUSES, getAppliedAtForStatus, isApplicationStatus } from "@/lib/application-status";
import { db } from "@/lib/db";
import { readJsonObject, readOptionalDate, readString } from "@/lib/request";
import { applications, cvData, jobs, matches } from "@/lib/schema";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cv = await db.query.cvData.findFirst({
    where: eq(cvData.userId, userId),
  });

  const rows = await db.select({
    application: applications,
    job: jobs,
    matchScore: matches.matchScore,
  })
    .from(applications)
    .innerJoin(jobs, eq(applications.jobId, jobs.id))
    .leftJoin(matches, and(eq(matches.jobId, jobs.id), cv ? eq(matches.cvId, cv.id) : eq(matches.cvId, applications.cvId)))
    .where(eq(applications.userId, userId))
    .orderBy(desc(applications.updatedAt), desc(applications.createdAt));

  return NextResponse.json({
    applications: rows.map((row) => ({
      ...row.application,
      job: row.job,
      matchScore: row.matchScore,
    })),
  });
}

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await readJsonObject(request);
    const jobId = readString(body, "jobId");
    const rawStatus = readString(body, "status") || "Saved";

    if (!jobId) {
      return NextResponse.json({ error: "Job wajib dipilih." }, { status: 400 });
    }

    if (!isApplicationStatus(rawStatus)) {
      return NextResponse.json({
        error: `Status tidak valid. Gunakan salah satu: ${APPLICATION_STATUSES.join(", ")}.`,
      }, { status: 400 });
    }

    const job = await db.query.jobs.findFirst({
      where: eq(jobs.id, jobId),
    });

    if (!job) {
      return NextResponse.json({ error: "Lowongan tidak ditemukan." }, { status: 404 });
    }

    const cv = await db.query.cvData.findFirst({
      where: eq(cvData.userId, userId),
    });

    const existingApplication = await db.query.applications.findFirst({
      where: and(eq(applications.userId, userId), eq(applications.jobId, jobId)),
    });

    const followUpAt = readOptionalDate(body, "followUpAt");
    const notes = readString(body, "notes");
    const appliedAt = getAppliedAtForStatus(rawStatus, existingApplication?.appliedAt);
    const now = new Date();

    const values = {
      userId,
      jobId,
      cvId: cv?.id ?? null,
      status: rawStatus,
      notes: notes || existingApplication?.notes || null,
      followUpAt,
      appliedAt,
      lastStatusChangedAt: existingApplication?.status === rawStatus
        ? existingApplication.lastStatusChangedAt
        : now,
      updatedAt: now,
    };

    const [application] = await db.insert(applications).values({
      ...values,
      createdAt: now,
    }).onConflictDoUpdate({
      target: [applications.userId, applications.jobId],
      set: values,
    }).returning();

    return NextResponse.json({ success: true, application });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Gagal menyimpan application.",
    }, { status: 400 });
  }
}
