import { scrapeArbeitnow } from "./arbeitnow";
import { scrapeGlints } from "./glints";
import { scrapeJobStreet } from "./jobstreet";
import { scrapeJobicy } from "./jobicy";
import { scrapeLinkedIn } from "./linkedin";
import { scrapeRemotive } from "./remotive";
import { scrapeRemoteOK } from "./remoteok";
import { scrapeUpwork } from "./upwork";
import type { ScrapeResult } from "./types";
import { scrapeWWR } from "./wwr";

type Scraper = {
  name: string;
  run: () => Promise<ScrapeResult>;
};

const scrapers: Scraper[] = [
  { name: "RemoteOK", run: scrapeRemoteOK },
  { name: "WeWorkRemotely", run: scrapeWWR },
  { name: "Glints", run: scrapeGlints },
  { name: "LinkedIn", run: scrapeLinkedIn },
  { name: "JobStreet", run: scrapeJobStreet },
  { name: "Upwork", run: scrapeUpwork },
  { name: "Remotive", run: scrapeRemotive },
  { name: "Arbeitnow", run: scrapeArbeitnow },
  { name: "Jobicy", run: scrapeJobicy },
];

export async function scrapeAllSources() {
  const settledResults = await Promise.allSettled(
    scrapers.map(async (scraper) => ({
      name: scraper.name,
      result: await scraper.run(),
    })),
  );

  return settledResults.map((settledResult, index): ScrapeResult => {
    const source = scrapers[index].name;

    if (settledResult.status === "rejected") {
      return {
        source,
        count: 0,
        newJobs: 0,
        error: settledResult.reason instanceof Error ? settledResult.reason.message : "Scraper failed",
      };
    }

    return settledResult.value.result;
  });
}

export function summarizeScrapeResults(results: ScrapeResult[]) {
  return {
    totalFound: results.reduce((sum, item) => sum + item.count, 0),
    totalSaved: results.reduce((sum, item) => sum + item.newJobs, 0),
    failedSources: results.filter((item) => item.error).map((item) => item.source),
  };
}
