import axios from "axios";
import { db } from "../db";
import { stripHtml } from "../html";
import { jobs } from "../schema";
import type { ScrapedJobInsert, ScrapeResult } from "./types";

type ArbeitnowJob = {
  slug: string;
  company_name: string;
  title: string;
  description?: string;
  remote?: boolean;
  url: string;
  tags?: string[];
  location?: string;
  job_types?: string[];
  created_at?: number;
};

type ArbeitnowResponse = {
  data?: ArbeitnowJob[];
};

export async function scrapeArbeitnow(): Promise<ScrapeResult> {
  try {
    const { data } = await axios.get<ArbeitnowResponse>("https://www.arbeitnow.com/api/job-board-api", {
      timeout: 10000,
    });

    const keywords = ["frontend", "front end", "react", "next", "node", "web", "full stack", "fullstack"];
    const results: ScrapedJobInsert[] = (data.data || [])
      .filter((item) => keywords.some((keyword) => `${item.title} ${item.description}`.toLowerCase().includes(keyword)))
      .slice(0, 40)
      .map((item) => ({
        title: item.title,
        company: item.company_name,
        link: item.url,
        location: item.location || (item.remote ? "Remote" : "Tidak disebutkan"),
        jobType: item.remote ? "Remote" : (item.job_types || []).join(", ") || "Tidak disebutkan",
        description: stripHtml(item.description || "").slice(0, 4000),
        requirements: (item.tags || []).join(", "),
        source: "Arbeitnow",
        postedAt: item.created_at ? new Date(item.created_at * 1000) : undefined,
        scrapedAt: new Date(),
      }));

    let newJobsCount = 0;

    for (const job of results) {
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

    return { source: "Arbeitnow", count: results.length, newJobs: newJobsCount };
  } catch (error) {
    return {
      source: "Arbeitnow",
      count: 0,
      newJobs: 0,
      error: error instanceof Error ? error.message : "Unknown Arbeitnow error",
    };
  }
}
