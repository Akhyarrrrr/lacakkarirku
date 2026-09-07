'use client';

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return <main className="grid min-h-screen place-items-center bg-cream p-6 text-navy"><div className="card max-w-lg text-center"><h1 className="text-2xl font-bold">Halaman gagal dimuat</h1><p className="mt-2 text-gray-600">Coba lagi. Data yang sudah tersimpan tidak berubah.</p><button className="btn-primary mt-5" onClick={reset}>Coba lagi</button></div></main>;
}
