import { jobs } from "../schema";

export type ScrapedJobInsert = typeof jobs.$inferInsert;

export type ScrapeResult = {
  source: string;
  count: number;
  newJobs: number;
  error?: string;
};
