import axios from 'axios';
import * as cheerio from 'cheerio';
import { db } from '../db';
import { jobs } from '../schema';
import type { ScrapedJobInsert, ScrapeResult } from './types';

export async function scrapeJobStreet(): Promise<ScrapeResult> {
  const keywords = ['Frontend', 'Fullstack', 'React', 'Next.js', 'Node.js', 'Web Developer', 'Software Engineer'];
  const results: ScrapedJobInsert[] = [];
  const errors: string[] = [];
  
  for (const keyword of keywords) {
    const url = `https://www.jobstreet.co.id/id/${keyword.replace(/[^a-zA-Z0-9]/g, '-')}-jobs`;
    
    try {
      const { data } = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        },
        timeout: 10000
      });

      const $ = cheerio.load(data);
      
      // Jobstreet typically has articles for job listings
      $('article').each((i, el) => {
        const titleEl = $(el).find('h1, h2, h3').first();
        const title = titleEl.text().trim();
        const linkElem = titleEl.find('a').attr('href') || $(el).find('a').first().attr('href');
        const link = linkElem ? (linkElem.startsWith('http') ? linkElem : `https://www.jobstreet.co.id${linkElem}`) : '';
        const company = $(el).find('span[data-automation="jobCardCompanyLink"]').text().trim() || 'Unknown Company';
        const locationText = $(el).find('span[data-automation="jobCardLocation"]').text().trim();
        
        let jobType = 'On-site';
        const rawText = $(el).text().toLowerCase();
        if (rawText.includes('remote') || locationText.toLowerCase().includes('remote')) {
          jobType = 'Remote';
        } else if (rawText.includes('hybrid')) {
          jobType = 'Hybrid';
        }

        if (title && link) {
          results.push({
            title,
            company,
            link: link.split('?')[0],
            location: locationText || 'Indonesia',
            jobType,
            description: '',
            requirements: '',
            source: 'JobStreet',
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
    console.warn(`JobStreet scraper returned no jobs. First error: ${errors[0]}`);
  }

  return {
    source: 'JobStreet',
    count: uniqueResults.length,
    newJobs: newJobsCount,
    error: uniqueResults.length === 0 && errors.length > 0 ? errors[0] : undefined,
  };
}
