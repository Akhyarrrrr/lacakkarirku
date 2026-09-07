import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth-session';
import { scrapeAllSources, summarizeScrapeResults } from '@/lib/scrapers';
import { runBatchMatch } from '@/lib/matcher';

async function runManualScrape() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('Starting job scrape...');
  
  const results = await scrapeAllSources();
  const summary = summarizeScrapeResults(results);

  await runBatchMatch(userId);

  return NextResponse.json({
    success: true,
    data: results,
    summary,
    timestamp: new Date().toISOString()
  });
}

export async function GET() {
  return runManualScrape();
}

export async function POST() {
  return runManualScrape();
}
