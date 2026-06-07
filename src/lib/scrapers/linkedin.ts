import axios from 'axios';
import * as cheerio from 'cheerio';
import { db } from '../db';
import { jobs } from '../schema';
import type { ScrapedJobInsert, ScrapeResult } from './types';

export async function scrapeLinkedIn(): Promise<ScrapeResult> {
  // Kata kunci disesuaikan dengan profil user: Frontend-focused Full-Stack Web Developer
  const keywords = ['Frontend', 'Fullstack', 'React', 'Next.js', 'Node.js', 'Web Developer', 'Software Engineer'];
  const results: ScrapedJobInsert[] = [];
  
  for (const keyword of keywords) {
    const url = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(keyword)}&location=Indonesia`;
    
    try {
      const { data } = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        },
        timeout: 10000
      });

      const $ = cheerio.load(data);
      
      $('.jobs-search__results-list li').each((i, el) => {
        const title = $(el).find('h3.base-search-card__title').text().trim();
        const company = $(el).find('h4.base-search-card__subtitle').text().trim();
        const locationText = $(el).find('span.job-search-card__location').text().trim();
        const link = $(el).find('a.base-card__full-link').attr('href');
        
        let jobType = 'On-site';
        if (title.toLowerCase().includes('remote') || locationText.toLowerCase().includes('remote')) {
          jobType = 'Remote';
        } else if (title.toLowerCase().includes('hybrid') || locationText.toLowerCase().includes('hybrid')) {
          jobType = 'Hybrid';
        }

        if (title && company && link) {
          results.push({
            title,
            company,
            link: link.split('?')[0], // Remove tracking parameters
            location: locationText || 'Indonesia',
            jobType,
            description: '', // LinkedIn basic search doesn't show full description easily
            requirements: '',
            source: 'LinkedIn',
            scrapedAt: new Date(),
          });
        }
      });
    } catch (error) {
      console.error(`Error scraping LinkedIn for ${keyword}:`, error);
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000)); // Delay to prevent rate limiting
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

  return { source: 'LinkedIn', count: uniqueResults.length, newJobs: newJobsCount };
}
