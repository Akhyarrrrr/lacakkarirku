import { db } from "@/lib/db";
import { jobs, cvData, matches } from "@/lib/schema";
import { asStringArray } from "@/lib/cv-types";
import { desc, eq } from "drizzle-orm";

export async function calculateMatch(jobId: string, cvId: string) {
  const job = await db.query.jobs.findFirst({ where: eq(jobs.id, jobId) });
  const cv = await db.query.cvData.findFirst({ where: eq(cvData.id, cvId) });

  if (!job || !cv) return null;

  const cvSkills = asStringArray(cv.skills).map((skill) => skill.toLowerCase());
  const cvKeywords = asStringArray(cv.keywords).map((keyword) => keyword.toLowerCase());
  const jobText = [
    job.title,
    job.company,
    job.description,
    job.requirements,
    job.location,
    job.jobType,
  ].filter(Boolean).join(" ").toLowerCase();

  const matchedSkills = cvSkills.filter((skill) => jobText.includes(skill));
  const matchedKeywords = cvKeywords.filter((keyword) => jobText.includes(keyword));

  const skillScore = cvSkills.length > 0 ? (matchedSkills.length / cvSkills.length) * 70 : 0;
  const keywordScore = cvKeywords.length > 0 ? (matchedKeywords.length / cvKeywords.length) * 20 : 0;
  const titleScore = cvSkills.some((skill) => job.title.toLowerCase().includes(skill)) ? 10 : 0;
  const finalScore = Math.min(Math.round(skillScore + keywordScore + titleScore), 100);

  const matchData = {
    jobId,
    cvId,
    matchScore: finalScore,
    skillsMatch: matchedSkills.length,
    keywordsMatch: matchedKeywords.length,
    breakdown: {
      matchedSkills,
      missingSkills: cvSkills.filter(s => !matchedSkills.includes(s)),
      matchedKeywords,
    },
  };

  await db.insert(matches).values(matchData).onConflictDoUpdate({
    target: [matches.jobId, matches.cvId],
    set: {
      matchScore: finalScore,
      skillsMatch: matchedSkills.length,
      keywordsMatch: matchedKeywords.length,
      breakdown: matchData.breakdown,
    }
  });

  return matchData;
}

export async function runBatchMatch(userId: string, limit = 100) {
  const cv = await db.query.cvData.findFirst({ where: eq(cvData.userId, userId) });
  if (!cv) return;

  const allJobs = await db.query.jobs.findMany({
    limit,
    orderBy: [desc(jobs.scrapedAt)],
  });

  for (const job of allJobs) {
    await calculateMatch(job.id, cv.id);
  }
}

export async function runBatchMatchForAllCVs(limit = 100) {
  const allCVs = await db.query.cvData.findMany();
  const allJobs = await db.query.jobs.findMany({
    limit,
    orderBy: [desc(jobs.scrapedAt)],
  });

  for (const cv of allCVs) {
    for (const job of allJobs) {
      await calculateMatch(job.id, cv.id);
    }
  }
}
