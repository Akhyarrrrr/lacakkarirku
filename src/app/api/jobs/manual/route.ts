import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { calculateMatch } from "@/lib/matcher";
import { cvData, jobs } from "@/lib/schema";
import { inferJobSource } from "@/lib/source";

function readString(body: Record<string, unknown>, key: string) {
  const value = body[key];

  return typeof value === "string" ? value.trim() : "";
}

function normalizeLink(link: string) {
  const url = new URL(link);

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("Link lowongan harus diawali http:// atau https://");
  }

  return url.toString();
}

async function readBody(request: Request) {
  const body: unknown = await request.json();

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return {};
  }

  return body as Record<string, unknown>;
}

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await readBody(request);
    const title = readString(body, "title");
    const company = readString(body, "company") || "Unknown Company";
    const link = normalizeLink(readString(body, "link"));
    const description = readString(body, "description");
    const requirements = readString(body, "requirements");
    const location = readString(body, "location") || "Tidak disebutkan";
    const jobType = readString(body, "jobType") || "Tidak disebutkan";
    const source = readString(body, "source") || inferJobSource(link);

    if (!title) {
      return NextResponse.json({ error: "Judul pekerjaan wajib diisi." }, { status: 400 });
    }

    if (!description && !requirements) {
      return NextResponse.json({
        error: "Isi deskripsi atau requirements agar AI matching bisa bekerja.",
      }, { status: 400 });
    }

    const [savedJob] = await db.insert(jobs).values({
      title,
      company,
      link,
      description,
      requirements,
      location,
      jobType,
      source,
      scrapedAt: new Date(),
    }).onConflictDoUpdate({
      target: [jobs.link, jobs.source],
      set: {
        title,
        company,
        description,
        requirements,
        location,
        jobType,
        updatedAt: new Date(),
      },
    }).returning({ id: jobs.id });

    const cv = await db.query.cvData.findFirst({
      where: eq(cvData.userId, userId),
    });

    const match = cv ? await calculateMatch(savedJob.id, cv.id) : null;

    return NextResponse.json({
      success: true,
      jobId: savedJob.id,
      source,
      matchScore: match?.matchScore ?? null,
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Gagal menyimpan lowongan manual.",
    }, { status: 400 });
  }
}
