import axios from 'axios';
import { db } from '../db';
import { jobs } from '../schema';
import type { ScrapedJobInsert, ScrapeResult } from './types';

type GlintsJobItem = {
  id?: string | number;
  title?: string;
  company?: {
    name?: string;
  };
  description?: string;
  isRemote?: boolean;
  workFromHome?: boolean;
  location?: string;
  specifications?: string | string[];
};

type GlintsResponse = {
  data?: GlintsJobItem[];
  jobOpportunities?: GlintsJobItem[];
};

export async function scrapeGlints(): Promise<ScrapeResult> {
  const keywords = ['Frontend', 'Fullstack', 'React', 'Next.js', 'Node.js', 'Express', 'Tailwind', 'Web Developer'];
  const results: ScrapedJobInsert[] = [];
  const errors: string[] = [];
  const glintsCookie = process.env.GLINTS_COOKIE;
  const headers = {
    'Accept': 'application/json, text/plain, */*',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Referer': 'https://glints.com/id/opportunities/jobs/explore?country=ID&locationName=All%20Cities%2FProvinces',
    'Origin': 'https://glints.com',
    ...(glintsCookie ? { Cookie: glintsCookie } : {}),
  };
  
  for (const keyword of keywords) {
    const url = `https://glints.com/api/search/jobs?countries=ID&q=${encodeURIComponent(keyword)}&limit=10`;
    
    try {
      const { data } = await axios.get<GlintsResponse>(url, {
        headers,
        timeout: 10000
      });

      const jobItems = Array.isArray(data.data)
        ? data.data
        : Array.isArray(data.jobOpportunities)
          ? data.jobOpportunities
          : [];

      for (const item of jobItems) {
        const title = item.title;
        const company = item.company?.name;
        const id = item.id?.toString();
        const link = `https://glints.com/id/en/opportunities/jobs/${id}`;
        
        const description = item.description || "";
        const isRemote = item.isRemote || item.workFromHome;
        const location = isRemote ? 'Remote' : (item.location || 'On-site');
        const requirements = Array.isArray(item.specifications)
          ? item.specifications.join("\n")
          : item.specifications || "";
        
        if (title && company && id) {
          // Filter to make sure it's relevant (avoiding general jobs if the API returned them)
          const lowerTitle = title.toLowerCase();
          const isRelevant = keywords.some(k => lowerTitle.includes(k.toLowerCase())) || 
                            lowerTitle.includes('full stack') || 
                            lowerTitle.includes('web developer');
          
          if (isRelevant) {
            results.push({
              title,
              company,
              link,
              location: location,
              jobType: isRemote ? 'Remote' : 'On-site',
              description: description,
              requirements,
              source: 'Glints',
              scrapedAt: new Date(),
            });
          }
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`${keyword}: ${message}`);
    }
    
    // Minimal delay between keywords to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  let newJobsCount = 0;
  // Deduplicate results by link
  const uniqueResults = Array.from(new Map(results.map(item => [item.link, item])).values());

  for (const job of uniqueResults) {
    try {
      await db.insert(jobs).values(job).onConflictDoUpdate({
        target: [jobs.link, jobs.source],
        set: {
          description: job.description,
          requirements: job.requirements,
          location: job.location,
          jobType: job.jobType,
          updatedAt: new Date()
        }
      });
      newJobsCount++;
    } catch {
      // Ignore duplicate or transient insert failures per job.
    }
  }

  if (uniqueResults.length === 0 && errors.length > 0) {
    const hint = glintsCookie
      ? "GLINTS_COOKIE sudah dipakai, tapi request masih gagal."
      : "Glints memblokir request server. Set GLINTS_COOKIE dari browser session jika ingin mencoba scraper Glints.";
    console.warn(`Glints scraper returned no jobs. First error: ${errors[0]}. ${hint}`);
  }

  return {
    source: 'Glints',
    count: uniqueResults.length,
    newJobs: newJobsCount,
    error: uniqueResults.length === 0 && errors.length > 0
      ? `${errors[0]}${glintsCookie ? "" : " (server diblokir Glints; opsional set GLINTS_COOKIE)"}`
      : undefined,
  };
}

