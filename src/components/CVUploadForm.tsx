'use client';

import { useState } from 'react';
import { Upload, CheckCircle, Loader2 } from 'lucide-react';

type UploadErrorResponse = {
  error?: string;
  details?: string;
};

export default function CVUploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const processingSteps = [
    "Membaca isi PDF",
    "Mengambil skill dan pengalaman",
    "Menyiapkan rekomendasi job match",
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/cv/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => window.location.reload(), 2000);
      } else {
        const errorData = await res.json() as UploadErrorResponse;
        const details = errorData.details ? `\n\nDetail: ${errorData.details}` : "";
        alert(`Gagal: ${errorData.error || 'Terjadi kesalahan saat mengunggah CV'}${details}`);
      }
    } catch {
      alert('Terjadi kesalahan koneksi saat mengunggah');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card mx-auto max-w-2xl p-4 md:p-6">
      <h2 className="mb-5 text-2xl font-bold font-fraunces text-navy md:mb-6">Unggah CV (PDF)</h2>
      
      {!success ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <label className="relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-6 text-center transition-all hover:bg-gray-100 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 md:p-10">
            <input 
              type="file" 
              accept=".pdf" 
              onChange={handleFileChange}
              className="absolute inset-0 cursor-pointer opacity-0"
            />
            <Upload size={44} className="mb-4 text-primary md:h-12 md:w-12" />
            <p className="max-w-full truncate font-bold text-navy">
              {file ? file.name : 'Klik atau seret file PDF ke sini'}
            </p>
            <p className="text-sm text-gray-500 mt-2">Format PDF maksimal 5MB</p>
          </label>

          {loading && (
            <div
              role="status"
              aria-live="polite"
              className="rounded-xl border border-primary/20 bg-primary/5 p-4"
            >
              <div className="flex items-center gap-3">
                <Loader2 size={20} className="shrink-0 animate-spin text-primary" />
                <div>
                  <p className="font-bold text-navy">AI sedang menganalisis CV Anda</p>
                  <p className="text-sm text-gray-600">Mohon tunggu sebentar, halaman akan diperbarui otomatis.</p>
                </div>
              </div>
              <div className="mt-4 grid gap-2 md:grid-cols-3">
                {processingSteps.map((step) => (
                  <div key={step} className="rounded-lg bg-cream px-3 py-2 text-xs font-bold text-gray-600">
                    {step}
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            type="submit" 
            disabled={!file || loading}
            className="btn-primary flex min-h-12 w-full items-center justify-center gap-2 py-4 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Sedang Memproses AI...
              </>
            ) : (
              <>
                <CheckCircle size={20} />
                Analisis CV Saya
              </>
            )}
          </button>
        </form>
      ) : (
        <div className="flex flex-col items-center justify-center space-y-4 py-8 md:py-10">
          <div className="w-16 h-16 bg-success/10 text-success rounded-full flex items-center justify-center">
            <CheckCircle size={32} />
          </div>
          <div className="text-center" role="status" aria-live="polite">
            <p className="text-xl font-bold font-fraunces text-navy">CV Berhasil Dianalisis!</p>
            <p className="text-gray-500 mt-1">Mengalihkan ke dashboard...</p>
          </div>
        </div>
      )}
    </div>
  );
}
