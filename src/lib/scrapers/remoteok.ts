import axios from 'axios';
import { db } from '../db';
import { jobs } from '../schema';
import type { ScrapedJobInsert, ScrapeResult } from './types';

type RemoteOKJobItem = {
  position?: string;
  company?: string;
  url?: string;
  description?: string;
  location?: string;
};

export async function scrapeRemoteOK(): Promise<ScrapeResult> {
  const url = 'https://remoteok.com/api';
  const keywords = ['Fullstack', 'Mobile Developer', 'React', 'Flutter', 'Next.js', 'Node.js', 'Android', 'iOS', 'Web Developer', 'Full Stack'];
  
  try {
    const { data } = await axios.get<unknown>(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
      }
    });

    if (!Array.isArray(data)) return { source: 'RemoteOK', count: 0, newJobs: 0, error: 'Invalid API response' };
    
    const jobItems = data.slice(1) as RemoteOKJobItem[]; 
    const results: ScrapedJobInsert[] = [];

    for (const item of jobItems) {
      const title = item.position;
      const company = item.company;
      const link = item.url;
      const description = item.description;
      
      if (title && company && link) {
        const lowerTitle = title.toLowerCase();
        const isRelevant = keywords.some(k => lowerTitle.includes(k.toLowerCase()));
        
        if (isRelevant) {
          results.push({
            title,
            company,
            link,
            description: description?.replace(/<[^>]*>?/gm, ''), // Strip HTML tags
            location: item.location || 'Remote',
            jobType: 'Remote',
            source: 'RemoteOK',
            scrapedAt: new Date(),
          });
        }
      }
      
      if (results.length >= 20) break; // Limit to 20 relevant results
    }

    let newJobsCount = 0;
    for (const job of results) {
      try {
        await db.insert(jobs).values(job).onConflictDoUpdate({
          target: [jobs.link, jobs.source],
          set: {
            description: job.description,
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

    return { source: 'RemoteOK', count: results.length, newJobs: newJobsCount };
  } catch (error) {
    console.error('Error scraping RemoteOK:', error);
    return {
      source: 'RemoteOK',
      count: 0,
      newJobs: 0,
      error: error instanceof Error ? error.message : 'Unknown RemoteOK error',
    };
  }
}
