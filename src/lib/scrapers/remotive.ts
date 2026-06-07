import axios from "axios";
import { db } from "../db";
import { stripHtml } from "../html";
import { jobs } from "../schema";
import type { ScrapedJobInsert, ScrapeResult } from "./types";

type RemotiveJob = {
  id: number;
  url: string;
  title: string;
  company_name: string;
  tags?: string[];
  job_type?: string;
  candidate_required_location?: string;
  description?: string;
  publication_date?: string;
};

type RemotiveResponse = {
  jobs?: RemotiveJob[];
};

export async function scrapeRemotive(): Promise<ScrapeResult> {
  const keywords = ["react", "frontend", "next.js", "node.js", "fullstack"];
  const results: ScrapedJobInsert[] = [];

  for (const keyword of keywords) {
    try {
      const { data } = await axios.get<RemotiveResponse>(
        `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(keyword)}`,
        { timeout: 10000 },
      );

      for (const item of data.jobs || []) {
        if (!item.title || !item.company_name || !item.url) continue;

        results.push({
          title: item.title,
          company: item.company_name,
          link: item.url,
          location: item.candidate_required_location || "Remote",
          jobType: item.job_type || "Remote",
          description: stripHtml(item.description || "").slice(0, 4000),
          requirements: (item.tags || []).join(", "),
          source: "Remotive",
          postedAt: item.publication_date ? new Date(item.publication_date) : undefined,
          scrapedAt: new Date(),
        });
      }
    } catch (error) {
      console.error(`Error scraping Remotive for ${keyword}:`, error);
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

  return { source: "Remotive", count: uniqueResults.length, newJobs: newJobsCount };
}
