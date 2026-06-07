import axios from "axios";
import { db } from "../db";
import { stripHtml } from "../html";
import { jobs } from "../schema";
import type { ScrapedJobInsert, ScrapeResult } from "./types";

type JobicyJob = {
  id: number;
  url: string;
  jobTitle: string;
  companyName: string;
  jobIndustry?: string[];
  jobType?: string[];
  jobGeo?: string;
  jobExcerpt?: string;
  jobDescription?: string;
  pubDate?: string;
};

type JobicyResponse = {
  jobs?: JobicyJob[];
};

export async function scrapeJobicy(): Promise<ScrapeResult> {
  const tags = ["react", "javascript", "frontend", "nodejs"];
  const results: ScrapedJobInsert[] = [];

  for (const tag of tags) {
    try {
      const { data } = await axios.get<JobicyResponse>(
        `https://jobicy.com/api/v2/remote-jobs?tag=${encodeURIComponent(tag)}&count=20`,
        { timeout: 10000 },
      );

      for (const item of data.jobs || []) {
        if (!item.jobTitle || !item.companyName || !item.url) continue;

        results.push({
          title: item.jobTitle,
          company: item.companyName,
          link: item.url,
          location: item.jobGeo || "Remote",
          jobType: (item.jobType || []).join(", ") || "Remote",
          description: stripHtml(item.jobDescription || item.jobExcerpt || "").slice(0, 4000),
          requirements: (item.jobIndustry || []).join(", "),
          source: "Jobicy",
          postedAt: item.pubDate ? new Date(item.pubDate) : undefined,
          scrapedAt: new Date(),
        });
      }
    } catch (error) {
      console.error(`Error scraping Jobicy for ${tag}:`, error);
    }
  }

  const uniqueResults = Array.from(new Map(results.map((item) => [item.link, item])).values()).slice(0, 40);
  let newJobsCount = 0;

  for (const job of uniqueResults) {
    try {
      await db.insert(jobs).values(job).onConflictDoUpdate({
        target: [jobs.link, jobs.source],
        set: {
          description: job.description,
          requirements: job.requirements,
          location: job.location,
          jobType: job.jobType,
          updatedAt: new Date(),
        },
      });
      newJobsCount += 1;
    } catch {
      // Ignore duplicate or transient insert failures per job.
    }
  }

  return { source: "Jobicy", count: uniqueResults.length, newJobs: newJobsCount };
}
