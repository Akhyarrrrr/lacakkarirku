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
    <div className="card max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold font-fraunces text-navy mb-6">Unggah CV (PDF)</h2>
      
      {!success ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-10 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-all cursor-pointer relative">
            <input 
              type="file" 
              accept=".pdf" 
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <Upload size={48} className="text-primary mb-4" />
            <p className="font-bold text-navy">
              {file ? file.name : 'Klik atau seret file PDF ke sini'}
            </p>
            <p className="text-sm text-gray-500 mt-2">Format PDF maksimal 5MB</p>
          </div>

          <button 
            type="submit" 
            disabled={!file || loading}
            className="w-full btn-primary py-4 flex items-center justify-center gap-2"
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
        <div className="flex flex-col items-center justify-center py-10 space-y-4">
          <div className="w-16 h-16 bg-success/10 text-success rounded-full flex items-center justify-center">
            <CheckCircle size={32} />
          </div>
          <div className="text-center">
            <p className="text-xl font-bold font-fraunces text-navy">CV Berhasil Dianalisis!</p>
            <p className="text-gray-500 mt-1">Mengalihkan ke dashboard...</p>
          </div>
        </div>
      )}
    </div>
  );
}
