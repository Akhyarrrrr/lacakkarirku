import axios from 'axios';
import * as cheerio from 'cheerio';
import { db } from '../db';
import { jobs } from '../schema';
import type { ScrapedJobInsert, ScrapeResult } from './types';

type WWRJobCandidate = {
  title: string;
  company: string;
  link: string;
  location: string;
  jobType: string;
};

export async function scrapeWWR(): Promise<ScrapeResult> {
  const categories = [
    'remote-full-stack-programming-jobs',
    'remote-front-end-programming-jobs',
    'remote-back-end-programming-jobs',
    'remote-mobile-app-development-jobs'
  ];
  
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
  };

  const results: ScrapedJobInsert[] = [];
  const processedLinks = new Set();

  for (const category of categories) {
    const url = `https://weworkremotely.com/categories/${category}`;
    
    try {
      const { data } = await axios.get(url, { headers });
      const $ = cheerio.load(data);
      const jobElements = $('.jobs article ul li').not('.view-all');
      
      const categoryJobs: WWRJobCandidate[] = [];
      
      for (const el of jobElements) {
        const linkTag = $(el).find('a.listing-link--unlocked').first();
        const relativeLink = linkTag.attr('href');
        if (!relativeLink || processedLinks.has(relativeLink)) continue;
        
        processedLinks.add(relativeLink);
        const link = relativeLink.startsWith('http') ? relativeLink : `https://weworkremotely.com${relativeLink}`;
        const company = $(el).find('.new-listing__company-name').first().text().trim();
        const title = $(el).find('.new-listing__header__title__text').first().text().trim();
        const region = $(el).find('.new-listing__categories__category').last().text().trim();

        if (!title || !company) continue;
        
        categoryJobs.push({ title, company, link, location: region || 'Remote', jobType: 'Remote' });
      }

      // Process only 3-5 per category to avoid rate limits
      for (const job of categoryJobs.slice(0, 5)) {
        let description = "";

        try {
          await new Promise(resolve => setTimeout(resolve, 1000));
          const { data: detailHtml } = await axios.get(job.link, { headers });
          const $detail = cheerio.load(detailHtml);
          
          description = $detail('.lis-container__job__content').text().trim() ||
                             $detail('.job-container').text().trim() ||
                             $detail('#job-listing-show-container').text().trim() ||
                             $detail('.listing-container').text().trim();
        } catch {
          // WWR often blocks detail pages; keep the listing record anyway.
        }

        results.push({
          ...job,
          description,
          requirements: description.slice(0, 1000),
          source: 'WeWorkRemotely',
          scrapedAt: new Date(),
        });
      }
    } catch (error) {
      console.error(`Error scraping WWR category ${category}:`, error);
    }
  }

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
          updatedAt: new Date()
        }
      });
      newJobsCount++;
    } catch {
      // Ignore duplicate or transient insert failures per job.
    }
  }

  return { source: 'WeWorkRemotely', count: results.length, newJobs: newJobsCount };
}
