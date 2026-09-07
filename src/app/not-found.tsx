import Link from 'next/link';

export default function NotFound() {
  return <main className="grid min-h-screen place-items-center bg-cream p-6 text-navy"><div className="card max-w-lg text-center"><h1 className="text-2xl font-bold">Halaman tidak ditemukan</h1><Link className="btn-primary mt-5 inline-flex" href="/dashboard">Kembali ke dashboard</Link></div></main>;
}
