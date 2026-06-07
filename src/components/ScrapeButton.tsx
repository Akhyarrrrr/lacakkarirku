'use client';

import { useState } from 'react';
import { Play } from 'lucide-react';

type ScrapeResult = {
  source: string;
  count: number;
  newJobs: number;
  error?: string;
};

type ScrapeResponse = {
  data?: ScrapeResult[];
  error?: string;
};

export default function ScrapeButton() {
  const [loading, setLoading] = useState(false);

  const handleScrape = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/scrape', { method: 'POST' });
      const data = await res.json() as ScrapeResponse;

      if (!res.ok) {
        alert(data.error || 'Gagal melakukan scraping');
        return;
      }
      
      const results = data.data || [];
      const message = [
        'Scraping Selesai!',
        ...results.map((result) => {
          const status = result.error ? `gagal (${result.error})` : `${result.count} jobs, ${result.newJobs} tersimpan`;
          return `- ${result.source}: ${status}`;
        }),
      ].join('\n');
      
      alert(message);
      window.location.reload();
    } catch {
      alert('Gagal melakukan scraping');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleScrape}
      disabled={loading}
      className="btn-primary flex items-center gap-2"
    >
      <Play size={18} />
      {loading ? 'Scraping...' : 'Jalankan Scraper'}
    </button>
  );
}
