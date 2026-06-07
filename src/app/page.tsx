import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { Briefcase, FileSearch, Sparkles } from "lucide-react";
import Link from "next/link";

export default async function LandingPage() {
  const { userId } = await auth();

  return (
    <div className="flex flex-col min-h-screen bg-navy text-cream">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-8 max-w-7xl mx-auto w-full">
        <div className="text-2xl font-bold font-fraunces text-primary">LacakKarirku</div>
        <div className="flex gap-4 items-center">
          {userId ? (
            <Link href="/dashboard" className="btn-primary">Ke Dashboard</Link>
          ) : (
            <>
              <SignInButton mode="modal">
                <button className="text-cream hover:text-primary transition-colors font-semibold">Masuk</button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="btn-primary">Daftar Sekarang</button>
              </SignUpButton>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center text-center px-6 py-20 max-w-4xl mx-auto">
        <h1 className="text-5xl md:text-7xl font-bold font-fraunces mb-6 leading-tight">
          Lacak. Analisis. Lamar.
        </h1>
        <p className="text-xl md:text-2xl text-gray-500 mb-10 leading-relaxed">
          Kirim 200+ lamaran tapi belum ada panggilan? Optimalkan CV Anda dengan AI dan pantau setiap langkah karir impian Anda.
        </p>
        <div className="flex flex-col md:flex-row gap-4">
          {userId ? (
            <Link href="/dashboard" className="btn-primary text-lg px-10 py-4">Mulai Sekarang</Link>
          ) : (
            <>
              <SignUpButton mode="modal">
                <button className="btn-primary text-lg px-10 py-4">Mulai Gratis</button>
              </SignUpButton>
              <button className="px-10 py-4 border-2 border-primary text-primary rounded-lg font-bold hover:bg-primary/10 transition-all">
                Lihat Demo
              </button>
            </>
          )}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24 w-full border-t border-gray-700/50 pt-12">
          <div className="flex flex-col items-center">
            <span className="text-4xl font-bold text-primary mb-2">500+</span>
            <span className="text-gray-500 uppercase tracking-wider text-sm">Lowongan Terlacak</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-4xl font-bold text-primary mb-2">AI-Powered</span>
            <span className="text-gray-500 uppercase tracking-wider text-sm">Matching System</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-4xl font-bold text-primary mb-2">Gratis</span>
            <span className="text-gray-500 uppercase tracking-wider text-sm">Selamanya</span>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-cream py-24 px-6 text-navy">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold font-fraunces text-center mb-16">Fitur Unggulan</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="card group">
              <div className="w-14 h-14 bg-primary/10 rounded-lg flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-cream transition-colors">
                <Briefcase size={28} className="text-primary group-hover:text-cream" />
              </div>
              <h3 className="text-2xl font-bold font-fraunces mb-4">Job Scraper</h3>
              <p className="text-gray-600 leading-relaxed">
                Kumpulkan informasi lowongan dari berbagai platform secara otomatis tanpa perlu menyalin manual satu per satu.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="card group">
              <div className="w-14 h-14 bg-primary/10 rounded-lg flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-cream transition-colors">
                <FileSearch size={28} className="text-primary group-hover:text-cream" />
              </div>
              <h3 className="text-2xl font-bold font-fraunces mb-4">CV Analyzer</h3>
              <p className="text-gray-600 leading-relaxed">
                Analisis CV Anda terhadap deskripsi pekerjaan. Dapatkan skor kecocokan dan saran perbaikan instan berbasis AI.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="card group">
              <div className="w-14 h-14 bg-primary/10 rounded-lg flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-cream transition-colors">
                <Sparkles size={28} className="text-primary group-hover:text-cream" />
              </div>
              <h3 className="text-2xl font-bold font-fraunces mb-4">Smart Suggestions</h3>
              <p className="text-gray-600 leading-relaxed">
                Rekomendasi kata kunci dan pengalaman yang perlu ditonjolkan agar CV Anda lolos sistem ATS perusahaan.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-gray-700/50 text-center text-gray-500">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="font-fraunces text-xl font-bold text-primary">LacakKarirku</div>
          <p>(c) 2026 LacakKarirku. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-primary transition-colors">Privasi</Link>
            <Link href="#" className="hover:text-primary transition-colors">Syarat & Ketentuan</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
