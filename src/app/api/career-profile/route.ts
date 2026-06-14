import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { careerProfiles } from "@/lib/schema";
import { readInteger, readJsonObject, readString, readStringArray } from "@/lib/request";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await db.query.careerProfiles.findFirst({
    where: eq(careerProfiles.userId, userId),
  });

  return NextResponse.json({ profile });
}

export async function PUT(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await readJsonObject(request);
    const salaryMin = readInteger(body, "salaryMin");
    const salaryMax = readInteger(body, "salaryMax");

    if (salaryMin !== null && salaryMax !== null && salaryMin > salaryMax) {
      return NextResponse.json({
        error: "Salary minimum tidak boleh lebih besar dari salary maksimum.",
      }, { status: 400 });
    }

    const values = {
      userId,
      targetRole: readString(body, "targetRole") || null,
      targetLevel: readString(body, "targetLevel") || null,
      preferredLocation: readString(body, "preferredLocation") || null,
      workModes: readStringArray(body, "workModes"),
      salaryMin,
      salaryMax,
      currency: readString(body, "currency") || "IDR",
      skills: readStringArray(body, "skills"),
      industries: readStringArray(body, "industries"),
      notes: readString(body, "notes") || null,
      updatedAt: new Date(),
    };

    const [profile] = await db.insert(careerProfiles).values({
      ...values,
      createdAt: new Date(),
    }).onConflictDoUpdate({
      target: careerProfiles.userId,
      set: values,
    }).returning();

    return NextResponse.json({ success: true, profile });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Gagal menyimpan career profile.",
    }, { status: 400 });
  }
}
