import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { APPLICATION_STATUSES, getAppliedAtForStatus, isApplicationStatus } from "@/lib/application-status";
import { db } from "@/lib/db";
import { readJsonObject, readOptionalDate, readString } from "@/lib/request";
import { applications } from "@/lib/schema";

type RouteContext = {
  params: Promise<{
    applicationId: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { applicationId } = await context.params;
    const body = await readJsonObject(request);
    const existingApplication = await db.query.applications.findFirst({
      where: and(eq(applications.id, applicationId), eq(applications.userId, userId)),
    });

    if (!existingApplication) {
      return NextResponse.json({ error: "Application tidak ditemukan." }, { status: 404 });
    }

    const rawStatus = readString(body, "status") || existingApplication.status;

    if (!isApplicationStatus(rawStatus)) {
      return NextResponse.json({
        error: `Status tidak valid. Gunakan salah satu: ${APPLICATION_STATUSES.join(", ")}.`,
      }, { status: 400 });
    }

    const notes = readString(body, "notes");
    const contactName = readString(body, "contactName");
    const contactEmail = readString(body, "contactEmail");
    const followUpAt = Object.hasOwn(body, "followUpAt")
      ? readOptionalDate(body, "followUpAt")
      : existingApplication.followUpAt;
    const appliedAt = Object.hasOwn(body, "appliedAt")
      ? readOptionalDate(body, "appliedAt")
      : getAppliedAtForStatus(rawStatus, existingApplication.appliedAt);
    const now = new Date();

    const [application] = await db.update(applications)
      .set({
        status: rawStatus,
        notes: Object.hasOwn(body, "notes") ? notes || null : existingApplication.notes,
        contactName: Object.hasOwn(body, "contactName") ? contactName || null : existingApplication.contactName,
        contactEmail: Object.hasOwn(body, "contactEmail") ? contactEmail || null : existingApplication.contactEmail,
        followUpAt,
        appliedAt,
        lastStatusChangedAt: existingApplication.status === rawStatus
          ? existingApplication.lastStatusChangedAt
          : now,
        updatedAt: now,
      })
      .where(and(eq(applications.id, applicationId), eq(applications.userId, userId)))
      .returning();

    return NextResponse.json({ success: true, application });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Gagal memperbarui application.",
    }, { status: 400 });
  }
}
