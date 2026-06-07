import axios from 'axios';
import * as cheerio from 'cheerio';
import { db } from '../db';
import { jobs } from '../schema';
import type { ScrapedJobInsert, ScrapeResult } from './types';

export async function scrapeUpwork(): Promise<ScrapeResult> {
  const keywords = ['Frontend', 'Fullstack', 'React', 'Next.js', 'Node.js', 'Web Developer', 'Software Engineer'];
  const results: ScrapedJobInsert[] = [];
  const errors: string[] = [];
  
  for (const keyword of keywords) {
    const url = `https://www.upwork.com/ab/feed/jobs/rss?q=${encodeURIComponent(keyword)}&sort=recency`;
    
    try {
      const { data } = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
          'Accept': 'application/rss+xml, application/xml, text/xml',
        },
        timeout: 10000
      });

      const $ = cheerio.load(data, { xmlMode: true });
      
      $('item').each((i, el) => {
        const title = $(el).find('title').text().trim();
        const link = $(el).find('link').text().trim();
        const description = $(el).find('description').text().trim();
        
        if (title && link) {
          results.push({
            title: title.replace(/ - Upwork$/, ''),
            company: 'Upwork Client',
            link: link.split('?')[0],
            location: 'Remote',
            jobType: 'Remote',
            description: description.substring(0, 500), // truncate if too long
            requirements: '',
            source: 'Upwork',
            scrapedAt: new Date(),
          });
        }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`${keyword}: ${message}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  let newJobsCount = 0;
  const uniqueResults = Array.from(new Map(results.map(item => [item.link, item])).values());

  for (const job of uniqueResults) {
    try {
      await db.insert(jobs).values(job).onConflictDoUpdate({
        target: [jobs.link, jobs.source],
        set: {
          description: job.description,
          updatedAt: new Date()
        }
      });
      newJobsCount++;
    } catch {
      // Ignore duplicate or transient insert failures per job.
    }
  }

  if (uniqueResults.length === 0 && errors.length > 0) {
    console.warn(`Upwork scraper returned no jobs. First error: ${errors[0]}`);
  }

  return {
    source: 'Upwork',
    count: uniqueResults.length,
    newJobs: newJobsCount,
    error: uniqueResults.length === 0 && errors.length > 0 ? errors[0] : undefined,
  };
}
