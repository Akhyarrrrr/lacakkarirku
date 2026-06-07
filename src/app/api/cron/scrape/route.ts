import { NextResponse } from "next/server";
import { runBatchMatchForAllCVs } from "@/lib/matcher";
import { scrapeAllSources, summarizeScrapeResults } from "@/lib/scrapers";

export const dynamic = 'force-dynamic'; // prevent caching

export async function GET(request: Request) {
  // Optional: Add simple security check using a cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("[CRON] Starting daily job scraping...");
    
    const results = await scrapeAllSources();
    const summary = summarizeScrapeResults(results);
    await runBatchMatchForAllCVs();
    
    console.log("[CRON] Scraping completed:", summary);
    
    return NextResponse.json({ success: true, results, summary });
  } catch (error: unknown) {
    console.error("[CRON] Error during scraping:", error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Unknown cron scraping error",
    }, { status: 500 });
  }
}
