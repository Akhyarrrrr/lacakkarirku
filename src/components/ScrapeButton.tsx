'use client';

import { useState } from 'react';
import { Loader2, Play } from 'lucide-react';

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
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleScrape}
        disabled={loading}
        className="btn-primary flex min-h-11 items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} />}
        {loading ? 'Mencari lowongan...' : 'Jalankan Scraper'}
      </button>
      {loading && (
        <p role="status" aria-live="polite" className="text-sm font-semibold text-gray-600">
          Mengambil data lowongan dan menghitung match dengan CV Anda.
        </p>
      )}
    </div>
  );
}
